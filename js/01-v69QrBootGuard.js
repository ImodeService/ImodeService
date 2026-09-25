/* V6.9 — snapshot the saved settings before anything can rewrite them.

   mergeSettings() in js/03 runs normalizeRoleSetting() -> migrateLegacyPermissions(),
   which drops every saved permission key that is not yet in PERMISSION_CATALOG. js/12 and
   js/16 register four keys (onsite.view, parts.view, pettycash.view, mywork.view) and
   both run *after* js/03, so those four are stripped from every role on every load. Any
   saveLocal() that happens before the repair in js/20 then writes the stripped set back
   and the permission is gone for good.

   This file is the first script in the document, so the copy taken here is the last one
   the admin actually saved. js/20 repairs from it. One line of storage, no writes.
   See js/20-v69PermissionEditorScript.js for the repair itself. */
(function(){
 try{window.imodeSettingsSnapshot=JSON.parse(localStorage.getItem('imode_v5_settings')||'{}')}
 catch(e){window.imodeSettingsSnapshot=null}
})();

/* V6.9 QR boot guard.
   window load -> renderAll() -> await initCloud() -> initPortalFromUrl(), so a phone that
   scans a machine QR used to see the internal dashboard for the whole cloud round-trip.
   This runs before the shell is painted and hides it until the portal entry has decided
   where the visitor belongs. window.imodeQrBootRelease() clears it. */
