/* Beta 1.0 — 2026-09-24: every login account is listed on ทีมงาน.

   REPORTED: "ตรงบัญชีผู้ใช้อะ อยากให้บัญชีทุกบัญชีขึ้นที่ทีมงานครับ".

   The page showed TECHNICIAN RECORDS, which is a different set from ACCOUNTS. Of the nine on
   the roster only four hold a technician record — lead_technician (T-LEAD-TECH), lead_rd
   (T-LEAD-RD), samak and narongsak — so rungarun, apichat, pannawit, phimu and admin appeared
   nowhere on it, and there was no screen outside Settings that answered "who can sign in".

   WHAT IS DELIBERATELY NOT DONE: no technician record is created for the five. A technician
   record is what cases, field logs, service reports and QC are attributed BY (CLAUDE.md, and
   js/107 says the same), and it also feeds the Field Service picker, the calendar rows, the
   assignment lists and every team headcount. Giving the CEO one so that a card appears would
   put him in the queue to be assigned jobs. So the accounts are listed as accounts, in their
   own block, and `technicians` is not touched.

   The block is read only except for one button, which opens the account screen that already
   exists (openAccountAdminModal, the Settings → การจัดการบัญชีผู้ใช้ card) rather than a second
   copy of the form. */
(function(){
 'use strict';

 function tl(th,en){try{return (settings.language==='en')?en:th}catch(e){return th}}
 function esc2(v){
  if(typeof window.esc==='function')return window.esc(v);
  return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
   .replace(/"/g,'&quot;');
 }
 function accounts(){
  /* js/39's merged view: the built-ins from js/09, the created ones in settings.uatAccounts,
     and the edits and tombstones in settings.uatAccountEdits. uatAuth.allAccounts() is the
     fallback for a build without js/39. */
  try{
   if(typeof window.imodeAccountList==='function')return window.imodeAccountList()||[];
  }catch(e){}
  try{
   if(window.uatAuth&&typeof window.uatAuth.allAccounts==='function')
    return window.uatAuth.allAccounts()||[];
  }catch(e){}
  return [];
 }
 function techById2(id){
  if(!id)return null;
  try{
   return (Array.isArray(technicians)?technicians:[])
    .filter(function(t){return t&&t.id===id})[0]||null;
  }catch(e){return null}
 }
 function may(key){
  try{return typeof canPermission==='function'?!!canPermission(key):false}catch(e){return false}
 }
 function initials(name){
  var n=String(name||'').trim();
  if(!n)return '?';
  var p=n.split(/\s+/);
  return (p.length>1?(p[0][0]+p[1][0]):n.slice(0,2)).toUpperCase();
 }

 /* ------------------------------------------------------------------ the styles ---- */
 /* Runtime <style>, because css/21 and css/23 have to stay the last two <link> tags. */
 function style(){
  if(document.getElementById('imodeTeamAccStyle'))return;
  var s=document.createElement('style');
  s.id='imodeTeamAccStyle';
  s.textContent=[
   '.tacc-block{margin-top:18px;border-top:1px solid var(--line,#e4e9f2);padding-top:14px}',
   '.tacc-head{display:flex;align-items:center;justify-content:space-between;gap:10px;'
    +'flex-wrap:wrap;margin-bottom:4px}',
   '.tacc-head h4{margin:0;font-size:14px;color:#173f8a}',
   '.tacc-head p{margin:2px 0 0;font-size:11px;color:#6b7d9e}',
   '.tacc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));'
    +'gap:10px;margin-top:11px}',
   '.tacc-card{display:flex;gap:11px;align-items:flex-start;border:1px solid var(--line,#e4e9f2);'
    +'border-radius:15px;background:#fff;padding:12px;min-width:0}',
   '.tacc-av{flex:0 0 auto;width:42px;height:42px;border-radius:12px;display:flex;'
    +'align-items:center;justify-content:center;font-weight:800;font-size:13px;'
    +'background:linear-gradient(135deg,#ff9d45,#ff5b18);color:#fff;overflow:hidden}',
   '.tacc-av img{width:100%;height:100%;object-fit:cover}',
   '.tacc-main{min-width:0;flex:1 1 auto}',
   '.tacc-main b{display:block;font-size:13px;color:#16223c;overflow-wrap:anywhere}',
   '.tacc-user{font-size:11px;color:#5a6b86;overflow-wrap:anywhere}',
   '.tacc-chips{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}',
   '.tacc-chip{display:inline-flex;padding:3px 8px;border-radius:999px;font-size:10px;'
    +'font-weight:700;background:#e8f0ff;color:#2856a8;white-space:nowrap}',
   '.tacc-chip.is-tech{background:#e4f7ee;color:#177353}',
   '.tacc-chip.is-office{background:#f1eef9;color:#5b4794}',
   '.tacc-chip.is-test{background:#fff0d6;color:#8f5800}',
   '.tacc-group{margin-top:14px}',
   '.tacc-group-head{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:800;color:#173f8a}',
   '.tacc-group-head span{padding:2px 9px;border-radius:999px;background:#e8f0ff;font-size:11px}',
   '.tacc-group-head::after{content:"";flex:1;height:1px;background:#e4e9f2}',
   '.tacc-group .tacc-grid{margin-top:8px}',
   '.tacc-block.is-top{margin:0 0 18px;border-top:0;padding-top:0}',
   '.team-badge.devteam{background:#e7f6f8;color:#0f6b78}',
   '@media(max-width:640px){.tacc-grid{grid-template-columns:1fr}}'
  ].join('');
  document.head.appendChild(s);
 }

 /* ------------------------------------------------------------------ the block ---- */
 function cardHTML(a){
  var tech=techById2(a.technicianId);
  var name=a.name||a.username||'-';
  var photo=a.photo||(tech&&tech.photo)||'';
  var isTech=!!(a.technicianId&&tech);
  var test=/_test\d*$/i.test(String(a.username||''));
  var chips='<span class="tacc-chip">'+esc2(a.role||tl('ไม่ระบุบทบาท','No role'))+'</span>';
  chips+=isTech
   ? '<span class="tacc-chip is-tech">'+esc2(tl('ช่างหน้างาน · ','Field technician · ')+tech.id)+'</span>'
   : '<span class="tacc-chip is-office">'+esc2(tl('ไม่ใช่ช่างหน้างาน','Office account'))+'</span>';
  if(a.team)chips+='<span class="tacc-chip">'+esc2(a.team)+'</span>';
  if(test)chips+='<span class="tacc-chip is-test">'+esc2(tl('บัญชีทดสอบ','Test account'))+'</span>';
  /* A technician record the account points at but which does not exist is worth saying out
     loud: every screen that resolves work through currentUser.technicianId comes back empty
     for that person, and nothing else in the app reports it. That is exactly the state
     tech_test1 and R&D_test1 were in before part 29. */
  if(a.technicianId&&!tech){
   chips+='<span class="tacc-chip is-test">'
    +esc2(tl('ผูกกับระเบียนช่างที่ถูกลบแล้ว: ','Linked to a deleted record: ')+a.technicianId)
    +'</span>';
  }
  return '<div class="tacc-card">'
   +'<div class="tacc-av">'+(photo?'<img src="'+esc2(photo)+'" alt="">':esc2(initials(name)))+'</div>'
   +'<div class="tacc-main"><b>'+esc2(name)+'</b>'
   +'<span class="tacc-user">'+esc2(a.username||'-')+'</span>'
   +'<div class="tacc-chips">'+chips+'</div></div></div>';
 }

 var ROLE_ORDER=['Dev','CEO','Service Manager','Admin','Admin / Coordinator','Sale / Admin','Sales',
  'Technical Lead','R&D Lead','Technician','Technician - Technical','R&D','Technician - R&D'];
 function groupsHTML(list){
  var by={};
  list.forEach(function(a){var r=a.role||tl('ไม่ระบุบทบาท','No role');(by[r]=by[r]||[]).push(a)});
  var names=Object.keys(by).sort(function(x,y){
   var i=ROLE_ORDER.indexOf(x),j=ROLE_ORDER.indexOf(y);
   if(i<0&&j<0)return x.localeCompare(y);return (i<0?99:i)-(j<0?99:j);
  });
  if(!names.length)return '<p class="tacc-user" style="margin-top:10px">'+esc2(tl('ยังไม่มีบัญชีในทีมนี้','No accounts in this team'))+'</p>';
  return names.map(function(r){
   return '<div class="tacc-group"><div class="tacc-group-head">'+esc2(r)+' <span>'+by[r].length+'</span></div>'
    +'<div class="tacc-grid">'+by[r].map(cardHTML).join('')+'</div></div>';
  }).join('');
 }
 function render(){
  var grid=document.getElementById('technicianGrid');
  if(!grid||!grid.parentNode)return;
  style();
  var old=document.getElementById('imodeTeamAccounts');
  if(old&&old.parentNode)old.parentNode.removeChild(old);

  var list=accounts().slice();
  if(!list.length)return;
  /* 2026-09-25: "หน้าทีมงานโชว์ทุกคน ทุก account แบ่งเป็นหมวดตาม Role". The block now leads the
     page, is grouped by role, and follows the team chips above it (ทั้งหมด shows everyone). */
  var team='all';try{team=techTeamFilter||'all'}catch(e){}
  var TEAMS=[];try{TEAMS=TEAM_LIST.slice()}catch(e){}
  if(team!=='all'&&TEAMS.indexOf(team)>=0)list=list.filter(function(a){return (a.team||'Technical')===team});
  list.sort(function(a,b){
   return String(a.name||a.username||'').localeCompare(String(b.name||b.username||''),'th');
  });
  var techCount=0;
  list.forEach(function(a){if(a.technicianId&&techById2(a.technicianId))techCount++});

  var box=document.createElement('div');
  box.id='imodeTeamAccounts';
  box.className='tacc-block';
  /* applyLanguageTo() walks every text node on a setTimeout after a render and would rewrite
     these labels; data-no-i18n is the opt-out that function already honours (part 13). */
  box.setAttribute('data-no-i18n','true');
  var manage=may('users.manage')&&typeof window.openAccountAdminModal==='function'
   ? '<button type="button" class="soft-btn" onclick="openAccountAdminModal()">'
     +esc2(tl('🔐 จัดการบัญชี','🔐 Manage accounts'))+'</button>'
   : '';
  box.innerHTML='<div class="tacc-head"><div>'
   +'<h4>'+esc2(tl('บัญชีผู้ใช้งานทั้งหมด','All login accounts'))+' ('+list.length+')</h4>'
   +'<p>'+esc2(tl('ช่างหน้างาน '+techCount+' · ไม่ใช่ช่าง '+(list.length-techCount)
     +' — ทุกบัญชีที่เข้าสู่ระบบได้ แบ่งตาม Role · ตัวกรองทีมด้านบนใช้กับรายการนี้ด้วย',
     techCount+' field · '+(list.length-techCount)
     +' office — every account that can sign in, grouped by role; the team chips filter it too'))+'</p>'
   +'</div>'+manage+'</div>'
   +groupsHTML(list);
  box.classList.add('is-top');
  grid.parentNode.insertBefore(box,grid);
 }
 window.imodeRenderTeamAccounts=render;

 /* renderTechnicians() is a top-level function declaration in js/03 and therefore a window
    property, so replacing it changes what js/03's own renderAll() resolves to. It is also
    called by the team segment buttons and after every account save, so the block is rebuilt
    every time the grid is — which is why render() removes its previous copy first. */
 var base=window.renderTechnicians;
 if(typeof base==='function'){
  window.renderTechnicians=function(){
   var r=base.apply(this,arguments);
   try{render()}catch(e){}
   return r;
  };
 }
 /* An account created or deleted from the accounts screen does not re-render this page, so
    the list is refreshed when the page is opened as well. */
 var baseGo=window.goPage;
 if(typeof baseGo==='function'){
  window.goPage=function(name){
   var r=baseGo.apply(this,arguments);
   try{if(name==='technicians')render()}catch(e){}
   return r;
  };
 }
 if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',function(){setTimeout(render,600)});
 else setTimeout(render,600);
})();
