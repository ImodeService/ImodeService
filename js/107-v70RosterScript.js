/* Beta 1.0 — 2026-09-23: the account roster is nine people, and only nine.
   Given by the owner, with the real names and the role each one holds. Everything else is
   removed: the UAT logins (admin_test, technician_test1/2, tech_test1) and anything left over
   from earlier migrations.

   THE RULE THAT KEEPS THIS SAFE: an account is a door and can be deleted freely, but a
   TECHNICIAN RECORD is what cases, service reports and QC are attributed by. The owner has
   confirmed that the work still hanging off the records being removed is UAT data and is to go
   with them, so tidyRecords() deletes the cases too — except where a case's crew still holds a
   record we are KEEPING, in which case the case stays and only the dead id is stripped out. */
(function(){
 'use strict';
 if(typeof settings!=='object')return;
 if(!window.uatAuth||typeof window.uatAuth.hash!=='function')return;

 /* 2 — the records that still carried work are now deleted with their cases, on the owner's
    instruction. A device that already ran version 1 kept those records, so this has to run
    again there; bump it to re-run the whole roster repair once on every device. */
 var VERSION=2;

 /* username, PASSWORD HASH, display name, role, and the technician record when they hold one.
    lead_technician / lead_rd keep the usernames they already sign in with.

    2026-09-23 — THE PLAINTEXT PASSWORDS ARE NOT IN THIS FILE ANY MORE. They were, and this
    repository is public on GitHub, so every staff password was readable by anyone who opened
    the raw file. `h` is the SHA-256 hex of the password, which is exactly what js/09 stores
    for its own built-in accounts and exactly what uatAuth.verify() compares against, so the
    login behaves identically. Computed with node's crypto and checked against js/09's own
    sha256() on a known vector, because a wrong hash here locks the person out silently.

    Say plainly what this does and does not buy: the hash is UNSALTED SHA-256 and the pattern
    Imode@0NN is guessable from one leak, and the hashes also sit in system_settings which
    04-anon-uat.sql lets anyone SELECT. This removes the plaintext, it does not make the
    passwords safe. Real credentials belong to the VPS cut-over with Supabase Auth and
    10-production-rls.sql (see the DECISION section of CLAUDE.md).

    TO CHANGE A PASSWORD: do it in the app (Settings -> accounts), which writes a per-device
    override; or hash the new one here with
      node -e "console.log(require('crypto').createHash('sha256').update('NEW','utf8').digest('hex'))"
    Never put the plaintext back. */
 var ROSTER=[
  {u:'rungarun', h:'99e518490c5e3142f647a43a4357a2bebbef13ba86252501e66c8b2b57928dc3', name:'Rungarun Suvunchato', th:'รุ่งอรุณ สุวรรณชาโต', role:'CEO', type:'staff'},
  {u:'apichat',  h:'0fa2d066330b597421c4f95af27806bc1d9f0eb8fb7c4e42bc9e608fdf636da7', name:'Apichat Pimpaeng',    th:'อภิชาติ ปิมแปง',      role:'Service Manager', type:'staff', userId:'USR-001'},
  {u:'pannawit', h:'cf58e725854c3ba6d10a65cf245ae5a4fd2f0a4e58e201c9115d24027ac11650', name:'Pannawit Chaimongkhon', th:'ปัณณวิชญ์ ชัยมงคล', role:'Dev', type:'staff'},
  /* 4: the real name is not known yet. The owner said to put this in and change it later, so
     it is written as given rather than invented. */
  {u:'phimu',    h:'d3fec1fd2bfe6816e2916b796c54806bda91e068db877a2f577f72d57a318b35', name:'พี่หมู่',             th:'พี่หมู่',             role:'Sale / Admin', type:'staff'},
  {u:'admin',    h:'601bc9e62140672060d32db15c228dcb9f0074997c184c888b4f8b67941c68c6', name:'Admin',               th:'แอดมิน',              role:'Admin', type:'staff'},
  {u:'lead_technician', keepPassword:true, name:'Artivara Polsri', role:'Technical Lead', type:'technician', userId:'USR-003', tech:'T-LEAD-TECH'},
  {u:'samak',    keepPassword:true, name:'Samak Thammachad',    role:'Technician', type:'technician', userId:'USR-006'},
  {u:'narongsak',keepPassword:true, name:'Narongsak Poomipalai',role:'Technician', type:'technician', userId:'USR-007'},
  {u:'lead_rd',  keepPassword:true, name:'Chaichana Photaya',   role:'R&D Lead',   type:'technician', userId:'USR-004', tech:'T-LEAD-RD'}
 ];
 function keep(){var o={};ROSTER.forEach(function(r){o[r.u.toLowerCase()]=r});return o}

 function lc(v){return String(v||'').toLowerCase()}
 function accounts(){
  try{return typeof window.imodeAccountList==='function'?(window.imodeAccountList()||[]):[]}
  catch(e){return []}
 }

 /* ----------------------------------------------------------------- the roles --- */
 /* Dev, CEO and Manager hold every permission the catalog knows about; a key registered later
    by another patch is picked up the next time this runs, because the list is read at run
    time rather than copied. Admin holds everything EXCEPT users.manage — the owner's rule is
    that an admin may look at the account screen but not change it, and the looking is done by
    the read-only mode below, which needs the key to open the screen at all. */
 function allKeys(){
  try{if(typeof allPermissionKeys==='function')return allPermissionKeys()||[]}catch(e){}
  try{return Object.keys(PERMISSION_CATALOG||{})}catch(e){return []}
 }
 var ROLE_SPEC={
  'CEO':'all','Dev':'all','Service Manager':'all',
  'Admin':'all','Sale / Admin':'all'
 };
 function ensureRoles(){
  if(!Array.isArray(settings.roles))settings.roles=[];
  var keys=allKeys();
  if(!keys.length)return false;
  var changed=false;
  Object.keys(ROLE_SPEC).forEach(function(name){
   var role=settings.roles.filter(function(r){return r&&r.name===name})[0];
   if(!role){role={name:name,permissions:[]};settings.roles.push(role);changed=true}
   if(!Array.isArray(role.permissions))role.permissions=[];
   keys.forEach(function(k){
    if(role.permissions.indexOf(k)<0){role.permissions.push(k);changed=true}
   });
  });
  return changed;
 }

 /* ------------------------------------------------------------- the nine doors --- */
 function store(){
  if(!Array.isArray(settings.uatAccounts))settings.uatAccounts=[];
  if(!settings.uatAccountEdits||typeof settings.uatAccountEdits!=='object')settings.uatAccountEdits={};
  return settings;
 }
 function builtInUsernames(){
  /* An account js/09 defines cannot be removed from the array — it is code — so it is
     tombstoned in uatAccountEdits, which is what js/39's merged() already honours. */
  var out={};
  accounts().forEach(function(a){if(a&&a.builtIn)out[lc(a.originalUsername||a.username)]=1});
  return out;
 }
 function applyRoster(){
  var st=store(),wanted=keep(),changed=false;
  var have={};
  accounts().forEach(function(a){if(a&&a.username)have[lc(a.username)]=a});

  ROSTER.forEach(function(r){
   var cur=have[lc(r.u)];
   if(cur){
    /* Existing account: bring the name and the role into line, leave the password alone. */
    var patch={};
    if(r.name&&cur.name!==r.name)patch.name=r.name;
    if(r.role&&cur.role!==r.role)patch.role=r.role;
    if(r.userId&&cur.userId!==r.userId)patch.userId=r.userId;
    if(!Object.keys(patch).length)return;
    if(cur.builtIn){
     var k=lc(cur.originalUsername||cur.username);
     st.uatAccountEdits[k]=Object.assign({},st.uatAccountEdits[k]||{},patch);
    }else{
     for(var i=0;i<st.uatAccounts.length;i++){
      if(lc(st.uatAccounts[i].username)!==lc(r.u))continue;
      st.uatAccounts[i]=Object.assign({},st.uatAccounts[i],patch);
      break;
     }
    }
    changed=true;
    return;
   }
   if(r.keepPassword)return;          /* a record-linked login that should already exist */
   st.uatAccounts.push({
    username:r.u,hash:r.h,
    accountType:r.type||'staff',role:r.role||'',team:'',
    name:r.name,userId:r.userId||'',technicianId:r.tech||'',
    createdAt:new Date().toISOString(),createdBy:'roster-2026-09-23'
   });
   changed=true;
  });

  /* Everything not on the list goes. A built-in is tombstoned; a created one is removed. */
  var built=builtInUsernames();
  accounts().forEach(function(a){
   if(!a||!a.username)return;
   if(wanted[lc(a.username)])return;
   if(built[lc(a.originalUsername||a.username)]){
    st.uatAccountEdits[lc(a.originalUsername||a.username)]={deleted:true};
   }
   changed=true;
  });
  var before=st.uatAccounts.length;
  st.uatAccounts=st.uatAccounts.filter(function(a){return a&&wanted[lc(a.username)]});
  if(st.uatAccounts.length!==before)changed=true;
  return changed;
 }

 /* ------------------------------------------- the records that are not on the list --- */
 /* The owner's instruction, given after being shown which records still carried work:
    "ลบพร้อมเคสได้เลยเพราะเคสนั้นไม่ใช่เคสจริง" — they are UAT cases, so they go with the record,
    and so does everything attributed to them (คำขอ, ใบตรวจ, QC).

    ONE EXCEPTION, and it is not hedging: a case whose crew also holds a record we are KEEPING
    belongs to a real person, whatever it was created for. Such a case is not deleted — the dead
    id is stripped out of assignee / assignees and the case stays with whoever is left. */
 function cloudDelete(table,id){
  /* js/40 and js/52 each keep their own copy for the same reason: `supa` is a top-level let in
     js/03 and so is never a property of window. */
  try{
   var db=null;
   try{db=supa}catch(e){db=null}
   if(!db||!table||!id)return;
   db.from(table).delete().eq('id',id).then(function(r){
    if(r&&r.error)console.warn('[imode] cloud delete failed',table,id,r.error);
   },function(e){console.warn('[imode] cloud delete threw',table,id,e)});
  }catch(e){}
 }
 function crewOf(c){
  var out=[];
  if(!c)return out;
  if(Array.isArray(c.assignees))c.assignees.forEach(function(x){if(x)out.push(String(x))});
  /* js/38 keeps the crew as a comma list in the one assignee column (part 17 §2). */
  String(c.assignee||'').split(',').forEach(function(x){
   x=x.trim();
   if(x&&out.indexOf(x)<0)out.push(x);
  });
  return out;
 }
 function tidyRecords(){
  var list=[];
  try{list=Array.isArray(technicians)?technicians:[]}catch(e){return false}
  var linked={};
  accounts().forEach(function(a){if(a&&a.technicianId)linked[a.technicianId]=1});

  var doomed={},gone=[];
  list.forEach(function(t){
   if(!t||linked[t.id])return;                 /* still a door's record */
   if(t.employeeId)return;                     /* belongs to a real employee */
   doomed[t.id]=1;gone.push(t);
  });
  if(!gone.length)return false;

  var all=[];try{all=Array.isArray(cases)?cases:[]}catch(e){}
  var killCases=[],keptCases=0;
  all.forEach(function(c){
   var crew=crewOf(c);
   if(!crew.some(function(id){return doomed[id]}))return;
   if(crew.some(function(id){return !doomed[id]})){
    c.assignees=crew.filter(function(id){return !doomed[id]});
    c.assignee=c.assignees[0]||'';
    c.updatedAt=new Date().toISOString();
    keptCases++;
    try{if(typeof cloudUpsertCase==='function')cloudUpsertCase(c)}catch(e){}
    return;
   }
   killCases.push(c);
  });
  var kill={};
  killCases.forEach(function(c){kill[c.id]=1});

  var reqs=[],reps=[],qcs=[];
  try{reqs=(Array.isArray(lineRequests)?lineRequests:[]).filter(function(r){return r&&kill[r.caseId]})}catch(e){}
  try{reps=(Array.isArray(serviceReports)?serviceReports:[]).filter(function(r){
   return r&&(kill[r.caseId]||doomed[String(r.techId||'')]);
  })}catch(e){}
  try{qcs=(Array.isArray(qcRecords)?qcRecords:[]).filter(function(q){return q&&kill[q.caseId]})}catch(e){}

  try{cases=cases.filter(function(c){return !kill[c.id]})}catch(e){}
  try{lineRequests=lineRequests.filter(function(r){return reqs.indexOf(r)<0})}catch(e){}
  try{serviceReports=serviceReports.filter(function(r){return reps.indexOf(r)<0})}catch(e){}
  try{qcRecords=qcRecords.filter(function(q){return qcs.indexOf(q)<0})}catch(e){}
  try{technicians=technicians.filter(function(t){return !doomed[t.id]})}catch(e){}

  killCases.forEach(function(c){cloudDelete('service_cases',c.id)});
  reqs.forEach(function(r){cloudDelete('line_customer_requests',r.id)});
  reps.forEach(function(r){cloudDelete('service_reports',r.id)});
  qcs.forEach(function(q){cloudDelete('qc_records',q.id)});
  gone.forEach(function(t){cloudDelete('technicians',t.id)});

  try{console.info('[imode] roster tidy — technician records removed: '
   +gone.map(function(t){return t.id+' ('+(t.name||'')+')'}).join(', ')
   +' · cases deleted '+killCases.length
   +', cases kept because a real technician is still on them '+keptCases
   +', requests '+reqs.length+', reports '+reps.length+', QC '+qcs.length)}catch(e){}
  return true;
 }

 function run(){
  if(settings.v70Roster===VERSION)return;
  var a=ensureRoles(),b=applyRoster(),c=tidyRecords();
  settings.v70Roster=VERSION;
  try{if(typeof saveLocal==='function')saveLocal()}catch(e){}
  try{if(typeof cloudSaveSettings==='function')cloudSaveSettings()}catch(e){}
  try{if(typeof renderAll==='function')renderAll()}catch(e){}
  try{console.info('[imode] roster applied — roles:'+a+' accounts:'+b+' records:'+c)}catch(e){}
 }
 window.imodeApplyRoster=function(){settings.v70Roster=0;run();swept=false;afterSync()};

 /* THE REASON THE NEW LOGINS DID NOT WORK, and it is the whole of this block.
    run() happens at DOMContentLoaded. At that moment `supa` is still null, so the
    cloudSaveSettings() below is a no-op — and a moment later initCloud() → syncCloud() does
    `settings = mergeSettings(cloudCopy)`, replacing the object WHOLESALE. The accounts this
    file had just created, and the version flag saying it had created them, were both thrown
    away on the same page load, every load. Only the accounts js/09 defines IN CODE survived,
    which is exactly which ones could still sign in.

    So the repair is re-applied to the copy the server actually sent, where `supa` exists and
    the push therefore lands. It ignores the version flag on purpose — the flag lives in the
    same object that was just replaced, so trusting it here would be trusting the thing that
    went missing. Idempotent: with the nine accounts present it changes nothing and pushes
    nothing. Once per page view. (js/96 seeds apichat / samak / narongsak the same way and had
    the same hole; it re-seeds after sync now too.) */
 var swept=false;
 function afterSync(){
  if(swept)return;
  swept=true;
  try{
   var a=ensureRoles(),b=applyRoster(),c=tidyRecords();
   if(settings.v70Roster!==VERSION){settings.v70Roster=VERSION;b=true}
   if(!a&&!b&&!c)return;
   if(typeof saveLocal==='function')saveLocal();
   if(typeof cloudSaveSettings==='function')cloudSaveSettings();
   if(typeof renderAll==='function')renderAll();
   try{console.info('[imode] roster re-applied after sync — roles:'+a+' accounts:'+b+' records:'+c)}catch(e){}
  }catch(e){}
 }
 var baseSync=window.syncCloud;
 if(typeof baseSync==='function'){
  window.syncCloud=function(){
   var r=baseSync.apply(this,arguments);
   if(r&&typeof r.then==='function')return r.then(function(v){afterSync();return v});
   afterSync();
   return r;
  };
 }

 /* ------------------------------------------------- Admin sees, Admin does not edit --- */
 /* The owner's rule: "Admin ไม่สามารถจัดการบัญชีผู้ใช้ได้ ทำได้แค่เปิดดู". The screen is opened
    with users.manage, which Admin holds, so the WRITE controls are removed from the rendered
    popup instead — removed, not hidden, because a hidden button is still reachable and
    imodeQuickSwitch changes who is signed in without reloading the page (part 19). */
 function readOnlyRole(){
  var r='';
  try{r=String((currentUser&&(currentUser.permissionRole||currentUser.role))||'')}catch(e){}
  return r==='Admin';
 }
 function lockAccountScreen(){
  if(!readOnlyRole())return;
  var body=document.getElementById('modalBody');
  if(!body||!body.querySelector('.acctmg-box'))return;
  ['[data-act="new"]','[data-act="edit"]','[data-act="del"]','[data-act="link"]',
   '[data-act="restore"]','.tacct-btn'].forEach(function(sel){
   [].forEach.call(body.querySelectorAll(sel),function(b){b.remove()});
  });
  if(!body.querySelector('.acctro-note')){
   var head=body.querySelector('.acctmg-head');
   if(head)head.insertAdjacentHTML('afterend','<div class="acctro-note">👁 '
    +'บัญชีของคุณดูข้อมูลได้อย่างเดียว การเพิ่ม แก้ไข หรือลบบัญชีต้องใช้สิทธิ์ CEO / Manager / Dev</div>');
  }
 }
 var baseAdmin=window.openAccountAdminModal;
 if(typeof baseAdmin==='function'){
  window.openAccountAdminModal=function(){
   var r=baseAdmin.apply(this,arguments);
   setTimeout(lockAccountScreen,0);
   return r;
  };
 }

 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
 else run();

 var st=document.createElement('style');
 st.id='v70RosterStyle';
 st.textContent='.acctro-note{margin-top:10px;padding:9px 11px;border:1px solid #f0d9b8;'
 +'border-radius:11px;background:#fff8ef;font-size:11.5px;color:#8a5a17;line-height:1.55}';
 document.head.appendChild(st);
})();
