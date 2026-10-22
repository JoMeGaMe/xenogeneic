// ===== 紙娃娃（玩家的長相，v0.35）：合成、白邊、長相登記編輯器 =====
// 資料在 js/data/doll.js，文字在 TEXT.doll。圖第一次用到時才讀（dollLoad），不拖慢開遊戲。
// 打開編輯器：dollOpen({done:ok=>{…}})　ok＝按了「確定」（長相已存進 META.doll）；按 ✕＝取消，不存。
// 畫到畫布上：dollPaint(canvas, META.doll, 表情 id 或 '')；畫布大小隨意（建議 186×200 的倍數）。
const DOLL_IMG={};let DOLL_READY=null;
const dollSrc=k=>(typeof ASSETS!=='undefined'&&ASSETS['doll/'+k])||'assets/doll/'+k+'.png?v='+VERSION;   // ?v：換圖後不會讀到瀏覽器裡的舊圖
function dollLoad(){
  if(!DOLL_READY)DOLL_READY=Promise.all(['body',...Object.values(DOLL_LISTS).flat()].map(k=>new Promise(r=>{const i=new Image();i.onload=()=>{DOLL_IMG[k]=i;r()};i.onerror=r;i.src=dollSrc(k)})));
  return DOLL_READY;
}
// ---------- 繪製 ----------
const dollCv=()=>{const c=document.createElement('canvas');c.width=DOLL_W*DOLL_K;c.height=DOLL_H*DOLL_K;return c};
// 上色：灰階底圖 multiply 顏色，再用原圖切回形狀（黑線、灰色陰影保留）。同一張圖＋同一個顏色會記住，不重算
const DOLL_TINT=new Map();
function dollTint(file,col){
  const key=file+'|'+(col||''),hit=DOLL_TINT.get(key);if(hit)return hit;
  const im=DOLL_IMG[file],c=dollCv(),g=c.getContext('2d'),w=c.width,ht=c.height;
  if(im){g.drawImage(im,0,0,w,ht);
    if(col){g.globalCompositeOperation='multiply';g.fillStyle=col;g.fillRect(0,0,w,ht);g.globalCompositeOperation='destination-in';g.drawImage(im,0,0,w,ht)}}
  if(DOLL_TINT.size>240)DOLL_TINT.clear();
  DOLL_TINT.set(key,c);return c;
}
const dollCol=(st,t)=>t?(DOLL_FIXED[t]||st[t]):null;
// 眼睛的顏色：有預設色的眼睛（DOLL_EYE_DEF）選「預設色」時用它，其他用瞳色
const dollEyeCol=(st,id,c)=>DOLL_EYE_DEF[id]&&c!=='eye'?DOLL_EYE_DEF[id]:st.eye;
const dollCenter=f=>{const b=DOLL_BB[f]||[0,0,DOLL_W,DOLL_H];return [(b[0]+b[2])/2,(b[1]+b[3])/2]};
// 移動與縮放以那張圖有畫的範圍的中心為準。par＝跟著誰動（眼睛光跟著眼睛）：{file,t}
function dollFile(g,file,t,col,par){
  g.save();
  if(par){const [px,py]=dollCenter(par.file);g.translate(px+par.t.x,py+par.t.y);g.scale(par.t.s,par.t.s);g.translate(-px,-py)}
  if(t){const [cx,cy]=dollCenter(file);g.translate(cx+t.x,cy+t.y);g.scale(t.s,t.s);g.translate(-cx,-cy)}
  g.drawImage(dollTint(file,col),0,0,DOLL_W,DOLL_H);g.restore();
}
// 表情的部件：沒單獨調過的大小位置跟平常一樣
function dollEmoPart(st,emo,k){const n=st.parts[k],e=st.emo[emo][k];return {id:e.id,x:e.x??n.x,y:e.y??n.y,s:e.s??n.s,c:e.c}}
function dollCompose(st,emo){
  const c=dollCv(),g=c.getContext('2d');g.scale(DOLL_K,DOLL_K);
  const face=emo&&st.emo[emo].mode==='face';
  const pick=k=>face&&DOLL_FACE.includes(k)?dollEmoPart(st,emo,k):st.parts[k];
  DOLL_ORDER.forEach(k=>{
    if(k==='body')return dollFile(g,'body',null,st.skin);
    if(k==='top'||k==='pants')return st[k]&&st[k]!=='none'?dollFile(g,st[k],null,null):null;
    const p=pick(k);if(p.id==='none')return;
    if(k==='hl'){const e=pick('eye');return dollFile(g,p.id,p,null,e.id==='none'?null:{file:e.id,t:e})}
    dollFile(g,p.id,p,k==='eye'?dollEyeCol(st,p.id,p.c):dollCol(st,DOLL_PARTS[k].tint));
  });
  return c;
}
// 白邊：剪影往四周疊印（不用 getImageData）
function dollOutline(src){
  const r=DOLL_OUTLINE*DOLL_K,s=dollCv(),sg=s.getContext('2d');
  sg.drawImage(src,0,0);sg.globalCompositeOperation='source-in';sg.fillStyle='#fff';sg.fillRect(0,0,s.width,s.height);
  const o=dollCv(),og=o.getContext('2d');
  for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r+r)og.drawImage(s,x,y);
  og.drawImage(src,0,0);return o;
}
function dollLine(g,col,w,pts){g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(pts[0][0],pts[0][1]);pts.slice(1).forEach(p=>g.lineTo(p[0],p[1]));g.stroke()}
// 泡泡（表情選「泡泡」時）：之後可以換成畫好的圖
function dollBubble(g,emo){
  const bx=140,by=30;g.save();g.fillStyle='#fff';g.strokeStyle='#2b6b80';g.lineWidth=2;
  g.beginPath();g.ellipse(bx,by,20,16,0,0,PI2);g.fill();g.stroke();
  g.beginPath();g.moveTo(bx-14,by+10);g.lineTo(bx-22,by+22);g.lineTo(bx-6,by+14);g.closePath();g.fill();
  g.textAlign='center';g.textBaseline='middle';
  if(emo==='joy'){g.fillStyle='#e0569a';g.font='bold 22px sans-serif';g.fillText('♪',bx,by+1)}
  else if(emo==='anger')[[-8,-6,-3,-1],[8,-6,3,-1],[-8,8,-3,3],[8,8,3,3]].forEach(([a,b,c,d])=>dollLine(g,'#d93b3b',3.5,[[bx+a,by+b],[bx+c,by+d]]));
  else if(emo==='sad'){g.fillStyle='#4a9be0';g.beginPath();g.moveTo(bx,by-11);g.lineTo(bx+8,by+4);g.lineTo(bx,by+11);g.lineTo(bx-8,by+4);g.closePath();g.fill()}
  else if(emo==='fun'){g.fillStyle='#f2b84b';g.font='bold 20px sans-serif';g.fillText('✦',bx-7,by+1);g.font='bold 13px sans-serif';g.fillText('✦',bx+8,by-6)}
  else if(emo==='shock'){g.fillStyle='#2c3e5c';g.font='900 24px sans-serif';g.fillText('！',bx,by+1)}
  g.restore();
}
function dollPaint(cv,st,emo){
  const g=cv.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);
  if(!st)return;
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.drawImage(dollOutline(dollCompose(st,emo)),0,0,cv.width,cv.height);
  if(emo&&st.emo[emo].mode==='bubble'){g.save();g.scale(cv.width/DOLL_W,cv.height/DOLL_H);dollBubble(g,emo);g.restore()}
}
// 縮圖：把那張圖有畫的範圍放大到格子裡
function dollThumb(file,col){
  const c=h('canvas',{width:120,height:120}),g=c.getContext('2d');
  if(!file){dollLine(g,'#8aa3ad',3,[[30,90],[90,30]]);return c}
  const [x0,y0,x1,y1]=DOLL_BB[file],w=x1-x0,ht=y1-y0,k=Math.min(100/w,100/ht,6),K=DOLL_K;
  g.imageSmoothingEnabled=true;g.drawImage(dollTint(file,col),x0*K,y0*K,w*K,ht*K,60-w*k/2,60-ht*k/2,w*k,ht*k);return c;
}

