/* V6.9 — make Settings → ผู้ใช้งานและสิทธิ์ usable.

   The editor itself was never broken: saveRoles() writes settings.roles and
   settings.userPermissions correctly, and enforcement has been on since js/12. What was
   broken was reaching it. The modal rendered every role and every user as a full card of
   43 checkboxes at once — measured at 23,511 px tall on a 1440x1000 screen — with the
   save button at the very bottom. An admin had to scroll roughly 27 screens to save a
   single tick, which is why it read as "the permission page does not work".

   This script does not rewrite the editor. It reorganises the modal the base function
   already produced:

     1. One role at a time, chosen from a tab strip. Every card stays in the DOM, only
        hidden, because saveRoles() collects them with
        #roleList .role-card:not(.user-permission-card) — a card that is removed from the
        DOM is a role that is deleted on save.
     2. One user at a time, chosen from a dropdown, for the same reason.
     3. The real login accounts are added to the individual list. allLoginUsers() in js/03
        returns the eight hard-coded demoUsers plus whoever is signed in, so the accounts
        an admin actually manages — technician_test1, lead_technical … — could not be
        given an individual permission at all. Cards are cloned from the one the base
        function rendered, so there is one template, not two.
     4. A save bar that sticks to the bottom of the modal.
     5. A guard before saving: removing settings.manage from your own role locks you out
        of this screen, so it asks first.

   Nothing is written here. saveRoles(), canPermission() and the storage keys are the
   originals. */
