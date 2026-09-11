/* Beta 1.0 — the password is asked for when the link is opened, not on every click.

   REPORTED: "เวลากดปุ่มในหน้าเคสมันต้องล็อคใหม่ตลอด และพอล็อคอินมันก็กลับแดชบอร์ด
   ทำให้ทำงานไม่ได้"

   MEASURED, 9 exits on service-case-detail.html driven in a browser: 8 of them land on
   #page-staff-login with the session gone — มอบหมายช่าง, นัดหมาย, ใบเสนอราคา, หน้างานช่าง,
   เปลี่ยนสถานะ, the ‹ back arrow, the logo and the notification bell. Only ตอบกลับแล้ว
   survives, because it is the one action that does not leave the document. The search box
   and the two "← กลับไปหน้ารายการ" links in the error states make it 10 of 11.

   TWO CAUSES, stacked.

   1. service-case-detail.html is a SEPARATE DOCUMENT, so every one of those buttons is a
      full page load, and js/46 clears the session on every page load. That was asked for in
      part 18 ("อยากให้ใส่รหัสก่อนทุกครั้ง") and it was harmless then, because nobody walked
      back and forth between the application's two documents. Opening a case now does.

   2. js/28's spendUrl() deletes ?page= / ?caseId= / ?intent= at load + 380 ms — BEFORE the
      visitor can type a password — so by the time they are through the door the destination
      no longer exists and submitStaffLogin() falls back to the Home board. Measured: the
      query string is already empty when the login page is on screen.

   THE FIX, to the owner's instruction — "ล็อคอินแค่ตอนเปิดหน้าเว็บครั้งแรก ก็คือตอนเปิด
   ลิงค์ใหม่": the door is now per BROWSER TAB rather than per page load.

   sessionStorage is exactly that scope, which is why it is the marker and not a flag in
   `settings` or a cookie: it is created when a tab opens, survives reloads and same-tab
   navigations between index.html and service-case-detail.html, and is gone when the tab
   closes. So opening the GitHub Pages link — a new tab, a bookmark, coming back tomorrow —
   still asks for a password, and moving around inside the application no longer does.

   What this keeps from part 18: a device someone left signed in cannot be walked up to and
   opened straight into the dashboard, because that is a new tab. What it gives up: within
   one tab the session now survives a reload (F5), which part 18 deliberately did not allow.
   That is the trade the owner asked for.

   Known limitation, stated rather than hidden: opening the link in a SECOND tab while the
   first is still in use signs the first one out too, because the gate clears the shared
   localStorage session. Recovering is one sign-in. Keeping the stored session alive instead
   would leave a signed-in record lying around for every other entry point to find, which is
   the thing part 18 removed.

   Loads after js/46 (whose gate this replaces) and after js/28 (whose spendUrl this gets
   ahead of, by listening on DOMContentLoaded rather than on load). */
