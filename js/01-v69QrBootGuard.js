/* V6.9 QR boot guard.
   window load -> renderAll() -> await initCloud() -> initPortalFromUrl(), so a phone that
   scans a machine QR used to see the internal dashboard for the whole cloud round-trip.
   This runs before the shell is painted and hides it until the portal entry has decided
   where the visitor belongs. window.imodeQrBootRelease() clears it. */
(function(){
 try{
  var qr=/[?&]machineToken=/.test(location.search)||/customer-portal/.test(location.hash);
  var signedIn=false;
  try{signedIn=!!JSON.parse(localStorage.getItem('imode_v5_current_user')||'null')}catch(e){}
  /* Hide the shell for a QR visitor, and for anyone arriving without a session — that
     visitor is routed to the staff login door and must never see the dashboard first. */
  if(!qr&&signedIn)return;
  var st=document.createElement('style');
  st.id='v69QrBootGuardStyle';
  st.textContent='html.qr-booting .app-shell{visibility:hidden!important}'
   +'.qr-boot-splash{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:linear-gradient(160deg,#0b3f9e,#0b63e5 55%,#1f7ef0)}'
   +'.qr-boot-splash img{width:190px;max-width:60vw;height:auto}'
   +'.qr-boot-splash span{color:rgba(255,255,255,.9);font:600 13px/1.4 system-ui,sans-serif}'
   +'.qr-boot-dot{width:34px;height:34px;border-radius:50%;border:3px solid rgba(255,255,255,.28);border-top-color:#fff;animation:qrBootSpin .9s linear infinite}'
   +'@keyframes qrBootSpin{to{transform:rotate(360deg)}}'
   +'@media (prefers-reduced-motion:reduce){.qr-boot-dot{animation-duration:2.4s}}';
  (document.head||document.documentElement).appendChild(st);
  document.documentElement.classList.add('qr-booting');
  var released=false;
  function paintSplash(){
   if(document.getElementById('qrBootSplash')||!document.body)return;
   var d=document.createElement('div');
   d.className='qr-boot-splash';
   d.id='qrBootSplash';
   d.innerHTML='<img src="./assets/imode-ui-logo-v532.png" alt="I-MODE"><div class="qr-boot-dot"></div><span>I-MODE Plus Service</span>';
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
