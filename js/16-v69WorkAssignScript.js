/* V6.9 assignment flow and per-role notifications.
   Three things that belong together:
     1. งานของฉัน  — a technician's own assigned cases.
     2. มอบหมายงาน — the coordinator assigns a case to a technician.
     3. Notifications are addressed: a technician sees the ones about their own work, and
        the coordinator no longer sees notices written for a single technician.
   Assignment is watched generically rather than only in the new page, so assigning from
   the case modal or the appointment modal notifies the technician exactly the same way. */
(function(){
 'use strict';
 if(typeof settings!=='object'||typeof PAGE_PERMISSION==='undefined')return;

 function tl(th,en){return typeof window.L==='function'?window.L(th,en):th}
 function esc2(v){return typeof window.esc==='function'?window.esc(v):String(v==null?'':v)}
 function me(){try{return currentUser||null}catch(e){return null}}
 function myTechId(){var u=me();return (u&&u.technicianId)||''}
 function caseList(){try{return Array.isArray(cases)?cases:[]}catch(e){return[]}}
 function techList(){try{return Array.isArray(technicians)?technicians:[]}catch(e){return[]}}
 function techById(id){return techList().filter(function(t){return t.id===id})[0]||null}
 function caseById(id){return caseList().filter(function(c){return c.id===id})[0]||null}
 function isClosed(c){return ['เสร็จสิ้น','ปิดเคส'].indexOf(c.status)>=0}

 /* ---------- 1. permission + module registration ---------- */
 var have=false;
 try{have=PERMISSION_CATALOG.some(function(g){return (g.items||[]).some(function(i){return i[0]==='mywork.view'})})}catch(e){}
 if(!have&&typeof PERMISSION_CATALOG!=='undefined'){
  PERMISSION_CATALOG.push({group:'งานของช่าง',groupEn:'Technician work',items:[
   ['mywork.view','ดูงานที่ได้รับมอบหมายของตนเอง','View my assigned work']
  ]});
 }
 PAGE_PERMISSION['my-work']='mywork.view';
 PAGE_PERMISSION['assign']='case.assign';

 /* 2 (2026-09-08): the standard-preset button in js/12 rebuilt a technician role from a
    list that did not contain mywork.view, so งานของฉัน disappeared from the sidebar of any
    role it had been applied to. js/12 now carries the key; bumping this re-runs the
    add-only migration once so roles already saved without it get it back. */
 var WORK_VERSION=2;
 function migrate(){
  if(settings.v69Work===WORK_VERSION)return;
  (settings.roles||[]).forEach(function(r){
   var n=String(r.name||'').toLowerCase();
   if(!/technician|r&d|engineer|ช่าง|lead|supervisor/.test(n))return;
   r.permissions=Array.isArray(r.permissions)?r.permissions:[];
   if(r.permissions.indexOf('mywork.view')<0)r.permissions.push('mywork.view');
  });
  settings.v69Work=WORK_VERSION;
  if(typeof saveLocal==='function')saveLocal();
 }
 migrate();
 /* Re-applied after a cloud sync by v70SettingsSyncGuard, for the same reason as js/12. */
 window.imodeWorkMigrate=migrate;

 if(typeof PAGE_INFO!=='undefined'){
  PAGE_INFO.th['my-work']=['งานของฉัน','เคสงานที่ได้รับมอบหมายให้คุณ'];
  PAGE_INFO.en['my-work']=['My Work','Cases assigned to you'];
  PAGE_INFO.th.assign=['มอบหมายงาน','เลือกช่างให้กับเคสงานบริการ และแจ้งเตือนช่างทันที'];
  PAGE_INFO.en.assign=['Assign Work','Give a case to a technician and notify them'];
 }
 if(typeof window.imodeRegisterHomeModule==='function'){
  window.imodeRegisterHomeModule({page:'my-work',icon:'🧾',th:'งานของฉัน',en:'My Work',perm:'mywork.view'},'first');
  window.imodeRegisterHomeModule({page:'assign',icon:'📌',th:'มอบหมายงาน',en:'Assign Work',perm:'case.assign'},'after:cases');
 }

 /* ---------- 2. pages ---------- */
 function ensurePages(){
  var main=document.querySelector('main.main');
  if(!main)return;
  [['my-work','งานของฉัน'],['assign','มอบหมายงาน']].forEach(function(row){
   if(document.getElementById('page-'+row[0]))return;
   var sec=document.createElement('section');
   sec.className='page';
   sec.id='page-'+row[0];
   main.appendChild(sec);
  });
 }
 /* Sidebar entries, so the two modules behave like every other one. Placement mirrors the
    workflow: งานของฉัน at the top for a technician, มอบหมายงาน right after เคสงานบริการ. */
 function ensureNav(){
  var nav=document.querySelector('.sidebar .side-nav');
  if(!nav)return;
  function add(page,icon,label,after){
   if(nav.querySelector('.nav-item[data-page="'+page+'"]'))return;
   var b=document.createElement('button');
   b.className='nav-item';
   b.setAttribute('data-page',page);
   b.innerHTML='<span>'+icon+'</span><b>'+esc2(label)+'</b>';
   b.onclick=function(){goPage(page)};
   var ref=after?nav.querySelector('.nav-item[data-page="'+after+'"]'):null;
   if(ref&&ref.nextSibling)nav.insertBefore(b,ref.nextSibling);
   else if(after)nav.appendChild(b);
   else nav.insertBefore(b,nav.firstChild);
  }
  add('my-work','🧾',tl('งานของฉัน','My Work'),'');
  add('assign','📌',tl('มอบหมายงาน','Assign Work'),'cases');
  if(typeof applyRoleVisibility==='function')applyRoleVisibility();
 }

 /* ---------- 3. งานของฉัน ---------- */
 function myCases(){
  var id=myTechId();
  if(!id)return [];
  return caseList().filter(function(c){return c.assignee===id}).sort(function(a,b){
   var ax=isClosed(a)?1:0,bx=isClosed(b)?1:0;
   if(ax!==bx)return ax-bx;
   return new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0);
  });
 }
 function sameDay(v,d){
  if(!v)return false;
  var x=new Date(v);
  return x.getFullYear()===d.getFullYear()&&x.getMonth()===d.getMonth()&&x.getDate()===d.getDate();
 }
 function caseRow(c,actions){
  var st=esc2(c.status||'-');
  return '<div class="work-row" data-case="'+esc2(c.id)+'">'
   +'<div class="work-row-main">'
   +'<b>'+esc2(c.ticket||c.id)+'</b>'
   +'<span class="work-status status-'+st+'">'+st+'</span>'
   +(c.priority==='ด่วนมาก'?'<span class="work-urgent">'+esc2(tl('ด่วนมาก','Urgent'))+'</span>':'')
   +'<small>'+esc2(c.customer||'-')+' · '+esc2(c.machine||'-')+'</small>'
   +'<small>'+esc2(tl('นัดหมาย','Appointment'))+': '+(c.appointment?esc2(typeof fmt==='function'?fmt(c.appointment):c.appointment):esc2(tl('ยังไม่นัด','not scheduled')))+'</small>'
   +'</div><div class="work-row-actions">'+actions+'</div></div>';
 }
 function renderMyWork(){
  var host=document.getElementById('page-my-work');
  if(!host)return;
  var id=myTechId();
  if(!id){
   host.innerHTML='<div class="panel"><div class="empty">'+esc2(tl('หน้านี้สำหรับบัญชีช่างเท่านั้น','This page is for technician accounts'))+'</div></div>';
   return;
  }
  var list=myCases(),today=new Date();
  var open=list.filter(function(c){return !isClosed(c)});
  var todays=open.filter(function(c){return sameDay(c.appointment,today)});
  var urgent=open.filter(function(c){return c.priority==='ด่วนมาก'});
  host.innerHTML='<div class="panel">'
   +'<div class="panel-head toolbar-head"><div><h3>'+esc2(tl('งานที่ได้รับมอบหมาย','Assigned to me'))+'</h3>'
   +'<p class="subtext">'+esc2(tl('เคสที่แอดมินมอบหมายให้คุณ','Cases the coordinator gave you'))+'</p></div>'
   +'<button class="primary-btn action-3d-orange" onclick="goPage(\'field-service\')">'+esc2(tl('เปิด Field Service','Open Field Service'))+'</button></div>'
   +'<div class="work-kpi">'
   +'<div class="work-kpi-box"><small>'+esc2(tl('งานที่ยังไม่จบ','Open'))+'</small><b>'+open.length+'</b></div>'
   +'<div class="work-kpi-box"><small>'+esc2(tl('นัดวันนี้','Today'))+'</small><b>'+todays.length+'</b></div>'
   +'<div class="work-kpi-box"><small>'+esc2(tl('ด่วนมาก','Urgent'))+'</small><b>'+urgent.length+'</b></div>'
   +'<div class="work-kpi-box"><small>'+esc2(tl('ทั้งหมด','Total'))+'</small><b>'+list.length+'</b></div>'
   +'</div>'
   +'<div class="work-list">'+(list.length?list.map(function(c){
     return caseRow(c,'<button class="mini-btn" onclick="imodeOpenAssignedCase(\''+esc2(c.id)+'\')">'+esc2(tl('รายละเอียด','Details'))+'</button>'
      +' <button class="mini-btn" onclick="goPage(\'field-service\')">'+esc2(tl('เริ่มงาน','Start'))+'</button>');
    }).join(''):'<div class="empty">'+esc2(tl('ยังไม่มีงานที่มอบหมายให้คุณ','Nothing has been assigned to you yet'))+'</div>')+'</div>'
   +'</div>';
 }
 window.imodeOpenAssignedCase=function(id){
  if(typeof window.openCaseDetail==='function')window.openCaseDetail(id);
 };

 /* ---------- 4. มอบหมายงาน ---------- */
 function assignableCases(){
  return caseList().filter(function(c){return !isClosed(c)}).sort(function(a,b){
   var aa=a.assignee?1:0,bb=b.assignee?1:0;
   if(aa!==bb)return aa-bb;                    /* unassigned first */
   return new Date(b.createdAt||0)-new Date(a.createdAt||0);
  });
 }
 function techOptions(sel){
  var team=(typeof window.imodeTeamScope==='function')?window.imodeTeamScope():null;
  return techList().filter(function(t){return !team||(t.team||'Technical')===team})
   .map(function(t){
    return '<option value="'+esc2(t.id)+'"'+(t.id===sel?' selected':'')+'>'+esc2(t.name)+' · '+esc2(t.team||'Technical')+'</option>';
   }).join('');
 }
 function renderAssign(){
  var host=document.getElementById('page-assign');
  if(!host)return;
  var list=assignableCases();
  var waiting=list.filter(function(c){return !c.assignee}).length;
  host.innerHTML='<div class="panel">'
   +'<div class="panel-head toolbar-head"><div><h3>'+esc2(tl('มอบหมายงานให้ช่าง','Assign work to a technician'))+'</h3>'
   +'<p class="subtext">'+esc2(tl('เลือกช่างแล้วกดมอบหมาย ระบบจะแจ้งเตือนช่างและงานจะไปอยู่ใน "งานของฉัน" ของช่างคนนั้น',
                                  'Pick a technician and assign; they are notified and the case appears in their My Work'))+'</p></div>'
   +'<button class="soft-btn" onclick="goPage(\'cases\')">'+esc2(tl('ไปหน้าเคสงานบริการ','Open service cases'))+'</button></div>'
   +'<div class="work-kpi">'
   +'<div class="work-kpi-box"><small>'+esc2(tl('ยังไม่มีช่าง','Unassigned'))+'</small><b>'+waiting+'</b></div>'
   +'<div class="work-kpi-box"><small>'+esc2(tl('เคสที่ยังไม่จบ','Open cases'))+'</small><b>'+list.length+'</b></div>'
   +'<div class="work-kpi-box"><small>'+esc2(tl('ช่างในระบบ','Technicians'))+'</small><b>'+techList().length+'</b></div>'
   +'</div>'
   +'<div class="work-list">'+(list.length?list.map(function(c){
     var cur=techById(c.assignee);
     var actions='<select class="assign-pick" data-case="'+esc2(c.id)+'">'
       +'<option value="">'+esc2(tl('เลือกช่าง','Choose a technician'))+'</option>'+techOptions(c.assignee)+'</select>'
       +' <button class="primary-btn action-3d-orange" onclick="imodeAssignCase(\''+esc2(c.id)+'\')">'
       +esc2(cur?tl('เปลี่ยนช่าง','Reassign'):tl('มอบหมาย','Assign'))+'</button>'
       +(cur?'<small class="assign-current">'+esc2(tl('ปัจจุบัน','Now'))+': '+esc2(cur.name)+'</small>':'');
     return caseRow(c,actions);
    }).join(''):'<div class="empty">'+esc2(tl('ไม่มีเคสที่ต้องมอบหมาย','No open cases to assign'))+'</div>')+'</div>'
   +'</div>';
 }
 window.imodeAssignCase=function(caseId){
  var c=caseById(caseId);
  var sel=document.querySelector('.assign-pick[data-case="'+caseId+'"]');
  var tid=sel?sel.value:'';
  if(!c)return;
  if(!tid){if(typeof toastMsg==='function')toastMsg(tl('กรุณาเลือกช่างก่อน','Please choose a technician'));return}
  if(typeof requirePermission==='function'&&!requirePermission('case.assign'))return;
  var before=c.assignee||'';
  c.assignee=tid;
  c.serviceTeam=(techById(tid)||{}).team||c.serviceTeam||'Technical';
  if(c.status==='เคสใหม่'&&(settings.statuses||[]).indexOf('มอบหมายแล้ว')>=0)c.status='มอบหมายแล้ว';
  c.updatedAt=new Date().toISOString();
  notifyAssignment(c,tid,before);
  if(typeof saveLocal==='function')saveLocal();
  if(typeof cloudUpsertCase==='function'){try{cloudUpsertCase(c)}catch(e){}}
  if(typeof renderAll==='function')renderAll();
  renderAssign();
  if(typeof toastMsg==='function')toastMsg(tl('มอบหมายงานให้ ','Assigned to ')+((techById(tid)||{}).name||'')+tl(' แล้ว',''));
 };

 /* ---------- 5. addressed notifications ---------- */
 function notifyAssignment(c,tid,before){
  if(!tid||tid===before)return;
  var t=techById(tid);
  try{
   notifications.unshift({
    id:(typeof uid==='function'?uid():'n'+Date.now()),
    icon:'🧾',
    title:tl('ได้รับมอบหมายงานใหม่','New work assigned'),
    message:(c.ticket||c.id)+' · '+(c.customer||'-')+' · '+(c.machine||'-'),
    createdAt:new Date().toISOString(),
    read:false,
    caseId:c.id,
    audience:'technician',
    technicianId:tid,
    fromUser:(me()&&me().name)||''
   });
  }catch(e){}
  return t;
 }
 window.imodeNotifyAssignment=notifyAssignment;

 /* Any path that changes an assignee notifies the technician: the case modal, the
    appointment modal and the assign page all go through the same watch. */
 function snapshot(){
  var m={};
  caseList().forEach(function(c){m[c.id]=c.assignee||''});
  return m;
 }
 function notifyChanges(before){
  caseList().forEach(function(c){
   var was=before[c.id];
   if(was===undefined)was='';
   if((c.assignee||'')&&(c.assignee||'')!==was)notifyAssignment(c,c.assignee,was);
  });
 }
 ['saveCase','saveSchedule'].forEach(function(fn){
  var base=window[fn];
  if(typeof base!=='function')return;
  window[fn]=function(){
   var before=snapshot();
   var r=base.apply(this,arguments);
   var done=function(){
    notifyChanges(before);
    if(typeof saveLocal==='function')saveLocal();
    if(typeof renderNotifications==='function')renderNotifications();
   };
   if(r&&typeof r.then==='function')r.then(done,done);
   else done();
   return r;
  };
 });

 /* A technician sees notices addressed to them plus the automatic ones about their own
    cases; nobody else sees a notice written for one technician. */
 function visibleTo(n){
  var tech=myTechId();
  var owner=n.technicianId||'';
  if(!owner&&n.caseId){
   var c=caseById(n.caseId);
   if(c&&c.assignee)owner=c.assignee;
  }
  if(tech)return owner===tech;
  return n.audience!=='technician';
 }
 /* A case a customer opened from the machine QR lands in the list with no assignee and
    nobody is told. buildNotifications() only ever announced appointments, urgent cases,
    waiting parts and submissions — never intake — so the coordinator had to notice the new
    row on the Cases page by themselves. One notice per unassigned open case, addressed to
    whoever may assign work; a technician never sees it (no audience, and visibleTo() keeps
    it away because the case has no assignee yet). */
 function intakeNotices(){
  var out=[];
  if(myTechId())return out;                       /* technicians do not take cases in */
  try{if(typeof canPermission==='function'&&!canPermission('case.assign'))return out}catch(e){}
  caseList().forEach(function(c){
   if(c.assignee||isClosed(c))return;
   if(['เคสใหม่','มอบหมายแล้ว'].indexOf(c.status)<0)return;
   out.push({
    key:'auto_intake_'+c.id,
    icon:c.channel==='LINE OA'?'📱':'🆕',
    title:tl('เคสใหม่รอมอบหมาย','New case waiting to be assigned'),
    message:esc2(c.ticket)+' · '+esc2(c.customer||'-')+' · '+esc2(c.machine||'-')
      +(c.channel?' · '+esc2(c.channel):''),
    createdAt:c.createdAt||c.updatedAt,
    caseId:c.id,
    read:false
   });
  });
  return out;
 }
 var baseBuild=window.buildNotifications;
 if(typeof baseBuild==='function'){
  window.buildNotifications=function(){
   var all=baseBuild.apply(this,arguments)||[];
   return intakeNotices().concat(all.filter(visibleTo));
  };
 }

 /* ---------- 6. navigation ---------- */
 var baseGoPage=window.goPage;
 window.goPage=function(name){
  if(name==='my-work'||name==='assign')ensurePages();
  var r=baseGoPage.apply(this,arguments);
  var active=(document.querySelector('.page.active')||{}).id||'';
  if(active==='page-my-work')renderMyWork();
  else if(active==='page-assign')renderAssign();
  return r;
 };
 window.imodeRenderMyWork=renderMyWork;
 window.imodeRenderAssign=renderAssign;

 var style=document.createElement('style');
 style.id='v69WorkStyle';
 style.textContent=''
 +'.work-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:12px 0}'
 +'.work-kpi-box{background:#f4f8ff;border:1px solid #e2ecfb;border-radius:12px;padding:10px 12px}'
 +'.work-kpi-box small{display:block;font-size:11px;color:#7385a5}'
 +'.work-kpi-box b{font-size:20px;color:#0c225e}'
 +'.work-list{display:flex;flex-direction:column;gap:10px}'
 +'.work-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border:1px solid #e2ecfb;border-radius:14px;background:#fff}'
 +'.work-row-main{display:flex;flex-direction:column;gap:3px;min-width:210px;flex:1}'
 +'.work-row-main b{color:#0c225e;font-size:14px}'
 +'.work-row-main small{color:#5b6b88;font-size:11.5px}'
 +'.work-row-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
 +'.work-status{align-self:flex-start;font-size:11px;font-weight:700;color:#123a80;background:#eef4ff;border:1px solid #dce8fa;border-radius:999px;padding:2px 9px}'
 +'.work-urgent{align-self:flex-start;font-size:11px;font-weight:700;color:#b32020;background:#fdeaea;border:1px solid #f6cccc;border-radius:999px;padding:2px 9px}'
 +'.assign-pick{min-width:200px;padding:7px 9px;border:1px solid #d3e0f4;border-radius:10px;font-size:12.5px}'
 +'.assign-current{color:#0b63e5;font-size:11.5px;font-weight:700}'
 +'@media (max-width:640px){.work-row{flex-direction:column;align-items:stretch}.work-row-actions{justify-content:flex-start}.assign-pick{width:100%}}';
 document.head.appendChild(style);

 function install(){ensurePages();ensureNav()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
 else install();
})();
