// 水缸畫布與基本畫點函式。
// ---------- 像素水缸 ----------
const cv=$('tank'),cx=cv.getContext('2d');
let dead=0,bounce=0,EM=null;
cx.imageSmoothingEnabled=false;
function px(x,y,w,h,col,al){cx.globalAlpha=al;cx.fillStyle=col;cx.fillRect(Math.round(x),Math.round(y),w,h)}
