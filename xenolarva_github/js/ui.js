// ===== 畫面：訊息、狀態面板、選單彈窗、提示框。只負責顯示，不改遊戲規則 =====

// 訊息區加一行。文字裡的「幼體」會換成你取的名字（用【】框起來）。cls：'ev' 事件、'bad' 警告、'sys' 系統
function say(t,cls=''){
  bounce=1;
  const p=document.createElement('p');
  p.textContent=(S?t.replace(/幼體/g,nm(S.name)):t);
  if(cls)p.className=cls;
  $('log').appendChild(p);$('log').scrollTop=1e9;
}

// ---------- 成就提示框：水缸上方黑底半透明的框，依序顯示 ----------
const toastQ=[];let toastBusy=false;
function toast(text){toastQ.push(text);if(!toastBusy)nextToast()}
function nextToast(){
  const t=toastQ.shift();
  if(!t){toastBusy=false;return}
  toastBusy=true;
  const el=$('toast');el.textContent=t;el.className='show';
  setTimeout(()=>{el.className='';setTimeout(nextToast,400)},3600);
}

// 重畫上方日期、行動點、狀態面板，並依狀態啟用／停用按鈕
function refresh(){
  if(PV)return;                                          // 預覽模式沒有這些面板
  paintName($('cname'),S.colored?S.col:'');
  $('day').textContent=`第 ${Math.min(S.day,7)} 日 / 7`;
  $('pips').innerHTML=[0,1].map(i=>`<span class="${i<S.ap?'on':''}"></span>`).join('');

  // 筆記：個性（加上已發現的標籤，用「／」連起來；滑鼠移上去或點一下會顯示說明）、喜好（發現前顯示 ？）
  const T=TEXT.temper[S.temp];
  const tip=(txt,desc,cls)=>`<span class="tipc ${cls||''}" data-tip="${esc(desc)}" tabindex="0">${esc(txt)}</span>`;
  const traits=[tip(T.name,T.desc),...S.tagsFound.map(id=>tip(TEXT.tags[id].name,TEXT.tags[id].desc,'tagc'))].join(' / ');
  $('notes').innerHTML=`<b>筆記</b><div>個性：${traits}</div><div>喜好：${S.found.gift?esc(NAME[S.pref.gift]):'？'} / ${S.found.toy?esc(NAME[S.pref.toy]):'？'}</div>`;
  // 水質：有檢測儀才會在水缸角落顯示數值（飽食不顯示，太餓時小球會冒出刀叉泡泡）
  const wq=$('wq');wq.hidden=!(S.inv.kit>0);wq.textContent=`水質 ${waterW()}`;

  // 格蕾特小助手：遇見之後才出現。開著時，換水與餵食收起來，改成多一個翻譯開關
  const gr=!!META.grete&&!S.over,L=TEXT.layout;
  // 按鈕內容：圖示＋名字（電腦版多顯示 dk 的字）＋開／關。手機版三行直排，電腦版一行
  const togHTML=(ic,name,on)=>icoHTML(ic)+`<span class="bt">${name}</span><span class="bs">${on?L.on:L.off}</span>`;
  $('bGrete').hidden=!gr;$('bGrete').className='tog'+(S.grete?' on':'');$('bGrete').setAttribute('aria-pressed',String(!!S.grete));
  $('bGrete').innerHTML=togHTML('grete',`<span class="dk">${L.gDesk}</span>${L.grete}`,S.grete);
  // 翻譯：要小助手開著才能用（關著時顯示「關」並停用）
  $('bTrans').hidden=!gr;$('bTrans').disabled=!S.grete;$('bTrans').className='tog'+(S.trans?' on':'');$('bTrans').setAttribute('aria-pressed',String(!!S.trans));
  $('bTrans').innerHTML=togHTML('trans',`${L.trans}<span class="dk">${L.tDesk}</span>`,S.grete&&S.trans);
  $('bWater').hidden=$('bFeed').hidden=gr&&!!S.grete;
  const off=!!S.over;
  $('bWater').disabled=off||S.inv.agent<1;
  $('bFeed').disabled=off||!FOODS.some(k=>S.inv[k]>0);
  $('bPlay').disabled=off||S.ap<1||false;
  $('bChat').disabled=off||S.ap<1;
  $('bOut').disabled=off||S.ap<1;
  $('end').disabled=off;
}

