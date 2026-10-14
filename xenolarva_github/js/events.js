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
  if(im&&o.img)im.src=o.img;
  if(nm_)nm_.textContent=o.name||'';
  if(nm_)nm_.hidden=!o.name;
  if(fig)fig.hidden=!o.img;
  if(nt){nt.textContent=o.note||'';nt.hidden=!o.note}
  // 場景：背景（360×180，2:1）上疊角色（靠右、腳貼下緣）與道具（置中），名牌在角色下方。有場景時不用右邊的頭像框
  const sc=$('pScene');sc.hidden=!o.scene;
  if(o.scene){
    const set=(c,k)=>{const e=sc.querySelector(c);e.hidden=!k;if(k)e.src=assetImg(k)};
    set('.sbg',o.scene.bg);set('.schr',o.scene.chr);set('.sitem',o.scene.item);
    const n=sc.querySelector('.sname');n.textContent=o.scene.name||'';n.hidden=!(o.scene.name&&o.scene.chr);
    if(fig)fig.hidden=true;if(nm_)nm_.hidden=true;
  }
}
// 圖片檔名（assets/ 底下，不含副檔名）→ 網址；單檔預覽版用打包好的 ASSETS
const assetImg=k=>(typeof ASSETS!=='undefined'&&ASSETS[k])||('assets/'+k+'.png');
