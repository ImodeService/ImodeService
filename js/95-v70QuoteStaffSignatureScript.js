/* Beta 1.0 — company signatures inside the quotation module. */
(function(){
  'use strict';
  var roles={
    authorized:{pad:'quoteAuthorizedSignPad',name:'quoteAuthorizedSignName',nameKey:'authorizedBy',dateKey:'authorizedDate'},
    prepared:{pad:'quotePreparedSignPad',name:'quotePreparedSignName',nameKey:'preparedBy',dateKey:'preparedDate'}
  };
  function quote(){try{return quotations.find(function(q){return q.id===quoteEditingId})||null}catch(e){return null}}
  function record(key,q){var all=(settings.quoteStaffSigns||{})[q.id]||{},r=all[key]||null,created=Date.parse(q.createdAt||''),signed=Date.parse(r&&r.at||'');return r&&(!Number.isFinite(created)||!Number.isFinite(signed)||signed>=created)?r:null}
  function hasInk(canvas){if(!canvas)return false;var d=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,n=0;for(var i=3;i<d.length;i+=4)if(d[i]>20&&++n>20)return true;return false}
  function imageData(canvas){var w=300,h=Math.max(1,Math.round(canvas.height*w/canvas.width)),out=document.createElement('canvas');out.width=w;out.height=h;out.getContext('2d').drawImage(canvas,0,0,w,h);return out.toDataURL('image/png')}
  function setPad(id,src){var canvas=document.getElementById(id);if(!canvas)return;if(!canvas.dataset.quoteSignReady&&typeof initSignaturePad==='function'){initSignaturePad(id);canvas.dataset.quoteSignReady='1'}var ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);if(src){var img=new Image();img.onload=function(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height)};img.src=src}}
  function updateHint(){var h=document.getElementById('quoteStaffSignHint'),q=quote();if(h)h.textContent=q?'ลายเซ็นจะเชื่อมกับ '+q.id+' และแสดงในตัวอย่าง/PDF':'บันทึกใบเสนอราคาก่อนลงลายเซ็น'}
  function loadPads(){var q=quote();Object.keys(roles).forEach(function(key){var x=roles[key],name=document.getElementById(x.name),r=q&&record(key,q);if(name)name.value=(r&&r.name)||(q&&q[x.nameKey])||(currentUser&&currentUser.name)||'';setPad(x.pad,(r&&r.sig)||'')});updateHint()}
  function roleJob(key,required){var x=roles[key],q=quote(),name=document.getElementById(x.name),canvas=document.getElementById(x.pad),value=String(name&&name.value||'').trim(),ink=hasInk(canvas);if(!q){toastMsg('กรุณาบันทึกใบเสนอราคาก่อนลงลายเซ็น');return null}if(!value&&!ink&&!required)return false;if(!value){toastMsg('กรุณาระบุชื่อผู้ลงลายเซ็น');return null}if(!ink){toastMsg('กรุณาลงลายเซ็นหรือแนบรูปลายเซ็น');return null}return {key:key,x:x,q:q,name:value,sig:imageData(canvas)}}
  async function persist(jobs){if(!jobs.length)return;var q=jobs[0].q,now=new Date().toISOString(),day=now.slice(0,10);settings.quoteStaffSigns=settings.quoteStaffSigns||{};settings.quoteStaffSigns[q.id]=settings.quoteStaffSigns[q.id]||{};jobs.forEach(function(j){settings.quoteStaffSigns[q.id][j.key]={name:j.name,sig:j.sig,at:now};q[j.x.nameKey]=j.name;q[j.x.dateKey]=day;var linked=document.getElementById(j.key==='authorized'?'qAuthorizedBy':'qPreparedBy');if(linked)linked.value=j.name});q.updatedAt=now;saveLocal();await cloudUpsertQuotation(q);if(typeof cloudSaveSettings==='function')await cloudSaveSettings();renderQuotationList();updateHint();toastMsg('บันทึกลายเซ็นเรียบร้อย')}
  window.clearQuoteStaffSign=function(key){var x=roles[key];if(x&&typeof clearSignaturePad==='function')clearSignaturePad(x.pad)};
  window.attachQuoteStaffSign=function(key,input){var x=roles[key],file=input&&input.files&&input.files[0],canvas=x&&document.getElementById(x.pad);if(!file||!canvas)return;var reader=new FileReader();reader.onload=function(){var img=new Image();img.onload=function(){var ctx=canvas.getContext('2d'),scale=Math.min(canvas.width/img.width,canvas.height/img.height),w=img.width*scale,h=img.height*scale;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,(canvas.width-w)/2,(canvas.height-h)/2,w,h)};img.src=reader.result};reader.readAsDataURL(file);input.value=''};
  window.saveQuoteStaffSign=async function(key){var job=roleJob(key,true);if(job)await persist([job])};
  window.saveQuoteStaffSigns=async function(){var jobs=[];for(var key of Object.keys(roles)){var job=roleJob(key,false);if(job===null)return;if(job)jobs.push(job)}if(!jobs.length){toastMsg('กรุณาลงลายเซ็นอย่างน้อย 1 รายการ');return}await persist(jobs)};
  window.previewSignedQuotation=function(){if(!quote()){toastMsg('กรุณาบันทึกใบเสนอราคาก่อนพิมพ์');return}previewQuotation()};
  var baseGo=window.goPage;if(typeof baseGo==='function')window.goPage=function(name){var r=baseGo.apply(this,arguments);if(name==='quotation')setTimeout(loadPads,80);return r};
  var baseLoad=window.loadQuotation;if(typeof baseLoad==='function')window.loadQuotation=function(){var r=baseLoad.apply(this,arguments);setTimeout(loadPads,180);return r};
  var baseReset=window.resetQuote;if(typeof baseReset==='function')window.resetQuote=function(){var r=baseReset.apply(this,arguments);setTimeout(loadPads,20);return r};
  var baseSave=window.saveQuotation;if(typeof baseSave==='function')window.saveQuotation=async function(){var r=await baseSave.apply(this,arguments);updateHint();return r};
})();
