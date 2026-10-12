// ===== 互動玩耍（玩耍方式＝「遊玩」時，選了玩具就在水缸裡真的玩一場）=====
// 數值效果和「精簡」一樣（js/actions.js 的 actPlay 先算信賴），這裡只負責水缸裡的表演，玩完自動結束。文字在 TEXT.game。
//   wand   指揮棒：所有小球追著游標（或手指）游，第一個碰到的冒小皇冠
//   bubble 氣泡棒：游標劃過的地方冒出一串泡泡，被泡泡氣流捲到的小球轉圈圈、冒音符
//   bell   小鈴鐺：點一個發光的地方（裝飾或水草）把鈴鐺藏起來，小球們各自去猜，猜中的冒小皇冠
//   bucket 小水桶：點水缸下半部的石頭地放水桶（item_bucket），小球們搶著躲進去；第一個躲進去的被倒蓋的水桶（item_bucket_2）罩住，抖一抖、水桶消失，冒小皇冠
//   ball   軟球：只有一隻（日常＝這一輪養的小球；觀察水缸＝隨機挑一隻，喜歡軟球的優先），用頭頂球，頂 4～5 下冒音符、3 下沒反應、1～2 下懊惱（漩渦）
// 喜好（gameLikes）：喜歡的照上面玩；不喜歡的——指揮棒追得慢、碰到也懊惱；氣泡棒被捲到懊惱；小鈴鐺找到了也「……」；軟球只意思意思頂一下
// 觀察水缸（PV）也能玩：沒有養的那隻（C），只有同伴。
// 對外：gameStart(玩具) 開始｜gameStop() 中止｜gameSteer(身體,t) 給移動程式用｜gameStep(t)、gameDraw(t) 每一格
let GAME=null;
const GAME_RULE={grace:1500,wandTime:9000,bucketTime:9000,bucketPlaceMax:15000,bubbleTime:9000,bellHideMax:20000,bellSeekMax:7000,linger:1600};
const gameName=o=>nm(o===C?S.name:o.name);
const gameBodies=()=>[...(S&&!S.over&&!SN&&!PV?[C]:[]),...GUESTS.filter(g=>g.phase==='live')];
const gameSpeed=o=>.9+TEMPERS[o===C?S.temp:o.e.temp].speed*.6;
const gameSay=(s,cls)=>say(s.replace(/幼體/g,GAME&&GAME.who?gameName(GAME.who):nm(S.name)),cls||'ev');   // 文字裡的「幼體」＝玩的那隻
// 這隻喜不喜歡這個玩具：最喜歡的玩具（養的那隻 S.pref.toy；同伴 e.pt）或有「貪玩」標籤＝喜歡。
// 指揮棒、小水桶（商店買的永久道具）不會是「最喜歡的玩具」，改看個性：
//   指揮棒＝黏人、好奇、活潑喜歡追；小水桶＝害羞、頑固、睏睏喜歡躲（剛好相反）
const GAME_LIKE={wand:['clingy','curious','lively'],bucket:['shy','stubborn','sleepy']};
function gameLikes(o,toy){
  const fav=o===C?S.pref.toy:o.e.pt,tags=o===C?S.tags:o.e.own,temp=o===C?S.temp:o.e.temp;
  if(toy===fav||tags.includes('playful'))return true;
  if(GAME_LIKE[toy])return GAME_LIKE[toy].includes(temp);
  return false;
}

