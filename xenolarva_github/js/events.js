// ===== 事件：彈出框標題固定是「事件」，內文是一小段文字，可選頭像。 =====
// 之後的隨機事件都用這個模板：在 EVENTS 加一筆，就可以用 runEvent('id') 觸發。
//   text：內文（字串，或回傳字串的函式）　img：頭像圖片網址（可省略）
//   apply：事件發生時要做的事（發獎勵、解鎖…）。log：同時寫進訊息區的文字（可省略）
const EVENTS={
  // 第一次去廢棄大樓：遇見言盡，走完最後一頁（進入商店）才算見過（js/shop.js）
  shopIntro:{
    pages:()=>TEXT.shop.intro.map(p=>({...p,opts:p.opts&&p.opts.map(o=>({...o,next:undefined}))})),
    apply(){META.shopMet=true;codexSave()}
  },
  // pages：每頁 {text, img, name, note, btn｜opts[{label,next}], next}。next＝要去第幾頁（-1＝結束、不執行 apply）；沒寫就是下一頁。
  // 事件開始時執行 start；最後一頁出現時才執行 apply（中途按 ✕ 離開＝事件沒完成）。declined＝選了 -1 時寫進訊息區的字。
  greteMeet:{
    pages:()=>TEXT.grete.pages.map(withImg),
    start(){META.greteMet=true;codexSave()},         // 見過面了：之後會觸發「再次遇到」的版本
    apply(){META.grete=true;codexSave()},           // 永久解鎖「格蕾特小助手」
    log:()=>TEXT.grete.meet,
    declined:()=>TEXT.grete.declined
  },
  // 聊顏色：認識格蕾特後出門遇到。走完最後一頁才永久解鎖
  colorTalk:{
    pages:()=>TEXT.chatEv.talk.pages.map(withImg),
    apply(){META.chatColor=true;codexSave()},
    log:()=>TEXT.chatEv.talk.log
  },
  colorTalk2:{
    pages:()=>TEXT.chatEv.dual.pages.map(withImg),
    apply(){META.chatDual=true;codexSave()},
    log:()=>TEXT.chatEv.dual.log
  },
  greteAgain:{
    pages:()=>[withImg({...TEXT.grete.again,opts:TEXT.grete.again.opts.map(o=>({...o,next:o.next==='intro'?1:o.next}))}),withImg(TEXT.grete.pages[TEXT.grete.pages.length-1])],
    apply(){META.grete=true;codexSave()},
    log:()=>TEXT.grete.meet,
    declined:()=>TEXT.grete.declined
  }
};
const withImg=p=>({...p,img:[GRETE_IMG,GRETE_IMG2][p.img]});
// 跳出事件框。opt.preview＝true 時只預覽，不執行 start／apply。cb＝事件走完之後要做的事
function runEvent(id,opt){
  const ev=EVENTS[id];if(!ev)return;
  opt=opt||{};
  const pages=ev.pages();
  if(!opt.preview&&ev.start)ev.start();
  const show=i=>{
    const p=pages[i],last=i===pages.length-1;
    if(last&&!opt.preview){if(ev.apply)ev.apply();if(ev.log)say(ev.log(),'ev');refresh()}
    const go=n=>{
      if(n===-1){if(!opt.preview&&ev.declined)say(ev.declined(),'ev');refresh();return}
      if(n>=pages.length){if(opt.cb)opt.cb();return}
      show(n)
    };
    const opts=p.opts?p.opts.map((o,k)=>({id:k,label:o.label})):[{id:0,label:p.btn||TEXT.misc.ok}];
    showEvent(p.text,{img:p.img,name:p.name,note:p.note,scene:p.bg?{bg:p.bg,chr:p.chr,item:p.item,name:p.name}:null,opts,cb:k=>go(p.opts&&p.opts[k].next!==undefined?p.opts[k].next:(p.next!==undefined?p.next:i+1))});   // 選項沒寫 next＝下一頁
  };
  show(0);
}
// 事件／提示框的共用外觀（標題 + 內文框 + 可選小字、圖片、名牌 + 按鈕）。o：title img name note btn｜opts cb(id)
function showEvent(text,o){
  o=o||{};
  pick(o.title||TEXT.misc.evTitle,o.opts||[{id:0,label:o.btn||TEXT.misc.ok}],id=>{if(o.cb)o.cb(id)},text);
  const im=$('pAv'),nm_=$('pTag'),fig=$('pFig'),nt=$('pNote');
  if(im&&o.img){if(/^[\w-]+(\+(acc|配件))?$/.test(o.img))chrSet(im,o.img);else{delete im.dataset.chr;im.style.background='';im.src=o.img}}   // 圖名（grete_L_0）或網址
  if(nm_)nm_.textContent=o.name||'';
  if(nm_)nm_.hidden=!o.name;
  if(fig)fig.hidden=!o.img;
  if(nt){nt.textContent=o.note||'';nt.hidden=!o.note}
  // 場景：背景（360×180，2:1）上疊角色（靠右、腳貼下緣）與道具（置中），名牌在角色下方。有場景時不用右邊的頭像框
  const sc=$('pScene');sc.hidden=!o.scene;
  if(o.scene){
    const set=(c,k)=>{const e=sc.querySelector(c);e.hidden=!k;if(k)chrSet(e,k)};
    set('.sbg',o.scene.bg);set('.schr',o.scene.chr);set('.sitem',o.scene.item);
    const n=sc.querySelector('.sname');n.textContent=o.scene.name||'';n.hidden=!(o.scene.name&&o.scene.chr);
    if(fig)fig.hidden=true;if(nm_)nm_.hidden=true;
  }
}
// 圖片檔名（assets/ 底下，不含副檔名）→ 網址；單檔預覽版用打包好的 ASSETS
const assetImg=k=>(typeof ASSETS!=='undefined'&&ASSETS[k])||assetPath(k);   // 資料夾見 js/utils.js 的 ASSET_DIRS
// 人物立繪（v0.40.3）：檔名＝人物_方向_表情（xiaojun_L_0；L 面向左＝平常、R 面向右；0 正常 1 喜 2 怒 3 哀 4 樂 5 驚）。
// 後面加「+acc」（或「+配件」）＝疊上那個方向的配件圖 xiaojun_L_acc（例如言曉君工作時的耳麥）。配件圖和立繪同尺寸，
// 做法：<img> 的圖＝配件，背景＝立繪（同一個元素，跳動、點擊都跟著）。
function chrSplit(k){const m=String(k||'').match(/^(.*?)\+(?:acc|配件)$/);return m?{base:m[1],acc:m[1].replace(/_[^_]+$/,'_acc')}:{base:k,acc:''}}
function chrSet(el,k){el.dataset.chr=k;const o=chrOl(k);if(o){el.src=o;el.style.background='';return}
  const c=chrSplit(k);el.src=assetImg(c.acc||c.base);el.style.background=c.acc?`url('${assetImg(c.base)}') center/100% 100% no-repeat`:''}
