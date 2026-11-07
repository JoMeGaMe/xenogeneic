// ===== 主線 free.js：自由行動：滿版地圖、異生會大樓、店、白天的家（週中途回家：改行程、存檔） =====
// 主線的程式拆成 js/story/*.js（v0.40.34），照 index.html 的順序載入，全部是全域變數。

// ---------- 自由行動（v0.40.14；v0.40.44 改成點了直接做）----------
// 地圖的名牌、大樓的樓層、家裡的按鈕、店裡的商品：點一下就做（打工都要排行程；例外：廢墟、活動中心、5F）。
// 「？」＝說明模式（開著＝第一次點只出說明卡，再點一次才做；SUI.fhelp，這次玩的時候一直記著；白天的家不用）。第一次自由行動時播「第一次做：自由行動」的劇情說明玩法。
// 介面不寫多餘的說明（開發通則）：鎖著就是變灰、不能點，不另外寫原因。
// 每一個可以點的東西有一個 key：p:地點｜f:樓層｜h:家裡的按鈕｜c:照顧的方式｜g:店裡的商品
const stFreeNew=()=>({scr:'map',sel:null,stat:false,stab:'me',off:{},shop:null,cart:[]});
const stHub=()=>!!(STRUN&&STRUN.free&&STRUN.free.scr==='home');   // 白天回到家（旁邊的按鈕都能用）
const stPlanLo=()=>stHub()?STRUN.i:-1;   // 行程本：這一天（含）以前不能改
// 店：今天擺出來的商品（買過的＝售完）、還有沒有賣完的
const stShopGoods=s=>STORY_SHOP[s].goods.slice(0,STORY_SHOP[s].show);
// 售完：買過的（書、服飾店的衣物）；消耗品（STORY_USE）一直有貨（v0.40.62）
const stIsWear=k=>DOLL_SHOP_WEAR.includes(k);   // 服飾店賣的是紙娃娃的衣物（v0.40.65）
const stShopSold=(k,F)=>!STORY_USE[k]&&((stIsWear(k)?wearHas(k):stHas(k))||!!(F&&F.cart.some(b=>b[0]===k)));
const stGoodDesc=k=>stIsWear(k)?TEXT.doll.wearDesc[k]||'':stT().items[k].d;
const stShopOpen=s=>stShopGoods(s).some(([k])=>!stShopSold(k));
const stCartSum=F=>F.cart.reduce((a,b)=>a+b[1],0);
const stGoodName=g=>{const n=stIsWear(g[0])?TEXT.doll.wear[g[0]]:stT().items[g[0]].n;return g[2]>1?fmt(stT().free.shop.pack,{n,q:g[2]}):n};   // 一次買 3 個＝「舒緩液×3」
// 一個 key 的內容：{n 名字, d 說明, img 小圖, cmd 會做的事, lock 鎖著（地點：店賣完／錢不夠｜樓層：沒開放、去過一次｜商品：售完 sold、錢不夠 poor）}
function stFreeInfo(key){const T=stT(),FT=T.free,F=STRUN.free,[t,k]=key.split(':');
  if(t==='p'){const p=STORY_MAP[k],pl=T.place[k],c=p.do&&STORY_CMDS[p.do];return {n:pl.n,d:pl.d,img:p.img,cmd:p.do,lock:!!(p.shop&&!stShopOpen(p.shop))||!!(c&&c.eff.money<0&&STRUN.end.money<-c.eff.money)}}
  if(t==='f'){const p=STORY_SCENES.hall.pins[k],pl=T.place[k],lock=!p.do||!stOpen(p)||!!(p.once&&stDid(p.do));
    return {n:FT.floor[k]+'　'+pl.n,d:pl.d,img:p.img,cmd:lock?'':p.do,lock}}
  if(t==='g'){const g=stShopGoods(F.shop)[+k],sold=stShopSold(g[0],F),poor=!sold&&g[1]>STRUN.end.money-stCartSum(F);   // 商品用貨架上的第幾格當 key（同一種道具可以有 1 個、3 個兩格）
    return {n:stGoodName(g),d:stGoodDesc(g[0]),lock:sold||poor,sold,poor}}
  return {n:'',d:''};}
