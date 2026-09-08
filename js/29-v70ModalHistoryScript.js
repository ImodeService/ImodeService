/* Beta Service focus — two things the cloud copy of `settings` and the phone Back button
   both turned out to need.

   1. ROLE PERMISSIONS WERE BEING UNDONE A SECOND AFTER THEY WERE REPAIRED.

      Measured on the live project: `system_settings` holds an Admin / Coordinator role
      with 31 permissions — `qc.view` present but `qc.edit` and `qc.approve` missing — and
      `v69RoleScope: 3`. Boot order is:

          js/12 migrate()  →  js/16 migrate()  →  js/20 repair()      (parse time)
          …
          initCloud() → syncCloud() → settings = mergeSettings(cloudCopy)  (a moment later)

      so every repair ran against the local copy and was then replaced wholesale by the
      cloud copy, which still carried the stripped role. That is exactly what the admin
      saw: QC เครื่อง in the sidebar (qc.view survived) but "คุณไม่มีสิทธิ์" on the QC
      button (qc.edit did not). Reloading could not fix it — the sync always won.

      The fix is to run the same migrations again on what the cloud actually sent, and,
      when they change something, save it and push it back once so the shared copy stops
      being wrong for every other device too. It converges: the corrected copy carries the
      current version number, so the next sync leaves it alone.

   2. The phone Back button had nothing to do while a popup was open, so it left the page.
      js/22 gives every screen a history entry; a modal is a screen too. Opening one
      pushes an entry, Back closes it, and the × and the new ‹ in the modal head consume
      that entry instead of leaving a stale one behind — the same shape as the customer
      portal's ← in js/22. */
(function(){
 'use strict';

 /* =======================================================================
    1. re-apply the role migrations to whatever the cloud sent
    ======================================================================= */
 function reapply(){
  var changed=false;
  try{if(typeof window.imodeRoleScopeMigrate==='function'&&window.imodeRoleScopeMigrate())changed=true}catch(e){}
  try{if(typeof window.imodeWorkMigrate==='function'){window.imodeWorkMigrate();changed=true}}catch(e){}
  try{if(typeof window.imodeRepairRolePermissions==='function'&&window.imodeRepairRolePermissions())changed=true}catch(e){}
  return changed;
 }
 /* js/16's migrate() returns nothing and is add-only, so "changed" above is optimistic.
    Compare the role permissions before and after instead, and only write when they really
    moved — otherwise every sync would push a settings row and re-trigger the next one. */
 function fingerprint(){
  try{
   return (settings.roles||[]).map(function(r){
    return String(r.name||'')+':'+(r.permissions||[]).slice().sort().join(',');
   }).join('|')+'#'+settings.v69RoleScope+'#'+settings.v69Work;
  }catch(e){return ''}
 }

 var baseSync=window.syncCloud;
 if(typeof baseSync==='function'){
  window.syncCloud=function(){
   var r=baseSync.apply(this,arguments);
   var done=function(){
    try{
     var before=fingerprint();
     reapply();
     if(fingerprint()===before)return;
     if(typeof saveLocal==='function')saveLocal();
     if(typeof applyRoleVisibility==='function')applyRoleVisibility();
     if(typeof renderAll==='function')renderAll();
     /* Push the corrected copy back so the next device to sync gets the fixed roles
        rather than the stripped ones. */
     if(typeof cloudSaveSettings==='function'){try{cloudSaveSettings()}catch(e){}}
    }catch(e){}
   };
   if(r&&typeof r.then==='function')r.then(done,done);
   else done();
   return r;
  };
 }
 window.imodeReapplyRoleMigrations=reapply;

 /* =======================================================================
    2. a modal is a screen: Back closes it
    ======================================================================= */
 var modal=null,restoring=false,wasOpen=false,pushed=0;

 function isOpen(){return !!(modal&&modal.classList.contains('open'))}

 /* js/22 owns the history entries for pages and portal detail views. A modal entry is
    stacked on top of whatever it recorded, and is popped before anything else, so the two
    never fight: closing the popup returns to the page it was opened from. */
 function pushEntry(){
  try{
   history.pushState({imodeModal:true,depth:++pushed},'',location.href);
  }catch(e){}
 }

 function watch(){
  modal=document.getElementById('modal');
  if(!modal||modal.__v70ModalHistory)return;
  modal.__v70ModalHistory=true;
  wasOpen=isOpen();
  try{
   new MutationObserver(function(){
    if(restoring)return;
    var open=isOpen();
    if(open===wasOpen)return;
    wasOpen=open;
    /* Only the closed → open transition pushes. openModal() is called again for every tab
       inside a popup (openCaseDetail does exactly that), and those must not stack. */
    if(open)pushEntry();
   }).observe(modal,{attributes:true,attributeFilter:['class']});
  }catch(e){}
 }

 /* The × and the ‹ ask the browser to go back, so the entry this modal added is consumed
    rather than left behind for a Back press that would then appear to do nothing. */
 var baseClose=window.closeModal;
 if(typeof baseClose==='function'){
  window.closeModal=function(){
   if(!restoring&&pushed>0&&isOpen()){
    try{history.back();return}catch(e){}
   }
   return baseClose.apply(this,arguments);
  };
 }

 window.addEventListener('popstate',function(ev){
  var st=(ev&&ev.state)||{};
  if(isOpen()&&!st.imodeModal){
   restoring=true;
   try{if(typeof baseClose==='function')baseClose.call(window)}catch(e){}
   restoring=false;
   wasOpen=false;
   if(pushed>0)pushed--;
  }else if(!st.imodeModal){
   pushed=0;
  }
 });

 var style=document.createElement('style');
 style.id='v70ModalBackStyle';
 style.textContent=''
 +'.modal-back-btn{flex:none;width:38px;height:38px;margin-right:4px;border:1px solid #dfe9f8;border-radius:11px;'
 +'background:#fff;color:#0c225e;font-size:24px;line-height:1;cursor:pointer;display:grid;place-items:center;'
 +'transition:border-color .15s ease,background .15s ease}'
 +'.modal-back-btn:hover{border-color:#b9d2f4;background:#f4f8ff}'
 +'.modal-back-btn:focus-visible{outline:3px solid #0b63e5;outline-offset:2px}'
 +'.modal-head{align-items:center}'
 +'@media (prefers-reduced-motion:reduce){.modal-back-btn{transition:none}}';
 document.head.appendChild(style);

 function install(){watch()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
 else install();
})();