function gameStart(toy){
  if(!S||S.over)return;
  const t=performance.now(),G=TEXT.game;
  gameStop();
  if(toy==='wand'){
    GAME={kind:'wand',t0:t,until:t+GAME_RULE.wandTime,meh:new Set()};
    gameSay(G.wand.start,'sys');
  }else if(toy==='bubble'){
    GAME={kind:'bubble',t0:t,until:t+GAME_RULE.bubbleTime,parts:[],last:0,spun:new Map()};
    gameSay(G.bubble.start,'sys');
  }else if(toy==='bell'){
    GAME={kind:'bell',t0:t,until:t+GAME_RULE.bellHideMax,phase:'hide',spots:bellSpots(),hidden:-1,guess:new Map()};
    GAME.tap=bellTap;
    gameSay(G.bell.start,'sys');
  }else if(toy==='bucket'){
    GAME={kind:'bucket',t0:t,until:t+GAME_RULE.bucketPlaceMax,phase:'place',pos:null,meh:new Set(),win:null};
    GAME.tap=bucketTap;
    gameSay(G.bucket.start,'sys');
  }else if(toy==='ball'){
    const all=gameBodies();if(!all.length)return;
    const fans=all.filter(o=>gameLikes(o,'ball')),who=PV?R(fans.length?fans:all):C,like=gameLikes(who,'ball');
    GAME={kind:'ball',t0:t,until:t+20000,who,like,hits:like?1+Math.floor(Math.random()*5):1,n:0,ball:{x:who.x,y:30,vx:0,vy:0},missed:false};
    gameSay(G.ball.start,'sys');
  }else return;
  cv.style.touchAction='none';                          // 手機：在水缸上拖曳不會捲動畫面
}
function gameStop(){GAME=null;cv.style.touchAction=''}
// 結束：寫訊息，留一下下讓氣泡、球停在畫面上
function gameEnd(t,msg){
  if(!GAME||GAME.done)return;
  GAME.done=true;GAME.doneAt=t;GAME.tap=null;
  if(msg)gameSay(msg);
}
// 移動程式（creature.js、guests.js）每一格會問：這隻現在要去哪？（回傳 [tx,ty] 或 null＝照平常）
function gameSteer(o,t){
  if(GAME&&GAME.kind==='bucket'&&GAME.win===o&&GAME.phase==='cover'&&S)return [0,0];   // 被水桶罩住的那隻：不動
  if(!GAME||GAME.done||!S)return null;
  if(GAME.kind==='bucket'&&GAME.phase==='hide')return aim(o,bucketIn(o),gameSpeed(o)*(gameLikes(o,'bucket')?1.4:.35));
  if(GAME.kind==='wand')return aim(o,wandPos(t),gameSpeed(o)*(gameLikes(o,'wand')?1.4:.35));
  if(GAME.kind==='bell'&&GAME.phase==='seek'){
    const sp=GAME.spots[GAME.guess.get(o)];if(!sp)return null;
    return aim(o,{x:sp.x,y:Math.min(floorOf(o),Math.max(WALL.t,sp.y))},gameSpeed(o));
  }
  if(GAME.kind==='ball'&&o===GAME.who&&!GAME.missed)return aim(o,{x:GAME.ball.x,y:250},2.4);
  return null;
}

