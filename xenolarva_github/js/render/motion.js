// ===== 小球的共用移動（玩家養的那隻、圖鑑同伴都用這裡）=====
// 每個「身體」是一個物件：
//   x,y 位置｜vx,vy 速度｜tx,ty 想去的方向（速度會慢慢追上它）｜rot,rv 旋轉角度與角速度
//   next 下次換方向的時間｜home 自己的角落（頑固用）｜calm 這個時間前先回角落冷靜（頑固撞人後）
const PI2=Math.PI*2;
const WALL={l:40,r:460,t:48,b:308};
const WORLD={w:500,dx:0};                               // 水缸寬度（一般 500；預覽模式 750）。dx＝比 500 多出來的一半，用來把裝飾置中
const FLOOR_LOW=392;                                   // 睏睏可以躺到更低（水缸下方三分之一的沙地）
const floorOf=o=>(o===C?(S&&TEMPERS[S.temp].sleepy):(o.e&&TEMPERS[o.e.temp].sleepy))?FLOOR_LOW:WALL.b;                    // 活動範圍（水缸玻璃邊緣）
const IDLE_CYCLE=['idle_a','idle_b','idle_a','open_a','open_b','open_a','close','idle_b'];   // 待機時輪流用的姿勢

const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// 朝 p 前進的速度向量。s 是速度，s 為負數就是「遠離 p」。已經很近就停下。
function aim(o,p,s){const dx=p.x-o.x,dy=p.y-o.y,d=Math.hypot(dx,dy);return d<6?[0,0]:[dx/d*s,dy/d*s]}
// 隨機挑一個水缸底部的角落當「自己的領地」
function pickHome(){return {x:Math.random()<.5?WALL.l+16:WALL.r-16,y:304}}
// 目前在水缸裡、可以互動的小球（飄進／飄出中的不算）
const isLive=o=>o===C||o.phase==='live';

// 找離 o 最近的其他小球。回傳 {o:那隻或null, d:距離}
function nearest(o,ok){
  let best=null,bd=1e9;
  [...(PV?[]:[C]),...GUESTS].forEach(b=>{if(b===o||!isLive(b)||(ok&&!ok(b)))return;const d=dist(o,b);if(d<bd){bd=d;best=b}});
  return {o:best,d:bd};
}
// 找 o 附近的泡泡（range 範圍內最近的一顆）
function nearestBubble(o,range){
  let best=null,bd=range;
  BUB.forEach(b=>{if(b.y<60||b.y>320)return;const d=Math.hypot(b.x-o.x,b.y-o.y);if(d<bd){bd=d;best=b}});
  return best;
}

// 一般漫遊：每隔 1.5～4 秒隨機挑一個新方向。sp＝速度，low＝虛弱時往下沉一點
function wander(o,t,sp,low){
  const a=Math.random()*PI2,k=Math.random()<.6?1:.3;
  o.tx=Math.cos(a)*sp*k;
  o.ty=Math.sin(a)*sp*k*.6+(low?.15:0);
  if(isHigh(o)&&o.y>150)o.ty=-Math.abs(o.ty)-.2;          // 高高在上：往上游
  o.next=t+1500+Math.random()*2500;
}
// 標籤「高高在上」（玩家養的那隻看 S.tags；同伴看 e.own）
const isHigh=o=>o===C?hasTag('high'):!!(o.e&&(o.e.own||[]).includes('high'));
// 最近一次小球相撞的位置（guests.js 的 collide 記；守序會去勸架、好奇會去看熱鬧）
let HIT=null;
// 守序的巡邏路線（四個點繞圈；高高在上的話整條往上移）
const patrolPts=o=>{const dx=WORLD.dx,hi=isHigh(o);return [{x:110+dx,y:hi?80:120},{x:390+dx,y:hi?80:120},{x:390+dx,y:hi?170:260},{x:110+dx,y:hi?170:260}]};
const others=o=>[...(PV?[]:[C]),...GUESTS].filter(b=>b!==o&&isLive(b));

