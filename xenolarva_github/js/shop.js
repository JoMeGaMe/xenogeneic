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
  const draw=()=>{const g=c.getContext('2d');g.imageSmoothingEnabled=true;g.drawImage(im,x0,y0,w,hh,48-w*k/2,48-hh*k/2,w*k,hh*k)};
  if(im.complete&&im.naturalWidth)draw();else im.addEventListener('load',draw,{once:true});
  return c;
}
const wearName=id=>{const k=Object.keys(SHOP_ITEMS).find(k=>SHOP_ITEMS[k].wear===id);return k?TEXT.shop.items[k].name:id};
let SHOP_NOW=[],SHOP_SEL=null,SHOP_SOLD=new Set(),SHOP_SAY='',SHOP_PV=null;

// 從地圖出發
function shopGo(){
  S.ap--;
  say(TEXT.shop.arrive,'ev');
  refresh();
  if(!META.shopMet)runEvent('shopIntro',{cb:shopOpen});
  else shopOpen();
}
function shopOpen(){
  const T=TEXT.shop,ids=Object.keys(SHOP_ITEMS);
  const must=ids.filter(id=>SHOP_ITEMS[id].always&&shopState(id)!=='have');
  const rest=ids.filter(id=>!must.includes(id)&&!SHOP_ITEMS[id].hidden&&shopState(id)!=='have').sort(()=>Math.random()-.5);   // 已經有的（裝扮、永久玩具、手上已有的玩具）不擺
  SHOP_NOW=[...must,...rest].slice(0,SHOP_SHOW);
  SHOP_SEL=null;SHOP_SOLD=new Set();SHOP_SAY=R(T.hello);SHOP_PV=null;
  $('shopTitle').textContent=T.title;$('shopLeave').textContent=T.leave;$('shopWho').textContent=T.who;
  $('shopImg').src=assetImg(SHOP_CASE);$('shopFace').src=assetImg(SHOP_FACE);
  shopDraw();
  $('ovShop').classList.add('show');
}
function shopClose(){$('ovShop').classList.remove('show');SHOP_PV=null;refresh()}
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
  W.querySelectorAll('.sslot').forEach(e=>e.remove());
  SHOP_NOW.forEach((id,i)=>{
    const it=SHOP_ITEMS[id],pos=SHOP_SLOTS[i],st=shopState(id),sel=SHOP_SEL===id;
    const pic=it.img?h('img',{class:'sicon',src:assetImg(it.img),alt:''})
      :it.wear?wearIcon(it.wear)
      :h('i',{class:'ico sicon',style:`--ico:${icoUrl(it.icon)};color:${it.color}`});
    const tag=st==='sold'?T.sold:sel?T.tagBuy+'｜'+fmt(T.price,{n:it.price}):T.items[id].name;
    const slot=h('div',{class:'sslot'+(sel?' sel':'')+(st==='sold'?' sold':''),style:`left:${pos.x}%;top:${pos.y}%`},
      h('button',{class:'spic',disabled:st==='sold','aria-hidden':'true',tabindex:-1,onclick:()=>shopTap(id)},pic),
      h('span',{class:'stags'},
        h('button',{class:'stag',disabled:st==='sold','aria-label':T.items[id].name+'，'+fmt(T.price,{n:it.price}),onclick:()=>shopTap(id)},tag),
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
  if(st==='have'){SHOP_SAY=it.wear?T.wearHave:it.tool?T.toolHave:T.have;shopDraw();return}
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
  SHOP_SOLD.add(id);SHOP_SEL=null;SHOP_SAY=R(T.thanks);
  codexSave();say(fmt(T.bought,{n:it.price,list}),'ev');
  shopDraw();
}
$('shopPvBuy').onclick=()=>{const id=SHOP_PV;if(id){SHOP_SEL=id;shopTap(id)}};
$('shopPvBack').onclick=()=>{if(SHOP_PV)shopPreview(SHOP_PV)};
$('shopClose').onclick=shopClose;$('shopLeave').onclick=shopClose;
