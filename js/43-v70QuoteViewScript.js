/* Beta — ดูใบเสนอราคา: the coordinator gets a place to read, send and track quotations.

   Three requests that are one screen and one missing step:

     3 + 5. "สร้างโมดุลดูใบเสนอราคาให้กับแอดมิน" / "เพิ่มหน้าดูใบเสนอราคาของแอดมิน"
     4.     "หน้าดูใบเสนอราคาของลูกค้า เวลาแอดมินสร้างใบเสนอราคาเสร็จ ใบเสนอราคาไม่อัพเดตไปยังลูกค้า"

   WHY 4 HAPPENS — measured against the live database, not guessed. Both quotations in
   `quotations` are status "ร่าง". saveQuotation() in js/03 stamps `status: old?.status||'ร่าง'`
   on every new quotation, and js/34 deliberately holds ร่าง back from the customer page so a
   half-finished calculation never reads as an offer. So the delivery mechanism was fine —
   the quotation reached the customer's device through cloudUpsertQuotation() and syncCloud()
   exactly as designed — and then sat there hidden, because nothing in the application ever
   moved it off ร่าง except a status popup gated behind `quotation.approve` and buried two
   clicks into a row. Nobody would find it, so nobody did.

   The fix is the missing step, not a change to the rule: an explicit ส่งให้ลูกค้า, offered at
   the moment the coordinator finishes the quotation and again on every draft row here.

   A SECOND BUG, FOUND WHILE READING THE LIVE ROWS. `quotations.warranty` is a text column,
   so the boolean is stored as the STRING "false" — and fromQuotationDb() reads it as
   `!!q.warranty`, which for "false" is **true**. Every quotation that came back from the
   cloud therefore claimed to be under warranty, and quotationDocHTML() zeroes every machine
   line when it is: the document printed 0.00 for the work and a correct Grand Total under
   it. Same expression also drives the warrantyMode fallback. Repaired on the way in, so rows
   already in the database are read correctly without touching them.

   A THIRD, from the same read: cloudUpsertQuotation() has no column for the derived
   breakdown — serviceFee, emergency, travel, pickup, labor, partsTotal, other, discount are
   all dropped — so a quotation opened on any device other than the one that built it was
   missing its Travel, Pickup, Labor and Other lines while the total still counted them.
   Recomputed here from the inputs that ARE stored (distance, pickupMode, extraHours,
   extraTechs, toll, otherExpense) using js/03's own rate helpers, so the document adds up
   again. Nothing is written back and no schema changes.

   Read-and-send only. The calculator stays the one place a quotation is built; แก้ไข hands
   the visitor to it through the existing loadQuotation(). Uses the existing `quotation.view`
   permission key, so it registers nothing in PERMISSION_CATALOG and the "must load before
   js/20" rule does not apply. */
