/* Beta 1.0 — a status changed on another device shows up here without a reload.

   REPORTED (2026-09-18): "ทำอัพเดตสถานะ realtime" — the owner chose Supabase Realtime (a push
   over the websocket the client already has) over polling.

   WHAT IT WAS BEFORE, measured: syncCloud() runs ONCE, from initCloud() inside js/03's `load`
   handler (js/03:1671). Nothing else ever calls it on a timer. So a case assigned on the
   coordinator's PC reached the technician's phone only when that phone reloaded the page —
   the data was shared, the screen was not.

   ------------------------------------------------------------------ WHAT THIS FILE DOES

   Subscribes to postgres_changes on two tables and applies each row as it arrives:

       service_cases            status, assignee, appointment — the thing people wait for
       line_customer_requests   a customer's report, the moment they send it

   It does NOT call syncCloud() on every event. syncCloud() downloads eleven tables and does
   `cases = a.data.map(...)` — a wholesale replacement — which would throw away a row this
   device has written but not yet pushed (the very thing js/71 exists to protect) and would
   re-render everything several times a minute. One row arrives, one row is applied.

   ------------------------------------------------------------------ THINGS THAT MATTER

   1. THE ARRAYS ARE MUTATED IN PLACE, never reassigned. `cases` and `lineRequests` are
      top-level `let` in js/03 — lexical globals, absent from window (part 17 §5) — and every
      render function closes over the same array object. splice/unshift keeps all of them in
      step; assigning a new array from here would be legal but would strand nobody knows how
      many other references.

   2. OUR OWN WRITES COME BACK TO US. Postgres does not know which browser made the change,
      so every write this device pushes returns as an event. `updated_at` is the guard: a row
      whose stamp is not NEWER than the copy in memory is dropped, which quietly swallows the
      echo and, as a bonus, any out-of-order delivery. line_customer_requests has no
      updated_at column at all, so those rows are compared by value instead.

   3. THE ROW IS MAPPED THROUGH window.fromCaseDb / window.fromLineRequestDb — the same
      functions syncCloud() uses, and the ones js/38 (the technician crew in one column),
      js/42 (the customer's photos) and js/48 (ตอบกลับแล้ว) have wrapped. Re-implementing the
      column mapping here would have lost all three the day one of them changed.

   4. A DELETE is honoured. It is how js/52's delete-to-bin reaches other devices, and until
      now that only happened on a reload.

   5. WITHOUT supabase/08-v70-realtime.sql NOTHING ARRIVES AND NOTHING BREAKS. The channel
      subscribes successfully either way — an unpublished table is not an error, it is simply
      silent — so this cannot be detected from the browser. The console line below says so,
      and imodeRealtimeState() reports what the socket is doing.

   6. service-case-detail.html IS A SEPARATE DOCUMENT and does not load js/*. It still reads
      its case once, at open. Not addressed here. */
