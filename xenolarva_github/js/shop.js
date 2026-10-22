// ===== 廢棄大樓的商店（言盡）=====
// 地圖選「廢棄大樓區」出發（耗 1 行動）→ 第一次：事件 shopIntro（js/events.js，文字 TEXT.shop.intro）→ 商店畫面。
// 商店：上面是打開的行李箱（由上往下看），擺 SHOP_SHOW 種商品（always 的先擺）；點一下＝選取（名牌變「購買」、言盡介紹），再點一次＝用積分買。
//   裝扮道具（wear）選取時多一顆「預覽」：行李箱上蓋一個預覽框（小球戴上的樣子，和聊天染色的預覽一樣），框裡可以直接購買或關掉。
// 下面是言盡的對話框＋頭像，最下面左邊持有積分、右邊「離開商店」。資料 js/data/shop.js、js/data/wears.js。
// 裝扮的名字（用商店商品的名字）
// 裝扮的商品圖：把有畫東西的那一塊（WEARS 的 box）原尺寸置中放進 96×96（不放大，避免糊）
function wearIcon(id){
  const W=WEARS[id],c=h('canvas',{class:'sicon swear',width:96,height:96});
  if(!W.img){c.getContext('2d').drawImage(wearImg(id),0,0);return c}
  const im=wearImg(id),[x0,y0,x1,y1]=W.box||[0,0,96,96],w=x1-x0,hh=y1-y0,k=Math.min(1,92/w,92/hh);
  const draw=()=>{const g=c.getContext('2d'),q=im.naturalWidth/96||1;g.imageSmoothingEnabled=true;g.drawImage(im,x0*q,y0*q,w*q,hh*q,48-w*k/2,48-hh*k/2,w*k,hh*k);
    if(W.glow){const gc=glowImg(id,'255,233,77');if(gc){g.save();g.shadowColor='#ffe94d';g.shadowBlur=5;g.drawImage(gc,x0,y0,w,hh,48-w*k/2,48-hh*k/2,w*k,hh*k);g.restore()}else setTimeout(draw,200)}};   // 會發光的：商品圖用黃色
  if(im.complete&&im.naturalWidth)draw();else im.addEventListener('load',draw,{once:true});
  return c;
}
const wearName=id=>{const k=Object.keys(SHOP_ITEMS).find(k=>SHOP_ITEMS[k].wear===id);return k?TEXT.shop.items[k].name:id};
let SHOP_NOW=[],SHOP_SEL=null,SHOP_SOLD=new Set(),SHOP_SAY='',SHOP_PV=null;

