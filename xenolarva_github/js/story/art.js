// ===== 主線 art.js：圖：背景、人物圖、紙娃娃、小球、讀圖 =====
// 主線的程式拆成 js/story/*.js（v0.40.34），照 index.html 的順序載入，全部是全域變數。

// ---------- 圖 ----------
// 大背景：有大圖（assets/bg_hd）就用大圖。單檔預覽版裡只有小圖；預覽頁另外放了 bg_hd 檔案時（v0.40.15），開頭試讀一張成功就改用大圖
let ST_HD=typeof ASSETS==='undefined'||!Object.keys(ASSETS).length;   // GitHub 版（ASSETS 空的）一定有大圖：不用開頭試讀（v0.40.69：省 394KB）
if(!ST_HD){const t=new Image();t.onload=()=>{ST_HD=true;if($('ovStory').classList.contains('show'))stRender()};t.src=assetPath('home_night',true)}
const stBg=(k,hd)=>{const p=hd&&ST_HD&&assetPath(k,true);return p&&p.includes('bg_hd')?p:(typeof ASSETS!=='undefined'&&ASSETS[k])||assetPath(k,hd)};
let ST_PRE=[];   // 先讀好的圖（留著參考，瀏覽器才不會丟掉）
// 行程會用到的大背景先在背景讀（v0.41.0：一次讀一張、劇情在「讀取中」時先停，不和眼前要用的圖搶網路；不強制解碼，省記憶體）
function stPreload(){if(ST_PRE.length)return;
  const ks=[...new Set([...Object.values(STORY_HOME),...Object.values(STORY_CMDS).map(c=>c.big).filter(Boolean)])];ST_PRE.push(null);
  const next=()=>{if(!ks.length)return;if(SUI.loading){setTimeout(next,500);return}
    const im=new Image();im.onload=im.onerror=()=>setTimeout(next,50);im.src=stBg(ks.shift(),true);ST_PRE.push(im)};
  setTimeout(next,1500)}
const stNpcImg=id=>STORY_NPC[id].img?assetImg(STORY_NPC[id].img):'';
// 小頭像：有頭像圖（xiaojun_face）就用，沒有就用立繪裁上半（class 不同）
// 面向右的版本：新格式的立繪（人物_L_表情）都有對應的 _R_
// 執行時遇到的人：面向右；配件看在不在大樓裡（STORY_NPC.acc）
const stNpcChr=(id,inside)=>{const N=STORY_NPC[id],a=N.acc==='in'?inside:N.acc==='out'?!inside:N.acc==='always';return stFaceR(N.img)+(a?'+acc':'')};
const stFaceR=k=>String(k).replace(/_L_(?=[^_]+$)/,'_R_');
const stFaceL=k=>String(k).replace(/_R_(?=[^_]+$)/,'_L_');
const stIsLarva=k=>!!k&&String(k).startsWith('larva');   // 立繪格放小球：larva 或 larva:姿勢（curl 縮著…）
const stNpcAva=id=>{const N=STORY_NPC[id];return N.face?`<img class="fc" alt="" src="${assetImg(N.face)}">`:N.img?`<img alt="" src="${assetImg(N.img)}">`:''};
let STORY_DOLL={},ST_DOLL_OK=false;     // 紙娃娃每種表情畫一次就記住（白邊很花時間）
// 讀紙娃娃（v0.41.0）：先讀身上穿的部件（畫玩家），好了就畫；其他部件（衣櫃縮圖、服飾店試穿）接著在背景讀，讀好再重畫一次
function stDollLoad(){return dollLoad(META.doll).then(()=>{ST_DOLL_OK=true;STORY_DOLL={};stRender();
  dollLoad().then(()=>{STORY_DOLL={};if($('ovStory').classList.contains('show'))stRender()})})}
