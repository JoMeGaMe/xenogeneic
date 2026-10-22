// 水缸畫布與基本畫點函式。
// ---------- 像素水缸 ----------
const cv=$('tank'),cx=cv.getContext('2d');
const CVK=2;   // 水缸畫布內部 2 倍解析度（座標照舊用 500×500；v0.34）
cv.width=500*CVK;cv.height=500*CVK;cx.setTransform(CVK,0,0,CVK,0,0);
let dead=0,bounce=0,EM=null;
cx.imageSmoothingEnabled=false;
function px(x,y,w,h,col,al){cx.globalAlpha=al;cx.fillStyle=col;cx.fillRect(Math.round(x),Math.round(y),w,h)}