(function(){
 'use strict';


 /* ---------- 0. repair the permissions mergeSettings() strips on every load ----------
    normalizeRoleSetting() -> migrateLegacyPermissions() runs inside mergeSettings() at
    js/03 line 140 and does

        text.filter(x => allPermissionKeys().includes(x))

    which silently drops every saved permission whose key is not in PERMISSION_CATALOG
    *at that moment*. js/12 registers onsite.view / parts.view / pettycash.view and js/16
    registers mywork.view, and both run after js/03 — so those four keys are stripped from
    every role on every single page load. Their migrations put them back, but each is
    guarded by a version flag, so only the *first* load repaired them; from the second load
    onward Onsite, Spare Parts, Petty Cash and งานของฉัน quietly became unreachable for
    everyone, Admin included. Measured: Admin 33 permissions on load #1, 30 on load #2.

    The fix reads what was actually saved and puts back only the keys the catalog now
    knows. A permission an admin genuinely unticked is not in storage either, so it stays
    off — this restores, it never grants.

    Any future script that pushes to PERMISSION_CATALOG must load BEFORE this one, or its
    keys will keep being stripped. */
 function repairStrippedRolePermissions(){
  /* The snapshot js/01 took before any script could save; localStorage is only a fallback
     for the case where that file did not run. Reading storage here is not enough on its
     own — several patch scripts call saveLocal() while booting, and by the time this runs
     storage can already hold the stripped set. */
  var raw=window.imodeSettingsSnapshot;
  if(!raw){try{raw=JSON.parse(localStorage.getItem('imode_v5_settings')||'{}')}catch(e){return 0}}
  var saved=Array.isArray(raw.roles)?raw.roles:[];
  if(!saved.length)return 0;
  var known={};
  try{allPermissionKeys().forEach(function(k){known[k]=1})}catch(e){return 0}
  var restored=0;
  (settings.roles||[]).forEach(function(r){
   var s=saved.filter(function(x){return String(x.name||'')===String(r.name||'')})[0];
   if(!s||!Array.isArray(s.permissions))return;
   r.permissions=Array.isArray(r.permissions)?r.permissions:[];
   s.permissions.forEach(function(k){
    if(known[k]&&r.permissions.indexOf(k)<0){r.permissions.push(k);restored++}
   });
  });
  if(restored&&typeof saveLocal==='function')saveLocal();
  return restored;
 }
 window.imodeRepairRolePermissions=repairStrippedRolePermissions;
 if(repairStrippedRolePermissions()){
  if(typeof applyRoleVisibility==='function')applyRoleVisibility();
 }

 function th(){try{return settings.language!=='en'}catch(e){return true}}
 function tl(t,e){return th()?t:e}
 function esc2(v){return typeof window.esc==='function'?window.esc(v):String(v==null?'':v)}

 /* ---------- accounts that can actually sign in ---------- */
 function loginAccounts(){
  try{
   if(window.uatAuth&&typeof window.uatAuth.allAccounts==='function')return window.uatAuth.allAccounts()||[];
  }catch(e){}
  return [];
 }
 function accountUser(a){
  /* Same shape allLoginUsers() hands userPermissionCard(), and the same key
     permissionUserKey() builds: id first, name second. */
  try{
   if(window.uatAuth&&typeof window.uatAuth.accountToUser==='function'){
    var u=window.uatAuth.accountToUser(a);
    if(u&&(u.id||u.name))return u;
   }
  }catch(e){}
  return {id:'UAT-'+a.username,name:a.name||a.username,role:a.role||'',team:a.team||''};
 }

 /* ---------- the one place that knows the card markup is the base function ---------- */
 function cloneUserCard(template,user,key){
  var card=template.cloneNode(true);
  card.dataset.userKey=key;
  var inputs=card.querySelectorAll('.role-card-head input[readonly]');
  if(inputs[0])inputs[0].value=user.name||user.id||key;
  if(inputs[1])inputs[1].value=user.permissionRole||user.role||'-';
  if(inputs[2])inputs[2].value=user.team||'-';
  var entry=null;
  try{entry=(settings.userPermissions||{})[key]||null}catch(e){}
  var perms=(entry&&Array.isArray(entry.permissions))?entry.permissions:[];
  var enabled=!!(entry&&entry.enabled);
  card.querySelectorAll('[data-user-perm]').forEach(function(cb){
   cb.checked=perms.indexOf(cb.dataset.userPerm)>=0;
  });
  var toggle=card.querySelector('[data-user-enable]');
  if(toggle)toggle.checked=enabled;
  var mode=card.querySelector('.role-auto-count b');
  if(mode)mode.textContent=enabled?tl('รายบุคคล','Individual'):tl('ตาม Role','By role');
  var count=card.querySelector('[data-user-perm-summary]');
  if(count)count.textContent=perms.length+'/'+card.querySelectorAll('[data-user-perm]').length+' '+tl('สิทธิ์','permissions');
  return card;
 }

 function addMissingAccounts(list){
  var template=list.querySelector('.user-permission-card');
  if(!template)return;
  var have={};
  [].slice.call(list.querySelectorAll('.user-permission-card')).forEach(function(c){have[c.dataset.userKey]=true});
  loginAccounts().forEach(function(a){
   var u=accountUser(a);
   var key=String(u.id||u.name||'').trim();
   if(!key||have[key])return;
   have[key]=true;
   list.appendChild(cloneUserCard(template,u,key));
  });
 }

 /* ---------- generic one-at-a-time switcher ---------- */
 function show(cards,i){
  cards.forEach(function(c,j){c.style.display=(j===i)?'':'none'});
 }

 function roleLabel(card,i){
  var n=card.querySelector('[data-k=name]');
  var name=(n&&String(n.value||'').trim())||tl('บทบาทที่ '+(i+1),'Role '+(i+1));
  var on=card.querySelectorAll('[data-perm]:checked').length;
  return {name:name,count:on};
 }

 function buildRoleTabs(host,roleList){
  var cards=[].slice.call(roleList.querySelectorAll('.role-card:not(.user-permission-card)'));
  var active=Math.max(0,cards.indexOf(cards.filter(function(c){return c.style.display!=='none'})[0]));
  host.innerHTML='';
  cards.forEach(function(card,i){
   var info=roleLabel(card,i);
   var b=document.createElement('button');
   b.type='button';
   b.className='permx-tab';
   b.setAttribute('aria-pressed',String(i===active));
   b.innerHTML='<b>'+esc2(info.name)+'</b><small>'+info.count+' '+esc2(tl('สิทธิ์','perms'))+'</small>';
   b.onclick=function(){
    show(cards,i);
    [].slice.call(host.children).forEach(function(x,j){x.setAttribute('aria-pressed',String(j===i))});
   };
   host.appendChild(b);
  });
  show(cards,active);
  return cards;
 }

 function userOptionLabel(card){
  var n=card.querySelector('.role-card-head input[readonly]');
  var on=card.querySelectorAll('[data-user-perm]:checked').length;
  var ind=card.querySelector('[data-user-enable]');
  var tag=(ind&&ind.checked)?tl(' · รายบุคคล '+on,' · individual '+on):tl(' · ตาม Role',' · by role');
  return ((n&&n.value)||card.dataset.userKey)+tag;
 }
 /* Built once. Rebuilding it on every tick would reset the dropdown to the first user and
    throw the admin out of the card they are editing; only the label is refreshed. */
 function buildUserPicker(host,list){
  var cards=[].slice.call(list.querySelectorAll('.user-permission-card'));
  if(!cards.length)return;
  var sel=document.createElement('select');
  sel.className='permx-userpick';
  cards.forEach(function(card,i){
   var o=document.createElement('option');
   o.value=String(i);
   o.textContent=userOptionLabel(card);
   sel.appendChild(o);
  });
  sel.onchange=function(){show(cards,Number(sel.value)||0)};
  host.appendChild(sel);
  show(cards,0);
  sel.value='0';
  list.addEventListener('change',function(e){
   var card=e.target&&e.target.closest&&e.target.closest('.user-permission-card');
   if(!card)return;
   var i=cards.indexOf(card);
   if(i>=0&&sel.options[i])sel.options[i].textContent=userOptionLabel(card);
  });
 }

 /* ---------- the rearrangement ---------- */
 function enhance(){
  var bodyEl=document.getElementById('modalBody');
  var roleList=document.getElementById('roleList');
  if(!bodyEl||!roleList||bodyEl.querySelector('.permx-tabs'))return;

  /* role tabs */
  var tabs=document.createElement('div');
  tabs.className='permx-tabs';
  tabs.id='permxRoleTabs';
  /* A role name is data, not a UI label. applyLanguageTo() walks the modal on a timeout
     after openModal() and would translate "Technician" to "ช่าง" on the tab while the
     card it selects still says Technician. data-no-i18n is the opt-out it already has. */
  tabs.setAttribute('data-no-i18n','true');
  roleList.parentNode.insertBefore(tabs,roleList);
  var hint=document.createElement('div');
  hint.className='permx-hint';
  hint.textContent=tl('เลือกบทบาทที่ต้องการแก้ไข แล้วติ๊กสิทธิ์ด้านล่าง — แก้ได้ทีละบทบาท แต่กด "บันทึกสิทธิ์ทั้งหมด" ครั้งเดียวบันทึกทุกบทบาท',
                      'Pick a role, tick its permissions below. You edit one role at a time; one Save writes them all.');
  roleList.parentNode.insertBefore(hint,tabs);
  buildRoleTabs(tabs,roleList);

  /* the tab label has to follow the name field and the tick count */
  roleList.addEventListener('input',function(e){
   if(e.target&&e.target.matches('[data-k=name]'))buildRoleTabs(tabs,roleList);
  });
  roleList.addEventListener('change',function(e){
   if(e.target&&e.target.matches('[data-perm]'))buildRoleTabs(tabs,roleList);
  });
  /* Add Role inserts a card and the inline Delete button removes one; watching the list
     covers both without wrapping either. */
  try{
   new MutationObserver(function(){buildRoleTabs(tabs,roleList)})
    .observe(roleList,{childList:true});
  }catch(e){}

  /* individual permissions */
  var userList=document.getElementById('userPermissionList');
  if(userList){
   addMissingAccounts(userList);
   var pick=document.createElement('div');
   pick.className='permx-userpick-wrap';
   pick.setAttribute('data-no-i18n','true');
   pick.innerHTML='<label>'+esc2(tl('เลือกผู้ใช้งาน','Choose a user'))+'</label>';
   userList.parentNode.insertBefore(pick,userList);
   buildUserPicker(pick,userList);
   var badge=document.querySelector('.user-permission-badge');
   if(badge)badge.textContent=userList.querySelectorAll('.user-permission-card').length+' '+tl('บัญชี','accounts');
  }

  /* the save bar */
  var row=bodyEl.querySelector('.button-row');
  if(row){
   var bar=document.createElement('div');
   bar.className='permx-savebar';
   row.parentNode.insertBefore(bar,row);
   bar.appendChild(row);
  }
 }

 var baseOpen=window.openRolesSettingModal;
 if(typeof baseOpen==='function'){
  window.openRolesSettingModal=function(){
   var r=baseOpen.apply(this,arguments);
   try{enhance()}catch(e){}
   return r;
  };
 }

 /* ---------- do not let an admin lock themselves out ---------- */
 var baseSave=window.saveRoles;
 if(typeof baseSave==='function'){
  window.saveRoles=function(){
   var roleList=document.getElementById('roleList');
   if(roleList){
    var mine='';
    try{mine=(typeof currentRoleConfig==='function'&&(currentRoleConfig()||{}).name)||''}catch(e){}
    if(mine){
     var card=[].slice.call(roleList.querySelectorAll('.role-card:not(.user-permission-card)'))
      .filter(function(c){var n=c.querySelector('[data-k=name]');return n&&String(n.value||'').trim()===mine})[0];
     if(card){
      var keep=card.querySelector('[data-perm="settings.manage"]');
      if(keep&&!keep.checked){
       var ok=window.confirm(tl(
        'บทบาท "'+mine+'" ของคุณกำลังจะไม่มีสิทธิ์ "แก้ไขตั้งค่าระบบ" (settings.manage)\nถ้าบันทึก คุณจะเปิดหน้าตั้งค่าและหน้ากำหนดสิทธิ์นี้ไม่ได้อีก\n\nต้องการบันทึกต่อหรือไม่?',
        'Your role "'+mine+'" is about to lose settings.manage.\nAfter saving you will not be able to open Settings, or this permission screen, again.\n\nSave anyway?'));
       if(!ok)return;
      }
     }
    }
   }
   return baseSave.apply(this,arguments);
  };
 }

 /* ---------- styles ---------- */
 var st=document.createElement('style');
 st.id='v69PermissionEditorStyle';
 st.textContent=''
 +'.permx-hint{margin:10px 0 8px;padding:9px 12px;border-radius:12px;background:#f2f7ff;border:1px solid #dae7fa;color:#3d557f;font-size:12px;line-height:1.5}'
 +'.permx-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}'
 +'.permx-tab{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:132px;padding:9px 13px;border:1px solid #d7e3f5;border-radius:12px;background:linear-gradient(180deg,#fff,#f3f7ff);cursor:pointer;text-align:left;box-shadow:0 3px 0 #e4ecf9;transition:transform .14s ease,box-shadow .14s ease,border-color .14s ease}'
 +'.permx-tab b{font-size:13px;color:#0c225e;font-weight:700}'
 +'.permx-tab small{font-size:10.5px;color:#6f81a3}'
 +'.permx-tab:hover{transform:translateY(-2px);border-color:#a9cdf7;box-shadow:0 5px 0 #dce8f9}'
 +'.permx-tab:active{transform:translateY(2px);box-shadow:0 1px 0 #dce8f9}'
 +'.permx-tab[aria-pressed="true"]{border-color:#0b63e5;background:linear-gradient(180deg,#eaf3ff,#dcebff);box-shadow:0 3px 0 #b9d5fb}'
 +'.permx-tab[aria-pressed="true"] b{color:#0b63e5}'
 +'.permx-userpick-wrap{margin:10px 0}'
 +'.permx-userpick-wrap label{display:block;font-size:11.5px;color:#5b6b88;margin-bottom:5px;font-weight:700}'
 +'.permx-userpick{width:100%;max-width:420px;padding:10px 12px;border:1px solid #d3e0f4;border-radius:12px;font-size:13px;background:#fff}'
 +'.permx-savebar{position:sticky;bottom:0;z-index:5;margin:14px -4px -4px;padding:12px 4px;background:linear-gradient(180deg,rgba(255,255,255,.72),#fff 42%);border-top:1px solid #e2ecfb}'
 +'.permx-savebar .button-row{margin:0}'
 +'@media (max-width:640px){.permx-tab{min-width:calc(50% - 4px);flex:1 1 calc(50% - 4px)}.permx-userpick{max-width:100%}}';
 document.head.appendChild(st);
})();
