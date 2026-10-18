// 【介面外觀】配色與字體（玩家在「設定」裡選；存在這台裝置的 localStorage，不進存檔）。
// 放在 <head> 載入：一開頁面就套上，不會先閃一下預設色。顏色本身在 css/theme.css（html 的 data-skin／data-font）。
// 新增配色：theme.css 加一段 :root[data-skin="id"]，這裡的 SKINS 加一列。
// 名稱在 js/data/texts.js 的 TEXT.skin（names／fonts／frames），這裡只放 id。
// 第三欄 light＝亮色（彈出框也是亮的，字是深色）；page＝只有頁面底色是亮的（彈出框還是暗的）。玩家名字的顏色會依此加底色。
const SKINS=[['classic'],['night'],['deep'],['dusk'],['noir'],['latte',0,'light']];
const FONTS=[['mix'],['pixel'],['plain']];
const FRAMES=[['round'],['flat']];
const SKIN_KEY='xenolarva_skin';
let SKIN={skin:'classic',font:'mix',frame:'round'};
try{Object.assign(SKIN,JSON.parse(localStorage.getItem(SKIN_KEY)||'{}'))}catch(e){}
function skinApply(){const d=document.documentElement;
  if(!SKINS.some(s=>s[0]===SKIN.skin))SKIN.skin='classic';
  if(!FONTS.some(s=>s[0]===SKIN.font))SKIN.font='mix';
  if(!FRAMES.some(s=>s[0]===SKIN.frame))SKIN.frame='round';
  d.dataset.skin=SKIN.skin;d.dataset.font=SKIN.font;d.dataset.frame=SKIN.frame;
  d.dataset.tone=(SKINS.find(s=>s[0]===SKIN.skin)[2])||'dark';
  if(typeof paintName==='function')document.querySelectorAll('[data-pc]').forEach(el=>paintName(el,el.dataset.pc))}
// 玩家筆跡顏色：原本只有「太暗的字加淺底」。亮底的地方反過來，太亮的字（白、黃）加深底。
// 判斷「這個名字在亮底還是暗底上」：彈出框裡看 panel，頁面上（頂列）看頁面。
function nameOnLight(el){const t=document.documentElement.dataset.tone;return t==='light'||(t==='page'&&!(el.closest&&el.closest('.box,#hamMenu,#acts')))}
function skinSet(k,v){SKIN[k]=v;skinApply();try{localStorage.setItem(SKIN_KEY,JSON.stringify(SKIN))}catch(e){}}
skinApply();

// 設定頁最後加「外觀」一段（包住 flow.js 的 settingsBuild，不改原本的程式）
window.addEventListener('DOMContentLoaded',()=>{
  if(typeof paintName==='function'){const pn=paintName;
    paintName=function(el,c){pn(el,c);if(!el)return;el.dataset.pc=c||'';
      if(!c||!nameOnLight(el))return;
      const r=[1,3,5].map(i=>parseInt(c.substr(i,2),16)),L=(r[0]*.3+r[1]*.59+r[2]*.11)/255;
      const lt=L>.62,dk=L<.3;   // 亮底上：太亮的加深底；太暗的反而不用底
      el.style.background=lt?'rgba(58,40,32,.88)':'';el.style.padding=lt?'0 8px':'';el.style.borderRadius=lt?'4px':'';void dk}}
  if(typeof META!=='undefined'&&$('pname'))paintName($('pname'),(typeof S!=='undefined'&&S&&S.col)||META.pcol||'');   // 開頁時已經畫過一次（還沒包），補畫
  skinApply();
  if(typeof settingsBuild!=='function')return;
  const base=settingsBuild;
  settingsBuild=function(){base.apply(this,arguments);
    const b=$('setBody'),T=TEXT.skin;
    const NM={skin:T.names,font:T.fonts,frame:T.frames};
    const chips=(key,list)=>h('div',{class:'skinrow'},...list.map(([id])=>[id,NM[key][id]||id]).map(([id,nm])=>h('button',{class:'skinchip'+(SKIN[key]===id?' on':''),'data-id':id,
      onclick:e=>{skinSet(key,id);[...e.currentTarget.parentNode.children].forEach(x=>x.classList.toggle('on',x.dataset.id===id))}},
      key==='skin'?h('i',{class:'skinsw'}):'',nm)));
    b.append(h('hr',{class:'div'}),h('label',{class:'sl'},T.frame),chips('frame',FRAMES),h('label',{class:'sl'},T.skin),chips('skin',SKINS),h('label',{class:'sl'},T.font),chips('font',FONTS));   // 順序：版型→配色→字體
    // 色票：每顆按鈕用自己那套配色畫小圓點
    b.querySelectorAll('.skinchip .skinsw').forEach(i=>i.parentNode.setAttribute('data-skin',i.parentNode.dataset.id));
  };
});
