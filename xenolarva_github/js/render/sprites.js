// 載入圖片、替核心上色。
const IMG={};let nLoaded=0;
IMGN.forEach(n=>{const im=new Image();im.onload=im.onerror=()=>nLoaded++;im.src=ASSETS[n]||BASE+n+'.png';IMG[n]=im});
const TINT={};
function tint(n,rgb){const k=n+rgb;if(TINT[k])return TINT[k];const im=IMG[n],c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');
  g.drawImage(im,0,0);g.globalCompositeOperation='multiply';g.fillStyle=`rgb(${rgb})`;g.fillRect(0,0,c.width,c.height);g.globalCompositeOperation='destination-in';g.drawImage(im,0,0);return TINT[k]=c}