(function(){
 'use strict';

 var DEBOUNCE=250;          /* one repaint per burst, not one per row */
 var RETRY=[2000,5000,15000,30000];

 function tl(th,en){try{return settings.language==='en'?en:th}catch(e){return th}}
 function toast(m){try{if(typeof toastMsg==='function')toastMsg(m)}catch(e){}}
 function client(){try{return (typeof supa!=='undefined')?supa:null}catch(e){return null}}

 var state={on:false,status:'',events:0,applied:0,tables:[],tries:0};
 window.imodeRealtimeState=function(){return JSON.parse(JSON.stringify(state))};

 /* ------------------------------------------------------------------ the tables ---- */
 /* Each entry says how to reach the live array, how to turn a database row into one of its
    members, and how to tell whether an incoming row is newer than the one in memory. */
 var TABLES=[
  {
   name:'service_cases',
   list:function(){try{return Array.isArray(cases)?cases:null}catch(e){return null}},
   map:function(row){
    try{return (typeof window.fromCaseDb==='function')?window.fromCaseDb(row):null}
    catch(e){return null}
   },
   newer:function(incoming,local){
    var a=String(incoming&&incoming.updatedAt||''),b=String(local&&local.updatedAt||'');
    return !b||(a&&a>b);
   },
   describe:function(c){
    return (c.ticket||c.id)+(c.status?' → '+c.status:'');
   }
  },
  {
   name:'line_customer_requests',
   list:function(){try{return Array.isArray(lineRequests)?lineRequests:null}catch(e){return null}},
   map:function(row){
    try{return (typeof window.fromLineRequestDb==='function')?window.fromLineRequestDb(row):null}
    catch(e){return null}
   },
   /* No updated_at on this table, so "newer" means "different at all". */
   newer:function(incoming,local){
    try{return JSON.stringify(incoming)!==JSON.stringify(local)}catch(e){return true}
   },
   describe:function(r){
    return tl('คำขอใหม่จากลูกค้า','New customer request')+(r.type?' · '+r.type:'');
   }
  }
 ];

 /* ------------------------------------------------------------------ applying ---- */
 var dirty=false,timer=null,lastNote='';

 function apply(cfg,payload){
  state.events++;
  var list=cfg.list();
  if(!list)return;
  var ev=String(payload&&payload.eventType||'').toUpperCase();
  var row=(ev==='DELETE')?(payload&&payload.old):(payload&&payload.new);
  var id=row&&row.id;
  if(!id)return;

  var at=-1;
  for(var i=0;i<list.length;i++)if(list[i]&&list[i].id===id){at=i;break}

  if(ev==='DELETE'){
   if(at<0)return;
   list.splice(at,1);
   mark(tl('มีรายการถูกลบจากอีกเครื่อง','A record was deleted on another device'));
   return;
  }

  var mapped=cfg.map(row);
  if(!mapped||!mapped.id)return;
  if(at>=0){
   if(!cfg.newer(mapped,list[at]))return;      /* our own echo, or an older copy */
   list[at]=mapped;
  }else{
   list.unshift(mapped);
  }
  mark(cfg.describe(mapped));
 }

 function mark(note){
  state.applied++;
  if(note)lastNote=note;
  dirty=true;
  if(timer)return;
  timer=setTimeout(flush,DEBOUNCE);
 }

 /* One save and one repaint per burst. renderAll() is what every other write in this project
    calls; the patch pages are not in it — they are drawn by their own goPage wrappers — so the
    active one is redrawn by name, exactly the way js/26 does it. */
 function flush(){
  timer=null;
  if(!dirty)return;
  dirty=false;
  try{if(typeof saveLocal==='function')saveLocal()}catch(e){}
  try{if(typeof renderAll==='function')renderAll()}catch(e){}
  var active=(document.querySelector('.page.active')||{}).id||'';
  var pages={
   'page-my-work':'imodeRenderMyWork','page-assign':'imodeRenderAssign',
   'page-quote-view':'imodeRenderQuoteView','page-done-jobs':'imodeRenderDoneJobs',
   'page-requests':'imodeRenderRequests','page-field-all':'imodeRenderFieldAll'
  };
  var fn=pages[active];
  if(fn&&typeof window[fn]==='function'){try{window[fn]()}catch(e){}}
  if(lastNote){toast('🔄 '+lastNote);lastNote=''}
 }

 /* ------------------------------------------------------------------ the channel ---- */
 var channel=null;

 function stop(){
  if(!channel)return;
  try{var c=client();if(c&&c.removeChannel)c.removeChannel(channel)}catch(e){}
  channel=null;
  state.on=false;state.status='closed';state.tables=[];
 }

 function start(){
  var c=client();
  if(!c||channel)return;
  if(typeof c.channel!=='function'){
   state.status='unsupported';           /* an older supabase-js without realtime */
   return;
  }
  try{
   channel=c.channel('imode-live-'+Math.random().toString(36).slice(2,8));
   TABLES.forEach(function(cfg){
    channel.on('postgres_changes',{event:'*',schema:'public',table:cfg.name},function(p){
     try{apply(cfg,p)}catch(e){}
    });
    state.tables.push(cfg.name);
   });
   channel.subscribe(function(status){
    state.status=String(status||'');
    if(status==='SUBSCRIBED'){
     state.on=true;state.tries=0;
     /* Subscribing succeeds whether or not the table is actually published, so this is the
        one place that can tell somebody how to check. */
     try{console.info('[imode] realtime on:',state.tables.join(', '),
       '— if nothing ever arrives, run supabase/08-v70-realtime.sql')}catch(e){}
     return;
    }
    if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
     state.on=false;
     retry();
    }
   });
  }catch(e){
   state.status='error';
   channel=null;
   retry();
  }
 }

 function retry(){
  if(state.tries>=RETRY.length)return;
  var wait=RETRY[state.tries++];
  setTimeout(function(){
   if(state.on)return;
   stop();
   start();
  },wait);
 }

 /* ------------------------------------------------------------------ wiring ---- */
 /* `supa` is created inside initCloud(), which js/03's load handler awaits. initCloud is a
    top-level async function and therefore a window property, so this starts the moment the
    connection really exists rather than guessing at a delay. */
 var baseInit=window.initCloud;
 if(typeof baseInit==='function'){
  window.initCloud=async function(){
   var r=await baseInit.apply(this,arguments);
   try{if(client())start();else stop()}catch(e){}
   return r;
  };
 }
 /* Connecting or disconnecting from ตั้งค่าระบบ → ฐานข้อมูล Cloud. */
 ['saveCloudSettings','disconnectCloud'].forEach(function(name){
  var base=window[name];
  if(typeof base!=='function')return;
  window[name]=function(){
   var r=base.apply(this,arguments);
   var done=function(){try{stop();if(client())start()}catch(e){}};
   if(r&&typeof r.then==='function')r.then(done,done);else setTimeout(done,300);
   return r;
  };
 });
 /* A tab that was asleep may have missed events while the socket was down; the row it is
    looking at is redrawn from what did arrive, and anything older is still caught by the next
    reload, exactly as before this file existed. */
 document.addEventListener('visibilitychange',function(){
  if(document.visibilityState!=='visible')return;
  if(!client()||state.on)return;
  state.tries=0;stop();start();
 });
 window.addEventListener('load',function(){setTimeout(function(){if(client()&&!channel)start()},1500)});
 window.imodeRealtimeStart=start;
 window.imodeRealtimeStop=stop;
})();
