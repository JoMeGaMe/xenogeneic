// ===== 衣櫃（v0.40.43）：主線「收納 → 衣櫃」和日常「玩家設定 → 長相」共用 =====
// 畫出來是一段 HTML（wardHTML），點擊交給 wardClick、自己選顏色／透明度交給 wardChange，縮圖畫在 wardPaint。
// 衣服資料在 js/data/doll.js（DOLL_LISTS、DOLL_WEAR_TINT 可以換色、DOLL_SHEER 褲襪），字在 TEXT.doll（wear 名字、ward 介面）。
// 穿上就存（META.doll，全存檔共用）。
const WARD_TABS=['set','top','pants','socks','shoes','acc'];   // 套裝｜上衣｜下身（褲、裙）｜襪子｜鞋子｜配飾
const WARD_SLOT={top:'top',pants:'pants',socks:'socks',shoes:'shoes',acc:'glass'};   // 分頁 → 身上的格子（套裝還沒有衣服；配飾＝眼鏡＋手拿的兩格，換色的是眼鏡）
// 這件有沒有：要買的衣物在主線看這個存檔（STY.wearOwn），日常看 META.wearOwn（主線存過檔的都算；v0.40.69）
const wearHas=id=>!DOLL_SHOP_WEAR.includes(id)||(document.body.classList.contains('story')&&typeof STY!=='undefined'&&STY?STY.wearOwn||[]:META.wearOwn||[]).includes(id);
const wardDoll=()=>META.doll||dollDef();
// 一格衣服：縮圖（照現在的顏色）＋名字；點了直接穿上（none＝不穿，只有襪子、鞋子有）
function wardCell(slot,id){const d=wardDoll(),on=slot==='acc'?d.glass==='none'&&d.hold==='none':(d[slot]||'none')===id,col=DOLL_WEAR_TINT.includes(id)?(d.wc||{})[slot]:'';
  return `<button class="sbcell swc${on?' on':''}" data-wear="${slot}:${id}"><canvas class="swthumb" data-wid="${id}" data-tc="${esc(col||'')}" width="120" height="120"></canvas><span>${esc(id==='none'?(TEXT.doll.noneSlot||{})[slot]||TEXT.doll.none:TEXT.doll.wear[id]||id)}</span></button>`}
// 換色（穿著可以換色的才出現）：色票＋自己選；褲襪多一條透明度（電腦左右各半、手機上下）
function wardCol(slot){const d=wardDoll(),id=d[slot];if(!id||id==='none'||!DOLL_WEAR_TINT.includes(id))return '';
  const W=TEXT.doll.ward,cur=(d.wc||{})[slot]||DOLL_WEAR_DEF.wc[slot],sheer=DOLL_SHEER.includes(id),a=Math.round((d.wa??DOLL_WEAR_DEF.wa)*100);
  return `<div class="swcol${sheer?' two':''}"><div class="swc1"><span class="swlab">${esc(fmt(W.col,{n:TEXT.doll.wear[id]||id}))}</span><div class="swsw">${DOLL_CLOTH.map(c=>`<button class="${c===cur?'on':''}" style="background:${c}" data-wcol="${slot}:${c}" aria-label="${c}"></button>`).join('')}<label class="swown" style="background:${esc(cur)}"><input type="color" value="${esc(cur)}" data-wcolin="${slot}" aria-label="${esc(W.own)}"></label></div></div>`
    +(sheer?`<label class="swa"><span>${esc(W.sheer)}</span><input type="range" min="10" max="100" step="10" value="${a}" data-wa="1"><b>${a}%</b></label>`:'')+'</div>';}
// 分類按鈕｜（線）｜格子｜（線）｜換色
function wardHTML(wt){const W=TEXT.doll.ward;wt=WARD_TABS.includes(wt)?wt:'top';const sl=WARD_SLOT[wt];
  const lock=n=>Array(n).fill(`<button class="sbcell lock" disabled><span class="ssw"></span>${esc(W.shop)}</button>`).join('');
  const cells=s=>(DOLL_PARTS[s].none?wardCell(s,'none'):'')+DOLL_LISTS[s].filter(wearHas).map(id=>wardCell(s,id)).join(''),has=s=>DOLL_LISTS[s].filter(wearHas).map(id=>wardCell(s,id)).join('');
  const grid=!sl?lock(6):wt==='acc'?wardCell('acc','none')+has('glass')+has('hold')+lock(2):cells(sl)+lock(2);   // 配飾：「不戴配飾」（眼鏡、手拿的都拿掉，v0.40.67）＋有的眼鏡、應援組合
  return `<div class="swtabs">${WARD_TABS.map(t=>`<button class="${t===wt?'on':''}" data-wtab="${t}">${esc(W.tabs[t])}</button>`).join('')}</div><div class="sbgrid" data-hl="grid">${grid}</div>${sl?wardCol(sl):''}`;}
function wardSet(f){const d=META.doll=META.doll||dollDef();f(d);META.doll=dollNorm(d);codexSave();if(typeof STORY_DOLL!=='undefined')STORY_DOLL={}}
const WARD_SEL='[data-wtab],[data-wear],[data-wcol]';
// 衣物說明（v0.40.67，主線的收納 → 衣櫃）：最後點的那件的名字＋說明（TEXT.doll.wearDesc）
let WARD_LAST=null;
const wardDesc=()=>{const id=WARD_LAST;return `<div class="swdesc">${id?`<b>${esc(TEXT.doll.wear[id]||id)}</b><span>${esc((TEXT.doll.wearDesc||{})[id]||'')}</span>${id.startsWith('fan_')?`<small>${esc(TEXT.doll.fanNote)}</small>`:''}`:''}</div>`};
// 點擊：t＝點到的那個（closest(WARD_SEL)）；tab＝換分頁要做的事。回傳 true＝處理了（呼叫的人重畫）
function wardClick(t,tab){const d=t&&t.dataset;if(!d)return false;
  if(d.wtab){tab(d.wtab);return true}
  if(d.wear){const [k,id]=d.wear.split(':');WARD_LAST=id==='none'?null:id;wardSet(o=>{if(k==='acc'){o.glass='none';o.hold='none'}else o[k]=id});return true}
  if(d.wcol){const [k,c]=d.wcol.split(':');wardSet(o=>{o.wc={...(o.wc||{}),[k]:c}});return true}
  return false;}
// 自己選顏色、透明度（change＝放開才套用：重畫會換掉輸入框）
function wardChange(t){const d=t.dataset;
  if(d.wcolin){wardSet(o=>{o.wc={...(o.wc||{}),[d.wcolin]:t.value}});return true}
  if(d.wa){wardSet(o=>{o.wa=+t.value/100});return true}
  return false;}
// 縮圖（圖要先讀好：dollLoad）
function wardPaint(root){root.querySelectorAll('canvas.swthumb').forEach(c=>{const g=c.getContext('2d'),id=c.dataset.wid;g.clearRect(0,0,c.width,c.height);
  g.drawImage(id==='none'?dollThumb(null):DOLL_SHEER.includes(id)?dollThumbSheer(id,c.dataset.tc):dollThumb(id,c.dataset.tc||null),0,0,c.width,c.height)})}
