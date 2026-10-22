// 載入圖片、替核心上色。
const IMG={};let nLoaded=0;
// 圖片載不到（例如上傳 GitHub 時漏了檔案）：畫面照常，底部跳提示寫出是哪幾個檔案
const IMG_MISSING=[];
IMGN.forEach(n=>{const im=new Image();im.onload=()=>nLoaded++;im.onerror=()=>{nLoaded++;IMG_MISSING.push(BASE+n+'.png');
  if(window.showErr)window.showErr('圖片載入失敗（請確認檔案有上傳、檔名大小寫一致）：'+IMG_MISSING.join('、'))};im.src=ASSETS[n]||BASE+n+'.png';IMG[n]=im});
const imgOK=im=>!!(im&&im.complete&&im.naturalWidth);   // 載好了而且不是壞圖
let TINT={},TINT_N=0;
const tintRoom=()=>{if(++TINT_N>600){TINT={};TINT_N=0}};   // 快取上限：聊天選自訂顏色時一直換色，不讓快取無限長大
function tint(n,rgb){const k=n+rgb;if(TINT[k])return TINT[k];const im=IMG[n];if(!imgOK(im)){const e=document.createElement('canvas');e.width=e.height=1;return e}tintRoom();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');
  g.drawImage(im,0,0);g.globalCompositeOperation='multiply';g.fillStyle=`rgb(${rgb})`;g.fillRect(0,0,c.width,c.height);g.globalCompositeOperation='destination-in';g.drawImage(im,0,0);return TINT[k]=c}
// 外殼雙色（雜誌染色）：先畫 a 色，再把 b 色疊在下半（v 上下）或右半（h 左右）。soft＝柔和漸層，否則分色（一刀切開）
// 切線照這個姿勢身體的實際範圍（不透明像素的外框）算中間，每個姿勢各自算一次
// 每個姿勢身體的實際範圍（不透明像素的外框；用 tools 事先算好，不在瀏覽器讀像素——直接開 index.html 時讀像素會被瀏覽器擋下）
const BBOX={"body_close":[8,7,177,163],"body_curl":[10,2,192,177],"body_droop":[6,17,186,187],"body_flat_a":[5,18,191,182],"body_flat_b":[10,16,180,184],"body_idle_a":[8,4,191,188],"body_idle_b":[8,4,189,186],"body_open_a":[8,4,192,174],"body_open_b":[2,2,192,166],"body_reach_a":[8,4,191,188],"body_reach_b":[8,4,191,188],"body_rest":[4,21,191,180]};   // 圖片像素座標（192×192 圖；v0.34 起 2 倍）
function spriteBox(n){return BBOX[n]||[0,0,(IMG[n]&&IMG[n].width)||96,(IMG[n]&&IMG[n].height)||96]}
function tint2(n,a,b,mode,soft){
  const k=n+a+'|'+b+mode+(soft?1:0);if(TINT[k])return TINT[k];tintRoom();
  const A=tint(n,a),B=tint(n,b),c=document.createElement('canvas');c.width=A.width;c.height=A.height;const g=c.getContext('2d');
  g.drawImage(A,0,0);
  const d=document.createElement('canvas');d.width=A.width;d.height=A.height;const q=d.getContext('2d');q.drawImage(B,0,0);
  const [x0,y0,x1,y1]=spriteBox(n),v=mode==='v',lo=v?y0:x0,hi=v?y1:x1,mid=(lo+hi)/2;
  q.globalCompositeOperation='destination-in';
  if(soft){const w=(hi-lo)*.32,gr=v?q.createLinearGradient(0,mid-w,0,mid+w):q.createLinearGradient(mid-w,0,mid+w,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,1)');q.fillStyle=gr;q.fillRect(0,0,d.width,d.height)}
  else{q.fillStyle='#000';const m=Math.round(mid);if(v)q.fillRect(0,m,d.width,d.height-m);else q.fillRect(m,0,d.width-m,d.height)}
  g.drawImage(d,0,0);
  return TINT[k]=c;
}