const stFreeLocked=key=>!!stFreeInfo(key).lock;
// 會遇到的人（頭像）
const stEncHTML=id=>{const T=stT(),e=id?[...new Set((STORY_CMDS[id].enc||[]).map(x=>x[0]))]:[];return e.length?`<span class="sfwho">${e.map(n=>`<span class="scavi" title="${esc(T.npc[n].n)}">${stNpcAva(n)||'？'}</span>`).join('')}</span>`:''};
// 「？」說明卡：只有說明，沒有按鈕（再點一次那個東西才做）
function stFreeCard(D){
  const F=STRUN.free,T=stT(),FT=T.free,st=STRUN.end,side=F.scr==='map'?'':' lft';
  if(F.stat){   // 狀態：和說明卡同一個框
    const row=(k,bar,v)=>`<div class="skv"><span class="sk">${esc(T.S[k])}</span>${bar}<span class="sv">${v}</span></div>`;
    const body=F.stab==='me'?row('str',stMeter(st.str,0,50,''),st.str)+row('soc',stMeter(st.soc,0,50,''),st.soc)+row('know',stMeter(st.know,0,50,''),st.know)+row('fat',stMeter(st.fat,0,100,'w'),st.fat)+row('money',`<span class="sdim">${esc(T.stat.moneyNote)}</span>`,st.money.toLocaleString('en-US')+' '+esc(T.moneyUnit))
      :row('hp',stMeter(st.hp,0,100,'g',STORY_RULE.goalHp),st.hp)+row('calm',stMeter(st.calm,-50,100,'',STORY_RULE.goalCalm),st.calm)+row('mood',stMeter(st.mood,0,100,''),st.mood)+row('tired',stMeter(st.tired,0,100,'r'),st.tired);
    return `<div class="sfcard sfstat"><div class="sfhd"><b>${esc(T.stat.title)}</b></div>
      <div class="stabs">${['me','larva'].map(t=>`<button class="${t===F.stab?'on':''}" data-fact="stab" data-v="${t}">${esc(T.stat.tabs[t])}</button>`).join('')}</div><div class="sfbody sbody">${body}</div></div>`;
  }
  if(!F.sel)return '';
  const I=stFreeInfo(F.sel),c=I.cmd&&STORY_CMDS[I.cmd];
  const img=I.img?`<div class="sfthumb"><img alt="" src="${stBg(I.img)}"><span class="sfnm">${esc(I.n)}</span>${stEncHTML(I.cmd)}</div>`
    :`<div class="sfhd"><b>${esc(I.n)}</b>${stEncHTML(I.cmd)}</div>`;
  const eff=c?`<p class="sfeff"><span class="sef">${stEffHTML(I.cmd)}</span>${c.eff.money?`<span class="spay">${esc(fmt(T.money,{n:c.eff.money}))}</span>`:''}</p>`:'';
  return `<div class="sfcard sfinfo${side}">${img}<div class="sfbody">${I.d?`<p class="sfdesc">${esc(I.d)}</p>`:''}${eff}</div></div>`;
}
// 異生會大樓：樓層的圖就是按鈕（左下只有樓層），鎖著的變灰
function stFreeHall(){const F=STRUN.free,FT=stT().free,sc=STORY_SCENES.hall;
  return `<div class="sfhall"><div class="sfhlist">${sc.list.map(k=>{const key='f:'+k,lock=stFreeLocked(key);
    return `<button class="sfflr${lock?' lock':''}${F.sel===key?' on':''}" data-fk="${key}"${lock&&!SUI.fhelp?' disabled':''}><img alt="" src="${stBg(sc.pins[k].img)}"><span class="sfflab">${esc(FT.floor[k])}</span></button>`}).join('')}</div></div>`;}
