/* V6.9 — the customer page is now the customer Home page.

   The circle Home page a customer used to see after scanning a QR is gone; the page with
   the machine card and the seven service buttons IS the customer's home page now. This
   script makes that true in the three places the old name still leaked through:

     1. goPage('customer-home') opens it. js/14 mapped that name to the machine-entry page
        because there was no customer home left to open; now it opens the real home page
        when a machine is known, and only falls back to the entry page when it is not.
     2. #/customer-home is accepted in the URL, next to the old #/customer-portal.
     3. The page title / hero copy says หน้าหลักลูกค้า instead of Customer Portal.

   The section id stays page-customer-portal on purpose. goPage(), renderCustomerPortal(),
   exitCustomerPortal(), css/17 and css/20 all address it by that name, and renaming the id
   would be a rename with no behaviour behind it. The name a person reads changed; the
   identifier the code uses did not.

   Loads after js/14 so this wrapper sits outside js/14's, and its rename runs first. */
(function(){
 'use strict';

 function tl(th,en){return typeof window.L==='function'?window.L(th,en):th}

 /* A machine is known when a QR token or a typed serial has already resolved to one.
    portalMachineToken is a lexical global in js/03 — it never reaches window. */
 function machineKnown(){
  try{return !!String(portalMachineToken||'').trim()}catch(e){return false}
 }
 window.imodeCustomerMachineKnown=machineKnown;

 /* ---------- 1. the name ---------- */
 var CUSTOMER_HOME_PAGE='customer-portal';   /* the section id, unchanged */
 var baseGoPage=window.goPage;
 window.goPage=function(name){
  if(name==='customer-home')name=machineKnown()?CUSTOMER_HOME_PAGE:'customer-entry';
  return baseGoPage.call(this,name);
 };
 /* One call for anything that wants the customer's home page without caring which of the
    two it resolves to. */
 window.imodeGoCustomerHome=function(){return window.goPage('customer-home')};

 /* ---------- 2. the hash ----------
    A LINE rich-menu link can carry either name. initPortalFromUrl() in js/03 only looks
    for #/customer-portal, so translate the new one before it reads the hash. */
 var baseInit=window.initPortalFromUrl;
 if(typeof baseInit==='function'){
  window.initPortalFromUrl=function(){
   try{
    if(/#\/customer-home/.test(location.hash)){
     var h=location.hash.replace('#/customer-home','#/customer-portal');
     if(history&&history.replaceState)history.replaceState(null,'',location.pathname+location.search+h);
     else location.hash=h;
    }
   }catch(e){}
   return baseInit.apply(this,arguments);
  };
 }

 /* ---------- 3. the copy ----------
    PAGE_INFO drives the hero title. The customer never sees that hero (the portal hides
    the app chrome), but a staff member previewing the page from the Customers list does,
    and it is the last place still calling it a portal. */
 try{
  if(typeof PAGE_INFO!=='undefined'){
   PAGE_INFO.th['customer-portal']=['หน้าหลักลูกค้า','แจ้งปัญหา ตรวจประกัน ประวัติ Service และขอใบเสนอราคา ผ่าน QR หรือ LINE OA'];
   PAGE_INFO.en['customer-portal']=['Customer Home','Issue reporting, warranty, service history and quotation requests by QR or LINE OA'];
   if(typeof pageInfo!=='undefined'&&pageInfo){
    var lang=(typeof settings!=='undefined'&&settings.language)||'th';
    pageInfo=PAGE_INFO[lang]||PAGE_INFO.th;
   }
  }
 }catch(e){}

 /* ---------- 4. the machine information card ----------
    renderCustomerPortal() in js/03 writes a compact .portal-machine-card into
    #portalMachineHero. The design asks for a labelled card — name, model, serial, customer,
    warranty with its expiry date — so the hero is rebuilt here from the same data and the
    same helpers, after the base function has run. Nothing in js/03 is edited: if this
    script is removed the original card comes back. */
 function warrantyClass(state){
  return ['active','expiring','expired'].indexOf(state)>=0?state:'none';
 }
 function machineCardHTML(){
  var m=null;
  try{m=typeof portalMachine==='function'?portalMachine():null}catch(e){}
  if(!m)return '';
  var e=window.esc||function(v){return String(v==null?'':v)};
  var cu=null,w=null,state='none';
  try{cu=customerById(m.customerId)}catch(err){}
  try{w=latestWarrantyForMachine(m.id);state=w?warrantyState(w):'none'}catch(err){}
  var own=String(m.photo||'').trim(),ref='';
  if(!own){try{ref=machineFamilyPhoto(m)||''}catch(err){ref=''}}
  var src=own||ref;
  var label=w?warrantyStateLabel(state):tl('ยังไม่มี Warranty','No warranty on record');
  var until='';
  if(w&&w.endDate){
   var f=(typeof fmtDay==='function')?fmtDay(w.endDate):w.endDate;
   until='<span class="chome-warranty-sub">'+e(tl('หมดอายุ ','Expires ')+f)+'</span>';
  }
  var rows=[
   [tl('ชื่อเครื่องจักร','Machine'), e(m.name||'-'), ''],
   [tl('โมเดล','Model'), e(m.model||'-'), ' is-plain'],
   [tl('ซีเรียลนัมเบอร์','Serial number'), e(m.serial||'-'), ' is-plain'],
   [tl('ชื่อลูกค้า','Customer'), e((cu&&cu.name)||'-'), ' is-plain']
  ].map(function(r){
   return '<div class="chome-row"><dt>'+e(r[0])+'</dt><dd class="'+r[2]+'">'+r[1]+'</dd></div>';
  }).join('');

  return '<div class="chome-machine">'
   +'<div class="chome-machine-photo">'
   +(src?'<img class="'+(ref?'is-reference':'')+'" src="'+e(src)+'" alt="'+e(m.name||'Machine')+'" loading="lazy">'
        :'<div class="chome-noimg">No Image</div>')
   +'</div>'
   +'<div class="chome-machine-info">'
   +'<div class="chome-machine-head"><span aria-hidden="true">⚙️</span><div><b>'+e(tl('ข้อมูลเครื่องจักร','Machine information'))+'</b><small>MACHINE INFORMATION</small></div></div>'
   +'<dl class="chome-rows">'+rows
   +'<div class="chome-row"><dt>'+e(tl('สถานะการรับประกัน','Warranty'))+'</dt>'
   +'<dd><span class="chome-warranty '+warrantyClass(state)+'">'+e(label)+'</span>'+until+'</dd></div>'
   +'</dl>'
   +(ref?'<p class="chome-refnote">'+e(tl('ภาพอ้างอิงของรุ่นนี้','Reference image of this model'))+'</p>':'')
   +'</div></div>';
 }

 /* ---------- 5. the entrance ----------
    Stamped synchronously right after the base render, before the first paint, so a button
    is never seen in place before it pops. --chome-i drives the stagger in css/22. */
 function playEntrance(){
  var shell=document.querySelector('#page-customer-portal .portal-shell');
  if(!shell)return;
  var btns=shell.querySelectorAll('.portal-action-grid > button');
  for(var i=0;i<btns.length;i++)btns[i].style.setProperty('--chome-i',String(i));
  shell.classList.remove('chome-anim');
  void shell.offsetWidth;           /* restart the animation on a re-render */
  shell.classList.add('chome-anim');
 }
 window.imodeCustomerHomeEntrance=playEntrance;

 /* ---------- 6. ข่าวสาร / ประกาศ ----------
    There is no news module in this application, so the card reads settings.portalNews —
    an array of {title, date, body} an admin can fill in later — and says plainly when
    there is nothing rather than pretending. */
 window.showPortalNews=function(){
  var host=document.getElementById('portalContent');
  if(!host)return;
  var e=window.esc||function(v){return String(v==null?'':v)};
  var list=[];
  try{list=Array.isArray(settings.portalNews)?settings.portalNews:[]}catch(err){}
  host.innerHTML='<h3>📣 '+e(tl('ข่าวสาร / ประกาศ','News / Announcements'))+'</h3>'
   +(list.length
     ? list.map(function(n){
        return '<div class="portal-history-item"><b>'+e(n.title||'-')+'</b>'
         +'<small>'+e(n.date||'')+'</small>'
         +'<small>'+e(n.body||'')+'</small></div>';
       }).join('')
     : '<p>'+e(tl('ยังไม่มีข่าวสารในขณะนี้ ติดตามได้ทาง LINE Official Account ของ I-MODE Plus',
                  'No announcements right now. Follow the I-MODE Plus LINE Official Account for updates.'))+'</p>');
 };

 /* The <small> under I-MODE Plus lives in pages/customer-home.html, but the fallback
    markup in pages/pages.js and any older cached copy may still say Customer Service
    Portal. Fix it on render rather than leaving two spellings in the wild. */
 function paintHeader(){
  var el=document.querySelector('#page-customer-portal .portal-header small');
  if(el&&/Customer Service Portal/i.test(el.textContent||''))
   el.textContent=tl('หน้าหลักลูกค้า · Customer Home','Customer Home');
 }
 var baseRender=window.renderCustomerPortal;
 if(typeof baseRender==='function'){
  window.renderCustomerPortal=function(){
   var r=baseRender.apply(this,arguments);
   paintHeader();
   var hero=document.getElementById('portalMachineHero');
   var card=machineCardHTML();
   if(hero&&card){
    hero.innerHTML=card;
    /* Attached here rather than as an inline onerror: that handler needs quotes of its own
       and nesting them inside an HTML attribute inside a JS string is how that breaks. */
    var img=hero.querySelector('.chome-machine-photo img');
    if(img)img.onerror=function(){
     this.onerror=null;
     if(this.parentNode)this.parentNode.innerHTML='<div class="chome-noimg">No Image</div>';
    };
   }
   playEntrance();
   return r;
  };
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',paintHeader,{once:true});
 else paintHeader();
})();