// ---------- 每一格 ----------
function gameStep(t){
  if(!GAME)return;
  if(GAME.done){if(t-GAME.doneAt>GAME_RULE.linger)gameStop();return}
  if(!S||S.over){gameStop();return}
  const G=TEXT.game;
  if(GAME.kind==='wand'){
    const p=wandPos(t);
    const touch=t-GAME.t0>GAME_RULE.grace?gameBodies().filter(o=>Math.hypot(o.x-p.x,(o===C?(C.dy||C.y):o.y)-p.y)<36):[];
    touch.filter(o=>!gameLikes(o,'wand')&&!GAME.meh.has(o)).forEach(o=>{GAME.meh.add(o);emoteOn(o,'swirl');gameSay(fmt(G.wand.meh,{name:gameName(o)}))});   // 不喜歡：碰到了也懊惱
    const w=touch.find(o=>gameLikes(o,'wand'));
    if(w){emoteOn(w,'crown');gameEnd(t,fmt(G.wand.win,{name:gameName(w)}));return}
    if(t>GAME.until)gameEnd(t,G.wand.none);
  }
  else if(GAME.kind==='bubble'){
    // 游標（手指）最近有動：在那裡冒泡泡
    if(t-CUR.t<150&&t-GAME.last>45&&CUR.y>20&&CUR.y<480){
      GAME.last=t;
      for(let i=0;i<2;i++)GAME.parts.push({x:CUR.x+(Math.random()-.5)*14,y:CUR.y,r:3+Math.random()*6,vx:(Math.random()-.5)*.6,vy:-1.4-Math.random()*1.2});
    }
    GAME.parts.forEach(b=>{b.x+=b.vx;b.y+=b.vy;b.vx*=.98});
    GAME.parts=GAME.parts.filter(b=>b.y>16).slice(-160);
    // 泡泡從身體下面往上衝過去：被氣流捲得轉圈
    gameBodies().forEach(o=>{
      const last=GAME.spun.get(o)||0;if(t-last<1800)return;
      const oy=o===C?(C.dy||C.y):o.y;
      if(GAME.parts.some(b=>Math.abs(b.x-o.x)<34&&b.y<oy+30&&b.y>oy-10)){
        GAME.spun.set(o,t);o.rv+=(Math.random()<.5?-1:1)*.55;o.vy-=.8;
        if(o===C)bounce=1;else o.bn=1;
        const like=gameLikes(o,'bubble');emoteOn(o,like?'note':'swirl');if(!last)gameSay(fmt(like?G.bubble.spin:G.bubble.spinMeh,{name:gameName(o)}));
      }
    });
    if(t>GAME.until)gameEnd(t,G.bubble.end);
  }
  else if(GAME.kind==='bucket'){
    if(GAME.phase==='place'&&t>GAME.until)bucketPlace(WORLD.w/2,380,t);      // 太久沒放：放在中間
    if(GAME.phase==='hide'){
      const touch=gameBodies().filter(o=>{const p=bucketIn(o);return Math.abs(o.x-p.x)<40&&Math.abs(bodyY(o)-p.y)<40});
      touch.filter(o=>!gameLikes(o,'bucket')&&!GAME.meh.has(o)).forEach(o=>{GAME.meh.add(o);emoteOn(o,'swirl');gameSay(fmt(G.bucket.meh,{name:gameName(o)}))});
      const w=touch.find(o=>gameLikes(o,'bucket'));
      if(w){GAME.win=w;GAME.phase='cover';GAME.coverAt=t;GAME.tap=null;return}   // 換成倒蓋的水桶罩住牠
      if(t>GAME.until)gameEnd(t,G.bucket.none);
    }
    if(GAME.phase==='cover'&&t-GAME.coverAt>BUCKET_COVER.lift){             // 抖完：水桶消失，冒小皇冠
      const w=GAME.win;GAME.phase='reveal';emoteOn(w,'crown');gameEnd(t,fmt(G.bucket.win,{name:gameName(w)}));
    }
  }
  else if(GAME.kind==='bell'){
    if(GAME.phase==='hide'&&t>GAME.until)bellHide(Math.floor(Math.random()*GAME.spots.length),t);   // 太久沒選：隨便藏一個
    if(GAME.phase==='seek'){
      const bodies=gameBodies();
      bodies.forEach(o=>{if(!GAME.guess.has(o))GAME.guess.set(o,Math.floor(Math.random()*GAME.spots.length))});
      const arrived=bodies.every(o=>{const sp=GAME.spots[GAME.guess.get(o)];return Math.abs(o.x-sp.x)<34&&Math.abs(o.y-Math.min(floorOf(o),Math.max(WALL.t,sp.y)))<40});
      if(arrived||t>GAME.until){
        const found=bodies.filter(o=>GAME.guess.get(o)===GAME.hidden),win=found.filter(o=>gameLikes(o,'bell')),meh=found.filter(o=>!gameLikes(o,'bell'));
        bodies.forEach(o=>emoteOn(o,win.includes(o)?'crown':meh.includes(o)?'dots':'q'));
        GAME.phase='reveal';
        gameEnd(t,win.length?fmt(G.bell.win,{names:win.map(gameName).join('、')}):meh.length?'':G.bell.lose);
        if(meh.length)gameSay(fmt(G.bell.meh,{names:meh.map(gameName).join('、')}));
      }
    }
  }
  else if(GAME.kind==='ball'){
    const b=GAME.ball,dt=1;
    b.vy+=.14*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.x<WALL.l-10){b.x=WALL.l-10;b.vx=Math.abs(b.vx)}else if(b.x>WALL.r+10){b.x=WALL.r+10;b.vx=-Math.abs(b.vx)}
    const W=GAME.who,hx=W.x,hy=(W===C?(C.dy||C.y):W.y)-40,hop=()=>{if(W===C)bounce=1;else W.bn=1};
    if(!GAME.missed&&b.vy>0&&Math.abs(b.x-hx)<34&&b.y>hy-14&&b.y<hy+12){
      if(GAME.n<GAME.hits){                                  // 頂到了
        GAME.n++;b.vy=-(5.2+Math.random()*1.4);b.vx=(b.x-hx)*.05+(Math.random()-.5)*1.4;hop();
        if(GAME.n>=GAME.hits)GAME.missed=true;                  // 這是最後一下：之後就接不到了
      }
    }
    if(b.y>392){                                             // 掉到沙地上（頂完了，或沒接到）：結束
      b.y=392;
      const n=GAME.n;
      if(!GAME.like){emoteOn(W,'swirl');gameEnd(t,G.ball.dislike);return}
      emoteOn(W,n>=4?'note':n<=2?'swirl':'q');
      gameEnd(t,fmt(G.ball.count,{n})+(n>=4?G.ball.great:n<=2?G.ball.bad:G.ball.meh));
    }
    if(t>GAME.until)gameEnd(t,fmt(G.ball.count,{n:GAME.n}));
  }
}