// 店：沒有臉的店員＋今天的商品＋離開（進店就算今天的行程）
// 店員（v0.40.64；v0.40.67 只有道具店有）：賽倫絲、阿言（認識後）照日子輪流。服飾店沒有店員
const stClerk=s=>{const c=STORY_SHOP[s].clerk||[],ok=c.filter(k=>k==='silence'||stKnow(k));return ok.length?ok[(STY.week*7+STRUN.i)%ok.length]:null};
// 店裡的話（F.say，閃一下就收）：道具店＝店員（進店、買了、點店員隨機一句）｜服飾店＝第一次進來時玩家自言自語
function stShopSay(F,t,ms,who){F.say={t,who,until:Date.now()+ms};setTimeout(()=>{if(STRUN&&STRUN.free===F&&F.say&&F.say.t===t){F.say=null;stRender()}},ms+50)}
function stShopEnter(F,shop){F.scr='shop';F.shop=shop;F.cart=[];F.sel=null;F.try=null;F.bcat='all';const ck=stClerk(shop),S=stT().free.shop;
  if(ck)stShopSay(F,S.clerks[ck].hello,1800,ck);
  else if(shop==='boutique'&&!STY.visit.includes('boutique')){STY.visit.push('boutique');stShopSay(F,S.bopen,3500)}}
const ST_CLERK_HOP={silence:16,ayen:14};   // 點店員跳一下的高度（px，v0.40.69）
const stClerkFig=ck=>{const F=STRUN.free,hop=F.hop&&Date.now()-F.hop<450;return `<div class="sfclerk${hop?' hop':''}" data-fact="clerk" style="--hop:-${ST_CLERK_HOP[ck]||12}px"><img alt="" ${chrAttr(STORY_NPC[ck].img)}></div>`};
// 道具店的清單（售完的排到最下面；只寫名字和價錢）
const stShopOrd=(F,gs,ix)=>ix.sort((a,b)=>stShopSold(gs[a][0],F)-stShopSold(gs[b][0],F)||a-b);
function stShopList(F,gs){const T=stT(),S=T.free.shop;
  return stShopOrd(F,gs,gs.map((g,i)=>i)).map(i=>{const g=gs[i],p=g[1],key='g:'+i,I=stFreeInfo(key);
    return `<button class="sfgood${I.lock?' lock':''}${I.poor?' poor':''}${F.sel===key?' on':''}" data-fk="${key}"${I.lock&&!SUI.fhelp?' disabled':''}><span class="scrow"><strong>${esc(stGoodName(g))}</strong><span class="spay">${esc(I.sold?S.sold:p?fmt(T.money,{n:p}):S.free)}</span></span></button>`}).join('')}
// 服飾店：分類（全部｜套裝｜上衣｜褲裙｜飾品）＋小圖格子（和衣櫃一樣的縮圖）
const ST_BCATS={all:null,set:['set'],top:['top'],pants:['pants'],acc:['glass','hold']};
function stWearGrid(F,gs){const T=stT(),S=T.free.shop,cs=ST_BCATS[F.bcat||'all'];
  const ix=stShopOrd(F,gs,gs.map((g,i)=>i).filter(i=>!cs||cs.includes(stWearSlot(gs[i][0]))));
  if(!ix.length)return `<p class="sdim sfwempty">${esc(S.empty)}</p>`;
  return ix.map(i=>{const [k,p]=gs[i],key='g:'+i,I=stFreeInfo(key),own=I.sold&&!F.cart.some(b=>b[0]===k),sl=stWearSlot(k),col=DOLL_WEAR_TINT.includes(k)?(wardDoll().wc||{})[sl]||DOLL_WEAR_DEF.wc[sl]:'';
    return `<button class="sbcell swc sfwc${F.sel===key?' on':''}${I.poor?' poor':''}${own?' own':''}" data-fk="${key}"${I.lock&&!own&&!SUI.fhelp?' disabled':''}><canvas class="swthumb" data-wid="${k}" data-tc="${esc(col)}" width="120" height="120"></canvas><span>${esc(stGoodName(gs[i]))}</span><b class="spay">${esc(I.sold?S.own:p?fmt(T.money,{n:p}):S.free)}</b></button>`}).join('')}
