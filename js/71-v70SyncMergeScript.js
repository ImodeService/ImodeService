/* js/71-v70SyncMergeScript.js — 2026-09-16
   A row that has not reached the cloud yet is no longer destroyed by the next sync.

   THE FLAW. syncCloud() (js/03:1649) replaces whole arrays:

       if(!a.error && a.data.length) cases        = a.data.map(fromCaseDb);
       if(!j.error && j.data.length) lineRequests = j.data.map(fromLineRequestDb);
       … saveLocal();

   so anything held locally that the cloud has not got is gone — permanently, because
   saveLocal() then writes the replacement over localStorage. A customer's แจ้งปัญหา is
   written locally BEFORE the upload is awaited, so if the upload fails or the tab is closed
   or the phone drops off the network in between, the report and its case exist only until
   the next sync and then vanish with nothing in the console. js/41 already learned this for
   the operational tables and merges by id there; the tables js/03 owns never did.

   WHAT IS NOT DONE, AND WHY. Protecting EVERY locally-held row that is missing from the
   cloud would be wrong: that wholesale replace is also how a delete made on another device
   reaches this one (js/52's cloudDelete removes the cloud row, and the other devices notice
   only by the row's absence). Blanket protection would resurrect every record anybody
   deleted while this device was offline.

   So a row is protected only while THE CLOUD HAS NEVER ACKNOWLEDGED IT. Every id that comes
   back in a sync is remembered in imode_v70_cloud_seen; once an id is in that list the cloud
   is the authority on it and its later absence is taken as a real delete. An id the cloud has
   never returned is, by definition, one this device has never confirmed as uploaded, so it is
   kept and pushed again.

   FIRST RUN. On a device that has never run this file the remembered list is empty, which
   would make every local-only row look unconfirmed — including ones legitimately deleted
   elsewhere. So the first sync only SEEDS the list, and protects nothing except rows created
   in the last two hours, which cannot plausibly be old remote deletes and are exactly the
   failed uploads this file exists for.

   Scope is deliberately the two tables the reported loss involved — cases and lineRequests.
   Adding another is one entry in TABLES, but each one is a decision about delete propagation,
   not a free win. */
(function(){
 'use strict';
 if(typeof window.syncCloud!=='function')return;

 var SEEN_KEY='imode_v70_cloud_seen';   /* device-local: what the cloud has acknowledged here */
 var CAP_KEEP=50;                       /* rows rescued per table per sync */
 var CAP_SEEN=4000;                     /* ids remembered per table */
 var FRESH_MS=2*60*60*1000;             /* "created just now" window used on the first run */

 /* cases and lineRequests are top-level `let` in js/03: lexical globals, absent from window.
    They are read AND assigned by bare identifier — assigning to an existing lexical binding
    from another classic script is legal; only creating an implicit global is not. */
 var TABLES=[
  {name:'cases',
   get:function(){return (typeof cases!=='undefined'&&Array.isArray(cases))?cases:null},
   set:function(v){cases=v},
   push:'cloudUpsertCase'},
  {name:'lineRequests',
   get:function(){return (typeof lineRequests!=='undefined'&&Array.isArray(lineRequests))?lineRequests:null},
   set:function(v){lineRequests=v},
   push:'cloudUpsertLineRequest'}
 ];

 function readSeen(){
  try{var o=JSON.parse(localStorage.getItem(SEEN_KEY)||'{}');return (o&&typeof o==='object')?o:{}}
  catch(e){return {}}
 }
 function writeSeen(o){try{localStorage.setItem(SEEN_KEY,JSON.stringify(o))}catch(e){}}

 function idsOf(list){
  var m=Object.create(null);
  (list||[]).forEach(function(r){if(r&&r.id)m[r.id]=1});
  return m;
 }
 function stamp(r){
  var v=(r&&(r.createdAt||r.updatedAt))||'';
  var t=v?new Date(v).getTime():NaN;
  return isNaN(t)?0:t;
 }
 function isFresh(r){return (Date.now()-stamp(r))<FRESH_MS}

 /* Newest first, which is the order every list in this application expects. A row with no
    usable date sorts last rather than jumping to the top. */
 function mergeBack(list,keep){
  var out=list.concat(keep);
  out.sort(function(a,b){return stamp(b)-stamp(a)});
  return out;
 }

 function reconcile(before){
  var seen=readSeen();
  var firstRun=!seen.__seeded;
  var changed=false,repush=[];

  TABLES.forEach(function(t){
   var now=t.get();
   if(!now)return;
   var prev=before[t.name];
   if(!Array.isArray(prev)||!prev.length)return;

   var here=idsOf(now);
   var known=Object.create(null);
   (Array.isArray(seen[t.name])?seen[t.name]:[]).forEach(function(id){known[id]=1});

   var keep=[];
   prev.forEach(function(r){
    if(!r||!r.id||here[r.id])return;                  /* still present: nothing to do */
    if(known[r.id])return;                            /* the cloud had it and does not now: deleted */
    if(firstRun&&!isFresh(r))return;                  /* seeding: only rescue what is clearly new */
    if(keep.length<CAP_KEEP)keep.push(r);
   });

   if(keep.length){
    t.set(mergeBack(now,keep));
    changed=true;
    keep.forEach(function(r){repush.push({table:t,row:r})});
    console.warn('[imode sync-merge] kept '+keep.length+' local '+t.name
     +' row(s) the cloud does not have, and is re-uploading them');
   }

   /* Everything the cloud just returned is acknowledged from now on. */
   var merged=(Array.isArray(seen[t.name])?seen[t.name]:[]).slice();
   Object.keys(here).forEach(function(id){if(!known[id])merged.push(id)});
   if(merged.length>CAP_SEEN)merged=merged.slice(merged.length-CAP_SEEN);
   seen[t.name]=merged;
  });

  seen.__seeded=1;
  writeSeen(seen);

  if(changed){
   try{if(typeof saveLocal==='function')saveLocal()}catch(e){}
   try{if(typeof renderAll==='function')renderAll()}catch(e){}
  }
  /* Re-upload AFTER the arrays are repaired, so a failure here cannot leave the screen and
     the storage disagreeing. Each is fire-and-forget: js/24 already reports a write that
     fails, and a row that still does not make it stays protected for the next sync. */
  repush.forEach(function(job){
   try{
    var fn=window[job.table.push];
    if(typeof fn==='function')fn(job.row);
   }catch(e){}
  });
 }

 var base=window.syncCloud;
 window.syncCloud=function(){
  var before={};
  TABLES.forEach(function(t){
   var cur=t.get();
   before[t.name]=cur?cur.slice():[];      /* a shallow copy: the base REPLACES the array */
  });
  var out;
  try{out=base.apply(this,arguments)}
  catch(e){throw e}
  var after=function(){try{reconcile(before)}catch(e){console.warn('[imode sync-merge]',e)}};
  if(out&&typeof out.then==='function')out.then(after,after);
  else after();
  return out;
 };

 /* For the console, and for a suite: what this device believes the cloud has acknowledged. */
 window.imodeSyncSeen=function(){return readSeen()};
})();
