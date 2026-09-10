/* Beta — dropdowns you can type into, and a machine form that can take a new customer.

   Two requests, one mechanism:

     1. Settings -> ผู้ใช้งานและสิทธิ์ -> เลือกผู้ใช้งาน. Fifteen accounts in a plain
        <select>; finding one meant scrolling a native list.
     2. เพิ่มเครื่องจักร -> ลูกค้า *. A <select> built from the existing customers, so
        "กรณีที่ขายเครื่องให้ลูกค้าหน้าใหม่มันจะเพิ่มไม่ได้" — a machine for a customer who
        is not in the system yet could not be saved at all without leaving the form,
        creating the customer, and starting again.

   window.imodeCombo(select, opts) upgrades any <select> in place:

     - a text box that filters the list as you type, with a real listbox under it
     - keyboard: Down/Up to move, Enter to choose, Escape to cancel back to the current value
     - opts.allowCreate — an explicit "➕ เพิ่ม …" row appears when what you typed matches
       nothing, and choosing it calls opts.onCreate(text)

   THE ORIGINAL <select> IS KEPT, hidden, and stays the single source of truth. Every save
   path in this project reads these controls by id as bare globals — saveMachine() does
   `customerId: maCustomer.value` and saveRoles() collects the cards the picker switches
   between — so replacing the element would have meant editing those functions. Setting
   select.value and dispatching a real `change` event instead means nothing downstream
   knows this file exists. Remove it and both screens fall back to plain dropdowns.

   Two details that are not obvious and will break things if changed:

     * `required` is moved from the <select> to the visible input. A display:none control
       that is `required` and empty makes Chrome refuse the submit with "An invalid form
       control is not focusable" — and it refuses silently, so the Save button would simply
       have stopped working with nothing in the console.
     * The wrapper carries data-no-i18n. applyLanguageTo() walks every text node in the
       modal on a timeout after openModal(), and customer and account names are data, not
       UI labels — the same trap that translated a role name onto its tab in part 13. */
