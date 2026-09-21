/* js/90-v70SettingsMergeScript.js — 2026-09-21
   THE SETTINGS BLOB IS WRITTEN WHOLESALE, SO ONE DEVICE DELETES ANOTHER DEVICE'S RECORDS.

   Reported: sign ผู้อนุมัติ and ผู้จัดทำ on service-case-detail.html, reload, and every
   signature is gone — the customer's included — while index.html on another origin still
   shows them all.

   MEASURED ON THE LIVE PROJECT before anything was written, and the chain is exact:

     01:28:45  the case page saves the two staff signatures. quotations.authorized_by /
               prepared_by are updated (real columns, they survived), and the images go into
               system_settings.data.quoteStaffSigns — the case page reads the row fresh and
               merges only its own key, so that write is correct.
     01:28:45  the application, open on another screen, hears the `quotations` UPDATE on
               realtime. js/80's fingerprint for that quotation has changed, so it re-bakes
               the stored paper and calls push() -> saveLocal() + cloudSaveSettings().
     01:33:31  cloudSaveSettings() (js/03:1727) does
                   cloudUpsert('system_settings',{id:'main',data:settings,…})
               — the WHOLE in-memory blob. That copy was read at boot, before 01:28:45, so it
               has no quoteStaffSigns at all. The write does not merge; it replaces.

   Result, read back out of the database: `quoteStaffSigns` ABSENT, `quoteApprovals` holding
   only …-019 and …-020 with the reported quotation's customer approval gone too, and the
   re-baked paper fingerprinted `อนุมัติ|2026-09-21T01:28:45.839Z|||2568||` — the two empty
   fields at the end are the staff-signature timestamps the application could not see.

   Nothing was wrong with the case page, and nothing was wrong with the signature code. The
   flaw is that `settings` is one jsonb blob and every device pushes its own whole copy, so
   ANY key another device added since this device last read is destroyed on the next push.
   js/85 made this certain rather than merely likely for signatures: `quoteStaffSigns` is not
   in its SETTING_KEYS, so a running application can never learn a staff signature exists and
   is guaranteed to wipe it.

   THE RULE THIS FILE IMPOSES, in both directions:

       a settings push may not delete an id the cloud has and this device does not
       a settings sync may not delete an id this device has and the cloud does not

   Additive by id only. For the seven operational keys below — all of them {id: record} maps
   that only ever grow — an id present on one side and missing on the other is kept; an id
   present on both is left exactly as it is. So a deliberate edit still wins, js/75's SIG_CAP
   trimming still works (it keeps the id and drops .sig, and a present id is never touched),
   and no configuration key is involved at all.

   The sync half also heals: a device that still holds a record the cloud lost pushes it back
   on its next sync, which is how the signatures already destroyed come home without anybody
   re-signing — provided that device loads this file before it syncs again.

   COST: one 110 KB read of the settings row before each settings push. Settings pushes are a
   handful per session (a Settings screen save, or js/80 when a quotation paper really
   changed), so this is cheap next to losing a signature.

   Loads last, after js/29, js/47 and js/71, so its wrappers are the outermost ones and it
   sees the result of every earlier repair. */
