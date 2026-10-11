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
  const gr=!!META.grete&&!S.over;
  $('bGrete').hidden=!gr;$('bGrete').className='tog'+(S.grete?' on':'');$('bGrete').setAttribute('aria-pressed',String(!!S.grete));
  $('bGrete').textContent='格蕾特小助手：'+(S.grete?'開':'關');
  $('bTrans').hidden=!(gr&&S.grete);$('bTrans').className='tog'+(S.trans?' on':'');$('bTrans').setAttribute('aria-pressed',String(!!S.trans));
  $('bTrans').textContent='翻譯（心聲）：'+(S.trans?'開':'關');
  $('bWater').hidden=$('bFeed').hidden=gr&&!!S.grete;
  const off=!!S.over;
  $('bWater').disabled=off||S.inv.agent<1;
  $('bFeed').disabled=off||!FOODS.some(k=>S.inv[k]>0);
  $('bPlay').disabled=off||S.ap<1||false;
  $('bOut').disabled=off||S.ap<1;
  $('end').disabled=off;
}

// 彈出選單：title 標題、opts 選項 [{id,label,off}]、cb(id) 選了之後做的事
function pick(title,opts,cb,body){
  $('pt').textContent=title;$('pp').textContent=body||'';$('pp').hidden=!body;
  $('pNote').hidden=true;
  if(!body)$('pFig').hidden=true
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
