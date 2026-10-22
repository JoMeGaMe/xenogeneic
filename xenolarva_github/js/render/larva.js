// 幼體的共用繪製：本體、圖鑑縮圖、水缸同伴都用這個函式。
// 外觀顏色：核心最明顯；身體隨天數慢慢染上一點點核心的顏色（幅度較小）。
function larvaLook(o){
  const dyed=!!(o.tc||o.colored);                            // tc：聊天染上的核心色（優先於代表色）；tb：聊天染上的外殼色
  const core=o.tc?hexRgb(o.tc):o.colored?hexRgb(o.col):mixc([255,255,255],hsl2rgb(o.hue,75,72),Math.min(1,(o.day-1)*.2+(o.pre||0)));   // 剛出生核心是白色，之後慢慢染上色相（pre：一開始就有的顏色，特殊委託的小球）
  const k=dyed?.4:Math.min(.3,(o.day-1)*.05);               // 身體染色幅度
  const two=o.tb&&o.tb2&&(o.tbm==='v'||o.tbm==='h');        // 雜誌染色：外殼兩色（tb2 第二色、tbm v 上下／h 左右、tbs soft 柔和／split 分色）
  return {core, body:o.tb?mixc([255,255,255],hexRgb(o.tb),.55):mixc([255,255,255],core,k), body2:two?mixc([255,255,255],hexRgb(o.tb2),.55):null, bm:two?o.tbm:'', soft:o.tbs!=='split'||!MAG_SPLIT,
    ca:dyed?1:Math.min(.95,.65+(o.day-1)*.06), wear:o.wear||'', wcol:o.wearCol||'rainbow'};
}
// 裝扮的像素圖畫成小畫布（快取）
const WEAR_CACHE={};
function wearImg(id){
  if(WEAR_CACHE[id])return WEAR_CACHE[id];
  if(WEARS[id].img){const im=new Image();im.src=assetImg(WEARS[id].img);return WEAR_CACHE[id]=im}   // 有圖：96×96，和 body_idle_a 對齊
  const W=WEARS[id],s=W.scale,c=document.createElement('canvas');c.width=W.art[0].length*s;c.height=W.art.length*s;
  const g=c.getContext('2d');
  W.art.forEach((row,y)=>[...row].forEach((ch,x)=>{if(W.pal[ch]){g.fillStyle=W.pal[ch];g.fillRect(x*s,y*s,s,s)}}));
  return WEAR_CACHE[id]=c;
}
Object.keys(WEARS).forEach(id=>{if(WEARS[id].img)wearImg(id)});
// 會發光的裝扮（WEARS[id].glow）：發光的部分上色。col＝色碼或 'rainbow'（照時間慢慢換色，色相分 30 段快取）
const GLOW_IMG={},GLOW_CACHE={};let GLOW_N=0;
function glowColor(col,tt){if(col!=='rainbow')return hexRgb(col);return hsl2rgb(Math.floor(((tt||0)*40%360)/12)*12,90,62)}
function glowImg(id,rgb){
  const W=WEARS[id];let im=GLOW_IMG[id];if(!im){im=GLOW_IMG[id]=new Image();im.src=assetImg(W.glow)}
  if(!im.naturalWidth)return null;
  const k=id+rgb;if(GLOW_CACHE[k])return GLOW_CACHE[k];if(++GLOW_N>200){for(const x in GLOW_CACHE)delete GLOW_CACHE[x];GLOW_N=0}
  const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');
  g.drawImage(im,0,0);g.globalCompositeOperation='multiply';g.fillStyle=`rgb(${rgb})`;g.fillRect(0,0,c.width,c.height);g.globalCompositeOperation='destination-in';g.drawImage(im,0,0);
  return GLOW_CACHE[k]=c;
}
// 畫一個會發光的裝扮的發光部分（x,y＝裝扮圖左上角）
function drawGlow(g,id,col,tt,x,y,w,h){
  const rgb=glowColor(col,tt),c=glowImg(id,rgb);if(!c)return;
  g.save();g.shadowColor=`rgb(${rgb})`;g.shadowBlur=6;g.drawImage(c,x,y,w||c.width,h||c.height);g.restore();
}
Object.keys(WEARS).forEach(id=>{if(WEARS[id].glow)glowImg(id,'255,255,255')});   // 先載入裝扮圖（縮圖第一次畫就看得到）
function drawLarva(g,x,y,rot,sq,pose,look,tt,alpha,sc){
  g.save();
  g.translate(Math.round(x),Math.round(y));g.rotate(rot);g.scale(sc*(1+sq),sc*(1-sq));g.translate(-48,-44);
  const [kx,ky]=coreAt(pose),pul=1+Math.sin(tt*2.2)*.06;
  const sm=g.imageSmoothingEnabled;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';   // 小球圖是 2 倍（192×192）畫成 96：縮小時要平滑
  g.globalAlpha=alpha*look.ca*.8*LARVA_FX.glow;g.drawImage(tint('core_glow',look.core),kx-20*pul,ky-20*pul,40*pul,40*pul);
  g.globalAlpha=alpha*look.ca;  g.drawImage(tint('core_mask',look.core),kx-12*pul,ky-12*pul,24*pul,24*pul);
  g.globalAlpha=alpha;          g.drawImage(look.body2?tint2('body_'+pose,look.body,look.body2,look.bm,look.soft):tint('body_'+pose,look.body),0,0,96,96);
  const hl=IMG['body_'+pose+'_L'];if(imgOK(hl)){g.globalAlpha=alpha*LARVA_FX.hl;g.drawImage(hl,0,0,96,96);g.globalAlpha=alpha}   // 光點：白色，不跟著換色
  g.imageSmoothingEnabled=sm;
  if(look.wear&&WEARS[look.wear]){                   // 裝扮（js/data/wears.js）
    const w=wearImg(look.wear),W_=WEARS[look.wear];
    if(W_.img){if(w.naturalWidth){const [bx,by]=coreAt('idle_a'),wx=Math.round(kx-bx),wy=Math.round(ky-by);if(w.naturalWidth>96){g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high'}g.drawImage(w,wx,wy,96,96);g.imageSmoothingEnabled=sm;if(W_.glow)drawGlow(g,look.wear,look.wcol,tt,wx,wy,96,96)}}   // 圖片版：照 idle_a 畫好，換姿勢時跟著核心移動
    else g.drawImage(w,Math.round(kx-w.width/2+W_.dx),Math.round(ky-w.height/2+W_.dy));
  }
  g.restore();
}