function stDollCv(emo){
  if(STORY_DOLL[emo||''])return STORY_DOLL[emo||''];
  const c=document.createElement('canvas');c.width=DOLL_W*DOLL_K;c.height=DOLL_H*DOLL_K;
  if(!META.doll||!ST_DOLL_OK)return c;   // 圖還沒讀好：先空白，讀好後會重畫
  dollPaint(c,META.doll,emo||'');
  return STORY_DOLL[emo||'']=c;
}
// 特殊小球：照剛來的小球（第 1 天：身體、核心白色）、不畫反光、加傷疤
const ST_LOOK={core:[255,255,255],body:[255,255,255],body2:null,bm:'',soft:true,ca:.65,wear:'',wcol:'',noHl:true,scar:1};
// 路人小球：data-look＝「身體 r,g,b｜核心 r,g,b」（js/story/week.js 的 stLarvaCol），一般的小球（有反光、沒有傷疤）
const stPassLook=s=>{const [b,c]=String(s).split('|').map(x=>x.split(',').map(Number));return {core:c,body:b,body2:null,bm:'',soft:true,ca:.85,wear:'',wcol:'',noHl:false,scar:0}};
const stCodexLook=id=>{const e=typeof findLarva==='function'&&findLarva(id);return e?larvaLook(e):ST_LOOK};   // 日常模式養的小球（圖鑑）：照牠的樣子（含裝扮）
function stPaint(root){
  if(ST_DOLL_OK)wardPaint(root);   // 衣櫃的縮圖
  root.querySelectorAll('[data-pname]').forEach(el=>paintName(el,META.pcol||''));   // 名牌照代表色
  root.querySelectorAll('canvas.sdoll[data-try]').forEach(c=>{if(ST_DOLL_OK)dollPaint(c,stTryDoll(),'')});   // 服飾店：玩家穿著試穿的衣物（v0.40.65）
  root.querySelectorAll('canvas.sdoll:not([data-try])').forEach(c=>{const g=c.getContext('2d'),s=stDollCv(c.dataset.emo);g.clearRect(0,0,c.width,c.height);
    if(c.dataset.crop){const k=s.width/DOLL_W/2,[x,y,w]=DOLL_HEAD;g.drawImage(s,x*k,y*k,w*k,w*k,0,0,c.width,c.height)}else g.drawImage(s,0,0,c.width,c.height)});
  root.querySelectorAll('canvas.slarva').forEach(c=>{const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);drawLarva(g,c.width/2,c.width*44/96,0,0,c.dataset.pose||'curl',c.dataset.cid?stCodexLook(c.dataset.cid):c.dataset.look?stPassLook(c.dataset.look):ST_LOOK,performance.now()/1000,1,c.width/96)});
}


// ---------- 水缸的小球（v0.40.35）：照狀態動（stTankMood：sleep 睡著｜scared 縮著發抖｜calm 慢慢漂｜close 游來游去）----------
//   點水缸：sleep／scared／calm＝躲起來（淡出、縮到角落，3 秒後慢慢出來）｜close＝游到玻璃前、伸手
let ST_TANK_RAF=0;
function stTankLoop(){if(ST_TANK_RAF)return;
  const step=()=>{const c=document.querySelector('#ovStory canvas.stanklv');if(!c||!STY){ST_TANK_RAF=0;return}
    const t=performance.now()/1000,m=stTankMood(),P=SUI.tankPoke,pt=P?performance.now()-P.t:1e9;
    // 平常的位置（%）、姿勢、旋轉
    let x,y,pose,rot=0,sq=0,a=1,sc=1;
    if(m==='sleep'){x=22;y=74;pose='rest';sq=Math.sin(t*1.2)*.03}
    else if(m==='scared'){x=18+Math.sin(t*37)*.35;y=76;pose='curl';sq=.02+Math.sin(t*9)*.015}
    else if(m==='calm'){x=36+16*Math.sin(t*.23);y=58+7*Math.sin(t*.61);pose='idle_a';rot=Math.sin(t*.5)*.08}
    else{x=50+30*Math.sin(t*.37);y=46+16*Math.sin(t*.71+1);pose=Math.sin(t*1.3)>.6?'open_a':'idle_a';rot=Math.cos(t*.37)*.12}
    if(P&&pt<4000){const k=P.k;
      if(k==='hide'){   // 0～0.5 秒縮到角落淡出｜躲著｜3～4 秒慢慢出來
        const out=Math.min(1,pt/500),back=pt>3000?(pt-3000)/1000:0,v=out*(1-back);
        x=x+(6-x)*v;y=y+(88-y)*v;a=1-v;pose=v>.3?'curl':pose;sc=1-.3*v;}
      else{const v=Math.min(1,pt/700)*(pt>3000?Math.max(0,1-(pt-3000)/1000):1);   // 貼過來
        x=x+(50-x)*v;y=y+(42-y)*v;sc=1+.35*v;pose=v>.6?'reach_a':pose;sq=v>.6?Math.sin(pt/90)*.04:sq;}}
    c.style.left=x+'%';c.style.top=y+'%';c.style.opacity=a;c.style.transform=`translate(-50%,-50%) scale(${sc})`;
    const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);drawLarva(g,c.width/2,c.width*44/96,rot,sq,pose,ST_LOOK,t,1,c.width/96);
    ST_TANK_RAF=requestAnimationFrame(step)};
  ST_TANK_RAF=requestAnimationFrame(step);}
function stTankPoke(){const m=stTankMood(),k=m==='close'?'peek':'hide',P=SUI.tankPoke;
  if(P&&performance.now()-P.t<3500)return;   // 還在躲：不重來
  SUI.tankPoke={k,t:performance.now()};const p=document.querySelector('#ovStory .stankst');if(p)p.textContent=stT().tank[k];
  setTimeout(()=>{const p=document.querySelector('#ovStory .stankst');if(p&&SUI.tankPoke&&performance.now()-SUI.tankPoke.t>=3000)p.textContent=stT().tank.st[stTankMood()]},3050);}
