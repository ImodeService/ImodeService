/* Beta 1.0 — the 📍 button fills the distance in, with no Google API key.

   REPORTED (2026-09-18): "อยากให้กดปุ่มนี้แล้ว เอาระยะทางมาใส่ได้เลย Auto ได้มั้ย"

   WHAT IT DID BEFORE, measured in js/03:1442. calculateQuoteDistance() already computes the
   distance automatically — through google.maps Route.computeRoutes — but ONLY when
   settings.mapConfig.googleMapsApiKey is set. It is empty, and a Google key needs a billing
   account, so the button fell through to its other branch: open Google Maps in a tab and
   "อ่านระยะทางแล้วกรอกในช่อง (km)" by hand, on every quotation.

   ---------------------------------------------------------------- THE KEYLESS CHAIN

   Measured against the real data before writing any of this: of the 11 customers in the live
   project, ELEVEN have an address and NONE has latitude/longitude. So a keyless answer has to
   start by turning a Thai address into coordinates.

     1. normalise   Thai addresses carry prefixes that defeat a geocoder. Tested live:
                      "ต.คลองสอง อ.คลองหลวง จ.ปทุมธานี 12120"   -> no result
                      "คลองสอง คลองหลวง ปทุมธานี"                -> ตำบลคลองสอง, อำเภอคลองหลวง
                    so ต./อ./จ./แขวง/เขต/หมู่/บ้านเลขที่, the house number and the postcode come
                    off, and if the whole string still misses, the leading part is dropped and
                    it is asked again — a district or a province always resolves.
     2. geocode     Nominatim (OpenStreetMap). Free, no key, CORS open.
     3. route       OSRM (project-osrm.org). Free, no key, CORS open, real driving distance.
                    Verified end to end while designing this: Prawet, Bangkok -> Khlong Song,
                    Khlong Luang = 51.4 km / 43 min (straight line 42.4 km).
     4. fallback    If OSRM cannot be reached, the straight line between the two points times
                    1.25 — and it SAYS that is what it is.

   ---------------------------------------------------------------- WHAT IT COSTS, PLAINLY

   * The customer's address is sent to two free public services. Google already receives it
     today, the moment anybody presses this button — that is what the Maps tab is — but these
     are volunteer-run servers, so the address leaves for a different kind of place.
     settings.mapConfig.freeDistanceEngine = false turns all of it off and restores the old
     open-a-tab behaviour exactly.
   * ACCURACY IS SUB-DISTRICT, NOT DOORSTEP. A Thai house number rarely exists in OSM, so the
     answer is the distance to the ตำบล, not to the gate. That is usually right for a travel
     zone (0-15 / 16-30 / 31-50 / 51-80 …) and can be wrong at a boundary. The status line
     says which engine answered and the field stays editable, exactly as before.
   * WHEN IT RUNS (changed on the owner's instruction, 2026-09-18 — "เปลี่ยนปุ่ม Google map ตรงนั้น
     เป็นเข้าไปดู Map เหมือนเดิม แต่ให้เวลากดทำใบเสนอราคาในหน้าเคส เพิ่มตอนนั้นแทน และในกรณีที่กด
     ทำใบเสนอราคา เราจะเลือกบริษัทก่อนแล้วให้เติม auto หลังเลือกบริษัท"). The lookup takes a few
     seconds, so it no longer sits under the button where somebody is waiting for it; it runs
     at the two moments a quotation gains a customer, both of which js/03 already calls:

         quoteCustomerChanged()   js/03:1454   the company was chosen in the form
         loadCaseIntoQuote(cid)   js/03:1468   ทำใบเสนอราคา was pressed on a case

     📍 Google Maps goes back to what it always did: open the map in a tab. The number it
     fills in is editable and nothing overwrites it afterwards.

   * Nominatim asks for no more than one request a second and no bulk use. So requests are
     serialised one second apart, and every answer is cached in settings.geoCache — which
     travels, so the same customer is never looked up twice anywhere in the company, and the
     company's own address is looked up once in its life.
   * A Google key still wins. If one is ever configured, this file steps aside completely and
     js/03's Routes path runs untouched.

   js/03 is not edited. calculateQuoteDistance is a top-level async function and therefore a
   window property; the 📍 button's onclick resolves that property at click time. */