(function(){
 'use strict';

 var TAB_MARK='imode_v70_tab_authed';     /* sessionStorage — per tab, by definition */
 var PENDING='imode_v70_pending_route';   /* sessionStorage — where they were going */

 function ss(){try{return window.sessionStorage}catch(e){return null}}
 function marked(){var s=ss();try{return !!(s&&s.getItem(TAB_MARK))}catch(e){return false}}
 function mark(){var s=ss();try{if(s)s.setItem(TAB_MARK,'1')}catch(e){}}
 function unmark(){var s=ss();try{if(s)s.removeItem(TAB_MARK)}catch(e){}}

 /* The same customer test js/01 and js/46 use. A machine QR, ?serial= and the LINE rich-menu
    routes have no account behind them at all and must never meet a door. */
 function customerRoute(){
  try{
   return /[?&]machineToken=/.test(location.search)
       || /[?&]serial=/.test(location.search)
       || /[?&]page=(customer-entry|scan|customer-portal|customer-home)\b/.test(location.search)
       || /#\/(customer-portal|customer-home|customer-entry|scan)/.test(location.hash)
       || /customer-portal/.test(location.hash);
  }catch(e){return false}
 }

 /* ---------------------------------------------------- 1. mark the tab on sign-in ---- */
 /* Every door goes through ImodeAuth, so this is the one place that has to know. It is
    wrapped rather than reimplemented: lockout, expiry and the audit trail stay where they
    are. A customer sign-in is not marked — customers have no accounts and never reach a
    staff door, so marking one would only matter if that ever changed. */
 var baseSignIn=window.imodeSignIn;
 if(typeof baseSignIn==='function'){
  window.imodeSignIn=function(){
   var r=baseSignIn.apply(this,arguments);
   return Promise.resolve(r).then(function(res){
    /* A real session is the only thing that counts. imodeSignIn answers {ok:false,message}
       on a refusal and the session object on success, so testing for the session rather
       than for the absence of ok:false cannot mark the tab on a failed attempt. */
    try{if(res&&res.session&&res.ok!==false)mark()}catch(e){}
    return res;
   },function(err){throw err});
  };
 }
 /* Signing out must un-mark, or the next load in the same tab would walk straight back in
    past the door it was just sent to. */
 var baseSignOut=window.imodeSignOut;
 if(typeof baseSignOut==='function'){
  window.imodeSignOut=function(){
   unmark();
   return baseSignOut.apply(this,arguments);
  };
 }
 var baseLogout=window.uatLogout;
 if(typeof baseLogout==='function'){
  window.uatLogout=function(){unmark();return baseLogout.apply(this,arguments)};
 }

 /* --------------------------------------------- 2. remember where they were going ---- */
 /* js/28 spends these params at load + 380 ms. This runs on DOMContentLoaded, so it reads
    them first, and takes them out of the URL itself when the visitor is about to be stopped
    at the door — otherwise js/28 would route a logged-out visitor and throw the destination
    away. When there IS a session, nothing is touched and js/28 behaves exactly as before. */
 function stashRoute(){
  var p,page;
  try{p=new URLSearchParams(location.search);page=String(p.get('page')||'').trim()}catch(e){return}
  if(!page)return;
  var s=ss();
  if(!s)return;
  try{
   s.setItem(PENDING,JSON.stringify({
    page:page,
    caseId:String(p.get('caseId')||''),
    intent:String(p.get('intent')||''),
    q:String(p.get('q')||'')
   }));
   var u=new URL(location.href);
   ['page','caseId','intent','q'].forEach(function(k){u.searchParams.delete(k)});
   var qs=u.searchParams.toString();
   history.replaceState(history.state||null,'',u.pathname+(qs?'?'+qs:'')+u.hash);
  }catch(e){}
 }
 function takeRoute(){
  var s=ss();
  if(!s)return null;
  try{
   var raw=s.getItem(PENDING);
   if(!raw)return null;
   s.removeItem(PENDING);
   var o=JSON.parse(raw);
   return (o&&o.page)?o:null;
  }catch(e){return null}
 }
 /* The same three things js/28's router does once it has a page and a case. */
 function applyRoute(o){
  if(!o||typeof window.goPage!=='function')return false;
  try{window.goPage(o.page)}catch(e){return false}
  if(!o.caseId)return true;
  var c=null;
  try{c=(Array.isArray(cases)?cases:[]).filter(function(x){return x.id===o.caseId})[0]||null}catch(e){}
  if(!c)return true;                 /* an intent is a convenience, never a promise */
  setTimeout(function(){
   try{
    if(o.intent==='schedule'&&typeof openScheduleModal==='function')openScheduleModal(o.caseId);
    else if(o.intent==='status'&&typeof openCaseModal==='function')openCaseModal(o.caseId);
    else if(o.page==='quotation'&&typeof prepareQuotation==='function')prepareQuotation(o.caseId);
   }catch(e){}
  },280);
  return true;
 }

 /* Every staff door ends here — submitStaffLogin(), the legacy demo picker and
    auth-integration's routeAfterLogin() all call it — so one wrapper covers them all. */
 var baseAfterLogin=window.imodeRoleHomeAfterLogin;
 if(typeof baseAfterLogin==='function'){
  window.imodeRoleHomeAfterLogin=function(){
   var o=takeRoute();
   if(o&&applyRoute(o))return true;
   return baseAfterLogin.apply(this,arguments);
  };
 }

 /* ------------------------------------------------------------- 3. the gate itself ---- */
 /* js/46 registered its own DOMContentLoaded gate that clears the session unconditionally.
    It cannot be unregistered, so it is neutralised at the source instead: this file loads
    later, so its listener runs after js/46's, and it puts the session back when the tab has
    already been through the door. Nothing in js/46 is edited — delete this file and the
    part-18 behaviour returns exactly as it was. */
 var snapshot=null;
 try{
  snapshot={
   user:localStorage.getItem('imode_v5_current_user'),
   session:localStorage.getItem('imode_v69_session')
  };
 }catch(e){snapshot=null}

 function regate(){
  if(customerRoute())return;
  if(!marked()){
   /* A fresh tab: js/46 has done the right thing. Keep the destination for after the door. */
   stashRoute();
   return;
  }
  /* This tab has already signed in. Undo js/46's clear and carry on where they left off. */
  try{
   if(snapshot&&snapshot.user){
    localStorage.setItem('imode_v5_current_user',snapshot.user);
    if(snapshot.session)localStorage.setItem('imode_v69_session',snapshot.session);
    try{currentUser=JSON.parse(snapshot.user)}catch(e){}
   }
  }catch(e){}
  var signed=false;
  try{signed=!!currentUser}catch(e){}
  if(!signed){unmark();stashRoute();return}   /* nothing to restore — behave like a fresh tab */
  /* js/46 and js/11 have already routed to the door; send them back to the application. */
  var o=takeRoute();
  try{
   if(!(o&&applyRoute(o))&&typeof window.goPage==='function'){
    var p=new URLSearchParams(location.search);
    var page=String(p.get('page')||'').trim();
    if(!page)window.goPage(typeof window.imodeFirstAllowedPage==='function'
      ? window.imodeFirstAllowedPage() : 'dashboard');
   }
  }catch(e){}
  try{if(typeof window.imodeQrBootRelease==='function')window.imodeQrBootRelease()}catch(e){}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',regate,{once:true});
 else regate();
})();