// 服飾店：點衣物＝玩家先穿上看看（F.try，離開沒買就回到原本的）
const stWearSlot=id=>Object.keys(DOLL_LISTS).find(k=>DOLL_SLOTS.includes(k)&&DOLL_LISTS[k].includes(id));
function stTryOn(F,key){if(F.shop!=='boutique'||!key.startsWith('g:'))return;const id=stShopGoods(F.shop)[+key.split(':')[1]][0],s=stWearSlot(id);if(s)F.try={...(F.try||{}),[s]:id}}
const stTryDoll=()=>{const F=STRUN&&STRUN.free,d=JSON.parse(JSON.stringify(META.doll||dollDef()));if(F&&F.try)Object.assign(d,F.try);return d};
function stFreeShop(D){const F=STRUN.free,T=stT(),S=T.free.shop,sh=STORY_SHOP[F.shop],gs=stShopGoods(F.shop),bq=F.shop==='boutique';
  if(F.say&&F.say.until<Date.now())F.say=null;
  const head=`<div class="sfshhd"><b>${esc(T.place[F.shop].n)}</b><span class="smn">${esc(fmt(S.left,{n:(STRUN.end.money-stCartSum(F)).toLocaleString('en-US')}))}</span></div>`;
  const leave=`<button class="sfleave" data-fact="leave">${esc(S.leave)}</button>`,bg=`<img class="sbg sfhbg" alt="" draggable="false" src="${stBg(sh.bg,true)}">`;
  if(!bq){const ck=stClerk(F.shop),CS=ck&&S.clerks[ck],say=F.say&&ck?`<div class="sfsay ck"><b>${esc(CS.n)}</b>${esc(F.say.t)}</div>`:'';
    return `${bg}${ck?stClerkFig(ck):''}${say}<div class="sfshop">${head}<div class="sfglist">${stShopList(F,gs)}</div>${leave}</div>`}
  // 服飾店：玩家站左邊（試穿）；右邊＝說明（名字＋版權小字同一行靠右）、分類、小圖格子
  const g=F.sel&&gs[+F.sel.split(':')[1]],dk=g&&g[0];
  const desc=`<div class="sfwd">${dk?`<div class="sfwdh"><b>${esc(stGoodName(g))}</b>${dk.startsWith('fan_')?`<small>${esc(TEXT.doll.fanNote)}</small>`:''}</div><span>${esc(stGoodDesc(dk))}</span>`:''}</div>`;
  const tabs=`<div class="swtabs sfbtabs">${Object.keys(ST_BCATS).map(c=>`<button class="${c===(F.bcat||'all')?'on':''}" data-fact="bcat" data-v="${c}">${esc(S.bcats[c])}</button>`).join('')}</div>`;
  const say=F.say?`<div class="sfsay me"><b data-pname="1">${esc(META.pname||TEXT.misc.defPlayer)}</b>${esc(F.say.t)}</div>`:'';
  return `${bg}<div class="sfme">${stDoll('','','sftry').replace('<canvas ','<canvas data-try="1" ')}</div>${say}<div class="sfshop bq">${head}${desc}${tabs}<div class="sbgrid sfwgrid">${stWearGrid(F,gs)}</div>${leave}</div>`;}