// 從地圖出發
function shopGo(){
  S.ap--;
  if(!META.visited.includes('ruins'))META.visited.push('ruins');
  say(TEXT.shop.arrive,'ev');
  refresh();
  if(!META.shopMet)runEvent('shopIntro',{cb:shopOpen});
  else shopOpen();
}
// 行李箱上有兩個分頁：隨機商品（裝扮、永久玩具；每次去才換，切分頁不會刷新）｜固定商品（生活物資，每次都一樣）
// 隨機商品全部買完：行李箱上擺一隻可以戳的小球
let SHOP_TAB='rand',SHOP_RAND=[];
const shopPoolLeft=()=>Object.keys(SHOP_ITEMS).filter(id=>!SHOP_ITEMS[id].fixed&&!SHOP_ITEMS[id].hidden&&(!SHOP_ITEMS[id].cond||SHOP_ITEMS[id].cond())&&!(SHOP_ITEMS[id].wear?META.wears.includes(SHOP_ITEMS[id].wear):SHOP_ITEMS[id].tool?META.tools.includes(SHOP_ITEMS[id].tool):false)).length;
// ---------- 行李箱裡的小球（隨機商品賣完時）：陸地上的小球（js/render/land.js），偶爾兩隻 ----------
let SHOP_LARVA=null;
const SHOP_LARVA_K=2;   // 行李箱畫布（邏輯 360×240）放大到整個行李箱顯示，所以內部用 2 倍解析度，2 倍的小球圖才清楚
function shopLarvaInit(){const two=Math.random()<.35;SHOP_LARVA={two,land:null};return two}
function shopLarvaRun(c){
  if(!SHOP_LARVA)shopLarvaInit();
  if(SHOP_LARVA.land)SHOP_LARVA.land.stop();
  SHOP_LARVA.land=landStart(c,{n:SHOP_LARVA.two?2:1,floor:160,xmin:70,xmax:290,k:SHOP_LARVA_K});   // 畫布放大顯示：用 2 倍解析度畫（v0.35）
}
function shopLarvaPoke(c,e){
  if(!SHOP_LARVA||!SHOP_LARVA.land)return;
  const r=c.getBoundingClientRect(),x=(e.clientX-r.left)*c.width/SHOP_LARVA_K/r.width,T=TEXT.shop;
  SHOP_LARVA.land.poke(x);
  SHOP_SAY=Math.random()<.3?R(T.yanjinLarva):R(T.emptyPoke);$('shopTalk').textContent=SHOP_SAY;
}
function shopOpen(){
  const T=TEXT.shop,ids=Object.keys(SHOP_ITEMS);
  SHOP_SOLD=new Set();                                                       // 先清掉上次的「賣完」（不然上次買的東西會被當成還沒有）
  const pool=ids.filter(id=>!SHOP_ITEMS[id].fixed&&!SHOP_ITEMS[id].hidden&&(!SHOP_ITEMS[id].cond||SHOP_ITEMS[id].cond())&&shopState(id)!=='have');
  const must=pool.filter(id=>SHOP_ITEMS[id].always);
  const rest=pool.filter(id=>!must.includes(id)).sort(()=>Math.random()-.5);
  SHOP_RAND=[...must,...rest].slice(0,HEART_RULE.shop[META.heartLv]||SHOP_SHOW);   // 心等 3：多擺一種
  SHOP_TAB='rand';SHOP_NOW=SHOP_RAND;
  SHOP_SEL=null;SHOP_PV=null;SHOP_LARVA=null;SHOP_GIFT=0;
  SHOP_SAY=SHOP_RAND.length?R(T.hello):(shopLarvaInit()?T.emptyTwo:T.empty);
  $('shopTitle').textContent=T.title;$('shopLeave').textContent=T.leave;$('shopWho').textContent=T.who;
  $('shopImg').src=assetImg(SHOP_CASE);
  shopView('goods');
  $('ovShop').classList.add('show');
}
function shopTabSet(t){
  if(SHOP_TAB===t)return;
  SHOP_TAB=t;SHOP_SEL=null;SHOP_PV=null;
  SHOP_NOW=t==='fixed'?Object.keys(SHOP_ITEMS).filter(id=>SHOP_ITEMS[id].fixed):SHOP_RAND;
  SHOP_SAY=t==='fixed'?TEXT.shop.fixedSay:(SHOP_RAND.length?R(TEXT.shop.hello):(SHOP_LARVA&&SHOP_LARVA.two?TEXT.shop.emptyTwo:TEXT.shop.empty));
  shopDraw();
}
function shopClose(){$('ovShop').classList.remove('show');if(SHOP_LARVA&&SHOP_LARVA.land){SHOP_LARVA.land.stop();SHOP_LARVA.land=null}shopSceneStop();SHOP_PV=null;refresh()}
// ---------- 兩個畫面：goods 商品（行李箱＋對話框）｜chat 閒聊（廢墟場景：行李箱、言盡、偶爾一隻小球）----------
let SHOP_VIEW='goods',SHOP_CHR=0,SHOP_LAND=null,SHOP_GIFT=0;
function shopView(v){
  const T=TEXT.shop;SHOP_VIEW=v;
  $('shopWrap').hidden=v!=='goods';$('shopScene').hidden=v!=='chat';
  $('shopChat').textContent=v==='goods'?T.chatBtn:T.goodsBtn;
  if(v==='goods'){shopSceneStop();shopDraw();return}
  SHOP_PV=null;SHOP_SEL=null;SHOP_CHR=0;
  const S_=SHOP_SCENE;$('shopSBg').src=assetImg(S_.bg);$('shopSCase').src=assetImg(S_.suitcase);
  const ci=Math.floor(Math.random()*T.chat.length);SHOP_SAY=T.chat[ci];SHOP_CHR=(S_.chatAlt||[]).includes(ci)?1:0;shopSceneDraw();
  shopSceneStop();
  if(Math.random()<S_.larva){const c=$('shopLand'),sc=S_.larvaSc;
    SHOP_LAND=landStart(c,{n:1,floor:c.height-36*sc-14,xmin:150,xmax:420,sc,look:larvaLook({day:HALL_RULE.strangerDay,hue:Math.floor(Math.random()*360),col:'#ffffff'})})}
}
function shopSceneDraw(){$('shopChr').src=assetImg(SHOP_SCENE.chr[SHOP_CHR]);$('shopTalk').textContent=SHOP_SAY;$('shopPts').textContent=fmt(TEXT.shop.points,{n:META.points})}
function shopSceneStop(){if(SHOP_LAND){SHOP_LAND.stop();SHOP_LAND=null}const c=$('shopLand');c.getContext('2d').clearRect(0,0,c.width,c.height)}
// 這件商品現在能不能買：sold 賣完｜have 已經有了（玩具每種只能有一個；裝扮永久持有）
function shopState(id){
  if(SHOP_SOLD.has(id))return 'sold';
  const it=SHOP_ITEMS[id];
  if(it.wear)return META.wears.includes(it.wear)?'have':'';
  if(it.tool)return META.tools.includes(it.tool)?'have':'';
  if(Object.keys(it.give).every(k=>TOYS.includes(k)&&S.inv[k]>0))return 'have';
  return '';
}
function shopDraw(){
  const T=TEXT.shop,W=$('shopWrap');
  const keep=SHOP_TAB==='rand'&&!SHOP_RAND.length&&SHOP_LARVA&&SHOP_LARVA.land&&W.querySelector('.sempty');   // 小球還在跑：保留，不重來
  W.querySelectorAll(keep?'.sslot,.stabs':'.sslot,.stabs,.sempty').forEach(e=>e.remove());
  W.append(h('div',{class:'stabs'},...[['rand',T.tabRand],['fixed',T.tabFixed]].map(([k,t])=>h('button',{class:SHOP_TAB===k?'on':'',onclick:()=>shopTabSet(k)},t))));
  if(SHOP_TAB==='rand'&&!SHOP_RAND.length&&!keep){                                   // 隨機商品全買完：可以戳的小球
    const c=h('canvas',{class:'sempty',width:360*SHOP_LARVA_K,height:240*SHOP_LARVA_K});
    c.onclick=e=>shopLarvaPoke(c,e);W.append(c);shopLarvaRun(c);
  }
  const slots=SHOP_TAB==='fixed'?SHOP_SLOTS6:SHOP_NOW.length>3?SHOP_SLOTS4:SHOP_SLOTS;
  SHOP_NOW.forEach((id,i)=>{
    const it=SHOP_ITEMS[id],pos=slots[i],st=shopState(id),sel=SHOP_SEL===id,off=st==='sold'||st==='have';
    const pic=it.img?h('img',{class:'sicon',src:assetImg(it.img),alt:''})
      :it.wear?wearIcon(it.wear)
      :h('i',{class:'ico sicon',style:`--ico:${icoUrl(it.icon)};color:${it.color}`});
    const tag=st==='sold'?T.sold:st==='have'?T.items[id].name+'｜'+T.have2:sel?T.tagBuy+'｜'+fmt(T.price,{n:it.price}):T.items[id].name;
    const slot=h('div',{class:'sslot'+(sel?' sel':'')+(off?' sold':''),style:`left:${pos.x}%;top:${pos.y}%`},
      h('button',{class:'spic',disabled:off,'aria-hidden':'true',tabindex:-1,onclick:()=>shopTap(id)},pic),
      h('span',{class:'stags'},
        h('button',{class:'stag',disabled:off,'aria-label':T.items[id].name+'，'+fmt(T.price,{n:it.price}),onclick:()=>shopTap(id)},tag),
        sel&&it.wear&&st!=='sold'?h('button',{class:'stag spv'+(SHOP_PV===id?' on':''),onclick:()=>shopPreview(id)},T.tagPreview):null));
    W.append(slot);
  });
  $('shopPts').textContent=fmt(T.points,{n:META.points});
  $('shopTalk').textContent=SHOP_SAY;
  // 預覽框（蓋在行李箱上）
  const pv=!!SHOP_PV;$('shopPvBox').hidden=!pv;
  if(pv){
    const it=SHOP_ITEMS[SHOP_PV],st=shopState(SHOP_PV);
    $('shopPvBuy').textContent=fmt(T.pvBuy,{n:it.price});$('shopPvBuy').disabled=st==='sold'||st==='have';$('shopPvBack').textContent=T.pvBack;
    cancelAnimationFrame(SHOP_RAF);const loop=t=>{if(!SHOP_PV||!$('ovShop').classList.contains('show'))return;shopPvDraw(t);SHOP_RAF=requestAnimationFrame(loop)};SHOP_RAF=requestAnimationFrame(loop);
  }
}
let SHOP_RAF=0;
// 預覽：用這一輪的小球（沒有的話用一隻白色的）戴上這個裝扮
function shopPvDraw(t){
  const c=$('shopPv'),g=c.getContext('2d'),tt=(t||0)/1000;g.imageSmoothingEnabled=false;
  const gr=g.createLinearGradient(0,0,0,96);gr.addColorStop(0,'#2b7f93');gr.addColorStop(1,'#12485c');g.fillStyle=gr;g.fillRect(0,0,96,96);   // 和聊天染色的預覽同一個底色
  const base=S||{day:1,hue:200,col:'#ffffff'};
  drawLarva(g,48,44+Math.sin(tt*.9)*2,0,Math.sin(tt*2)*.03,'idle_a',{...larvaLook(base),wear:SHOP_ITEMS[SHOP_PV].wear},tt,1,1);
}
function shopPreview(id){
  if(SHOP_PV===id){SHOP_PV=null;SHOP_SAY=TEXT.shop.items[id].talk+'\n'+fmt(TEXT.shop.price,{n:SHOP_ITEMS[id].price})}
  else{SHOP_PV=id;SHOP_SAY=TEXT.shop.preview}
  shopDraw();
}
function shopTap(id){
  const T=TEXT.shop,it=SHOP_ITEMS[id];
  if(SHOP_SEL!==id){SHOP_SEL=id;SHOP_PV=null;SHOP_SAY=T.items[id].talk+'\n'+fmt(T.price,{n:it.price});shopDraw();return}   // 第一下：選取＋介紹
  SHOP_PV=null;
  const st=shopState(id);                                                                                    // 第二下：買
  if(st==='have'){SHOP_SAY=it.wear?T.wearHave:it.tool?(PLAY_TOOLS.includes(it.tool)?T.toolHave:T.magHave):T.have;shopDraw();return}
  if(META.points<it.price){SHOP_SAY=T.poor;shopDraw();return}
  META.points-=it.price;
  let list;
  if(it.wear){META.wears.push(it.wear);list=T.items[id].name}
  else if(it.tool){META.tools.push(it.tool);list=T.items[id].name}
  else{
    const L=[];
    for(const k in it.give){S.inv[k]=(S.inv[k]||0)+it.give[k];seeItem(k);L.push(TOYS.includes(k)?NAME[k]:`${NAME[k]}×${it.give[k]}`)}
    list=L.join('、');
  }
  META.buys=(META.buys||0)+1;
  SHOP_SOLD.add(id);SHOP_SEL=null;SHOP_SAY=R(T.thanks);
  if(SHOP_TAB==='rand'&&!shopPoolLeft()){SHOP_RAND=[];SHOP_NOW=[];SHOP_SAY=T.soldOut;SHOP_LARVA=null}   // 再也沒有可以擺的：馬上換成小球（免得下次白跑一趟）
  codexSave();say(fmt(T.bought,{n:it.price,list}),'ev');
  shopDraw();
}
$('shopPvBuy').onclick=()=>{const id=SHOP_PV;if(id){SHOP_SEL=id;shopTap(id)}};
$('shopPvBack').onclick=()=>{if(SHOP_PV)shopPreview(SHOP_PV)};
// 小球和言盡靠很近時，小球優先（言盡的圖左右有留白，會先蓋住小球）
const shopLarvaHit=e=>{if(!SHOP_LAND)return false;const c=$('shopLand'),r=c.getBoundingClientRect(),x=(e.clientX-r.left)*c.width/r.width,y=(e.clientY-r.top)*c.height/r.height;
  const b=SHOP_LAND.list[0],sc=SHOP_SCENE.larvaSc,by=c.height-36*sc-14-b.z;return Math.abs(b.x-x)<=60*sc&&Math.abs(by-y)<=70*sc?x:false};