// 個性造成的「特別想去的地方」。回傳 [tx,ty]；沒有特別想法就回傳 null（照一般漫遊）。
// 玩家養的那隻和圖鑑同伴共用這段。T 是 TEMPERS 裡的一列。
function steer(o,t,T){
  if(T.patrol){                                          // 守序：附近有小球相撞就游過去勸架，平常照固定路線巡邏
    if(HIT&&t-HIT.t<1500&&HIT.a!==o&&HIT.b!==o&&t>(o.medCool||0)&&Math.hypot(HIT.x-o.x,HIT.y-o.y)<320){
      o.med={x:HIT.x,y:HIT.y,until:t+2200};o.medCool=t+9000;socialLog(o,HIT.a,'mediate',t);
    }
    if(o.med&&t<o.med.until)return aim(o,inTank(o.med,o),1.7);
    o.med=null;
    if(Math.floor(t/12000+(o.ph||0))%4===3)return null;   // 偶爾休息，隨便游一下
    const R_=patrolPts(o);if(o.wp==null)o.wp=Math.floor(Math.random()*4);
    if(dist(o,R_[o.wp])<30){o.wp=(o.wp+1)%4;o.wait=t+700}
    if(t<(o.wait||0))return [0,0];
    return aim(o,R_[o.wp],.75);
  }
  if(T.mimic&&Math.floor(t/10000+(o.ph||0)*3)%10<7){    // 易染：學附近小球的動作（守序優先），沒有同伴就學游標
    const ob=others(o);
    let m=ob.find(b=>TEMPERS[idOf(b)].patrol&&dist(o,b)<380)||nearest(o).o;
    if(m&&dist(o,m)>380)m=null;
    if(m){
      if(t>(o.mlog||0)){o.mlog=t+25000;socialLog(o,m,'mimic',t)}
      if(Math.abs(m.rv)>.04)o.rv+=m.rv*.06;               // 對方轉圈，自己也轉
      return dist(o,m)>150?aim(o,m,1.1):[m.vx*.95,m.vy*.95];   // 太遠先靠過去，近了就跟著同方向游
    }
    if(t-CUR.t<1200&&Math.abs(CUR.vx)+Math.abs(CUR.vy)>.3)return [Math.max(-1.6,Math.min(1.6,CUR.vx*.6)),Math.max(-1.2,Math.min(1.2,CUR.vy*.6))];   // 學游標的移動方向
    return null;
  }
  if(T.follow){                                          // 黏人（跟屁蟲）：每天挑一隻最喜歡的跟著；沒有同伴就黏你的游標
    const day=S?S.day:0;
    if(o.favDay!==day||(o.fav&&!isLive(o.fav))){o.favDay=day;const c=others(o);o.fav=c.length?R(c):null}
    if(!o.fav&&others(o).length){o.fav=R(others(o))}
    const ph=Math.floor(t/9000+(o.ph||0)*2)%3;           // 三段時間裡兩段在黏
    if(ph<2&&o.fav){
      if(t>(o.flog||0)){o.flog=t+30000;socialLog(o,o.fav,'follow',t)}
      const d=dist(o,o.fav);
      if(ph===1&&d<170){const a=t/700+(o.ph||0)*3;return aim(o,inTank({x:o.fav.x+Math.cos(a)*85,y:o.fav.y+Math.sin(a)*58},o),1.1)}   // 繞圈圈
      return d>95?aim(o,o.fav,1):[o.fav.vx*.8,o.fav.vy*.8];
    }
    if(ph<2&&!o.fav&&t-CUR.t<4000)return dist(o,CUR)>70?aim(o,inTank(CUR,o),.9):[0,0];
    return null;
  }
  if(T.nosy){                                            // 好奇（湊熱鬧）：哪裡有動靜就過去看一下，看完就走
    if(o.nosy&&t<o.nosy.until){
      const p=o.nosy.p;
      if(dist(o,p)<60){o.nosy.look=o.nosy.look||t;if(t-o.nosy.look>1500){o.nosy=null;o.ncool=t+7000;return null}return [Math.sin(t/300)*.15,0]}
      return aim(o,inTank(p,o),1.2);
    }
    o.nosy=null;
    if(t>(o.ncool||0)&&Math.random()<.02){
      const c=[];
      if(HIT&&t-HIT.t<2000)c.push({x:HIT.x,y:HIT.y});
      others(o).forEach(b=>{if(Math.hypot(b.vx,b.vy)>1.2&&dist(o,b)<320)c.push({x:b.x,y:b.y})});
      if(GAME&&GAME.kind==='bubble'&&GAME.parts&&GAME.parts.length){const b=GAME.parts[GAME.parts.length-1];c.push({x:b.x,y:b.y})}
      if(typeof visibleDecor==='function'&&Math.random()<.3)visibleDecor().forEach(id=>{const d=DECOR[id];c.push({x:d.x+WORLD.dx,y:Math.min(300,d.y-30)})});
      if(c.length){o.nosy={p:R(c),until:t+5000};o.ncool=t+7000;if(Math.random()<.25&&S&&!S.over)say(fmt(R(TEXT.social.nosy),{a:nameOf(o)}))}
    }
  }
  if(T.territory){                                       // 頑固：守自己的角落
    const n=nearest(o,b=>!isStubborn(b));                 // 頑固彼此不撞，只撞不是頑固的
    if(n.o&&n.d<150&&t>(o.calm||0))return aim(o,n.o,1.5);   // 有人闖進來：衝過去輕輕撞開
    if(o.home&&dist(o,o.home)>80)return aim(o,o.home,.6);   // 離角落太遠就慢慢游回去
    return null;
  }
  if(T.sleepy){                                          // 睏睏：每 4 段時間裡有 3 段躺在水缸下方的沙地睡覺，1 段慢慢游
    const ry=o.ry||(o.ry=isHigh(o)?58+Math.random()*18:340+Math.random()*45);   // 自己喜歡躺的高度（下方三分之一；高高在上＝浮在水面附近）
    if(o.moveTo&&t<o.moveTo.until)return aim(o,{x:o.moveTo.x,y:ry},.7);   // 被撞開後換地方
    if(Math.floor(t/8000+(o.ph||0)*3)%4!==0)return Math.abs(o.y-ry)>6?aim(o,{x:o.x,y:ry},.4):[0,0];
    return null;
  }
  if(T.bubbles){                                         // 活潑：追泡泡，碰到就戳破
    const b=nearestBubble(o,220);
    if(b){if(Math.hypot(b.x-o.x,b.y-o.y)<22){b.y=0}return aim(o,b,1.9)}   // b.y=0 → 畫面會讓它從底部重新冒出來
  }
  return null;
}

