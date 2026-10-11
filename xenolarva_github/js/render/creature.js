// ===== 玩家養的那隻幼體：游動、姿勢、被戳的反應 =====
// 共用的移動規則（撞牆、旋轉、漫遊、個性行為）在 js/render/motion.js；個性參數在 js/data/temperaments.js。
const C={x:250,y:180,vx:1,vy:.15,tx:1,ty:0,rot:0,rv:0,next:0,last:0,p:'idle_a',pt:0,
         lastPoke:0,dy:180,home:{x:56,y:304},calm:0,steering:false};
let PV=false;      // 預覽模式中（js/preview.js）
let M=null;        // 被戳後正在進行的反應：{k:反應名稱, until:結束時間, ...}。null＝沒有
let pokes=[];      // 最近被戳的時間（用來判斷「戳太多次」）

// ---------- 每一格的移動 ----------
function step(t){
  const dt=Math.min(3,(t-(C.last||t))/16.7);C.last=t;
  if(SN){snStep(t,dt);return}                                          // 偷偷七逃：游出去／游回來的動畫
  const T=TEMPERS[S.temp];
  const low=S.dirt>60||S.life<40||!!S.over||frailSym();              // 水髒、虛弱或已消逝：動作變慢、往下沉

  // 1) 被戳後的反應優先
  if(M){
    if(t>M.until){M=null;C.next=0}                        // 反應結束，馬上重新決定要去哪
    else{C.next=t+200;POKE[M.k].tick(M)}
  }
  // 2) 沒有反應時：先看個性有沒有特別想去的地方（領地、泡泡），否則隨機漫遊
  if(!M){
    const s=(!low)&&(dashSteer(C,t)||judgeSteer(t)||loveySteer(t)||steer(C,t,T)||socialSteer(C,t));
    if(s){C.tx=s[0];C.ty=s[1];C.steering=true}
    else{
      if(C.steering){C.steering=false;C.next=0}
      if(t>C.next&&!(!low&&!S.over&&socialPick(C,t)))wander(C,t,S.over?0:low?.2:T.speed,low);
    }
  }
  // 太餓：每 20 秒冒一次刀叉泡泡
  if(S.sat<=35&&!S.over&&t-(C.lastFood||0)>20000){C.lastFood=t;emote('food')}
  // 3) 真正移動
  const hit=moveBody(C,t,dt,!!S.over);
  if(hit)bounce=Math.max(bounce,.5);                      // 撞牆時身體彈一下
}

// ---------- 姿勢選擇（每約 0.26 秒換一次）----------
function pickPose(t){
  const f=(t%440<220?'a':'b');                           // 兩格輪流，做出擺動感
  const T=TEMPERS[S.temp];
  if(M)return POKE[M.k].pose(M,f);                       // 被戳的反應
  if(EM&&t-EM.t<1800){                                   // 表情氣泡出現時配合動作
    if(EM.type==='heart')return 'reach_'+(t%400<200?'a':'b');
    if(EM.type==='x')return 'curl';
    return 'open_'+(t%500<250?'a':'b');
  }
  if(LV.on&&hasTag('lovey'))return 'open_'+f;            // 人類愛好者停下來看你
  if(S.over||S.life<40||S.dirt>60||S.sat<=20||frailSym())return 'droop';   // 不舒服
  const spd=Math.hypot(C.vx,C.vy);
  if(spd>.6)return 'flat_'+f;                            // 游動中
  if(C.y>=300&&spd<.35)return 'rest';                    // 貼在底部休息
  // 害羞（信賴低）或頑固（在自己的角落）偶爾縮起來
  if(((T.shyPose&&S.trust<35)||T.territory)&&Math.floor(t/5000)%3===0)return 'curl';
  if(S.trust>50&&Math.floor(t/6000)%3===0)return 'reach_'+f;   // 信賴高：偶爾揮手
  return IDLE_CYCLE[Math.floor(t/450)%IDLE_CYCLE.length];
}

