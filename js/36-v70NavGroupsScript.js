/* Beta — the sidebar is sorted into named groups.

   Reported: "การเรียงลำดับโมดุลในหน้าสไลด์บาร์มันดูเยอะมาก". Eighteen nav items in one
   undifferentiated column, in the order they happened to be written into index.html and
   then inserted into by js/16 — เงินสดย่อย between QC เครื่อง and สต๊อกอะไหล่, หน้างาน
   between ทีมช่าง and ปฏิทินงาน. Nothing was wrong with it; there was simply no shape to
   read.

   HOW THIS IS DONE, AND WHY NOT THE OBVIOUS WAY

   The obvious way is to wrap each group in a <div>. That is exactly what must not happen:
   `.side-nav{display:grid;gap:5px}` in css/01 puts every nav item in its own grid cell, so
   a wrapper would collapse a whole group into one cell and five later stylesheets
   (css/06, 09, 10 …) would need re-checking. Instead the headers are inserted as *siblings*
   and the buttons are reordered in place. The DOM stays one flat list of grid children,
   every existing `.side-nav .nav-item` rule keeps matching, and removing this file leaves
   the sidebar exactly as it was.

   THE THREE THINGS THAT WILL BREAK THIS IF CHANGED

   1. A group whose every item is hidden must hide its header too. applyRoleVisibility()
      in js/03 sets `style.display` on `[data-page]` elements only — it knows nothing about
      headers — so a technician would otherwise see "ราคาและค่าใช้จ่าย" with nothing under
      it. It is wrapped rather than observed: it is a plain top-level function declaration
      in js/03, therefore a property of window, and every caller uses the bare identifier
      which resolves to that property.
   2. js/16 adds งานของฉัน and มอบหมายงาน from its own DOMContentLoaded listener. This file
      parses later, so its listener runs after js/16's and both are already there. A
      childList observer covers anything added later still.
   3. A page this file does not know about is not dropped — it collects at the end under
      อื่น ๆ, which only appears when it has something in it. So a future module shows up
      in the sidebar without being listed here first.

   Labels follow the language because the header text is rewritten on every sync, which
   runs on every applyRoleVisibility(). data-no-i18n keeps applyLanguageTo() from walking
   them, since these are our strings and it would translate them twice. */