(function(){
 'use strict';

 function tl(th,en){try{return (settings.language==='en')?en:th}catch(e){return th}}
 function esc2(v){return typeof window.esc==='function'?window.esc(v):String(v==null?'':v)}
 function toast(m){if(typeof window.toastMsg==='function')window.toastMsg(m)}
 var seq=0;

 function norm(s){return String(s==null?'':s).toLowerCase().replace(/\s+/g,' ').trim()}

 window.imodeCombo=function(select,opts){
  if(!select||select.dataset.comboOn==='1')return null;
  opts=opts||{};
  select.dataset.comboOn='1';

  var id='cbx'+(++seq);
  var wrap=document.createElement('div');
  wrap.className='cbx';
  wrap.setAttribute('data-no-i18n','true');
  var input=document.createElement('input');
  input.type='text';
  input.className='cbx-input';
  input.id=id+'-input';
  input.autocomplete='off';
  input.setAttribute('role','combobox');
  input.setAttribute('aria-expanded','false');
  input.setAttribute('aria-autocomplete','list');
  input.setAttribute('aria-controls',id+'-list');
  if(opts.placeholder)input.placeholder=opts.placeholder;
  /* see the header — a hidden required <select> blocks submit with no visible error */
  if(select.required){select.required=false;input.required=true}
  var lbl=select.parentNode&&select.parentNode.querySelector('label');
  if(lbl&&!lbl.htmlFor)lbl.htmlFor=input.id;

  var caret=document.createElement('button');
  caret.type='button';
  caret.className='cbx-caret';
  caret.tabIndex=-1;
  caret.setAttribute('aria-label',tl('เปิดรายการ','Open the list'));
  caret.textContent='▾';

  var list=document.createElement('ul');
  list.className='cbx-list';
  list.id=id+'-list';
  list.setAttribute('role','listbox');
  list.hidden=true;

  select.parentNode.insertBefore(wrap,select);
  wrap.appendChild(input);
  wrap.appendChild(caret);
  wrap.appendChild(list);
  wrap.appendChild(select);
  select.classList.add('cbx-native');

  var open=false,active=-1,rows=[];

  function options(){
   return [].slice.call(select.options).filter(function(o){return o.value!==''||o.dataset.keep==='1'});
  }
  function currentLabel(){
   var o=select.options[select.selectedIndex];
   return (o&&o.value!=='')?o.textContent:'';
  }
  function syncInput(){input.value=currentLabel()}

  function build(){
   var q=norm(input.value),all=options();
   /* data-search lets an option be found by text that is not on its face — the account
      picker labels a row "สมชาย ใจดี" but the admin is far more likely to type the
      username they sign in with. */
   var hits=q?all.filter(function(o){
    return norm(o.textContent+' '+(o.dataset.search||'')).indexOf(q)>=0;
   }):all;
   rows=[];
   list.innerHTML='';
   hits.forEach(function(o){
    var li=document.createElement('li');
    li.className='cbx-opt';
    li.setAttribute('role','option');
    li.textContent=o.textContent;
    if(o.value===select.value)li.classList.add('is-current');
    li.addEventListener('mousedown',function(e){e.preventDefault();pick(o.value)});
    list.appendChild(li);
    rows.push({el:li,value:o.value,create:false});
   });
   /* An explicit row, never an implicit create-on-blur: typing a name must not be enough
      to write a customer record, the same rule the quotation page follows. */
   var raw=String(input.value||'').trim();
   var exact=all.some(function(o){return norm(o.textContent)===norm(raw)});
   if(opts.allowCreate&&raw&&!exact){
    var add=document.createElement('li');
    add.className='cbx-opt cbx-add';
    add.setAttribute('role','option');
    add.textContent='➕ '+(opts.createLabel?opts.createLabel(raw):tl('เพิ่ม ','Add ')+raw);
    add.addEventListener('mousedown',function(e){e.preventDefault();create(raw)});
    list.appendChild(add);
    rows.push({el:add,value:null,create:true});
   }
   if(!rows.length){
    var em=document.createElement('li');
    em.className='cbx-empty';
    em.textContent=tl('ไม่พบรายการที่ตรงกัน','Nothing matches');
    list.appendChild(em);
   }
   active=rows.length?0:-1;
   paint();
  }
  function paint(){
   rows.forEach(function(r,i){r.el.classList.toggle('is-active',i===active)});
   if(active>=0&&rows[active]){
    var el=rows[active].el;
    if(el.offsetTop<list.scrollTop)list.scrollTop=el.offsetTop;
    else if(el.offsetTop+el.offsetHeight>list.scrollTop+list.clientHeight)
     list.scrollTop=el.offsetTop+el.offsetHeight-list.clientHeight;
   }
  }
  function show(){
   if(open)return;
   open=true;list.hidden=false;
   input.setAttribute('aria-expanded','true');
   wrap.classList.add('is-open');
   build();
  }
  function close(restore){
   if(!open)return;
   open=false;list.hidden=true;
   input.setAttribute('aria-expanded','false');
   wrap.classList.remove('is-open');
   if(restore!==false)syncInput();
  }
  function pick(value){
   select.value=value;
   /* a real event, so anything already listening — refreshMachines() and friends — runs */
   try{select.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){
    if(typeof select.onchange==='function')select.onchange();
   }
   close();
  }
  function create(text){
   if(typeof opts.onCreate!=='function'){close();return}
   Promise.resolve(opts.onCreate(text)).then(function(res){
    if(!res||!res.value){close();return}
    /* Add the option ourselves rather than re-rendering the form: the rest of the machine
       form is half filled in by this point and rebuilding it would throw that away. */
    if(!select.querySelector('option[value="'+String(res.value).replace(/"/g,'\\"')+'"]')){
     var o=document.createElement('option');
     o.value=res.value;o.textContent=res.label||text;
     select.appendChild(o);
    }
    pick(res.value);
   }).catch(function(){close()});
  }

  input.addEventListener('focus',show);
  input.addEventListener('click',show);
  caret.addEventListener('click',function(){
   if(open){close()}else{input.focus();show()}
  });
  input.addEventListener('input',function(){if(!open)show();else build()});
  input.addEventListener('keydown',function(e){
   if(e.key==='ArrowDown'||e.key==='ArrowUp'){
    e.preventDefault();
    if(!open){show();return}
    if(!rows.length)return;
    active=(active+(e.key==='ArrowDown'?1:-1)+rows.length)%rows.length;
    paint();
   }else if(e.key==='Enter'){
    if(!open)return;
    e.preventDefault();
    var r=rows[active];
    if(!r)return;
    if(r.create)create(String(input.value||'').trim());else pick(r.value);
   }else if(e.key==='Escape'){
    if(open){e.preventDefault();close()}
   }
  });
  input.addEventListener('blur',function(){setTimeout(function(){close()},0)});

  syncInput();
  return {input:input,select:select,refresh:syncInput};
 };

 /* ------------------------------------------------- 1. the account picker ------- */
 /* js/20 builds .permx-userpick when the roles modal opens, which is after this file has
    parsed, so it can call window.imodeCombo directly. Search only — accounts are created
    in the account screen, not here. */

 /* ------------------------------------------------- 2. the machine form --------- */
 function createCustomer(name){
  var nm=String(name||'').trim();
  if(!nm)return null;
  try{
   var dup=customers.filter(function(c){return norm(c.name)===norm(nm)})[0];
   if(dup)return {value:dup.id,label:dup.name};
   /* Same shape and the same uid() as saveCustomer(). A CUST-#### running number was
      considered and rejected: two devices offline would both mint the same number and the
      cloud upsert would merge two different companies into one row. */
   var obj={id:uid(),name:nm,branch:'',contact:'',phone:'',email:'',location:'',address:'',
    mapUrl:'',latitude:'',longitude:'',note:tl('เพิ่มจากฟอร์มเครื่องจักร','Added from the machine form'),
    lineUserId:'',lineDisplayName:'',lineLinkedAt:''};
   customers.push(obj);
   saveLocal();
   if(typeof window.cloudUpsertCustomer==='function')window.cloudUpsertCustomer(obj);
   toast(tl('เพิ่มลูกค้า "'+nm+'" แล้ว — กรอกที่อยู่/ผู้ติดต่อได้ที่หน้าลูกค้า',
            'Customer "'+nm+'" added — fill in the address and contact on the Customers page'));
   return {value:obj.id,label:obj.name};
  }catch(e){return null}
 }
 window.imodeCreateCustomerByName=createCustomer;

 var baseMachineModal=window.openMachineModal;
 if(typeof baseMachineModal==='function'){
  window.openMachineModal=function(){
   var r=baseMachineModal.apply(this,arguments);
   /* openModal() writes the body synchronously, so the select is already there. */
   try{
    var sel=document.getElementById('maCustomer');
    if(sel)window.imodeCombo(sel,{
     placeholder:tl('พิมพ์ชื่อลูกค้า หรือเลือกจากรายการ','Type a customer name, or pick one'),
     allowCreate:true,
     createLabel:function(t){return tl('เพิ่มลูกค้าใหม่: ','Add a new customer: ')+t},
     onCreate:createCustomer
    });
   }catch(e){}
   return r;
  };
 }

 var st=document.createElement('style');
 st.id='v70ComboBoxStyle';
 st.textContent=''
 +'.cbx{position:relative;display:block}'
 +'select.cbx-native{display:none!important}'
 +'.cbx-input{width:100%;padding:10px 34px 10px 12px;border:1px solid #d3e0f4;border-radius:12px;'
 +'font-size:13.5px;background:#fff;color:#12233f;font-family:inherit}'
 +'.cbx-input:focus{outline:none;border-color:#0b63e5;box-shadow:0 0 0 3px rgba(11,99,229,.14)}'
 +'.cbx-caret{position:absolute;top:0;right:0;height:100%;width:32px;border:0;background:none;'
 +'color:#6f81a3;font-size:12px;cursor:pointer;line-height:1}'
 +'.cbx.is-open .cbx-caret{color:#0b63e5}'
 +'.cbx-list{position:absolute;z-index:60;left:0;right:0;top:calc(100% + 4px);margin:0;padding:4px;'
 +'list-style:none;max-height:246px;overflow:auto;background:#fff;border:1px solid #cfe0fa;'
 +'border-radius:12px;box-shadow:0 14px 30px rgba(16,54,128,.17)}'
 +'.cbx-list[hidden]{display:none!important}'
 +'.cbx-opt{padding:9px 11px;border-radius:9px;font-size:13px;color:#12233f;cursor:pointer;line-height:1.4}'
 +'.cbx-opt.is-active{background:#eaf3ff;color:#0b3f9e}'
 +'.cbx-opt.is-current{font-weight:700}'
 +'.cbx-opt.is-current::after{content:" ✓";color:#079455}'
 +'.cbx-add{color:#07603a;font-weight:700}'
 +'.cbx-add.is-active{background:#e9f9f1}'
 +'.cbx-empty{padding:10px 11px;font-size:12px;color:#7385a5}'
 +'@media (max-width:640px){.cbx-list{max-height:210px}}';
 document.head.appendChild(st);
})();
