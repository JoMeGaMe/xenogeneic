// ===== 陸地上的小球（已經可以離水的穩定小球）：商店的行李箱、之後大樓背景等地方共用 =====
// 用法：const L=landStart(canvas,{n:1或2, floor:地面 y, xmin, xmax, look, sc:縮放（預設 1）}); L.poke(x)＝戳離 x 最近的那隻（回傳那隻）；L.stop()
// 動作（每隻自己隨機換）：crawl 爬（往左 idle_a＋flat_a、往右 idle_a＋flat_b，一伸一縮）｜rest 窩著休息（rest）｜wave 揮手（reach_a／reach_b）｜hop 自己跳（open_a 往上、open_b 往下）
// Q彈：身體的壓扁／拉長用彈簧算（落地、被戳、被壓到都會晃幾下才停）。
// 兩隻時：靠太近會互相彈開一點（不會像水裡亂飛）；一隻跳起來落在另一隻頭上，會再彈一次，下面那隻被壓扁一下。
const LAND_RULE={g:.32,hop:5.6,pokeHop:6.4,crawl:.55,push:1.8,bump:2.4,headH:46,near:74,ontop:.45,toward:.6,
  act:{crawl:.45,rest:.25,wave:.18,hop:.12},dur:{crawl:[1800,3600],rest:[2000,4200],wave:[1200,2000],hop:[0,0]}};