// ---------- 指揮棒：游標位置（還沒動過就停在水缸中間上方）----------
function wandPos(t){
  const moved=CUR.t>=GAME.t0;
  const x=moved?CUR.x:WORLD.w/2,y=moved?CUR.y:140;
  return {x:Math.max(WALL.l,Math.min(WALL.r,x)),y:Math.max(WALL.t,Math.min(330,y))};
}

// ---------- 小水桶：點一下放下去（放在沙地上方一點），小球要游到桶口 ----------
function bucketTap(x,y){if(GAME&&GAME.phase==='place')bucketPlace(x,y,performance.now())}
// 可以放的範圍：下半部的石頭地（y＝桶底）
const BUCKET_AREA={t:300,b:450},BUCKET_COVER={drop:220,shake:[300,1100],lift:1300};   // 罩住的動畫（毫秒）：落下｜抖動｜消失
const BUCKET_IMG=[new Image(),new Image()];BUCKET_IMG[0].src=assetImg('item_bucket');BUCKET_IMG[1].src=assetImg('item_bucket_2');
const bodyY=o=>o===C?(C.dy||C.y):o.y;
function bucketPlace(x,y,t){
  GAME.pos={x:Math.max(WALL.l+30,Math.min(WALL.r-30,x)),y:Math.max(BUCKET_AREA.t,Math.min(BUCKET_AREA.b,y))};
  GAME.phase='hide';GAME.until=t+GAME_RULE.bucketTime;GAME.tap=null;GAME.t0=t;
  gameSay(TEXT.game.bucket.placed,'sys');
}
const bucketIn=o=>({x:GAME.pos.x,y:Math.min(o?floorOf(o):WALL.b,GAME.pos.y-40)});     // 桶口（小球要游到的地方；石頭地太低時，游到最低處就算）

// ---------- 小鈴鐺：可以藏的地方＝水缸裡顯示中的裝飾＋左右兩叢水草 ----------
function bellSpots(){
  const L=TEXT.game.bell,sp=[];
  META.decor.filter(id=>!META.hidden.includes(id)).forEach(id=>{
    const d=DECOR[id],im=IMG['deco_'+id];
    sp.push({x:d.x+WORLD.dx,y:d.y-((im&&im.height)||40)/2,name:DECOR[id].name});
  });
  const weed=(n,x,yB,label)=>{const im=IMG[n];const w=(im&&im.width||40)*1.5,h=(im&&im.height||80)*1.5;sp.push({x:x+w/2,y:yB-h*.72,name:label})};
  weed('bg_tank_glass_1',22,452,L.weedL);weed('bg_tank_glass_2',416+WORLD.dx*2,456,L.weedR);
  return sp;
}
function bellTap(x,y){
  if(!GAME||GAME.phase!=='hide')return;
  let best=-1,bd=60;
  GAME.spots.forEach((s,i)=>{const d=Math.hypot(s.x-x,s.y-y);if(d<bd){bd=d;best=i}});
  if(best>=0)bellHide(best,performance.now());
}
function bellHide(i,t){
  GAME.hidden=i;GAME.phase='seek';GAME.until=t+GAME_RULE.bellSeekMax;GAME.tap=null;
  gameSay(fmt(TEXT.game.bell.hidden,{spot:GAME.spots[i].name}),'sys');
}