function chrAttr(k){const o=chrOl(k),c=chrSplit(k);if(o)return `data-chr="${esc(k)}" src="${esc(o)}"`;   // 資安（v0.40.40）：屬性值都 esc
  return `data-chr="${esc(k)}" src="${esc(assetImg(c.acc||c.base))}"`+(c.acc?` style="background:url('${esc(assetImg(c.base))}') center/100% 100% no-repeat"`:'')}
// 白邊（v0.40.4）：新格式立繪（人物_L_／_R_）和玩家紙娃娃一樣由程式描白邊（js/doll.js dollOutline 的作法，粗細 DOLL_OUTLINE）。
// 配件和立繪先合成一張再描（白邊只描在外圍）。畫好轉成圖片網址記在 CHR_OL；畫好之前先顯示原圖，畫好後畫面上那張圖自動換掉。
// 本機直接開 index.html（file://）時瀏覽器不准把畫布轉成圖片，就維持原圖（GitHub Pages、單檔預覽版都正常）。
const CHR_OL={},CHR_OL_Q=[];let CHR_OL_BUSY=false;
const chrNew=k=>/_[LR]_[^_]+$/.test(chrSplit(k).base);
function chrOl(k){if(!k||!chrNew(k))return '';if(CHR_OL[k]===undefined){CHR_OL[k]=false;CHR_OL_Q.push(k);chrOlRun()}return CHR_OL[k]||''}
function chrOlRun(){
  if(CHR_OL_BUSY||!CHR_OL_Q.length)return;CHR_OL_BUSY=true;
  const k=CHR_OL_Q.shift(),c=chrSplit(k),srcs=[c.base,c.acc].filter(Boolean);
  const next=()=>{CHR_OL_BUSY=false;setTimeout(chrOlRun,0)};
  Promise.all(srcs.map(s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=assetImg(s)}))).then(ims=>{
    if(!ims[0]){CHR_OL[k]=null;next();return}
    const W=ims[0].naturalWidth,H=ims[0].naturalHeight,cv=()=>{const e=document.createElement('canvas');e.width=W;e.height=H;return e};
    const s=cv(),sg=s.getContext('2d');ims.forEach(i=>i&&sg.drawImage(i,0,0,W,H));
    const m=cv(),mg=m.getContext('2d');mg.drawImage(s,0,0);mg.globalCompositeOperation='source-in';mg.fillStyle='#fff';mg.fillRect(0,0,W,H);
    const o=cv(),og=o.getContext('2d'),r=Math.round(DOLL_OUTLINE*W/DOLL_W);
    for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r+r)og.drawImage(m,x,y);
    og.drawImage(s,0,0);
    try{CHR_OL[k]=o.toDataURL()}catch(e){CHR_OL[k]=null}
    if(CHR_OL[k])document.querySelectorAll('img[data-chr]').forEach(e=>{if(e.dataset.chr===k)chrSet(e,k)});
    next();
  });
}
// 開遊戲後先在背景把常用的立繪描好
function chrOlPreload(){[...Object.values(HALL_FLOORS).flatMap(f=>f.chr||[]),...Object.values(LOBBY_NPC).flatMap(n=>n.chr||[]),...SHOP_SCENE.chr,GRETE_IMG,GRETE_IMG2,
  ...Object.values(STORY_NPC).flatMap(n=>n.img?[n.img,n.img.replace(/_L_/,'_R_')]:[])].forEach(chrOl)}
setTimeout(()=>{try{chrOlPreload()}catch(e){}},1200);
