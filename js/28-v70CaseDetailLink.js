/* Beta Service focus — the Service Cases list opens the full-page case workspace.

   service-case-detail.html is its own document. This is the only thing in the
   application that knows about it:

     - opening a case from a list goes there, carrying nothing but ?caseId=<id>;
     - coming back the other way, ?page=<module> lands on that module, so the actions on
       the detail page (มอบหมายงาน, ทำใบเสนอราคา, เริ่มงานหน้างาน …) reach the module that
       really does the job instead of a dead end.

   openCaseDetail() itself is deliberately NOT redirected. advanceCase() and several
   related lists reopen it as a popup mid-flow, and navigating away from those would be a
   regression. The single seam is window.imodeOpenCase, which every list already calls. */
(function(){
 'use strict';

 var PAGE='./service-case-detail.html';

 function caseUrl(id){return PAGE+'?caseId='+encodeURIComponent(id||'')}
 window.imodeCaseDetailUrl=caseUrl;

 /* The one place a list opens a case. v70CaseFlowScript defines a popup version of this
    as a fallback; this overrides it. */
 window.imodeOpenCase=function(id){
  if(!id)return;
  window.location.href=caseUrl(id);
 };
 /* The row handler that index.html's own markup still carries. */
 window.openCaseFromRow=function(event){
  if(!event)return;
  if(event.target&&event.target.closest&&event.target.closest('button,a,input,select,textarea'))return;
  if(event.type==='keydown'){
   if(event.target!==event.currentTarget||['Enter',' '].indexOf(event.key)<0)return;
   event.preventDefault();
  }
  var row=event.currentTarget;
  window.imodeOpenCase(row&&row.dataset?row.dataset.caseId:'');
 };
 /* งานของฉัน opens a case through its own name. */
 window.imodeOpenAssignedCase=function(id){window.imodeOpenCase(id)};

 /* ---------- coming back: ?page=<module> ----------
    js/21 already understands ?page=customer-entry for the LINE rich menu. This is the
    same idea for every internal module, so the detail page can hand the visitor to the
    right screen. It runs after js/21's own listener (registered later), and it never
    fires for the customer routes, which js/21 owns. */
 var INTERNAL={dashboard:1,cases:1,assign:1,'my-work':1,'field-service':1,quotation:1,
   customers:1,machines:1,qc:1,calendar:1,warranty:1,documents:1,notifications:1,
   reports:1,settings:1,onsite:1,'spare-parts':1,'petty-cash':1,technicians:1,home:1};

 function routeFromUrl(){
  var p=new URLSearchParams(location.search);
  var page=String(p.get('page')||'').trim();
  if(!page||!INTERNAL[page])return;                  /* customer-entry etc. belong to js/21 */
  if(typeof goPage!=='function')return;
  goPage(page);
  var cid=String(p.get('caseId')||'').trim();
  if(!cid)return;
  /* An intent is a convenience, never a promise: if the case is not on this device the
     page is simply left as it is. */
  var c=(Array.isArray(cases)?cases:[]).filter(function(x){return x.id===cid})[0];
  if(!c)return;
  var intent=String(p.get('intent')||'').trim();
  setTimeout(function(){
   try{
    if(intent==='schedule'&&typeof openScheduleModal==='function')openScheduleModal(cid);
    else if(intent==='status'&&typeof openCaseModal==='function')openCaseModal(cid);
    else if(page==='quotation'&&typeof prepareQuotation==='function')prepareQuotation(cid);
   }catch(e){}
  },260);
 }

 /* The app routes itself several times while booting (the QR guard, the staff-login door,
    initPortalFromUrl). Running after `load` keeps this from fighting any of them. */
 function start(){setTimeout(function(){try{routeFromUrl()}catch(e){}},380)}
 if(document.readyState==='complete')start();
 else window.addEventListener('load',start,{once:true});
})();
