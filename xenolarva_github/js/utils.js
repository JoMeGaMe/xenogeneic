const mixc=(c,t,k)=>c.map((v,i)=>Math.round(v+(t[i]-v)*k));
// 通用小工具：取元素、隨機、顏色轉換、名字上色。沒有遊戲規則。
const $=id=>document.getElementById(id), R=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
function parseColor(v){v=v.trim();let m;
  if(m=v.match(/^#?([0-9a-f]{6})$/i))return '#'+m[1].toLowerCase();
  if(m=v.match(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i))return '#'+m[1]+m[1]+m[2]+m[2]+m[3]+m[3];
  if(m=v.match(/^(\d{1,3})[\s,，]+(\d{1,3})[\s,，]+(\d{1,3})$/)){const c=[m[1],m[2],m[3]].map(Number);if(c.every(n=>n<=255))return '#'+c.map(n=>n.toString(16).padStart(2,'0')).join('')}
  return null}
function paintName(el,c){el.style.color=c||'';let d=false;
  if(c){const r=[1,3,5].map(i=>parseInt(c.substr(i,2),16));d=(r[0]*.3+r[1]*.59+r[2]*.11)/255<.3}
  el.style.background=d?'rgba(230,246,242,.9)':'';el.style.padding=d?'0 8px':'';el.style.borderRadius=d?'4px':''}
function hexRgb(h){return[1,3,5].map(i=>parseInt(h.substr(i,2),16))}
const hsl2rgb=(h,s,l)=>{s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));return[f(0),f(8),f(4)].map(v=>Math.round(v*255))};

// ---- 新增的小工具 ----
// 只在物件「自己擁有」這個鍵時才算有（避免匯入檔案塞入 constructor 之類的怪鍵）
// 名字在訊息裡用【】框起來，比較好辨認
const nm=s=>'【'+s+'】';
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
// 轉成安全的 HTML 文字
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// 把文字裡的 {key} 換成 vars[key]：fmt('把{item}推開',{item:'甜果'}) → '把甜果推開'
const fmt=(s,v)=>String(s).replace(/\{(\w+)\}/g,(_,k)=>(v&&k in v)?v[k]:'');
// 建立 DOM 元素：h('div',{class:'x',onclick:fn},'文字',子元素…)。文字一律當純文字處理，不會被當成 HTML。
function h(tag,attrs,...kids){
  const e=document.createElement(tag);
  for(const k in (attrs||{})){
    const v=attrs[k];
    if(k==='class')e.className=v;
    else if(k.indexOf('on')===0)e[k]=v;
    else if(k in e)e[k]=v;
    else e.setAttribute(k,v);
  }
  kids.forEach(c=>{if(c!=null&&c!==false)e.append(c.nodeType?c:document.createTextNode(String(c)))});
  return e;
}
