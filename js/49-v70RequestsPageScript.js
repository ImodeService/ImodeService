/* Beta 1.0 — คำขอจากลูกค้า as a page of its own.

   REPORTED: there should be a requests page in the admin's sidebar, and anything a
   customer sends should turn up in it.

   Everything a customer sends already lands in the `lineRequests` array — แจ้งปัญหา,
   ขอราคา Service, ขอราคา Warranty and เช็คประกัน are all written by submitPortal*() in
   js/03, they travel through `line_customer_requests`, and js/42 carries the photos.
   What was missing was somewhere to look at them: the only list in the application is the
   last panel at the bottom of the Customers page, under the customer table and its pager,
   which nobody sees. So this is a new surface over data that already exists, not a new
   store — no storage key, no table, no new field.

   PERMISSION. Keyed to `line.view`, which is deliberately an EXISTING key: a script that
   pushes a new key into PERMISSION_CATALOG has to load before js/20, which repairs roles
   against the catalog as it stands at that moment, and this file loads after it. Admin /
   Coordinator and Service Manager hold line.view; no technician role does, which is the
   requested scope.

   The nav entry carries a live count of คำขอใหม่, because "เวลามีคำขออะไรมาให้ขึ้นในนี้"
   is only true if the sidebar says so without being opened first. */