// ---------- 被戳的反應表 ----------
// 每種反應有三個函式：
//   start(t,x,y)  開始時做的事（設定 M、表情氣泡、訊息）。x,y 是戳的位置。
//   tick(m)       反應進行中，每一格要做的事（通常是設定要游去哪）。
//   pose(m,f)     這段期間用哪個姿勢。f 是 'a' 或 'b'（輪流切換）。
// 個性用 TEMPERS[...].poke 指名要用哪一種；新增反應就在這裡加一項。
const clampN=(v,a,b)=>Math.max(a,Math.min(b,v));
function goTo(m,speed){const v=aim(C,m,speed);C.tx=v[0];C.ty=v[1];m.near=dist(C,m)<40}
const POKE={
  // 信賴太低：嚇一跳，往反方向退開（所有個性都一樣）
  flee:{
    start(t,x,y){
      const away=Math.atan2(C.y-y,C.x-x);
      M={k:'flee',until:t+2200};
      C.tx=Math.cos(away)*2.2;C.ty=Math.sin(away)*1.2;C.vx=C.tx;C.vy=C.ty;
      emote('ex');say(TEXT.poke.flee);
    },
    tick(){},
    pose(m,f){return 'flat_'+f}
  },
  // 黏人：游過來貼著你戳的地方
  come:{
    start(t,x,y){
      M={k:'come',until:t+3000,x:clampN(x,60,WALL.r-20),y:clampN(y,60,300)};
      emote(S.trust>=40?'heart':'q');say(TEXT.poke.come);
    },
    tick(m){goTo(m,1)},
    pose(m,f){return m.near?'reach_'+f:'flat_'+f}
  },
  // 害羞：縮成一團，躲到最近的底部角落
  hide:{
    start(t){
      M={k:'hide',until:t+5000,x:C.x<WORLD.w/2?WALL.l+12:WALL.r-12,y:306};
      emote('q');say(TEXT.poke.hide);
    },
    tick(m){goTo(m,1.4)},
    pose(){return 'curl'}
  },
  // 好奇：停在原地，朝你揮觸肢
  wave:{
    start(t){M={k:'wave',until:t+2200};emote('ex');say(TEXT.poke.wave)},
    tick(){C.tx=0;C.ty=0},
    pose(m,f){return 'reach_'+f}
  },
  // 頑固：背過身去，慢慢游回自己的角落
  turn:{
    start(t){
      M={k:'turn',until:t+3500,x:C.home.x,y:C.home.y};
      emote('x');say(TEXT.poke.turn);
    },
    tick(m){goTo(m,.7)},
    pose(){return 'curl'}
  },
  // 睏睏：慢吞吞地伸展觸肢，然後又睡回去
  stretch:{
    start(t){M={k:'stretch',until:t+3200};emote('q');say(TEXT.poke.stretch)},
    tick(){C.tx=0;C.ty=0},
    pose(m,f){return 'reach_'+f}
  },
  // 喜歡觸碰（標籤）：不退開，伸出觸肢碰你戳的地方
  touch:{
    start(t,x,y){
      M={k:'touch',until:t+2500,x:clampN(x,60,WALL.r-20),y:clampN(y,60,300)};
      emote('heart');say(TEXT.poke.touch);
    },
    tick(m){goTo(m,.5)},
    pose(m,f){return 'reach_'+f}
  },
  // 活潑：原地轉好幾圈
  spin:{
    start(t){
      M={k:'spin',until:t+1800};
      C.rv=(Math.random()<.5?-1:1)*.5;                    // 給一個很大的轉速，它會自己慢慢停下來
      emote('star');say(TEXT.poke.spin);
    },
    tick(){C.tx=0;C.ty=0},
    pose(m,f){return 'flat_'+f}
  }
};

function poke(x,y){
  const t=performance.now();
  if(SN||t-C.lastPoke<500)return;                        // 戳太快不算；溜出去的時候戳不到
  C.lastPoke=t;pokes=pokes.filter(v=>t-v<10000);pokes.push(t);bounce=1;
  const touchy=hasTag('touchy');
  if(pokes.length>=(touchy?9:6)){                        // 喜歡觸碰的小球比較不容易煩                                   // 10 秒內戳 6 次：煩躁，扣一點信賴
    S.trust=clamp(S.trust-2);emote('x');say(TEXT.poke.tooMany,'bad');pokes=[];refresh();return;
  }
  let kind=S.trust<=25?'flee':TEMPERS[S.temp].poke;      // 信賴太低一律先退開
  if((touchy||hasTag('homereturn'))&&['flee','hide','turn'].includes(kind))kind='touch';   // 喜歡觸碰、回歸者：不會躲開
  const before=[...S.tagsFound];
  POKE[kind].start(t,x,y);
  if(touchy){
    if(S.touchGain<3){S.touchGain++;S.trust=clamp(S.trust+1);refresh()}   // 每天最多 3 次小幅加信賴
    discoverTag('touchy');
  }
  tagReact('poke',{},before,.5);
  if(S.grete&&S.trans){const vl=voiceLine();say(vl,vl===TEXT.grete.nothing?'ev':'voice');if(VOICE_FOUND){const id=VOICE_FOUND;VOICE_FOUND=null;discoverTag(id)}}                // 格蕾特的翻譯：心聲
}

// 點擊或觸碰幼體本身才算「戳」
cv.addEventListener('pointerdown',e=>{
  if(!S||S.over)return;
  const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)*WORLD.w/r.width,y=(e.clientY-r.top)*500/r.height;
  if(PV){pvPoke(x,y);return}
  if(Math.abs(x-C.x)<52&&Math.abs(y-((C.dy||C.y)-6))<52)poke(x,y);
});
// 記下游標在水缸上的位置（人類愛好者會追）
cv.addEventListener('pointermove',e=>{
  const r=cv.getBoundingClientRect();CUR.x=(e.clientX-r.left)*WORLD.w/r.width;CUR.y=(e.clientY-r.top)*500/r.height;CUR.t=performance.now();
});
cv.style.cursor='pointer';