(function(){
 try{
  /* Every customer entry URL, not only the machine QR. js/21 added #/customer-entry and
     ?serial= for the LINE rich menu; a device where staff had signed in once would
     otherwise skip the splash on those and show the dashboard while the cloud syncs. */
  var qr=/[?&]machineToken=/.test(location.search)
      || /[?&]serial=/.test(location.search)
      || /[?&]page=(customer-entry|scan|customer-portal|customer-home)\b/.test(location.search)
      || /#\/(customer-portal|customer-home|customer-entry|scan)/.test(location.hash)
      || /customer-portal/.test(location.hash);
  /* Hide the shell for every visitor who is not already on a customer route.
     Until js/46 there was an exemption here for a device that still held a session, because
     that device went straight to the dashboard and had nothing to wait for. A password is
     now required on every load, so that device goes to the staff login door like any other
     and must not see the dashboard on the way. js/11's install() releases the splash in the
     same DOMContentLoaded dispatch that routes, so nothing is painted in between.
     The customer/staff distinction still has to be made, but it is made where the release
     happens — js/11 for staff, the portal entry for a QR — not here. `qr` is left computed
     above so the two tests stay side by side and cannot drift apart. */
  void qr;
  /* 2026-09-18: the same test, exported, because the answer is needed after boot too —
     "หน้าของลูกค้าอะมันมักจะมีแจ้งเตือนของแอดมินโผล่มา". Anything that speaks to staff on its own
     (js/85's realtime notices, js/24's cloud warning) asks this before it opens its mouth.
     The URL is only half of it: a customer reaches the portal from the entry page without the
     URL changing, so the surface on screen counts as well. This is the fourth copy of the URL
     test (js/01, js/46, js/84 and now its exported form) and they are kept in step by hand —
     if one grows a new customer route, all of them have to learn it. */
  window.imodeCustomerSurface=function(){
   try{
    if(/[?&]machineToken=/.test(location.search))return true;
    if(/[?&]serial=/.test(location.search))return true;
    if(/[?&]page=(customer-entry|scan|customer-portal|customer-home)\b/.test(location.search))return true;
    if(/#\/(customer-portal|customer-home|customer-entry|scan)/.test(location.hash))return true;
    if(/customer-portal/.test(location.hash))return true;
    var b=document.body;
    if(b&&b.classList&&b.classList.contains('customer-portal-mode'))return true;
    var active=(document.querySelector('.page.active')||{}).id||'';
    return active==='page-customer-portal'||active==='page-customer-entry'
        || active==='page-customer-home'||active==='page-scan';
   }catch(e){return false}
  };
  /* ------------------------------------------- A WARM TAB GETS NO LOADING SCREEN -------
     2026-09-25, reported as "มันยังขึ้นอยู่อะ" after the first attempt only shortened the wait:
     js/117 stopped the tab's SECOND load from waiting for the sync, but this file still
     painted the splash and js/11 still took it off at DOMContentLoaded, so switching between
     the app and service-case-detail.html - a separate document, so a full page load each way -
     still put a loading screen on screen for about 2 seconds every time.
     On a tab that has already completed one boot there is nothing to cover: the markup, the
     stylesheets and every js/NN file are in the HTTP and service-worker caches, the session is
     known and the data is in localStorage. So the guard does not run at all and the app simply
     appears.
     `qr` is the exception and this is what it was computed for. A customer route still has to
     be covered even on a warm tab, because initPortalFromUrl() decides where that visitor
     belongs asynchronously and the dashboard would show through in the meantime. */
  var warmTab=false;
  try{warmTab=sessionStorage.getItem('imode_v70_tab_booted')==='1'}catch(e){}
  if(warmTab&&!qr){
   /* js/11, js/14 and js/21 all call this by name; give them something harmless. */
   window.imodeQrBootRelease=function(){};
   return;
  }

  var st=document.createElement('style');
  st.id='v69QrBootGuardStyle';
  /* 2026-09-25: the spinner became a ring of module circles orbiting the logo, asked for as
     "เอาหน้าโหลดแบบ มี animation โมดุลเป็นวงกลมหมุนไปรอบๆ".
     Three nested elements per circle, and each level exists for a reason:
       .qbo-slot   static rotate(a) translateY(-R)  - puts the point on the ring
       .qbo-cancel static rotate(-a)                - undoes the slot's own rotation
       .qbo-face   animated rotate(0 -> -360deg)    - undoes the RING's rotation
     so the icon rides the circle and still reads upright. Both keyframe sets declare an
     explicit from AND to: with a `to`-only rule the implicit start has a different transform
     function list, the browser falls back to matrix interpolation, and a matrix for
     rotate(360deg) is the identity - the thing would sit perfectly still. */
  st.textContent='html.qr-booting .app-shell{visibility:hidden!important}'
   +'.qr-boot-splash{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:linear-gradient(160deg,#0b3f9e,#0b63e5 55%,#1f7ef0)}'
   +'.qr-boot-splash>.qr-boot-name{color:rgba(255,255,255,.92);font:600 13px/1.4 system-ui,sans-serif;letter-spacing:.02em}'
   +'.qr-boot-orbit{position:relative;width:216px;height:216px;flex:none}'
   +'.qbo-ring{position:absolute;inset:0;animation:qboSpin 9s linear infinite}'
   +'.qbo-slot{position:absolute;top:50%;left:50%;width:0;height:0}'
   +'.qbo-cancel{position:absolute;display:block}'
   +'.qbo-face{position:absolute;width:42px;height:42px;margin:0;border-radius:50%;display:flex;'
   +'align-items:center;justify-content:center;font-size:19px;line-height:1;'
   +'background:rgba(255,255,255,.17);border:1px solid rgba(255,255,255,.36);'
   +'box-shadow:0 6px 16px rgba(3,24,66,.26);transform:translate(-50%,-50%);'
   +'animation:qboBack 9s linear infinite}'
   +'.qbo-core{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center}'
   +'.qbo-core img{width:118px;max-width:40vw;height:auto;display:block}'
   +'@keyframes qboSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'
   +'@keyframes qboBack{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(-360deg)}}'
   +'@keyframes qboFade{0%,100%{opacity:.62}50%{opacity:1}}'
   +'@media (max-width:420px){.qr-boot-orbit{transform:scale(.84)}}'
   /* Reduced motion: nothing travels. The ring keeps its place and breathes instead, and the
      faces drop their counter-rotation so they stay upright without it. */
   +'@media (prefers-reduced-motion:reduce){.qbo-ring{animation:qboFade 2.6s ease-in-out infinite}.qbo-face{animation:none}}';
  (document.head||document.documentElement).appendChild(st);
  document.documentElement.classList.add('qr-booting');
  var released=false;
  function paintSplash(){
   if(document.getElementById('qrBootSplash')||!document.body)return;
   var d=document.createElement('div');
   d.className='qr-boot-splash';
   d.id='qrBootSplash';
   /* The eight the sidebar leads with. Emoji rather than the module table, because that table
      is defined in js/06 and this file is the first script in the document. */
   var MODS=['\ud83d\udccb','\ud83e\uddf0','\ud83d\udcc5','\ud83c\udfed','\u2705','\ud83d\udcb0','\ud83d\udce6','\ud83d\udd14'];
   var R=86,ring='';
   for(var i=0;i<MODS.length;i++){
    var a=i*(360/MODS.length);
    ring+='<span class="qbo-slot" style="transform:rotate('+a+'deg) translateY(-'+R+'px)">'
     +'<span class="qbo-cancel" style="transform:rotate('+(-a)+'deg)">'
     +'<span class="qbo-face">'+MODS[i]+'</span></span></span>';
   }
   d.innerHTML='<div class="qr-boot-orbit"><div class="qbo-ring">'+ring+'</div>'
    +'<span class="qbo-core"><img src="./assets/imode-ui-logo-v532.png" alt="I-MODE"></span></div>'
    +'<span class="qr-boot-name">I-MODE Plus Service</span>';
   document.body.appendChild(d);
  }
  paintSplash();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',paintSplash,{once:true});
  window.imodeQrBootRelease=function(){
   if(released)return;
   released=true;
   document.documentElement.classList.remove('qr-booting');
   var d=document.getElementById('qrBootSplash');
   if(d&&d.parentNode)d.parentNode.removeChild(d);
  };
  /* Never strand the visitor on the splash if portal entry throws. */
  setTimeout(function(){window.imodeQrBootRelease()},12000);
 }catch(e){}
})();
