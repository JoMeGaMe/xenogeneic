// ===== 圖鑑同伴：以前養的小球在水缸裡游動、追逐、互撞 =====
// 只是互動要素，沒有生命與需求。移動規則在 js/render/motion.js，個性參數在 js/data/temperaments.js。
// 同伴有三個階段（g.phase）：
//   'in'   從畫面邊緣或上方緩緩飄進來（不參與碰撞）
//   'live' 正常游動、追逐、互撞
//   'out'  緩緩飄出畫面後消失
let GUESTS=[];
const FLY_IN=3000, FLY_OUT=2600;     // 飄進／飄出花的時間（毫秒）
let lastBumpMsg=0;

// ---------- 進場與離場 ----------
function makeGuest(e){
  const side=R(['top','top','left','right']);              // 從上方飄下，或從左右側飄進來
  const g={e,name:e.name,phase:'in',t0:null,dur:FLY_IN,al:0,
    x:0,y:0,vx:0,vy:0,tx:0,ty:0,rot:0,rv:0,bn:0,next:0,steering:false,mode:'wander',mu:0,
    p:'open_a',pt:0,ph:Math.random()*6,look:larvaLook(e),home:pickHome(),calm:0};
  g.ex=WALL.l+70+Math.random()*(WALL.r-WALL.l-140);g.ey=100+Math.random()*180;   // 最後停下來的位置
  if(side==='top'){g.sx=g.ex;g.sy=-70}
  else if(side==='left'){g.sx=-70;g.sy=g.ey}
  else{g.sx=WORLD.w+70;g.sy=g.ey}
  g.x=g.sx;g.y=g.sy;
  return g;
}
function leaveGuest(g){
  g.phase='out';g.t0=null;g.dur=FLY_OUT;g.sx=g.x;g.sy=g.y;
  if(Math.random()<.4){g.ex=g.x;g.ey=-80}                  // 往上飄走
  else{g.ex=g.x<WORLD.w/2?-80:WORLD.w+80;g.ey=g.y}                      // 或往最近的側邊飄走
}
// 飄動中的每一格：緩入緩出地移動，帶一點晃動，淡入或淡出
function flyStep(g,t){
  if(g.t0==null)g.t0=t;
  const k=Math.min(1,(t-g.t0)/g.dur),e=k*k*(3-2*k);        // e：0→1 的緩入緩出
  const sway=Math.sin((t-g.t0)/420+g.ph)*(g.phase==='in'?1-e:e)*16;
  g.x=g.sx+(g.ex-g.sx)*e+(g.sx===g.ex?sway:0);               // 垂直飄時才左右晃
  g.y=g.sy+(g.ey-g.sy)*e+(g.sy===g.ey?sway*.6:0);            // 水平飄時才上下晃
  g.rot=Math.sin((t-g.t0)/500+g.ph)*.2;
  g.al=g.phase==='in'?Math.min(1,.25+e*1.2):1-e*e;
  if(k>=1){
    if(g.phase==='in'){g.phase='live';g.t0=null;g.al=1;g.vx=g.vy=0;g.tx=g.ty=0;g.next=0}   // 到位，開始互動
    else g.gone=true;                                                                    // 飄出去了，等一下移除
  }
}
// 依圖鑑勾選同步水缸裡的同伴：新勾的飄進來，取消勾選的飄出去（開新周目與每次換日時呼叫）
// announce＝true 時在訊息區寫一行
function syncGuests(announce){
  const want=guestEntries();
  GUESTS.forEach(g=>{
    if(g.phase!=='out'&&!want.some(e=>e.id===g.e.id)){
      leaveGuest(g);
      if(announce)say(fmt(TEXT.guest.leave,{name:nm(g.name)}));
    }
  });
  want.forEach(e=>{
    if(!GUESTS.some(g=>g.e.id===e.id&&g.phase!=='out')){
      GUESTS.push(makeGuest(e));
      if(announce){say(fmt(TEXT.guest.join,{name:nm(e.name)}),'ev');const j=TEXT.temper[e.temp].join;if(j)say(fmt(j,{name:nm(e.name)}),'ev')}
    }
  });
}