(function(){
 'use strict';

 function tl(th,en){try{return (settings.language==='en')?en:th}catch(e){return th}}
 function esc2(v){return typeof window.esc==='function'?window.esc(v):String(v==null?'':v)}
 function toast(m){try{if(typeof toastMsg==='function')toastMsg(m)}catch(e){}}
 function quoteList(){try{return Array.isArray(quotations)?quotations:[]}catch(e){return[]}}
 function money2(v){
  try{if(typeof window.money==='function')return window.money(v)}catch(e){}
  return (Number(v)||0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2})+' ฿';
 }
 function fmtAny(v){try{return v&&typeof fmt==='function'?fmt(v):(v||'-')}catch(e){return v||'-'}}
 function can(k){try{return typeof canPermission==='function'?canPermission(k):true}catch(e){return true}}

 /* ------------------------------------------------- 0. repair what comes back ---- */
 function truthy(v){
  if(typeof v==='boolean')return v;
  var s=String(v==null?'':v).trim().toLowerCase();
  return s==='true'||s==='t'||s==='1'||s==='yes';
 }
 var baseFromQuote=window.fromQuotationDb;
 if(typeof baseFromQuote==='function'){
  window.fromQuotationDb=function(row){
   var q=baseFromQuote.apply(this,arguments);
   try{
    var w=truthy(row&&row.warranty);
    q.warranty=w;
    /* The base fallback is `q.warranty_mode || (q.warranty ? 'repair' : 'none')` and uses
       the same raw string, so it has to be redone with the corrected value. */
    if(!(row&&row.warranty_mode))q.warrantyMode=w?'repair':'none';
   }catch(e){}
   return q;
  };
 }

 /* -------------------------------------------- 1. the breakdown, recomputed ---- */
 /* Exactly the rules in calcQuote(), applied only to fields the wire dropped. A quotation
    that still has its own numbers — the one just built on this device — is untouched. */
 function withTotals(q){
  var o={},k;
  for(k in q)if(Object.prototype.hasOwnProperty.call(q,k))o[k]=q[k];
  var has=function(f){return typeof o[f]==='number'&&isFinite(o[f])};
  if(has('travel')&&has('pickup')&&has('labor')&&has('other'))return o;

  var cfg={};
  try{cfg=(typeof quoteCfg==='function')?quoteCfg():{}}catch(e){cfg={}}
  var t={fee:0};
  try{if(typeof getQuoteTravel==='function')t=getQuoteTravel(o.distance||0)}catch(e){}
  var extend=o.warrantyMode==='extend', underWarranty=!!o.warranty;

  if(!has('travel'))o.travel=(o.service==='OS'&&!extend&&!underWarranty)?(Number(t.fee)||0):0;
  if(!has('pickup')){
   var pm=Number(o.pickupMode)||0;
   o.pickup=extend?0:(pm===3?(Number(t.fee)||0)*2:(pm===1||pm===2?(Number(t.fee)||0):0));
  }
  if(!has('labor')){
   var large=false;
   try{
    large=(o.machineIds||[]).some(function(mid){
     return inferredMachineSize(machineById(mid)).size==='L';
    });
   }catch(e){}
   o.labor=(extend||underWarranty)?0
    :(Number(o.extraHours)||0)*(Number(o.extraTechs)||0)*(large?(cfg.laborL||0):(cfg.laborS||0));
  }
  if(!has('other'))o.other=(Number(o.toll)||0)+(Number(o.otherExpense)||0);
  return o;
 }
 window.imodeQuoteWithTotals=withTotals;

 /* ------------------------------------------------------------- 2. sending ---- */
 var SENT_STATUS='ส่งแล้ว';
 function sendStatus(){
  /* settings.quotationStatuses is configurable; use the configured "sent" word if the
     default one was renamed, and fall back to the second entry (ร่าง is always first). */
  var list=[];
  try{list=settings.quotationStatuses||[]}catch(e){}
  if(list.indexOf(SENT_STATUS)>=0)return SENT_STATUS;
  return list[1]||SENT_STATUS;
 }
 function isDraft(q){
  var list=[];
  try{list=settings.quotationStatuses||[]}catch(e){}
  return String(q&&q.status||'')===(list[0]||'ร่าง');
 }
 window.imodeQuoteIsDraft=isDraft;

 /* One place does the sending, so the row button, the document popup and the prompt after
    saving all behave identically — including the push, which is what actually puts it in
    front of the customer. */
 window.imodeSendQuoteToCustomer=function(id,quiet){
  var q=quoteList().filter(function(x){return x.id===id})[0];
  if(!q){toast(tl('ไม่พบใบเสนอราคา','Quotation not found'));return}
  if(!isDraft(q)){
   if(!quiet)toast(tl('ใบนี้ส่งให้ลูกค้าแล้ว','This quotation has already been sent'));
   render();
   return;
  }
  q.status=sendStatus();
  q.updatedAt=new Date().toISOString();
  try{if(typeof saveLocal==='function')saveLocal()}catch(e){}
  try{if(typeof cloudUpsertQuotation==='function')cloudUpsertQuotation(q)}catch(e){}
  try{
   if(Array.isArray(notifications)){
    notifications.unshift({id:(typeof uid==='function'?uid():String(Date.now())),icon:'฿',
     title:tl('ส่งใบเสนอราคาให้ลูกค้า','Quotation sent to the customer'),
     message:q.id+' · '+(q.customer||'-')+' · '+money2(q.grand),
     createdAt:new Date().toISOString(),read:false,caseId:q.caseId||''});
   }
  }catch(e){}
  try{if(typeof renderQuotationList==='function')renderQuotationList()}catch(e){}
  try{if(typeof renderNotifications==='function')renderNotifications()}catch(e){}
  render();
  toast(tl('ส่ง ','Sent ')+q.id+tl(' ให้ลูกค้าแล้ว — ลูกค้าเห็นในหน้าหลักลูกค้า',
                                   ' — it now shows on the customer home page'));
 };

 /* The prompt at the moment the coordinator finishes. saveQuotation() is a top-level
    declaration in js/03 and therefore a property of window; the page's onclick uses the bare
    identifier, which resolves to that property, so wrapping it is enough. */
 var baseSave=window.saveQuotation;
 if(typeof baseSave==='function'){
  window.saveQuotation=function(){
   var r=baseSave.apply(this,arguments);
   var after=function(){
    try{
     var id='';
     try{id=quoteEditingId||''}catch(e){id=''}
     var q=quoteList().filter(function(x){return x.id===id})[0];
     if(!q||!isDraft(q))return;
     if(typeof window.openModal!=='function')return;
     window.openModal(tl('ส่งใบเสนอราคาให้ลูกค้าไหม','Send this quotation to the customer?'),
      q.id+' · '+(q.customer||'-')+' · '+money2(q.grand),
      '<p style="margin:0 0 13px;font-size:13px;line-height:1.6;color:#4a5a78">'
      +esc2(tl('ใบเสนอราคาที่ยังเป็น “ร่าง” ลูกค้าจะยังไม่เห็นในหน้าหลักลูกค้า '
              +'กดส่งเมื่อพร้อมให้ลูกค้าดูได้แล้ว',
              'A quotation left as a draft does not appear on the customer home page. '
              +'Send it when it is ready for them to see.'))+'</p>'
      +'<div class="button-row"><button type="button" class="soft-btn" onclick="closeModal()">'
      +esc2(tl('เก็บเป็นร่างไว้ก่อน','Keep it as a draft'))+'</button>'
      +'<button type="button" class="primary-btn action-3d-orange" '
      +'onclick="closeModal();imodeSendQuoteToCustomer(\''+esc2(q.id)+'\')">'
      +esc2(tl('📤 ส่งให้ลูกค้า','📤 Send to the customer'))+'</button></div>',true);
    }catch(e){}
   };
   if(r&&typeof r.then==='function')r.then(after,function(){});
   else setTimeout(after,60);
   return r;
  };
 }

 /* --------------------------------------------------- 3. page registration ---- */
 var PAGE='quote-view';
 try{PAGE_PERMISSION[PAGE]='quotation.view'}catch(e){}
 try{
  if(typeof PAGE_INFO!=='undefined'){
   PAGE_INFO.th[PAGE]=['ดูใบเสนอราคา','ใบเสนอราคาทั้งหมด สถานะ และการส่งให้ลูกค้า'];
   PAGE_INFO.en[PAGE]=['Quotations','Every quotation, its status, and sending it to the customer'];
  }
 }catch(e){}
 if(typeof window.imodeRegisterHomeModule==='function'){
  window.imodeRegisterHomeModule({page:PAGE,icon:'📑',th:'ดูใบเสนอราคา',en:'Quotations',
   perm:'quotation.view'},'after:quotation');
 }
 /* js/36 sorts the sidebar into named groups from a fixed page list; the new page has to be
    in one or it lands in อื่น ๆ at the bottom. Right after ทำใบเสนอราคา in ราคาและค่าใช้จ่าย. */
 try{
  var groups=(window.imodeNavGroups&&window.imodeNavGroups.groups)||[];
  for(var gi=0;gi<groups.length;gi++){
   if(groups[gi].id!=='money')continue;
   if(groups[gi].pages.indexOf(PAGE)<0){
    var at=groups[gi].pages.indexOf('quotation');
    groups[gi].pages.splice(at<0?groups[gi].pages.length:at+1,0,PAGE);
   }
  }
 }catch(e){}

 function ensurePage(){
  var main=document.querySelector('main.main');
  if(!main||document.getElementById('page-'+PAGE))return;
  var sec=document.createElement('section');
  sec.className='page';
  sec.id='page-'+PAGE;
  main.appendChild(sec);
 }
 function ensureNav(){
  var nav=document.querySelector('.sidebar .side-nav');
  if(!nav||nav.querySelector('.nav-item[data-page="'+PAGE+'"]'))return;
  var b=document.createElement('button');
  b.className='nav-item';
  b.setAttribute('data-page',PAGE);
  b.innerHTML='<span>📑</span><b>'+esc2(tl('ดูใบเสนอราคา','Quotations'))+'</b>';
  b.onclick=function(){goPage(PAGE)};
  var ref=nav.querySelector('.nav-item[data-page="quotation"]');
  if(ref&&ref.nextSibling)nav.insertBefore(b,ref.nextSibling);
  else nav.appendChild(b);
  try{if(typeof applyRoleVisibility==='function')applyRoleVisibility()}catch(e){}
  try{if(window.imodeNavGroups&&window.imodeNavGroups.layout)window.imodeNavGroups.layout()}catch(e){}
 }

 /* ------------------------------------------------------------- 4. filters ---- */
 var state={q:'',status:'',customer:'',limit:25};
 window.imodeQuoteViewSet=function(k,v){
  state[k]=v;
  if(k!=='limit')state.limit=25;
  render();
 };
 window.imodeQuoteViewMore=function(){state.limit+=25;render()};

 function matches(q){
  if(state.status&&String(q.status||'')!==state.status)return false;
  if(state.customer&&String(q.customerId||'')!==state.customer)return false;
  var s=state.q.trim().toLowerCase();
  if(!s)return true;
  return [q.id,q.customer,q.caseTicket,q.contact,q.location,q.status]
   .some(function(v){return String(v||'').toLowerCase().indexOf(s)>=0});
 }
 function sorted(list){
  return list.slice().sort(function(a,b){
   return new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0);
  });
 }

 /* -------------------------------------------------------------- 5. render ---- */
 function pill(q){
  try{if(typeof quoteStatusPill==='function')return quoteStatusPill(q.status)}catch(e){}
  return '<span class="quote-status">'+esc2(q.status||'ร่าง')+'</span>';
 }
 function rowHTML(q){
  var draft=isDraft(q);
  var machines=(q.machineIds||[]).length;
  return '<div class="qv-row'+(draft?' is-draft':'')+'" data-quote="'+esc2(q.id)+'" role="button" tabindex="0"'
   +' aria-label="'+esc2(tl('เปิดใบเสนอราคา ','Open quotation ')+q.id)+'">'
   +'<div class="qv-row-main">'
   +'<div class="qv-row-top"><b>'+esc2(q.id)+'</b>'+pill(q)
   +(draft?'<span class="qv-unsent">'+esc2(tl('ลูกค้ายังไม่เห็น','Customer cannot see this'))+'</span>':'')
   +'</div>'
   +'<small>'+esc2(q.customer||'-')+(q.caseTicket?' · '+esc2(q.caseTicket):'')+'</small>'
   +'<small>'+esc2(tl('สร้าง','Created'))+' '+esc2(fmtAny(q.createdAt))
   +' · '+machines+' '+esc2(tl('เครื่อง','machines'))+'</small>'
   +'</div>'
   +'<div class="qv-row-side"><b class="qv-amount">'+money2(q.grand)+'</b>'
   +(draft&&can('quotation.create')
     ?'<button type="button" class="qv-send" onclick="event.stopPropagation();imodeSendQuoteToCustomer(\''+esc2(q.id)+'\')">'
      +esc2(tl('📤 ส่งให้ลูกค้า','📤 Send'))+'</button>'
     :'<span class="qv-go">'+esc2(tl('ดูใบ','Open'))+' ›</span>')
   +'</div></div>';
 }

 function render(){
  var host=document.getElementById('page-'+PAGE);
  if(!host)return;
  var all=quoteList();
  var list=sorted(all.filter(matches));
  var shown=list.slice(0,state.limit);

  var statuses=[];
  try{statuses=(settings.quotationStatuses||[]).slice()}catch(e){}
  all.forEach(function(q){if(q.status&&statuses.indexOf(q.status)<0)statuses.push(q.status)});

  var custSeen={},custs=[];
  all.forEach(function(q){
   if(!q.customerId||custSeen[q.customerId])return;
   custSeen[q.customerId]=1;
   custs.push({id:q.customerId,name:q.customer||q.customerId});
  });
  custs.sort(function(a,b){return String(a.name).localeCompare(String(b.name),'th')});

  var drafts=all.filter(isDraft).length;
  var total=all.reduce(function(s,q){return s+(Number(q.grand)||0)},0);
  var sentTotal=all.filter(function(q){return !isDraft(q)})
   .reduce(function(s,q){return s+(Number(q.grand)||0)},0);

  host.innerHTML='<div class="panel">'
   +'<div class="panel-head toolbar-head"><div>'
   +'<h3>'+esc2(tl('ใบเสนอราคาทั้งหมด','All quotations'))+'</h3>'
   +'<p class="subtext">'+esc2(tl('ดูใบเสนอราคา ตรวจสถานะ และส่งให้ลูกค้า',
                                  'Read a quotation, check its status, and send it to the customer'))+'</p></div>'
   +(can('quotation.create')
     ?'<button class="primary-btn action-3d-orange" onclick="goPage(\'quotation\')">＋ '
      +esc2(tl('ทำใบเสนอราคาใหม่','New quotation'))+'</button>':'')
   +'</div>'
   +'<div class="qv-kpi">'
   +'<div class="qv-kpi-box"><small>'+esc2(tl('ทั้งหมด','Total'))+'</small><b>'+all.length+'</b></div>'
   +'<div class="qv-kpi-box'+(drafts?' is-warn':'')+'"><small>'+esc2(tl('ร่าง · ยังไม่ส่ง','Draft'))+'</small><b>'+drafts+'</b></div>'
   +'<div class="qv-kpi-box"><small>'+esc2(tl('มูลค่าที่ส่งแล้ว','Sent value'))+'</small><b>'+money2(sentTotal)+'</b></div>'
   +'<div class="qv-kpi-box"><small>'+esc2(tl('มูลค่ารวม','All value'))+'</small><b>'+money2(total)+'</b></div>'
   +'</div>'
   +'<div class="qv-filters">'
   +'<input type="search" class="qv-search" placeholder="'+esc2(tl('ค้นหาเลขที่ ลูกค้า หรือเคส','Search number, customer or case'))
   +'" value="'+esc2(state.q)+'" oninput="imodeQuoteViewSet(\'q\',this.value)">'
   +'<select onchange="imodeQuoteViewSet(\'status\',this.value)"><option value="">'
   +esc2(tl('ทุกสถานะ','Every status'))+'</option>'
   +statuses.map(function(s){
      return '<option value="'+esc2(s)+'"'+(state.status===s?' selected':'')+'>'+esc2(s)+'</option>';
     }).join('')+'</select>'
   +'<select onchange="imodeQuoteViewSet(\'customer\',this.value)"><option value="">'
   +esc2(tl('ทุกลูกค้า','Every customer'))+'</option>'
   +custs.map(function(c){
      return '<option value="'+esc2(c.id)+'"'+(state.customer===c.id?' selected':'')+'>'+esc2(c.name)+'</option>';
     }).join('')+'</select>'
   +'</div>'
   +'<div class="qv-list">'+(shown.length?shown.map(rowHTML).join('')
      :'<div class="empty">'+esc2(all.length?tl('ไม่พบใบเสนอราคาตามเงื่อนไขนี้','No quotation matches this filter')
                                            :tl('ยังไม่มีใบเสนอราคา','No quotations yet'))+'</div>')+'</div>'
   +(list.length>shown.length
     ?'<div class="qv-more"><button type="button" class="soft-btn" onclick="imodeQuoteViewMore()">'
      +esc2(tl('แสดงเพิ่ม','Show more'))+' ('+(list.length-shown.length)+')</button></div>':'')
   +'</div>';

  host.querySelectorAll('.qv-row').forEach(function(row){
   var open=function(){window.imodeOpenQuoteDoc(row.getAttribute('data-quote'))};
   row.addEventListener('click',function(e){
    if(e.target.closest('button,a,select,input'))return;
    open();
   });
   row.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '||e.key==='Spacebar'){e.preventDefault();open()}
   });
  });
 }
 window.imodeRenderQuoteView=render;

 /* ---------------------------------------------------------- 6. the document ---- */
 window.imodeOpenQuoteDoc=function(id){
  var q=quoteList().filter(function(x){return x.id===id})[0];
  if(!q){toast(tl('ไม่พบใบเสนอราคา','Quotation not found'));return}
  if(typeof window.quotationDocHTML!=='function'||typeof window.openModal!=='function')return;
  var draft=isDraft(q);
  var doc='';
  try{doc=window.quotationDocHTML(withTotals(q),q.id)}catch(e){
   doc='<div class="empty">'+esc2(tl('แสดงเอกสารไม่ได้','The document could not be drawn'))+'</div>';
  }
  var actions='<div class="button-row" style="margin-top:14px">'
   +'<button type="button" class="soft-btn" onclick="printQuotation()">🖨 '
   +esc2(tl('พิมพ์ / Save PDF','Print / Save PDF'))+'</button>'
   +(can('quotation.approve')
     ?'<button type="button" class="soft-btn" onclick="openQuotationStatus(\''+esc2(q.id)+'\')">'
      +esc2(tl('สถานะ','Status'))+'</button>':'')
   +(can('quotation.create')
     ?'<button type="button" class="soft-btn" onclick="closeModal();loadQuotation(\''+esc2(q.id)+'\')">✏ '
      +esc2(tl('แก้ไขในเครื่องคิดราคา','Edit in the calculator'))+'</button>':'')
   +(draft&&can('quotation.create')
     ?'<button type="button" class="primary-btn action-3d-orange" '
      +'onclick="closeModal();imodeSendQuoteToCustomer(\''+esc2(q.id)+'\')">📤 '
      +esc2(tl('ส่งให้ลูกค้า','Send to the customer'))+'</button>':'')
   +'</div>';
  window.openModal(tl('ใบเสนอราคา ','Quotation ')+q.id,
   (q.customer||'-')+' · '+(q.status||'ร่าง'),
   (draft?'<div class="qv-draftnote">'+esc2(tl('ใบนี้ยังเป็นร่าง ลูกค้าจะยังไม่เห็นในหน้าหลักลูกค้า',
     'This is still a draft — it does not appear on the customer home page yet'))+'</div>':'')
   +doc+actions);
 };

 /* ------------------------------------------------------------ 7. the wiring ---- */
 /* renderAll() does not know about this page — it is created here — so it is rendered by
    the goPage wrapper, the same way js/16 renders งานของฉัน and มอบหมายงาน. */
 var baseGoPage=window.goPage;
 if(typeof baseGoPage==='function'){
  window.goPage=function(name){
   var r=baseGoPage.apply(this,arguments);
   try{
    if((document.querySelector('.page.active')||{}).id==='page-'+PAGE)render();
   }catch(e){}
   return r;
  };
 }
 /* A cloud sync replaces the quotations array wholesale; redraw if this page is on screen. */
 var baseSync=window.syncCloud;
 if(typeof baseSync==='function'){
  window.syncCloud=function(){
   var r=baseSync.apply(this,arguments);
   var done=function(){
    try{if((document.querySelector('.page.active')||{}).id==='page-'+PAGE)render()}catch(e){}
   };
   if(r&&typeof r.then==='function')r.then(done,done);
   else done();
   return r;
  };
 }

 /* ----------------------------------------------------------------- styles ---- */
 var st=document.createElement('style');
 st.id='v70QuoteViewStyle';
 st.textContent=''
 +'.qv-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;padding:0 14px 12px}'
 +'.qv-kpi-box{border:1px solid #e2ecfb;border-radius:13px;background:#f8fbff;padding:10px 13px}'
 +'.qv-kpi-box small{display:block;font-size:10.5px;color:#7385a5;margin-bottom:3px}'
 +'.qv-kpi-box b{font-size:17px;color:#0c225e}'
 +'.qv-kpi-box.is-warn{border-color:#f5d6b0;background:#fff8ef}'
 +'.qv-kpi-box.is-warn b{color:#9a6516}'
 +'.qv-filters{display:flex;flex-wrap:wrap;gap:9px;padding:0 14px 12px}'
 +'.qv-filters input,.qv-filters select{flex:1 1 180px;min-width:0;border:1px solid #d9e6fa;'
 +'border-radius:11px;padding:9px 11px;font-size:13px;background:#fff;color:#0c225e;min-height:38px}'
 +'.qv-filters input:focus,.qv-filters select:focus{outline:2px solid #0b63e5;outline-offset:1px}'
 +'.qv-list{display:flex;flex-direction:column;gap:9px;padding:0 14px 14px}'
 +'.qv-row{display:flex;align-items:center;gap:13px;border:1px solid #e2ecfb;border-radius:14px;'
 +'background:#fff;padding:12px 14px;cursor:pointer;'
 +'transition:transform .12s ease,border-color .12s ease,box-shadow .12s ease}'
 +'.qv-row:hover{border-color:#0b63e5;transform:translateY(-1px);box-shadow:0 6px 16px rgba(11,99,229,.12)}'
 +'.qv-row:focus-visible{outline:2px solid #0b63e5;outline-offset:2px}'
 +'.qv-row.is-draft{border-color:#f0dcc0;background:#fffdf9}'
 +'.qv-row-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}'
 +'.qv-row-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
 +'.qv-row-top b{font-size:14px;color:#0c225e}'
 +'.qv-row-main small{font-size:11.5px;color:#5b6b88}'
 +'.qv-unsent{font-size:10.5px;font-weight:800;color:#9a6516;background:#fff3e2;'
 +'border:1px solid #f3ddbd;border-radius:999px;padding:2px 9px}'
 +'.qv-row-side{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:7px}'
 +'.qv-amount{font-size:15px;color:#0c225e;white-space:nowrap}'
 +'.qv-go{font-size:12px;font-weight:800;color:#0b63e5;white-space:nowrap}'
 +'.qv-send{border:0;border-radius:11px;padding:7px 13px;cursor:pointer;white-space:nowrap;'
 +'background:#f2810c;color:#fff;font-size:12px;font-weight:800;box-shadow:0 4px 0 #c96a08}'
 +'.qv-send:hover{transform:translateY(-1px);box-shadow:0 5px 0 #c96a08}'
 +'.qv-send:active{transform:translateY(3px);box-shadow:0 1px 0 #c96a08}'
 +'.qv-send:focus-visible{outline:2px solid #0b63e5;outline-offset:2px}'
 +'.qv-more{padding:0 14px 16px}'
 +'.qv-draftnote{margin-bottom:12px;padding:10px 13px;border-radius:12px;background:#fff8ef;'
 +'border:1px solid #f3ddbd;color:#9a6516;font-size:12.5px;font-weight:700}'
 +'@media (max-width:640px){'
 +'.qv-row{flex-direction:column;align-items:stretch;gap:9px}'
 +'.qv-row-side{flex-direction:row;align-items:center;justify-content:space-between}'
 +'.qv-filters input,.qv-filters select{flex:1 1 100%}'
 +'}'
 +'@media (prefers-reduced-motion:reduce){.qv-row,.qv-send{transition:none}'
 +'.qv-row:hover,.qv-send:hover,.qv-send:active{transform:none}}';
 document.head.appendChild(st);

 function install(){
  ensurePage();
  ensureNav();
  try{if((document.querySelector('.page.active')||{}).id==='page-'+PAGE)render()}catch(e){}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
 else install();
})();
