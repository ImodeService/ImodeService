/* V6.9 — every device connects to the shared database by itself.

   cloudSettings comes from one place only:

       let cloudSettings = JSON.parse(localStorage.getItem(K.cloud) || '{}')   // js/03:189

   which is per-device. A member of staff can type the URL and key into
   ตั้งค่าระบบ → ฐานข้อมูล Cloud, but a customer who scans a machine QR on their own phone
   never can — so their phone stayed in Local Mode, their case was written to their own
   localStorage, and the admin never saw it. That is the whole reason a reported case did
   not reach the office.

   The connection details are therefore shipped with the application. The publishable key
   is designed to be public — it is handed to every browser that opens the site the moment
   the app is configured at all — so putting it here changes nothing about who can see it.

   WHAT PROTECTS THE DATA IS NOT THIS KEY, IT IS ROW LEVEL SECURITY, AND RLS IS CURRENTLY
   OFF on this project (it had to be: 02-rls.sql grants writes `to authenticated` only, and
   nobody in this application is authenticated with Supabase — customers have no accounts
   and staff sign in against the local UAT registry). While it is off, anyone who reads this
   file can read and write the database. That is a deliberate, temporary UAT choice on a
   project named service_Imode_test. Do not put real customer records in it until RLS is
   back on with policies that match how people actually sign in — see supabase/README.md.

   To point the app at a different project, change the two values below. To disconnect one
   device, use the ใช้ข้อมูลในเครื่อง button in Settings; that is remembered here so this
   script does not silently reconnect it on the next reload. */
(function(){
 'use strict';

 var DEFAULT_CLOUD={
  url:'https://ywlrlfudlxsallanoroq.supabase.co',
  key:'sb_publishable_HmX5AeClb2ln3XG7umpHaw_kWw7E1kk'
 };
 var OPT_OUT='imode_v69_cloud_optout';

 if(typeof cloudSettings!=='object'||!cloudSettings)return;

 /* Someone pressed ใช้ข้อมูลในเครื่อง on this device — leave it alone. */
 var optedOut=false;
 try{optedOut=localStorage.getItem(OPT_OUT)==='1'}catch(e){}

 var configured=!!(cloudSettings.url&&cloudSettings.key);
 if(!configured&&!optedOut&&DEFAULT_CLOUD.url&&DEFAULT_CLOUD.key){
  cloudSettings.url=DEFAULT_CLOUD.url;
  cloudSettings.key=DEFAULT_CLOUD.key;
  /* Written through so the Settings page shows the values and so initCloud(), which runs
     later in the boot sequence (renderAll -> await initCloud -> initPortalFromUrl), reads
     a configured client. */
  try{localStorage.setItem('imode_v5_cloud',JSON.stringify(cloudSettings))}catch(e){}
 }

 /* Remember a deliberate disconnect, and forget it again when someone reconnects. */
 var baseDisconnect=window.disconnectCloud;
 if(typeof baseDisconnect==='function'){
  window.disconnectCloud=function(){
   try{localStorage.setItem(OPT_OUT,'1')}catch(e){}
   return baseDisconnect.apply(this,arguments);
  };
 }
 var baseSave=window.saveCloudSettings;
 if(typeof baseSave==='function'){
  window.saveCloudSettings=function(){
   try{localStorage.removeItem(OPT_OUT)}catch(e){}
   return baseSave.apply(this,arguments);
  };
 }
 window.imodeDefaultCloud=DEFAULT_CLOUD;
})();