// ---------- 每一格的行動 ----------
function stepGuests(t){
  const dt=Math.min(3,(t-(stepGuests.last||t))/16.7);stepGuests.last=t;
  GUESTS.forEach(g=>{
    g.bn*=.96;
    if(g.phase!=='live'){flyStep(g,t);return}
    const T=TEMPERS[g.e.temp];
    // 躲開 → 個性特別行為（領地、追泡泡、睡覺）→ 對其他小球的互動（見 social.js）→ 一般漫遊
    const tgt=gameSteer(g,t)||dashSteer(g,t)||pkSteer(g,t)||steer(g,t,T)||socialSteer(g,t);   // 互動玩耍中（js/minigame.js）優先
    if(tgt){g.tx=tgt[0];g.ty=tgt[1];g.steering=true}
    else{
      if(g.steering){g.steering=false;g.next=0}
      if(t>g.next&&!socialPick(g,t))wander(g,t,T.speed,false);
    }
    if(moveBody(g,t,dt,false))g.bn=Math.max(g.bn,.5);
  });
  GUESTS=GUESTS.filter(g=>!g.gone);
  fixHomes();collide(t);
}

// ---------- 互相碰撞 ----------
const isStubborn=o=>!!TEMPERS[o===C?S.temp:o.e.temp].territory;
function collide(t){
  if(GAME&&!GAME.done&&['wand','bell','bucket'].includes(GAME.kind))return;   // 互動玩耍（追指揮棒、找鈴鐺、搶水桶）時暫時不互撞
  const bodies=[...(PV||(S&&S.over)?[]:[C]),...GUESTS.filter(g=>g.phase==='live')];
  const R2=68;                                                // 兩隻靠得比這個近就算碰到
  for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
    const a=bodies[i],b=bodies[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
    if(d>=R2||d===0)continue;
    const nx=dx/d,ny=dy/d,ov=(R2-d)/2;
    const da=t<(a.dash||0),db=t<(b.dash||0);
    if(da||db){                                              // 有人正在逃跑：只把另一隻推開，逃跑的不會被彈回去
      if(!da){a.x-=nx*ov*2;a.y-=ny*ov*2}else if(!db){b.x+=nx*ov*2;b.y+=ny*ov*2}
      bump(a,b,nx,ny,t);bump(b,a,-nx,-ny,t);continue;
    }
    a.x-=nx*ov;a.y-=ny*ov;b.x+=nx*ov;b.y+=ny*ov;             // 分開
    const vn=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
    if(vn<0){a.vx+=vn*nx;a.vy+=vn*ny;b.vx-=vn*nx;b.vy-=vn*ny}
    a.vx-=nx*.6;a.vy-=ny*.6;b.vx+=nx*.6;b.vy+=ny*.6;         // 彈開
    a.rv-=.14;b.rv+=.14;                                      // 各自轉一下
    [a,b].forEach(o=>{
      if(o===C){bounce=Math.max(bounce,.7);C.tx=C.vx*.6;C.ty=C.vy*.6}   // 玩家養的那隻身體彈一下
      else o.bn=.7;
    });
    bump(a,b,nx,ny,t);bump(b,a,-nx,-ny,t);
  }
}
// 頑固的小球撞到別人：把對方輕輕（Q 彈地）彈開，自己回角落冷靜一下。(nx,ny) 是從 from 指向 to 的方向。
function bump(from,to,nx,ny,t){
  if(!isStubborn(from)||isStubborn(to))return;
  to.vx+=nx*1.6;to.vy+=ny*1.6;to.rv+=nx>0?.25:-.25;
  from.vx-=nx*.5;from.vy-=ny*.5;
  from.calm=t+2500;
  const sl=TEMPERS[idOf(to)].sleepy;
  if(sl)to.moveTo={x:to.x<WORLD.w/2?WORLD.w*.6+Math.random()*130:60+Math.random()*130,until:t+5000};   // 睏睏被撞開：換個地方繼續躺
  if(t-lastBumpMsg>8000&&S&&!S.over){                          // 訊息最多每 8 秒一次，不洗版（同伴之間也會寫）
    lastBumpMsg=t;
    if(sl)say(fmt(R(TEXT.social.moved),{b:nameOf(to)}));
    else if(from===C)say(fmt(TEXT.guest.bumpOut,{name:nm(to.name)}));
    else if(to===C)say(fmt(TEXT.guest.bumpIn,{name:nm(from.name)}));
    else say(fmt(TEXT.guest.bumpAny,{a:nameOf(from),b:nameOf(to)}));
  }
}

