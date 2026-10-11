// 幼體的共用繪製：本體、圖鑑縮圖、水缸同伴都用這個函式。
// 外觀顏色：核心最明顯；身體隨天數慢慢染上一點點核心的顏色（幅度較小）。
function larvaLook(o){
  const dyed=!!(o.tc||o.colored);                            // tc：聊天染上的核心色（優先於代表色）；tb：聊天染上的外殼色
  const core=o.tc?hexRgb(o.tc):o.colored?hexRgb(o.col):mixc([255,255,255],hsl2rgb(o.hue,75,72),Math.min(1,(o.day-1)*.2));   // 剛出生核心是白色，之後慢慢染上色相
  const k=dyed?.4:Math.min(.3,(o.day-1)*.05);               // 身體染色幅度
  return {core, body:o.tb?mixc([255,255,255],hexRgb(o.tb),.55):mixc([255,255,255],core,k), ca:dyed?1:Math.min(.95,.65+(o.day-1)*.06)};
}
function drawLarva(g,x,y,rot,sq,pose,look,tt,alpha,sc){
  g.save();
  g.translate(Math.round(x),Math.round(y));g.rotate(rot);g.scale(sc*(1+sq),sc*(1-sq));g.translate(-48,-44);
  const [kx,ky]=coreAt(pose),pul=1+Math.sin(tt*2.2)*.06;
  g.globalAlpha=alpha*look.ca*.8;g.drawImage(tint('core_glow',look.core),kx-20*pul,ky-20*pul,40*pul,40*pul);
  g.globalAlpha=alpha*look.ca;  g.drawImage(tint('core_mask',look.core),kx-12*pul,ky-12*pul,24*pul,24*pul);
  g.globalAlpha=alpha;          g.drawImage(tint('body_'+pose,look.body),0,0);
  g.restore();
}