// 讓身體動一格：速度追上目標、移動、撞牆反彈、旋轉。still＝true 時不做撞牆旋轉（例如已經消逝）。
// 回傳撞牆的方向（0＝沒撞到），呼叫的人可以拿來做彈跳效果。
function moveBody(o,t,dt,still){
  o.vx+=(o.tx-o.vx)*.03*dt;o.vy+=(o.ty-o.vy)*.03*dt;
  o.x+=o.vx*dt;o.y+=o.vy*dt;
  let hit=0;
  if(o.x<WALL.l){o.x=WALL.l;o.vx=Math.abs(o.vx)+.25;o.tx=Math.abs(o.tx);hit=-1}
  else if(o.x>WALL.r){o.x=WALL.r;o.vx=-Math.abs(o.vx)-.25;o.tx=-Math.abs(o.tx);hit=1}
  if(o.y<WALL.t){o.y=WALL.t;o.vy=Math.abs(o.vy)+.15;o.ty=Math.abs(o.ty);hit=hit||.6}
  else if(o.y>floorOf(o)){o.y=floorOf(o);o.vy=-Math.abs(o.vy)*.5;o.ty=-Math.abs(o.ty)*.5;hit=hit||-.6}
  if(hit&&!still)o.rv=hit*(.08+Math.random()*.08);       // 撞牆時整隻轉一下
  // 旋轉會慢慢回到「順著游動方向微微傾斜」的角度
  const lean=Math.max(-.3,Math.min(.3,o.vx*.25))+Math.sin(t/900+(o.ph||0))*.05;
  const diff=((lean-o.rot+Math.PI*3)%PI2)-Math.PI;
  o.rv+=diff*.004*dt;o.rv*=Math.pow(.97,dt);o.rot+=o.rv*dt;
  return still?0:hit;
}
