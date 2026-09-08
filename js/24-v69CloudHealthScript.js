/* V6.9 — a rejected cloud write is no longer silent.

   THE PROBLEM THIS SOLVES

   js/03 ends every cloud write with:

       async function cloudUpsert(table,obj){
         if(!supa)return;
         try{const {error}=await supa.from(table).upsert(obj);if(error)throw error}
         catch(e){console.warn(e)}          <-- swallowed
       }

   and decides the connection is healthy on a read alone:

       const {error}=await supa.from('service_cases').select('id').limit(1);
       if(error)throw error; updateCloudUI(true)

   Under Row Level Security with no policy for the `anon` role — which is what
   02-rls.sql produces, because every policy in it is `to authenticated` and nobody in
   this application is ever authenticated with Supabase — a SELECT returns HTTP 200 with
   zero rows rather than an error. So the probe passes, the badge says "Cloud Connected",
   and every single write is rejected with 42501 where only the console can see it.

   A customer submitted a report, the app said it was sent, and nothing left the phone.

   WHAT THIS DOES

   Replaces window.cloudUpsert with the same one line of work plus an outcome record, and
   surfaces the first failure. It does not retry, does not queue, and does not change what
   is written — a failed write still fails, it is just no longer invisible.

   `supa` and `cloudSettings` are top-level `let` bindings in js/03: lexical globals, shared
   across classic scripts but absent from `window`. They are read here by bare identifier.

   Loads last, so its wrapper is the outermost one. It registers no permission key, so the
   "must load before js/20" rule does not apply to it. */
(function () {
 'use strict';

 var state = { ok: 0, failed: 0, lastError: null, lastTable: '', notified: false };

 function toast(msg) {
  try { if (typeof toastMsg === 'function') toastMsg(msg); } catch (e) {}
 }

 /* 42501 is the one that means "RLS refused this", as opposed to a network blip. */
 function isDenied(e) {
  return !!e && (e.code === '42501' || /row-level security/i.test(e.message || ''));
 }

 function describe(e) {
  if (!e) return 'unknown error';
  if (isDenied(e)) return 'ฐานข้อมูลปฏิเสธการบันทึก (RLS 42501)';
  return e.message || String(e);
 }

 function record(table, err) {
  if (!err) { state.ok++; return; }
  state.failed++;
  state.lastError = err;
  state.lastTable = table;
  console.warn('[imode cloud] upsert ' + table + ' failed:', err);

  /* Once per session. Repeating it on every row of a sync would bury the page in toasts. */
  if (!state.notified) {
   state.notified = true;
   toast('บันทึกขึ้นระบบส่วนกลางไม่สำเร็จ: ' + describe(err));
   if (isDenied(err)) {
    console.warn('[imode cloud] Every write will fail until the database grants the anon '
     + 'role write access. See supabase/04-anon-uat.sql.');
   }
  }
  refreshBadge();
 }

 /* The settings page line, so the state is visible somewhere other than a toast. */
 function refreshBadge() {
  try {
   if (typeof cloudResult === 'undefined' || !cloudResult) return;
   if (!state.failed) return;
   cloudResult.textContent = 'เชื่อมต่อได้ แต่บันทึกข้อมูลไม่ได้ — '
    + describe(state.lastError) + ' (ล้มเหลว ' + state.failed + ' รายการ)';
  } catch (e) {}
 }

 var baseUpsert = window.cloudUpsert;
 if (typeof baseUpsert === 'function') {
  /* Reimplemented rather than delegated: the original catches internally, so wrapping it
     can never see whether the write actually landed. This is the same single statement. */
  window.cloudUpsert = async function (table, obj) {
   if (typeof supa === 'undefined' || !supa) return;
   try {
    var res = await supa.from(table).upsert(obj);
    if (res.error) throw res.error;
    record(table, null);
   } catch (e) {
    record(table, e);
   }
  };
 }

 /* Keep the warning on screen when something else repaints the settings page. */
 var baseUpdateUI = window.updateCloudUI;
 if (typeof baseUpdateUI === 'function') {
  window.updateCloudUI = function () {
   var r = baseUpdateUI.apply(this, arguments);
   refreshBadge();
   return r;
  };
 }

 /* Deliberately manual: it writes a canary row and deletes it again, which is not something
    to do on every boot of every customer's phone. Run imodeCloudSelfTest() in the console.
    This is the check that distinguishes "the table is empty" from "I am not allowed to see
    it", which a plain read cannot do. */
 window.imodeCloudSelfTest = async function (table) {
  table = table || 'system_settings';
  var out = { table: table, connected: false, canRead: false, canWrite: false, rows: null, error: null };
  if (typeof supa === 'undefined' || !supa) { out.error = 'ยังไม่ได้เชื่อม Cloud'; console.table(out); return out; }
  out.connected = true;
  try {
   var r = await supa.from(table).select('id');
   if (r.error) throw r.error;
   out.canRead = true;
   out.rows = r.data.length;
  } catch (e) { out.error = 'read: ' + describe(e); console.table(out); return out; }

  var id = '__imode_selftest__';
  try {
   var w = await supa.from(table).upsert({ id: id });
   if (w.error) throw w.error;
   out.canWrite = true;
   await supa.from(table).delete().eq('id', id);
  } catch (e) {
   out.error = 'write: ' + describe(e);
  }
  console.table(out);
  if (out.canRead && !out.canWrite) {
   console.warn('[imode cloud] Read-only. A read returning ' + out.rows + ' rows under RLS '
    + 'does NOT prove the table is empty. Run supabase/04-anon-uat.sql.');
  }
  return out;
 };

 window.imodeCloudHealth = function () {
  return {
   connected: (typeof supa !== 'undefined' && !!supa),
   url: (typeof cloudSettings !== 'undefined' && cloudSettings) ? cloudSettings.url || '' : '',
   writesOk: state.ok,
   writesFailed: state.failed,
   lastTable: state.lastTable,
   lastError: state.lastError ? describe(state.lastError) : null
  };
 };
})();