// ---------- 畫出同伴 ----------
function guestPose(g,i,t){
  if(g.phase!=='live')return t%700<350?'open_a':'open_b';    // 飄動時觸肢張開
  if(g.pk&&t<g.pk.until)return ['hide','turn'].includes(g.pk.kind)?'curl':['wave','stretch','touch'].includes(g.pk.kind)||(g.pk.kind==='come'&&Math.hypot(g.pk.x-g.x,g.pk.y-g.y)<40)?'reach_'+(t%440<220?'a':'b'):'flat_'+(t%440<220?'a':'b');   // 被戳的反應
  if(Math.hypot(g.vx,g.vy)>.6)return 'flat_'+(t%440<220?'a':'b');
  if(TEMPERS[g.e.temp].sleepy&&g.y>=296&&Math.hypot(g.vx,g.vy)<.35)return 'rest';   // 睏睏貼底睡覺
  return IDLE_CYCLE[Math.floor(t/450+i*3)%IDLE_CYCLE.length];
}
function drawGuests(t,tt){
  GUESTS.forEach((g,i)=>{
    if(t-g.pt>260){g.p=guestPose(g,i,t);g.pt=t}
    const live=g.phase==='live';
    const dy=g.y+(live?Math.sin(tt*.9+i)*5:0)-g.bn*Math.abs(Math.sin(tt*9))*14;
    const sq=Math.sin(tt*2+i)*.03+g.bn*Math.sin(tt*13)*.08;
    if(live){cx.globalAlpha=.2;cx.fillStyle='#000';cx.beginPath();cx.ellipse(g.x,Math.max(342,g.y+38),26,7,0,0,PI2);cx.fill()}   // 影子
    drawLarva(cx,g.x,dy,g.rot,sq,g.p,g.look,tt+i*1.3,.95*g.al,.9);
    if(g.em&&!drawBubble(g.em,t,g.x,dy-42))g.em=null;                 // 同伴的表情氣泡
    cx.globalAlpha=g.al;cx.font='bold 13px sans-serif';cx.textAlign='center';cx.lineWidth=3;
    cx.strokeStyle='rgba(8,26,36,.8)';cx.strokeText(g.name,g.x,dy+58);cx.fillStyle='#e6f6f2';cx.fillText(g.name,g.x,dy+58);
    cx.globalAlpha=1;
  });
}

// ---------- 被戳（預覽模式：每隻同伴都能戳）----------
// 反應和玩家養的那隻一樣，照個性的 poke 種類（見 POKE 表）：黏人靠過來、害羞躲角落、好奇揮觸肢、頑固背過身回角落、活潑轉圈、睏睏伸展。
function pokeGuest(g,t,x,y){
  if(g.phase!=='live'||t-(g.lp||0)<500)return false;
  g.lp=t;g.bn=Math.max(g.bn,.9);
  let kind=TEMPERS[g.e.temp].poke;
  if(g.e.own.includes('touchy')&&['hide','turn'].includes(kind))kind='touch';
  const dur={come:3000,hide:5000,wave:2200,turn:3500,spin:1800,stretch:3200,touch:2500}[kind]||2000;
  g.pk={kind,x:Math.max(60,Math.min(WALL.r-20,x)),y:Math.max(60,Math.min(300,y)),until:t+dur};
  g.next=0;
  if(kind==='spin')g.rv=(Math.random()<.5?-1:1)*.5;
  if(kind==='hide'){g.vx+=(g.x<x?-1:1)*1.6}
  say(TEXT.poke[kind].replace(/幼體/g,nm(g.name)));
  emoteOn(g,{come:'heart',hide:'q',wave:'ex',turn:'x',spin:'star',stretch:'q',touch:'heart'}[kind]||'ex');   // 被戳時也冒氣泡（和玩家養的那隻一樣）
  return true;
}
// 被戳之後這段時間要去哪裡（回傳 [tx,ty]；沒有就 null）
function pkSteer(g,t){
  const k=g.pk;if(!k)return null;
  if(t>=k.until){g.pk=null;return null}
  if(k.kind==='come')return aim(g,k,1);
  if(k.kind==='touch')return aim(g,k,.5);
  if(k.kind==='hide')return aim(g,{x:g.x<WORLD.w/2?WALL.l+12:WALL.r-12,y:306},1.4);
  if(k.kind==='turn')return aim(g,g.home,.7);
  return [0,0];
}
