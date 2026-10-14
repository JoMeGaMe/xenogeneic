// ===== 小球之間的互動（玩家養的那隻、圖鑑同伴共用）=====
// 規則來自設定總表分頁 3 的 A2：「主動方個性 × 對象個性」→ 行為。要改互動，改下面的 REL 表與 ACT 參數就好。
// 行為（REL 表裡的字）：
//   play      一起玩：靠近對方、繞著對方游（對方也願意的話，兩邊一起）
//   together  一起游：跟在對方旁邊一起游
//   chase     追逐：衝向對方一小段
//   tryPush   想湊過去：衝向頑固的小球，然後被牠輕輕撞開（撞開的規則在 guests.js 的 bump）
//   bounce    相撞：兩隻黏人互相衝過去，彈開好幾次才各做各的
//   nestle    窩在旁邊：靠過去，貼著睏睏待一陣子（害羞特別喜歡）
//   flee      躲開：對方靠近時短暫加速逃跑（這幾秒不會被碰撞彈回去）
//   null      沒有互動
// 頑固的「領地」（撞開靠近的人、退回角落）寫在 motion.js 的 steer；睏睏不主動理人，所以整列都是 null。
const REL={
  //          黏人      害羞    好奇        頑固       活潑        睏睏      守序        易染
  clingy:  {clingy:'bounce',shy:'chase',curious:'play',    stubborn:'tryPush',lively:'play',    sleepy:null,helper:'play',    mimic:'play'},
  shy:     {clingy:'flee',  shy:null,   curious:'flee',    stubborn:'flee',   lively:'flee',    sleepy:'nestle',helper:null,mimic:'flee'},
  curious: {clingy:'play',  shy:'chase',curious:'together',stubborn:'tryPush',lively:'play',    sleepy:null,helper:'play',    mimic:'play'},
  stubborn:{clingy:null,    shy:null,   curious:null,      stubborn:null,     lively:null,      sleepy:null,helper:null,      mimic:null},
  lively:  {clingy:'play',  shy:'chase',curious:'play',    stubborn:'tryPush',lively:'together',sleepy:null,helper:'play',    mimic:'chase'},
  sleepy:  {clingy:null,    shy:null,   curious:null,      stubborn:null,     lively:null,      sleepy:null,helper:null,      mimic:null},
  helper:  {clingy:'together',shy:null, curious:'together',stubborn:null,     lively:null,      sleepy:null,helper:'together',mimic:'together'},   // 守序：主要是巡邏和勸架（motion.js）
  mimic:   {clingy:null,    shy:null,   curious:null,      stubborn:null,     lively:null,      sleepy:null,helper:null,      mimic:null}         // 易染：學動作寫在 motion.js
};
// p＝每次「決定要做什麼」時發生的機率｜dur＝持續毫秒｜cd＝同一隻要隔多久才會再來一次
const ACT={
  play:{p:.25,dur:3000,cd:12000}, together:{p:.25,dur:3500,cd:12000},
  chase:{p:.10,dur:1800,cd:9000}, tryPush:{p:.25,dur:2000,cd:9000}, bounce:{p:.40,dur:4000,cd:12000},
  nestle:{p:.35,dur:9000,cd:6000}
};
// 相性好的組合：互動機率 ×1.6（文字上也會多一句）。要新增相性就加一組。
const FRIENDS=[['shy','sleepy'],['lively','curious'],['clingy','stubborn'],['helper','mimic']];
const isFriend=(a,b)=>FRIENDS.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
const idOf=o=>o===C?S.temp:o.e.temp;
// 目標點不能在水缸邊界外（否則會一直頂著牆原地打轉）
const inTank=(p,o)=>({x:Math.max(WALL.l+20,Math.min(WALL.r-20,p.x)),y:Math.max(WALL.t+20,Math.min(floorOf(o)-8,p.y))});