(function(){
 'use strict';

 function tl(th,en){try{return (settings.language==='en')?en:th}catch(e){return th}}

 /* Order inside a group is deliberate: the group reads as the sequence of the work.
    งานบริการ is intake -> assign -> the technician's own list -> the site -> the diary. */
 var GROUPS=[
  {id:'overview', th:'ภาพรวม',              en:'Overview',
   pages:['dashboard','notifications']},
  {id:'service',  th:'งานบริการ',            en:'Service work',
   pages:['cases','assign','my-work','field-service','calendar']},
  {id:'assets',   th:'ลูกค้าและเครื่องจักร',   en:'Customers & machines',
   pages:['customers','machines','qc','warranty','documents']},
  {id:'money',    th:'ราคาและค่าใช้จ่าย',      en:'Pricing & expenses',
   pages:['quotation','onsite','petty-cash']},
  {id:'stock',    th:'คลังและทีมงาน',         en:'Stock & team',
   pages:['spare-parts','technicians']},
  {id:'system',   th:'ระบบ',                 en:'System',
   pages:['reports','settings','trash']},
  {id:'other',    th:'อื่น ๆ',                en:'Other', pages:[]}
 ];

 function nav(){return document.querySelector('.sidebar .side-nav')}

 function header(g){
  var el=document.createElement('div');
  el.className='nav-group';
  el.setAttribute('data-navgroup',g.id);
  el.setAttribute('data-no-i18n','true');
  el.setAttribute('aria-hidden','true');   /* decoration: the buttons carry the meaning */
  el.textContent=tl(g.th,g.en);
  return el;
 }

 /* Reorders whatever is there right now. Safe to run repeatedly: appendChild moves an
    existing node rather than copying it, so a second pass is a no-op on an already
    sorted list.

    THE OBSERVER MUST BE OFF WHILE THIS RUNS. Moving a node with appendChild is reported as
    an addedNode, so the childList observer below sees this function's own work as "a nav
    item arrived", calls it again, and the two spin forever — the tab locks up with no
    error. It did not show until js/40 added a nav item after start(), because until then
    nothing ever called layout() a second time. Disconnecting rather than using a flag is
    what actually works: a MutationObserver only queues records while it is observing, so
    records from our own moves are never created instead of being created and ignored. */
 var obs=null,laying=false;
 function layout(){
  if(laying)return;
  var n=nav();
  if(!n)return;
  laying=true;
  try{if(obs)obs.disconnect()}catch(e){}
  try{layoutInner(n)}
  finally{
   laying=false;
   try{if(obs)obs.observe(nav()||document.body,{childList:true})}catch(e){}
  }
 }
 function layoutInner(n){
  var items={},loose=[];
  [].slice.call(n.querySelectorAll('.nav-item[data-page]')).forEach(function(b){
   items[b.dataset.page]=b;
  });
  var known={};
  GROUPS.forEach(function(g){g.pages.forEach(function(p){known[p]=1})});
  Object.keys(items).forEach(function(p){if(!known[p])loose.push(p)});

  GROUPS.forEach(function(g){
   var list=(g.id==='other')?loose:g.pages;
   var present=list.filter(function(p){return items[p]});
   var head=n.querySelector('[data-navgroup="'+g.id+'"]');
   if(!present.length){if(head)head.remove();return}
   if(!head)head=header(g);
   n.appendChild(head);
   present.forEach(function(p){n.appendChild(items[p])});
  });
  sync();
 }

 /* A header is only as visible as the buttons under it. Walking forward to the next
    header is what defines "under it" — there is no containment to ask. */
 function sync(){
  var n=nav();
  if(!n)return;
  var kids=[].slice.call(n.children),i,j;
  for(i=0;i<kids.length;i++){
   var el=kids[i];
   if(!el.hasAttribute||!el.hasAttribute('data-navgroup'))continue;
   var g=GROUPS.filter(function(x){return x.id===el.getAttribute('data-navgroup')})[0];
   if(g)el.textContent=tl(g.th,g.en);
   var any=false;
   for(j=i+1;j<kids.length;j++){
    if(kids[j].hasAttribute&&kids[j].hasAttribute('data-navgroup'))break;
    if(kids[j].classList&&kids[j].classList.contains('nav-item')&&kids[j].style.display!=='none'){any=true;break}
   }
   el.style.display=any?'':'none';
  }
 }

 var baseApply=window.applyRoleVisibility;
 if(typeof baseApply==='function'){
  window.applyRoleVisibility=function(){
   var r=baseApply.apply(this,arguments);
   try{sync()}catch(e){}
   return r;
  };
 }

 var st=document.createElement('style');
 st.id='v70NavGroupStyle';
 st.textContent=''
 +'.side-nav .nav-group{padding:13px 12px 4px;font-size:10.5px;font-weight:800;'
 +'letter-spacing:.09em;text-transform:uppercase;color:rgba(233,240,255,.52);'
 +'line-height:1.2;user-select:none;pointer-events:none}'
 /* No rule above the first group — a divider against the brand block reads as a seam. */
 +'.side-nav .nav-group:first-child{padding-top:2px}'
 +'.side-nav .nav-group[style*="display: none"]{display:none!important}'
 +'@media (max-width:900px){.side-nav .nav-group{padding:11px 10px 3px;font-size:10px}}'
 +'@media (max-height:760px){.side-nav .nav-group{padding:9px 12px 2px}}';
 document.head.appendChild(st);

 function start(){
  try{
   obs=new MutationObserver(function(recs){
    /* Only a nav item arriving matters; our own appendChild churn must not re-enter. */
    var relevant=recs.some(function(r){
     return [].slice.call(r.addedNodes).some(function(x){
      return x.nodeType===1&&x.classList&&x.classList.contains('nav-item');
     });
    });
    if(relevant)layout();
   });
   obs.observe(nav()||document.body,{childList:true});
  }catch(e){}
  layout();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();

 window.imodeNavGroups={layout:layout,sync:sync,groups:GROUPS};
})();