// 白天的家：睡覺、照顧小球（三種直接列出來）、出門（另一個顏色、隔開）；點了就做（不用「？」）。旁邊的按鈕（狀態、行程、收納、水缸、系統、離開）都能用
function stFreeHome(D){const FT=stT().free,sc=STORY_SCENES.home;
  const fx=!D?(SUI.bgx??STORY_FOCUS[sc.bg]??50):50;
  let h=`<img class="sbg" alt="" draggable="false" src="${stBg(sc.bg,true)}" style="object-position:${fx}% 50%">`+stDoll('','','shome');
  if(SUI.scr==='plan')h+='<div class="sdimmer"></div>'+stPlan(D);
  else if(SUI.scr==='stat')h+='<div class="sdimmer"></div>'+stStat(D);
  else if(SUI.scr==='bag')h+='<div class="sdimmer"></div>'+stBag(D);
  else if(SUI.scr==='tank')h+='<div class="sdimmer"></div>'+stTank(D);
  h+=stChrome(D);
  if(SUI.scr!=='home')return h;
  const b=id=>`<button class="sfhb" data-fk="c:${id}"><strong>${esc(stCmdName(id))}</strong><span class="sef">${stEffHTML(id)}</span></button>`;
  return h+`<div class="sfhub">${['sleep',...sc.care].map(b).join('')}<button class="sfhb sfhout" data-fk="h:out"><strong>${esc(FT.hub.out)}</strong></button></div>`;
}
function stFree(D,W,H){
  const F=STRUN.free,T=stT(),FT=T.free;
  if(F.scr==='home')return stFreeHome(D);
  let h;
  if(F.scr==='shop')h=stFreeShop(D);
  else if(F.scr==='hall')h=`<img class="sbg sfhbg" alt="" draggable="false" src="${stBg(STORY_SCENES.hall.bg,true)}">`+stFreeHall()+`<div class="sftop"><span class="sftitle">${esc(FT.scene.hall)}</span><button class="sfout" data-fact="map">${esc(FT.out.hall)}</button></div>`;
  else{   // 地圖：可以拖
    const lw=Math.max(W,Math.round(H*1.5)),lh=Math.round(lw/1.5);
    if(!F.off.map)F.off.map={x:Math.round((W-lw)*(D?.5:.3)),y:Math.round((H-lh)/2)};
    const o=F.off.map;
    h=`<div class="sfmap" style="width:${lw}px;height:${lh}px;transform:translate(${o.x}px,${o.y}px)"><img class="sfbg" alt="" draggable="false" src="${stBg('map',true)}">`;
    for(const id in STORY_MAP){const p=STORY_MAP[id],key='p:'+id,lock=stFreeLocked(key);
      h+=`<button class="sfpin${F.sel===key?' on':''}${lock?' soon':''}" data-fk="${key}"${lock&&!SUI.fhelp?' disabled':''} style="left:${p.x}%;top:${p.y}%"><span>${esc(T.place[id].n)}</span></button>`}
    h+='</div>';}
  if(F.sel&&(F.scr!=='shop'||SUI.fhelp)||F.stat)h+=stFreeCard(D);   // 店裡點商品＝選取（點兩下才買），不跳說明卡（說明模式才跳）
  return h+stFreeBar();
}
function stFreeBar(){const F=STRUN.free,T=stT(),FT=T.free,days=ST_DAYS();
  const ch=stBarCh(),mn=fmt(T.money,{n:`<b>${(STRUN.end.money-stCartSum(F)).toLocaleString('en-US')}</b>`});
  return `<div class="sbar sfbar"><span class="sch">${esc(ch)}</span><span>${stBarWk()}${STY.freeMode?'':'　'}${esc(fmt(T.dayName,{d:days[STRUN.i]}))}</span><span class="sffree">${esc(FT.tag)}</span><span class="smn">${mn}</span><span class="sfbtns"><button class="sfcirc${F.stat?' on':''}" data-fact="stat" title="${esc(FT.stat)}" aria-label="${esc(FT.stat)}">${esc(T.ico.stat)}</button><button class="sfcirc${SUI.fhelp?' on':''}" data-fact="help" aria-label="?">？</button></span></div>`;
}
// ---------- 點了以後 ----------
// 回到家：行程本改成「這週的行程」（今天以前不能改），自動存檔（下次從這裡接著玩）
function stHubEnter(noSave){const R=STRUN,F=R.free;F.scr='home';F.sel=null;F.stat=false;SUI.scr='home';SUI.encPop=null;
  SUI.sched=R.ids.map(x=>x==='free'?'':x);const nx=SUI.sched.findIndex((x,j)=>!x&&j>R.i);SUI.sel=nx>=0?nx:Math.min(6,R.i+1);
  if(!noSave)storyAutoSave();}
const stHubSync=()=>{const R=STRUN;for(let j=R.i+1;j<7;j++)R.ids[j]=SUI.sched[j]||'free'};   // 行程本改了 → 這週接下來的日子
function stFreeRun(key){const F=STRUN.free,[t,k]=key.split(':');
  if(t==='p'){const p=STORY_MAP[k];
    if(p.go==='home'){stHubEnter();return}
    if(p.go){F.scr=p.go;return}
    if(p.shop){stShopEnter(F,p.shop);return}
    stFreeGo(p.do);return}
  if(t==='f'){stFreeGo(STORY_SCENES.hall.pins[k].do);return}
  if(t==='h'){F.scr='map';SUI.scr='home';return}
  if(t==='c'){stFreeGo(k);return}
  if(t==='g'){const g=stShopGoods(F.shop)[+k],ck=stClerk(F.shop);F.cart.push([g[0],g[1],g[2]||1]);if(ck)stShopSay(F,stT().free.shop.clerks[ck].thanks,1800,ck)}}   // 購物車：[道具, 價錢, 幾個]