(function(){
 'use strict';

 var NOMINATIM='https://nominatim.openstreetmap.org/search';
 var OSRM='https://router.project-osrm.org/route/v1/driving/';
 var GAP=1100;          /* Nominatim: at most one request a second */
 var TIMEOUT=12000;
 var CACHE_MAX=200;
 var ROAD_FACTOR=1.25;  /* straight line -> road, measured 1.21 on the test route */

 function tl(th,en){try{return settings.language==='en'?en:th}catch(e){return th}}
 function toast(m){try{if(typeof toastMsg==='function')toastMsg(m)}catch(e){}}
 function cfg(){try{return settings.mapConfig||{}}catch(e){return {}}}
 function enabled(){return cfg().freeDistanceEngine!==false}
 function hasGoogleKey(){return !!String(cfg().googleMapsApiKey||'').trim()}
 function status(html){
  try{
   var el=document.getElementById('qRouteStatus');
   if(el)el.innerHTML=html;
  }catch(e){}
 }
 function esc2(v){return typeof window.esc==='function'?window.esc(v):String(v==null?'':v)}

 /* ------------------------------------------------------------ the address ---- */
 /* Everything a Thai address carries that a geocoder does not understand. */
 function normalise(addr){
  var s=String(addr||'');
  s=s.replace(/\s+/g,' ').trim();
  s=s.replace(/\b\d{5}\b/g,' ');                              /* postcode */
  s=s.replace(/^[\d\/\-]+\s*/,' ');                           /* 59/8 at the front */
  s=s.replace(/(บ้านเลขที่|เลขที่)\s*[\d\/\-]+/g,' ');
  s=s.replace(/(หมู่ที่|หมู่|ม\.)\s*\d+/g,' ');
  s=s.replace(/(ซอย|ซ\.)\s*[^\s,]+/g,' ');
  s=s.replace(/(ตำบล|ต\.|แขวง)\s*/g,' ');
  s=s.replace(/(อำเภอ|อ\.|เขต)\s*/g,' ');
  s=s.replace(/(จังหวัด|จ\.)\s*/g,' ');
  s=s.replace(/(ถนน|ถ\.)\s*/g,' ');
  s=s.replace(/[,]+/g,' ');
  return s.replace(/\s+/g,' ').trim();
 }
 /* "a b c d" -> ["a b c d","b c d","c d"] — a full address that misses still resolves once
    enough of the front has been dropped, and the last parts of a Thai address are the ones a
    map actually knows. */
 function candidates(addr){
  var base=normalise(addr);
  if(!base)return [];
  var parts=base.split(' ').filter(Boolean),out=[base];
  for(var i=1;i<parts.length-1&&out.length<4;i++){
   var tail=parts.slice(i).join(' ');
   if(tail.length>=6&&out.indexOf(tail)<0)out.push(tail);
  }
  return out;
 }

 /* ------------------------------------------------------------ the cache ---- */
 function store(){
  try{
   if(!settings.geoCache||typeof settings.geoCache!=='object')settings.geoCache={};
   return settings.geoCache;
  }catch(e){return {}}
 }
 function cached(q){var r=store()[q];return (r&&Number.isFinite(r.lat)&&Number.isFinite(r.lng))?r:null}
 function remember(q,lat,lng,label){
  try{
   var all=store(),keys=Object.keys(all);
   if(keys.length>=CACHE_MAX)delete all[keys[0]];
   all[q]={lat:lat,lng:lng,label:label||'',at:new Date().toISOString()};
   if(typeof saveLocal==='function')saveLocal();
   if(typeof cloudSaveSettings==='function')cloudSaveSettings();
  }catch(e){}
 }

 /* ------------------------------------------------------------ the network ---- */
 var queue=Promise.resolve(),lastCall=0;
 function polite(fn){
  queue=queue.then(function(){
   var wait=Math.max(0,GAP-(Date.now()-lastCall));
   return new Promise(function(r){setTimeout(r,wait)}).then(function(){
    lastCall=Date.now();
    return fn();
   });
  },function(){return fn()});
  return queue;
 }
 function getJSON(url){
  var ctrl=(typeof AbortController!=='undefined')?new AbortController():null;
  var t=setTimeout(function(){try{ctrl&&ctrl.abort()}catch(e){}},TIMEOUT);
  return fetch(url,{signal:ctrl?ctrl.signal:undefined,headers:{'Accept':'application/json'}})
   .then(function(r){clearTimeout(t);if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})
   .catch(function(e){clearTimeout(t);throw e});
 }

 /* A point for anything the quotation can hand us: {lat,lng} already, "13.7,100.5", or an
    address that has to be looked up. `allowNetwork` is false on the silent path. */
 function pointFor(value,allowNetwork){
  if(value&&typeof value==='object'&&Number.isFinite(Number(value.lat))&&Number.isFinite(Number(value.lng)))
   return Promise.resolve({lat:Number(value.lat),lng:Number(value.lng),label:'พิกัด'});
  var s=String(value||'').trim();
  if(!s)return Promise.resolve(null);
  var pair=s.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if(pair)return Promise.resolve({lat:Number(pair[1]),lng:Number(pair[2]),label:'พิกัด'});

  var tries=candidates(s);
  for(var i=0;i<tries.length;i++){
   var hit=cached(tries[i]);
   if(hit)return Promise.resolve({lat:hit.lat,lng:hit.lng,label:hit.label||tries[i],cached:true});
  }
  if(!allowNetwork||!tries.length)return Promise.resolve(null);

  var idx=0;
  function attempt(){
   if(idx>=tries.length)return Promise.resolve(null);
   var q=tries[idx++];
   var url=NOMINATIM+'?format=json&limit=1&countrycodes=th&q='+encodeURIComponent(q);
   return polite(function(){return getJSON(url)}).then(function(list){
    if(list&&list.length&&list[0]&&list[0].lat){
     var lat=Number(list[0].lat),lng=Number(list[0].lon);
     if(Number.isFinite(lat)&&Number.isFinite(lng)){
      remember(q,lat,lng,list[0].display_name||'');
      return {lat:lat,lng:lng,label:list[0].display_name||q};
     }
    }
    return attempt();
   },function(){return attempt()});
  }
  return attempt();
 }

 function haversine(a,b){
  var R=6371,p=Math.PI/180;
  var x=0.5-Math.cos((b.lat-a.lat)*p)/2
       +Math.cos(a.lat*p)*Math.cos(b.lat*p)*(1-Math.cos((b.lng-a.lng)*p))/2;
  return 2*R*Math.asin(Math.sqrt(x));
 }
 function route(a,b){
  var url=OSRM+a.lng+','+a.lat+';'+b.lng+','+b.lat+'?overview=false';
  return getJSON(url).then(function(j){
   var r=j&&j.routes&&j.routes[0];
   if(!r||!Number.isFinite(r.distance))throw new Error('no route');
   return {km:r.distance/1000,minutes:Math.round((r.duration||0)/60),engine:'osrm'};
  }).catch(function(){
   return {km:haversine(a,b)*ROAD_FACTOR,minutes:0,engine:'estimate'};
  });
 }

 /* ------------------------------------------------------------ the wrapper ---- */
 var base=window.calculateQuoteDistance;
 if(typeof base!=='function')return;

 window.calculateQuoteDistance=async function(showToast){
  /* A Google key is configured, or the free engine was switched off: js/03 owns this. */
  if(hasGoogleKey()||!enabled())return base.apply(this,arguments);

  /* THE 📍 BUTTON IS THE MAP AGAIN. showToast is true only when a person pressed it, and js/03
     answers that by opening Google Maps in a tab — which is what the owner asked for, because
     a lookup that takes a few seconds does not belong under a button somebody is watching.
     The automatic fill happens on the silent calls below instead. */
  if(showToast)return base.apply(this,arguments);

  var cu=null;
  try{cu=(typeof customerById==='function')?customerById(document.getElementById('qCustomer').value):null}catch(e){}
  if(!cu){
   if(showToast)toast(tl('กรุณาเลือกลูกค้าก่อน','Please choose a customer first'));
   status(esc2(tl('กรุณาเลือกลูกค้าก่อน','Please choose a customer first')));
   return;
  }

  var dest=null,origin=null;
  try{dest=window.googleRouteDestination?window.googleRouteDestination(cu):(cu.address||cu.location||'')}catch(e){}
  try{origin=window.googleRouteOrigin?window.googleRouteOrigin():''}catch(e){}
  if(!dest){
   status(esc2(tl('ลูกค้ายังไม่มีที่อยู่/พิกัด','This customer has no address or coordinates')));
   if(showToast)toast(tl('ลูกค้ายังไม่มีที่อยู่หรือพิกัด','No address or coordinates for this customer'));
   return;
  }

  status(esc2(tl('กำลังคำนวณระยะทางอัตโนมัติ…','Working out the distance…')));

  var a=null,b=null;
  try{
   a=await pointFor(origin,true);
   b=await pointFor(dest,true);
  }catch(e){}

  if(!a||!b){
   /* The address could not be resolved. It must NOT open a map tab on its own — a company
      being selected once opened Google Maps by itself, which was a real defect (2026-09-05
      §5) — so it says so and leaves the field to the person. */
   status(esc2(tl('หาพิกัดจากที่อยู่ลูกค้าไม่ได้ · กรอกระยะทางเอง หรือกดปุ่ม 📍 เพื่อดูเส้นทางใน Google Maps',
                  'Could not locate this address — type the distance, or press 📍 to open Google Maps')));
   return;
  }

  var r=await route(a,b);
  var km=Math.round(r.km*10)/10;
  try{
   var box=document.getElementById('qDistance');
   if(box){box.value=km;box.dispatchEvent(new Event('change',{bubbles:true}))}
  }catch(e){}
  try{quoteDistanceSource='osm'}catch(e){}
  try{quoteRouteDurationMinutes=r.minutes||0}catch(e){}
  try{if(typeof calcQuote==='function')calcQuote()}catch(e){}

  var where=String(b.label||'').split(',').slice(0,2).join(',').trim();
  var how=r.engine==='osrm'
   ? tl('OpenStreetMap · ระยะทางถนน','OpenStreetMap · road distance')
   : tl('ประมาณจากเส้นตรง × 1.25','estimated from the straight line × 1.25');
  status(esc2(how+': '+km.toLocaleString('th-TH')+' km '+tl('เที่ยวเดียว','one way')
    +(r.minutes?' · '+tl('ประมาณ ','about ')+r.minutes+tl(' นาที',' min'):''))
    +(where?'<br><small>'+esc2(tl('อ้างอิงตำแหน่ง: ','matched: ')+where)
      +' · '+esc2(tl('ระดับตำบล ปรับตัวเลขเองได้','sub-district level — you can edit the number'))+'</small>':''));
  toast('📍 '+tl('เติมระยะทางให้แล้ว ','Distance filled in: ')+km+' km'
    +(r.engine==='osrm'?'':tl(' (ประมาณ)',' (estimate)'))+tl(' · แก้ไขได้',' · editable'));
 };

 /* For the settings screen and for testing. */
 window.imodeAutoDistance={normalise:normalise,candidates:candidates,pointFor:pointFor,route:route};
})();
