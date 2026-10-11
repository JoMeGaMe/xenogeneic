// 每一格畫面的繪製：背景、水草、泡泡、幼體、核心、氣泡。
const BUB=Array.from({length:10},(_,i)=>({x:30+i*47+(i%3)*9,y:60+(i*83)%280,r:3+(i*5)%6,sp:.4+(i%4)*.25,ph:i*1.7}));
function plant(n,x,yBottom,sc,t,ph){
  const im=IMG[n];if(!im.naturalWidth)return;
  const w=im.width,h=im.height,sl=2;
  for(let y=0;y<h;y+=sl){
    const k=(h-y)/h,off=Math.sin(t/1100+ph)*10*k*k;
    cx.drawImage(im,0,y,w,sl,Math.round(x+off),Math.round(yBottom-(h-y)*sc),w*sc,sl*sc+1);
  }
}
function draw(t){
  requestAnimationFrame(draw);
  const W=WORLD.w,H=500;
  cx.globalAlpha=1;
  if(nLoaded<IMGN.length||!S){cx.fillStyle='#0f3a4c';cx.fillRect(0,0,W,H);if(IMG.bg_tank.naturalWidth)cx.drawImage(IMG.bg_tank,0,0,W,H);return}
  const bg=(W>500&&IMG.bg_preview&&IMG.bg_preview.naturalWidth)?IMG.bg_preview:IMG.bg_tank;   // 預覽模式專用背景（assets/larva/bg_preview.png，750×500）；沒有就把一般背景拉寬
  cx.drawImage(bg,0,0,W,H);
  if(!PV)step(t);
  stepGuests(t);
  const tt=t/1000;
  bounce*=0.96;
  if(S.over==='END-07')dead=Math.min(1,dead+.004);else dead=0;
  const a=1-dead;
  // 水草（程式擺動）
  plant('bg_tank_glass_1',22,452,1.5,t,0);
  plant('bg_tank_glass_2',416+WORLD.dx*2,456,1.5,t,2);
  cx.globalAlpha=1;
  META.decor.filter(id=>!META.hidden.includes(id)).forEach(id=>{const d=DECOR[id],im=IMG['deco_'+id];if(d&&im.naturalWidth)cx.drawImage(im,Math.round(d.x+WORLD.dx-im.width/2),Math.round(d.y-im.height))});
  drawGuests(t,tt);
  if(!PV){
  // 影子
  const drawY=C.y+Math.sin(tt*.9)*5-bounce*Math.abs(Math.sin(tt*9))*14;C.dy=drawY;
  const sw=Math.min(64,Math.max(34,64-(318-C.y)*.12));
  cx.globalAlpha=.22*a;cx.fillStyle='#000';cx.beginPath();cx.ellipse(C.x,Math.max(342,C.y+38),sw/2,8,0,0,PI2);cx.fill();cx.globalAlpha=1;
  // 姿勢
  if(t-C.pt>260||(EM&&t-EM.t<120)){C.p=pickPose(t);C.pt=t}
  const sq=Math.sin(tt*2)*.03+bounce*Math.sin(tt*13)*.08,look=larvaLook(S);
  drawLarva(cx,C.x,drawY,C.rot,sq,C.p,look,tt,a*(frailSym()?.72:1),1);   // 虛弱徵兆：身體更透明
  // 彩色小光點
  if(S.colored)for(let i=0;i<4;i++){
    const sx=C.x+Math.cos(tt+i*1.6)*70,sy=drawY+Math.sin(tt*1.3+i*1.6)*60,on=Math.sin(tt*4+i)>0?1:0;
    const sc=(look.core[0]*.3+look.core[1]*.59+look.core[2]*.11)<64?'#fff':S.col;px(sx-1,sy-5,3,11,sc,.9*on);px(sx-5,sy-1,11,3,sc,.9*on);
  }
  }
  // 泡泡（程式）
  cx.lineWidth=2;
  BUB.forEach(b=>{
    b.y-=b.sp;if(b.y<30){b.y=330+Math.random()*30;b.x=30+Math.random()*(W-60)}
    const x=b.x+Math.sin(tt*1.2+b.ph)*6;
    cx.globalAlpha=.55;cx.strokeStyle='#e8fbfa';cx.beginPath();cx.arc(x,b.y,b.r,0,PI2);cx.stroke();
    cx.fillStyle='#fff';cx.fillRect(Math.round(x-b.r*.5),Math.round(b.y-b.r*.55),2,2);
  });
  // 水質色調
  cx.globalAlpha=Math.min(.45,S.dirt/260);cx.fillStyle='#6b8e3a';cx.fillRect(0,0,W,H);
  if(Math.abs(S.ph-7)>1.2){cx.globalAlpha=.12;cx.fillStyle=S.ph>7?'#ffd37a':'#d77aff';cx.fillRect(0,0,W,H)}
  cx.globalAlpha=1;
  if(!PV)drawEmote(t,C.x,C.dy-46);
}
requestAnimationFrame(draw);
