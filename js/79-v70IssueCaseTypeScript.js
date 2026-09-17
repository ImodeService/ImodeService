/* Beta 1.0 — the customer chooses what kind of case they are reporting.

   REPORTED 2026-09-17: "อยากให้เพิ่มปุ่มกดแล้วมี Drop down ลงมาให้ลูกค้าเลือกประเภทเคสที่สามารถแจ้งได้
   คือ 1. Service 2. Maintenance 3. PM 4. Online" — on แจ้งปัญหาเครื่อง, the customer page form.

   The form is js/03's window.openPortalIssueForm (the copy at line ~1880, which carries the
   file picker). A select is added to it after it renders; js/03 is not edited. js/08 wraps
   openPortalIssueForm at DOMContentLoaded, and this file is parsed before that, so js/08 ends
   up wrapping THIS version and keeps its detail-mode header.

   WHERE THE CHOICE GOES. submitPortalIssue() hard-codes serviceType 'เข้าบริการหน้างาน'. The
   choice is mapped onto the case's own serviceType, which is a real column and travels:

     Service      → เข้าบริการหน้างาน
     Maintenance  → เข้าบริการหน้างาน   (there is no maintenance type in settings.serviceTypes)
     PM           → PM / Preventive Maintenance
     Online       → แก้ไขออนไลน์

   Because Maintenance and Service would otherwise be indistinguishable, the customer's own word
   is also written into the case `note` (a column too), which the office reads on the case page
   and in ลงรายละเอียดเคส, where the coordinator can change the type.

   HOW, without copying the submit. The new case is created and pushed inside one async
   function. Everything up to its first await is synchronous — including `cases.unshift(c)` —
   and every wrapper outside it (js/19, js/54) calls straight through, so for the duration of
   that synchronous run `unshift` is shadowed on the one array instance and the case is amended
   before it is stored or uploaded. The shadow is removed in a finally. */
(function(){
 'use strict';

 var TYPES=[
  {v:'Service',     th:'Service · ซ่อม / แก้ไขอาการเสีย', st:'เข้าบริการหน้างาน'},
  {v:'Maintenance', th:'Maintenance · บำรุงรักษา / ปรับตั้ง', st:'เข้าบริการหน้างาน'},
  {v:'PM',          th:'PM · บำรุงรักษาตามรอบ',            st:'PM / Preventive Maintenance'},
  {v:'Online',      th:'Online · ให้ช่างช่วยแก้ไขออนไลน์',   st:'แก้ไขออนไลน์'}
 ];
 function typeOf(v){return TYPES.filter(function(t){return t.v===v})[0]||null}
 function esc2(v){return typeof window.esc==='function'?window.esc(v):String(v==null?'':v)}

 /* ---------------------------------------------------------------- the field ---- */
 function addField(){
  var form=document.getElementById('portalIssueForm');
  if(!form||form.querySelector('#piCaseType'))return;
  var html='<div class="field pict-field"><label for="piCaseType">ประเภทเคส *</label>'
   +'<select id="piCaseType" required>'
   +'<option value="">— เลือกประเภทเคส —</option>'
   +TYPES.map(function(t){return '<option value="'+esc2(t.v)+'">'+esc2(t.th)+'</option>'}).join('')
   +'</select></div>';
  /* First question on the form: what kind of help is this. */
  var first=form.querySelector('.field');
  if(first)first.insertAdjacentHTML('beforebegin',html);
  else form.insertAdjacentHTML('afterbegin',html);
 }
 var baseOpen=window.openPortalIssueForm;
 if(typeof baseOpen==='function'){
  window.openPortalIssueForm=function(){
   var r=baseOpen.apply(this,arguments);
   try{addField()}catch(e){}
   return r;
  };
 }

 /* ------------------------------------------------------------- the submit ---- */
 var baseSubmit=window.submitPortalIssue;
 if(typeof baseSubmit==='function'){
  window.submitPortalIssue=function(ev){
   var sel=document.getElementById('piCaseType');
   var t=sel?typeOf(sel.value):null;
   if(sel&&!t){
    /* A required <select> is normally stopped by the browser before `submit` fires; this is
       the guard for a submit that reaches us anyway. */
    if(ev&&typeof ev.preventDefault==='function')ev.preventDefault();
    try{sel.focus()}catch(e){}
    try{if(typeof toastMsg==='function')toastMsg('กรุณาเลือกประเภทเคส')}catch(e){}
    return;
   }
   if(!t)return baseSubmit.apply(this,arguments);

   var arr=null,shadowed=false;
   try{
    arr=cases;
    arr.unshift=function(){
     for(var i=0;i<arguments.length;i++){
      var c=arguments[i];
      if(c&&typeof c==='object'&&c.status==='เคสใหม่'){
       c.serviceType=t.st;
       c.caseType=t.v;
       c.note=(c.note?c.note+' · ':'')+'ลูกค้าเลือกประเภทเคส: '+t.v;
      }
     }
     return Array.prototype.unshift.apply(this,arguments);
    };
    shadowed=true;
   }catch(e){}
   try{
    return baseSubmit.apply(this,arguments);
   }finally{
    if(shadowed){try{delete arr.unshift}catch(e){}}
   }
  };
 }

 var st=document.createElement('style');
 st.id='v70IssueCaseTypeStyle';
 st.textContent=''
 +'.pict-field select{font-weight:700;color:#0c225e}'
 +'.pict-field select:invalid{color:#6b7d9e;font-weight:400}';
 document.head.appendChild(st);
})();