// ---------- 畫面 ----------
const BALL_IMG=new Image();BALL_IMG.src=assetImg('item_ball');
function gameStar(x,y,r,c,al){                          // 像素小星星（指揮棒的光）
  px(x-1,y-r,3,r*2+1,c,al);px(x-r,y-1,r*2+1,3,c,al);px(x-r/2,y-r/2,r,r,c,al*.6);
}
// 畫在小球後面的東西（水桶放好、還沒有人躲進去時）
function gameDrawBack(t){
  if(!GAME||GAME.kind!=='bucket'||GAME.phase!=='hide'||!GAME.pos)return;
  const {x,y}=GAME.pos,im=BUCKET_IMG[0],a=GAME.done?Math.max(0,1-(t-GAME.doneAt)/GAME_RULE.linger):1;
  cx.globalAlpha=a;
  if(im.naturalWidth)cx.drawImage(im,x-50,y-92,100,100);else{cx.fillStyle='#e07a2a';cx.fillRect(x-40,y-70,80,64)}
  cx.globalAlpha=1;
}
const WAND_IMG=new Image();WAND_IMG.src=assetImg('item_wand');
function gameDraw(t){
  if(!GAME)return;
  cx.globalAlpha=1;                                       // 前面畫泡泡時留下的透明度
  const al=GAME.done?Math.max(0,1-(t-GAME.doneAt)/GAME_RULE.linger):1;
  if(GAME.kind==='wand'&&!GAME.done){
    const p=wandPos(t),tw=Math.sin(t/120)*2;
    cx.globalAlpha=.25;cx.fillStyle='#fff7c2';cx.beginPath();cx.arc(p.x,p.y,22+tw,0,PI2);cx.fill();
    cx.globalAlpha=1;
    if(WAND_IMG.naturalWidth)cx.drawImage(WAND_IMG,p.x-15,p.y-15,64,64);           // 指揮棒圖：星星在游標的位置
    else{gameStar(p.x,p.y,10+tw,'#ffe26b',1);gameStar(p.x,p.y,4,'#fff',1)}
    gameStar(p.x+Math.sin(t/90)*12,p.y+Math.cos(t/110)*12,2,'#fff7c2',.8);
  }
  if(GAME.kind==='bubble'){
    cx.lineWidth=2;
    GAME.parts.forEach(b=>{cx.globalAlpha=.7*al;cx.strokeStyle='#e8fbfa';cx.beginPath();cx.arc(b.x,b.y,b.r,0,PI2);cx.stroke();cx.fillStyle='#fff';cx.fillRect(Math.round(b.x-b.r*.5),Math.round(b.y-b.r*.55),2,2)});
    cx.globalAlpha=1;
  }
  if(GAME.kind==='bell'){
    if(GAME.phase==='hide'){
      GAME.spots.forEach(s=>{
        const k=.6+Math.sin(t/220)*.25;
        cx.globalAlpha=.35*k;cx.fillStyle='#ffe26b';cx.beginPath();cx.arc(s.x,s.y,24,0,PI2);cx.fill();
        cx.globalAlpha=1;cx.lineWidth=2;cx.strokeStyle='#ffe26b';cx.beginPath();cx.arc(s.x,s.y,24,0,PI2);cx.stroke();
        cx.font='bold 16px sans-serif';cx.textAlign='center';cx.fillStyle='#fff';cx.fillText('?',s.x,s.y+6);
      });
    }else if(GAME.phase==='reveal'&&GAME.hidden>=0){
      const s=GAME.spots[GAME.hidden];
      cx.globalAlpha=al;cx.fillStyle='#f2c14e';cx.beginPath();cx.arc(s.x,s.y,10,0,PI2);cx.fill();
      cx.fillStyle='#8a5a12';cx.fillRect(s.x-2,s.y+2,4,5);gameStar(s.x+14,s.y-12,5,'#fff7c2',al);
      cx.globalAlpha=1;
    }
  }
  if(GAME.kind==='bucket'){
    if(GAME.phase==='place'){                               // 還沒放：提示可以放的範圍（石頭地）
      cx.globalAlpha=.35+Math.sin(t/220)*.15;cx.strokeStyle='#9fd0ff';cx.lineWidth=2;cx.setLineDash([6,6]);
      cx.strokeRect(WALL.l,BUCKET_AREA.t-60,WALL.r-WALL.l,BUCKET_AREA.b-BUCKET_AREA.t+60);cx.setLineDash([]);cx.globalAlpha=1;
    }else if(GAME.phase==='cover'&&GAME.win){               // 倒蓋的水桶罩住贏的那隻（畫在小球前面）：落下→抖一抖
      const w=GAME.win,e=t-GAME.coverAt,S_=BUCKET_COVER,im=BUCKET_IMG[1];
      const drop=Math.min(1,e/S_.drop),yy=bodyY(w)+44-(1-drop)*(1-drop)*90;
      const sh=e>S_.shake[0]&&e<S_.shake[1]?Math.sin(e/38)*.09:0;
      cx.save();cx.translate(w.x,yy);cx.rotate(sh);
      if(im.naturalWidth)cx.drawImage(im,-60,-112,120,120);else{cx.fillStyle='#e07a2a';cx.fillRect(-46,-100,92,96)}
      cx.restore();
    }
  }
  if(GAME.kind==='ball'){
    const b=GAME.ball;cx.globalAlpha=al;
    if(BALL_IMG.naturalWidth)cx.drawImage(BALL_IMG,b.x-18,b.y-18,36,36);
    else{cx.fillStyle='#ffd1e0';cx.beginPath();cx.arc(b.x,b.y,16,0,PI2);cx.fill()}
    cx.globalAlpha=1;
  }
}