function landStart(c,opt){
  const g=c.getContext('2d'),W=c.width,H=c.height,o=Object.assign({n:1,floor:H*.7,xmin:60,xmax:W-60,look:larvaLook({day:1,hue:200,col:'#ffffff'}),sc:1},opt);
  const R_=LAND_RULE,rnd=(a,b)=>a+Math.random()*(b-a);
  const span=o.xmax-o.xmin;
  const list=Array.from({length:o.n},(_,i)=>({x:o.n===1?o.xmin+span/2:o.xmin+span*(i?.72:.28),z:0,vz:0,vx:0,dir:i?-1:1,sq:0,sqv:0,
    act:'rest',until:0,ph:Math.random()*6,bumpAt:0,look:o.look}));
  const pick=(b,t)=>{                                         // 換下一個動作
    let r=Math.random(),a='crawl';
    for(const k in R_.act){r-=R_.act[k];if(r<0){a=k;break}}
    b.act=a;const d=R_.dur[a];b.until=t+rnd(d[0],d[1]);
    if(a==='crawl'){
      const u=list.find(x=>x!==b);
      if(u&&Math.random()<R_.toward)b.dir=u.x>b.x?1:-1;else if(Math.random()<.4)b.dir*=-1;   // 兩隻時：比較常往對方爬過去
    }
    if(a==='hop'){b.vz=R_.hop;b.vx=b.dir*.6;b.sq=.16}       // 起跳前先壓一下
  };
  let raf=0,last=0,alive=true;
  const step=t=>{
    if(!alive||!c.isConnected){alive=false;return}
    const dt=Math.min(3,last?(t-last)/16.7:1);last=t;const tt=t/1000;
    list.forEach(b=>{
      if(!b.until)pick(b,t);
      // 空中
      if(b.z>0||b.vz>0){
        b.z+=b.vz*dt;b.vz-=R_.g*dt;b.x+=b.vx*dt;
        list.forEach(u=>{                                     // 落在別隻頭上：再彈一次，下面那隻被壓扁
          if(u===b||b.vz>0||(b.heads||0)>=2)return;            // 最多在頭上彈兩次（角落不會一直彈）
          if(Math.abs(u.x-b.x)<40&&b.z<u.z+R_.headH&&b.z>u.z+R_.headH-14){b.heads=(b.heads||0)+1;const mid=(o.xmin+o.xmax)/2,away=u.x<mid?1:-1;   // 往空曠的那一邊彈開
          b.z=u.z+R_.headH;b.vz=R_.hop*(b.heads>1?.55:.8);b.vx=away*(b.heads>1?2.6:1.6);b.sqv-=.06;u.sqv+=.14;u.act='rest';u.until=t+900}
        });
        if(b.z<=0){b.z=0;b.vz=0;b.vx=0;b.sqv+=.16;b.heads=0;if(b.act==='hop')b.until=t+300}   // 落地：Q彈
      }else{
        if(t>b.until)pick(b,t);
        if(b.act==='crawl'){const s=Math.max(0,Math.sin(tt*3.2+b.ph));b.x+=b.dir*s*R_.crawl*dt}
        b.x+=b.vx*dt;b.vx*=.86;
      }
      if(b.x<o.xmin){b.x=o.xmin;b.dir=1}else if(b.x>o.xmax){b.x=o.xmax;b.dir=-1}
      // 彈簧（壓扁／拉長）
      b.sqv+=(-.22*b.sq-.14*b.sqv)*dt;b.sq+=b.sqv*dt;
    });
    // 兩隻靠太近：互相彈開一點
    if(list.length>1){
      const [a,b]=list,d=b.x-a.x;
      if(Math.abs(d)<R_.near&&Math.abs(a.z-b.z)<20&&t-a.bumpAt>700&&a.z===0&&b.z===0&&Math.random()<R_.ontop){   // 低機率：其中一隻跳到另一隻頭上
        const [j,u]=Math.random()<.5?[a,b]:[b,a],vz=6.4,tf=(vz+Math.sqrt(vz*vz-2*R_.g*R_.headH))/R_.g;
        j.vz=vz;j.vx=(u.x-j.x)/tf;j.act='hop';j.until=t;j.sq=.16;u.act='rest';u.until=t+tf*17+1200;a.bumpAt=b.bumpAt=t+600;
      }else if(Math.abs(d)<R_.near&&Math.abs(a.z-b.z)<20&&t-a.bumpAt>700){
        const s=d>=0?1:-1;a.vx=-s*R_.push;b.vx=s*R_.push;a.vz=Math.max(a.vz,R_.bump);b.vz=Math.max(b.vz,R_.bump);a.sqv+=.08;b.sqv+=.08;a.bumpAt=b.bumpAt=t;a.dir=-s;b.dir=s;[a,b].forEach(u=>{u.act='crawl';u.until=t+rnd(1200,2200)});   // 彈開後各自往反方向爬走
      }
    }
    // 畫
    g.clearRect(0,0,W,H);g.imageSmoothingEnabled=false;
    [...list].sort((a,b)=>a.z-b.z).forEach(b=>{
      const air=b.z>0||b.vz>0;
      const pose=air?(b.vz>0?'open_a':'open_b'):b.act==='crawl'?(Math.sin(tt*3.2+b.ph)>0?(b.dir<0?'flat_a':'flat_b'):'idle_a'):b.act==='rest'?'rest':b.act==='wave'?(Math.floor(tt*4)%2?'reach_a':'reach_b'):'idle_a';
      const breathe=b.act==='rest'&&!air?Math.sin(tt*2+b.ph)*.025:0;
      g.globalAlpha=.25;g.fillStyle='#000';g.beginPath();g.ellipse(b.x,o.floor+36*o.sc,Math.max(14,30-b.z*.2)*o.sc,6*o.sc,0,0,PI2);g.fill();g.globalAlpha=1;
      drawLarva(g,b.x,o.floor-b.z,(b.act==='crawl'&&!air?b.dir*.06:0)+(air?b.vx*.04:0),Math.max(-.3,Math.min(.35,b.sq+breathe)),pose,b.look,tt,1,o.sc);
    });
    raf=requestAnimationFrame(step);
  };
  raf=requestAnimationFrame(step);
  return {list,
    poke(x){const b=list.reduce((a,u)=>Math.abs(u.x-x)<Math.abs(a.x-x)?u:a);if(b.z<=0){b.vz=R_.pokeHop;b.vx=(Math.random()-.5)*1.2;b.sq=.2}else b.sqv+=.1;b.act='hop';return b},
    stop(){alive=false;cancelAnimationFrame(raf)}};
}
