// 圖鑑同伴：以前養的小球在水缸裡游動、追逐、互撞。只是互動要素，沒有生命與需求。
// 好奇的會追逐別隻，害羞的會躲開，黏人的會跟著你養的那隻。
let GUESTS=[];
const GSPD={clingy:.8,shy:.5,curious:1.2};
function makeGuest(e,fromEdge){
  return {e,name:e.name,x:fromEdge?(Math.random()<.5?40:460):100+Math.random()*300,y:90+Math.random()*200,vx:0,vy:0,
    rot:0,rv:0,bn:0,next:0,mode:'wander',mu:0,wx:0,wy:0,p:'idle_a',pt:0,look:larvaLook(e)};
}
// 依圖鑑勾選同步水缸裡的同伴：新勾的會游進來，取消勾選的會離開（開新周目與每次換日時呼叫）
function syncGuests(announce){
  const want=guestEntries();
  GUESTS.filter(g=>!want.some(e=>e.id===g.e.id)).forEach(g=>{if(announce)say(`${g.name} 游走了，回到圖鑑裡。`)});
  GUESTS=GUESTS.filter(g=>want.some(e=>e.id===g.e.id));
  want.forEach(e=>{if(!GUESTS.some(g=>g.e.id===e.id)){GUESTS.push(makeGuest(e,announce));if(announce)say(`${e.name} 游進了水缸，想跟幼體一起玩。`,'ev')}});
}
function nearest(g){
  let best=null,bd=1e9;
  [C,...GUESTS].forEach(o=>{if(o===g)return;const d=Math.hypot(o.x-g.x,o.y-g.y);if(d<bd){bd=d;best=o}});
  return {o:best,d:bd};
}
function stepGuests(t){
  const dt=Math.min(3,(t-(stepGuests.last||t))/16.7);stepGuests.last=t;
  GUESTS.forEach(g=>{
    const sp=GSPD[g.e.temp],n=nearest(g);
    if(t>g.next){                                   // 每隔一陣子決定下一個行動
      const r=Math.random();g.next=t+1500+Math.random()*2500;
      if(g.e.temp==='curious'&&r<.6&&n.d<320){g.mode='chase';g.mu=t+2500}
      else if(g.e.temp==='clingy'&&r<.6){g.mode='follow';g.mu=t+3500}
      else{g.mode='wander';const a=Math.random()*PI2,k=Math.random()<.6?1:.3;g.wx=Math.cos(a)*sp*k;g.wy=Math.sin(a)*sp*k*.6}
    }
    let tx=g.wx,ty=g.wy;
    const go=(o,s)=>{const dx=o.x-g.x,dy=o.y-g.y,d=Math.hypot(dx,dy)||1;tx=dx/d*s;ty=dy/d*s};
    if(g.e.temp==='shy'&&n.d<170)go(n.o,-1.1);
    else if(g.mode==='chase'&&t<g.mu)go(n.o,1.1);
    else if(g.mode==='follow'&&t<g.mu){if(Math.hypot(C.x-g.x,C.y-g.y)>130)go(C,.8);else{tx=0;ty=0}}
    g.vx+=(tx-g.vx)*.03*dt;g.vy+=(ty-g.vy)*.03*dt;
    g.x+=g.vx*dt;g.y+=g.vy*dt;
    let hit=0;                                      // 撞牆反彈
    if(g.x<40){g.x=40;g.vx=Math.abs(g.vx)+.25;hit=-1}else if(g.x>460){g.x=460;g.vx=-Math.abs(g.vx)-.25;hit=1}
    if(g.y<48){g.y=48;g.vy=Math.abs(g.vy)+.15;hit=hit||.6}else if(g.y>308){g.y=308;g.vy=-Math.abs(g.vy)*.5;hit=hit||-.6}
    if(hit){g.rv=hit*(.08+Math.random()*.08);g.bn=Math.max(g.bn,.5)}
    const lean=Math.max(-.3,Math.min(.3,g.vx*.25)),diff=((lean-g.rot+Math.PI*3)%PI2)-Math.PI;
    g.rv+=diff*.004*dt;g.rv*=Math.pow(.97,dt);g.rot+=g.rv*dt;g.bn*=.96;
  });
  collide();
}
// 互相碰撞：分開、彈開、各自轉一下、身體彈一下
function collide(){
  const all=(S&&S.over)?GUESTS:[C,...GUESTS],R2=68;
  for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){
    const a=all[i],b=all[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
    if(d>=R2||d===0)continue;
    const nx=dx/d,ny=dy/d,ov=(R2-d)/2;
    a.x-=nx*ov;a.y-=ny*ov;b.x+=nx*ov;b.y+=ny*ov;
    const vn=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
    if(vn<0){a.vx+=vn*nx;a.vy+=vn*ny;b.vx-=vn*nx;b.vy-=vn*ny}
    a.vx-=nx*.6;a.vy-=ny*.6;b.vx+=nx*.6;b.vy+=ny*.6;
    a.rv-=.14;b.rv+=.14;
    [a,b].forEach(o=>{if(o===C){bounce=Math.max(bounce,.7);C.tx=C.vx*.6;C.ty=C.vy*.6}else o.bn=.7});
  }
}
function drawGuests(t,tt){
  GUESTS.forEach((g,i)=>{
    if(t-g.pt>260){
      g.p=Math.hypot(g.vx,g.vy)>.6?'flat_'+(t%440<220?'a':'b'):['idle_a','idle_b','idle_a','open_a','open_b','open_a','close','idle_b'][Math.floor(t/450+i*3)%8];
      g.pt=t;
    }
    const dy=g.y+Math.sin(tt*.9+i)*5-g.bn*Math.abs(Math.sin(tt*9))*14,sq=Math.sin(tt*2+i)*.03+g.bn*Math.sin(tt*13)*.08;
    cx.globalAlpha=.2;cx.fillStyle='#000';cx.beginPath();cx.ellipse(g.x,342,26,7,0,0,PI2);cx.fill();
    drawLarva(cx,g.x,dy,g.rot,sq,g.p,g.look,tt+i*1.3,.95,.9);
    cx.globalAlpha=1;cx.font='bold 13px sans-serif';cx.textAlign='center';cx.lineWidth=3;
    cx.strokeStyle='rgba(8,26,36,.8)';cx.strokeText(g.name,g.x,dy+58);cx.fillStyle='#e6f6f2';cx.fillText(g.name,g.x,dy+58);
  });
}