let ST_FDRAG=false;
function stFreeClick(e){
  const F=STRUN.free;if(ST_FDRAG){ST_FDRAG=false;return}
  const t=e.target.closest('[data-fk],[data-fact]');
  if(F.scr==='shop'&&F.shop==='boutique'&&F.say){F.say=null;if(!t){stRender();return}}   // 服飾店的自言自語：點哪裡都收掉（v0.40.69）
  if(!t){if(!e.target.closest('.sfbar,.sftop,.sfhall,.sfshop,.sfhub')&&(F.sel||F.stat)){F.sel=null;F.stat=false;stRender()}return}   // 點空白（含說明卡本身）＝關掉
  const d=t.dataset;
  if(d.fk){const key=d.fk;
    if((SUI.fhelp&&F.scr!=='home'||key.startsWith('g:'))&&F.sel!==key){F.sel=key;F.stat=false;stTryOn(F,key);stRender();return}   // 說明模式：第一次點＝看說明（家裡不用）｜商品一律點兩下才買（v0.40.64）
    if(stFreeLocked(key))return;
    F.sel=F.shop==='boutique'&&key.startsWith('g:')?key:null;stFreeRun(key);if(STRUN&&STRUN.free)stRender();return}   // 服飾店買了之後還是選著（看說明、穿著）   // 決定了（stFreeGo）就交給 stStep 重畫
  if(d.fact==='help'){SUI.fhelp=!SUI.fhelp;F.sel=null}
  else if(d.fact==='stat'){F.stat=!F.stat;F.sel=null}
  else if(d.fact==='stab')F.stab=d.v;
  else if(d.fact==='map'){F.scr='map';F.sel=null}
  else if(d.fact==='bcat'){F.bcat=d.v}   // 服飾店的分類
  else if(d.fact==='clerk'){const ck=stClerk(F.shop);if(ck){F.hop=Date.now();stShopSay(F,R(stT().free.shop.clerks[ck].idle),3500,ck)}}   // 點店員＝跳一下＋隨機一句
  else if(d.fact==='leave'){const sh=STORY_SHOP[F.shop];stFreeGo(sh.day,{small:sh.bg},F.cart);return}   // 離開店：這天＝逛店（買的東西一起算）
  stRender();
}
// ---------- 週中途的存檔（v0.40.44）：只有白天在家時能存 ----------
function stRunPack(){const R=STRUN;
  return storyCopy({i:R.i,ids:R.ids,start:R.start,end:R.end,met:R.met,res:R.res.slice(0,R.i).map(x=>({id:x.id,r:x.r,before:x.before,d:x.d,small:x.small,big:x.big,enc:x.enc,forced:!!x.forced,kick:!!x.kick,
    fg:x.fg||0,meet:!!x.meet,free:!!x.free,buys:x.buys||[],vis:x.stg&&x.stg.visit?x.stg.visit.name:''}))});}
// 讀存檔／進主線：有 run＝接回這週（白天的家），沒有＝這週開始排行程
function stResume(){const run=STY.run;delete STY.run;SUI.over=false;SUI.scr='home';SUI.sel=0;SUI.encPop=null;ST_FAVPRE=null;
  if(!run){STRUN=null;SUI.sched=stFixedFill();return}
  STRUN={i:run.i,phase:0,still:false,start:{...run.start},end:{...run.end},ids:[...run.ids],res:run.res.map(x=>({...x,stg:x.vis?{visit:{name:x.vis}}:{},preDone:1,postDone:1})),tired:false,bgFade:true,skip:false,free:stFreeNew(),met:{...run.met}};
  stHubEnter(true);}