function shopLarvaTap(x){
  const T=TEXT.shop;SHOP_LAND.poke(x);
  if(SHOP_GIFT<SHOP_SCENE.giftMax&&Math.random()<HALL_RULE.gift){       // 送東西（同大樓：換水劑或點心）
    SHOP_GIFT++;let k=R(HALL_RULE.gifts);if(k==='snack')k=R(GIFTS);S.inv[k]=(S.inv[k]||0)+1;seeItem(k);
    const got=fmt(TEXT.hall.larvaGot,{item:NAME[k]});SHOP_SAY=got+'\n'+T.larvaGive;say(got,'ev');codexSave();npcHop($('shopChr'),'shop');
  }else SHOP_SAY=R(T.sceneLarva);
  $('shopTalk').textContent=SHOP_SAY;
}
$('shopChr').onclick=e=>{                                          // 戳言盡：發呆那句換第二張圖；跳得很小
  const lx=shopLarvaHit(e);if(lx!==false){shopLarvaTap(lx);return}
  const L=TEXT.shop.poke,i=Math.floor(Math.random()*L.length);SHOP_SAY=L[i];SHOP_CHR=SHOP_SCENE.pokeAlt.includes(i)?1:0;shopSceneDraw();npcHop($('shopChr'),'shop')};
$('shopLand').onclick=e=>{const x=shopLarvaHit(e);if(x!==false)shopLarvaTap(x)};   // 戳閒聊畫面裡的小球
$('shopChat').onclick=()=>shopView(SHOP_VIEW==='goods'?'chat':'goods');
$('shopClose').onclick=shopClose;$('shopLeave').onclick=shopClose;
