/* V6.9 — the customer page has its own file.

   #page-customer-portal is the only page a customer ever reaches, and the only one with
   no sidebar and no topbar, so its markup was moved out of index.html into
   ./pages/customer-portal.html. This script pulls it back in, at the exact position in
   <main> the <section> used to occupy.

   Why it is loaded synchronously, from inside <main>, and not on DOMContentLoaded:
   goPage() does getElementById('page-'+name).classList.add('active') and throws if the
   section is missing, and renderCustomerPortal() reads portalLineIdentity /
   portalMachineHero / portalContent as id globals. The markup therefore has to be in the
   document before any other script runs — a QR link (?machineToken=) renders the portal
   during boot.

   XMLHttpRequest, not fetch(): fetch() refuses the file:// scheme outright, XHR does not.
   Over http — Live Server, GitHub Pages, the real deployment — both work. Opening
   index.html by double-clicking it (plain file://) the browser blocks the read either
   way; the fallback below then keeps the ids alive so nothing throws, and says where the
   page went. */
(function(){
 'use strict';
 var here=document.currentScript;

 /* customer-portal.html is a whole document, not a bare fragment, so it can be opened on
    its own and still look like the real page — it carries a <base>, the twenty
    stylesheets and a rule that reveals the section. None of that may reach index.html:
    those <link> tags would re-apply the whole cascade from inside <main>, at the end,
    overriding every later patch stylesheet. So only the <section> is taken. */
 function sectionOf(text){
  if(!text||text.indexOf('page-customer-portal')<0)return '';
  try{
   var doc=new DOMParser().parseFromString(text,'text/html');
   var sec=doc.getElementById('page-customer-portal');
   if(sec)return sec.outerHTML;
  }catch(e){}
  return '';
 }

 var html='';
 try{
  var x=new XMLHttpRequest();
  x.open('GET','./pages/customer-portal.html',false);
  x.send(null);
  /* a file:// read that succeeds reports status 0, not 200 */
  if((x.status===200||x.status===0)&&x.responseText)html=sectionOf(x.responseText);
 }catch(e){}

 if(!html){
  html='<section class="page customer-portal-page" id="page-customer-portal">'
   +'<div class="portal-shell">'
   +'<div class="portal-header"><img src="./assets/imode-ui-logo-v532.png" alt="I-MODE">'
   +'<div><b>I-MODE Plus</b><small>Customer Service Portal</small></div>'
   +'<button class="portal-close" onclick="exitCustomerPortal()">×</button></div>'
   +'<div id="portalLineIdentity" class="portal-line-identity"></div>'
   +'<div id="portalMachineHero"></div>'
   +'<div id="portalContent" class="portal-content">'
   +'<b>เปิดหน้าลูกค้าจากไฟล์ในเครื่องไม่ได้</b>'
   +'<p>pages/customer-portal.html ต้องเปิดผ่าน Live Server หรือ GitHub Pages</p>'
   +'</div></div></section>';
 }
 if(here&&here.parentNode)here.insertAdjacentHTML('beforebegin',html);
 else document.write(html);
})();