// ---------- 單色圖示（資料在 js/data/icons.js）：用 CSS 遮罩，顏色跟著文字色 ----------
const ICON_URL={};
function icoUrl(id){
  if(ICON_URL[id])return ICON_URL[id];
  const v=ICONS[id];if(!v)return '';
  if(typeof v==='string')return ICON_URL[id]='url("'+v+'")';
  let d='';v.forEach((row,y)=>[...row].forEach((c,x)=>{if(c==='#')d+=`M${x} ${y}h1v1h-1z`}));
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges"><path d="${d}"/></svg>`;
  return ICON_URL[id]='url("data:image/svg+xml,'+encodeURIComponent(svg)+'")';
}
const icoHTML=id=>`<i class="ico" style='--ico:${icoUrl(id)}' aria-hidden="true"></i>`;
function paintIcons(root){(root||document).querySelectorAll('.ico[data-i]').forEach(e=>{e.style.setProperty('--ico',icoUrl(e.dataset.i));e.setAttribute('aria-hidden','true')})}
paintIcons();

// ---------- index.html 裡寫死的介面文字：有 data-t="路徑" 的元素，換成 TEXT 裡的文字（文字都在 texts.js，方便從設定總表改）----------
const textAt=p=>p.split('.').reduce((o,k)=>o&&o[k],TEXT);
document.querySelectorAll('[data-t]').forEach(e=>{const v=textAt(e.dataset.t);if(typeof v==='string')e.textContent=v});

// 彈出選單：title 標題、opts 選項 [{id,label,off}]、cb(id) 選了之後做的事
function pick(title,opts,cb,body){
  $('pt').textContent=title;$('pp').textContent=body||'';$('pp').hidden=!body;
  $('pNote').hidden=true;$('pScene').hidden=true;
  $('pFig').hidden=true;$('pTag').hidden=true;   // 頭像與名牌只有事件會用（showEvent 再打開）
  $('po').innerHTML='';
  opts.forEach(o=>{
    if(o.rule){$('po').appendChild(document.createElement('hr'));if(o.label){const d=document.createElement('div');d.className='phead';d.textContent=o.label;$('po').appendChild(d)}return}
    if(o.node){$('po').appendChild(o.node);return}
    if(o.head){const d=document.createElement('div');d.className='phead';d.textContent=o.head;$('po').appendChild(d);return}
    const b=document.createElement('button');
    b.textContent=o.label;b.disabled=!!o.off;
    b.onclick=()=>{$('ovPick').classList.remove('show');cb(o.id)};
    $('po').appendChild(b);
  });
  $('ovPick').classList.add('show');
}
$('pc').onclick=()=>$('ovPick').classList.remove('show');
$('bagClose').onclick=()=>$('ovBag').classList.remove('show');

// ---------- 提示框：任何有 data-tip 的元素，滑鼠移上去、點一下或鍵盤聚焦都會顯示說明 ----------
const tipBox=document.createElement('div');tipBox.id='tip';tipBox.setAttribute('role','tooltip');
document.body.appendChild(tipBox);
function showTip(el){
  tipBox.textContent=el.getAttribute('data-tip');tipBox.style.display='block';
  const r=el.getBoundingClientRect(),w=tipBox.offsetWidth,h=tipBox.offsetHeight;
  let x=r.left+r.width/2-w/2,y=r.bottom+6;
  x=Math.max(8,Math.min(innerWidth-w-8,x));
  if(y+h>innerHeight-8)y=Math.max(8,r.top-h-6);
  tipBox.style.left=x+'px';tipBox.style.top=y+'px';
}
const hideTip=()=>{tipBox.style.display='none'};
const tipOf=e=>e.target&&e.target.closest?e.target.closest('[data-tip]'):null;
document.addEventListener('mouseover',e=>{const el=tipOf(e);el?showTip(el):hideTip()});
document.addEventListener('click',e=>{const el=tipOf(e);el?showTip(el):hideTip()});
document.addEventListener('focusin',e=>{const el=tipOf(e);if(el)showTip(el)});
document.addEventListener('focusout',hideTip);
