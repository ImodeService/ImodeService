/* Beta 1.0 — 2026-09-23: สีในปฏิทิน becomes a real colour picker.
   It was a <select> with four named colours, because js/03 renders the calendar chip as
   `class="job-chip ${t.color}"` — the colour is a CSS CLASS, not a value, so a hex typed into
   that field would have produced class="job-chip #1c1d22" and no styling at all.

   So a custom colour is stored as a class-safe token, `c-1c1d22`, and this file injects the
   matching rule for every token actually in use. js/03's template is then correct exactly as
   written and no render code is touched. The four original names still save as 'blue',
   'orange', 'green' and 'purple', so every existing record and the css/01 rules behind them
   keep working untouched. */
(function(){
 'use strict';
 if(typeof settings!=='object')return;

 function tl(th,en){try{return (settings.language==='en')?en:th}catch(e){return th}}
 function esc2(v){return typeof window.esc==='function'?window.esc(v):String(v==null?'':v)}

 /* The preset hexes are READ from the theme rather than copied, so a change to css/01's
    --blue / --orange / --green cannot leave this file showing a stale swatch. */
 function cssVar(name,fallback){
  try{
   var v=getComputedStyle(document.documentElement).getPropertyValue(name).trim();
   return v||fallback;
  }catch(e){return fallback}
 }
 function presets(){
  return [{key:'blue',hex:cssVar('--blue','#0b63e5'),label:tl('น้ำเงิน','Blue')},
          {key:'orange',hex:cssVar('--orange','#f2751a'),label:tl('ส้ม','Orange')},
          {key:'green',hex:cssVar('--green','#079455'),label:tl('เขียว','Green')},
          {key:'purple',hex:'#8a5bc0',label:tl('ม่วง','Purple')}];
 }
 function isToken(v){return /^c-[0-9a-f]{6}$/i.test(String(v||''))}
 function toHex(v){
  v=String(v||'');
  if(isToken(v))return '#'+v.slice(2).toLowerCase();
  var p=presets().filter(function(x){return x.key===v})[0];
  if(p)return p.hex;
  if(/^#[0-9a-f]{6}$/i.test(v))return v.toLowerCase();
  return presets()[0].hex;
 }
 /* 2026-09-25: js/119 colours the month calendar by technician and needs the same answer. */
 window.imodeTechColorHex=toHex;
 function toValue(hex){
  hex=String(hex||'').toLowerCase();
  var p=presets().filter(function(x){return String(x.hex).toLowerCase()===hex})[0];
  return p?p.key:('c-'+hex.replace('#',''));
 }
 /* The chip is a 4px bar in the colour over a very light wash of it — the same recipe
    css/01 uses for its four, mixed here instead of guessed. */
 function wash(hex,amount){
  var n=parseInt(String(hex).replace('#',''),16);
  if(isNaN(n))return '#edf3ff';
  var r=(n>>16)&255,g=(n>>8)&255,b=n&255,k=amount;
  function mix(c){return Math.round(c+(255-c)*k)}
  return 'rgb('+mix(r)+','+mix(g)+','+mix(b)+')';
 }

 /* ------------------------------------------------------- the rules for tokens in use --- */
 var lastSig='';
 function ensureStyles(){
  var used=[];
  try{
   (Array.isArray(technicians)?technicians:[]).forEach(function(t){
    if(t&&isToken(t.color)&&used.indexOf(t.color)<0)used.push(t.color);
   });
  }catch(e){}
  var sig=used.sort().join(',');
  if(sig===lastSig)return;
  lastSig=sig;
  var el=document.getElementById('v70TechColorRules');
  if(!el){
   el=document.createElement('style');
   el.id='v70TechColorRules';
   document.head.appendChild(el);
  }
  el.textContent=used.map(function(tok){
   var hex=toHex(tok);
   return '.job-chip.'+tok+'{border-color:'+hex+';background:'+wash(hex,.88)+'}'
        + '.tech-color-dot.'+tok+'{background:'+hex+'}';
  }).join('');
 }
 ensureStyles();
 /* renderAll() is what repaints the calendar, and syncCloud() can bring in a technician whose
    colour this device has never seen. Both are cheap here because the signature check means
    nothing is rewritten unless the set of colours actually changed. */
 ['renderAll','syncCloud'].forEach(function(name){
  var base=window[name];
  if(typeof base!=='function')return;
  window[name]=function(){
   var r=base.apply(this,arguments);
   if(r&&typeof r.then==='function')return r.then(function(v){ensureStyles();return v});
   ensureStyles();
   return r;
  };
 });

 /* ------------------------------------------------------------------ the picker --- */
 function widgetHTML(value){
  var hex=toHex(value);
  return '<div class="tcol">'
   +'<input type="hidden" id="tColor" value="'+esc2(value||'blue')+'">'
   +'<div class="tcol-row">'
   +'<label class="tcol-native" title="'+esc2(tl('เลือกสีอิสระ','Pick any colour'))+'">'
   +'<input type="color" id="tColorPick" value="'+esc2(hex)+'">'
   +'<span id="tColorHex">'+esc2(hex)+'</span></label>'
   +'<div class="tcol-swatches">'
   +presets().map(function(p){
     return '<button type="button" class="tcol-sw" data-hex="'+esc2(p.hex)+'" title="'+esc2(p.label)+'"'
      +' aria-label="'+esc2(p.label)+'" style="background:'+esc2(p.hex)+'"></button>';
    }).join('')
   +'</div></div></div>';
 }
 function paint(){
  var hid=document.getElementById('tColor'),pick=document.getElementById('tColorPick'),
      out=document.getElementById('tColorHex');
  if(!hid||!pick)return;
  var hex=toHex(hid.value);
  pick.value=hex;
  if(out)out.textContent=hex;
  [].forEach.call(document.querySelectorAll('.tcol-sw'),function(b){
   b.classList.toggle('is-on',String(b.getAttribute('data-hex')).toLowerCase()===hex);
  });
 }

 var baseOpen=window.openTechnicianModal;
 if(typeof baseOpen==='function'){
  window.openTechnicianModal=function(){
   var r=baseOpen.apply(this,arguments);
   try{
    var sel=document.getElementById('tColor');
    /* saveTech() reads tColor.value as an id global, so the id has to survive the swap —
       the hidden input inside the widget carries it, and it is the only thing that saves. */
    if(sel&&sel.tagName==='SELECT'){
     var current=sel.value||'blue';
     sel.insertAdjacentHTML('beforebegin',widgetHTML(current));
     sel.parentNode.removeChild(sel);
     paint();
    }
   }catch(e){}
   return r;
  };
 }

 /* One delegated listener on #modalBody, not on document: js/05 calls stopPropagation() on
    #modalPanel, so a document-level listener never fires inside a popup. */
 function wire(){
  var body=document.getElementById('modalBody');
  if(!body||body.getAttribute('data-tcol-wired'))return;
  body.setAttribute('data-tcol-wired','1');
  body.addEventListener('input',function(e){
   if(!e.target||e.target.id!=='tColorPick')return;
   var hid=document.getElementById('tColor');
   if(hid)hid.value=toValue(e.target.value);
   paint();
  });
  body.addEventListener('click',function(e){
   var sw=e.target&&e.target.closest?e.target.closest('.tcol-sw'):null;
   if(!sw)return;
   e.preventDefault();
   var hid=document.getElementById('tColor');
   if(hid)hid.value=toValue(sw.getAttribute('data-hex'));
   paint();
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire,{once:true});
 else wire();
 var baseModal=window.openModal;
 if(typeof baseModal==='function'){
  window.openModal=function(){
   var r=baseModal.apply(this,arguments);
   setTimeout(wire,0);
   return r;
  };
 }

 var st=document.createElement('style');
 st.id='v70TechColorStyle';
 st.textContent=''
 +'.tcol-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}'
 +'.tcol-native{display:inline-flex;align-items:center;gap:8px;padding:5px 10px 5px 5px;'
 +'border:1px solid #cfdcf0;border-radius:10px;background:#fff;cursor:pointer}'
 +'.tcol-native input[type=color]{width:34px;height:30px;padding:0;border:0;background:none;cursor:pointer}'
 +'.tcol-native span{font-size:12px;font-variant-numeric:tabular-nums;color:#12356f;letter-spacing:.02em}'
 +'.tcol-swatches{display:flex;gap:6px;flex-wrap:wrap}'
 +'.tcol-sw{width:28px;height:28px;border-radius:8px;border:2px solid #fff;cursor:pointer;'
 +'box-shadow:0 0 0 1px #cfdcf0}'
 +'.tcol-sw.is-on{box-shadow:0 0 0 2px #0b63e5}'
 +'.tcol-sw:focus-visible{outline:2px solid #0b63e5;outline-offset:2px}';
 document.head.appendChild(st);
})();