// ---------- 編輯器（#ovDoll）----------
// DOLL_ED：st 正在改的長相（複本；按「確定」才存）｜mode part 部件／emo 表情｜part 選中的部件｜emo 選中的表情｜done 關掉後要做的事
let DOLL_ED=null;
const dollWide=()=>!(window.matchMedia&&matchMedia('(max-width:759px)').matches);
function dollOpen(o){
  o=o||{};
  DOLL_ED={st:JSON.parse(JSON.stringify(META.doll||dollDef())),mode:'part',part:'front',emo:'joy',done:o.done||null};
  const T=TEXT.doll;$('dollTitle').textContent=T.title;$('dollDone').textContent=T.done;
  $('dollStage').textContent='';$('dollGrid').textContent='';$('dollDet').textContent='';
  $('dollStage').append(h('p',{class:'dim'},T.loading));
  $('ovDoll').classList.add('show');
  dollLoad().then(()=>{if(DOLL_ED)dollDraw()});
}
function dollClose(ok){
  if(!DOLL_ED)return;
  const done=DOLL_ED.done;
  if(ok){META.doll=dollNorm(DOLL_ED.st);codexSave()}
  DOLL_ED=null;$('ovDoll').classList.remove('show');
  if(done)done(!!ok);
}
$('dollClose').onclick=()=>dollClose(false);
$('dollDone').onclick=()=>dollClose(true);
if(window.matchMedia)matchMedia('(max-width:759px)').addEventListener('change',()=>{if(DOLL_ED&&$('dollStage').querySelector('canvas'))dollDraw()});

