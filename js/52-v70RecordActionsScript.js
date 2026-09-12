/* Beta 1.0 — delete buttons that lead to the bin, and an obvious edit on a quotation.

   TWO REQUESTS, one file, because they are the same thing: the actions a record is missing
   where a person actually looks at it.

     "ทำปุ่มลบขึ้นมา เช่น ปุ่มลบเคส ปุ่มลบใบเสนอราคา ปุ่มลบเครื่องจักร
      พอเวลาคลิกปุ่มลบแล้ว จะถูกย้ายไปที่ถังขยะและสามารถกู้คืนได้ใน 30 วัน"
     "ทำปุ่มแก้ไขใบเสนอราคาเพิ่มขึ้นมาหน่อย"

   NOTHING NEW IS BUILT FOR THE BIN. js/40 already has ถังขยะ, the 30-day countdown, the
   restore and the overflow store; its TYPES table says in so many words that adding a new
   deletable thing means one entry there, so `quotation` and `machine` were added there and
   the deletes below only call window.imodeTrashPut(). A type this file did not register in
   js/40 would go into the bin and be impossible to restore — the fallback typeOf() returns a
   restore that answers false — which is why they are registered and not improvised here.

   THE CLOUD ROW GOES TOO. Without that, syncCloud() replaces the local array from the server
   and the record is back within seconds, looking like the delete silently failed. Restoring
   pushes it back up, so the bin is honest on every device rather than only on this one.

   WHERE THE BUTTONS GO. The popup a record opens is its own screen and already carries its
   other actions, so that is where delete belongs — the machine popup, the case popup, the
   quotation document. The quotation LIST is the exception: its rows keep their own buttons
   (js/27 leaves this table alone), and that is the row a coordinator scans, so ✏ แก้ไข and
   🗑 ลบ are added there, after each render, rather than by rewriting js/03's row template.

   A CASE ALREADY HAD A DELETE, in the edit form, added by js/40. It is left exactly where it
   is and a second one is added to the case popup, because that is the screen people open. */
