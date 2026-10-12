// 幼體的共用繪製：本體、圖鑑縮圖、水缸同伴都用這個函式。
// 外觀顏色：核心最明顯；身體隨天數慢慢染上一點點核心的顏色（幅度較小）。
function larvaLook(o){
  const dyed=!!(o.tc||o.colored);                            // tc：聊天染上的核心色（優先於代表色）；tb：聊天染上的外殼色
  const core=o.tc?hexRgb(o.tc):o.colored?hexRgb(o.col):mixc([255,255,255],hsl2rgb(o.hue,75,72),Math.min(1,(o.day-1)*.2));   // 剛出生核心是白色，之後慢慢染上色相
  const k=dyed?.4:Math.min(.3,(o.day-1)*.05);               // 身體染色幅度
  return {core, body:o.tb?mixc([255,255,255],hexRgb(o.tb),.55):mixc([255,255,255],core,k), ca:dyed?1:Math.min(.95,.65+(o.day-1)*.06), wear:o.wear||''};
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
Object.keys(WEARS).forEach(id=>{if(WEARS[id].img)wearImg(id)});   // 先載入裝扮圖（縮圖第一次畫就看得到）
function drawLarva(g,x,y,rot,sq,pose,look,tt,alpha,sc){
  g.save();
  g.translate(Math.round(x),Math.round(y));g.rotate(rot);g.scale(sc*(1+sq),sc*(1-sq));g.translate(-48,-44);
  const [kx,ky]=coreAt(pose),pul=1+Math.sin(tt*2.2)*.06;
  g.globalAlpha=alpha*look.ca*.8;g.drawImage(tint('core_glow',look.core),kx-20*pul,ky-20*pul,40*pul,40*pul);
  g.globalAlpha=alpha*look.ca;  g.drawImage(tint('core_mask',look.core),kx-12*pul,ky-12*pul,24*pul,24*pul);
  g.globalAlpha=alpha;          g.drawImage(tint('body_'+pose,look.body),0,0);
  if(look.wear&&WEARS[look.wear]){                   // 裝扮（js/data/wears.js）
    const w=wearImg(look.wear),W_=WEARS[look.wear];
    if(W_.img){if(w.naturalWidth){const [bx,by]=coreAt('idle_a');g.drawImage(w,Math.round(kx-bx),Math.round(ky-by),96,96)}}   // 圖片版：照 idle_a 畫好，換姿勢時跟著核心移動
    else g.drawImage(w,Math.round(kx-w.width/2+W_.dx),Math.round(ky-w.height/2+W_.dy));
  }
  g.restore();
}
