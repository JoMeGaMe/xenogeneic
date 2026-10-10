// 幼體的游動、撞牆旋轉、姿勢選擇、被戳的反應。
// ---- 游動（撞牆反彈＋整隻旋轉）----
const C={x:250,y:180,vx:1,vy:.15,tx:1,ty:0,rot:0,rv:0,face:1,next:0,last:0,p:'idle_a',pt:0};
const PI2=Math.PI*2;
function step(t){
  const dt=Math.min(3,(t-(C.last||t))/16.7);C.last=t;
  const low=S.dirt>60||S.life<40||S.over;
  if(M){
    if(t>M.until){M=null;C.next=0}
    else{
      C.next=t+200;
      if(M.k==='hide'||M.k==='come'){
        const dx=M.tx-C.x,dy=M.ty-C.y,d=Math.hypot(dx,dy),sp=M.k==='hide'?1.4:1;
        M.near=d<40;
        if(d>8){C.tx=dx/d*sp;C.ty=dy/d*sp}else{C.tx=0;C.ty=0}
      }else if(M.k==='wave'){C.tx=0;C.ty=0}
    }
  }
  if(t>C.next){
    const sp=S.over?0:low?.2:S.temp==='curious'?1.2:S.temp==='shy'?.5:.8;
    const a=Math.random()*PI2,k=Math.random()<.6?1:.3;
    C.tx=Math.cos(a)*sp*k;C.ty=Math.sin(a)*sp*k*.6+(low?.15:0);
    C.next=t+1500+Math.random()*2500;
  }
  C.vx+=(C.tx-C.vx)*.03*dt;C.vy+=(C.ty-C.vy)*.03*dt;
  C.x+=C.vx*dt;C.y+=C.vy*dt;
  let hit=0;
  if(C.x<40){C.x=40;C.vx=Math.abs(C.vx)+.25;C.tx=Math.abs(C.tx);hit=-1}
  if(C.x>460){C.x=460;C.vx=-Math.abs(C.vx)-.25;C.tx=-Math.abs(C.tx);hit=1}
  if(C.y<48){C.y=48;C.vy=Math.abs(C.vy)+.15;C.ty=Math.abs(C.ty);hit=hit||.6}
  if(C.y>308){C.y=308;C.vy=-Math.abs(C.vy)*.5;C.ty=-Math.abs(C.ty)*.5;hit=hit||-.6}
  if(hit&&!S.over){C.rv=hit*(.08+Math.random()*.08);bounce=Math.max(bounce,.5)}
  const lean=Math.max(-.3,Math.min(.3,C.vx*.25))+Math.sin(t/900)*.05;
  const diff=((lean-C.rot+Math.PI*3)%PI2)-Math.PI;
  C.rv+=diff*.004*dt;C.rv*=Math.pow(.97,dt);C.rot+=C.rv*dt;
}
function pickPose(t){
  if(M){
    const f=(t%440<220?'a':'b');
    if(M.k==='hide')return 'curl';
    if(M.k==='flee')return 'flat_'+f;
    if(M.k==='wave'||(M.k==='come'&&M.near))return 'reach_'+f;
    if(M.k==='come')return 'flat_'+f;
  }
  if(EM&&t-EM.t<1800){
    if(EM.type==='heart')return 'reach_'+(t%400<200?'a':'b');
    if(EM.type==='x')return 'curl';
    return 'open_'+(t%500<250?'a':'b');
  }
  if(S.over||S.life<40||S.dirt>60||S.sat<=20)return 'droop';
  const spd=Math.hypot(C.vx,C.vy);
  if(spd>.6)return 'flat_'+(t%440<220?'a':'b');
  if(C.y>=300&&spd<.35)return 'rest';
  if(S.temp==='shy'&&S.trust<35&&Math.floor(t/5000)%3===0)return 'curl';
  if(S.trust>50&&Math.floor(t/6000)%3===0)return 'reach_'+(t%500<250?'a':'b');
  return ['idle_a','idle_b','idle_a','open_a','open_b','open_a','close','idle_b'][Math.floor(t/450)%8];
}
let M=null,pokes=[];
function poke(x,y){
  const t=performance.now();
  if(t-(C.lastPoke||0)<500)return;
  C.lastPoke=t;pokes=pokes.filter(v=>t-v<10000);pokes.push(t);bounce=1;
  if(pokes.length>=6){S.trust=clamp(S.trust-2);emote('x');say('被戳太多次了，幼體有點煩躁。','bad');pokes=[];refresh();return}
  const away=Math.atan2(C.y-y,C.x-x);
  if(S.trust<=25){
    M={k:'flee',until:t+2200};C.tx=Math.cos(away)*2.2;C.ty=Math.sin(away)*1.2;C.vx=C.tx;C.vy=C.ty;
    emote('ex');say('幼體嚇了一跳，警戒地退開。');
  }else if(S.temp==='shy'){
    M={k:'hide',until:t+5000,tx:C.x<250?52:448,ty:306};emote('q');say('幼體縮成一小團，躲到角落去了。');
  }else if(S.temp==='curious'){
    M={k:'wave',until:t+2200};emote('ex');say('幼體停下來，好奇地朝你揮了揮觸肢。');
  }else{
    M={k:'come',until:t+3000,tx:Math.max(60,Math.min(440,x)),ty:Math.max(60,Math.min(300,y))};
    emote(S.trust>=40?'heart':'q');say('幼體游過來，貼著你戳的地方。');
  }
}
cv.addEventListener('pointerdown',e=>{
  if(!S||S.over)return;
  const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)*500/r.width,y=(e.clientY-r.top)*500/r.height;
  if(Math.abs(x-C.x)<52&&Math.abs(y-((C.dy||C.y)-6))<52)poke(x,y);
});
cv.style.cursor='pointer';