// 決定要不要對最近的小球做什麼。有開始就回傳 true
function socialPick(o,t){
  const n=nearest(o);if(!n.o||n.d>320)return false;
  const rel=REL[idOf(o)][idOf(n.o)],s=rel&&ACT[rel];
  if(!s||t<(o.cool||0)||Math.random()>s.p*(isFriend(idOf(o),idOf(n.o))?1.6:1))return false;
  o.mode=rel;o.partner=n.o;o.nx=0;o.mu=t+s.dur;o.next=o.mu;o.cool=t+s.cd;
  if((rel==='play'||rel==='together')&&REL[idOf(n.o)][idOf(o)]===rel&&!(n.o.mode&&t<n.o.mu)){   // 對方也想的話，一起
    Object.assign(n.o,{mode:rel,partner:o,mu:o.mu,next:o.mu,cool:o.cool});
  }
  socialLog(o,n.o,rel,t);
  return true;
}
// 進行中的互動，回傳 [tx,ty]；沒有就回傳 null
function socialSteer(o,t){
  if(!o.mode||t>=o.mu){o.mode=null;return null}
  const p=o.partner;
  if(!p||!isLive(p)){o.mode=null;return null}
  const d=dist(o,p);
  switch(o.mode){
    case 'play':{const a=t/600+(o.ph||0)*2+(o===C?0:Math.PI);return aim(o,inTank({x:p.x+Math.cos(a)*85,y:p.y+Math.sin(a)*60},o),1.2)}
    case 'together':return d>120?aim(o,p,.9):[p.vx*.9,p.vy*.9];
    case 'chase':case 'tryPush':return aim(o,p,1.1);
    case 'bounce':return aim(o,p,1.2);
    case 'nestle':{                                      // 窩在睏睏的一側（選有空間的那邊，不貼牆、不鑽進牆外）
      if(!o.nx)o.nx=(p.x<WORLD.w/2?1:-1)*80;
      if(p.x+o.nx<WALL.l+25||p.x+o.nx>WALL.r-25)o.nx=-o.nx;
      return aim(o,inTank({x:p.x+o.nx,y:p.y},o),.6);
    }
  }
  o.mode=null;return null;
}

// ---------- 躲開（害羞）：有人靠近就短暫加速逃跑，方向會避開牆壁，這幾秒不會被撞回去 ----------
function escapeDir(o,n){
  let dx=o.x-n.x,dy=o.y-n.y,d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
  const wall=Math.min(o.x-WALL.l,WALL.r-o.x,o.y-WALL.t,WALL.b-o.y),k=Math.max(0,Math.min(1,(110-wall)/110));   // 越靠牆 k 越大
  let cx_=WORLD.w/2-o.x,cy_=180-o.y;const cd=Math.hypot(cx_,cy_)||1;cx_/=cd;cy_/=cd;                              // 水缸中央的方向
  let px=-dy,py=dx;if(px*cx_+py*cy_<0){px=-px;py=-py}                                                        // 沿牆往開闊那側滑
  let vx=dx*(1-k)+cx_*k*.8+px*k*.6,vy=dy*(1-k)+cy_*k*.8+py*k*.6;const l=Math.hypot(vx,vy)||1;
  return [vx/l,vy/l];
}
function dashSteer(o,t){
  const id=idOf(o);
  if(t<(o.dash||0))return [o.dv[0]*2,o.dv[1]*2];
  if(t<(o.dcool||0))return null;
  const n=nearest(o);
  if(n.o&&n.d<130&&REL[id][idOf(n.o)]==='flee'){
    o.dv=escapeDir(o,n.o);o.dash=t+1100;o.dcool=t+3200;
    o.vx=o.dv[0]*1.8;o.vy=o.dv[1]*1.8;o.mode=null;socialLog(o,n.o,'flee',t);               // 立刻衝出去
    return [o.dv[0]*2,o.dv[1]*2];
  }
  return null;
}

// ---------- 頑固：兩隻頑固不要搶同一個角落，後來的換到另一邊 ----------
function fixHomes(){
  const st=[...(PV?[]:[C]),...GUESTS].filter(b=>b===C?(S&&TEMPERS[S.temp].territory):TEMPERS[b.e.temp].territory);
  for(let i=0;i<st.length;i++)for(let j=i+1;j<st.length;j++){
    if(Math.abs(st[i].home.x-st[j].home.x)>50)continue;
    const mv=st[j]===C?st[i]:st[j],nx=mv.home.x<WORLD.w/2?WALL.r-16:WALL.l+16;
    if(!st.some(b=>b!==mv&&Math.abs(b.home.x-nx)<50))mv.home={x:nx,y:304};   // 另一邊沒人才換
  }
}

// ---------- 互動的文字描述：同伴之間也會寫，間隔至少 12 秒（和頑固撞人的訊息共用間隔，避免洗版）----------
const nameOf=o=>nm(o===C?S.name:o.name);
function socialLog(o,p,rel,t){
  if(!S||S.over||t-lastBumpMsg<12000)return;
  const pool=TEXT.social[rel];if(!pool)return;
  lastBumpMsg=t;
  const v={a:nameOf(o),b:nameOf(p)};
  let line=fmt(R(pool),v);
  const ids=[idOf(o),idOf(p)].sort(),fr=TEXT.social.friend[ids.join('+')];       // 相性好的組合：用名字補一句
  if(fr&&Math.random()<.5)line+=fmt(fr,{x:idOf(o)===ids[0]?v.a:v.b,y:idOf(o)===ids[0]?v.b:v.a});
  say(line);
}