(function(){
 'use strict';

 /* {id: record} maps written by one device for the others to read. Arrays (trash,
    uatAccounts) and configuration are deliberately NOT here — they cannot be unioned by id
    and an edit to them is meant to replace.

    quoteDocs IS DELIBERATELY ABSENT, although it is the same shape. It is a cache of papers
    js/80 re-bakes from the quotation whenever its fingerprint changes, it holds no signature
    (renderPaper() strips every data URL out of the stored copy), and js/80 caps it at
    DOC_CAP=25 — today 71 KB of the row's 108 KB. Protecting it would mean each device
    re-adding the entries another device had just trimmed, so the cap would never hold and the
    blob would grow without limit; losing an entry costs a re-bake and nothing else.

    Where a merge and a cap do meet — caseStatusLog is capped per case by js/69, and js/75
    drops .sig from all but the 40 newest approvals — the merge wins and the cap becomes
    approximate. js/75's cap is unaffected in practice because it keeps the id and only drops
    the image, and an id present on both sides is never touched here. */
 var MAP_KEYS=['quoteApprovals','quoteStaffSigns','quoteAccepts',
               'quoteRequestLink','caseFeedback','caseStatusLog'];

 var has=function(o,k){return Object.prototype.hasOwnProperty.call(o,k)};

 /* `settings` and `supa` are top-level let in js/03 — lexical globals, never on window. */
 function live(){try{return settings&&typeof settings==='object'?settings:null}catch(e){return null}}
 function client(){try{return supa||null}catch(e){return null}}

 /* Copy into `target` every id `source` has that `target` does not. Returns how many moved,
    so a caller can tell whether anything is worth saving or pushing. */
 function adopt(target,source){
  if(!target||!source||typeof source!=='object')return 0;
  var added=0;
  MAP_KEYS.forEach(function(k){
   var src=source[k];
   if(!src||typeof src!=='object'||Array.isArray(src))return;
   var dst=target[k];
   if(!dst||typeof dst!=='object'||Array.isArray(dst)){dst={};target[k]=dst}
   Object.keys(src).forEach(function(id){
    if(has(dst,id))return;                 /* both sides know it — leave it alone */
    dst[id]=src[id];added++;
   });
  });
  return added;
 }

 /* The sub-objects of the outgoing settings are never mutated by mergeSettings(), which
    builds a fresh object out of the parsed cloud copy, so holding references is enough and
    no deep clone is needed. */
 function snapshot(){
  var s=live();
  if(!s)return null;
  var out={},took=false;
  MAP_KEYS.forEach(function(k){
   var v=s[k];
   if(v&&typeof v==='object'&&!Array.isArray(v)){out[k]=v;took=true}
  });
  return took?out:null;
 }

 /* ---------------------------------------------------------- 1. the push ---- */
 var basePush=window.cloudSaveSettings;
 if(typeof basePush==='function'){
  /* Serialised: two pushes in the same moment would otherwise both read the row before
     either wrote it, and the second would undo the first. */
  var chain=Promise.resolve();
  window.cloudSaveSettings=function(){
   var self=this,args=arguments;
   var step=function(){
    var sb=client(),s=live();
    if(!sb||!s)return basePush.apply(self,args);
    return Promise.resolve(sb.from('system_settings').select('data').eq('id','main').maybeSingle())
     .then(function(res){
      var remote=res&&!res.error&&res.data&&res.data.data;
      if(!remote||typeof remote!=='object')return;
      if(!adopt(s,remote))return;
      /* Keep what we just learned rather than re-reading it on every push. */
      try{if(typeof saveLocal==='function')saveLocal()}catch(e){}
     },function(){/* offline or refused: push as before rather than losing the save */})
     .then(function(){return basePush.apply(self,args)});
   };
   var run=chain.then(step,step);
   chain=run.then(function(){},function(){});   /* never leave the chain rejected */
   return run;
  };
 }

 /* ---------------------------------------------------------- 2. the sync ---- */
 var baseSync=window.syncCloud;
 if(typeof baseSync==='function'){
  window.syncCloud=function(){
   var keep=snapshot();                      /* taken BEFORE settings is replaced */
   var r=baseSync.apply(this,arguments);
   var done=function(){
    try{
     var s=live();
     if(!s||!keep)return;
     if(!adopt(s,keep))return;               /* the incoming copy dropped nothing */
     if(typeof saveLocal==='function')saveLocal();
     /* Push the union back so the shared row stops being short for every other device. It
        converges: the next sync finds nothing left to adopt. */
     if(typeof cloudSaveSettings==='function'){try{cloudSaveSettings()}catch(e){}}
     if(typeof renderAll==='function')renderAll();
    }catch(e){}
   };
   if(r&&typeof r.then==='function')r.then(done,done);
   else done();
   return r;
  };
 }

 /* A way to see what this is doing from the console, and nothing else on window. */
 window.imodeSettingsMerge=function(){
  var s=live(),out={};
  MAP_KEYS.forEach(function(k){
   var v=s&&s[k];
   out[k]=(v&&typeof v==='object'&&!Array.isArray(v))?Object.keys(v).length:0;
  });
  return out;
 };
})();