(function(){
 'use strict';
 if(typeof settings!=='object'||!settings)return;

 var PAGE='requests';

 function tl(th,en){return (settings.language==='en')?en:th}
 function esc2(v){return typeof window.esc==='function'?window.esc(v):String(v==null?'':v)}
 function can(k){try{return typeof canPermission==='function'?canPermission(k):true}catch(e){return true}}
 function reqList(){try{return Array.isArray(lineRequests)?lineRequests:[]}catch(e){return[]}}
 function customerOf(r){try{return typeof customerById==='function'?customerById(r.customerId):null}catch(e){return null}}
 function machineOf(r){try{return typeof machineById==='function'?machineById(r.machineId):null}catch(e){return null}}
 function fmtAny(v){try{return typeof fmt==='function'?fmt(v):String(v||'')}catch(e){return String(v||'')}}
 function toast(m){try{if(typeof toastMsg==='function')toastMsg(m)}catch(e){}}

 var TYPES=[
  ['service',       'แจ้งปัญหา',        'Problem report'],
  ['service_quote', 'ขอราคา Service',   'Service quote request'],
  ['warranty_quote','ขอราคา Warranty',  'Warranty quote request'],
  ['warranty_check','เช็คประกัน',        'Warranty check']
 ];
 function typeLabel(t){
  for(var i=0;i<TYPES.length;i++)if(TYPES[i][0]===t)return tl(TYPES[i][1],TYPES[i][2]);
  return tl('คำขออื่น','Other request');
 }
 function isNew(r){return String(r.status||'')==='ใหม่'}
 function isDone(r){return String(r.status||'')==='เสร็จสิ้น'}
 function newCount(){return reqList().filter(isNew).length}
 window.imodeNewRequestCount=newCount;

 /* ------------------------------------------------------ page registration ---- */
 try{PAGE_PERMISSION[PAGE]='line.view'}catch(e){}
 try{
  if(typeof PAGE_INFO!=='undefined'){
   PAGE_INFO.th[PAGE]=['คำขอจากลูกค้า','แจ้งปัญหา ขอราคา และเช็คประกันที่ส่งเข้ามาจาก LINE OA / QR เครื่อง'];
   PAGE_INFO.en[PAGE]=['Customer requests','Problem reports, quote requests and warranty checks from the LINE OA / machine QR'];
  }
 }catch(e){}
 if(typeof window.imodeRegisterHomeModule==='function'){
  window.imodeRegisterHomeModule({page:PAGE,icon:'📥',th:'คำขอจากลูกค้า',en:'Customer requests',
   perm:'line.view'},'first');
 }
 /* js/36 sorts the sidebar into named groups from a fixed page list; a page that is in
    none of them lands in อื่น ๆ at the bottom. Intake comes before เคสงานบริการ. */
 try{
  var groups=(window.imodeNavGroups&&window.imodeNavGroups.groups)||[];
  for(var gi=0;gi<groups.length;gi++){
   if(groups[gi].id!=='service')continue;
   if(groups[gi].pages.indexOf(PAGE)<0)groups[gi].pages.unshift(PAGE);
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
  b.innerHTML='<span>📥</span><b>'+esc2(tl('คำขอจากลูกค้า','Customer requests'))
   +'</b><i class="req-nav-badge" data-req-badge hidden>0</i>';
  b.onclick=function(){goPage(PAGE)};
  var ref=nav.querySelector('.nav-item[data-page="cases"]');
  if(ref)nav.insertBefore(b,ref);
  else nav.appendChild(b);
  try{if(typeof applyRoleVisibility==='function')applyRoleVisibility()}catch(e){}
  try{if(window.imodeNavGroups&&window.imodeNavGroups.layout)window.imodeNavGroups.layout()}catch(e){}
 }
 function paintBadge(){
  var n=newCount();
  document.querySelectorAll('[data-req-badge]').forEach(function(el){
   el.textContent=n>99?'99+':String(n);
   el.hidden=!n;
  });
 }
 window.imodePaintRequestBadge=paintBadge;

 /* ------------------------------------------------------------- filters ---- */
 var state={q:'',type:'',status:'',limit:25};
 window.imodeRequestsSet=function(k,v){
  state[k]=v;
  if(k!=='limit')state.limit=25;
  render();
 };
 window.imodeRequestsMore=function(){state.limit+=25;render()};

 function matches(r){
  if(state.type&&String(r.type||'')!==state.type)return false;
  if(state.status&&String(r.status||'')!==state.status)return false;
  var s=state.q.trim().toLowerCase();
  if(!s)return true;
  var cu=customerOf(r),m=machineOf(r);
  return [r.contact,r.phone,r.message,r.status,r.lineDisplayName,
          cu&&cu.name,m&&m.name,m&&m.serial,m&&m.model]
   .some(function(v){return String(v||'').toLowerCase().indexOf(s)>=0});
 }
 function sorted(list){
  return list.slice().sort(function(a,b){
   return new Date(b.createdAt||0)-new Date(a.createdAt||0);
  });
 }

 /* -------------------------------------------------------------- render ---- */
 function actionsHTML(r){
  var out='';
  if(r.caseId)out+='<button type="button" class="req-act" onclick="event.stopPropagation();'
   +'imodeOpenRequestCase(&quot;'+esc2(r.caseId)+'&quot;)">'+esc2(tl('เปิดเคส','Open case'))+'</button>';
  if(r.type==='service_quote'&&can('quotation.create'))
   out+='<button type="button" class="req-act" onclick="event.stopPropagation();'
    +'prepareServiceQuoteFromRequest(&quot;'+esc2(r.id)+'&quot;)">'+esc2(tl('ทำใบเสนอราคา','Quote'))+'</button>';
  if(r.type==='warranty_quote'&&can('quotation.create'))
   out+='<button type="button" class="req-act" onclick="event.stopPropagation();'
    +'prepareWarrantyQuoteFromRequest(&quot;'+esc2(r.id)+'&quot;)">'+esc2(tl('ทำใบเสนอราคา','Quote'))+'</button>';
  if(can('line.manage'))
   out+='<button type="button" class="req-act is-primary" onclick="event.stopPropagation();'
    +'setLineRequestStatus(&quot;'+esc2(r.id)+'&quot;)">'+esc2(tl('สถานะ','Status'))+'</button>';
  return out;
 }
 function rowHTML(r){
  var cu=customerOf(r),m=machineOf(r);
  var media=Array.isArray(r.media)?r.media.length:0;
  return '<div class="req-row'+(isNew(r)?' is-new':'')+(isDone(r)?' is-done':'')+'" data-req="'+esc2(r.id)+'"'
   +' role="button" tabindex="0" aria-label="'+esc2(tl('เปิดคำขอ','Open request'))+'">'
   +'<div class="req-row-main">'
   +'<div class="req-row-top">'
   +'<span class="req-type req-type-'+esc2(r.type||'other')+'">'+esc2(typeLabel(r.type))+'</span>'
   +'<span class="req-status'+(isNew(r)?' is-new':isDone(r)?' is-done':'')+'">'+esc2(r.status||'-')+'</span>'
   +(media?'<span class="req-media">📷 '+media+'</span>':'')
   +'</div>'
   +'<b>'+esc2((cu&&cu.name)||r.contact||tl('ไม่ระบุลูกค้า','Unknown customer'))+'</b>'
   +'<small>'+esc2(m?((m.name||'-')+(m.serial?' · S/N '+m.serial:'')):tl('ไม่ระบุเครื่อง','No machine'))+'</small>'
   +'<p>'+esc2(String(r.message||'-').slice(0,180))+'</p>'
   +'<small>'+esc2(fmtAny(r.createdAt))
   +(r.contact?' · '+esc2(r.contact):'')+(r.phone?' · '+esc2(r.phone):'')+'</small>'
   +'</div>'
   +'<div class="req-row-side">'+actionsHTML(r)+'</div>'
   +'</div>';
 }

 function render(){
  var host=document.getElementById('page-'+PAGE);
  if(!host)return;
  var all=reqList();
  var list=sorted(all.filter(matches));
  var shown=list.slice(0,state.limit);

  var statuses=[];
  all.forEach(function(r){if(r.status&&statuses.indexOf(r.status)<0)statuses.push(r.status)});

  host.innerHTML='<div class="panel">'
   +'<div class="panel-head toolbar-head"><div>'
   +'<h3>'+esc2(tl('คำขอที่ลูกค้าส่งเข้ามา','Requests from customers'))+'</h3>'
   +'<p class="subtext">'+esc2(tl('แจ้งปัญหา ขอราคา และเช็คประกัน จาก LINE OA และ QR บนเครื่อง',
      'Problem reports, quote requests and warranty checks from the LINE OA and the machine QR'))+'</p>'
   +'</div>'
   +'<button class="soft-btn" onclick="imodeRequestsSet(\'status\',\'ใหม่\')">'
   +esc2(tl('ดูเฉพาะคำขอใหม่','New only'))+'</button></div>'
   +'<div class="req-kpi">'
   +'<div class="req-kpi-box'+(newCount()?' is-new':'')+'"><small>'+esc2(tl('ใหม่ · รอรับเรื่อง','New'))+'</small><b>'+all.filter(isNew).length+'</b></div>'
   +'<div class="req-kpi-box"><small>'+esc2(tl('กำลังดำเนินการ','In progress'))+'</small><b>'
   +all.filter(function(r){return !isNew(r)&&!isDone(r)}).length+'</b></div>'
   +'<div class="req-kpi-box"><small>'+esc2(tl('เสร็จสิ้น','Done'))+'</small><b>'+all.filter(isDone).length+'</b></div>'
   +'<div class="req-kpi-box"><small>'+esc2(tl('ทั้งหมด','Total'))+'</small><b>'+all.length+'</b></div>'
   +'</div>'
   +'<div class="req-filters">'
   +'<input type="search" class="req-search" placeholder="'
   +esc2(tl('ค้นหาลูกค้า เครื่อง เบอร์โทร หรือรายละเอียด','Search customer, machine, phone or details'))
   +'" value="'+esc2(state.q)+'" oninput="imodeRequestsSet(\'q\',this.value)">'
   +'<select onchange="imodeRequestsSet(\'type\',this.value)"><option value="">'
   +esc2(tl('ทุกประเภท','Every type'))+'</option>'
   +TYPES.map(function(t){
      return '<option value="'+t[0]+'"'+(state.type===t[0]?' selected':'')+'>'+esc2(tl(t[1],t[2]))+'</option>';
     }).join('')+'</select>'
   +'<select onchange="imodeRequestsSet(\'status\',this.value)"><option value="">'
   +esc2(tl('ทุกสถานะ','Every status'))+'</option>'
   +statuses.map(function(s){
      return '<option value="'+esc2(s)+'"'+(state.status===s?' selected':'')+'>'+esc2(s)+'</option>';
     }).join('')+'</select>'
   +'</div>'
   +'<div class="req-list">'+(shown.length?shown.map(rowHTML).join('')
      :'<div class="empty">'+esc2(all.length?tl('ไม่พบคำขอตามเงื่อนไขนี้','No request matches this filter')
                                            :tl('ยังไม่มีคำขอจากลูกค้า','No customer requests yet'))+'</div>')+'</div>'
   +(list.length>shown.length
     ?'<div class="req-more"><button type="button" class="soft-btn" onclick="imodeRequestsMore()">'
      +esc2(tl('แสดงเพิ่ม','Show more'))+' ('+(list.length-shown.length)+')</button></div>':'')
   +'</div>';

  host.querySelectorAll('.req-row').forEach(function(row){
   var open=function(){window.imodeOpenRequest(row.getAttribute('data-req'))};
   row.addEventListener('click',function(e){if(!e.target.closest('button,a,select,input'))open()});
   row.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '||e.key==='Spacebar'){e.preventDefault();open()}
   });
  });
  paintBadge();
 }
 window.imodeRenderRequests=render;

 /* ---------------------------------------------------------- the request ---- */
 /* The case a แจ้งปัญหา opened lives in the application; js/28 routes the seam to the
    standalone workspace, so use it rather than reopening the legacy popup. */
 window.imodeOpenRequestCase=function(cid){
  if(typeof window.imodeOpenCase==='function')window.imodeOpenCase(cid);
  else if(typeof openCaseDetail==='function')openCaseDetail(cid);
 };
 window.imodeOpenRequest=function(id){
  var r=reqList().filter(function(x){return x.id===id})[0];
  if(!r){toast(tl('ไม่พบคำขอ','Request not found'));return}
  if(typeof window.openModal!=='function')return;
  var cu=customerOf(r),m=machineOf(r);
  var rows=[
   [tl('ประเภท','Type'),typeLabel(r.type)],
   [tl('สถานะ','Status'),r.status||'-'],
   [tl('ส่งเมื่อ','Received'),fmtAny(r.createdAt)],
   [tl('ลูกค้า','Customer'),(cu&&cu.name)||'-'],
   [tl('เครื่อง','Machine'),m?((m.name||'-')+(m.model?' · '+m.model:'')):'-'],
   [tl('ซีเรียล','Serial'),(m&&m.serial)||'-'],
   [tl('ผู้ติดต่อ','Contact'),r.contact||'-'],
   [tl('โทรศัพท์','Phone'),r.phone||'-']
  ];
  if(r.priority)rows.push([tl('ความเร่งด่วน','Priority'),r.priority]);
  if(r.serviceMode)rows.push([tl('รูปแบบบริการ','Service mode'),
   r.serviceMode==='WS'?'Workshop Service':r.serviceMode==='DG'?'Diagnosis Only':'Onsite Service']);
  if(r.months)rows.push([tl('ระยะประกันที่ขอ','Months requested'),String(r.months)]);
  if(r.lineDisplayName)rows.push(['LINE',r.lineDisplayName]);

  var media='';
  try{if(typeof window.imodeCaseMediaHTML==='function')media=window.imodeCaseMediaHTML(r)||''}catch(e){}

  window.openModal(typeLabel(r.type),(cu&&cu.name)||r.contact||'',
   '<div class="detail-grid">'
   +rows.map(function(x){return '<div class="detail-box"><small>'+esc2(x[0])+'</small><b>'+esc2(x[1])+'</b></div>'}).join('')
   +'<div class="detail-box full"><small>'+esc2(tl('รายละเอียดจากลูกค้า','What the customer wrote'))
   +'</small><b>'+esc2(r.message||'-')+'</b></div></div>'
   +media
   +'<div class="button-row" style="margin-top:14px">'+actionsHTML(r)+'</div>');
 };

 /* --------------------------------------------------------------- wiring ---- */
 /* renderAll() does not know about this page — it is created here — so it is drawn by the
    goPage wrapper, the way js/16 draws งานของฉัน and js/43 draws ดูใบเสนอราคา. The badge
    is cheap and is repainted on every render so the sidebar is right without opening it. */
 var baseGoPage=window.goPage;
 if(typeof baseGoPage==='function'){
  window.goPage=function(){
   var r=baseGoPage.apply(this,arguments);
   try{if((document.querySelector('.page.active')||{}).id==='page-'+PAGE)render()}catch(e){}
   return r;
  };
 }
 var baseRenderAll=window.renderAll;
 if(typeof baseRenderAll==='function'){
  window.renderAll=function(){
   var r=baseRenderAll.apply(this,arguments);
   try{
    ensureNav();
    paintBadge();
    if((document.querySelector('.page.active')||{}).id==='page-'+PAGE)render();
   }catch(e){}
   return r;
  };
 }
 var baseSync=window.syncCloud;
 if(typeof baseSync==='function'){
  window.syncCloud=function(){
   var r=baseSync.apply(this,arguments);
   var done=function(){
    try{
     paintBadge();
     if((document.querySelector('.page.active')||{}).id==='page-'+PAGE)render();
    }catch(e){}
   };
   if(r&&typeof r.then==='function')r.then(done,done);
   else done();
   return r;
  };
 }
 /* Changing a request's status goes through js/03's saveLineRequestStatus(), which redraws
    only the Customers-page table. Redraw this page and the badge too. */
 var baseSaveStatus=window.saveLineRequestStatus;
 if(typeof baseSaveStatus==='function'){
  window.saveLineRequestStatus=function(){
   var r=baseSaveStatus.apply(this,arguments);
   try{paintBadge();render()}catch(e){}
   return r;
  };
 }

 /* --------------------------------------------------------------- styles ---- */
 var st=document.createElement('style');
 st.id='v70RequestsStyle';
 st.textContent=''
 +'.req-nav-badge{margin-left:auto;font-style:normal;font-size:10.5px;font-weight:800;'
 +'background:#f2810c;color:#fff;border-radius:999px;padding:1px 7px;min-width:18px;text-align:center}'
 +'.nav-item .req-nav-badge[hidden]{display:none!important}'
 +'.req-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;padding:0 14px 12px}'
 +'.req-kpi-box{border:1px solid #e2ecfb;border-radius:13px;background:#f8fbff;padding:10px 13px}'
 +'.req-kpi-box small{display:block;font-size:10.5px;color:#7385a5;margin-bottom:3px}'
 +'.req-kpi-box b{font-size:17px;color:#0c225e}'
 +'.req-kpi-box.is-new{border-color:#f5c9a6;background:#fff6ee}'
 +'.req-kpi-box.is-new b{color:#b4600a}'
 +'.req-filters{display:flex;flex-wrap:wrap;gap:9px;padding:0 14px 12px}'
 +'.req-filters input,.req-filters select{flex:1 1 180px;min-width:0;border:1px solid #d9e6fa;'
 +'border-radius:11px;padding:9px 11px;font-size:13px;background:#fff;color:#0c225e;min-height:38px}'
 +'.req-filters input:focus,.req-filters select:focus{outline:2px solid #0b63e5;outline-offset:1px}'
 +'.req-list{display:flex;flex-direction:column;gap:9px;padding:0 14px 14px}'
 +'.req-row{display:flex;align-items:flex-start;gap:13px;border:1px solid #e2ecfb;border-radius:14px;'
 +'background:#fff;padding:12px 14px;cursor:pointer;'
 +'transition:transform .12s ease,border-color .12s ease,box-shadow .12s ease}'
 +'.req-row:hover{border-color:#0b63e5;transform:translateY(-1px);box-shadow:0 6px 16px rgba(11,99,229,.12)}'
 +'.req-row:focus-visible{outline:2px solid #0b63e5;outline-offset:2px}'
 +'.req-row.is-new{border-color:#f3d3b2;background:#fffaf4}'
 +'.req-row.is-done{opacity:.72}'
 +'.req-row-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}'
 +'.req-row-main b{font-size:14px;color:#0c225e}'
 +'.req-row-main small{font-size:11.5px;color:#5b6b88}'
 +'.req-row-main p{margin:4px 0 2px;font-size:12.5px;color:#2c3f68;line-height:1.5;'
 +'overflow-wrap:anywhere}'
 +'.req-row-top{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:2px}'
 +'.req-type{font-size:10.5px;font-weight:800;border-radius:999px;padding:2px 9px;'
 +'background:#eef4ff;border:1px solid #cfe0fa;color:#0b3f9e}'
 +'.req-type-warranty_quote,.req-type-warranty_check{background:#f3eeff;border-color:#ddd0fa;color:#5733a8}'
 +'.req-type-service_quote{background:#fff3e2;border-color:#f3ddbd;color:#9a6516}'
 +'.req-status{font-size:10.5px;font-weight:800;border-radius:999px;padding:2px 9px;'
 +'background:#f2f6fc;border:1px solid #dde7f6;color:#5b6b88}'
 +'.req-status.is-new{background:#fdeee0;border-color:#f3d3b2;color:#b4600a}'
 +'.req-status.is-done{background:#e9f8ef;border-color:#b6e6c9;color:#0a6b3d}'
 +'.req-media{font-size:10.5px;font-weight:800;color:#0b3f9e}'
 +'.req-row-side{flex:none;display:flex;flex-direction:column;gap:7px;align-items:stretch}'
 +'.req-act{border:1px solid #d9e6fa;border-radius:11px;padding:7px 13px;cursor:pointer;'
 +'white-space:nowrap;background:#fff;color:#0c225e;font-size:12px;font-weight:800;min-height:32px}'
 +'.req-act:hover{border-color:#0b63e5;color:#0b63e5}'
 +'.req-act.is-primary{background:#0b63e5;border-color:#0b63e5;color:#fff}'
 +'.req-act.is-primary:hover{background:#0a54c4;color:#fff}'
 +'.req-act:focus-visible{outline:2px solid #0b63e5;outline-offset:2px}'
 +'.req-more{padding:0 14px 16px}'
 +'@media (max-width:640px){'
 +'.req-row{flex-direction:column;align-items:stretch}'
 +'.req-row-side{flex-direction:row;flex-wrap:wrap}'
 +'.req-act{flex:1 1 auto}'
 +'.req-filters input,.req-filters select{flex:1 1 100%}'
 +'}'
 +'@media (prefers-reduced-motion:reduce){.req-row{transition:none}.req-row:hover{transform:none}}';
 document.head.appendChild(st);

 function install(){
  ensurePage();
  ensureNav();
  paintBadge();
  try{if((document.querySelector('.page.active')||{}).id==='page-'+PAGE)render()}catch(e){}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
 else install();
})();
