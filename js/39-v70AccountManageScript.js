/* Beta — the admin owns the login accounts: add, rename, re-password, delete.

   Asked for: "อยากให้ admin สามารถเพิ่ม Account เปลี่ยน User เปลี่ยน password ของทุกบัญชี
   ได้ แล้วก็สามารถลบบัญชีได้ด้วย อยากให้อยู่ในตั้งค่า/การจัดการบัญชีผู้ใช้".

   Until now the seven accounts were a `const STAFF` array in js/09 with SHA-256 hashes
   baked into the source. Adding a person meant editing and redeploying the site.

   WHERE THE ACCOUNTS LIVE NOW

   settings.uatAccounts       accounts the admin created
   settings.uatAccountEdits   changes to the seven built-ins, keyed by their original
                              username: a new hash, a new username, a new link, or
                              {deleted:true}

   Both are inside the existing settings object, so they need no new storage key, they are
   pushed to system_settings by cloudSaveSettings(), and every other device picks them up
   on its next sync. That matters: an account created on the office PC has to work on the
   technician's phone. mergeSettings() spreads `raw` wholesale, so unknown top-level keys
   survive it — checked, because a whitelist there is exactly what silently ate four
   permissions in an earlier session.

   The built-in array is never rewritten. Deleting a built-in records a tombstone; the
   admin can put it back. Deleting an account the admin created removes it outright,
   because there is nothing underneath to fall back to.

   WHY THE REGISTRY FUNCTIONS ARE REPLACED, NOT WRAPPED

   js/09's findAccount(), verify() and login() all call its own closure allAccounts() —
   not window.uatAuth.allAccounts. Replacing only the window view would leave a created
   account visible in every list and still unable to sign in, which is precisely the leak
   that let a deleted customer account keep signing in two sessions ago. So verify() and
   findAccount() are reimplemented here over the merged list. They are the two the local
   auth provider calls, so this is what actually decides who gets in.

   window.uatSubmitLogin — the legacy modal form — called the js/09 closure directly and
   would have bypassed all of this, so it is re-pointed at window.imodeSignIn, the same
   entry point the staff door uses.

   THREE THINGS THIS REFUSES TO DO

   1. Delete the account you are signed in as. You would still be holding a session for an
      account that no longer exists.
   2. Delete the last account that can reach this screen. There would then be no way back
      into account management on any device.
   3. Rename the account you are signed in as. currentUser.id is 'UAT-<username>' and the
      live session would stop matching the record it came from. Sign in as somebody else
      and rename it from there.

   Passwords go through the application's own policy (ImodeAuth.checkPasswordPolicy), the
   same one "change password" uses. The seven built-ins predate that policy and do not
   satisfy it — that is why they still work and a new one like them would be refused.

   A password an admin sets here is stored as a hash in settings and therefore applies on
   every device. A password the user changed themselves through "change password" is a
   per-device override in imode_v69_local_pw and wins locally, so setting a password here
   clears that override on this device. On another device that user's own change would
   still win until they sign in and change it again. */
