/* V6.9 customer entry without a login.
   New decision: customers are not given accounts at all. They add the LINE OA, tap the
   rich-menu link, and land on a page that asks for the machine — by QR or by serial —
   and go straight into the portal for that machine. The customer accounts, the customer
   login page and the portal's remember-me prompt are all removed, because none of them
   have anything left to do.
   Kept: the QR link with ?machineToken=, which now opens the portal directly again. */
(function(){
 'use strict';

 function tl(th,en){return typeof window.L==='function'?window.L(th,en):th}
 function esc2(v){return typeof window.esc==='function'?window.esc(v):String(v==null?'':v)}
 function toast(m){if(typeof window.toastMsg==='function')window.toastMsg(m)}

 /* ---------- 1. no more customer accounts ---------- */
 if(window.uatAuth&&typeof window.uatAuth.allAccounts==='function'){
  var baseAll=window.uatAuth.allAccounts;
  window.uatAuth.allAccounts=function(){
   return baseAll.apply(this,arguments).filter(function(a){return a.accountType!=='customer'});
  };
 }

 /* ---------- 2. find a machine the way a customer would ----------
    A serial is what is printed on the machine plate; the QR carries a token. Accept
    either, plus the machine id, and ignore case and stray spaces or dashes. */
 function normalize(v){return String(v||'').trim().toLowerCase().replace(/[\s\-_]+/g,'')}
 function machineList(){try{return Array.isArray(machines)?machines:[]}catch(e){return[]}}
 function findMachine(input){
  var q=normalize(input);
  var list=machineList();
  if(!q||!list.length)return null;
  var exactToken=list.filter(function(m){return normalize(m.qrToken)===q||normalize(m.id)===q})[0];
  if(exactToken)return exactToken;
  var bySerial=list.filter(function(m){return normalize(m.serial)===q})[0];
  if(bySerial)return bySerial;
  /* A plate is easy to mistype, so allow a serial that clearly contains the input, but
     only when exactly one machine matches — never guess between two. */
  if(q.length>=6){
   var loose=list.filter(function(m){return normalize(m.serial).indexOf(q)>=0});
   if(loose.length===1)return loose[0];
  }
  return null;
 }
 window.imodeFindCustomerMachine=findMachine;

 function openMachinePortal(m){
  if(!m)return false;
  try{portalMachineToken=m.qrToken||m.id}catch(e){}
  if(typeof window.goPage==='function')window.goPage('customer-portal');
  if(typeof window.renderCustomerPortal==='function')window.renderCustomerPortal();
  return true;
 }
 window.imodeOpenMachinePortal=openMachinePortal;

 /* ---------- 3. the entry page ---------- */
 function ensureEntryPage(){
  var main=document.querySelector('main.main');
  if(!main||document.getElementById('page-customer-entry'))return;
  var sec=document.createElement('section');
  sec.className='page rhome-page';
  sec.id='page-customer-entry';
  main.appendChild(sec);
 }

 function inLineClient(){
  try{return typeof liff!=='undefined'&&liff&&typeof liff.isInClient==='function'&&liff.isInClient()}catch(e){return false}
 }
 function canScan(){
  /* Inside LINE the LIFF scanner is used. In a browser a camera scan needs both a secure
     context and a QR decoder; neither is available from file://, so the button is only
     offered when it can actually work. */
  if(inLineClient())return true;
  return !!(window.isSecureContext&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);
 }

 function renderEntry(){
  var host=document.getElementById('page-customer-entry');
  if(!host)return;
  var brand=(typeof window.imodeBrandHeaderHTML==='function')?window.imodeBrandHeaderHTML():'';
  host.innerHTML=brand+
   '<div class="rhome-body rhome-login-body"><div class="rhome-login-card centry-card">'
   +'<h2>'+esc2(tl('บริการลูกค้า I-MODE','I-MODE Customer Service'))+'</h2>'
   +'<p>'+esc2(tl('ระบุเครื่องของคุณเพื่อเข้าใช้บริการ','Tell us which machine you have'))+'</p>'
   +(canScan()?'<button type="button" class="centry-scan" id="centryScan">📷 '+esc2(tl('สแกน QR ที่ตัวเครื่อง','Scan the QR on the machine'))+'</button>'
              :'<div class="centry-scan-off">'+esc2(tl('อุปกรณ์นี้สแกน QR ไม่ได้ กรุณากรอกหมายเลขเครื่องด้านล่าง','This device cannot scan a QR code — please type the serial below'))+'</div>')
   +'<div class="rhome-login-or">'+esc2(tl('หรือ','or'))+'</div>'
   +'<form id="centryForm" autocomplete="off">'
   +'<div class="rhome-field"><span aria-hidden="true">🔎</span><input id="centrySerial" placeholder="'+esc2(tl('หมายเลขเครื่อง (S/N)','Machine serial number'))+'" aria-label="'+esc2(tl('หมายเลขเครื่อง','Machine serial number'))+'"></div>'
   +'<div id="centryError" class="rhome-login-error" role="alert"></div>'
   +'<button type="submit" class="rhome-login-btn">'+esc2(tl('เข้าใช้บริการ','Continue'))+'</button>'
   +'</form>'
   +'<div id="centryScanBox" class="centry-scanbox" hidden><video id="centryVideo" playsinline muted></video>'
   +'<button type="button" class="centry-scan-stop" id="centryStop">'+esc2(tl('ปิดกล้อง','Stop camera'))+'</button></div>'
   +'<div class="rhome-login-note">'+esc2(tl('หมายเลขเครื่องอยู่บนป้ายข้างตัวเครื่อง ถ้าหาไม่พบ กรุณาติดต่อทีม Service ทาง LINE OA','The serial is on the plate on the machine. If you cannot find it, contact the service team on LINE.'))+'</div>'
   +'</div></div>';
  var form=document.getElementById('centryForm');
  if(form)form.onsubmit=submitSerial;
  var scan=document.getElementById('centryScan');
  if(scan)scan.onclick=startScan;
  var stop=document.getElementById('centryStop');
  if(stop)stop.onclick=stopScan;
 }
 window.imodeRenderCustomerEntry=renderEntry;

 function entryError(msg){
  var box=document.getElementById('centryError');
  if(box){box.textContent=msg;box.classList.add('show')}
 }
 function submitSerial(e){
  if(e&&e.preventDefault)e.preventDefault();
  var v=(document.getElementById('centrySerial')||{}).value||'';
  if(!String(v).trim()){entryError(tl('กรุณากรอกหมายเลขเครื่อง','Please enter the serial number'));return}
  var m=findMachine(v);
  if(!m){entryError(tl('ไม่พบเครื่องนี้ในระบบ กรุณาตรวจหมายเลขอีกครั้ง หรือติดต่อทีม Service','No machine with that number. Please check it, or contact the service team.'));return}
  stopScan();
  openMachinePortal(m);
 }

 /* ---------- 4. QR scanning ---------- */
 var scanState={stream:null,raf:0,detector:null};
 function stopScan(){
  if(scanState.raf){cancelAnimationFrame(scanState.raf);scanState.raf=0}
  if(scanState.stream){scanState.stream.getTracks().forEach(function(t){try{t.stop()}catch(e){}});scanState.stream=null}
  var box=document.getElementById('centryScanBox');
  if(box)box.hidden=true;
 }
 window.imodeStopCustomerScan=stopScan;

 function handleScanned(text){
  /* The QR carries the full portal URL, so pull the token out of it when present. */
  var v=String(text||'');
  var m=v.match(/machineToken=([^&#]+)/);
  var key=m?decodeURIComponent(m[1]):v;
  var machine=findMachine(key);
  stopScan();
  if(machine)openMachinePortal(machine);
  else entryError(tl('QR นี้ไม่ตรงกับเครื่องในระบบ','That QR does not match a machine in the system'));
 }

 function startScan(){
  if(inLineClient()&&typeof liff.scanCodeV2==='function'){
   liff.scanCodeV2().then(function(res){handleScanned(res&&res.value)},function(){
    entryError(tl('สแกนไม่สำเร็จ กรุณากรอกหมายเลขเครื่องแทน','Scan failed — please type the serial instead'));
   });
   return;
  }
  if(!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)){
   entryError(tl('อุปกรณ์นี้ใช้กล้องไม่ได้','This device cannot use the camera'));
   return;
  }
  /* BarcodeDetector is built into Chrome on Android; there is no fallback decoder, so a
     browser without it is told to type the serial rather than being left with a dead
     camera preview. */
  if(typeof window.BarcodeDetector!=='function'){
   entryError(tl('เบราว์เซอร์นี้สแกน QR ไม่ได้ กรุณากรอกหมายเลขเครื่อง','This browser cannot scan QR codes — please type the serial'));
   return;
  }
  var box=document.getElementById('centryScanBox'),video=document.getElementById('centryVideo');
  if(!box||!video)return;
  box.hidden=false;
  navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(function(stream){
   scanState.stream=stream;
   video.srcObject=stream;
   video.play();
   scanState.detector=new window.BarcodeDetector({formats:['qr_code']});
   var tick=function(){
    if(!scanState.stream)return;
    scanState.detector.detect(video).then(function(codes){
     if(codes&&codes.length){handleScanned(codes[0].rawValue);return}
     scanState.raf=requestAnimationFrame(tick);
    },function(){scanState.raf=requestAnimationFrame(tick)});
   };
   scanState.raf=requestAnimationFrame(tick);
  },function(){
   box.hidden=true;
   entryError(tl('เปิดกล้องไม่สำเร็จ กรุณากรอกหมายเลขเครื่อง','Could not open the camera — please type the serial'));
  });
 }

 /* ---------- 5. wire the page into navigation ---------- */
 var baseGoPage=window.goPage;
 window.goPage=function(name){
  if(name==='customer-entry')ensureEntryPage();
  if(name==='customer-login')name='customer-entry';   /* the login page is gone */
  var r=baseGoPage.call(this,name);
  if(name==='customer-entry'){
   document.body.classList.add('rhome-mode');
   renderEntry();
  }else{
   stopScan();
  }
  return r;
 };

 /* A machine QR opens the portal directly again: there is no login left to ask for. */
 var basePortalInit=window.initPortalFromUrl;
 window.initPortalFromUrl=async function(){
  var token=new URLSearchParams(location.search).get('machineToken');
  if(token){
   try{portalMachineToken=token}catch(e){}
   var m=findMachine(token);
   if(m){
    openMachinePortal(m);
    if(typeof window.imodeQrBootRelease==='function')window.imodeQrBootRelease();
    return;
   }
  }
  return basePortalInit.apply(this,arguments);
 };

 /* ---------- 6. the portal exit ----------
    Without customer accounts the visitor in the portal is either a customer with no
    session at all, or a staff member using the preview from the Customers page. Only the
    staff preview keeps the old behaviour of dropping back into the application. */
 function staffSession(){
  try{return !!(currentUser&&currentUser.name&&currentUser.accountType!=='customer')}catch(e){return false}
 }
 function decorateClose(){
  var b=document.querySelector('#page-customer-portal .portal-close');
  if(!b||staffSession())return;
  b.textContent='×';
  b.title=tl('ออกจากหน้าบริการ','Leave the service page');
  b.setAttribute('aria-label',tl('ออกจากหน้าบริการ','Leave the service page'));
  b.setAttribute('onclick','imodePortalExitPrompt()');
 }
 var basePortalRender=window.renderCustomerPortal;
 if(typeof basePortalRender==='function'){
  window.renderCustomerPortal=function(){
   var r=basePortalRender.apply(this,arguments);
   decorateClose();
   return r;
  };
 }

 /* With no session there is nothing to remember, so the remember-me prompt is replaced by
    a plain close: back to LINE inside the app, otherwise back to the entry page. */
 window.imodePortalExitPrompt=function(){
  stopScan();
  if(inLineClient()&&typeof liff.closeWindow==='function'){
   try{liff.closeWindow();return}catch(e){}
  }
  var cfg={};try{cfg=settings.lineConfig||{}}catch(e){}
  var url=String(cfg.addFriendUrl||'').trim();
  if(!url){
   var id=String(cfg.officialAccountId||'').trim();
   if(id)url='https://line.me/R/ti/p/'+encodeURIComponent(id.charAt(0)==='@'?id:'@'+id);
  }
  /* Open the Official Account, then leave the app on the machine-entry page rather than
     on a portal the visitor has finished with. If the browser blocks the pop-up,
     openExternal() navigates away instead and this simply never runs. */
  if(url&&typeof window.openPortalLineOfficial==='function')window.openPortalLineOfficial();
  try{portalMachineToken=''}catch(e){}
  window.goPage('customer-entry');
 };

 /* ---------- styles ---------- */
 var st=document.createElement('style');
 st.id='v69CustomerEntryStyle';
 st.textContent=''
 +'.centry-card{max-width:400px}'
 +'.centry-scan{width:100%;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;color:#fff;cursor:pointer;background:linear-gradient(180deg,#ff9a4d,#f2711c);box-shadow:0 10px 22px rgba(242,113,28,.28)}'
 +'.centry-scan:hover{filter:brightness(1.05)}'
 +'.centry-scan-off{padding:11px;border-radius:12px;background:#fff7ec;border:1px solid #f6dcb8;color:#8a5a17;font-size:12px;line-height:1.5}'
 +'.centry-scanbox{margin-top:14px;border-radius:14px;overflow:hidden;background:#04122e;position:relative}'
 +'.centry-scanbox video{width:100%;display:block;max-height:320px;object-fit:cover}'
 +'.centry-scan-stop{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);border:none;border-radius:999px;padding:7px 16px;font-size:12px;font-weight:700;cursor:pointer;background:rgba(255,255,255,.92);color:#0c225e}';
 document.head.appendChild(st);

 function install(){ensureEntryPage()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
 else install();
})();