const dollItems=k=>[...(DOLL_PARTS[k].none?[['none',TEXT.doll.none]]:[]),...DOLL_LISTS[k].map(f=>[f,f.split('_')[1]])];   // 編號＝原檔編號
function dollVisible(){
  const E=DOLL_ED;if(E.mode==='part')return DOLL_PLIST;
  return E.st.emo[E.emo].mode==='face'?DOLL_PLIST.filter(k=>DOLL_FACE.includes(k)):[];
}
function dollPickEmo(k){
  const E=DOLL_ED;
  if(E.mode==='emo'&&E.emo===k)E.mode='part';
  else{E.mode='emo';E.emo=k;if(!DOLL_FACE.includes(E.part))E.part='eye'}
  dollDraw();
}
const dollRepaint=()=>{const c=$('dollPv');if(c)dollPaint(c,DOLL_ED.st,DOLL_ED.mode==='emo'?DOLL_ED.emo:'')};
function dollDraw(){
  const E=DOLL_ED,T=TEXT.doll,st=$('dollStage'),wide=dollWide();
  st.textContent='';st.className='dstage '+(wide?'dsA':'dsB');
  const name=h('span',{class:'dname'},META.pname||TEXT.misc.defPlayer);paintName(name,META.pcol||'');
  const pv=h('div',{class:'dpvw'},h('canvas',{id:'dollPv',width:DOLL_W*DOLL_K,height:DOLL_H*DOLL_K,'aria-label':T.preview}),
    h('span',{class:'dtag'},E.mode==='emo'?fmt(T.emoTag,{e:T.emos[E.emo]}):T.normal),name);
  const vis=dollVisible();
  const partBtns=vis.map(k=>h('button',{class:E.part===k?'on':'',onclick:()=>{E.part=k;dollDraw()}},T.parts[k]));
  const emoBtns=DOLL_EMOS.map(k=>h('button',{class:E.mode==='emo'&&E.emo===k?'on':'','aria-pressed':String(E.mode==='emo'&&E.emo===k),onclick:()=>dollPickEmo(k)},T.emos[k]));
  const note=vis.length?null:h('span',{class:'dim'},T.bubbleNote);
  const partLab=E.mode==='emo'?T.labEmoParts:T.labParts;
  if(wide){
    st.append(h('div',{class:'dcol'},h('div',{class:'dinner'},h('span',{class:'dlab'},partLab),h('div',{class:'dplist'},...partBtns,note))),
      pv,h('div',{class:'dcol'},h('div',{class:'dinner'},h('span',{class:'dlab'},T.labEmo),h('div',{class:'delist'},...emoBtns))));
  }else{
    st.append(h('div',{class:'derow','aria-label':T.labEmo},...emoBtns),pv,h('div',{class:'dprow','aria-label':partLab},...partBtns,note));   // 手機：省掉小標（預覽左上角會寫「表情：喜」）
  }
  // 選中的部件按鈕捲進看得到的地方
  const on=st.querySelector('.dplist .on,.dprow .on');
  if(on)requestAnimationFrame(()=>{const c=on.parentElement;
    if(c.classList.contains('dplist')){const t=on.offsetTop-c.offsetTop;if(t<c.scrollTop||t+on.offsetHeight>c.scrollTop+c.clientHeight)c.scrollTop=t-6}
    else{const l=on.offsetLeft-c.offsetLeft;if(l<c.scrollLeft||l+on.offsetWidth>c.scrollLeft+c.clientWidth)c.scrollLeft=l-6}});
  const grid=$('dollGrid'),det=$('dollDet'),gs=grid.scrollTop,ds=det.scrollTop,same=E.lastKey===E.mode+E.part+E.emo;grid.textContent='';det.textContent='';   // 同一個部件：格子、細節的捲動位置不變
  if(E.mode==='part')dollPartMode(grid,det);else dollEmoMode(grid,det);
  grid.scrollTop=same?gs:0;det.scrollTop=same?ds:0;E.lastKey=E.mode+E.part+E.emo;
  dollRepaint();
}
// 色票＋自訂（顏色存在 st[key]）
function dollSwatches(label,key,list){
  const E=DOLL_ED,cur=E.st[key];
  const cp=h('input',{type:'color',value:cur,'aria-label':label+' '+TEXT.doll.pickOwn,title:TEXT.doll.pickOwn});
  cp.oninput=()=>{E.st[key]=cp.value;dollRepaint()};
  cp.onchange=()=>dollDraw();
  return h('div',{class:'dsw'},h('span',{class:'dlab'},label),
    h('div',{class:'sw'},...list.map(c=>h('button',{class:cur===c?'sel':'',style:'background:'+c,'aria-label':label+' '+c,onclick:()=>{E.st[key]=c;dollDraw()}})),
      h('label',{class:'scust'},cp,h('span',{},TEXT.doll.pickOwn))));
}
function dollPartMode(grid,det){
  const E=DOLL_ED,T=TEXT.doll,k=E.part;
  if(k==='skin'){grid.append(h('div',{class:'dempty'},dollSwatches(T.skin,'skin',DOLL_SKINS)));det.append(h('span',{class:'dim'},T.skinNote));return}
  if(k==='top'||k==='pants'){   // 衣服：只挑圖
    DOLL_LISTS[k].forEach(f=>grid.append(h('button',{class:'dcell'+(E.st[k]===f?' on':''),onclick:()=>{E.st[k]=f;dollDraw()}},dollThumb(f,null),h('span',{},f.split('_')[1]))));
    det.append(h('span',{class:'dim'},T.clothNote));return;
  }
  const cur=E.st.parts[k];
  dollGridOf(grid,k,cur.id,id=>{cur.id=id},cur.c);
  if(k==='eye')dollEyeMode(det,cur);
  dollAdj(det,cur,k,null);
  if(DOLL_PARTS[k].tint==='hair')det.append(dollSwatches(T.hair,'hair',DOLL_HAIRS));
  if(k==='eye')det.append(dollSwatches(T.eye,'eye',DOLL_EYES));
}
function dollEmoMode(grid,det){
  const E=DOLL_ED,T=TEXT.doll,X=E.st.emo[E.emo],face=X.mode==='face';
  det.append(h('span',{class:'dlab'},fmt(T.emoHead,{e:T.emos[E.emo]})),
    h('div',{class:'dmode'},h('button',{class:face?'on':'',onclick:()=>{X.mode='face';if(!DOLL_FACE.includes(E.part))E.part='eye';dollDraw()}},T.emoFace),
      h('button',{class:face?'':'on',onclick:()=>{X.mode='bubble';dollDraw()}},T.emoBubble)),
    h('span',{class:'dim'},face?T.emoFaceNote:T.emoBubbleNote));
  if(!face){grid.append(h('p',{class:'dim dempty'},T.bubbleEmpty));return}
  const p=X[E.part];
  dollGridOf(grid,E.part,p.id,id=>{p.id=id},p.c);
  if(E.part==='eye')dollEyeMode(det,p);
  dollAdj(det,p,E.part,E.emo);
}
function dollGridOf(grid,k,curId,set,c){
  const st=DOLL_ED.st,col=dollCol(st,DOLL_PARTS[k].tint);
  dollItems(k).forEach(([id,n])=>grid.append(h('button',{class:'dcell'+(curId===id?' on':''),onclick:()=>{set(id);dollDraw()}},dollThumb(id==='none'?null:id,k==='eye'?dollEyeCol(st,id,c):col),h('span',{},n))));
}
// 有預設色的眼睛：選「預設色」或「瞳色」（平常、每個表情各自記）
function dollEyeMode(det,p){
  if(!DOLL_EYE_DEF[p.id])return;
  const T=TEXT.doll,own=p.c==='eye';
  det.append(h('span',{class:'dlab'},T.eyeColHead),
    h('div',{class:'dmode deyec'},h('button',{class:own?'':'on',onclick:()=>{p.c='def';dollDraw()}},h('span',{class:'dchip',style:'background:'+DOLL_EYE_DEF[p.id]}),T.eyeDef),
      h('button',{class:own?'on':'',onclick:()=>{p.c='eye';dollDraw()}},h('span',{class:'dchip',style:'background:'+DOLL_ED.st.eye}),T.eyeOwn)));
}
function dollStep(label,val,dec,inc,canDec,canInc,mark){
  const T=TEXT.doll;
  return h('div',{},h('span',{class:'dlab'},label),mark?h('span',{class:'dinh'},T.own):null,
    h('div',{class:'dstep'},h('button',{onclick:dec,disabled:!canDec,'aria-label':label+T.less},'−'),h('span',{class:'dnum'},val),h('button',{onclick:inc,disabled:!canInc,'aria-label':label+T.more},'＋')));
}
// 大小、位置：表情的部件沒單獨調過就顯示平常的值（改了才記在表情裡）
function dollAdj(det,p,k,emo){
  const T=TEXT.doll,L={...DOLL_LIM,d:dollD(k)},off=p.id==='none',eff=emo?dollEmoPart(DOLL_ED.st,emo,k):p;
  const mv=(a,d)=>()=>{p[a]=Math.max(-L.d,Math.min(L.d,eff[a]+d));dollDraw()};
  const sc=d=>()=>{p.s=Math.round(Math.max(L.smin,Math.min(L.smax,eff.s+d))*100)/100;dollDraw()};
  const dir=(v,a,b)=>(v>0?b+' ':v<0?a+' ':'')+Math.abs(v);
  det.append(
    dollStep(T.size,Math.round(eff.s*100)+'%',sc(-.05),sc(.05),!off&&eff.s>L.smin+.001,!off&&eff.s<L.smax-.001,emo&&p.s!=null),
    dollStep(T.posX,dir(eff.x,T.left,T.right),mv('x',-1),mv('x',1),!off&&eff.x>-L.d,!off&&eff.x<L.d,emo&&p.x!=null),
    dollStep(T.posY,dir(eff.y,T.up,T.down),mv('y',-1),mv('y',1),!off&&eff.y>-L.d,!off&&eff.y<L.d,emo&&p.y!=null),
    emo?h('button',{disabled:p.x==null&&p.y==null&&p.s==null,onclick:()=>{p.x=p.y=p.s=null;dollDraw()}},T.same)
       :h('button',{disabled:off,onclick:()=>{Object.assign(p,dollTf());dollDraw()}},T.reset));
  if(off)det.append(h('span',{class:'dim'},T.noneNote));
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&DOLL_ED)dollClose(false)});