(function(){
 'use strict';

 function tl(th,en){try{return (settings.language==='en')?en:th}catch(e){return th}}
 function esc2(v){return typeof window.esc==='function'?window.esc(v):String(v==null?'':v)}
 function toast(m){if(typeof window.toastMsg==='function')window.toastMsg(m)}
 function key(u){return String(u||'').trim().toLowerCase()}
 function reg(){return window.uatAuth||null}
 function hashOf(pw){var r=reg();return (r&&typeof r.hash==='function')?r.hash(pw):null}

 /* ------------------------------------------------------------------ the store -- */
 function store(){
  try{
   if(!Array.isArray(settings.uatAccounts))settings.uatAccounts=[];
   if(!settings.uatAccountEdits||typeof settings.uatAccountEdits!=='object')settings.uatAccountEdits={};
   return {added:settings.uatAccounts,edits:settings.uatAccountEdits};
  }catch(e){return {added:[],edits:{}}}
 }
 function persist(){
  try{if(typeof saveLocal==='function')saveLocal()}catch(e){}
  try{if(typeof cloudSaveSettings==='function')cloudSaveSettings()}catch(e){}
 }

 /* The seven from js/09, before anything here touched them. Captured as a function rather
    than a value because js/09 builds the list fresh each call. */
 var baseAll=null;
 function builtIns(){
  try{return (typeof baseAll==='function')?(baseAll.call(reg())||[]):[]}catch(e){return []}
 }

 function merged(){
  var st=store(),out=[],seen={};
  builtIns().forEach(function(a){
   var ed=st.edits[key(a.username)];
   if(ed&&ed.deleted)return;
   var row={};
   for(var k in a)if(Object.prototype.hasOwnProperty.call(a,k))row[k]=a[k];
   row.builtIn=true;
   row.originalUsername=a.username;
   if(ed){
    if(ed.username)row.username=ed.username;
    if(ed.hash)row.hash=ed.hash;
    if(ed.name)row.name=ed.name;
    if(ed.role)row.role=ed.role;
    if(typeof ed.team==='string')row.team=ed.team;
    if(typeof ed.technicianId==='string')row.technicianId=ed.technicianId;
    if(ed.accountType)row.accountType=ed.accountType;
   }
   out.push(row);
   seen[key(row.username)]=1;
  });
  st.added.forEach(function(a){
   if(!a||!a.username)return;
   if(seen[key(a.username)])return;         /* a created account never shadows a built-in */
   var row={};
   for(var k in a)if(Object.prototype.hasOwnProperty.call(a,k))row[k]=a[k];
   row.builtIn=false;
   out.push(row);
   seen[key(row.username)]=1;
  });
  return out;
 }
 function find(u){
  var k=key(u);
  return merged().filter(function(a){return key(a.username)===k})[0]||null;
 }
 function deletedBuiltIns(){
  var st=store();
  return builtIns().filter(function(a){var e=st.edits[key(a.username)];return !!(e&&e.deleted)});
 }

 /* ------------------------------------------------------- take over the registry -- */
 var r0=reg();
 if(r0){
  baseAll=r0.allAccounts;
  r0.allAccounts=function(){return merged()};
  r0.findAccount=function(u){return find(u)};
  r0.verify=function(username,password){
   var acc=find(username);
   if(!acc)return null;
   var h=hashOf(password);
   if(!h||h!==acc.hash)return null;
   return {account:acc,user:r0.accountToUser(acc)};
  };
  r0.login=function(username,password){
   var res=r0.verify(username,password);
   if(!res)return null;
   if(typeof r0.setSessionUser==='function')r0.setSessionUser(res.user);
   return res.account;
  };
 }
 /* The legacy modal form called the js/09 closure, which the lines above cannot reach.
    Sending it through the one sign-in entry point also gives it the lockout, expiry and
    audit trail every other door already had. */
 window.uatSubmitLogin=function(e){
  if(e&&e.preventDefault)e.preventDefault();
  var uEl=document.getElementById('uatLoginUser'),
      pEl=document.getElementById('uatLoginPass'),
      errEl=document.getElementById('uatLoginError');
  var u=uEl?uEl.value:'',p=pEl?pEl.value:'';
  if(typeof window.imodeSignIn!=='function')return;
  Promise.resolve(window.imodeSignIn(u,p)).then(function(res){
   var err=document.getElementById('uatLoginError');
   var pw=document.getElementById('uatLoginPass');
   if(res&&res.ok){
    if(typeof closeModal==='function')closeModal();
    if(typeof renderAll==='function')renderAll();
    return;
   }
   /* Looked up again rather than closed over: a failed sign-in can re-render the page. */
   if(err){err.textContent=(res&&res.message)||tl('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง','Incorrect username or password');err.classList.add('show')}
   if(pw){pw.value='';pw.focus()}
  });
 };

 /* --------------------------------------------------------------------- guards --- */
 function meUser(){try{return currentUser||null}catch(e){return null}}
 function meName(){var u=meUser();return u&&u.username?u.username:''}
 function roleCan(roleName,perm){
  try{
   var role=(settings.roles||[]).filter(function(r){return r.name===roleName})[0];
   return !!(role&&Array.isArray(role.permissions)&&role.permissions.indexOf(perm)>=0);
  }catch(e){return false}
 }
 function adminCapable(){
  return merged().filter(function(a){return roleCan(a.role,'users.manage')});
 }
 function checkPolicy(pw,username){
  try{
   if(window.ImodeAuth&&typeof window.ImodeAuth.checkPasswordPolicy==='function')
    return window.ImodeAuth.checkPasswordPolicy(pw,username);
  }catch(e){}
  return (String(pw||'').length>=8)?{ok:true}:{ok:false,message:tl('รหัสผ่านอย่างน้อย 8 ตัวอักษร','At least 8 characters')};
 }

 /* ----------------------------------------------------------------- operations --- */
 function setEdit(original,patch){
  var st=store(),k=key(original);
  st.edits[k]=Object.assign({},st.edits[k]||{},patch);
 }

 window.imodeAccountSave=function(originalUsername,data){
  var acc=originalUsername?find(originalUsername):null;
  var uname=String(data.username||'').trim();
  if(!uname)return {ok:false,message:tl('กรุณากรอกชื่อผู้ใช้','Please enter a username')};
  if(/\s/.test(uname))return {ok:false,message:tl('ชื่อผู้ใช้ต้องไม่มีช่องว่าง','A username cannot contain spaces')};
  var clash=find(uname);
  if(clash&&(!acc||key(clash.username)!==key(acc.username)))
   return {ok:false,message:tl('มีชื่อผู้ใช้นี้อยู่แล้ว','That username already exists')};
  if(acc&&key(acc.username)===key(meName())&&key(uname)!==key(acc.username))
   return {ok:false,message:tl('เปลี่ยนชื่อผู้ใช้ของบัญชีที่กำลังใช้งานอยู่ไม่ได้ กรุณาเข้าสู่ระบบด้วยบัญชีอื่นก่อน',
                               'You cannot rename the account you are signed in as. Sign in as somebody else first.')};
  if(data.accountType==='technician'&&!String(data.technicianId||'').trim())
   return {ok:false,message:tl('บัญชีช่างต้องเลือกระเบียนช่าง','A technician account must be linked to a technician record')};

  var hash=null;
  var pw=String(data.password||'');
  if(pw){
   var pol=checkPolicy(pw,uname);
   if(!pol.ok)return {ok:false,message:pol.message||tl('รหัสผ่านไม่ผ่านเงื่อนไข','Password rejected')};
   hash=hashOf(pw);
   if(!hash)return {ok:false,message:tl('เข้ารหัสรหัสผ่านไม่สำเร็จ','Could not hash the password')};
  }else if(!acc){
   return {ok:false,message:tl('บัญชีใหม่ต้องตั้งรหัสผ่าน','A new account needs a password')};
  }

  var fields={username:uname,name:String(data.name||'').trim(),role:data.role||'',
    team:String(data.team||''),accountType:data.accountType||'staff',
    technicianId:data.accountType==='technician'?String(data.technicianId||'').trim():''};

  if(!acc){
   var row=Object.assign({},fields,{hash:hash,createdAt:new Date().toISOString(),createdBy:meName()});
   store().added.push(row);
  }else if(acc.builtIn){
   var patch=Object.assign({},fields);
   if(hash)patch.hash=hash;
   setEdit(acc.originalUsername,patch);
  }else{
   var st=store();
   for(var i=0;i<st.added.length;i++){
    if(key(st.added[i].username)!==key(acc.username))continue;
    st.added[i]=Object.assign({},st.added[i],fields);
    if(hash)st.added[i].hash=hash;
    break;
   }
  }
  /* A device-local "change password" override would otherwise keep winning here. */
  if(hash&&window.ImodeAuthLocal&&typeof window.ImodeAuthLocal.resetLocalOverride==='function'){
   try{window.ImodeAuthLocal.resetLocalOverride(uname);window.ImodeAuthLocal.resetLocalOverride(acc?acc.username:uname)}catch(e){}
  }
  persist();
  return {ok:true};
 };

 window.imodeAccountDelete=function(username){
  var acc=find(username);
  if(!acc)return {ok:false,message:tl('ไม่พบบัญชีนี้','No such account')};
  if(key(acc.username)===key(meName()))
   return {ok:false,message:tl('ลบบัญชีที่กำลังใช้งานอยู่ไม่ได้','You cannot delete the account you are signed in as')};
  var admins=adminCapable();
  if(admins.length<=1&&admins.filter(function(a){return key(a.username)===key(acc.username)}).length)
   return {ok:false,message:tl('นี่คือบัญชีสุดท้ายที่เข้าหน้าจัดการบัญชีได้ ลบไม่ได้',
                               'This is the last account that can reach account management')};
  if(acc.builtIn)setEdit(acc.originalUsername,{deleted:true});
  else{
   var st=store();
   settings.uatAccounts=st.added.filter(function(a){return key(a.username)!==key(acc.username)});
  }
  persist();
  return {ok:true};
 };

 window.imodeAccountRestore=function(originalUsername){
  var st=store(),k=key(originalUsername);
  if(st.edits[k])delete st.edits[k].deleted;
  persist();
  return {ok:true};
 };

 window.imodeAccountList=merged;

 /* ------------------------------------------------------------------- the screen -- */
 function techOptions(sel){
  var list=[];
  try{list=Array.isArray(technicians)?technicians:[]}catch(e){}
  return '<option value="">'+esc2(tl('— เลือกระเบียนช่าง —','— pick a technician record —'))+'</option>'
   +list.map(function(t){
    return '<option value="'+esc2(t.id)+'"'+(t.id===sel?' selected':'')+'>'
     +esc2(t.name)+' · '+esc2(t.id)+' · '+esc2(t.team||'Technical')+'</option>';
   }).join('');
 }
 function roleOptions(sel){
  var list=[];
  try{list=(settings.roles||[]).map(function(r){return r.name})}catch(e){}
  if(sel&&list.indexOf(sel)<0)list.push(sel);
  return list.map(function(n){
   return '<option value="'+esc2(n)+'"'+(n===sel?' selected':'')+'>'+esc2(n)+'</option>';
  }).join('');
 }
 function formHTML(acc){
  var a=acc||{accountType:'technician',team:'Technical'};
  var isMe=acc&&key(acc.username)===key(meName());
  return '<form class="acctmg-form" data-original="'+esc2(acc?acc.username:'')+'">'
   +'<div class="acctmg-grid">'
   +'<label><span>'+esc2(tl('ชื่อผู้ใช้','Username'))+' *</span>'
   +'<input name="username" value="'+esc2(a.username||'')+'" autocomplete="off"'+(isMe?' disabled':'')+'></label>'
   +'<label><span>'+esc2(tl('ชื่อที่แสดง','Display name'))+'</span>'
   +'<input name="name" value="'+esc2(a.name||'')+'" autocomplete="off"></label>'
   +'<label><span>'+esc2(tl('ประเภทบัญชี','Account type'))+'</span>'
   +'<select name="accountType">'
   +'<option value="technician"'+(a.accountType==='technician'?' selected':'')+'>'+esc2(tl('ช่าง','Technician'))+'</option>'
   +'<option value="staff"'+(a.accountType!=='technician'?' selected':'')+'>'+esc2(tl('พนักงานสำนักงาน','Office staff'))+'</option>'
   +'</select></label>'
   +'<label><span>'+esc2(tl('บทบาท / สิทธิ์','Role'))+'</span>'
   +'<select name="role">'+roleOptions(a.role||'')+'</select></label>'
   +'<label><span>'+esc2(tl('ทีม','Team'))+'</span>'
   +'<select name="team">'
   +'<option value="Technical"'+(a.team==='Technical'?' selected':'')+'>Technical</option>'
   +'<option value="R&D"'+(a.team==='R&D'?' selected':'')+'>R&amp;D</option>'
   +'<option value="Admin"'+(a.team==='Admin'?' selected':'')+'>Admin</option>'
   +'</select></label>'
   +'<label class="acctmg-tech"><span>'+esc2(tl('ผูกกับระเบียนช่าง','Technician record'))+'</span>'
   +'<select name="technicianId">'+techOptions(a.technicianId||'')+'</select></label>'
   +'<label class="acctmg-wide"><span>'
   +esc2(acc?tl('รหัสผ่านใหม่ (เว้นว่างไว้ถ้าไม่เปลี่ยน)','New password (leave blank to keep it)')
             :tl('รหัสผ่าน','Password'))+(acc?'':' *')+'</span>'
   +'<input name="password" type="text" autocomplete="new-password" placeholder="'
   +esc2(tl('อย่างน้อย 8 ตัว มีตัวอักษรและตัวเลข','At least 8 characters, letters and digits'))+'"></label>'
   +'</div>'
   +(isMe?'<p class="acctmg-note">'+esc2(tl('นี่คือบัญชีที่คุณกำลังใช้งานอยู่ จึงเปลี่ยนชื่อผู้ใช้ไม่ได้',
                                            'This is the account you are signed in as, so its username is locked'))+'</p>':'')
   +'<div class="acctmg-actions">'
   +'<button type="button" class="acctmg-btn" data-act="cancel">'+esc2(tl('ยกเลิก','Cancel'))+'</button>'
   +'<button type="submit" class="acctmg-btn is-primary">'+esc2(acc?tl('บันทึก','Save'):tl('เพิ่มบัญชี','Add account'))+'</button>'
   +'</div></form>';
 }
 function rowHTML(a){
  var me=key(a.username)===key(meName());
  var link=a.accountType==='technician'
   ? esc2(tl('ช่าง ','Technician '))+esc2(a.technicianId||'-')
   : esc2(tl('ไม่ผูกกับระเบียนช่าง','Not linked to a technician'));
  return '<div class="acctmg-row'+(me?' is-current':'')+'" data-user="'+esc2(a.username)+'">'
   +'<div class="acctmg-id"><b>'+esc2(a.username)+'</b>'
   +(me?'<i>'+esc2(tl('ใช้งานอยู่','signed in'))+'</i>':'')
   +(a.builtIn?'':'<u>'+esc2(tl('สร้างเอง','created'))+'</u>')
   +'<small>'+link+'</small></div>'
   +'<span class="acctmg-role">'+esc2(a.role||'-')+'</span>'
   +'<span class="acctmg-team">'+esc2(a.team||'-')+'</span>'
   +'<div class="acctmg-ops">'
   +'<button type="button" class="acctmg-mini" data-act="edit">'+esc2(tl('แก้ไข','Edit'))+'</button>'
   +'<button type="button" class="acctmg-mini is-danger" data-act="del"'+(me?' disabled':'')+'>'
   +esc2(tl('ลบ','Delete'))+'</button>'
   +'</div><div class="acctmg-slot"></div></div>';
 }
 function boxHTML(){
  var list=merged(),gone=deletedBuiltIns();
  return '<div class="acctmg-box">'
   +'<div class="acctmg-head"><div><b>'+esc2(tl('บัญชีเข้าสู่ระบบ','Login accounts'))+' ('+list.length+')</b>'
   +'<small>'+esc2(tl('เพิ่ม เปลี่ยนชื่อผู้ใช้ เปลี่ยนรหัสผ่าน และลบบัญชีได้ที่นี่ · แก้สิทธิ์ของแต่ละบทบาทที่ ผู้ใช้งานและสิทธิ์',
                     'Add, rename, re-password and delete here · change what each role may do in Users & permissions'))+'</small></div>'
   +'<button type="button" class="acctmg-btn is-primary" data-act="new">＋ '+esc2(tl('เพิ่มบัญชี','Add account'))+'</button></div>'
   +'<div class="acctmg-newslot"></div>'
   +'<div class="acctmg-list">'+list.map(rowHTML).join('')+'</div>'
   +(gone.length?'<div class="acctmg-gone"><b>'+esc2(tl('บัญชีที่ลบไปแล้ว','Deleted accounts'))+'</b>'
     +gone.map(function(a){
      return '<button type="button" class="acctmg-mini" data-act="restore" data-user="'+esc2(a.username)+'">'
       +esc2(tl('คืนค่า ','Restore '))+esc2(a.username)+'</button>';
     }).join('')+'</div>':'')
   +'</div>';
 }

 function readForm(form){
  function v(n){var el=form.querySelector('[name="'+n+'"]');return el?el.value:''}
  return {username:v('username'),name:v('name'),accountType:v('accountType'),
          role:v('role'),team:v('team'),technicianId:v('technicianId'),password:v('password')};
 }
 function refresh(){
  var box=document.querySelector('#modalBody .acctmg-box');
  if(!box)return;
  box.outerHTML=boxHTML();
  syncTypeFields();
 }
 /* The technician link only means something for a technician account. Hidden rather than
    removed so the form can be read back without branching. */
 function syncTypeFields(){
  [].slice.call(document.querySelectorAll('#modalBody .acctmg-form')).forEach(function(f){
   var t=f.querySelector('[name="accountType"]'),cell=f.querySelector('.acctmg-tech');
   if(!t||!cell)return;
   cell.style.display=(t.value==='technician')?'':'none';
  });
 }

 function wire(){
  var b=document.getElementById('modalBody');
  if(!b||b.__acctmgWired)return;
  b.__acctmgWired=true;
  b.addEventListener('click',function(e){
   var t=e.target;
   if(!t||!t.closest)return;
   var act=t.closest('[data-act]');
   if(!act||!b.contains(act))return;
   var a=act.getAttribute('data-act');
   if(a==='new'){
    var slot=b.querySelector('.acctmg-newslot');
    if(slot)slot.innerHTML=slot.innerHTML?'':formHTML(null);
    syncTypeFields();
    return;
   }
   if(a==='restore'){
    window.imodeAccountRestore(act.getAttribute('data-user'));
    toast(tl('คืนค่าบัญชีแล้ว','Account restored'));
    refresh();
    return;
   }
   var row=act.closest('.acctmg-row');
   if(!row)return;
   var user=row.getAttribute('data-user');
   if(a==='edit'){
    var s=row.querySelector('.acctmg-slot');
    if(s)s.innerHTML=s.innerHTML?'':formHTML(find(user));
    syncTypeFields();
   }else if(a==='del'){
    if(!confirm(tl('ลบบัญชี ','Delete the account ')+user+tl(' ใช่หรือไม่?','?')))return;
    var res=window.imodeAccountDelete(user);
    toast(res.ok?tl('ลบบัญชีแล้ว','Account deleted'):res.message);
    if(res.ok)refresh();
   }else if(a==='cancel'){
    var f=act.closest('.acctmg-form');
    if(f)f.parentElement.innerHTML='';
   }
  });
  b.addEventListener('change',function(e){
   if(e.target&&e.target.name==='accountType')syncTypeFields();
  });
  b.addEventListener('submit',function(e){
   var f=e.target;
   if(!f||!f.classList||!f.classList.contains('acctmg-form'))return;
   e.preventDefault();
   var original=f.getAttribute('data-original')||'';
   var data=readForm(f);
   /* A disabled input is not read back, so the locked username is restored here. */
   if(original&&!data.username)data.username=original;
   var res=window.imodeAccountSave(original,data);
   toast(res.ok?(original?tl('บันทึกบัญชีแล้ว','Account saved'):tl('เพิ่มบัญชีแล้ว','Account added')):res.message);
   if(res.ok)refresh();
  });
 }

 var baseAdmin=window.openAccountAdminModal;
 if(typeof baseAdmin==='function'){
  window.openAccountAdminModal=function(){
   var r=baseAdmin.apply(this,arguments);
   var b=document.getElementById('modalBody');
   if(!b)return r;
   /* js/33 renders a read-only table; this replaces it in place so there is one list. */
   var old=b.querySelector('.acctadm-box');
   if(old)old.outerHTML=boxHTML();
   else b.insertAdjacentHTML('afterbegin',boxHTML());
   wire();
   syncTypeFields();
   return r;
  };
 }

 var st2=document.createElement('style');
 st2.id='v70AccountManageStyle';
 st2.textContent=''
 +'.acctmg-box{border:1px solid #d8e2f2;border-radius:14px;padding:13px;margin-bottom:14px;'
 +'background:linear-gradient(180deg,#f7faff,#fff)}'
 +'.acctmg-head{display:flex;align-items:flex-start;gap:10px}'
 +'.acctmg-head>div{flex:1;min-width:0}'
 +'.acctmg-head b{display:block;font-size:13.5px;color:#0c225e}'
 +'.acctmg-head small{display:block;font-size:11px;color:#6f81a3;margin-top:2px;line-height:1.5}'
 +'.acctmg-list{margin-top:10px;display:grid;gap:6px}'
 +'.acctmg-row{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr) 80px auto;'
 +'align-items:center;gap:8px;padding:9px 11px;border:1px solid #e2eaf7;border-radius:11px;background:#fff}'
 +'.acctmg-row.is-current{border-color:#079455;background:#f4fcf8}'
 +'.acctmg-id{min-width:0}'
 +'.acctmg-id b{font-size:12.5px;color:#12356f;word-break:break-all}'
 +'.acctmg-id i{font-style:normal;font-size:9.5px;font-weight:800;color:#079455;margin-left:6px}'
 +'.acctmg-id u{text-decoration:none;font-size:9.5px;font-weight:800;color:#9a4c07;margin-left:6px;'
 +'background:#fff2e2;border-radius:99px;padding:1px 7px}'
 +'.acctmg-id small{display:block;font-size:10.5px;color:#7d8ca7;margin-top:1px}'
 +'.acctmg-role,.acctmg-team{font-size:11px;color:#41567c;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
 +'.acctmg-ops{display:flex;gap:6px}'
 +'.acctmg-slot{grid-column:1/-1}'
 +'.acctmg-slot:empty{display:none}'
 +'.acctmg-newslot:empty{display:none}'
 +'.acctmg-newslot{margin-top:10px}'
 +'.acctmg-mini{border:1px solid #cfe0fa;background:#fff;color:#0b63e5;border-radius:9px;'
 +'padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap}'
 +'.acctmg-mini:hover{background:#eaf3ff}'
 +'.acctmg-mini.is-danger{color:#c02626;border-color:#f3cdcd}'
 +'.acctmg-mini.is-danger:hover{background:#fdeeee}'
 +'.acctmg-mini[disabled]{opacity:.42;cursor:not-allowed}'
 +'.acctmg-form{margin-top:9px;padding:11px;border:1px dashed #c9dcf6;border-radius:11px;background:#f4f9ff}'
 +'.acctmg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:9px}'
 +'.acctmg-grid label{display:flex;flex-direction:column;gap:4px;min-width:0}'
 +'.acctmg-grid label.acctmg-wide{grid-column:1/-1}'
 +'.acctmg-grid span{font-size:10.5px;font-weight:700;color:#41567c}'
 +'.acctmg-grid input,.acctmg-grid select{width:100%;padding:8px 10px;border:1px solid #d3e0f4;'
 +'border-radius:9px;font-size:12.5px;font-family:inherit;background:#fff;color:#12233f}'
 +'.acctmg-grid input[disabled]{background:#eef2f8;color:#7d8ca7}'
 +'.acctmg-note{margin:8px 0 0;font-size:10.5px;color:#9a4c07}'
 +'.acctmg-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}'
 +'.acctmg-btn{border:1px solid #cfe0fa;background:#fff;color:#12233f;border-radius:10px;'
 +'padding:8px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap}'
 +'.acctmg-btn.is-primary{border-color:transparent;color:#fff;'
 +'background:linear-gradient(180deg,#ff9a4d,#f2711c);box-shadow:0 4px 0 #c9560f}'
 +'.acctmg-btn.is-primary:active{box-shadow:0 1px 0 #c9560f;transform:translateY(3px)}'
 +'.acctmg-gone{margin-top:11px;padding-top:10px;border-top:1px dashed #d8e4f6;display:flex;'
 +'flex-wrap:wrap;align-items:center;gap:7px}'
 +'.acctmg-gone b{font-size:11px;color:#7385a5;margin-right:3px}'
 +'@media (max-width:640px){'
 +'.acctmg-row{grid-template-columns:1fr auto;row-gap:6px}'
 +'.acctmg-role,.acctmg-team{grid-column:1/-1}'
 +'.acctmg-grid{grid-template-columns:1fr}}';
 document.head.appendChild(st2);
})();