(function(){
 'use strict';
 if(typeof settings!=='object'||!settings)return;

 function tl(th,en){return (settings.language==='en')?en:th}
 function esc2(v){return typeof window.esc==='function'?window.esc(v):String(v==null?'':v)}
 function toast(m){try{if(typeof toastMsg==='function')toastMsg(m)}catch(e){}}
 function can(k){try{return typeof canPermission==='function'?canPermission(k):true}catch(e){return true}}
 function days(){try{return Number(settings.trashRetentionDays)||30}catch(e){return 30}}
 function ready(){return typeof window.imodeTrashPut==='function'}

 /* js/40 keeps cloudDelete() to itself. The same two lines, and the same reason: `supa` is a
    top-level let in js/03 and so absent from window. */
 function cloudDelete(table,id){
  try{
   var db=null;
   try{db=supa}catch(e){db=null}
   if(!db||!table||!id)return;
   db.from(table).delete().eq('id',id).then(function(r){
    if(r&&r.error)console.warn('[imode] cloud delete failed',table,id,r.error);
   },function(e){console.warn('[imode] cloud delete threw',table,id,e)});
  }catch(e){}
 }

 function confirmBin(label){
  return confirm(tl('ย้าย ','Move ')+label+tl(' ไปถังขยะ? กู้คืนได้ภายใน ',' to the bin? It can be restored within ')
   +days()+tl(' วัน',' days'));
 }

 /* ------------------------------------------------------------ quotation ---- */
 window.imodeDeleteQuotation=function(id){
  if(!ready())return {ok:false};
  var q=null;
  try{q=(quotations||[]).filter(function(x){return x.id===id})[0]||null}catch(e){}
  if(!q){toast(tl('ไม่พบใบเสนอราคา','Quotation not found'));return {ok:false}}
  if(!can('quotation.create')){
   if(typeof requirePermission==='function')requirePermission('quotation.create');
   return {ok:false};
  }
  if(!confirmBin(tl('ใบเสนอราคา ','quotation ')+(q.id||'')))return {ok:false};
  window.imodeTrashPut('quotation',q,{
   title:q.id||'',
   sub:[q.customer,q.caseTicket,q.status].filter(Boolean).join(' · ')
  });
  try{quotations=quotations.filter(function(x){return x.id!==id})}catch(e){}
  cloudDelete('quotations',id);
  try{if(typeof saveLocal==='function')saveLocal()}catch(e){}
  try{if(typeof closeModal==='function')closeModal()}catch(e){}
  try{if(typeof renderAll==='function')renderAll()}catch(e){}
  try{if(typeof window.imodeRenderQuoteView==='function')window.imodeRenderQuoteView()}catch(e){}
  toast(tl('ย้ายใบเสนอราคาไปถังขยะแล้ว','Quotation moved to the bin'));
  return {ok:true};
 };
 /* loadQuotation() IS the editor — it fills the calculator on the quotation page. The row
    said only "เปิด", which does not read as an edit, so the action is named for what it does
    and the original button is left alone. */
 window.imodeEditQuotation=function(id){
  if(typeof window.loadQuotation!=='function'){toast(tl('เปิดใบเสนอราคาไม่ได้','Cannot open the quotation'));return}
  if(!can('quotation.create')){
   if(typeof requirePermission==='function')requirePermission('quotation.create');
   return;
  }
  try{if(typeof closeModal==='function')closeModal()}catch(e){}
  window.loadQuotation(id);
 };

 /* -------------------------------------------------------------- machine ---- */
 window.imodeDeleteMachine=function(mid){
  if(!ready())return {ok:false};
  var m=null;
  try{m=(machines||[]).filter(function(x){return x.id===mid})[0]||null}catch(e){}
  if(!m){toast(tl('ไม่พบเครื่องจักร','Machine not found'));return {ok:false}}
  if(!can('machine.edit')){
   if(typeof requirePermission==='function')requirePermission('machine.edit');
   return {ok:false};
  }
  /* A machine is referenced by cases, warranties, QC and documents. None of those are
     deleted with it — they would be orphaned rather than wrong, and deleting them silently
     is not something a bin can undo cleanly — so the count is stated and the choice is the
     admin's. */
  var n=0;
  try{n=(cases||[]).filter(function(c){return c.machineId===mid}).length}catch(e){}
  if(n&&!confirm(tl('เครื่องนี้มี ','This machine has ')+n+tl(' เคสผูกอยู่ ประวัติเหล่านั้นจะยังอยู่แต่จะไม่มีเครื่องให้อ้างอิง ต้องการลบต่อหรือไม่?',
    ' case(s) linked. Those records stay but will point at a machine that is gone. Continue?')))return {ok:false};
  var label=[m.name,m.model,m.serial].filter(Boolean).join(' · ')||mid;
  if(!confirmBin(tl('เครื่องจักร ','machine ')+label))return {ok:false};
  window.imodeTrashPut('machine',m,{title:m.name||mid,sub:[m.model,m.serial].filter(Boolean).join(' · ')});
  try{machines=machines.filter(function(x){return x.id!==mid})}catch(e){}
  cloudDelete('machines',mid);
  try{if(typeof saveLocal==='function')saveLocal()}catch(e){}
  try{if(typeof closeModal==='function')closeModal()}catch(e){}
  try{if(typeof renderAll==='function')renderAll()}catch(e){}
  toast(tl('ย้ายเครื่องจักรไปถังขยะแล้ว','Machine moved to the bin'));
  return {ok:true};
 };

 /* ----------------------------------------------------------- the buttons ---- */
 function binBtn(fn,id,label){
  return '<button type="button" class="soft-btn ra-del" data-ra-del="'+esc2(id)+'"'
   +' onclick="'+fn+'(&quot;'+esc2(id)+'&quot;)">🗑 '+esc2(label)+'</button>';
 }

 /* The machine popup. openMachineDetail() draws its own .button-row; the delete is appended
    to it so it sits with the other actions instead of floating somewhere new. */
 var baseMachineDetail=window.openMachineDetail;
 if(typeof baseMachineDetail==='function'){
  window.openMachineDetail=function(mid){
   var r=baseMachineDetail.apply(this,arguments);
   try{
    if(!mid||!can('machine.edit'))return r;
    var row=document.querySelector('#modal .button-row');
    if(!row||row.querySelector('[data-ra-del]'))return r;
    row.insertAdjacentHTML('beforeend',binBtn('imodeDeleteMachine',mid,tl('ลบเครื่องจักร','Delete machine')));
   }catch(e){}
   return r;
  };
 }

 /* The case popup. js/40 put one in the edit form already; this is the screen people open. */
 var baseCaseDetail=window.openCaseDetail;
 if(typeof baseCaseDetail==='function'){
  window.openCaseDetail=function(cid){
   var r=baseCaseDetail.apply(this,arguments);
   try{
    if(!cid||typeof window.imodeDeleteCase!=='function')return r;
    if(!can('case.edit'))return r;
    var row=document.querySelector('#modal .button-row');
    if(!row||row.querySelector('[data-ra-del]'))return r;
    row.insertAdjacentHTML('beforeend',binBtn('imodeDeleteCase',cid,tl('ลบเคส','Delete case')));
   }catch(e){}
   return r;
  };
 }

 /* The quotation list. Its rows keep their own buttons, so the two actions are appended to
    each row's cluster after every render rather than by editing js/03's template — a row a
    later patch adds is picked up for free. */
 function decorateQuotes(){
  if(!can('quotation.create'))return;
  document.querySelectorAll('#quotationTable .row-actions,#quotationCards .card-actions')
   .forEach(function(box){
    var open=box.querySelector('[onclick^="loadQuotation"]');
    if(!open||box.querySelector('[data-ra-del]'))return;
    var m=/loadQuotation\('([^']+)'\)/.exec(open.getAttribute('onclick')||'');
    if(!m)return;
    var id=m[1];
    var cls=box.classList.contains('card-actions')?'soft-btn':'mini-btn';
    open.insertAdjacentHTML('afterend',
      '<button type="button" class="'+cls+' ra-edit" onclick="event.stopPropagation();imodeEditQuotation(&quot;'
      +esc2(id)+'&quot;)">✏ '+esc2(tl('แก้ไข','Edit'))+'</button>');
    box.insertAdjacentHTML('beforeend',
      '<button type="button" class="'+cls+' ra-del" data-ra-del="'+esc2(id)+'"'
      +' onclick="event.stopPropagation();imodeDeleteQuotation(&quot;'+esc2(id)+'&quot;)">🗑 '
      +esc2(tl('ลบ','Delete'))+'</button>');
   });
 }
 ['renderQuotations','renderQuotationList','renderAll'].forEach(function(name){
  var base=window[name];
  if(typeof base!=='function')return;
  window[name]=function(){
   var r=base.apply(this,arguments);
   try{decorateQuotes()}catch(e){}
   return r;
  };
 });

 /* js/43's ดูใบเสนอราคา draws the real document in a popup and already offers แก้ไข there.
    Only the delete is missing. */
 var baseQuoteDoc=window.imodeOpenQuoteDoc;
 if(typeof baseQuoteDoc==='function'){
  window.imodeOpenQuoteDoc=function(id){
   var r=baseQuoteDoc.apply(this,arguments);
   try{
    if(!id||!can('quotation.create'))return r;
    var row=document.querySelector('#modal .button-row');
    if(!row||row.querySelector('[data-ra-del]'))return r;
    row.insertAdjacentHTML('beforeend',binBtn('imodeDeleteQuotation',id,tl('ลบใบเสนอราคา','Delete quotation')));
   }catch(e){}
   return r;
  };
 }

 var st=document.createElement('style');
 st.id='v70RecordActionsStyle';
 st.textContent=''
 +'.ra-del{color:#b3261e}'
 +'.ra-del:hover{border-color:#e5a5a0;background:#fdf3f2;color:#8f1d17}'
 +'.ra-edit{color:#0b3f9e}'
 +'.ra-edit:hover{border-color:#0b63e5;color:#0b63e5}';
 document.head.appendChild(st);

 function install(){try{decorateQuotes()}catch(e){}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
 else install();
})();
