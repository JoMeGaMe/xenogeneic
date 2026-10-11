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
  o.next=t+1500+Math.random()*2500;
}

// 個性造成的「特別想去的地方」。回傳 [tx,ty]；沒有特別想法就回傳 null（照一般漫遊）。
// 玩家養的那隻和圖鑑同伴共用這段。T 是 TEMPERS 裡的一列。
function steer(o,t,T){
  if(T.territory){                                       // 頑固：守自己的角落
    const n=nearest(o,b=>!isStubborn(b));                 // 頑固彼此不撞，只撞不是頑固的
    if(n.o&&n.d<150&&t>(o.calm||0))return aim(o,n.o,1.5);   // 有人闖進來：衝過去輕輕撞開
    if(o.home&&dist(o,o.home)>80)return aim(o,o.home,.6);   // 離角落太遠就慢慢游回去
    return null;
  }
  if(T.sleepy){                                          // 睏睏：每 4 段時間裡有 3 段躺在水缸下方的沙地睡覺，1 段慢慢游
    const ry=o.ry||(o.ry=340+Math.random()*45);          // 自己喜歡躺的高度（下方三分之一）
    if(o.moveTo&&t<o.moveTo.until)return aim(o,{x:o.moveTo.x,y:ry},.7);   // 被撞開後換地方
    if(Math.floor(t/8000+(o.ph||0)*3)%4!==0)return o.y<ry-6?aim(o,{x:o.x,y:ry},.4):[0,0];
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
