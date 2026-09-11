/* Beta 1.0 — a role that has lost permissions is repaired on every load, not once.

   REPORTED: signed in as an Admin / Coordinator account, pressing ทำใบเสนอราคา answers
   "คุณไม่มีสิทธิ์ใช้งานฟังก์ชันนี้", and the sidebar entry is gone as well. An admin is
   supposed to reach every module.

   MEASURED: on a fresh profile the role is correct — 33 permissions, quotation.view and
   quotation.create included — and a no-op save through Settings -> ผู้ใช้งานและสิทธิ์
   preserves all 33. So the fault is a saved settings object that has lost keys, which is
   the same shape of failure recorded in part 14 (four keys stripped by mergeSettings),
   part 16 (an Admin role down to 31 with qc.edit gone) and its follow-up (the cloud copy
   undoing the repair). What is new here is why it never heals:

     js/12 migrate()   returns immediately when settings.v69RoleScope === SCOPE_VERSION
     js/16 migrate()   the same, on settings.v69Work
     js/20 repair()    restores only from window.imodeSettingsSnapshot, which is this
                       device's own pre-boot copy — already stripped once the bad copy
                       has been saved or synced down

   So once a role has drifted at the current version number, every repair in the project
   declines to run and the permission is gone for good. Reproduced: strip quotation.* from
   the Admin role with v69RoleScope already at 4, then reload three times — 31 permissions,
   canPermission('quotation.create') false, and the sidebar entry hidden, every time.

   THE FIX, and why it does not simply overwrite the admin's own choices.

   The version flag existed to protect a permission an admin had deliberately unticked. It
   protects it by refusing to run at all, which is what makes drift permanent. This file
   records that intent directly instead: saveRoles() is the only way a permission is ever
   turned off on purpose, so the wrapper below writes down, at the moment of that save,
   which preset keys the admin left unticked — settings.rolePresetOptOut. The repair then
   runs on EVERY load and after every cloud sync, adding back only preset keys that are
   missing and are not in that list.

   Consequences worth knowing:

   - It is add-only and convergent. Once a load has repaired the roles, the next one finds
     nothing to do and writes nothing.
   - Roles the application defines no preset for are skipped entirely. Technical Lead and
     R&D Lead are seeded by js/13 rather than by a preset (permissionPresetForRoleName
     falls through to ['dashboard.view'] for both), so they are left exactly as they are.
   - A permission unticked BEFORE this file shipped has no opt-out record, so it comes back
     once. That is the intended trade: the reported state is indistinguishable from a
     deliberate untick until the first save records one.
   - settings.rolePresetOptOut lives inside `settings`, like settings.uatAccounts and
     settings.trash, so the intent reaches every device. mergeSettings() spreads the saved
     object wholesale, so an unknown top-level key survives it.

   This file registers nothing in PERMISSION_CATALOG, so the "must load before js/20" rule
   does not apply; it deliberately loads after js/20 and js/29 so it sees the result of
   every earlier repair and its syncCloud wrapper is the outermost one. */
(function(){
 'use strict';
 if(typeof settings!=='object'||!settings)return;

 /* The names permissionPresetForRoleName() actually recognises — js/12's override first,
    then js/03's base. Anything else falls through to its ['dashboard.view'] default, which
    is not a preset and must never be applied to a role somebody built by hand. */
 function hasPreset(name){
  var n=String(name||'').toLowerCase();
  return n.indexOf('technician')>=0||n==='r&d'||n.indexOf('engineer')>=0
      || n.indexOf('manager')>=0||n.indexOf('supervisor')>=0
      || n.indexOf('admin')>=0||n.indexOf('coordinator')>=0
      || n.indexOf('sales')>=0||n.indexOf('marketing')>=0;
 }
 function presetFor(name){
  try{
   if(typeof window.permissionPresetForRoleName!=='function')return [];
   return window.permissionPresetForRoleName(name)||[];
  }catch(e){return []}
 }
 function optOutMap(){
  var m=settings.rolePresetOptOut;
  return (m&&typeof m==='object')?m:{};
 }

 /* ---------- the repair ---------- */
 function repair(){
  var off=optOutMap(),changed=false;
  (Array.isArray(settings.roles)?settings.roles:[]).forEach(function(role){
   if(!role||!hasPreset(role.name))return;
   var want=presetFor(role.name);
   if(!want.length)return;
   var have=Array.isArray(role.permissions)?role.permissions:[];
   var skip=Array.isArray(off[role.name])?off[role.name]:[];
   want.forEach(function(k){
    if(have.indexOf(k)<0&&skip.indexOf(k)<0){have.push(k);changed=true}
   });
   role.permissions=have;
  });
  return changed;
 }
 window.imodeRolePresetRepair=repair;

 /* ---------- record what the admin really turned off ---------- */
 function recordOptOut(){
  var map={};
  (Array.isArray(settings.roles)?settings.roles:[]).forEach(function(role){
   if(!role||!hasPreset(role.name))return;
   var want=presetFor(role.name);
   if(!want.length)return;
   var have=Array.isArray(role.permissions)?role.permissions:[];
   var gone=want.filter(function(k){return have.indexOf(k)<0});
   if(gone.length)map[role.name]=gone;
  });
  settings.rolePresetOptOut=map;
 }

 /* saveRoles() bails without touching settings when a role has no name or no permission at
    all, so the array identity is what says whether the save really happened. */
 var baseSave=window.saveRoles;
 if(typeof baseSave==='function'){
  window.saveRoles=function(){
   var before=settings.roles;
   var r=baseSave.apply(this,arguments);
   try{
    if(settings.roles===before)return r;
    recordOptOut();
    if(typeof saveLocal==='function')saveLocal();
    if(typeof cloudSaveSettings==='function')cloudSaveSettings();
   }catch(e){}
   return r;
  };
 }

 /* ---------- run it: at parse time, and again on what the cloud sends ---------- */
 try{if(repair()&&typeof saveLocal==='function')saveLocal()}catch(e){}

 /* js/29 already re-applies the three version-gated migrations after syncCloud replaces
    `settings` wholesale. This wrapper is registered later, so its callback runs after
    js/29's and sees the result. */
 var baseSync=window.syncCloud;
 if(typeof baseSync==='function'){
  window.syncCloud=function(){
   var r=baseSync.apply(this,arguments);
   var done=function(){
    try{
     if(!repair())return;
     if(typeof saveLocal==='function')saveLocal();
     if(typeof applyRoleVisibility==='function')applyRoleVisibility();
     if(typeof renderAll==='function')renderAll();
     /* Push the corrected copy back so the shared row stops being wrong for every other
        device. It carries the repaired roles, so the next sync finds nothing to do. */
     if(typeof cloudSaveSettings==='function'){try{cloudSaveSettings()}catch(e){}}
    }catch(e){}
   };
   if(r&&typeof r.then==='function')r.then(done,done);
   else done();
   return r;
  };
 }
})();
