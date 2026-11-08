window.SRC_LINES=[["js/utils.js", 2], ["js/data/assets-inline.js", 55], ["js/data/version.js", 58], ["js/data/grete.js", 62], ["js/data/chat.js", 72], ["js/data/assoc.js", 77], ["js/data/souvenirs.js", 98], ["js/data/texts.js", 117], ["js/data/temperaments.js", 972], ["js/data/tags.js", 1001], ["js/data/rules.js", 1029], ["js/data/items.js", 1060], ["js/data/endings.js", 1071], ["js/data/emotes.js", 1083], ["js/data/about.js", 1099], ["js/data/icons.js", 1137], ["js/data/news.js", 1324], ["js/data/letters.js", 1796], ["js/data/places.js", 1812], ["js/data/shop.js", 1829], ["js/data/hall.js", 1891], ["js/data/lineimg.js", 1998], ["js/data/doll.js", 2029], ["js/story/data/texts.js", 2119], ["js/story/data/story.js", 2188], ["js/story/data/storyscript.js", 2413], ["js/data/wears.js", 3098], ["js/data/decor.js", 3142], ["js/data/sprites.js", 3151], ["js/state.js", 3163], ["js/ui.js", 3222], ["js/actions.js", 3335], ["js/tags.js", 3482], ["js/grete.js", 3580], ["js/events.js", 3653], ["js/chat.js", 3776], ["js/souvenirs.js", 3935], ["js/settle.js", 3987], ["js/endings.js", 4056], ["js/codex.js", 4089], ["js/render/canvas.js", 4561], ["js/render/sprites.js", 4571], ["js/render/larva.js", 4601], ["js/render/emote.js", 4659], ["js/render/motion.js", 4680], ["js/render/social.js", 4823], ["js/render/creature.js", 4937], ["js/render/guests.js", 5112], ["js/render/land.js", 5288], ["js/minigame.js", 5363], ["js/render/scene.js", 5633], ["js/letters.js", 5700], ["js/places.js", 5793], ["js/shop.js", 5856], ["js/hall.js", 6042], ["js/doll.js", 6337], ["js/wardrobe.js", 6579], ["js/story/main.js", 6623], ["js/story/week.js", 6694], ["js/story/script.js", 6924], ["js/story/vn.js", 7101], ["js/story/sys.js", 7270], ["js/story/art.js", 7310], ["js/story/view.js", 7389], ["js/story/free.js", 7577], ["js/story/render.js", 7748], ["js/flow.js", 7865], ["js/main.js", 8004], ["js/preview.js", 8045], ["js/dev.js", 8165], ["js/layout.js", 8271]];
/* ==== js/utils.js ==== */
// 通用小工具：取元素、隨機、顏色轉換、名字上色。沒有遊戲規則。
const mixc=(c,t,k)=>c.map((v,i)=>Math.round(v+(t[i]-v)*k));   // 兩個 RGB 之間混色（k：0～1）
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
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));   // 放進 HTML（內文或屬性）的字一律經過這裡
// 把文字裡的 {key} 換成 vars[key]：fmt('把{item}推開',{item:'甜果'}) → '把甜果推開'
const fmt=(s,v)=>String(s).replace(/\{(\w+)\}/g,(m,k)=>(v&&k in v)?v[k]:k==='larva'?m:'');   // {larva} 沒給就先留著，顯示時（withLarva）再填
// {larva}＝這句話的主角小球。顯示時填名字：有指定就用指定的（同伴、玩的那隻…），沒有就用這一輪的小球；都沒有（第 0 日、圖鑑說明）用「幼體」
const LARVA_FALLBACK='幼體';
const withLarva=(s,name)=>String(s).replace(/\{larva\}/g,name!=null?name:(typeof S!=='undefined'&&S&&S.name?nm(S.name):LARVA_FALLBACK));
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

// ---- 圖片放哪個資料夾（v0.33.5 起 assets/ 分資料夾；程式和總表都只寫檔名，例如 hall_3f、joan_L_0）----
// bg 背景與地圖（720×360 等）｜bg_hd v0.4 用的大圖（同檔名，.jpg）｜npc 人物立繪｜letter 信紙｜item 商品道具｜wear 裝扮｜ui 介面小圖
// larva（小球、水缸）由 js/data/sprites.js 自己讀；doll（紙娃娃）由 js/doll.js 自己讀（第一次打開長相登記／玩家設定時）。新增的圖照開頭放進對的資料夾就好。
const ASSET_DIRS=[['bg',/^(hall_|home_|place_|map$)/],['npc',/^(grete|joan|silence|yanjin|xiaojun|yanjie|yanxiang|yanmo|ayen)_/],['letter',/^letter/],['item',/^item_/],['wear',/^wear_/],['ui',/^(heart_badge|shop_case|suitcase|loading_\d)$/]];
const ASSET_EXT={map:'jpg'};   // 不是 png 的
function assetPath(k,hd){
  const d=(ASSET_DIRS.find(([,re])=>re.test(k))||[''])[0];
  if(hd&&d==='bg')return 'assets/bg_hd/'+k+'.jpg';
  return 'assets/'+(d?d+'/':'')+k+'.'+(ASSET_EXT[k]||'png');   // 原始碼版讀 png 原圖；發布版（dist/）、遊戲頁的圖由 ASSETS 對照表指到轉好的 WebP（tools/build_single_file.py）
}
;
/* ==== js/data/assets-inline.js ==== */
const ASSETS={"ayen_L_0": "assets/npc/ayen_L_0.webp?h=3a3d8d17", "ayen_L_1": "assets/npc/ayen_L_1.webp?h=d577bb45", "ayen_L_2": "assets/npc/ayen_L_2.webp?h=5676697f", "ayen_L_3": "assets/npc/ayen_L_3.webp?h=c84be131", "ayen_L_4": "assets/npc/ayen_L_4.webp?h=be033890", "ayen_L_5": "assets/npc/ayen_L_5.webp?h=5b7bc9ee", "ayen_L_6": "assets/npc/ayen_L_6.webp?h=3904edef", "ayen_R_0": "assets/npc/ayen_R_0.webp?h=cf2e9894", "ayen_R_1": "assets/npc/ayen_R_1.webp?h=f170fe1b", "ayen_R_2": "assets/npc/ayen_R_2.webp?h=9098b1ba", "ayen_R_3": "assets/npc/ayen_R_3.webp?h=e27c628f", "ayen_R_4": "assets/npc/ayen_R_4.webp?h=a5cc6476", "ayen_R_5": "assets/npc/ayen_R_5.webp?h=64470104", "ayen_R_6": "assets/npc/ayen_R_6.webp?h=71ee8a19", "ayen_face": "assets/npc/ayen_face.webp?h=84b28a3f", "grete_L_0": "assets/npc/grete_L_0.webp?h=bc087823", "grete_L_1": "assets/npc/grete_L_1.webp?h=b9fb0b07", "grete_L_2": "assets/npc/grete_L_2.webp?h=f5e95462", "grete_L_3": "assets/npc/grete_L_3.webp?h=289ccff4", "grete_L_4": "assets/npc/grete_L_4.webp?h=ae782571", "grete_L_5": "assets/npc/grete_L_5.webp?h=bdfb4571", "grete_L_6": "assets/npc/grete_L_6.webp?h=23bd88ca", "grete_R_0": "assets/npc/grete_R_0.webp?h=ff07a271", "grete_R_1": "assets/npc/grete_R_1.webp?h=5856c7e9", "grete_R_2": "assets/npc/grete_R_2.webp?h=69aa4e14", "grete_R_3": "assets/npc/grete_R_3.webp?h=87d2a4f0", "grete_R_4": "assets/npc/grete_R_4.webp?h=eb651b2d", "grete_R_5": "assets/npc/grete_R_5.webp?h=60f3e451", "grete_R_6": "assets/npc/grete_R_6.webp?h=6735d207", "grete_face": "assets/npc/grete_face.webp?h=26b4bd51", "joan_L_0": "assets/npc/joan_L_0.webp?h=b7d47a17", "joan_L_1": "assets/npc/joan_L_1.webp?h=da19064a", "joan_L_2": "assets/npc/joan_L_2.webp?h=112f0361", "joan_L_3": "assets/npc/joan_L_3.webp?h=601f8a47", "joan_L_4": "assets/npc/joan_L_4.webp?h=f390ada5", "joan_L_5": "assets/npc/joan_L_5.webp?h=c1fb57e3", "joan_L_6": "assets/npc/joan_L_6.webp?h=0811576c", "joan_L_acc": "assets/npc/joan_L_acc.webp?h=f9a8bdef", "joan_R_0": "assets/npc/joan_R_0.webp?h=e93f36d6", "joan_R_1": "assets/npc/joan_R_1.webp?h=e5911d44", "joan_R_2": "assets/npc/joan_R_2.webp?h=a447a7cc", "joan_R_3": "assets/npc/joan_R_3.webp?h=99a772c1", "joan_R_4": "assets/npc/joan_R_4.webp?h=854e1555", "joan_R_5": "assets/npc/joan_R_5.webp?h=1fffbeb9", "joan_R_6": "assets/npc/joan_R_6.webp?h=790800b6", "joan_R_acc": "assets/npc/joan_R_acc.webp?h=f493ab9e", "joan_face": "assets/npc/joan_face.webp?h=9ae746ac", "silence_L_0": "assets/npc/silence_L_0.webp?h=f57d9455", "silence_L_1": "assets/npc/silence_L_1.webp?h=b5f143a2", "silence_L_2": "assets/npc/silence_L_2.webp?h=3db2b6c2", "silence_L_3": "assets/npc/silence_L_3.webp?h=ffb2bb02", "silence_L_4": "assets/npc/silence_L_4.webp?h=2bf16306", "silence_L_5": "assets/npc/silence_L_5.webp?h=1f3e9ee7", "silence_L_6": "assets/npc/silence_L_6.webp?h=e393f785", "silence_L_acc": "assets/npc/silence_L_acc.webp?h=4a01c1b3", "silence_R_0": "assets/npc/silence_R_0.webp?h=98872656", "silence_R_1": "assets/npc/silence_R_1.webp?h=7ea96075", "silence_R_2": "assets/npc/silence_R_2.webp?h=b7a30ce2", "silence_R_3": "assets/npc/silence_R_3.webp?h=5065b910", "silence_R_4": "assets/npc/silence_R_4.webp?h=7dc7ec90", "silence_R_5": "assets/npc/silence_R_5.webp?h=bae280eb", "silence_R_6": "assets/npc/silence_R_6.webp?h=0c5098e6", "silence_R_acc": "assets/npc/silence_R_acc.webp?h=642b275a", "silence_face": "assets/npc/silence_face.webp?h=984797f7", "xiaojun_L_0": "assets/npc/xiaojun_L_0.webp?h=999d999b", "xiaojun_L_1": "assets/npc/xiaojun_L_1.webp?h=4bb79ea6", "xiaojun_L_2": "assets/npc/xiaojun_L_2.webp?h=52ace92c", "xiaojun_L_3": "assets/npc/xiaojun_L_3.webp?h=03147341", "xiaojun_L_4": "assets/npc/xiaojun_L_4.webp?h=2d4c758b", "xiaojun_L_5": "assets/npc/xiaojun_L_5.webp?h=c8b7633a", "xiaojun_L_acc": "assets/npc/xiaojun_L_acc.webp?h=76b6bcb5", "xiaojun_R_0": "assets/npc/xiaojun_R_0.webp?h=1d82d212", "xiaojun_R_1": "assets/npc/xiaojun_R_1.webp?h=609dd5f4", "xiaojun_R_2": "assets/npc/xiaojun_R_2.webp?h=6a3ed78a", "xiaojun_R_3": "assets/npc/xiaojun_R_3.webp?h=582e4ea6", "xiaojun_R_4": "assets/npc/xiaojun_R_4.webp?h=06760eda", "xiaojun_R_5": "assets/npc/xiaojun_R_5.webp?h=fd059103", "xiaojun_R_acc": "assets/npc/xiaojun_R_acc.webp?h=bd2038ff", "xiaojun_face": "assets/npc/xiaojun_face.webp?h=21601aee", "yanjie_L_0": "assets/npc/yanjie_L_0.webp?h=69acbb1b", "yanjie_L_1": "assets/npc/yanjie_L_1.webp?h=4750157d", "yanjie_L_2": "assets/npc/yanjie_L_2.webp?h=57d6a2e1", "yanjie_L_3": "assets/npc/yanjie_L_3.webp?h=362902a9", "yanjie_L_4": "assets/npc/yanjie_L_4.webp?h=3827d85b", "yanjie_L_5": "assets/npc/yanjie_L_5.webp?h=8cb4e90f", "yanjie_L_6": "assets/npc/yanjie_L_6.webp?h=32e4f2be", "yanjie_L_acc": "assets/npc/yanjie_L_acc.webp?h=aeccdacc", "yanjie_R_0": "assets/npc/yanjie_R_0.webp?h=c5ffa600", "yanjie_R_1": "assets/npc/yanjie_R_1.webp?h=5baa0de1", "yanjie_R_2": "assets/npc/yanjie_R_2.webp?h=cffa2ee1", "yanjie_R_3": "assets/npc/yanjie_R_3.webp?h=29c0a9d8", "yanjie_R_4": "assets/npc/yanjie_R_4.webp?h=f28d117b", "yanjie_R_5": "assets/npc/yanjie_R_5.webp?h=a3375504", "yanjie_R_6": "assets/npc/yanjie_R_6.webp?h=df27418e", "yanjie_R_acc": "assets/npc/yanjie_R_acc.webp?h=e2a582db", "yanjie_face": "assets/npc/yanjie_face.webp?h=53a0f75f", "yanjin_L_0": "assets/npc/yanjin_L_0.webp?h=51d1dbc5", "yanjin_L_1": "assets/npc/yanjin_L_1.webp?h=5203cccc", "yanjin_L_2": "assets/npc/yanjin_L_2.webp?h=ba6e6805", "yanjin_L_3": "assets/npc/yanjin_L_3.webp?h=51d1dbc5", "yanjin_L_4": "assets/npc/yanjin_L_4.webp?h=5af02fae", "yanjin_L_5": "assets/npc/yanjin_L_5.webp?h=54d0880c", "yanjin_L_6": "assets/npc/yanjin_L_6.webp?h=cd4f548d", "yanjin_R_0": "assets/npc/yanjin_R_0.webp?h=3c004fe4", "yanjin_R_1": "assets/npc/yanjin_R_1.webp?h=b8c29a82", "yanjin_R_2": "assets/npc/yanjin_R_2.webp?h=d5b8012e", "yanjin_R_3": "assets/npc/yanjin_R_3.webp?h=3c004fe4", "yanjin_R_4": "assets/npc/yanjin_R_4.webp?h=61497651", "yanjin_R_5": "assets/npc/yanjin_R_5.webp?h=d7661faa", "yanjin_R_6": "assets/npc/yanjin_R_6.webp?h=b5c54d0c", "yanjin_face": "assets/npc/yanjin_face.webp?h=bb16476c", "yanmo_L_0": "assets/npc/yanmo_L_0.webp?h=74d46569", "yanmo_L_1": "assets/npc/yanmo_L_1.webp?h=66cb4b3e", "yanmo_L_2": "assets/npc/yanmo_L_2.webp?h=431feea1", "yanmo_L_3": "assets/npc/yanmo_L_3.webp?h=5ea08cc0", "yanmo_L_4": "assets/npc/yanmo_L_4.webp?h=fad8ea15", "yanmo_L_5": "assets/npc/yanmo_L_5.webp?h=fb77ca54", "yanmo_L_6": "assets/npc/yanmo_L_6.webp?h=5071c404", "yanmo_R_0": "assets/npc/yanmo_R_0.webp?h=d7564e5b", "yanmo_R_1": "assets/npc/yanmo_R_1.webp?h=833993c4", "yanmo_R_2": "assets/npc/yanmo_R_2.webp?h=d4fc60c8", "yanmo_R_3": "assets/npc/yanmo_R_3.webp?h=91a6fe27", "yanmo_R_4": "assets/npc/yanmo_R_4.webp?h=4000a9a3", "yanmo_R_5": "assets/npc/yanmo_R_5.webp?h=45319ff1", "yanmo_R_6": "assets/npc/yanmo_R_6.webp?h=b06ea665", "yanmo_face": "assets/npc/yanmo_face.webp?h=7d798399", "yanxiang_L_0": "assets/npc/yanxiang_L_0.webp?h=400c722c", "yanxiang_L_1": "assets/npc/yanxiang_L_1.webp?h=95be5684", "yanxiang_L_2": "assets/npc/yanxiang_L_2.webp?h=cf9083b5", "yanxiang_L_3": "assets/npc/yanxiang_L_3.webp?h=575f92c3", "yanxiang_L_4": "assets/npc/yanxiang_L_4.webp?h=5574c7ee", "yanxiang_L_5": "assets/npc/yanxiang_L_5.webp?h=56e7e072", "yanxiang_L_6": "assets/npc/yanxiang_L_6.webp?h=d5029a13", "yanxiang_L_acc": "assets/npc/yanxiang_L_acc.webp?h=5ecb27c8", "yanxiang_R_0": "assets/npc/yanxiang_R_0.webp?h=53d2268f", "yanxiang_R_1": "assets/npc/yanxiang_R_1.webp?h=dcd6689a", "yanxiang_R_2": "assets/npc/yanxiang_R_2.webp?h=6d57d773", "yanxiang_R_3": "assets/npc/yanxiang_R_3.webp?h=ec53e526", "yanxiang_R_4": "assets/npc/yanxiang_R_4.webp?h=f8e59a69", "yanxiang_R_5": "assets/npc/yanxiang_R_5.webp?h=afa3ecb9", "yanxiang_R_6": "assets/npc/yanxiang_R_6.webp?h=16bf74ec", "yanxiang_R_acc": "assets/npc/yanxiang_R_acc.webp?h=621f62a9", "yanxiang_face": "assets/npc/yanxiang_face.webp?h=32225d75", "hall_2f": "assets/bg/hall_2f.webp?h=3d9e525d", "hall_3f": "assets/bg/hall_3f.webp?h=48ec0e6f", "hall_4f": "assets/bg/hall_4f.webp?h=12a1dc89", "hall_b1": "assets/bg/hall_b1.webp?h=2b42bfc1", "hall_corridor": "assets/bg/hall_corridor.webp?h=53ee1c3d", "hall_lobby": "assets/bg/hall_lobby.webp?h=924899d2", "hall_top": "assets/bg/hall_top.webp?h=c3ec62e1", "home_day": "assets/bg/home_day.webp?h=34c91f5a", "home_night": "assets/bg/home_night.webp?h=d6ff39c9", "home_out": "assets/bg/home_out.webp?h=b2577daf", "home_shelf": "assets/bg/home_shelf.webp?h=61fa5b5f", "map": "assets/bg/map.webp?h=f154d3be", "place_arcade": "assets/bg/place_arcade.webp?h=9cbdb527", "place_avenue": "assets/bg/place_avenue.webp?h=db33d670", "place_avenue_night": "assets/bg/place_avenue_night.webp?h=4ead4f62", "place_boutique": "assets/bg/place_boutique.webp?h=982ffe56", "place_cafe": "assets/bg/place_cafe.webp?h=8aa99f74", "place_community": "assets/bg/place_community.webp?h=05f0e0eb", "place_cvs": "assets/bg/place_cvs.webp?h=a0d29e00", "place_ktv": "assets/bg/place_ktv.webp?h=27f8d4f2", "place_park": "assets/bg/place_park.webp?h=ee7c79c9", "place_park_night": "assets/bg/place_park_night.webp?h=11d8e4ce", "place_plaza": "assets/bg/place_plaza.webp?h=8a3f6ce2", "place_river": "assets/bg/place_river.webp?h=0c9dd026", "place_ruins_in": "assets/bg/place_ruins_in.webp?h=4cc54362", "place_ruins_night": "assets/bg/place_ruins_night.webp?h=29bce6c0", "place_ruins_out": "assets/bg/place_ruins_out.webp?h=acd029a4", "place_shop": "assets/bg/place_shop.webp?h=a39c7dd0", "place_street": "assets/bg/place_street.webp?h=da0ddce7", "place_tank": "assets/bg/place_tank.webp?h=69db51a9", "letter": "assets/letter/letter.webp?h=39c699fc", "letter_farewell": "assets/letter/letter_farewell.webp?h=9ba11fac", "letter_normal": "assets/letter/letter_normal.webp?h=f4f4bce6", "letter_young": "assets/letter/letter_young.webp?h=9976ced8", "item_agent": "assets/item/item_agent.webp?h=13317957", "item_ball": "assets/item/item_ball.webp?h=c22bc9b5", "item_bell": "assets/item/item_bell.webp?h=1e62aa80", "item_bubble": "assets/item/item_bubble.webp?h=64d48ed3", "item_bucket": "assets/item/item_bucket.webp?h=5d97889c", "item_bucket_2": "assets/item/item_bucket_2.webp?h=57702a86", "item_magH": "assets/item/item_magH.webp?h=be90a1e2", "item_magV": "assets/item/item_magV.webp?h=aff5b894", "item_snacks": "assets/item/item_snacks.webp?h=3ae890cf", "item_soup": "assets/item/item_soup.webp?h=552c5153", "item_wand": "assets/item/item_wand.webp?h=e2c4255a", "bg_preview": "assets/larva/bg_preview.webp?h=dec70286", "bg_tank": "assets/larva/bg_tank.webp?h=e106fafb", "bg_tank_glass_1": "assets/larva/bg_tank_glass_1.webp?h=e2a3b407", "bg_tank_glass_2": "assets/larva/bg_tank_glass_2.webp?h=e5673667", "body_close": "assets/larva/body_close.webp?h=9ac863aa", "body_close_L": "assets/larva/body_close_L.webp?h=ed3c36ff", "body_curl": "assets/larva/body_curl.webp?h=05322898", "body_curl_L": "assets/larva/body_curl_L.webp?h=e84913bc", "body_droop": "assets/larva/body_droop.webp?h=62d3b78b", "body_droop_L": "assets/larva/body_droop_L.webp?h=6b840c0a", "body_flat_a": "assets/larva/body_flat_a.webp?h=b01be789", "body_flat_a_L": "assets/larva/body_flat_a_L.webp?h=3047aa65", "body_flat_b": "assets/larva/body_flat_b.webp?h=99b651c5", "body_flat_b_L": "assets/larva/body_flat_b_L.webp?h=e0679432", "body_idle_a": "assets/larva/body_idle_a.webp?h=7690dabb", "body_idle_a_L": "assets/larva/body_idle_a_L.webp?h=38a5ff34", "body_idle_b": "assets/larva/body_idle_b.webp?h=208eca52", "body_idle_b_L": "assets/larva/body_idle_b_L.webp?h=0280a6fe", "body_open_a": "assets/larva/body_open_a.webp?h=690f0016", "body_open_a_L": "assets/larva/body_open_a_L.webp?h=80f7bde7", "body_open_b": "assets/larva/body_open_b.webp?h=fd75079d", "body_open_b_L": "assets/larva/body_open_b_L.webp?h=0336b328", "body_reach_a": "assets/larva/body_reach_a.webp?h=ed8368a0", "body_reach_a_L": "assets/larva/body_reach_a_L.webp?h=9bb340c6", "body_reach_b": "assets/larva/body_reach_b.webp?h=bf56d08e", "body_reach_b_L": "assets/larva/body_reach_b_L.webp?h=833afda3", "body_rest": "assets/larva/body_rest.webp?h=f1fd9d83", "body_rest_L": "assets/larva/body_rest_L.webp?h=c6c1fb93", "core_glow": "assets/larva/core_glow.webp?h=a20ff8ba", "core_mask": "assets/larva/core_mask.webp?h=1b6e66a4", "deco_castle": "assets/larva/deco_castle.webp?h=cfc8f701", "deco_coral": "assets/larva/deco_coral.webp?h=ebf9bf9a", "deco_shell": "assets/larva/deco_shell.webp?h=ab56fcf9", "scar_1": "assets/larva/scar_1.webp?h=1aa49132", "doll/ahoge_1": "assets/doll/ahoge_1.webp?h=d12b15c9", "doll/ahoge_2": "assets/doll/ahoge_2.webp?h=71f174f4", "doll/ahoge_3": "assets/doll/ahoge_3.webp?h=6a70f2e4", "doll/ahoge_4": "assets/doll/ahoge_4.webp?h=08d85981", "doll/ahoge_5": "assets/doll/ahoge_5.webp?h=d26ac353", "doll/ahoge_6": "assets/doll/ahoge_6.webp?h=749cce60", "doll/ahoge_7": "assets/doll/ahoge_7.webp?h=e0255c9e", "doll/back_1": "assets/doll/back_1.webp?h=c0939bff", "doll/back_10": "assets/doll/back_10.webp?h=d5c045b4", "doll/back_11": "assets/doll/back_11.webp?h=d7629237", "doll/back_12": "assets/doll/back_12.webp?h=82680218", "doll/back_13": "assets/doll/back_13.webp?h=a7cefaff", "doll/back_14": "assets/doll/back_14.webp?h=e3f016d3", "doll/back_2": "assets/doll/back_2.webp?h=d362bf15", "doll/back_3": "assets/doll/back_3.webp?h=5f033ae0", "doll/back_4": "assets/doll/back_4.webp?h=226febe5", "doll/back_5": "assets/doll/back_5.webp?h=61ee3a98", "doll/back_6": "assets/doll/back_6.webp?h=83e493e1", "doll/back_7": "assets/doll/back_7.webp?h=fde603dd", "doll/back_8": "assets/doll/back_8.webp?h=32b63ecf", "doll/back_9": "assets/doll/back_9.webp?h=afb77a01", "doll/body": "assets/doll/body.webp?h=23eae519", "doll/brow_1": "assets/doll/brow_1.webp?h=95d2351f", "doll/brow_10": "assets/doll/brow_10.webp?h=1aab46dd", "doll/brow_11": "assets/doll/brow_11.webp?h=db603fe3", "doll/brow_2": "assets/doll/brow_2.webp?h=2d40846e", "doll/brow_3": "assets/doll/brow_3.webp?h=b7619cd5", "doll/brow_4": "assets/doll/brow_4.webp?h=25483e0f", "doll/brow_5": "assets/doll/brow_5.webp?h=c8bd9599", "doll/brow_6": "assets/doll/brow_6.webp?h=9291412b", "doll/brow_7": "assets/doll/brow_7.webp?h=368976e6", "doll/brow_8": "assets/doll/brow_8.webp?h=40bbe162", "doll/brow_9": "assets/doll/brow_9.webp?h=2005e12b", "doll/ear_1": "assets/doll/ear_1.webp?h=b1265c0e", "doll/ear_2": "assets/doll/ear_2.webp?h=7ccca347", "doll/eye_1": "assets/doll/eye_1.webp?h=06fbba89", "doll/eye_10": "assets/doll/eye_10.webp?h=53d2aca5", "doll/eye_11": "assets/doll/eye_11.webp?h=de9c666a", "doll/eye_12": "assets/doll/eye_12.webp?h=7c27dc44", "doll/eye_13": "assets/doll/eye_13.webp?h=77a0b691", "doll/eye_14": "assets/doll/eye_14.webp?h=a0ab32b1", "doll/eye_15": "assets/doll/eye_15.webp?h=a41b607a", "doll/eye_16": "assets/doll/eye_16.webp?h=9f4822d7", "doll/eye_17": "assets/doll/eye_17.webp?h=e222fd2b", "doll/eye_18": "assets/doll/eye_18.webp?h=1d72b90f", "doll/eye_2": "assets/doll/eye_2.webp?h=a00e87bc", "doll/eye_3": "assets/doll/eye_3.webp?h=c713000d", "doll/eye_4": "assets/doll/eye_4.webp?h=eeeae37b", "doll/eye_5": "assets/doll/eye_5.webp?h=ec83d012", "doll/eye_6": "assets/doll/eye_6.webp?h=552e3a81", "doll/eye_7": "assets/doll/eye_7.webp?h=15fa2e85", "doll/eye_8": "assets/doll/eye_8.webp?h=b9e80d46", "doll/eye_9": "assets/doll/eye_9.webp?h=0501d06a", "doll/fan_blue": "assets/doll/fan_blue.webp?h=c547b334", "doll/fan_grey": "assets/doll/fan_grey.webp?h=3a986be6", "doll/fan_purple": "assets/doll/fan_purple.webp?h=f1c231f8", "doll/fan_white": "assets/doll/fan_white.webp?h=e586611e", "doll/fan_yellow": "assets/doll/fan_yellow.webp?h=e1ab43a3", "doll/front_1": "assets/doll/front_1.webp?h=bd809e65", "doll/front_2": "assets/doll/front_2.webp?h=cf96e1b7", "doll/front_3": "assets/doll/front_3.webp?h=50ba9cbb", "doll/front_4": "assets/doll/front_4.webp?h=20c85cf8", "doll/front_5": "assets/doll/front_5.webp?h=0db65571", "doll/front_6": "assets/doll/front_6.webp?h=a60b13b8", "doll/front_7": "assets/doll/front_7.webp?h=39708aec", "doll/front_8": "assets/doll/front_8.webp?h=a52c144b", "doll/glass_square": "assets/doll/glass_square.webp?h=a3e9ea02", "doll/glass_sun": "assets/doll/glass_sun.webp?h=b3bac17f", "doll/glass_trend": "assets/doll/glass_trend.webp?h=7a011c90", "doll/hl_0": "assets/doll/hl_0.webp?h=c41987cc", "doll/hl_1": "assets/doll/hl_1.webp?h=6bd8cf29", "doll/hl_11": "assets/doll/hl_11.webp?h=fb1df89c", "doll/hl_14": "assets/doll/hl_14.webp?h=cb59afd1", "doll/hl_15": "assets/doll/hl_15.webp?h=6a1729c2", "doll/mouth_1": "assets/doll/mouth_1.webp?h=9a9ddcbf", "doll/mouth_10": "assets/doll/mouth_10.webp?h=c2ce1bbc", "doll/mouth_11": "assets/doll/mouth_11.webp?h=8534f6b0", "doll/mouth_12": "assets/doll/mouth_12.webp?h=95a35ea7", "doll/mouth_2": "assets/doll/mouth_2.webp?h=5a86b971", "doll/mouth_3": "assets/doll/mouth_3.webp?h=32841f9a", "doll/mouth_4": "assets/doll/mouth_4.webp?h=9f46162d", "doll/mouth_5": "assets/doll/mouth_5.webp?h=bda96230", "doll/mouth_6": "assets/doll/mouth_6.webp?h=f7b77ca8", "doll/mouth_7": "assets/doll/mouth_7.webp?h=1eb42bbf", "doll/mouth_8": "assets/doll/mouth_8.webp?h=b42ab010", "doll/mouth_9": "assets/doll/mouth_9.webp?h=f0c7d5ef", "doll/pants_1": "assets/doll/pants_1.webp?h=a6885a6f", "doll/pants_long": "assets/doll/pants_long.webp?h=b92e22c8", "doll/pants_short": "assets/doll/pants_short.webp?h=dd00487c", "doll/shoes_1": "assets/doll/shoes_1.webp?h=61d89052", "doll/shoes_slipper": "assets/doll/shoes_slipper.webp?h=06ae5860", "doll/shoes_sneaker": "assets/doll/shoes_sneaker.webp?h=92d1a5e0", "doll/sideL_3": "assets/doll/sideL_3.webp?h=19a19f8e", "doll/sideL_4": "assets/doll/sideL_4.webp?h=64513a88", "doll/sideL_5": "assets/doll/sideL_5.webp?h=7ddc398e", "doll/sideL_6": "assets/doll/sideL_6.webp?h=da963bc2", "doll/sideL_7": "assets/doll/sideL_7.webp?h=abaf1fb7", "doll/sideL_8": "assets/doll/sideL_8.webp?h=15dbdf60", "doll/sideR_2": "assets/doll/sideR_2.webp?h=bf8c16cd", "doll/sideR_3": "assets/doll/sideR_3.webp?h=8f4de59c", "doll/sideR_4": "assets/doll/sideR_4.webp?h=33d8c8fc", "doll/sideR_5": "assets/doll/sideR_5.webp?h=0ff6393c", "doll/sideR_6": "assets/doll/sideR_6.webp?h=04d7a6cf", "doll/sideR_7": "assets/doll/sideR_7.webp?h=669eee87", "doll/sideR_8": "assets/doll/sideR_8.webp?h=65b6d591", "doll/skirt_long": "assets/doll/skirt_long.webp?h=5326174a", "doll/skirt_short": "assets/doll/skirt_short.webp?h=f72e5129", "doll/socks_long": "assets/doll/socks_long.webp?h=48dda55d", "doll/socks_short": "assets/doll/socks_short.webp?h=b04b140f", "doll/socks_tights": "assets/doll/socks_tights.webp?h=c27d2b0f", "doll/tie_1": "assets/doll/tie_1.webp?h=c0d72886", "doll/tie_10": "assets/doll/tie_10.webp?h=8674204e", "doll/tie_2": "assets/doll/tie_2.webp?h=c15bf5c9", "doll/tie_3": "assets/doll/tie_3.webp?h=5032487c", "doll/tie_4": "assets/doll/tie_4.webp?h=45575512", "doll/tie_5": "assets/doll/tie_5.webp?h=7100e3f2", "doll/tie_6": "assets/doll/tie_6.webp?h=900981d9", "doll/tie_7": "assets/doll/tie_7.webp?h=ac105cd2", "doll/tie_8": "assets/doll/tie_8.webp?h=e5388021", "doll/tie_9": "assets/doll/tie_9.webp?h=dbc57c73", "doll/top_1": "assets/doll/top_1.webp?h=856b1be1", "doll/top_crop": "assets/doll/top_crop.webp?h=aa69a79b", "doll/top_shirt": "assets/doll/top_shirt.webp?h=79b8808c", "doll/top_tank": "assets/doll/top_tank.webp?h=138de409", "doll/top_tankS": "assets/doll/top_tankS.webp?h=9e472c90", "doll/top_tee": "assets/doll/top_tee.webp?h=542cab4c", "wear_bandaid": "assets/wear/wear_bandaid.webp?h=b89d4c3c", "wear_blackcat": "assets/wear/wear_blackcat.webp?h=3f4518c4", "wear_bolts": "assets/wear/wear_bolts.webp?h=b8f88664", "wear_bow": "assets/wear/wear_bow.webp?h=2a0fa956", "wear_bowtie": "assets/wear/wear_bowtie.webp?h=3264115b", "wear_bunny": "assets/wear/wear_bunny.webp?h=63569836", "wear_catears": "assets/wear/wear_catears.webp?h=a4b6844d", "wear_clipeq": "assets/wear/wear_clipeq.webp?h=9fbf196c", "wear_clipx": "assets/wear/wear_clipx.webp?h=f3df3bc8", "wear_coin": "assets/wear/wear_coin.webp?h=aad36e72", "wear_cross": "assets/wear/wear_cross.webp?h=d3ab1d25", "wear_detective": "assets/wear/wear_detective.webp?h=51ec9af4", "wear_devil": "assets/wear/wear_devil.webp?h=dda329db", "wear_dododo": "assets/wear/wear_dododo.webp?h=70ae2a62", "wear_eyepatch": "assets/wear/wear_eyepatch.webp?h=6463df86", "wear_foxmask": "assets/wear/wear_foxmask.webp?h=216c6ef5", "wear_glowstick": "assets/wear/wear_glowstick.webp?h=50f37882", "wear_glowstick_glow": "assets/wear/wear_glowstick_glow.webp?h=b5ba5829", "wear_gogogo": "assets/wear/wear_gogogo.webp?h=1bcda762", "wear_goldglasses": "assets/wear/wear_goldglasses.webp?h=9fbd909b", "wear_hearts": "assets/wear/wear_hearts.webp?h=d1b9603e", "wear_minilarva": "assets/wear/wear_minilarva.webp?h=3457602b", "wear_phone": "assets/wear/wear_phone.webp?h=37b8cc56", "wear_puppy": "assets/wear/wear_puppy.webp?h=7d21d20e", "wear_satchel": "assets/wear/wear_satchel.webp?h=d12de0f9", "wear_shades": "assets/wear/wear_shades.webp?h=64fddc99", "wear_shushu": "assets/wear/wear_shushu.webp?h=4f023f07", "wear_snake": "assets/wear/wear_snake.webp?h=d10ee637", "wear_sparkle": "assets/wear/wear_sparkle.webp?h=dec1879c", "wear_squareglasses": "assets/wear/wear_squareglasses.webp?h=7d6a640c", "wear_tie": "assets/wear/wear_tie.webp?h=856c1702", "wear_wings": "assets/wear/wear_wings.webp?h=77c3c583", "heart_badge": "assets/ui/heart_badge.webp?h=c2a11a1b", "loading_1": "assets/ui/loading_1.webp?h=e1ad5a06", "loading_2": "assets/ui/loading_2.webp?h=af31eb6e", "loading_3": "assets/ui/loading_3.webp?h=6bff1bee", "shop_case": "assets/ui/shop_case.webp?h=3d1ade40", "suitcase": "assets/ui/suitcase.webp?h=318b88c5", "__hd": true};
;
/* ==== js/data/version.js ==== */
// 【資料】版本號（顯示在畫面左上角，第 N 日的左邊）。更新遊戲時改這裡就好。
const VERSION='0.40.69';
;
/* ==== js/data/grete.js ==== */
// 【資料】格蕾特（出門遇見的小助手 NPC）。頭像圖片：assets/npc/grete_L_0.png、grete_L_4.png（200×200，顯示時縮小）。用在事件／提示框上方，（按鈕上不放圖）。
// 內嵌預覽版由 tools/build_single_file.py 把圖片打包進去；想換圖就直接換掉 assets/npc/grete_L_0.png。
const GRETE_IMG='grete_L_0';   // v0.40.4 起是圖名（showEvent 會描白邊）
const GRETE_IMG2='grete_L_4';   // 樂（裙角觸肢的版本是 grete_L_6，只用在遇見格蕾特第 3 頁、大廳被戳第 1 句）
// 小助手每天結算前的判斷門檻（飽食、水質）
const GRETE_RULE={waterDirt:20,waterPh:1.0,feedBelow:60,hungryBelow:50,maxFeeds:3};
// 出門遇見的機率：每次 20%；第 4 次出門起一定會遇見
const GRETE_MEET={chance:.2,sure:4,again:.3};   // again：見過面但拒絕之後，每次出門再遇到的機率
;
/* ==== js/data/chat.js ==== */
// 【資料】聊天染色的規則（「聊天」鍵）
// need：同一個顏色要聊幾次才會染上｜near：兩次選的顏色 RGB 距離小於這個值，就算同一個顏色｜event：認識格蕾特後，每次出門遇到「聊顏色」或「雙色」事件的機率（各自獨立判定）
const CHAT_RULE={need:3,near:70,event:.3};
;
/* ==== js/data/assoc.js ==== */
// 【資料】異種生活平均改善協會（異生協）：交還小球換積分
// returnPts：每交還一隻已完成培養的小球，基本得到的積分（之後用來逛商店）
// tagPts：小球身上每個標籤額外加的積分（比較難養的標籤多一點；0＝不加）。小球真正擁有的標籤都算，沒發現的也算。
const ASSOC={returnPts:10,
  tagPts:{
    frail:6,      // 虛弱：不好的狀況傷得更重，最難養
    glutton:3,    // 貪吃鬼：餓得快，要準備更多食物
    scholar:3,    // 學者：玩耍信賴減半，比較難親近
    sneak:3,      // 偷偷七逃：常常溜出去，比較費心
    clean:2,      // 愛乾淨：水髒了會悶悶不樂
    judge:1,      // 鑑賞家
    touchy:1,     // 喜歡觸碰
    playful:1,    // 貪玩
    lovey:1,      // 人類愛好者
    vain:1,       // 愛美
    smalleat:2,   // 不愛吃：每次吃得少，要多餵幾次
    high:1,       // 高高在上
    homereturn:0  // 回歸者：開局就有信賴，比較好養
  }};
;
/* ==== js/data/souvenirs.js ==== */
// 【資料】小球送的禮物（紀念品）。名稱、送禮當下的描述、圖鑑說明在 js/data/texts.js 的 TEXT.souv。
// 來源：個性（每種個性一種）或標籤。禮物只記「收到幾次」，存在 META.souv，跨周目保留，列表在「收藏 → 禮物」。
const SOUV_SRC={
  weedWave:['temper','lively'],  weedHead:['temper','shy'],
  stoneTerritory:['temper','stubborn'], stoneSleep:['temper','sleepy'],
  bubbleSurprise:['temper','curious'],  bubbleCling:['temper','clingy'],
  stoneRoute:['temper','helper'], bubbleCopy:['temper','mimic'],
  gem:['tag','judge'], toy:['tag','playful'], halfFood:['tag','glutton'], massage:['tag','touchy'],
  shed:['tag','frail'], shell:['tag','lovey'], pebble:['tag','clean'],
  mirror:['tag','vain'], saved:['tag','smalleat'], surface:['tag','high'],
  note:['tag','scholar'], oldPiece:['tag','homereturn'], outSand:['tag','sneak'], outFeather:['tag','sneak'], outBead:['tag','sneak'], outGrass:['tag','sneak'], outGlass:['tag','sneak'], outCoin:['tag','sneak'],   // 偷偷七逃：每次隨機帶回其中一種
  letter:['grad','letter']   // 畢業小球的信紙（js/letters.js；不是在養的小球送的）
};
// 送禮的規則：每天換日時判斷。信賴要夠高才會送（26＝正常照顧、第 3 日差不多就會到的程度，大約是剛脫離「戒備」）；個性禮物與標籤禮物各自擲骰（每天最多 2 份）
const SOUV_RULE={trust:26,temper:.3,tag:.2,maxPerDay:2,
  sneak:.35,        // 偷偷七逃：每天換日溜出去的機率（發現之前，第 4 日起一定會溜出去）
  sneakGift:.6};    // 溜出去回來時帶禮物的機率
;
/* ==== js/data/texts.js ==== */
// 【資料】遊戲中「顯示給玩家看的文字」都集中在這裡。要改文字、潤飾、翻譯，只要動這個檔案，不必碰規則程式。
// （結局文字在 endings.js、說明頁在 about.js、物品名稱在 items.js）
// 小規則：
//  - {item}、{name} 這種大括號是「待填空位」，程式會用 fmt() 代入。
//  - {larva}＝這句話的主角小球，顯示時換成名字（平常是這一輪的小球；同伴被戳、玩耍、觀察水缸時是那一隻）。「幼體」就只是一般名詞，不會被換掉。
const TEXT={
  // ---- 個性：名字、說明（滑鼠移上去或點一下會顯示）、每天開始的狀態描述（mood）、
  //      餵到喜歡零食（feedFav，{item}）、玩到喜歡玩具（playFav，{item}）、成為同伴飄進水缸時（join，{name}）----
  temper:{
    clingy:{name:'黏人',desc:'喜歡靠近你。被戳時會游過來貼著你，互動後信賴成長特別快。',
      mood:'{larva}貼著玻璃，看著你這一側。',
      feedFav:'一看見{item}，{larva}立刻朝你這邊游來，觸肢把食物圈住。吃到一半，牠還會抬起一條觸肢碰一下你的方向，像是想確認你也在。',
      playFav:'{larva}把{item}緊緊抱著，特地游到靠近你的一側，像是想和你一起玩。',
      join:'{name}才剛飄進水缸，便立刻往新的同伴游過去，繞著對方游了半圈。現在他不僅有你還有新同伴，超開心！'},
    shy:{name:'害羞',desc:'慢吞吞又怕生。被戳時會躲到角落，信賴成長較慢。',
      mood:'{larva}躲在水草旁偷偷看你。',
      feedFav:'{larva}躲在水草後面觀察{item}，過了好一會兒才伸出一條觸肢把食物拉近。吃完後，牠又迅速縮回水草旁，只留下幾條觸肢悄悄晃動。',
      playFav:'{larva}躲在水草邊，伸出一條觸肢碰了碰{item}。玩具一動就立刻縮回去……但好像很喜歡，沒多久便出來了。',
      join:'{name}飄進水缸後立刻縮成一小團，躲到水草後面。偷偷看著新的同伴。'},
    curious:{name:'好奇',desc:'對什麼都想碰一碰，游得比較快。被戳時會停下來朝你揮觸肢，適合走探索路線。',
      mood:'{larva}在缸裡四處亂游，觸肢摸遍每個角落。',
      feedFav:'{larva}立刻湊到{item}旁邊，先從上到下摸了一遍，又用觸肢輕輕翻動它。確認這是喜歡的味道後，牠才把食物一點一點包進核心。',
      playFav:'{larva}興奮地碰了碰{item}，接著從不同方向繞著它游。看來是很喜歡的，還抱著游去水缸另一邊。',
      join:'{name}才進入水缸便好奇地轉了圈，看到有不認識的新同伴，更快樂了。'},
    stubborn:{name:'頑固',desc:'有自己的角落，平常就待在附近。被戳會背過身去，別的小球靠近還會輕輕撞開對方。看似不愛理人，但遇到真正喜歡的東西，信賴成長最快。',
      mood:'{larva}待在自己的角落，背對著你，卻偷偷留意著動靜。',
      feedFav:'{larva}裝作毫不在意{item}，直到食物被放到牠熟悉的角落，牠才慢吞吞地伸出觸肢拉過去，把食物藏到自己懷裡。',
      playFav:'{larva}像是對{item}完全不感興趣，直到你準備把玩具收走時，才忽然伸出觸肢勾住不放，接著把玩具拖回自己的角落，若無其事地停了下來。',
      join:'{name}一進入水缸便找了個喜歡的角落，像是一個小地主……倒是對新同伴沒什麼反應。'},
    lively:{name:'活潑',desc:'游得最快，愛翻滾，會追著水裡的泡泡跑。被戳時會原地轉圈圈。',
      mood:'{larva}在水裡翻來滾去，追著泡泡玩。',
      feedFav:'{larva}像一顆小彈珠似地衝向{item}，把食物圈住後又開心地翻了半圈，吃得又快又急。',
      playFav:'{larva}一碰到{item}就立刻翻身，追著玩具在水缸裡繞著。好嗨好嗨。',
      join:'{name}剛飄進水缸就興沖沖地往新同伴的位置衝過去，繞著對方快速游了好幾圈。但牠很快又發現了附近的泡泡，轉向追了過去。'},
    sleepy:{name:'睏睏',desc:'整天懶洋洋，常常貼在缸底休息。被戳時只會慢慢伸展觸肢，轉個方向又睡回去；遇到喜歡的東西，倒是願意多醒一會兒。',
      mood:'{larva}安安靜靜地貼在缸底，觸肢鬆鬆地攤開。水流經過時，身體才跟著輕輕晃一下。',
      feedFav:'原本貼在缸底的{larva}忽然醒了過來，慢慢把{item}圈進觸肢裡，牠吃得不急，非常優雅。',
      playFav:'{larva}先是懶懶地碰了碰{item}，接著把觸肢搭在上面，像是決定把玩具當成枕頭。過了一會兒，牠竟然就這樣抱著它睡著了。',
      join:'{name}飄進水缸後……決定先睡覺。他好像有注意到新同伴，但沒有比那顆適合當枕頭的小石子吸引他。'},
    // v0.28 新個性（名稱暫定，文字是初稿）
    helper:{name:'守序',desc:'有自己固定的巡邏路線。看到小球相撞，就會游過去想幫忙——結果常常撞成一團。',
      mood:'{larva}沿著固定的路線在水缸裡繞了一圈，像在巡邏，確認每個角落都沒問題。',
      feedFav:'看見{item}，{larva}先繞著食物左右查看，確定沒有問題，才開心地把它圈進觸肢裡。',
      playFav:'{larva}捲著{item}沿著巡邏路線繞了一圈，好像在帶它認識環境。',
      join:'{name}一飄進水缸，就先沿著缸壁繞了一圈，像是在確認大家都平安。'},
    mimic:{name:'易染',desc:'會學旁邊小球的動作，最喜歡學守序的小球。水缸裡沒有別的小球時，會學你手指（游標）的動作。',
      mood:'{larva}看著你這一側。你一動，牠也跟著晃了一下。',
      feedFav:'{larva}學著你遞食物的動作晃了晃觸肢，才把{item}圈過去，吃得很認真。',
      playFav:'{larva}學著你的動作搖晃{item}，一下往左、一下往右，玩得很開心。',
      join:'{name}一飄進水缸，就跟在別的小球後面，學牠游泳的樣子。'}
  },
  // ---- 新周目 ----
  start:{
    born:'{larva}在水中輕輕晃動，透明的身體什麼也看不出來。',
    tip:'提示：每天有 2 次行動。換水與餵食不佔行動，但要小心別過度。'
  },
  // ---- 換水 ----
  water:{
    over:'今天換太多次水了，{larva}被嚇到，身體縮成一小球。',
    ok:'換上乾淨的水。水面晃了晃，{larva}慢慢伸出觸肢。'
  },
  // ---- 餵食（海草湯＋零食）----
  feed:{
    pick:'要吃什麼？',
    headMain:'主食（飽足多）',
    headSnack:'零食（飽足少）',
    dislike:'{larva}把{item}推開，縮到缸的另一邊。',
    dislikeEat:'{larva}縮著身體把{item}推了又推，最後餓得受不了，還是勉強吃了一點。',
    full:'{larva}吃得太飽了，硬塞進去後身體脹得圓圓的。',
    soup:'{larva}用觸肢把海草湯一點一點包進核心。',
    fav:'{larva}整個身體彈了一下，用觸肢輕輕碰你的手。（{item}好像很合牠的胃口）',
    ok:'{larva}收下{item}，慢慢吃掉了。'
  },
  // ---- 玩耍 ----
  play:{
    pick:'玩耍',toyHead:'玩具',noToy:'還沒有玩具。出門有機會撿到，也可以在廢棄大樓的商店買。',pvHead:'觀察水缸裡五種玩具都可以玩（不會用掉，也不影響日常的小球）。',
    fav:'{larva}抱著{item}不放，觸肢興奮地一起擺動。',
    meh:'{larva}碰了碰{item}，看起來沒那麼感興趣。'
  },
  // ---- 出門 ----
  out:{
    back:'在{place}逛了一圈，帶回：{list}。',
    empty:'在{place}逛了一圈，空手而回。',
    kit:'你得到了水質檢測儀！現在能看到精確的水質數值了，之後的周目也會一直帶著它。',
    deco:'在外面發現了「{deco}」，已經放進水缸當裝飾！（永久持有）'
  },
  bag:{empty:'空空如也',decorHead:'裝飾',wearHead:'裝扮',wearOn:'戴上',wearOff:'拿下',woreOn:'幫{larva}戴上了{item}。',woreOff:'把{item}拿下來了。'},
  // ---- 外出地圖（地點資料在 js/data/places.js）：name 名牌｜desc 說明｜find 比較容易撿到什麼 ----
  place:{
    assoc:{name:'異生會大樓',desc:'異生會的總部。後勤辦公室可以領取成就、提升心等。',find:'可以逛各樓層（耗 1 行動）。'},
    ruins:{name:'廢棄大樓區',desc:'荒廢的大樓群。照異生會的導航，這裡應該有一家特約商店……',find:'可以用積分換東西（耗 1 行動）。'},
    mall:{name:'商業區',desc:'熱鬧的街道，店家很多。',find:'換水劑、玩具比較多；海草湯比較少。'},
    park:{name:'中央公園',desc:'有噴水池的大公園，水邊長了很多海草。',find:'海草湯、零食比較多；換水劑、玩具比較少。'},
    home:{name:'住所',desc:'你住的地方，在半山腰上。',find:''}
  },
  // ---- 廢棄大樓的商店（言盡）。intro＝第一次去時的事件；items＝商品名字與言盡的介紹（talk）----
  //      pages 的 bg／chr／item 是圖片檔名（只寫檔名；放哪個資料夾見 js/utils.js 的 ASSET_DIRS），name＝角色名牌
  // ---- 異生會大樓（地圖的異生會大樓）：樓層、工作人員對話。資料在 js/data/hall.js ----
  hall:{
    title:'異生會大樓',leave:'離開大樓',arrive:'你來到異生會大樓。',
    floors:{top:'5F',f4:'4F',f3:'3F',f2:'2F',lobby:'1F',b1:'B1'},
    floorName:{top:'董事長辦公室',f4:'研究中心',f3:'後勤辦公室',f2:'實習生辦公室',lobby:'大廳',b1:'特殊任務室'},
    who:{top:'言街',f4:'言巷',f3:'瓊',f2:'賽倫絲',lobby:'格蕾特',b1:'言曉君'},
    needLv:'心等 {n} 開放',
    larvaGot:'（獲得小球給的{item}）',larvaSay:{f2:'「啊！又拿倉庫的東西了嗎？嗯……沒關係，他要送你那就給你啦。」',f3:'「這孩子……喔，放心，問題不大，我記一下數量回報就行了。」',lobby:'「侯～～偷偷摸摸在做什麼呀小壞蛋！」\n揉捏揉捏揉捏揉捏> <！'},
    knownHi:'【{name}】認出了你，開心地揮手打招呼。',
    knownHiTemp:{clingy:'【{name}】認出了你，一路爬過來黏在你腳邊，觸肢揮個不停。',shy:'【{name}】認出了你，先縮了一下，接著小小地揮了揮觸肢。',curious:'【{name}】認出了你，好奇地繞著你轉了一圈，才開心地揮手打招呼。',stubborn:'【{name}】認出了你，背過身去……又偷偷轉回來，揮了一下觸肢。',lively:'【{name}】認出了你，原地轉了好幾圈，開心地揮手打招呼。',sleepy:'【{name}】認出了你，慢吞吞地伸出觸肢揮了揮，又打了個呵欠。',helper:'【{name}】認出了你，精神十足地揮手，好像在說「我現在也有在巡邏喔！」',mimic:'【{name}】認出了你，學你的樣子揮了揮手。'},
    larvaPoke:['小球被戳了一下，彈了起來。','小球扭了扭身體，好像很開心。','小球朝你揮了揮觸肢。'],topLock:'電梯的「4F」「5F」按鈕旁邊貼著一張紙：「非請勿入。」',
    first:[{bg:'hall_lobby',name:'',text:'自動門滑開，冷氣迎面吹來。\n大廳比想像中安靜，櫃檯後面沒有人，只有一台電梯，和一排亮著的樓層按鈕。\n牆上的告示寫著：「委託、成就相關，請洽 3F 後勤辦公室。」',btn:'搭電梯'}],
    lobby:['大廳很安靜，只有電梯偶爾發出「叮」的一聲。','櫃檯上放著一個小小的水草缸，裡面空空的。','公告欄貼著新的義工招募，旁邊還有一張「請勿在大廳奔跑」。'],
    // 1F 的訪客（格蕾特用 lobbyGrete／poke.lobby）：visit＝進大廳看到他時，visitPoke＝戳他，follow＝在 1F 遇到後按他那一層
    visitName:{joan:'瓊',silence:'賽倫絲',xiaojun:'言曉君',yanjin:'言盡'},
    visit:{
      joan:['瓊拿著手機從電梯走出來，被你嚇了一跳，下意識說道：「啊，你、你好！我下來拿東西……」','瓊站在公告欄前，踮著腳貼新的公告，貼歪了又撕下來重貼。','瓊在櫃檯邊等飲料外送，手機螢幕上是某款手遊的抽卡畫面。'],
      silence:['賽倫絲提著兩大袋點心從門口進來：「啊，你好！這是要分給大家的，要拿一個嗎？」','賽倫絲坐在大廳的沙發上飛快地翻著課本，旁邊放著一杯喝到一半的咖啡：「期中考快到了～」','賽倫絲正在幫一位照顧者搬箱子，動作俐落得像搬家公司的老手。'],
      xiaojun:['言曉君站在門口和警衛低聲交談，看到你，輕輕地點了點頭。','言曉君提著一個金屬箱子從外面回來，衣角還沾著一點塵土。','言曉君靠在牆邊看手機，臉上沒什麼表情。'],
      yanjin:['言盡站在大廳正中間，抬頭盯著天花板的燈，一動也不動。','言盡站在電梯前，看著樓層燈一格一格亮起又熄滅。','言盡坐在大廳的沙發上，懷裡抱著一隻小球。\n注意到你，她和小球一起抬起手揮了揮。']
    },
    visitPoke:{
      joan:['「呀！」瓊差點把手機摔了。','「這、這裡是大廳，請不要突然戳我……」她乾巴巴的說，而後覺得不對：「其他地方也不要……」','「剛剛十連抽……什麼都沒有。」瓊的眼神帶著賭博失敗的悲傷。'],
      silence:['「嗯？你今天也來大樓呀，好勤勞！真棒。」','「嘿嘿，被你抓到在摸魚了！」','「今天也辛苦了！」'],
      xiaojun:['言曉君默默地看了你一眼。','「我剛回來。有什麼事嗎？」','「大廳怎麼人這麼多……」'],
      yanjin:['「……唔？」她歪了歪頭。','「燈很亮，喜歡。」','「我不算員工，但是，要來結算積分。」']
    },
    follow:{
      joan:'瓊跟著你一起搭電梯回到 3F，小聲地說：「啊……原來你是來找我的嗎？那、那請坐。」',
      silence:'「啊，原來你是來找我的呀？早說嘛，剛剛在樓下直接跟我說就好了！」賽倫絲笑著回到座位上。',
      xiaojun:'言曉君和你一起搭電梯下到 B1。\n「來找我的？直接開始吧。」'
    },
    lobbyGrete:['格蕾特坐在櫃檯後面，看到你就揮手：「今天我來玩！要去哪一樓呀？」','電梯門一開，格蕾特戴著小帽子站在裡面：「歡迎搭乘～請問要到幾樓呢？」','格蕾特趴在櫃檯上打瞌睡，聽到腳步聲才猛然抬頭：「啊、我沒有在睡覺喔！」'],
    joanFirst:[
      {bg:'hall_3f',chr:'joan_L_5+acc',name:'？？？',text:'3F 的後勤辦公室堆滿了文件。\n一名戴著眼鏡的棕髮女性從文件山後面起身伸懶腰，突然看到你，嚇了一跳似的縮了一下。\n「啊……是、是最近入職的照顧者嗎？我是瓊，負責處理成就獎勵與心等申請。」',btn:'你好'},
      {bg:'hall_3f',chr:'joan_L_0+acc',name:'瓊',text:'她翻出一本厚厚的冊子，小心地攤開：\n「這是異生會的成就紀錄。照顧小球時做到的事都會記在這裡……當達成時就可以來這裡領取積分，還有心。」\n她說完，好像在等你提問。',opts:[{label:'星等？',next:2},{label:'心等？',next:3}]},
      {bg:'hall_3f',chr:'joan_L_5+acc',name:'瓊',text:'「不不不、不是星等……」瓊連忙搖手。\n「其實異種們不太在意星星和等級，當初上頭說要添加評級措施時，他們一致通過重要的是喜不喜歡。所以……是『心』等。」',btn:'原來如此',next:4},
      {bg:'hall_3f',chr:'joan_L_0+acc',name:'瓊',text:'「對，心等！」瓊鬆了一口氣，像是終於有人懂了。\n「異種們看的是喜不喜歡，所以累積的是心。」',btn:'嗯嗯',next:4},
      {bg:'hall_3f',chr:'joan_L_0+acc',name:'瓊',text:'「心累積夠了，就可以來找我升級。心等越高，大家越信任你，能接洽的任務也會越多……當然，有報酬。」\n她小聲地補了一句：「那就……請多指教？」',btn:'請多指教',note:'解鎖成就與心等'}
    ],
    // 4F 言巷、5F 言街（v0.40.59，主線第一章完成後）：第一次見面、心等 5 言巷給積分、平常站著時隨機一句
    yanxiangFirst:[
      {bg:'hall_4f',chr:'yanxiang_L_0+acc',name:'言巷',text:'4F 的研究中心比其他樓層冷了好幾度，一排排儀器低聲運轉著。\n最裡面的工作台前，白髮的研究員戴著眼鏡，盯著螢幕，注意到你走近，簡短的問道：「有事？」',btn:'來看看'},
      {bg:'hall_4f',chr:'yanxiang_L_0+acc',name:'言巷',text:'「看可以，別碰。」\n她敲完最後幾下鍵盤，才轉過椅子看了你一眼：「……喔，是你。那隻幼體狀態如何？」',btn:'還在休養中'},
      {bg:'hall_4f',chr:'yanxiang_L_4+acc',name:'言巷',text:'「嗯。」\n她轉回螢幕，過了幾秒才又補一句：「門禁幫你開了。要來就來，不過別在我做工作的時候問東問西。」',btn:'好',note:'見到了言巷'}
    ],
    yanxiangPt:[
      {bg:'hall_4f',chr:'yanxiang_L_0+acc',name:'言巷',text:'言巷看了一眼你的資料，挑了挑眉。\n「你這段時間的紀錄我看過了，心等 5。」',btn:'……？'},
      {bg:'hall_4f',chr:'yanxiang_L_0+acc',name:'言巷',text:'她從抽屜裡拿出一張卡片，往桌上一推。\n「既然確認你有能力，那就不該再為了出門找不到海草湯或換水劑這種事浪費時間。」\n「拿去。缺什麼直接去找言盡買。」',btn:'謝謝'},
      {bg:'hall_4f',chr:'yanxiang_L_0+acc',name:'言巷',text:'「不用謝。」\n她轉回螢幕，又繼續忙碌了起來。',btn:'收下',note:'獲得 {n} 積分'}
    ],
    yanxiangPtLog:'言巷給了你 {n} 積分。',
    yanjieFirst:[
      {bg:'hall_top',chr:'yanjie_L_0+acc',name:'言街',text:'頂樓的辦公室很安靜，窗邊擺著幾盆長得茂盛（但似乎常被某些小傢伙當攀爬架）的植物。\n桌上，文件疊得整整齊齊，那名戴著眼鏡的黑長髮男人從文件裡抬起頭，溫和地對你微笑。',btn:'打擾了'},
      {bg:'hall_top',chr:'yanjie_L_1+acc',name:'言街',text:'「歡迎。這裡是董事長辦公室，不過董事長人在樓下……她說簽名太花時間了，不如拿去多看幾組數據。」',btn:'辛苦了'},
      {bg:'hall_top',chr:'yanjie_L_4+acc',name:'言街',text:'「哪裡，這樣她才能專心做研究。」\n他起身，整理了一下桌面，空出了一些位置：「累了就上來坐坐吧，這裡的茶還不錯。」',btn:'謝謝',note:'見到了言街'}
    ],
    yanxiang:['言巷盯著螢幕上的數據，手指在桌上敲著某種節奏。','言巷正在調整一台機械手臂，桌上散落著各種螺絲。','言巷靠在椅背上閉目養神，手邊擺著吃完的便當盒。\n飯後三十分鐘的靜態消食，誰都不准吵她。'],
    yanjie:['言街正在一份文件上簽名，字跡端正得像印出來的。','言街靠在窗邊讀詩集，聽見電梯的聲音，抬頭朝你笑了笑。','言街掩著嘴輕輕咳了兩聲，朝你搖搖手：「沒事，老毛病了。」'],
    joan:['瓊抱著一疊文件，小心翼翼地從你身邊經過：「成就列表在那裡，可以直接看。」','瓊正在幫小球們的紀錄蓋章，蓋得整整齊齊。','「今天也辛苦了。」瓊推了推眼鏡，小聲地說。'],
    btnAch:'查看成就',btnUp:'升級心等',
    up:{2:'瓊翻開冊子，在你的名字旁邊畫上第二顆心。\n「恭喜！……對了，二樓的特殊任務可以去看看。」',3:'瓊把第三顆心畫得特別仔細。\n「這是第三顆了，這樣也能接取地下室的委託……嗯，不過好像最近他們很忙。」',4:'瓊在第四顆心旁邊多畫了一個小小的星星。\n「第四顆！這樣二樓的名單也會多給你看一隻喔。賽倫絲說她早就想多推薦幾隻了。」',5:'瓊屏住呼吸，一筆一筆畫下第五顆心。\n「第、第五顆……！緊急委託辛苦了。對了，4F 好像有人在找你喔。」'},
    upLog:'心等升到 Lv{n}！',upShop:'言盡的商店每次會多擺一種商品。',
    upNo:'「心還不太夠……再照顧幾隻小球看看吧。」',upCh:'瓊翻了翻冊子：「第五顆心……上面寫著，要等緊急委託告一段落才能畫。」',upMax:'「已經是現在最高的心等了……謝謝你一直這麼努力。」',
    status:'心等 Lv{lv}｜♥ {h}',next:'升到 Lv{n} 需要 ♥ {need}',nextCh:'升到 Lv{n} 需要 ♥ {need}、主線第 {ch} 章完成',maxLv:'（目前最高）',
    silenceLock:'電梯在 2F 停了一下，門卻沒有打開。',
    b1Lock:'電梯的 B1 按鈕怎麼按都沒有反應。',
    b1:'地下室的燈光很暗，桌上留著一張紙條：\n「緊急委託的人員還在任務中，尚未回來。」',
    b1Back:'（心等 {n} 時再來看看吧）',
    // 言曉君（B1，心等 4）：第一次見面、平常站著時隨機一句
    xiaojunFirst:[
      {bg:'hall_b1',chr:'xiaojun_L_0+acc',name:'？？？',text:'地下室亮著一盞檯燈。一名黑色短髮的人正在寫報告，聽見電梯的聲音後抬起頭，金色的眼睛在暗處很顯眼。\n「你就是瓊說的那位照顧者？我是言曉君，特殊任務組。」',btn:'你好'},
      {bg:'hall_b1',chr:'xiaojun_L_0+acc',name:'言曉君',text:'「之前的緊急委託是我負責的。我從外面帶回了一顆受傷的小球，目前還在治療中。」\n她把報告闔上，語氣平穩：「等牠的狀況穩定下來，會需要一位可靠的照顧者。」',btn:'那孩子還好嗎？'},
      {bg:'hall_b1',chr:'xiaojun_L_3+acc',name:'言曉君',text:'她閉上眼，輕輕嘆了口氣。\n「……還需要一點時間。有消息的話，我會再通知你。」\n「在那之前，照顧好你手上的孩子吧。」',btn:'好',note:'見到了言曉君'}
    ],
    xiaojun:['言曉君正在整理任務報告，筆尖寫得又快又穩。','言曉君擦拭著一個金屬箱子，看到你，朝你點了點頭。','「有事嗎？」言曉君抬起頭，露出客氣的微笑。\n你知道她在客套，但職場本就是禮多人不怪。'],
    btnUrgent:'緊急委託',
    // 緊急委託的登記（v0.35）：心等 4 見到言曉君後，她會問要不要接之後的緊急委託。選「有」＝長相登記（紙娃娃）
    btnUrgentAsk:'緊急委託',btnReg:'更改登記',
    urgentAsk:'言曉君把一張表格推到你面前。\n「你的心等已經到 4 了。之後如果有緊急委託，你有意願接嗎？」',
    urgentYes:'有',urgentLater:'還在考慮',
    urgentYesSay:'「好，我幫你登記。」\n她拿出一台平板：「先登記一下你的長相，出任務時，其他人才認得出你。」',urgentStart:'開始登記',
    urgentLaterSay:'「好，你考慮。」\n她把表格收回抽屜裡。',
    urgentDone:'「登記好了。有任務的時候，我會通知你。」',
    urgentGoAsk:'「要現在開始緊急委託嗎？」\n（這一輪照顧中的{larva}不會收錄進圖鑑。）',urgentGoYes:'開始緊急委託',urgentGoNo:'再想想',
    urgentHandover:'「好，那你目前照顧的小球，賽倫絲那邊會幫忙安排。」',
    urgentCancel:'「……不急，想好了再來找我。」',
    regDone:'「改好了。」言曉君看了一眼平板，點了點頭。',
    urgentLog:'在 B1 登記了緊急委託（長相登記完成）。',
    poke:{lobby:['「欸嘿，被戳到了！」','「要去哪一樓呀～？我幫你按！」','「怎麼啦？」'],
      f3:['「呀！」瓊嚇得把文件抱緊。','「有什麼事嗎……？」','「請不要突然戳我……QQ」'],
      f2:['「嗯？來處理事情嗎？」','「嗨！今天氣色不錯喔！」','「名單隨時都可以來看喔，有喜歡的孩子就跟我說！」'],
      f4:['「……幹嘛。」言巷皺著眉看你。','「別碰那台，校正很麻煩。」','「有問題就問，沒問題就讓我工作。」'],
      top:['「嗯？怎麼了？」','「哈哈，被你嚇了一跳呢。」','「言巷那邊還好嗎？她要是又熬夜，記得告訴我。」'],
      b1:['言曉君默默地點了點頭。','「之前的任務？都是些麻煩的事情。」','「我的任務是去救助其他地方的異種，和上一份工作很不一樣……」','「如果你心等夠高，或許之後也可以接取任務。」']}
  },
  // ---- 特殊委託（2F 賽倫絲）。why：通用說明文（{who}＝誰，從 who 隨機挑）；whyTag：依標籤；whyTemp：依個性 ----
  special:{
    first:[
      {bg:'hall_2f',chr:'silence_L_4',name:'？？？',text:'「嗨嗨！你就是瓊姐姐說的那位照顧者吧？我是賽倫絲，負責特殊委託！」\n一個綁著高馬尾的棕髮女孩從椅子上起身，抱著一疊資料夾衝到你面前。她看起來很年輕，但說話一點都不怯場。',btn:'特殊委託？'},
      {bg:'hall_2f',chr:'silence_L_0',name:'賽倫絲',text:'「這些小球呀，原本都有自己的照顧者或爸爸媽媽，只是突然有事，沒辦法親自帶。」\n她翻開資料夾：「因為之前有人照顧過，所以我們已經知道牠們的個性和小習慣囉！」',btn:'原來如此'},
      {bg:'hall_2f',chr:'silence_L_4',name:'賽倫絲',text:'「其實異生會已經把牠們統一安置好了，不用擔心也不用有壓力……」她瞇起眼微微一笑：「不過有人一對一陪著，小球還是會比較開心啦！要不要從名單裡挑一隻？預約好了，下一輪就交給你喔！」',btn:'看看名單',note:'解鎖特殊委託'}
    ],
    idle:['賽倫絲正在和另一名照顧者閒聊，她神采奕奕，彷彿永遠不會累似的。','賽倫絲正在整理資料夾，一邊哼著歌。','「你好啊，是來看看名單的嗎？」'],
    reserved:'「{temp}的這個孩子已經幫你預約好了！下一輪就會送過去喔！」',
    btnList:'查看委託名單',title:'特殊委託',hint:'每次來大樓，名單都會換一批。每一輪只能預約一隻，預約後不能更改。',
    book:'預約',booked:'已預約',locked:'這一輪已經預約過了',noTag:'沒有特殊標籤',tagHead:'標籤：',
    log:'你預約了特殊委託：{temp}{tags}的小球。下一輪會交給你。',
    accept:'賽倫絲把預約好的小球交到你手上。',start:'這是賽倫絲交給你的特殊委託小球。{why}',
    who:['牠的家長','牠的照顧者','牠的媽媽','牠的爸爸','牠的阿嬤','牠的阿公','牠的哥哥','牠的姊姊'],
    why:['因為{who}抽中了偶像的演唱會門票，無論如何都想去，所以需要幫忙照顧一週。',
      '因為{who}求婚失敗，受到嚴重打擊，所以暫時沒辦法照顧。',
      '因為這隻小球強烈表示自己已經長大了、要離開家，所以請裝作不知道，偷偷照顧牠。',
      '因為{who}被公司派去出差，這週都回不了家。',
      '因為{who}參加了為期一週的料理比賽，忙到連自己都顧不好。',
      '因為{who}搬家搬到一半，水缸還找不到地方放。',
      '因為{who}得了重感冒，怕傳染給小球。',
      '因為{who}的工作突然變成連續夜班，作息完全顛倒。',
      '因為{who}為了買到牠最愛的限量版周邊，正在露營排隊等搶購。',
      '因為{who}想幫牠拍張完美的全家福，結果選照片選到陷入嚴重的選擇困難症。',
      '因為{who}給牠買了太多新衣服，堆滿了整間房子，現在門打不開了。',
      '因為{who}覺得牠長得太可愛，需要出門散散心才能防止自己的心臟被可愛爆擊。',
      '因為{who}不小心把牠最愛的毛線裝飾拆散了，正在沒日沒夜地重新編一個新的。',
      '因為牠最近迷上了偵探故事，{who}被列為主要嫌疑人，正在配合牠的「調查」不敢隨意靠近。'],
    whyTag:{glutton:['因為牠把家裡的零食全部吃光了，{who}需要一週去補貨。','因為{who}打算為牠做一頓豪華大餐，卻不小心把廚房炸了，正在清理中。'],
      playful:['因為{who}陪牠玩到閃到腰，需要休養一陣子。','因為牠跟{who}玩踩腳影子的遊戲，{who}被牠靈活的走位徹底打敗，正在自我檢討中。','因為牠學會了新技能「翻滾」，{who}想寫歌慶祝，目前需要與靈感奮鬥。'],
      touchy:['因為牠太喜歡被戳，{who}的手指已經戳到抽筋了。'],
      frail:['因為{who}太擔心牠，緊張到自己先病倒了。'],
      judge:['因為牠嫌家裡的裝飾太醜，{who}只好先去重新佈置。','因為{who}想幫牠蓋一個城堡，結果自己被圍在城堡中間出不來了。'],
      lovey:['因為牠一直盯著{who}看，{who}害羞到沒辦法專心工作。'],
      clean:['因為{who}的房間太亂，牠拒絕回家。'],
      scholar:['因為牠想考大學，{who}怕以後教不了牠，需要去補習。','因為牠把{who}藏起來的零食全部換成了小石頭，{who}突然有了興趣，正忙著去地質學會鑑定確認這些石頭的來歷。'],
      vain:['因為牠嫌{who}幫牠挑的衣服不好看，{who}只好去重新學穿搭。'],
      smalleat:['因為牠一直不肯多吃一口，{who}擔心到自己也吃不下飯，需要休息。'],
      high:['因為牠每天都待在水面上，{who}抬頭抬到落枕了……這家的水缸是多大？'],
      sneak:['因為牠半夜溜出去玩被抓到，{who}氣到需要冷靜一週。','因為牠突然學會了躲貓貓，{who}找牠找了一整天，現在眼睛都哭腫了需要休息。']},
    whyTemp:{sleepy:['因為{who}看牠睡得太香，自己也突然睏意大發，決定去睡個三天三夜。'],
      shy:['因為牠突然學會了躲貓貓，{who}找牠找了一整天，現在眼睛都哭腫了需要休息。'],
      lively:['因為牠跟{who}玩踩腳影子的遊戲，{who}被牠靈活的走位徹底打敗，正在自我檢討中。','因為牠學會了新技能「翻滾」，{who}想寫歌慶祝，目前需要與靈感奮鬥。'],
      helper:['因為牠堅持要幫{who}整理房間，結果{who}什麼東西都找不到了，需要花時間整理。'],
      mimic:['因為牠學{who}打噴嚏學得太像，{who}怕造成不好的影響，在病好之前先請人照顧。'],
      curious:['因為牠把{who}藏起來的零食全部換成了小石頭，{who}突然有了興趣，正忙著去地質學會鑑定確認這些石頭的來歷。']}
  },
  // ---- 成就（3F 瓊）。list 的 name＝名稱（達成前顯示？？？）、cond＝條件 ----
  ach:{
    title:'成就',claim:'領取',claimAll:'全部領取',claimed:'已領取',hidden:'？？？',
    reward:'♥{h}｜{pt} 積分',rewardWear:'＋裝扮「{w}」',none:'目前沒有可以領取的成就。',
    got:'領取成就「{name}」：♥{h}、{pt} 積分。',gotWear:'獲得裝扮「{w}」。',
    banner:'達成成就：{name}',bannerMany:'達成了 {n} 個成就',
    log:'達成成就「{name}」。可以到異生會大樓 3F 找瓊領取。',logMany:'達成了 {n} 個成就。可以到異生會大樓 3F 找瓊領取。',
    cats:{raise:'養育',book:'圖鑑',talk:'交流',gift:'禮物',letter:'信',out:'外出'},
    list:{
      round1:{name:'新手保母',cond:'完成第 1 輪'},round3:{name:'熟練工',cond:'完成 3 輪'},round7:{name:'七七四十九天',cond:'完成 7 輪'},
      safe7:{name:'撐過最危險的七天',cond:'第一次平安養滿 7 天'},return1:{name:'畢業快樂',cond:'交還 1 隻小球'},return5:{name:'桃李滿缸',cond:'交還 5 隻小球'},
      special1:{name:'指名預約',cond:'完成 1 次特殊委託'},special3:{name:'賽倫絲的老主顧',cond:'完成 3 次特殊委託'},story1:{name:'第一個月',cond:'完成主線第一章'},
      end3:{name:'每顆球都不一樣',cond:'看過 3 種結局'},end6:{name:'千球千面',cond:'看過「提前消逝」以外的 6 種結局'},temper6:{name:'脾氣大全',cond:'發現所有個性'},
      tag5:{name:'貼標籤高手',cond:'發現 5 種標籤'},tag10:{name:'看透小球心',cond:'發現 10 種標籤'},tag15:{name:'標籤圖鑑',cond:'發現 15 種標籤'},
      grete:{name:'街角的小助手',cond:'認識格蕾特'},meetYanjin:{name:'神秘的商店',cond:'在廢墟遇見言盡'},meetJoan:{name:'異生會的基底',cond:'認識 3F 的瓊'},meetSilence:{name:'熱情工讀生',cond:'認識 2F 的賽倫絲'},xiaojun:{name:'特殊任務組',cond:'在 B1 特殊任務室見到言曉君'},meetYanxiang:{name:'白髮的研究員',cond:'認識 4F 的言巷'},meetYanjie:{name:'頂樓的顧問',cond:'認識 5F 的言街'},dye1:{name:'近朱者赤',cond:'第一次聊天染色成功'},dye2:{name:'表裡不一！？',cond:'小球的核心和外殼染成不同顏色'},
      crown:{name:'今天的王者',cond:'玩具遊戲裡第一次有小球拿到小皇冠'},
      gift10k:{name:'百寶箱',cond:'小禮物收過 10 種'},gift10:{name:'被愛的證明',cond:'小禮物收過 10 個'},gift20:{name:'禮多人不怪',cond:'小禮物收過 20 個'},
      letterN:{name:'遠方的思念',cond:'收到第一封問候信'},letterY:{name:'長大的約定',cond:'收到第一封期許信'},letterF:{name:'最後的轉述',cond:'收到第一封道別信'},
      letter3:{name:'郵差常來',cond:'收到 3 封信'},letter5:{name:'信箱滿滿',cond:'收到 5 封信'},keep1:{name:'夾進書頁',cond:'收藏 1 封信'},keep3:{name:'抽屜裡的寶物',cond:'收藏 3 封信'},
      places:{name:'城市漫遊者',cond:'地圖上開放的地點都去過'},buy1:{name:'廢墟裡的客人',cond:'第一次在言盡的商店買東西'},tools:{name:'玩具達人',cond:'購買兩款永久玩具'},decor3:{name:'水缸設計師',cond:'收集 3 種裝飾'}
    }
  },
  shop:{
    intro:[
      {bg:'place_ruins_in',text:'你看著地圖疑惑了許久，根據異生會給的導航，這裡應該會有一家異生會的特約商店……\n但怎麼看都是廢棄大樓啊！',btn:'有誰在嗎？'},
      {bg:'place_ruins_in',chr:'yanjin_L_0',name:'？？？',text:'「唔、有客人？」\n突然一個女聲從空蕩蕩的大樓間傳來，隨後，你看見一個留著黑色長髮，膚色白得不健康……甚至瞳孔也是極淡的白黃色的女性。\n她穿著一件大大的長版迷彩外套，默默地走到了你附近。',
        opts:[{label:'你是誰？'},{label:'這裡是商店嗎？'}]},
      {bg:'place_ruins_in',chr:'yanjin_L_6',item:'suitcase',name:'言盡',text:'聽了你的提問，她歪了歪頭，像是在思考，好幾秒後才點點頭：\n「我是言盡，這裡是商店。」她的聲音有些乾啞，好似整個人是一株乾涸的仙人掌，在回答了你的問題後，她又說：「等等。」隨後走回黑暗中，幾分鐘後，拖著一個超級老舊的大行李箱走了回來。\n「這些，商品，用積分換。」',btn:'進入商店'}
    ],
    title:'商店',points:'持有積分：{n}',leave:'離開商店',who:'言盡',
    hello:['「要什麼？」','「唔、歡迎。」','「慢慢看。」'],
    tagBuy:'購買',price:'{n} 積分',sold:'賣完了',
    poor:'「積分，不夠。」',have:'「你，已經有了。」',thanks:['「收好。」','「謝謝，惠顧。」'],
    arrive:'你來到廢棄大樓區。言盡拖著行李箱，在老地方等著。',bought:'用 {n} 積分買了：{list}。',
    items:{
      soup3:{name:'海草湯×3',talk:'「海草湯三包。\n公園撿的，洗過了。」'},
      agent2:{name:'換水劑×2',talk:'「換水劑兩罐。\n水，要乾淨。」'},
      snacks:{name:'零食三種',talk:'「零食，一樣一個，有三個。\n甜的，鹹的，苦的。」'},
      bubble:{name:'氣泡棒',talk:'「氣泡棒。\n泡泡會飛，很好看。」'},
      bell:{name:'小鈴鐺',talk:'「鈴鐺，叮。」'},
      ball:{name:'軟球',talk:'「軟球，軟的。」'},
      squareglasses:{name:'方框眼鏡',talk:'「方框眼鏡，\n很認真的樣子。」'},
      goldglasses:{name:'金絲眼鏡',talk:'「金色的，細細的，\n像老師。」'},
      shades:{name:'酷酷眼鏡',talk:'「墨鏡，\n戴了就很酷。」'},
      catears:{name:'三花貓耳朵',talk:'「貓耳朵，三種顏色。\n喵喵的，可愛。」'},
      bow:{name:'蝴蝶結',talk:'「蝴蝶結，\n粉紅色，可愛。」'},
      clipx:{name:'打叉髮夾',talk:'「髮夾，叉叉，\n不行的意思。」'},
      clipeq:{name:'等於髮夾',talk:'「髮夾，等於。\n等於什麼，不知道。」'},
      sparkle:{name:'亮晶晶貼紙',talk:'「貼紙，亮晶晶，\n閃閃的。」'},
      hearts:{name:'愛心貼紙',talk:'「愛心貼紙，\n貼上去，被喜歡。」'},
      bolts:{name:'閃電貼紙',talk:'「閃電貼紙，\n很快的感覺。」'},
      bandaid:{name:'OK蹦',talk:'「OK蹦，\n沒受傷，也可以貼。」'},
      coin:{name:'噗幣',talk:'「亮亮錢幣，有人突然，塞給我的。\n不知道怎麼辦。」'},
      cross:{name:'十字架項鍊',talk:'「十字架項鍊，\n銀色的，涼涼的。」'},
      tie:{name:'領帶',talk:'「領帶，\n上班的人，會用。」'},
      bowtie:{name:'領結',talk:'「領結，\n參加宴會用的。」'},
      satchel:{name:'包包',talk:'「斜背包，\n可以裝東西。」'},
      wings:{name:'翅膀',talk:'「翅膀，飛不起來，\n但是好看。」'},
      devil:{name:'惡魔套裝',talk:'「角，和尾巴，一套。\n壞壞的。」'},
      minilarva:{name:'小小球',talk:'「小小球，可以放在，小球頭上。\n很像冰淇淋。」'},
      shushu:{name:'鼠薯',talk:'「鼠薯，\n一直摸的話，會變得，平平扁扁的。」'},
      phone:{name:'手機',talk:'「小球手機，防水的，能夠拍照\n厲害吧。」'},
      bunny:{name:'兔兔',talk:'「兔兔，趴在頭上。\n不會跑走。」'},
      puppy:{name:'狗勾',talk:'「狗勾，是好朋友。」'},
      snake:{name:'小青',talk:'「小青，\n我知道，白蛇傳。」'},
      blackcat:{name:'卯咪',talk:'「卯咪，\n是液體，很可愛」'},
      eyepatch:{name:'中二眼罩',talk:'「眼罩，醫療用。\n但是常常，在漫畫看到。」'},
      dododo:{name:'ドドド',talk:'「經典漫畫的，裝上去，會很強。」'},
      gogogo:{name:'ゴゴゴ',talk:'「經典漫畫的，我自己，也有買。（？）」'},
      detective:{name:'偵探帽',talk:'「偵探帽，\n我知道那句，真相只有一個。」'},
      foxmask:{name:'狐面',talk:'「狐狸面具，\n祭典的。」'},
      wand:{name:'亮亮指揮棒',talk:'「指揮棒，揮一揮，\n大家都會看過來。」'},
      bucket:{name:'小水桶',talk:'「水桶，\n怕生的孩子，喜歡躲進去。」'},
      glowstick:{name:'螢光棒',talk:'「螢光棒，會亮。\n顏色可以換，也可以，一直換。」'},
      magV:{name:'潮流髮型雜誌',talk:'「髮型雜誌。上面，一個顏色，下面，一個顏色。\n聊天的時候，一起看。」'},
      magH:{name:'酷炫動漫雜誌',talk:'「動漫雜誌。左邊，右邊，不一樣。\n很帥。聊天的時候，一起看。」'}
    },
    toolHave:'「已經有了。」',magHave:'「已經有了。」',
    chatBtn:'閒聊',goodsBtn:'看商品',
    chat:['言盡坐在行李箱旁邊，看著遠方發呆。\n「今天風很大。」','「最近，撿到的東西，變少了。」\n她把一件外套摺好，又攤開。','「小球，在大樓裡，很安靜。」\n她似乎很滿意。',
      '言盡坐在行李箱上，望著廢墟外唯一亮著的那盞路燈。\n她看得很專心，好一陣子都沒有眨眼。','路燈閃了兩下。言盡歪了歪頭，一直盯著，直到它重新亮穩。\n「唔……」\n似乎看得如癡如醉。','天色暗下來，附近的路燈亮了。\n言盡抬起頭，進入放空狀態。'],
    larvaGive:'「唔、那你收著吧。」',
    sceneLarva:['小球從行李箱後面探出頭，又縮回去。','小球在廢墟的地上慢慢爬，言盡的視線跟著牠移動。','小球輕輕撞了一下言盡的鞋子。\n「嗯？」'],
    poke:['「可是，我不是商品。」','「？」','「唔……」（似乎正在發呆。）'],tabRand:'隨機商品',tabFixed:'固定商品',fixedSay:'「生活用品，一直都有。\n這一輪用的，適合應急。」',have2:'已有',
    empty:'「沒東西了，但你，可以陪他玩。」',soldOut:'「東西，賣完了……\n唔、有小球來了。」',emptyTwo:'行李箱裡有兩隻小球，好像在聊天，又像在辯論什麼……雖然牠們沒有發聲器官。',
    yanjinLarva:['言盡看著小球：「……可愛。」','言盡伸出手指，戳了一下小球，又縮回去。','「他們，常常來。不知道，從哪裡。」','言盡默默地把外套的口袋拉開一點，讓小球鑽進去。'],emptyPoke:['小球在行李箱裡滾了一圈。','小球蹭了蹭你的手指。','「他，很喜歡你。」','小球從外套口袋裡探出頭來。'],tagPreview:'預覽',preview:'「戴上，像這樣。」',pvBuy:'購買（{n} 積分）',pvBack:'不看了',wearHave:'「已經有了。」',
  },
  map:{title:'外出',hint:'點一下地點看說明，再點一次就出發。',go:'前往',back:'回家',homeNote:'（不出門，不耗行動）',locked:'之後開放',findHead:'比較容易撿到：'},

  // ---- 每日結算 ----
  settle:{
    day:'—— 第 {day} 日 ——',
    color:'{larva}慢慢染上了你的代表色，像是把你記住了。'
  },
  // ---- 觀察線索（沒有檢測儀時，從行為看出狀態）----
  hint:{
    dirty:'水色混濁，{larva}縮在缸底。',
    hazy:'水有點霧霧的。',
    base:'水面浮著細小泡沫，觸肢一直抖。',
    acid:'水帶著酸味，{larva}的觸肢捲了起來。',
    hungry:'{larva}貼在缸壁邊打轉，試圖接近你放海草湯的地方。',
    hungrySmall:'{larva}在放海草湯的地方附近晃了晃，又慢吞吞地游開了。',   // 不愛吃：餓了，但不太積極
    weak:'{larva}活動力很低，慢慢往下沉。'
  },
  // ---- 被戳的反應 ----
  poke:{
    tooMany:'被戳太多次了，{larva}有點煩躁。',
    flee:'{larva}嚇了一跳，警戒地退開。',
    come:'{larva}游過來，貼著你戳的地方。',
    hide:'{larva}縮成一小團，躲到角落去了。',
    wave:'{larva}停下來，好奇地朝你揮了揮觸肢。',
    turn:'{larva}哼了一聲似的背過身去，慢慢游回自己的角落。',
    spin:'{larva}開心地原地轉了好幾圈。',
    stretch:'{larva}慢吞吞地伸展觸肢，身體拉長了一點，接著又軟綿綿地縮回去，重新貼好缸底。',
    touch:'{larva}沒有退開，反而伸出觸肢，輕輕碰了碰你剛才點過的位置。'
  },
  // ---- 特殊標籤（名字、說明）。toast 是水缸上方跳出的提示框文字 ----
  tags:{
    glutton:{
      name:'貪吃鬼',
      desc:'所有零食都愛吃，但肚子也餓得更快，更容易吃撐。',
      found:'{larva}把零食一口氣圈進觸肢裡，似乎對吃本身充滿熱情……吃完後，牠還在放食物的位置附近繞來繞去——看來牠對零食的熱情遠超過其他幼體。',
      feed:'{larva}幾乎不挑口味，所有零食都照單全收；吃得太急時，核心會脹得圓圓的。',
      poke:'注意到你靠近，他便歡快地轉圈，似乎在期待加餐。',
      day:'{larva}比昨天更早開始繞著缸壁活動，肚子好像又餓了。',
      end:'即使七天裡換過不同口味，{larva}每次看到零食都還是會立刻湊上前。異種中的美食家或許就是這樣吧？這孩子長大以後，一定會成長成不得了的貪吃鬼呢！'
    },
    playful:{
      name:'貪玩',
      desc:'所有玩具都喜歡，但太久沒玩，信賴會慢慢下降。',
      found:'{larva}把玩具一個接一個碰過去，似乎對於玩耍有莫大的熱情——看來牠對玩耍的熱情比一般幼體更高。',
      play:'牠立刻湊上前，觸肢一條接一條地伸過來，彷彿在說著：今天是{item}嗎？好開心！',
      poke:'牠先朝你靠近，但隨後又把觸肢轉向附近的玩具，像是在問今天要玩什麼。',
      end:'七天過去，{larva}仍會為了新玩具而興奮地翻滾。牠把玩具抱在核心前，觸肢一條接一條地收攏，像是把這一週的快樂牢牢留了下來。'
    },
    touchy:{
      name:'喜歡觸碰',
      desc:'不會躲開玩家的戳戳，被戳時還會多一點信賴；但戳太多次仍然會煩。',
      found:'第一次被戳時，{larva}沒有像其他小球那樣退開。牠反而伸出觸肢，輕輕碰了碰你剛才點過的位置，好像很開心。',
      feed:'{larva}吃完喜歡的食物後，湊近了你的手，等你戳了他一下後，才滿足地慢慢漂開。',
      play:'玩到一半，牠偶爾會把觸肢伸向你，像是在邀請你再碰一下。',
      poke:'被你戳了一下，喜歡！',
      day:'{larva}比起昨天更常停在靠近你的一側，觸肢鬆鬆地張開。',
      end:'即使已經熟悉彼此，{larva}仍會主動把觸肢伸向你。牠不需要每次都得到回應，只要你偶爾輕輕碰一下，牠就會重新舒展身體，安穩地漂在原處。'
    },
    frail:{
      name:'虛弱',
      desc:'對水質和餵食特別挑剔，容易消逝，需要多費心照顧。',
      found:'{larva}的身體比平常更透明，觸肢也無力地垂了下來。牠對水流的變化反應遲緩，連平常會主動靠近的食物都沒有立刻碰觸——這次的異常似乎不只是疲倦。',
      feed:'他慢慢地進食著，似乎有些有氣無力。',
      play:'牠只短暫碰了碰玩具，便又沉到較低的位置休息。',
      poke:'{larva}沒有立刻退開，只是緩慢地收起觸肢，反應有些遲鈍。',
      day:'水質或飽食若未及時處理，{larva}的透明身體會更難看清輪廓；請特別留意水質與進食紀錄。',
      end:'七天過去，{larva}的身體仍比其他小球更容易透出背景的顏色。牠安靜地漂著，偶爾才伸出觸肢碰一碰你留下的食物；能平安度過這段時間，已經是很不容易的事。'
    },
    judge:{
      name:'鑑賞家',
      desc:'對裝飾物特別的愛不釋手',
      found:'裝飾放進水缸後，{larva}立刻游近，沿著裝飾物的邊緣慢慢摸了一圈。牠停在最合適的角度，觸肢舒展開來，像是終於找到了一個值得細看的地方。',
      feed:'他收下食物後，抱著帶到{deco}附近，像是想在自己最喜歡的景色旁慢慢享用。',
      play:'牠常把玩具推到裝飾旁，或放在裝飾上，像是自己也成為了藝術家。',
      poke:'別推別推，美麗的裝飾你也可以看！',
      day:'牠今天大半時間都待在{deco}附近，觸肢沿著裝飾的輪廓緩緩滑過。',
      dayNone:'他似乎有些無聊，水缸裡的景色太單調了。',
      end:'七天裡，{larva}最常停留的地方始終是那些裝飾之間。牠不會把裝飾帶走，只是一次又一次地游回去，像是認定那裡就是水缸裡最好的位置。'
    },
    lovey:{
      name:'人類愛好者',
      desc:'常常停下游動，像是盯著你看……雖然他沒有眼睛',
      found:'{larva}忽然停止了漫遊，轉而朝你所在的方向緩緩靠近。明明沒有眼睛，也沒有朝向你的五官，牠卻像是一直在等你出現；當你在水缸外移動時，他彷彿也跟著轉動。',
      feed:'{larva}吃完{item}後，沒有立刻離開，而是停在靠近你的那一側。',
      play:'玩具吸引了牠的注意，但牠玩一會兒就會回到游標附近，像是比起玩具更在意你有沒有留下。',
      day:'比起水缸裡的變化，他似乎更在意你的變化……今天換髮型了？還是多了裝飾？他還看不清楚，但很在意。',
      end:'七天過去，{larva}仍然會在你出現時慢慢靠近。牠沒有眼睛，卻總像是能認出你；每當你停下操作，牠也會跟著停在附近，安靜地漂浮。'
    },
    clean:{
      name:'愛乾淨',
      desc:'對水質很在意，水不容易變髒；但水一髒就會悶悶不樂，信賴也會掉。',
      found:'{larva}繞著缸壁慢慢游了一圈，用觸肢把細小的髒污一點一點推開。水缸比預期的還要清澈，像是牠把這裡整理過了。',
      feed:'{larva}吃完後，把掉在缸底的碎屑都撿乾淨了才走開。',
      play:'{larva}玩完{item}，還把它推回原本的位置。',
      poke:'{larva}輕輕避開你指尖附近的水草，像是不想弄亂缸裡的擺設。',
      day:'{larva}今天又把缸壁邊擦了一遍，水看起來比昨天還透亮。',
      end:'七天過去，水缸始終乾乾淨淨。{larva}像是把這裡當成自己的小房間，一點一點細心地整理著。'
    },
    scholar:{
      name:'學者',
      desc:'天啊他會背九九乘法表！我的孩子是個天才！',
      found:'第一次聽見{larva}的心聲時，裡面的內容不像一般幼體那樣零碎。牠似乎能把觀察到的事情整理成完整的想法，甚至開始用自己的方式理解你放進水缸裡的東西……？',
      feed:'{larva}會先觀察食物，再決定如何把它包進核心，像是在整理一份小小的研究紀錄。',
      play:'牠對玩具的熱情不高，但會仔細測試不同的推法與碰法，偶爾像是得出了什麼結論。',
      poke:'{larva}停下來，觸肢有規律地伸縮，像是在思考這個動作的用意。',
      day:'牠今天似乎比昨天更熟悉水缸的規律，會先巡過幾個角落，再選定位置休息。',
      end:'七天過去，{larva}仍然不太熱衷玩耍，卻已經學會觀察你的習慣。牠把這一週遇到的事安靜地收進記憶裡，彷彿早就開始思考下一個問題。'
    },
    homereturn:{
      name:'回歸者',
      desc:'他的一切都是這麼熟悉……',
      found:'第一次聽見{larva}的心聲時，你忽然覺得那些反應熟悉得令人難過。牠靠近你的方式、等待你的時機，甚至停在你常點擊的位置，都像是曾經有另一顆小球做過的事。',
      feed:'{larva}收下食物時，會用觸肢輕輕碰一下你的方向，像是早就知道你會把食物放在哪裡。',
      play:'牠對玩具沒有太多新鮮感，卻會自然地回到你身邊，像是熟悉這段相處的每個步驟。',
      poke:'牠沒有明顯的戒備，只是慢慢靠近你的手，反應中帶著不合常理的安心。',
      day:'每到新的一天，牠都會先停在靠近你的一側，彷彿在確認你還在。',
      end:'七天過去，{larva}仍用著那種熟悉的方式靠近你。牠或許不記得曾經發生過的一切，卻像把某種珍貴的感覺留了下來——這一次，牠又找到了你。'
    },
    sneak:{
      name:'偷偷七逃',
      desc:'晚上會偷偷溜出去玩，早上再若無其事地游回來。',
      found:'一早醒來，水缸裡空蕩蕩的。你正想著牠去了哪裡，卻看見牠從缸邊緩緩游了進來，觸肢上沾著不屬於這個水缸的氣味——牠昨晚，偷偷出去玩了。',
      feed:'{larva}收下食物後，朝缸邊的方向看了一眼，像是在盤算下一次要從哪裡溜出去。',
      play:'{larva}玩得很盡興，但時不時往缸邊飄，像是在測量哪裡可以鑽出去。',
      poke:'被戳到的時候{larva}抖了一下，像是做了什麼虧心事。',
      day:'今天{larva}起得特別晚，身體軟軟的，不知道昨晚去了哪裡。',
      end:'七天裡，牠不知道偷偷溜出去過幾次。每次回來都若無其事，只有觸肢尖偶爾沾著陌生的氣味。你想，這大概是牠的小祕密吧。'
    },
    // v0.28 新標籤（文字是初稿）
    vain:{
      name:'愛美',
      desc:'喜歡被打扮。戴著裝扮的日子心情特別好；沒有打扮會覺得無聊。',
      found:'{larva}在玻璃前轉了好幾圈，左看右看，像在照鏡子……看來牠很喜歡被打扮。',
      poke:'被你戳了一下，{larva}馬上擺好姿勢，像在等你稱讚。',
      day:'一早，{larva}就在玻璃前轉了一圈，好像在檢查自己今天好不好看。',
      end:'七天裡，牠最開心的時候，總是戴著你幫牠挑的裝扮。牠大概會長成一個很有自己品味的孩子吧。'
    },
    smalleat:{
      name:'不愛吃',
      desc:'對吃飯不太積極，餓得比較慢，每次也只吃幾口。阿嬤很擔心。',
      found:'{larva}只吃了兩口，就把剩下的推到一邊，好像對吃東西提不起什麼興趣……看來牠天生食量就小。',
      feed:'{larva}吃了幾口就停下來，剩下的慢慢推到角落。',
      day:'都過了一整晚，理論上應該會餓，但{larva}還是對食物沒什麼主動的興致。',
      end:'七天下來，牠吃得不多，卻也平平安安地長大了。阿嬤要是知道，應該可以放心一點。'
    },
    high:{
      name:'高高在上',
      desc:'喜歡待在水缸的上半部，很少游到底下去。',
      found:'{larva}幾乎一直待在水面附近，從上面往下看著整個水缸……看來牠喜歡高高在上的感覺。',
      poke:'被戳了一下，{larva}往上游了一點，好像這樣比較安全。',
      day:'{larva}一早就游到水面附近待著。',
      daySleepy:'{larva}浮在水面附近睡著了，觸肢在水裡輕輕飄著。',
      end:'七天裡，牠幾乎都待在水缸的上半部。也許牠喜歡的，是從高處看著大家的感覺。'
    }
  },
  // ---- 小球送的禮物：name 名稱｜give 送禮當下寫在訊息區的描述｜desc 收藏頁的說明 ----
  souv:{
    letter:{name:'信紙',desc:'交還異生會的小球寄來的信，由異生會後勤翻譯與代筆。'},
    weedWave:{name:'水草',give:'{larva}捲著一株水草衝到你面前，用力地左右揮舞，像是在說：「看！我拔到的！很好玩！」',desc:'活潑的小球把水草當成旗子，一路揮舞著送來。'},
    weedHead:{name:'水草',give:'{larva}悄悄推來一株水草，接著把它蓋在自己頭上，只露出一點點觸肢，像是在示範這個要怎麼用。',desc:'害羞的小球送來的水草，附帶「蓋在頭上」的使用示範。'},
    stoneTerritory:{name:'領地的石頭',give:'{larva}默默地把一顆石頭從自己的角落推了過來，一路推到你面前，然後轉身游回角落，像是什麼都沒發生過。',desc:'從頑固小球領地裡推出來的石頭，大概是牠最大的讓步。'},
    stoneSleep:{name:'好睡的石頭',give:'{larva}慢吞吞地滾來一顆圓圓的石頭，推到你面前，然後自己趴上去示範：這個，很好睡。',desc:'睏睏的小球挑的石頭，表面圓圓的，據說躺起來剛剛好。'},
    bubbleSurprise:{name:'泡泡',give:'{larva}吐出一顆好大的泡泡，興奮地推到你面前——啵！泡泡破了，牠整隻愣住，觸肢全部豎了起來。',desc:'好奇的小球送出的泡泡。破掉的瞬間，牠比你還驚訝。'},
    stoneRoute:{name:'巡邏小石',give:'{larva}把一顆小石子推到你面前。那是牠巡邏路線上最喜歡的一顆，邊緣被磨得圓圓的。',desc:'守序的小球送的小石子，上面有牠巡邏路線的記號。'},
    bubbleCopy:{name:'學你的模仿秀',give:'{larva}學著你的樣子，用觸肢捧起一顆石頭，像是拿食物，而後又拿起另一顆石頭，像是拿玩具。',desc:'易染的小球模仿了你餵飼料和拿玩具的樣子，如果你覺得牠可愛，那你也很可愛。'},
    mirror:{name:'亮亮的鏡片',give:'{larva}推來一片亮亮的小鏡片，先在上面照了一下自己，才讓給你。',desc:'愛美的小球送的小鏡片，似乎是從裝飾底沙中找出來的，大概是牠的化妝鏡。'},
    saved:{name:'吃光光的瞬間',give:'{larva}游到你面前，在你的視線下吃掉了最後一小塊食物屑屑，牠好棒。',desc:'不愛吃的小球難得吃完了，找你討誇誇。阿嬤看到應該會很感動。'},
    surface:{name:'水面的泡泡',give:'{larva}從水面帶下來一顆圓圓的泡泡，慢慢推到你這一側。',desc:'高高在上的小球嚴選，浮在水面的泡泡。'},
    bubbleCling:{name:'泡泡',give:'{larva}小心翼翼地捧來一顆泡泡，啵——泡泡破掉的瞬間，牠立刻貼了上來，在你的指尖附近蹭來蹭去，好像禮物壞掉了，很委屈。',desc:'黏人的小球送的泡泡。泡泡破掉之後，牠就貼過來撒嬌了。'},
    gem:{name:'裝飾小配件',give:'{larva}小心地拆下裝飾上的一小塊配件，推到你面前，像是在說：這個，很美吧？給你。',desc:'鑑賞家覺得「很美」的小配件，看起來像是城堡上的塑膠寶石。說也奇怪，裝飾看起來好像沒有少。'},
    toy:{name:'玩過的玩具',give:'{larva}把玩過的玩具推到你面前，觸肢拍了拍它，像是在邀請：這是我們的玩具！再玩一次嘛！',desc:'貪玩的小球把玩具「送」給你，其實是想再玩一次。'},
    halfFood:{name:'吃剩一半的零食',give:'{larva}推來一個咬了一半的零食，猶豫了好一會兒，才推到你面前，像是在說：這是我最大的分享了。',desc:'貪吃鬼忍痛分出來的一半零食。要不要收下，是個問題。'},
    massage:{name:'指尖按摩',give:'{larva}慢慢游到你的指尖旁，用觸肢輕輕地捏了捏，一下，兩下，像是在幫你按摩。',desc:'喜歡觸碰的小球送的禮物，是一次軟軟的指尖按摩。'},
    shed:{name:'透明的蛻皮',give:'{larva}慢慢遞來一片薄薄的、透明的東西——是牠蛻下的一小片皮……也是牠唯一能擁有的禮物。牠做完這件事，累得沉到缸底休息。',desc:'虛弱的小球蛻下的一小片皮，很輕，是很小心的禮物。'},
    shell:{name:'漂亮的小貝殼',give:'{larva}停在靠近你的這一側，把一枚小貝殼推了過來。牠似乎觀察過了：人類好像都很喜歡這種漂亮的小東西。',desc:'人類愛好者觀察人類之後發現，人類喜歡貝殼，於是挑了一枚送來。'},
    pebble:{name:'擦亮的小石子',give:'{larva}把一顆擦得亮晶晶的小石子推來，連表面一點點髒污都不放過。',desc:'愛乾淨的小球擦得很亮的小石子，一點灰都沒有。'},
    note:{name:'壓紋水草葉',give:'{larva}遞來一片水草葉，上面有規律的壓痕，看起來像是……筆記？{larva}真的會寫字嗎？',desc:'學者在水草葉上壓出的紋路，似乎是某種研究紀錄，雖然沒有人看得懂。'},
    oldPiece:{name:'舊碎片的光點',give:'{larva}推來一個小小的光點，像是一片很舊很舊的碎片。你還來不及看清，它就在水裡慢慢散開，消失了。牠沒有再推來什麼，只是靜靜地停在你面前——你們依然在彼此面前。',desc:'回歸者遞來的舊碎片，是一個小小的光點，很快就消失在水裡了。但是，你們還在彼此的面前。'},
    outSand:{name:'細沙',item:'一粒不屬於水缸的細沙',give:'{larva}帶回{item}，推到你面前。你不知道牠是從哪裡找來的，牠也沒打算說。',desc:'偷偷七逃的小球從外面帶回來的東西。\n這個沙子看起來不是你水缸裡的，天啊，他是從哪裏找來的？'},
    outFeather:{name:'羽毛',item:'一小片陌生的羽毛',give:'{larva}帶回{item}，推到你面前。你不知道牠是從哪裡找來的，牠也沒打算說。',desc:'偷偷七逃的小球從外面帶回來的東西。\n原本該在天上的東西被他拖進水裡，再溼答答的放到你手上。陸海空之禮，太猛了。'},
    outBead:{name:'小珠子',item:'一顆不知道從哪裡撿來的小珠子',give:'{larva}帶回{item}，推到你面前。你不知道牠是從哪裡找來的，牠也沒打算說。',desc:'偷偷七逃的小球從外面帶回來的東西。\n沒人能拒絕漂亮的小珠子，他把這東西帶回來的時候躲躲藏藏的，像是在說：嘿、這寶貝一定很貴。'},
    outGrass:{name:'草莖',item:'一小截乾掉的草莖',give:'{larva}帶回{item}，推到你面前。你不知道牠是從哪裡找來的，牠也沒打算說。',desc:'偷偷七逃的小球從外面帶回來的東西。\n他不知道這是什麼草，你也看不出來，但沒關係，很可愛。'},
    outGlass:{name:'碎玻璃',item:'一片亮晶晶的碎玻璃',give:'{larva}帶回{item}，推到你面前。你不知道牠是從哪裡找來的，牠也沒打算說。',desc:'偷偷七逃的小球從外面帶回來的東西。\n天啊尖尖的！太危險了！你趕緊檢查了一下，好險他足夠軟Q，沒有受傷。'},
    outCoin:{name:'噗幣',item:'一枚噗幣',give:'{larva}帶回{item}，推到你面前。你不知道牠是從哪裡找來的，牠也沒打算說。',desc:'偷偷七逃的小球從外面帶回來的東西。\n天啊這是誰偷偷給他的？？？噗友們不要再亂投幣了！'}
  },
  // 偷偷七逃：換日時從缸邊游進來
  sneak:{
    back:['一早起來，水缸裡沒有{larva}的身影。過了一會兒，牠神不知鬼不覺地出現了，像是什麼事都沒發生過。',
          '今天牠是從水缸邊緣冒出來的，身上帶著一點不屬於這裡的氣味，然後若無其事地漂到了水缸中間。',
          '{larva}悄悄的出現了，動作比平常輕快，觸肢還在微微晃動，像是還沒玩夠。']
  },
  // 標籤的代價（發現之後，結算時如果觸發會顯示）
  // ---- 格蕾特小助手 ----
  grete:{
    meet:'在外面遇見了格蕾特，獲得小助手（永久）。',
    // 遇見的事件：每頁一個畫面。name＝名牌（？？？→格蕾特）、img＝0 用 grete_L_0.png／1 用 grete_L_4.png（第 3 頁直接寫 grete_L_6＝裙角觸肢）、btn＝按鈕、note＝內文下方的小字
    pages:[
      {bg:'place_park',chr:'grete_L_1',name:'？？？',btn:'是的',text:'在尋找適合的食物時，碰見一名穿著紅裙的女孩。\n「嗯？你在找海草嗎？」她眨了眨那雙橘色的眼眸，臉上帶著溫和親切的笑意：「該不會你也在養『小球』吧？」'},
      {bg:'place_park',chr:'grete_L_4',name:'？？？',opts:[{label:'好啊',next:2},{label:'不用了',next:-1}],text:'她說得隱晦，但你知道她指的就是你家裡的那個小東西，見你點頭，她似乎很開心：「真的嗎？那需要我幫忙嗎？我也有照顧這些孩子的經驗喔！」'},
      {bg:'place_park',chr:'grete_L_6',name:'格蕾特',btn:'知道了',note:'獲得小助手（永久）',text:'她態度熱情，你不知不覺也就應了下來。\n而就在此刻，你注意到她的裙角邊緣，幾隻半透明的觸肢悄悄的探了出來，打招呼似的和你揮揮手。\n「那讓我正式自我介紹吧！我叫做格蕾特——」\n「曾經，我也是一顆可愛的粉色小球喔！」'}
    ],
    // 見過面、拒絕之後再遇到：好啊→接到自我介紹那頁（pages 的最後一頁）
    again:{bg:'place_park',chr:'grete_L_4',name:'？？？',opts:[{label:'好啊',next:'intro'},{label:'不用了',next:-1}],text:'你又一次遇到那個穿紅裙的女孩。\n「安安啊，今天天氣好好，你又出來找食物嗎？」她依然相當友善的詢問著，再次提議道：「有什麼需要幫忙的嗎？我啊，聽得懂那些孩子的心聲喔！」'},
    declined:'她笑著揮揮手：「這樣啊，那有需要的話再說喔～」',
    on:'格蕾特：「交給我吧～」',
    off:'格蕾特：「沒問題！那就換你照顧囉。」',
    transOn:'格蕾特：「翻譯開始～戳戳看，他在想什麼呢？」',
    transOff:'格蕾特：「翻譯下班囉！」',
    water:'格蕾特：「窩送水來了——啊不是，我換水囉。」',
    feed:'格蕾特：「吃飯啦！！」',
    shortWater:'格蕾特：「換水劑不夠了……要請你出門找一些回來喔。」（已自動關閉小助手）',
    shortFood:'格蕾特：「食物不夠了……要請你出門找一些回來喔。」（已自動關閉小助手）',
    nothing:'格蕾特：「他現在什麼都沒在想喔～」'
  },
  // ---- 手機版版面：右上角 ☰ 選單、筆記按鈕、訊息區提示 ----
  // ---- 介面：按鈕、標題、設定與存檔頁的字（index.html 裡有 data-t="ui.xxx" 的地方，開遊戲時會換成這裡的文字）----
  ui:{title:'異種幼體養成模擬器',sign:'簽名',ink:'筆跡顏色',go:'開始工作',
    water:'換水',feed:'餵食',play:'玩耍',chat:'聊天',out:'出門',bag:'物品',free:'不耗行動',cost:'耗 1 行動',bagSub:'查看庫存',end:'結束今日',
    pvExit:'離開',pvPlay:'玩耍',watchPick:'選擇小球',seeLarvae:'查看小球們',
    set:'設定',save:'存檔',nick:'暱稱',color:'代表色',outMode:'外出方式',outRandom:'隨機（出門直接帶回東西）',outMap:'自選地點（地圖）',outChip:{random:'隨機',map:'地圖'},outSwitched:'外出方式改成「{m}」。',
    letterMode:'收到畢業小球的信',letterPopup:'跳出信紙（可以收藏、重看）',letterLog:'只在訊息區提示（不收藏）',
    saveHint:'進度存在這個瀏覽器裡。換裝置時，在舊裝置下載，再到新裝置上傳（會自動看出是日常還是主線的檔案）。',
    down:'下載日常進度',downS:'下載主線存檔',up:'上傳',upMode:'上傳模式',modeOver:'覆蓋',modeMerge:'合併',
    upNote:'合併：檔案裡有、這裡沒有的才補上（小球、空的存檔格），原本的都留著。覆蓋：檔案裡有的那一邊（日常或主線），整個換成檔案裡的。',code:'文字進度碼（備用）',import:'匯入上方文字',wipe:'清除存檔',
    about:'說明',news:'更新公告'},
  // ---- 紙娃娃（玩家的長相，v0.35）：長相登記（B1 言曉君）、玩家設定頁 ----
  doll:{title:'長相登記',done:'確定',
    parts:{front:'前髮',back:'後髮',tie:'綁髮',sideR:'鬢角右',sideL:'鬢角左',ahoge:'呆毛',brow:'眉',eye:'眼',hl:'眼睛光',mouth:'口',ear:'耳',skin:'膚色',top:'上衣',pants:'下身',socks:'襪子',shoes:'鞋子'},
    ward:{tabs:{set:'套裝',top:'上衣',pants:'下身',socks:'襪子',shoes:'鞋子',acc:'配飾'},shop:'（服飾店）',col:'{n}的顏色',own:'自己選顏色',sheer:'透明度'},   // 衣櫃（主線收納、日常玩家設定共用）
    wear:{top_1:'異生會 T 恤',pants_1:'牛仔褲',shoes_1:'雙色球鞋',top_tee:'基礎 T',top_crop:'短擺 T',top_tank:'吊嘎',top_tankS:'短吊嘎',top_shirt:'襯衫',pants_long:'長褲',pants_short:'短褲',skirt_long:'長裙',skirt_short:'短裙',socks_short:'短襪',socks_long:'長襪',socks_tights:'褲襪',shoes_sneaker:'球鞋',shoes_slipper:'拖鞋',glass_square:'方框眼鏡',glass_trend:'潮流眼鏡',glass_sun:'墨鏡',fan_yellow:'神秘應援組合（黃）',fan_purple:'神秘應援組合（紫）',fan_grey:'神秘應援組合（灰）',fan_blue:'神秘應援組合（藍）',fan_white:'神秘應援組合（白）'},
    // 衣物說明（服飾店、收納 → 衣櫃；v0.40.65；基本衣物的說明是 v0.40.67 Claude 草稿；應援扇的【】、最後一行小字是使用者給的）
    wearDesc:{top_1:'異生會發的工作 T 恤，很耐洗。',pants_1:'洗到有點褪色的牛仔褲，越穿越舒服。',shoes_1:'黑白兩色的球鞋，走多遠都不累。',top_tee:'最基本的 T 恤，什麼都好搭。',top_crop:'下擺短一點的 T 恤，看起來比較有精神。',top_tank:'夏天就是要穿吊嘎。',top_tankS:'短版的吊嘎，涼快。',top_shirt:'有領子的襯衫，正式場合也不怕。',pants_long:'普通的長褲。',pants_short:'方便活動的短褲。',skirt_long:'走起路來會輕輕擺動的長裙。',skirt_short:'百褶短裙。',socks_short:'短短的襪子。',socks_long:'長到小腿的襪子。',socks_tights:'褲襪，可以調透明度。',shoes_sneaker:'輕便的球鞋。',shoes_slipper:'在家附近走走剛好。',glass_square:'細細的方框，戴上看起來很會寫報告。可以換顏色。',glass_trend:'粗框的潮流款，戴上就像換了一個人。可以換顏色。',glass_sun:'戴上之後世界暗了一點，自信多了一點。',fan_yellow:'聽說是某個地方限定販售的應援扇……沒聽過的地名，那到底是哪裡呢？仔細一看角落寫著【光能俠】後援會同人應援周邊（非官方）',fan_purple:'聽說是某個地方限定販售的應援扇……沒聽過的地名，那到底是哪裡呢？仔細一看角落寫著【音爆】後援會同人應援周邊（非官方）',fan_grey:'聽說是某個地方限定販售的應援扇……沒聽過的地名，那到底是哪裡呢？仔細一看角落寫著【隱者】後援會同人應援周邊（非官方）',fan_blue:'聽說是某個地方限定販售的應援扇……沒聽過的地名，那到底是哪裡呢？仔細一看角落寫著【幽靈駭客】後援會同人應援周邊（非官方）',fan_white:'聽說是某個地方限定販售的應援扇……沒聽過的地名，那到底是哪裡呢？仔細一看角落寫著【光姬】後援會同人應援周邊（非官方）'},
    fanNote:'*Characters & Original Work ©路人A',
    noneSlot:{acc:'不戴配飾'},   // 衣櫃 → 配飾的「無」（眼鏡、手拿的一起拿掉）
    emos:{joy:'喜',anger:'怒',sad:'哀',fun:'樂',shock:'驚'},
    none:'無',normal:'平常',emoTag:'表情：{e}',
    labParts:'調整部件',labEmoParts:'表情部件',labEmo:'調整表情',emoAgain:'再按一次回到平常',bubbleNote:'泡泡：臉不變',
    size:'大小',posX:'位置（左右）',posY:'位置（上下）',left:'左',right:'右',up:'上',down:'下',less:'減少',more:'增加',
    reset:'重設大小與位置',same:'恢復成跟平常一樣',own:'　單獨調過',noneNote:'選了「無」，不用調整',
    hair:'髮色（頭髮、眉毛共用）',eye:'瞳色',eyeColHead:'這款眼睛的顏色',eyeDef:'預設色',eyeOwn:'瞳色',skin:'膚色',pickOwn:'自訂',
    skinNote:'身體和耳朵一起變色。',clothNote:'衣服不能改大小。基礎衣物的顏色在主線的「收納 → 衣櫃」換。',
    emoHead:'「{e}」的樣子',emoFace:'換臉',emoBubble:'泡泡',
    emoFaceNote:'挑這個表情的眉、眼、口。大小位置沒調過就跟平常一樣。',emoBubbleNote:'臉不變，頭上跳出泡泡。',bubbleEmpty:'泡泡模式沒有部件可以調。',
    loading:'讀取中……',preview:'紙娃娃預覽'},
  // 玩家設定頁（☰「玩家設定」）：tabs＝頁籤（之後 v0.4 加專屬小球）
  player:{tabs:{look:'長相',name:'名字'},edit:'更改長相',lookTitle:'換衣服',
    noDoll:'還沒有登記長相。\n心等 4 之後，到異生會大樓 B1 找言曉君，就可以登記。',
    lookHint:'長相是在 B1 言曉君那裡登記的，這裡也可以直接改。',nameHint:'名字和代表色會顯示在名牌上；代表色也是聊天染色用的顏色。'},
  layout:{
    // ☰ 選單的順序與文字（watch＝觀察水缸，其他是選單頁面）
    ham:[['larvae','小球們'],['watch','觀察水缸'],['book','圖鑑'],['coll','收藏品'],['player','玩家設定'],['save','設定與存檔'],['about','說明與公告']],
    pages:{larvae:'小球們',book:'圖鑑',coll:'收藏品',player:'玩家設定',save:'設定與存檔',about:'說明與公告'},
    // 行動區的格蕾特開關：grete／trans＝按鈕上的字，gDesk／tDesk＝電腦版多顯示的字，on／off＝狀態
    grete:'小助手',gDesk:'格蕾特',trans:'翻譯',tDesk:'（心聲）',on:'開',off:'關'},
  // ---- 畢業小球的信紙（規則在 js/data/letters.js）----
  // body 的代入字：{player} 玩家名字、{name} 小球名字、{weeks} 分別幾週、{reason} 寄信原因、{recent} 近況、{bless} 祝福；note 的 {staff}＝後勤人員
  letter:{
    title:'收到信紙',
    intro:'收到了異生會幫忙轉交的信紙，內容的筆劃歪歪扭扭的難以辨識……不對，有第二張翻譯稿，寫著：',
    body:'「你好，{player}，我是{name}。\n從分別到現在已經 {weeks} 週了，因為{reason}，所以我想寫信給你！\n我最近{recent}，每天很開心，你也要開開心心喔，{bless}。\n{name}」',
    note:'＊備註：異生會後勤（{staff}）翻譯與代筆',
    staff:['言盡','賽倫絲','瓊','曉君','格蕾特'],
    reason:['我學會拿筆了','異生會的大姊姊說可以寫信','今天的水特別乾淨','我撿到一顆很像你的石頭','我昨天夢到你了','觸肢A說想你，觸肢B也說想你','我第一次自己游到水面上','我想讓你知道我長大一點點了','今天天氣超好'],
    reasonYoung:['快要兩個月了，好希望能順利長大','異生會說再過幾週就算穩定了，我有一點點緊張','有時候身體會軟軟的，可是我很努力'],
    recentTemper:{clingy:['總是跟在照顧員後面游來游去','學會難以拒絕的貼貼絕技'],shy:['學會跟新朋友打招呼了（雖然還是會先躲一下）','聽說有個叫名片的東西可以代替自我介紹'],
      curious:['把異生會的每個角落都探險過一遍','可以短暫離水了'],stubborn:['在新家找到一個很棒的角落','整理了我的地盤，蓋出了石頭圍欄'],
      lively:['每天追泡泡追到睡著','學會後空翻了'],sleepy:['每天都睡得飽飽的','找到一顆超級好躺的石頭'],
      helper:['每天都在異生會裡巡邏','幫後勤姐姐找回了不見的鑰匙'],mimic:['學會了好多大家的動作','學瓊姐姐推眼鏡，被說很像']},
    recentTag:{glutton:['吃了好多好吃的','想學學看自己下廚'],playful:['認識了好多新玩具','學會把玩具組合起來玩'],touchy:['每天都有人摸摸我','學會新的擊掌方式'],
      frail:['有好好吃飯，身體慢慢變好了','雖然還是累累的，但有在努力吃飯'],judge:['把水缸裡的裝飾都看過好多遍','有了一個和之前水缸裡很像的新裝飾'],
      lovey:['常常隔著玻璃看異生會的人類','越來越了解人類了'],clean:['把水缸整理得亮晶晶的','努力督促後勤姐姐和我一起打掃'],
      scholar:['開始學九九乘法表的後半段','開始學「餵雞分」了'],homereturn:['常常想起很久很久以前的事','好像記起很多很久以前，有關你的事情'],
      sneak:['又偷偷溜出去看了外面的世界','有偷偷回去看你喔'],
      vain:['每天都戴著不一樣的裝扮','被誇獎說很好看'],smalleat:['今天多吃了一口','有好好吃飯了（一點點）'],high:['在新家找到最高的位置','每天都從上面看大家']},
    recentGift:'還是最喜歡吃{item}',recentToy:'每天都在玩{item}',
    recentAny:['學會了新的游法','交到了新朋友'],
    bless:{'END-01':['祝你每天都平平安安','希望你天天順利'],'END-02':['我最喜歡你了','＜３'],'END-03':['希望你會遇到好多新奇的東西','祝你每天都有新的發現'],
      'END-04':['要按照自己的步調好好生活喔','要好好吃飯和玩耍喔'],'END-05':['想念你','給我最最崇拜的人類'],'END-06':['如果下次見面我們一起做更多事情吧']},
    blessAny:'祝你一切都好',
    farewellIntro:'異生會轉交了一張翻譯稿。這次沒有附上手寫的信紙。',
    farewellBody:'你好，{player}，這是{name}想對你說的話：\n「謝謝你陪我撐過最危險的七天，但我好像不太行了。\n但是，我想以後還會有機會見面吧！\n{bless}。」',
    farewellNote2:'＊備註２：這孩子並沒有撐過兩個月，這是牠離開的前幾天轉述的。',
    kinds:{normal:'問候',young:'期許',farewell:'道別'},   // 信的種類（一般／未滿兩個月／離開前轉述），顯示在標題與收藏
    titleKind:'收到信紙（{kind}）',dropHint:'「收納」會把那封信從收藏裡清掉（無法復原；禮物頁收到的次數不變）。',expand:'展開',fold:'收合',drop:'收納',dropConfirm:'再按一次',
    keep:'加入收藏（可以在「圖鑑 → 信紙」重看）',close:'關閉',
    log:'收到【{name}】寄來的信紙。（記錄在圖鑑的禮物頁）',
    src:'畢業小球',collEmpty:'還沒有收藏的信紙。收到信紙時勾選「加入收藏」，就會放在這裡。'
  },
  // ---- 互動玩耍（玩耍方式＝遊玩，js/minigame.js）----
  game:{
    mode:{quick:'精簡',play:'遊玩'},switched:'玩耍方式改成「{m}」。',
    modeHead:'玩耍方式',modeQuick:'精簡（選了就玩完）',modePlay:'遊玩（在水缸裡真的玩一場）',
    wand:{start:'你揮起亮晶晶的指揮棒，水缸裡的小球全都盯著它看！（移動游標或手指，小球會追過來）',win:'{name}第一個碰到了指揮棒！',meh:'{name}被指揮棒碰到，一臉緊張得游開了。',none:'小球們追得暈頭轉向，指揮棒的光慢慢暗了下來。'},
    bubble:{start:'你拿著氣泡棒在水裡劃來劃去。（移動游標或手指，就會冒出一串泡泡）',spin:'{name}被泡泡的氣流捲得轉圈圈！',spinMeh:'{name}被泡泡捲得團團轉，看起來頭昏眼花，不太喜歡。',end:'泡泡慢慢散開了。'},
    bell:{start:'把小鈴鐺藏起來吧！點一個發光的地方。',hidden:'你把小鈴鐺藏進了{spot}。小球們開始到處找……',win:'{names}找到了小鈴鐺！',meh:'{names}找到了小鈴鐺，但好像沒什麼興趣。',lose:'沒有人找到小鈴鐺。你把它拿出來搖了搖——叮。',weedL:'左邊的水草',weedR:'右邊的水草'},
    bucket:{start:'點水缸裡的一個地方，把小水桶放下去。',placed:'你把小水桶放進水缸。小球們注意到了……',win:'{name}一溜煙躲進了水桶裡！',meh:'{name}看了水桶一眼，沒什麼興趣地游開了。',none:'沒有小球想躲進水桶。'},
    ball:{start:'你把軟球輕輕丟進水缸。',count:'{larva}用頭頂了軟球 {n} 下。',great:'看起來玩得超開心！',meh:'',bad:'{larva}看起來有點懊惱……',dislike:'{larva}意思意思頂了一下，就不想玩了。'}
  },
  // ---- 小球們頁（圖鑑）----
  larvae:{tabNow:'照顧中',tabRet:'已交還',nowStat:'共 {n} 隻',retStat:'已交還 {n} 隻',retEmpty:'還沒有交還過小球。',retAt:'交還於 {d}',retLetter:'已寄信',
    star:'標上星號（排在最前面）',unstar:'取消星號',wear:'裝扮',wearing:'戴著',noWear:'沒有戴',previewing:'預覽中',
    wearHint:'點名字可以預覽，按「戴上」才會換上。',noWears:'還沒有裝扮。可以在廢棄大樓的商店買。',
    tabDress:'打扮',dressCats:{all:'全部',head:'頭飾',face:'臉飾',icon:'圖示',other:'其他'},dressNone:'不戴',dressDone:'確定',
    dressCur:'這一輪',dressNoLarva:'還沒有可以打扮的小球。',dressOn:'【{name}】換上了{item}。',dressOff:'【{name}】把裝扮拿下來了。',dressColor:'顏色',dressRainbow:'彩虹',dressTitle:'打扮',dressWho:'換一隻小球',dressWhoTab:'小球'},
  // ---- 介面上零散的字（v0.29 從程式裡搬過來，方便從總表改）----
  // 設定頁最下面的外觀選項（js/skin.js）；names／fonts／frames 的 key 是 skin.js 裡 SKINS／FONTS／FRAMES 的 id
  skin:{head:'外觀',skin:'配色',font:'字體',frame:'版型',
    names:{classic:'經典',night:'夜櫻',deep:'深海',dusk:'暮紫',noir:'黑夜',latte:'奶茶'},
    fonts:{mix:'混搭（標題、按鈕用像素字）',pixel:'全部像素字',plain:'一般字體'},
    frames:{round:'立體',flat:'平面（舊版）'}},
  misc:{
    defPlayer:'玩家',defLarva:'小球',dayLabel:'第 {d} 日 / 7',notes:'筆記',notesTemp:'個性：',notesLike:'喜好：',unknown:'？',
    water:'水質 {w}',waterNum:'污{d} pH{p}',waterUnknown:'未知',
    custom:'自訂',customColor:'自訂顏色',nick:'暱稱',
    evTitle:'事件',ok:'知道了',grete:'格蕾特',giftToast:'收到禮物：{name}',
    endArm:'再按一次結束今日',endArmAp:'再按一次結束今日（還有 {n} 次行動）',wipeArm:'再按一次確認（無法復原）',
    // 結局畫面的摘要
    sumTime:'時間',sumDays:'{day} 日',sumLike:'喜歡',sumColor:'色彩',sumTwo:'兩色',sumByChat:'聊天染色',sumDyed:'染上你的代表色',sumNatural:'自然的顏色',sumPlain:'原色',
    sumV:'上下',sumH:'左右',sumSaved:'已收錄進圖鑑。',
    // 聊天框的選色
    colorSuffix:'色',none:'未選',partAll:'全部設定',partCore:'設定核心',partShell:'設定外殼',core:'核心',shell:'外殼',infoColor:'顏色：',
    things:'好看的東西',styleName:'{soft}的{style}兩色',
    // 圖鑑（發現過的紀錄）與收藏品（持有的東西）
    collTabs:{end:'結局',temper:'個性',item:'物品',decor:'裝飾品',tag:'標籤',souv:'禮物',letter:'信紙',tool:'道具',wear:'裝扮'},
    collShop:'言盡的商店｜{n} 積分',collAch:'成就獎勵',collNoTool:'還沒有道具。言盡的商店有時會擺出來。',collNoWear:'還沒有裝扮。到言盡的商店看看吧。',
    colName:'名稱',colDesc:'說明',colKind:'種類',colShow:'顯示',colSrc:'來源',colCount:'數量',showInTank:'顯示在水缸',
    // 小球們
    rename:'改名',newName:'新名字',saveName:'儲存名字',cancelName:'取消改名',
    rowInfo:'第 {day} 日｜{at}｜{p}',rowTags:'標籤：',rowLike:'喜歡：{g}｜{t}',
    guestOn:'放入水缸',guestOff:'離開水缸',noLarva:'還沒有紀錄。完成一個周目後，小球會出現在這裡。',
    mergeOk:'日常進度合併完成，新增 {n} 隻。',mergeStory:'主線存檔合併完成（只補上空的格子）。',overDaily:'日常進度已覆蓋。',overStory:'主線存檔已覆蓋。',downBad:'下載失敗，可以改用下面的文字進度碼。',
    overAsk:'要覆蓋目前的{what}嗎？',overBody:'會整個換成檔案裡的，原本的不會留下來。',overOk:'覆蓋',overNo:'取消',partDaily:'日常進度',partStory:'主線存檔',partAnd:'和',mergeBad:'讀取失敗：檔案格式不正確。',wiped:'存檔已清除。',wipe:'清除存檔'
  },
  // ---- 觀察水缸 ----
  pv:{
    noList:'圖鑑裡還沒有可以觀察的小球。先完成一個周目，之後養過的小球就能放進來。',
    hi:'進入觀察水缸。這裡沒有日期與行動次數，可以戳每一隻小球、看牠們怎麼互動。',
    join:'【{name}】飄進了水缸。',leave:'【{name}】飄出了水缸。',
    transOn:'翻譯：開（戳小球時，有機會聽見心聲）',transOff:'翻譯：關',none:'水缸裡還沒有小球，按左上角的按鈕選擇。',
    sel:'選擇小球 {n}/{max}',trans:'翻譯：{s}',on:'開',off:'關',transTitle:'翻譯（心聲）',
    watchOn:'放入觀察',watchOff:'取消觀察',stat:'已選 {n}／{max} 隻（超過時，最早選的會先離開）。這裡的選擇只用在觀察水缸，和日常模式的「放入水缸」無關。'
  },
  // ---- 開場故事、第 0 日、異生會 ----
  intro:{
    story:[
      '2026年，現代的異種們已經不能像以前那樣悠悠哉哉的睡到自然醒，繁忙的工作不僅壓縮了休閒時間，也壓縮了育兒時間。',
      '在少子化、生存率又不高的情況下，《異種生活平均改善協會》，簡稱異生會，便推出了重要的工作招募——',
      '「幫異種們帶孩子，陪伴小球們，撐過最危險的前七天。」',
      '而你，便是經過重重考核，最終被異種們認定「喜歡」的那名人類。'
    ]
  },
  idle:{
    msg:'水缸空空的。異生會的委託還沒送來，準備好了就接取新委託吧。',
    wait:'等待新委託',accept:'接取新委託',acceptBody:'異生會把一顆剛出生的小球交到你手上。',nameLabel:'幼體的名字',ok:'接取'
  },
  assoc:{
    ret:'交還異生會',retConfirm:'再按一次確認（+{pts} 積分，無法復原）',pts:'積分',logHead:'已交還紀錄',
    done:'【{name}】交還給異生會了，由異生會後續照顧與歸還原照顧者。獲得 {pts} 積分。'
  },
  // ---- 聊天染色（「聊天」鍵）----
  // {c}＝顏色的大略名稱（紅橘黃綠青藍紫粉褐白灰黑）、{things}＝該顏色的東西（見 things）。p1／p2＝核心的累積提示，p1s／p2s＝外殼的累積提示
  chat:{
    head:'聊天',btnPlain:'普通聊天',btnColor:'推薦顏色',cancel:'全部取消',
    plain:['你站在缸邊，隨口跟{larva}聊了今天的天氣和外面的事。牠聽得……大概有聽進去。',
      '你對著水缸碎碎念了一會兒，{larva}偶爾晃晃觸肢，像是在回應。',
      '你跟{larva}說了個小笑話。牠輕輕擺動觸肢，似乎在給予回應。'],
    talk:'你和{larva}聊起{things}：「那些都是{c}色的喔。」',
    talkBoth:'你對{larva}說：「如果你的核心是{c}色的，外殼是{c2}色的，應該會很好看，就像{things}一樣。」',
    talkCore:'你誇起{larva}的核心：「你的核心是{c}色的，一定超好看，就像{things}一樣。」',
    talkShell:'你誇起{larva}的外殼：「披上{c}色一定很漂亮，就像{things}一樣。」',
    react:['{larva}聽得很專心，觸肢輕輕晃著。','{larva}歪著身體，像是在想像那個畫面。','{larva}慢慢靠近水缸邊，好像想看得更清楚。'],
    p1:['{larva}好像對{c}色有點在意了。'],
    p2:['{larva}的核心似乎有些不明顯的變化。'],
    p1s:['{larva}低頭看了看自己的外殼，好像對{c}色有點在意了。'],
    p2s:['{larva}的外殼邊緣隱約透出一點{c}色，牠自己也嚇了一跳。'],
    done:{
      core:'……{larva}的核心慢慢染成了{c}色！牠開心地轉了好幾圈，好像在說：你看你看！',
      shell:'{larva}的外殼像是被什麼輕輕染過，透出一層漂亮的{c}色！牠轉過來轉過去，確認每個角度都有。'
    },
    toast:'{larva}染上了{c}色！',
    // 雜誌染色（言盡的商店買的雜誌；外殼兩色）。{mag}＝雜誌名｜{c}、{c2}＝外殼兩邊的顏色｜{a}、{b}＝哪兩邊（上／下、左／右）
    style:'外殼',styleOne:'單色',styleV:'上下',styleH:'左右',soft:'柔和',split:'分色',
    side:{v:['上','下'],h:['左','右']},
    magTalk:'你翻開《{mag}》，和{larva}一起看：「{a}半邊{c}色、{b}半邊{c2}色，這樣搭一定很好看！」',
    magTalkOne:'你翻開《{mag}》，指著其中一頁給{larva}看：「外殼{a}半邊換成{c}色，你覺得呢？」',
    magReact:['{larva}貼在缸邊，盯著雜誌看了好久。','{larva}把觸肢伸向雜誌，好像想翻下一頁。','{larva}轉了一圈，好像在比較自己和雜誌上的樣子。'],
    done2:'{larva}的外殼{a}半邊，慢慢透出了{c}色！',
    doneTwo:'{larva}的外殼變成了{a}{c}、{b}{c2}的兩色！牠轉過來轉過去，好像很滿意。',
    styleSet:'{larva}的外殼換成了{s}。',toastTwo:'{larva}的外殼變成兩色了！',
    things:{紅:'蘋果、夕陽和珊瑚',橘:'橘子、南瓜和夕陽',黃:'檸檬、向日葵和月亮',綠:'新芽、海草和青蛙',青:'薄荷、淺淺的海水和玻璃',
      藍:'海、天空和藍莓',紫:'葡萄、薰衣草和暮色',粉:'櫻花、棉花糖和草莓牛奶',褐:'巧克力、樹幹和餅乾',白:'雲、牛奶和雪',
      淺灰:'霧、鴿子和雨天的雲',灰:'石頭、灰塵和下雨天',黑:'夜空、墨水和黑貓'}
  },
  // 格蕾特的聊天事件（pages 的格式同遇見格蕾特）
  chatEv:{
    talk:{
      log:'格蕾特教了你一件事：陪小球聊天，也能影響牠的顏色。（「聊天」裡多了「推薦顏色」）',
      pages:[
        {bg:'place_street',chr:'grete_L_0',name:'格蕾特',btn:'還不錯',text:'出門找東西的時候，又碰到了格蕾特。她正在街邊店鋪的櫥窗外往裡頭看，似乎在找什麼。\n「啊，來得正好！」她揮揮手：「小球最近怎麼樣？有好好吃飯嗎？」'},
        {bg:'place_street',chr:'grete_L_4',name:'格蕾特',btn:'真的嗎？',text:'你們聊了一陣子小球的日常。聊著聊著，她忽然想到什麼，眼睛亮了起來：\n「對了對了，你知道嗎？小球是會慢慢染上顏色的喔！」\n「你可以多跟牠描述某種顏色的東西——海啊、蘋果啊、夕陽之類的。牠聽得夠多，就會漸漸傾向那個色系！」她一邊說著，一邊指了指櫥窗：「我照顧的孩子說他想要變成更好看的靛色，我只好出來幫忙找找了。」'},
        {bg:'place_street',chr:'grete_L_6',name:'格蕾特',btn:'知道了',note:'解鎖聊天的「推薦顏色」',text:'「不過一次兩次不夠喔，至少要講三次！而且要連講同一個顏色才有效。」她比出三根手指，笑咪咪地補了一句：「聊天不用花道具，耐心一點啦——啊、不小心說溜嘴了，請不要在意。」\n她突然看向某個方向，伸手在自己唇前比了比，不知道是在和誰說話。'}
      ]
    },
    dual:{
      log:'格蕾特教了你一件事：聊天時可以分別指定小球的核心或外殼。',
      pages:[
        {bg:'place_street',chr:'grete_L_1',name:'格蕾特',btn:'有啊',text:'又在外面碰到了格蕾特。\n「你好啊，上次有跟小球聊過顏色了嗎？」她笑咪咪地湊過來：「話說回來，有些比較厲害的孩子，小小年紀就可以變出兩種顏色喔？」'},
        {bg:'place_street',chr:'grete_L_0',name:'格蕾特',btn:'知道了',note:'聊天時可以分別選「核心」與「外殼」',text:'「簡單來說……外面那層殼，和裡面的核心。聊天的時候，可以鼓勵一下，讓他們挑戰看看！」她握起拳頭，做出加油的手勢：「至於方法……總之就用力誇誇他嘛，被關愛的孩子當然會努力啦！」'}
      ]
    }
  },
  // 心聲：主腦（本體）和觸肢裡的副腦（觸肢A、觸肢B）自己對話。每則對話是 [誰說, 內容] 的清單；{g} 是水缸裡另一隻的名字。
  // 要擴充：直接在對應的清單裡多加一則對話就好。
  voice:{
    full:[[['觸肢A','肚子餓餓嗎？我沒拿到食物。'],['觸肢B','我有拿到。'],['本體','有吃過了，不餓餓，不要搶著拿。 ( ˘ω˘ )']],
          [['觸肢A','肚子圓圓的。'],['觸肢B','摸起來好像球。'],['本體','不要戳。 (´▽`)']]],
    hungry:[[['觸肢A','肚子空空的……'],['觸肢B','食物呢？食物呢？'],['本體','安靜，等等就會有了。 (ﾟдﾟ)']],
          [['觸肢A','聞到海草湯的味道了！'],['觸肢B','是幻覺。'],['本體','……好餓。 (ﾟдﾟ)']]],
    dirty:[[['觸肢A','水怎麼黏黏的？'],['觸肢B','我的吸盤都滑掉了。'],['本體','叫人類換水。 (；´∀`)']],
          [['觸肢A','好癢。'],['觸肢B','我也是。'],['本體','別抓了，會更癢。 (>_<)']]],
    weak:[[['觸肢A','好沒力氣……'],['觸肢B','我撐著你。'],['本體','……謝謝。 (´・ω・`)']],
          [['觸肢A','要不要睡一下？'],['觸肢B','睡吧睡吧。'],['本體','……嗯。 (=_=)']]],
    love:[[['觸肢A','人類的手好暖。'],['觸肢B','再碰一下！'],['本體','不要太明顯，偷偷碰。 (๑˃ᴗ˂)']],
          [['觸肢A','喜歡人類！'],['觸肢B','我們貼著他。'],['本體','……好，貼貼。 (*´∀`*)']]],
    notice:[[['本體','人類在做什麼？'],['觸肢A','在看我們。'],['觸肢B','揮手！揮手！ (・_・)']],
          [['本體','人類又來戳我了。'],['觸肢A','戳回去？'],['本體','不行。 (°ロ°)']]],
    stone:[[['觸肢A','拿到睡午覺的石頭了。'],['觸肢B','舖在這裡！'],['本體','Ｚｚｚｚｚ…… (-ω-)zzz']]],
    guest:{clingy:[[['觸肢A','{g}一直看過來。'],['觸肢B','他想玩。'],['本體','那就玩。 (・_・;)']]],
      shy:[[['觸肢A','{g}好像在躲我們。'],['觸肢B','我們沒有惡意！'],['本體','給他一點時間。 (・_・;)']]],
      curious:[[['觸肢A','{g}在摸我們的觸肢。'],['觸肢B','癢癢的！'],['本體','不要笑出來。 (｡>﹏<｡)']]],
      stubborn:[[['觸肢A','{g}的角落不能靠近。'],['觸肢B','我只是看看。'],['本體','別去，會被撞。 (｡>﹏<｡)']]],
      lively:[[['觸肢A','{g}轉得好快！'],['觸肢B','一起轉！'],['本體','先站穩。 (｡>﹏<｡)']]],
      sleepy:[[['觸肢A','{g}在睡覺。'],['觸肢B','要不要靠在旁邊？'],['本體','輕一點。 (・_・;)']]],
      helper:[[['觸肢A','{g}又在巡邏了。'],['觸肢B','跟上去？'],['本體','牠走的路線好整齊。 (・ω・)']]],
      mimic:[[['觸肢A','{g}在學我們。(・_・;)'],['觸肢B','我動一下……牠也動了！'],['本體','好像照鏡子。']]]},
    temper:{clingy:[[['觸肢A','人類在那邊！'],['觸肢B','靠過去靠過去！'],['本體','慢慢來，不要嚇到他。 (*´ω`*)']],
          [['本體','想貼著。'],['觸肢A','貼。'],['觸肢B','貼貼貼。 (*´ω`*)']]],
      shy:[[['觸肢A','有人在看我們。'],['觸肢B','縮起來！'],['本體','快躲到水草後面。> <']],
          [['本體','不要看我QQ'],['觸肢A','他沒有在看。'],['觸肢B','他剛剛看了。'],['觸肢們','哇哇哇！QQ']]],
      curious:[[['觸肢A','那個是什麼？'],['觸肢B','我去摸摸看！'],['本體','等一下，先確認安不安全。 (｀・ω・´)']],
          [['觸肢A','發現新東西了！'],['觸肢B','是泡泡！'],['本體','都去追。 (°ロ°)']]],
      stubborn:[[['本體','這個角落是我的。'],['觸肢A','他戳我。'],['本體','不理他。 (¬_¬)']],
          [['觸肢A','要不要靠過去一點點？'],['本體','……只准一點點。'],['觸肢B','好耶。 (￣^￣)']]],
      lively:[[['觸肢A','轉圈圈！'],['觸肢B','我要翻滾！'],['本體','等等，先追泡泡！ (≧▽≦)']],
          [['觸肢A','好快好快！'],['觸肢B','再快一點！'],['本體','住手啊要撞牆了—— ヽ(°〇°)ﾉ']]],
      sleepy:[[['觸肢A','拿到睡午覺的石頭了。'],['觸肢B','舖在這裡！'],['本體','Ｚｚｚｚｚ…… ( ˘ω˘ )']],
          [['本體','Ｚｚｚ……'],['觸肢A','他戳我。 (´-﹃-`)'],['本體','別理他，繼續睡。 (-ω-)zzz']]],
      helper:[[['觸肢A','左邊沒問題！'],['觸肢B','右邊也沒問題！'],['本體','很好，繼續巡邏。 (｀・ω・´)']],
          [['觸肢A','那邊撞在一起了！'],['觸肢B','快去幫忙！'],['本體','等等，我們也會被撞—— (°ロ°)']]],
      mimic:[[['觸肢A','人類往左。'],['觸肢B','我們也往左！'],['本體','學得很像吧？ (๑˃ᴗ˂)']],
          [['觸肢A','那隻在轉圈。'],['觸肢B','我們也轉！'],['本體','頭好暈…… (@_@)']]]},
    tag:{glutton:[[['觸肢A','下一餐是什麼？'],['觸肢B','這餐還沒吃完就在想了。'],['本體','我們是美食家，美食家就要想吃的。 (*´Д`)']]],
      playful:[[['觸肢A','今天玩什麼？'],['觸肢B','玩玩具！玩具玩具！'],['本體','一個一個玩，全都玩。 (≧▽≦)']]],
      touchy:[[['觸肢A','人類又戳我了！'],['觸肢B','再戳一下嘛。'],['本體','快蹭過去！讓人忍不住再戳一下。 > <']]],
      frail:[[['觸肢A','有點冷……'],['觸肢B','有點懶得動……'],['本體','我們窩起來休息。 (´;ω;`)']]],
      judge:[[['觸肢A','那個裝飾的角度真好。'],['觸肢B','我去摸摸邊緣。'],['本體','別弄髒了，人類說這是西當普利斯的作品！ (｀・ω・´)']]],
      lovey:[[['觸肢A','他在看我們嗎？'],['觸肢B','好像在看。'],['本體','噢……人類，喜歡，我們看回去，一直看一直看。 (๑˃ᴗ˂)']]],
      clean:[[['觸肢A','這裡有碎屑。'],['觸肢B','撿起來，吃。'],['本體','不吃，這裡要再擦乾淨一點。 (｀・ω・´)']]],
      scholar:[[['觸肢A','2×2=4。'],['觸肢B','3×3=9。'],['本體','……你們居然背得比我還熟。(´・ω・`)']],
          [['本體','水缸的容積，大概是這樣算的。'],['觸肢A','好厲害！'],['觸肢B','聽不懂但好厲害！(≧▽≦)']]],
      homereturn:[[['本體','這個戳法……好熟悉。'],['觸肢A','你以前來過嗎？'],['本體','不知道，但是很安心。(´▽`)']],
          [['本體','人類的手，還是這麼暖。'],['觸肢A','還是？'],['本體','……我是說，一定很暖。(・_・;)']]],
      sneak:[[['觸肢A','昨天外面有好多亮亮的東西。'],['觸肢B','噓！不可以說！'],['本體','什麼都沒有，我們一直待在水缸裡。(´-ω-`)']],
          [['本體','今晚的路線確認了。'],['觸肢A','從左邊的縫？'],['觸肢B','人類在看！裝睡裝睡！(°ロ°)']]],
      vain:[[['觸肢A','今天戴這個好看嗎？'],['觸肢B','好看好看！'],['本體','再轉一圈給人類看。 (๑•̀ㅂ•́)و']]],
      smalleat:[[['觸肢A','吃飽了。'],['觸肢B','才吃兩口耶。'],['本體','兩口就很飽了啊。 (´・ω・`)']]],
      high:[[['觸肢A','上面風景好好。'],['觸肢B','下面的大家好小。'],['本體','我們是水缸的王。 (｀・ω・´)']]]}
  },
  tagCost:{
    playful:'{larva}好久沒玩了，繞著缸壁打轉，看起來有些落寞。',
    lovey:'{larva}在水缸邊等了你一整天，有點失落。',
    clean:'水質變髒了，{larva}悶悶地縮在乾淨的角落，不太想動。',
    vain:'{larva}今天什麼都沒戴，在缸邊無聊地晃來晃去。'
  },
  tag:{found:'發現特殊標籤：{tag}。{desc}',toast:'發現特殊標籤：{tag}'},
  // ---- 物品與裝飾的說明（收藏頁用）----
  item:{
    food:'營養滿分的主食！',
    agent:'換水用的藥劑，一瓶就能讓整缸水恢復清澈。',
    sweet:'甜甜的小果子，有些小球特別愛吃。',
    salty:'帶著海味的貝肉，口味偏鹹。',
    bitter:'微苦的海藻，有人愛有人嫌。',
    bubble:'會咕嚕咕嚕冒泡的小棒子，很適合玩。',
    bell:'搖一搖就會叮噹響的小鈴鐺。這在水裡會有聲音嗎？還是對他們只是硬硬的球？',
    ball:'軟軟彈彈的球，怎麼撞都不會痛。',
    kit:'能看出精確水質數值的儀器。（永久持有）'
  },
  decor:{
    castle:'誰家的海底小城堡？看起來很適合躲貓貓。',
    shell:'一顆大大的貝殼，安靜地躺在水缸底部。',
    coral:'擺在水缸裡很好看的珊瑚叢。'
  },
  // ---- 小球之間互動的描述（{a} 主動的、{b} 對象；每 12 秒最多一則，避免洗版）----
  social:{
    play:['{a}繞著{b}游了好幾圈，兩隻玩得很開心。','{a}和{b}你追我跑，在水缸裡打起轉來。','{a}湊到{b}身邊，觸肢碰來碰去，像是在玩遊戲。'],
    together:['{a}和{b}並排游著，一起在水缸裡慢慢繞行。','{a}跟在{b}旁邊，兩隻一起漂來漂去。','{a}與{b}沿著缸壁一起游動，步調出奇地一致。'],
    chase:['{a}突然朝{b}衝了過去，{b}嚇了一跳。','{a}追著{b}游了一小段，{b}慌忙躲開。','{a}好奇地追向{b}，{b}加快速度逃走了。'],
    tryPush:['{a}想湊近{b}，卻被輕輕撞了回來，看起來還不想放棄。','{a}繞到{b}旁邊，才剛靠近就被推開了。','{a}悄悄游向{b}的地盤，被撞得彈了一下。'],
    bounce:['{a}和{b}撞在一起，彈開之後又游回來，反覆好幾次。','{a}和{b}都想靠近對方，撞得砰砰彈開。','{a}與{b}碰了好幾下，才各自游走。'],
    flee:['{a}看到{b}靠近，嚇得立刻游開。','{a}一察覺{b}，就急急忙忙逃到另一邊。','{b}一靠近，{a}就縮起觸肢快速溜走了。'],
    nestle:['{a}悄悄游到{b}旁邊，窩在一旁。','{a}挨著睡著的{b}，安心地貼在旁邊。','{a}躲到{b}身邊，兩隻靜靜地待著。'],
    moved:['{b}被撞到了，慢吞吞地挪到別的地方，又躺了下來。','{b}被推開後打了個哈欠，換了個位置繼續睡。'],
    // 合得來的組合，偶爾多補一句（鍵是兩個個性 id 照字母排序用 + 連起來；{x}＝排前面的個性、{y}＝排後面的個性的小球名字）
    friend:{
      'shy+sleepy':'{x}好像只有在{y}旁邊才不緊張。',
      'curious+lively':'{x}和{y}好像特別合得來。',
      'clingy+stubborn':'{y}看似嫌棄，卻沒有真的把{x}趕走。',
      'helper+mimic':'{y}跟在{x}後面，學牠巡邏的樣子。',
    },
    // v0.28：新的個性行為
    follow:['{a}今天一直跟在{b}後面。','{a}繞著{b}游了一圈，又跟了上去。'],
    nosy:['{a}湊過去看了看，又游走了。','{a}好奇地游過去瞧瞧發生了什麼事。'],
    mediate:['{a}看到有小球撞在一起，急忙游過去勸架——結果大家撞成一團。','{a}游過去想幫忙，卻被捲進去一起撞了一下。'],
    mimic:['{a}學著{b}的樣子游。','{b}轉一圈，{a}也跟著轉一圈。']
  },
  // ---- 圖鑑同伴 ----
  guest:{
    join:'{name}緩緩飄進了水缸，想跟{larva}一起玩。',
    leave:'{name} 飄出了水缸。',
    bumpIn:'{name} 把{larva}輕輕撞開了。',
    bumpOut:'{larva}把{name}輕輕撞開了。',
    bumpAny:'{a}把{b}輕輕撞開了。',
    queue:'下一次換日時，牠會飄進水缸（最多 3 隻）。',
    queueLeave:'下一次換日時，牠會飄出水缸。'
  }
};
;
/* ==== js/data/temperaments.js ==== */
// 【資料】個性表。每種個性一列，程式只讀這張表；新增個性＝在這裡加一列＋在 texts.js 加名字與說明。
// 欄位說明：
//   speed      平常游動速度（數字越大越快）
//   trustGain  信賴成長倍率（互動後增加的信賴 × 這個數字）
//   favGain    碰到「喜歡的零食／玩具」時額外的倍率（頑固特別高）
//   explorer   true＝算「探索型」，玩耍時會累積探索次數（影響結局 END-03）
//   poke       被玩家戳時的反應，名稱對應 js/render/creature.js 的 POKE 表
//   （小球之間怎麼互動，看 js/render/social.js 的 REL 表）
//   territory  true＝有自己的角落，別人靠近會輕輕撞開對方
//   bubbles    true＝愛追著水裡的泡泡跑
//   shyPose    true＝信賴低時偶爾縮起來
//   sleepy     true＝大部分時間貼在缸底睡覺，偶爾才慢慢游一下（睏睏）
//   follow     true＝跟屁蟲：每天挑一隻「最喜歡的」小球跟著、偶爾繞圈；沒有同伴就靠近你的手指（游標）（黏人）
//   nosy       true＝湊熱鬧：哪裡有動靜（別的小球在動、泡泡、裝飾）就過去看一下，看完就走（好奇）
//   patrol     true＝固定的巡邏路線；看到別的小球相撞會游過去勸架（守序）
//   mimic      true＝學附近小球的動作（最愛學守序的）；沒有同伴就學你手指（游標）的動作（易染）
const TEMPERS={
  clingy:  {speed:.8, trustGain:1.3,favGain:1,  explorer:false,poke:'come',follow:true},
  shy:     {speed:.5, trustGain:.8, favGain:1,  explorer:false,poke:'hide',shyPose:true},
  curious: {speed:1.2,trustGain:1,  favGain:1,  explorer:true, poke:'wave',nosy:true},
  stubborn:{speed:.45,trustGain:1,  favGain:1.6,explorer:false,poke:'turn',territory:true},
  lively:  {speed:1.7,trustGain:1.1,favGain:1,  explorer:true, poke:'spin',bubbles:true},
  sleepy:  {speed:.3, trustGain:1,  favGain:1.2,explorer:false,poke:'stretch',sleepy:true},
  helper:  {speed:.9, trustGain:1.1,favGain:1,  explorer:false,poke:'come',patrol:true},     // 守序（v0.28；v0.29.10 定名）
  mimic:   {speed:1,  trustGain:1,  favGain:1.1,explorer:true, poke:'wave',mimic:true}       // 易染（v0.28；v0.29.10 定名）
};
const TEMPER_IDS=Object.keys(TEMPERS);
;
/* ==== js/data/tags.js ==== */
// 【資料】特殊標籤（機制參數）。標籤的名字、說明與各種情境的文字在 js/data/texts.js 的 TEXT.tags。
// 欄位：
//   weight    抽到「有標籤」之後，各標籤被抽中的權重（常見型 50｜一般型 30｜稀有型 10｜極稀有型 5）
//   off       true＝暫時不會分配給任何小球（等需要的機制做好）
//   needsLost true＝只有「消逝過的小球」還沒被用掉時才會出現（回歸者：消逝過幾隻，最多就出現幾隻）
// 標籤的行為與效果寫在：js/tags.js（分配、揭曉、裝飾與游標行為）、js/actions.js（餵食與玩耍）、
//   js/settle.js（每日結算）、js/render/creature.js（被戳）。
const TAGS={
  glutton:   {weight:50},
  playful:   {weight:50},
  touchy:    {weight:30},
  frail:     {weight:10},
  judge:     {weight:30},
  lovey:     {weight:10},
  clean:     {weight:30},
  scholar:   {weight:10},                           // 第一次聽到心聲時揭曉
  homereturn:{weight:5, needsLost:true},            // 同上；另外需要有消逝過的小球才會出現
  sneak:     {weight:10},                           // 偷偷七逃：換日時偶爾從缸邊游進來，才發現牠溜出去過
  vain:      {weight:30},                           // 愛美：戴著裝扮的日子信賴＋，沒戴會無聊（v0.28）
  smalleat:  {weight:30},                           // 不愛吃：肚子餓得慢，但每次吃得少（v0.28）
  high:      {weight:30}                            // 高高在上：喜歡待在水缸上半部；睏睏的話會浮在水面睡（v0.28）
};
// 互相矛盾、不會同時出現的標籤
const TAG_CLASH=[['glutton','frail'],['playful','scholar'],['frail','sneak'],['glutton','smalleat']];
// 每隻小球的標籤數量：50% 沒有、45% 一個、5% 兩個（v0.18.0 起一個標籤 +10%）
const TAG_ODDS={none:.50,one:.45};
;
/* ==== js/data/rules.js ==== */
// 【資料】每日結算與基本行動的數值（v0.30 從 js/settle.js、js/actions.js、js/state.js 抽出來，設定總表「數值參考」會自動列出）
// 要調難度改這裡；邏輯在 js/settle.js（每日結算）與 js/actions.js（換水、餵食、玩耍、出門）。

// 每日結算（照順序：① 飽食與水質 → ② 生命 → ③ 信賴 → ④ 核心變色 → ⑤ 死亡／結局）
const DAY_RULE={
  sat:{normal:28,glutton:36,smalleat:18},          // ① 每天飽食減少（貪吃鬼餓得快、不愛吃餓得慢）
  dirt:{normal:18,clean:9},                        // ① 每天污染增加（愛乾淨減半）
  ph:{drift:1.1,bias:.15,cleanMul:.5,min:4,max:10},// ① 酸鹼度每天隨機飄移 ±drift/2，再往遠離 7 的方向偏 bias；愛乾淨飄移 ×cleanMul
  lifeSat:{starve:20,starveD:-15,hungry:45,hungryD:-4,okD:4},   // ② 生命（飽食）：<starve 扣 starveD｜<hungry 扣 hungryD｜否則 +okD
  lifeWater:{severeD:-20,badD:-10,okD:3},          // ② 生命（水質）：嚴重｜差｜正常
  frailMul:1.5,                                    // ② 虛弱：生命的負變化 ×1.5
  trust:{sat:35,life:50,up:2,down:-5},             // ③ 信賴：飽食≥sat 且生命>life 就 +up，否則 down
  tagCost:{playfulDays:2,playful:3,lovey:2,cleanDirt:60,clean:3,vain:2},   // ③ 標籤的代價：貪玩 playfulDays 天沒玩 −3｜人類愛好者當天沒玩 −2｜愛乾淨污染>60 −3｜愛美沒戴裝扮 −2（戴了 +2）
  color:{day:3,trust:60,bond:2,life:50}            // ④ 核心染上代表色：第 day 日起，信賴≥、互動≥、生命≥
};
// 水質判定（「差」「嚴重」；虛弱的小球門檻比較低）。dirt＝污染超過，ph＝與 7 的差超過
const WATER_RULE={bad:{dirt:60,ph:1.2},severe:{dirt:85,ph:2},frailBad:{dirt:50,ph:1},frailSevere:{dirt:75,ph:1.6}};
// 基本行動
const ACT_RULE={
  water:{dirt:60,min:5,ph:.7,overLife:6},          // 換水：污染 −dirt（最低 min）、pH 往 7 靠 ph；同一天第二次換水生命 −overLife
  feed:{food:35,snack:15,smalleatMul:.6,full:85,fullGlutton:70,overFood:5,overSnack:3,dislikeSat:40,dislikeAmt:10,favTrust:11,okTrust:4},
  //   海草湯／零食的飽食｜不愛吃 ×smalleatMul｜飽食>full（貪吃鬼>fullGlutton）還硬塞：生命 −overFood／−overSnack
  //   不喜歡的零食：飽食≤dislikeSat 才勉強吃（+dislikeAmt），否則推開｜喜歡的零食信賴 +favTrust｜普通零食 +okTrust（都再乘個性倍率）
  play:{fav:9,playful:6,meh:2,scholarMul:.5},       // 玩耍信賴：最愛的玩具｜貪玩（每種都喜歡）｜普通｜學者 ×scholarMul
  out:{kitChance:.25,kitSure:3,decor:.35}          // 出門：水質檢測儀 25%（第 3 次起必得）｜背景裝飾 35%
};
// 結局條件（js/endings.js 由上到下第一個符合的）：END-05 核心被聊天染成別的顏色｜END-06 生命<sadLife 或信賴<sadTrust｜END-02 信賴≥bondTrust 且互動≥bondN
//   END-03 探索≥explore 且是探索型個性｜END-04 生命≥lonerLife 且互動≤lonerBond｜其他 END-01
const END_RULE={sadLife:40,sadTrust:25,bondTrust:70,bondN:5,explore:4,lonerLife:70,lonerBond:2};
;
/* ==== js/data/items.js ==== */
// 【資料】物品名稱、零食（GIFTS）／玩具清單、代表色色票。要新增物品或顏色，改這裡。
const NAME={food:'海草湯',agent:'換水劑',sweet:'甜果',salty:'鹹貝',bitter:'苦藻',bubble:'氣泡棒',bell:'小鈴鐺',ball:'軟球',kit:'水質檢測儀',wand:'亮亮指揮棒',bucket:'小水桶',magV:'潮流髮型雜誌',magH:'酷炫動漫雜誌'};   // wand：商店買的永久道具（META.tools），不在物品欄
const GIFTS=['sweet','salty','bitter'], TOYS=['bubble','bell','ball'];
const PLAY_TOOLS=['wand','bucket'];   // META.tools 裡會出現在玩耍選單的（雜誌 magV／magH 是聊天用的，不在玩耍）
const COLORS=['#e5484d','#ff8a3d','#f2b84b','#ffe94d','#5fd38d','#58a6ff','#a56bff','#ff7aa8','#8b5a2b','#25252b','#f5f5f5'];
const CNAME=['紅','橘','金','黃','綠','藍','紫','粉','棕','黑','白'];

// 物品圖鑑的分組（顯示順序）。新增物品時記得放進對應的組。
const ITEM_GROUPS=[['食物',['food']],['零食',GIFTS],['玩具',TOYS],['工具',['agent','kit']]];
;
/* ==== js/data/endings.js ==== */
// 【資料】結局名稱與文字。要新增或修改結局文字，改這裡；判定條件在 js/endings.js。
const ENDS={
 'END-01':['平穩成長','七天過去，{larva}的顏色安穩下來。牠不特別黏人，但已經習慣有你在。'],
 'END-02':['親密依附','{larva}總是第一個游到你面前。牠學會了你的動作，也記得你的聲音。'],
 'END-03':['好奇探索','牠對每一件新東西都伸出觸肢。你帶回來的世界，成了牠的第一堂課。'],
 'END-04':['慢熱獨立','牠健康地長大，保持著自己的步調。偶爾，牠會悄悄游到玻璃邊。'],
 'END-05':['特殊色彩','牠的核心留下了你的顏色。對異種來說，這是很重要的記號。'],
 'END-06':['遺憾的存活','{larva}撐過了第一週，但還有很多事你們沒能一起做。之後還有時間。'],
 'END-07':['提前消逝','{larva}的身體慢慢化開，溶進水裡。在最後的最後，似乎微微靠向你這一側。']
};
;
/* ==== js/data/emotes.js ==== */
// 【資料】表情氣泡的圖案與顏色（？！愛心打叉水滴星星刀叉）。要新增圖示，改這裡。
const ICON={
 heart:{c:'#ff6b8b',m:[' ## ## ','#######','#######',' ##### ','  ###  ','   #   ']},
 q:{c:'#4f86ff',m:[' ### ','#   #','   # ','  #  ','  #  ','     ','  #  ']},
 ex:{c:'#ffa81f',m:['  #  ','  #  ','  #  ','  #  ','  #  ','     ','  #  ']},
 x:{c:'#e0505a',m:['#   #',' # # ','  #  ',' # # ','#   #']},
 drop:{c:'#3fb2ff',m:['  #  ','  #  ',' ### ','#####','#####',' ### ']},
 food:{c:'#ff9d4d',m:['# # #  ##','#####  ##',' ###   ##','  #    ##','  #    ##','  #     #','  #     #']},
 star:{c:'#f2b73d',m:['  #  ','  #  ','#####','  #  ','  #  ']},
 crown:{c:'#f2b73d',m:['#  #  #','## # ##','#######','#######',' ##### ']},                 // 小皇冠（互動玩耍：第一名、猜中）
 note:{c:'#8b6bff',m:['   ###','   # #','   #  ','   #  ',' ###  ','####  ',' ##   ']},    // 音符（開心）
 sad:{c:'#6b8db8',m:['#   #',' #  # ','     ','     ',' ### ','#   #']},                    // 沮喪
 swirl:{c:'#3f7fe0',m:['#######','      #',' #### #',' #  # #',' # ## #',' #    #',' ######']},      // 藍色漩渦（懊惱、不想玩）
 dots:{c:'#8aa0ad',m:['       ','       ','       ','# # # #']}};                               // 「……」（沒什麼興趣）
;
/* ==== js/data/about.js ==== */
// 【資料】說明頁內容（世界觀、玩法、製作者）。要改說明文字，改這裡。
const ABOUT_HTML=`
<h3 data-tag="簡介">這是什麼遊戲？</h3>
<p>你要照顧一隻剛出生的異種幼體，在七天的新生期裡照顧牠、觀察牠，看看牠會長成什麼樣子。每一周目的幼體，個性、喜好和顏色都不一樣。</p>
<h3 data-tag="玩法">玩法</h3>
<ul>
<li>每天有 2 次行動：玩耍、聊天、出門。換水和餵食不佔行動，但太頻繁會讓小球不舒服。</li>
<li>餵食可以給海草湯或零食。零食飽食較少，但小球對零食和玩具有自己的喜好，發現後會記在「喜好」欄。</li>
<li>多觀察牠的動作和水色。出門有機會撿到水質檢測儀和背景裝飾（永久保留）。外出方式可以選「隨機」或「地圖」。</li>
<li>出門時可能遇見格蕾特。認識她之後可以開「小助手」幫忙換水餵食，也能開「翻譯」聽見小球的心聲；之後她還會教你用聊天幫小球染色。</li>
<li>玩具可以選「精簡」直接玩完，或「遊玩」在水缸裡真的玩一場。</li>
<li>點一下小球可以戳牠，不同個性與信賴程度會有不同反應。</li>
<li>第七天結算後會得到結局，並收進圖鑑。</li>
</ul>
<h3 data-tag="地圖">地圖上的地方</h3>
<ul>
<li>廢棄大樓區：言盡的商店，用積分買裝扮、玩具和雜誌（雜誌能讓外殼染成上下或左右兩色）。按「閒聊」可以和言盡聊天。</li>
<li>異生會大樓：3F 找瓊領取成就、提升心等；心等 2 開放 2F 賽倫絲的特殊委託（預約下一輪要照顧的小球）。主線第一章完成後開放 4F（言巷）、5F（言街），心等也能升到 5。大樓裡偶爾有小球在爬，戳牠可能會送你東西。</li>
</ul>
<h3 data-tag="圖鑑">圖鑑與同伴</h3>
<p>養成過的幼體會收進「小球們」頁面。在那裡可以幫牠們改名、標上星號、在「打扮」分頁換上裝扮、交還異生會（換積分；交還的小球之後可能寄信來），也可以勾選最多 3 隻「放入水缸」，下一次換日（或下一周目開始時）牠們會從水面或邊緣飄進水缸，一起游動、追逐、互撞。同伴只是陪伴，不需要照顧；消逝的小球只能留在圖鑑裡。</p>
<p>「觀察水缸」可以選最多 5 隻小球一起看、戳戳牠們、一起玩玩具。「圖鑑」記錄你見過的結局、個性、標籤、禮物與信紙；「收藏品」是你持有的物品、道具、裝飾品與裝扮（可以重看言盡的介紹），也可以在這裡決定撿到的裝飾要不要顯示。你的名字與代表色會記住，下次開局自動填入。進度存在這個瀏覽器裡，換裝置時請用「下載進度」與「上傳進度」搬移。</p>
<h3 data-tag="主線">主線：緊急委託</h3>
<p>心等 4 之後，到 B1 回答言曉君「有意願」並登記長相，第 0 日就會出現「主線」。主線裡你要照顧一顆特別的小球一整個月，也會和大樓的人們慢慢熟起來。</p>
<ul>
<li>每週先排行程：把照顧、打工、休閒排進七天裡；換藥水是固定的日子。空著的日子是自由行動，可以在地圖上自己決定去哪裡、逛商店。</li>
<li>按「執行這週」看這週過得怎麼樣，途中可能遇到人、發生事情。每週要付 200 元生活費，錢連續兩週是負的，委託就會被收回。</li>
<li>每週會有人來看看小球的狀況；月底評估時，小球的健康要達到標準。</li>
<li>收納：衣櫃換衣服和配飾（服飾店買的配飾也在這裡）、使用道具、日記本可以重看看過的劇情。</li>
<li>存檔：「系統」裡可以存三格；每週開始、白天回家時會自動存檔。第一章結束時可以存「中繼存檔」，之後從中繼存檔進入自由模式繼續逛（數值和好感不變，只有錢、道具、疲勞、疲倦會變）。</li>
</ul>
<h3 data-tag="世界觀">世界觀：異種</h3>
<p>異種是擁有高度智慧的自然生物，由一顆核心和大量柔軟、半透明的觸肢構成，身體可以自由改變形狀與顏色，成熟後能擬態成人類。他們親水、悠閒，對人類有天生的親近感，也會小心隱藏自己的身分。</p>
<p>幼體以卵孵化，出生時是透明的果凍球，沒有五官，只能用觸肢交流。大約一週內會逐漸形成穩定的顏色與行為傾向。早期死亡率很高，所以這七天特別重要。</p>
<p class="dim">世界觀設計、小球圖片製作：JM.　（其餘背景，裝飾物件，由Gemini產生）</p>
`;
;
/* ==== js/data/icons.js ==== */
// 【資料】按鈕上的單色圖示（16×16 像素，# ＝有顏色、. ＝透明）。顏色跟著按鈕文字色走（開啟時、停用時會自動變色）。
// 想換成自己畫的圖：把值改成圖片路徑字串，例如 water:'assets/icons/water.png'（建議 16×16 或 32×32、透明背景、只用一種顏色；
//   只會用到圖的「形狀」，顏色一樣跟著文字）。用圖片時，單檔預覽版 game_inline.html 要另外把圖片加進 assets-inline。
const ICONS={
  // 格蕾特小助手：裙子底下露出觸肢的小女孩剪影
  grete:[
    '......####......',
    '.....######.....',
    '.....######.....',
    '......####......',
    '.......##.......',
    '.....######.....',
    '....########....',
    '.....######.....',
    '.....######.....',
    '....########....',
    '...##########...',
    '..############..',
    '.##############.',
    '.##############.',
    '..#..#..#..#..#.',
    '.#..#..#..#..#..'],
  // 翻譯（心聲）：對話框
  trans:[
    '................',
    '.##############.',
    '.##############.',
    '.###........###.',
    '.##############.',
    '.###.....######.',
    '.##############.',
    '.###......#####.',
    '.##############.',
    '..############..',
    '.....###........',
    '....###.........',
    '...##...........',
    '..#.............',
    '................',
    '................'],
  // 換水：水滴
  water:[
    '.......##.......',
    '.......##.......',
    '......####......',
    '......####......',
    '.....######.....',
    '.....######.....',
    '....########....',
    '...##########...',
    '...##########...',
    '..####.#######..',
    '..###.########..',
    '..###.########..',
    '..####.#######..',
    '...##########...',
    '....########....',
    '......####......'],
  // 餵食：冒熱氣的碗
  feed:[
    '................',
    '....#....#....#.',
    '.....#....#..#..',
    '....#....#....#.',
    '.....#....#..#..',
    '................',
    '##############..',
    '##############..',
    '.############...',
    '.############...',
    '..##########....',
    '...########.....',
    '....######......',
    '....######......',
    '...########.....',
    '................'],
  // 玩耍：球
  play:[
    '................',
    '.....######.....',
    '...##########...',
    '..############..',
    '..###.########..',
    '.###.##########.',
    '.##############.',
    '................',
    '.##############.',
    '.##############.',
    '..############..',
    '..############..',
    '...##########...',
    '.....######.....',
    '................',
    '................'],
  // 聊天：一大一小兩個對話框
  chat:[
    '................',
    '.#########......',
    '###########.....',
    '###########.....',
    '###########.....',
    '###########.....',
    '.#########......',
    '..##.....######.',
    '.##.....########',
    '........########',
    '........########',
    '.........######.',
    '...........##...',
    '............##..',
    '................',
    '................'],
  // 出門：一對腳印
  out:[
    '.........#.#.#..',
    '................',
    '.........#####..',
    '........#######.',
    '........#######.',
    '........#######.',
    '.........#####..',
    '..........###...',
    '.#.#.#..........',
    '................',
    '.#####..........',
    '#######.........',
    '#######.........',
    '#######.........',
    '.#####..........',
    '..###...........'],
  // 亮亮指揮棒（商店商品圖還沒有時用）
  wand:[
    '...........#....',
    '..........###...',
    '........#######.',
    '.........#####..',
    '.........##.##..',
    '........#.......',
    '.......#........',
    '......#.........',
    '.....#..........',
    '....#...........',
    '...#............',
    '..#.............',
    '.#..............',
    '#...............',
    '................',
    '................'],
  // 小水桶（商店商品圖還沒有時用）
  bucket:[
    '................',
    '....########....',
    '...#........#...',
    '..#..........#..',
    '..############..',
    '..############..',
    '...##########...',
    '...##########...',
    '...##########...',
    '....########....',
    '....########....',
    '....########....',
    '.....######.....',
    '................',
    '................',
    '................'],
  // 物品：包包
  bag:[
    '................',
    '.....######.....',
    '....#......#....',
    '....#......#....',
    '..############..',
    '.##############.',
    '.##############.',
    '.######..######.',
    '.######..######.',
    '.##############.',
    '.##############.',
    '.##############.',
    '.##############.',
    '..############..',
    '................',
    '................']
};
;
/* ==== js/data/news.js ==== */
// 【資料】更新公告（☰ →「更新公告」）。新的放最上面；要改文字直接改這裡。
const NEWS_HTML=`
<h3>主線第一章：緊急委託（v0.40～v0.40.69）</h3>
<p>心等 4 之後，到 B1 回答言曉君「有意願」並登記長相，第 0 日就會出現「主線」。言曉君交給你一顆受了傷的特別小球，你要照顧牠一整個月。</p>
<ul>
<li><b>行程本</b>：每週把照顧、打工、休閒排進七天，換藥水是固定的日子（週二、週五）。能力夠了會解鎖新的打工；打工有大成功、大失敗；會遇到的人用頭像標出來。點空著的日子＝自由行動。</li>
<li><b>執行這週</b>：每天一格小動畫，看得到你、遇到的人、路過的小球和圍著你的小球，下面寫數值的變化；可以跳過，週末有一週的結算。</li>
<li><b>自由行動</b>：在地圖上自己決定去哪裡——商店街（道具店、服飾店、便利商店、咖啡廳、KTV、電玩中心）、中央公園、廢棄大樓區、活動中心、異生會大樓（4F 研究室、5F 董事長辦公室）。白天可以回家照顧小球、存檔。</li>
<li><b>錢</b>：每週生活費 200 元；錢不夠的那天做不了要花錢的事；連續兩週是負的，委託就會被收回。</li>
<li><b>大樓的人們</b>：言街、賽倫絲、言巷、瓊每週輪流來看小球，月底評估時小球的健康要達到標準。和格蕾特、言盡、言默、言曉君、阿言的小故事會在路上遇到；好感用愛心表示。有些事只在做某個行程時偶爾發生。</li>
<li><b>劇情演出</b>：人物有七種表情，會走進走出、移動、跳、蹲、倒下；小球們會跳、揮手、睡覺；格蕾特小助手會從角落冒出來提醒你。</li>
<li><b>收納</b>：衣櫃（基礎衣物可以換色，配飾在服飾店拿）、道具（入門書、舒緩液、能量飲料）、日記本（重看看過的劇情；還沒遇到的灰灰地寫著條件，可以隱藏）。</li>
<li><b>商店</b>：道具店由賽倫絲、阿言輪流顧店；服飾店開幕送神秘應援組合，衣物可以先試穿，點兩下才買。主線買的衣物記在各自的存檔裡。</li>
<li><b>存檔</b>：「系統」裡三格存檔，另外有自動存檔；白天回家時也能存。第一章結束時可以存三格中繼存檔，之後進入自由模式繼續逛（數值和好感不變，只有錢、道具、疲勞、疲倦會變）。</li>
<li><b>畫面</b>：配色可以選永晝、永夜或隨時間變化；水缸裡的小球照狀態游動，點一下牠會躲起來；手機版的彈出框比較大。</li>
<li><b>日常模式</b>：主線第一章完成後，異生會大樓開放 4F（言巷）、5F 董事長辦公室（言街），心等可以升到 5，也多了新成就。主線存過檔的配飾，日常的長相設定也能用；玩家設定裡也有衣櫃。</li>
<li><b>讀取</b>：開遊戲時有讀取畫面；開頭讀取變快（圖片用到時才讀），進主線時先讀眼前要用的圖。</li>
<li>其他：全部人物換成新版立繪（七種表情）、新背景、安全性加強。</li>
</ul>
<h3>長相登記（v0.33.1～v0.35.4）</h3>
<p><b>新功能</b></p>
<ul>
<li>長相登記（紙娃娃）：心等 4 在異生會大樓 B1 見到言曉君後，她會問要不要接之後的緊急委託。選「有」就能登記自己的長相：前髮、後髮、綁髮、鬢角、呆毛、眉、眼、眼睛光、嘴巴、耳朵、膚色、髮色、瞳色、衣服，每個部件都能調大小和位置。選「還在考慮」也沒關係，之後按「緊急委託」可以再回答。</li>
<li>表情：喜、怒、哀、樂、驚可以各配一張臉，或選「泡泡」（臉不變，頭上跳出泡泡）。漫畫表現的眼睛（花形、愛心、怒目）有自己的顏色，也可以改成跟瞳色一樣。</li>
<li>登記後，B1 的「緊急委託」下面有「更改登記」。</li>
<li>新頁面「玩家設定」（☰，在「設定與存檔」上面）：看自己的長相、更改長相；暱稱和代表色也搬到這裡。</li>
<li>打扮改成自己的視窗（「小球們」右上的「打扮」）。分類列最前面的「小球」可以換一隻小球打扮。</li>
<li>新裝扮：手機（言盡的商店）。</li>
</ul>
<p><b>調整</b></p>
<ul>
<li>小球的圖換成更細緻的新版：邊緣更乾淨，身上的反光不會再跟著換顏色（深色的小球也亮亮的），核心的光暈也柔和一點。言盡行李箱裡的小球也變清楚了。</li>
<li>打扮：手機比較矮時，裝扮不會再被擠到看不見；點裝扮時格子不會跳回最上面；小球清單跟著配色。電腦版的顏色可以排成兩行。</li>
<li>修正：打扮的裝扮格子一度多出白色底。</li>
</ul>
<p><b>下一版預告</b></p>
<ul>
<li>v0.4 主線：言曉君的緊急委託、4F 研究中心與 5F 顧問辦公室，以及更多異生會的故事。</li>
</ul>
<h3>外觀與大樓的人們（v0.30～v0.33）</h3>
<p><b>新功能</b></p>
<ul>
<li>外觀設定（☰ → 設定，最下面）：版型（立體／平面）、6 種配色（經典、夜櫻、深海、暮紫、黑夜、奶茶）、像素字體（俐方體11號）。只存在這台裝置，不影響存檔。</li>
<li>言曉君任務回來了：心等 4 時可以在異生會大樓 B1 見到她，戳她會說些話。</li>
<li>大樓 1F 有時會遇到認識的人（格蕾特、瓊、賽倫絲、言曉君、言盡）；在 1F 遇到後再按他們的樓層，會有不一樣的對話。</li>
<li>心等 4：累積 ♥36 可以找瓊升級，賽倫絲的特殊委託名單會多一隻（4 隻）。</li>
<li>新成就（共 35 項）：完成 1 次、3 次特殊委託；認識言盡、瓊、賽倫絲、言曉君的初見成就。</li>
<li>圖鑑和收藏品分成兩頁：「圖鑑」記錄見過的結局、個性、標籤、禮物與信紙；「收藏品」是持有的物品、道具、裝飾品和裝扮。道具、裝扮有圖片格子，點一下可以重看言盡的介紹。</li>
<li>新裝扮：兔兔、狗勾、小青、卯咪、鼠薯（言盡的商店）。</li>
<li>電梯多了 4F、5F（目前還不開放）。言盡的閒聊也多了幾段。</li>
</ul>
<p><b>調整</b></p>
<ul>
<li>打扮：小球的名字改成預覽圖下方的名牌，裝扮名稱和言盡的介紹放在右邊，按鈕改成「確定」放右下角。</li>
<li>商店與道具的圖換成新版。</li>
<li>「不愛吃」的小球：改成餓了但不太積極的樣子，不會再同時出現「看著海草湯」和「還不太餓」。</li>
<li>成就「看透小球心」照說明改成發現 10 種標籤就達成（之前要全部）。</li>
<li>修正：「一般幼體」這類句子裡的「幼體」不會再被換成小球的名字。</li>
<li>許多台詞、說明與錯字修正。</li>
<li>存檔格式沒有變，舊進度和下載的存檔都能照常使用。</li>
</ul>
<p><b>下一版預告</b></p>
<ul>
<li>長相登記：在 B1 找言曉君捏一個屬於自己的紙娃娃。</li>
<li>之後（v0.4）：主線故事，以及 4F、5F 的研究中心和顧問辦公室。</li>
</ul>
<h3>v0.29.14～15</h3>
<ul>
<li>大樓、商店：視窗很大時，人物和行李箱不再放大超過原圖。</li>
<li>圖片載入失敗時，畫面不會停住；底部會寫出是哪個檔案沒載到。</li>
</ul>
<h3>異生會大樓篇（v0.25～v0.29）</h3>
<p><b>異生會大樓</b></p>
<ul>
<li>地圖上的異生會大樓開放了（耗 1 行動）。搭電梯上下樓：1F 大廳偶爾會遇到格蕾特，3F 是後勤的瓊，2F 是實習生賽倫絲。</li>
<li>成就：養育、圖鑑、交流、禮物、信紙、外出共 29 項，達成時畫面上方會跳通知，到 3F 找瓊領取積分和心。部分隱藏成就會送特別的裝扮（狐面、偵探帽）。</li>
<li>心等：心累積夠了可以找瓊升級（目前最高 3 等）。心等越高，言盡的商店擺越多商品；心等 2 開放 2F 的特殊委託。</li>
<li>特殊委託：賽倫絲會拿出一份名單，每隻小球都有個性、標籤和被託付的理由。預約一隻，下一輪就會接到牠（一開始就帶著顏色）。</li>
<li>大樓和商店的背景裡偶爾有小球在爬，戳戳牠可能會送你換水劑或點心；交還過的小球也會回來逛，第一下戳會認出你、跟你揮手。</li>
</ul>
<p><b>言盡的商店</b></p>
<ul>
<li>商品分成「隨機商品」和「固定商品」兩頁；隨機商品買完時，行李箱裡會有小球。</li>
<li>新增「閒聊」：到廢墟裡和言盡聊天，戳她會發呆。</li>
<li>雜誌染色：買了潮流髮型雜誌、酷炫動漫雜誌，聊天時外殼可以染成上下或左右的漸層兩色。</li>
<li>新裝扮：螢光棒，可以自己選顏色，或選「彩虹」讓它慢慢變色。</li>
</ul>
<p><b>新的個性與標籤</b></p>
<ul>
<li>新個性「守序」：有固定的巡邏路線，看到小球相撞就去勸架。「易染」：會學旁邊小球的動作，沒有同伴時學你的手指。</li>
<li>黏人每天會挑一隻同伴跟著；好奇會跑去看熱鬧。</li>
<li>新標籤：愛美（喜歡被打扮）、不愛吃（吃得少也餓得慢）、高高在上（喜歡待在水面附近）。</li>
</ul>
<p><b>小球們與信紙</b></p>
<ul>
<li>小球們頁分成「照顧中／已交還／打扮」。打扮分頁可以幫每一隻小球選裝扮，先預覽再換上。</li>
<li>信紙依種類有自己的插圖：問候、期許、道別。</li>
<li>結局畫面的摘要改成一張表：個性與標籤、存活天數、喜好、顏色（色碼和色名）。</li>
</ul>
<p><b>畫面與其他</b></p>
<ul>
<li>大樓、公園、商店街的正式背景與人物立繪（瓊、賽倫絲），格蕾特的事件也改成有背景的畫面。</li>
<li>所有彈出框統一：字體大小、主要按鈕（黃底）、清單的樣式。</li>
<li>修正：高更新率螢幕上動畫變快、小助手換水被算成換太多次、直接開 index.html 染色時出錯等。</li>
<li>存檔格式沒有變，舊進度和下載的存檔都能照常使用。</li>
</ul>
<p><b>下一版預告（v0.3 起）</b></p>
<ul>
<li>主線劇情：B1 的言曉君、緊急委託，以及更多異生會的故事。</li>
</ul>
<h3>2.0 完成（v0.16～v0.24）</h3>
<p><b>開始與每一輪</b></p>
<ul>
<li>開場故事、簽名與筆跡顏色。沒有小球時是第 0 日，按「接取新委託」幫新的小球取名字開始照顧；七天後按「等待新委託」回到第 0 日。</li>
<li>每天 2 次行動：玩耍、聊天、出門。換水、餵食不佔行動。</li>
</ul>
<p><b>玩耍與聊天</b></p>
<ul>
<li>玩具可以「精簡」直接玩完，或「遊玩」在水缸裡真的玩一場：氣泡棒、小鈴鐺、軟球、亮亮指揮棒、小水桶。小球的個性與喜好會影響玩得開不開心。</li>
<li>聊天是獨立的按鈕。認識格蕾特之後，聊天可以幫小球染色，之後還能分別染核心和外殼。在言盡的商店買到雜誌，外殼還能染成上下或左右的漸層兩色。</li>
</ul>
<p><b>外出</b></p>
<ul>
<li>外出方式可以選「隨機」或「地圖」（出門鍵上的小牌子直接切換）。中央公園、商業區撿到的東西不同。</li>
<li>廢棄大樓區：言盡的商店。用積分買日常道具、互動玩具和 22 種裝扮（可以先預覽）。</li>
</ul>
<p><b>小球們與交還</b></p>
<ul>
<li>小球們頁：星號、放入水缸、交還異生會（依標籤換積分）；「打扮」分頁幫每隻戴一件裝扮。已交還的另外列一頁。</li>
<li>交還的小球滿 5 週後可能寄信來（問候、期許、道別），可以收進「收藏品 → 信紙」。</li>
<li>觀察水缸：選最多 5 隻小球一起看，可以戳、開翻譯聽心聲，也能拿五種玩具一起玩。</li>
</ul>
<p><b>介面</b></p>
<ul>
<li>右上角 ☰：小球們、觀察水缸、收藏品、設定與存檔、說明與公告。手機版行動區固定在底部，不用捲動。</li>
<li>水缸裡的小球被戳、玩耍時會冒出表情氣泡。</li>
</ul>
<p><b>下一版預告（v0.25 起）</b></p>
<ul>
<li>異生會大廳（地圖上的異生會大樓，耗 1 行動）：認識後勤人員瓊、賽倫絲、曉君。</li>
<li>成就與心等：達成成就可以領積分和心，心等提高後會開放更多功能（商店商品變多等）；部分成就可以拿到特別的裝扮。</li>
<li>雜誌染色：在言盡的商店買流行雜誌，學會外殼上下、左右兩色（漸層或分色）。</li>
<li>緊急委託（之後）：還在任務中，敬請期待。</li>
</ul>
<h3>v0.29.12</h3>
<ul>
<li>修正：直接打開 index.html 玩的時候，雜誌兩色染色會跳出錯誤訊息。</li>
</ul>
<h3>v0.29.11</h3>
<ul>
<li>商店底部的「閒聊／看商品」和「離開商店」按鈕一樣寬。</li>
</ul>
<h3>v0.29.10</h3>
<ul>
<li>新個性定名：「熱心」改名「守序」、「愛模仿」改名「易染」。</li>
<li>守序喜歡指揮棒、易染喜歡小水桶。</li>
</ul>
<h3>v0.29.9</h3>
<ul>
<li>信紙配圖依種類：問候（櫻花）、期許（綠葉）、道別（冬天）。</li>
<li>偵探帽換上正式圖。</li>
</ul>
<h3>v0.29.8</h3>
<ul>
<li>新裝扮：螢光棒（言盡的商店）。在「打扮」可以選顏色，或選「彩虹」讓它慢慢變色。</li>
<li>說明頁補上格蕾特、商店、異生會大樓的介紹。</li>
</ul>
<h3>v0.29.7</h3>
<ul>
<li>2F、3F 的背景對調。</li>
<li>信紙配圖依種類分成三張：問候、期許、道別（道別信也有配圖了）。</li>
</ul>
<h3>v0.29.6</h3>
<ul>
<li>新背景：2F 實習生辦公室、公園、商店街；3F、B1 背景更新。</li>
</ul>
<h3>v0.29.5</h3>
<ul>
<li>結局摘要合成一張表，喜好改成一行（零食 / 玩具）。</li>
</ul>
<h3>v0.29.4</h3>
<ul>
<li>兩本雜誌換上正式的商品圖。</li>
</ul>
<h3>v0.29.3</h3>
<ul>
<li>商店閒聊畫面的小球也會送東西了（每次去最多 3 個）；行李箱往中間挪。</li>
<li>小球和人物靠在一起時，點下去會先戳到小球。</li>
<li>整理樣式表（畫面不變）。</li>
</ul>
<h3>v0.29.2</h3>
<ul>
<li>言盡的商店：商品畫面只留行李箱和對話框；按「閒聊」切到廢墟場景，言盡站在行李箱旁邊，偶爾有小球在爬。戳言盡發呆時會換表情。</li>
<li>大樓與商店的人被戳時，跳的高度依個性不同：瓊、格蕾特跳得大，賽倫絲中等，言盡很小。</li>
<li>背景的小球送的東西改成換水劑或點心（甜果、鹹貝、苦藻三選一）。</li>
<li>「小球們」的分頁改成：照顧中／已交還／打扮。</li>
</ul>
<h3>v0.29.1</h3>
<p><b>畫面整理</b></p>
<ul>
<li>字體統一成五級：大標題、中標題、小標題、本文、備註。</li>
<li>每個框裡最主要的按鈕改成黃底（接取、推薦顏色、打扮好了、等待新委託、全部領取……）。</li>
<li>格蕾特的相遇與聊天事件改成場景版（公園、商店街；背景圖之後換正式的）。</li>
<li>特殊委託的名單改成和「小球們」一樣的卡片；信紙收藏改成細線分隔。</li>
<li>結局畫面的摘要改成兩張小表，顏色寫色碼和色名。</li>
<li>觀察水缸的選擇標題改成「選擇小球」；信紙配圖改成 2:1。</li>
</ul>
<h3>v0.29.0</h3>
<p><b>整體檢查與優化</b></p>
<ul>
<li>高更新率螢幕（120Hz 等）上，背景泡泡、軟球、氣泡棒的泡泡不會再跑得比較快。</li>
<li>格蕾特小助手：玩家當天已經換過水，再開小助手時不會被當成「一天換太多次」。</li>
<li>觀察水缸裡，回歸者被戳時也不會躲開（和日常一樣）。</li>
<li>小螢幕的收藏品表格不再一個字一行。</li>
<li>介面上零散的文字都搬進設定總表（新的「零散的介面文字」「觀察水缸」分組），之後都能從總表改。</li>
<li>整理程式與樣式：拿掉沒用到的部分、聊天自訂顏色不再讓記憶體一直變大。</li>
</ul>
<h3>v0.28.7</h3>
<ul>
<li>整理存檔的程式（存檔格式不變，舊進度與下載的檔案都能照常使用）。</li>
</ul>
<h3>v0.28.6</h3>
<ul>
<li>雜誌染色先只有柔和（漸層）的效果，「分色」暫時拿掉。</li>
<li>聊天框會記住上次選的外殼樣式與顏色，不用每次重選。</li>
<li>單一檔案版的大樓背景改用較小的圖片格式，載入更快。</li>
</ul>
<h3>v0.28.5</h3>
<p><b>雜誌染色</b></p>
<ul>
<li>言盡的商店新商品：潮流髮型雜誌（外殼上下兩色）、酷炫動漫雜誌（外殼左右兩色）。學會雙色之後才會擺出來，買了永久有效。</li>
<li>聊天框多了「外殼：單色｜上下｜左右」。兩邊各自聊 3 次就會染上，染好之後想換樣式，選好聊一次就換。</li>
<li>交還、收進圖鑑的小球都會記住兩色外殼。</li>
</ul>
<ul>
<li>大廳背景換成比較深的版本，背景的小球比較看得清楚。</li>
</ul>
<h3>v0.28.4</h3>
<ul>
<li>交還過的小球偶爾會回異生會大樓逛逛（顏色和交還時一樣），戳一下會認出你、跟你揮手。</li>
<li>大廳換新背景；人物和背景小球稍微放大。</li>
</ul>
<h3>v0.28.3</h3>
<ul>
<li>異生會大樓的背景裡，有時會有一隻小球在爬；戳戳牠，偶爾會送你海草湯或換水劑（每次去最多拿 3 個）。</li>
<li>大樓裡人物的名牌加上框，比較看得清楚；人物縮小一點。</li>
<li>賽倫絲的立繪修正。</li>
</ul>
<h3>v0.28.2</h3>
<ul>
<li>賽倫絲換上正式立繪。</li>
</ul>
<h3>v0.28.1</h3>
<ul>
<li>異生會大樓換上正式的背景圖（大廳、3F、B1）與瓊的立繪；瓊只有被嚇到時才會換成驚訝的表情。</li>
<li>文字調整：新禮物改名（學你的模仿秀、吃光光的瞬間）、特殊委託說明文等。</li>
<li>翻譯：小球「什麼都沒在想」的機率從約 55% 降到約 45%，比較常聽到心聲。</li>
</ul>
<h3>v0.28.0</h3>
<p><b>新個性</b>（名稱暫定）</p>
<ul>
<li>熱心：有固定的巡邏路線；看到小球相撞就游過去勸架，結果常常撞成一團。</li>
<li>愛模仿：學旁邊小球的動作（最愛學熱心的）；沒有同伴時，會學你手指的動作。</li>
<li>熱心和愛模仿特別合得來。</li>
</ul>
<p><b>個性調整</b></p>
<ul>
<li>黏人：每天挑一隻最喜歡的小球跟著跑、在旁邊繞圈圈；沒有同伴就黏著你的手指。</li>
<li>好奇：哪裡有動靜（別的小球在游、相撞、泡泡、裝飾）就過去看一下，看完就走。</li>
</ul>
<p><b>新標籤</b></p>
<ul>
<li>愛美：戴著裝扮心情好，沒戴會無聊。</li>
<li>不愛吃：肚子餓得慢，但每次吃得少。</li>
<li>高高在上：喜歡待在水缸上半部。睏睏的話……會浮在水面上睡覺。</li>
</ul>
<h3>v0.26.1</h3>
<ul>
<li>特殊委託：預約的小球一開始就帶著名單上的顏色。說明文變多，也會依個性、標籤挑比較對得上的理由。</li>
<li>修正：行李箱的小球在角落跳到另一隻頭上時，會一直彈個不停。</li>
<li>套用新的賽倫絲台詞。</li>
</ul>
<h3>v0.26.0</h3>
<p><b>新功能</b></p>
<ul>
<li>特殊委託（異生會大樓 2F，心等 2）：認識賽倫絲之後，可以查看委託名單，每隻小球都寫著個性、標籤和照顧者暫時不能照顧的原因。每一輪可以預約一隻，下一輪接到的就是牠。名單每次來大樓都會換一批，心等 3 時名單變 3 隻、帶標籤的機率也提高。</li>
</ul>
<p><b>調整</b></p>
<ul>
<li>行李箱裡的小球：爬行改成「平常＋趴下」交替，兩隻時比較常靠近彼此，也比較容易跳到對方頭上。</li>
<li>戳言盡時，行李箱裡的小球不會再跳回原位。</li>
</ul>
<h3>v0.25.7</h3>
<ul>
<li>行李箱裡的小球動作變多：爬行、窩著休息、揮手、自己跳一跳；戳了會Q彈地跳起來。</li>
<li>兩隻小球靠太近會互相彈開一點；一隻跳起來落在另一隻頭上會再彈一次，下面那隻被壓扁一下。</li>
<li>套用新的商店、大樓、成就文字。</li>
</ul>
<h3>v0.25.6</h3>
<ul>
<li>商店：買下最後一件隨機商品時，言盡會馬上說「東西，賣完了。」，行李箱裡換成小球，不用下次再白跑一趟。</li>
<li>行李箱裡的小球會慢慢爬來爬去，戳一下會Q彈地跳起來；偶爾會有兩隻，言盡也會對牠們有反應。</li>
<li>戳大樓裡的人，她們會跳一下。</li>
</ul>
<h3>v0.25.5</h3>
<ul>
<li>商店分成兩個分頁：「隨機商品」（裝扮、永久玩具，每次去才換）和「固定商品」（海草湯、換水劑、零食、三種玩具，1～2 積分，每次都有）。</li>
<li>隨機商品都買完之後，行李箱上會有一隻可以戳的小球。</li>
<li>修正：剛買過的東西，下一次去商店還可能擺出來。</li>
</ul>
<h3>v0.25.4</h3>
<ul>
<li>大樓的電梯按鈕：電腦版改成左右兩排（左 2F、1F、B1，右 4F、3F），和背景圖一樣高。頂樓改名 4F。</li>
<li>手機版對話框加高到約 4 行。</li>
</ul>
<h3>v0.25.3</h3>
<ul>
<li>異生會大樓版面調整：電腦版變寬，背景改成橫長；手機版電梯按鈕移到最上面。每層樓的框大小一樣，切換樓層不會跳動。</li>
<li>可以戳大樓裡的人和商店的言盡，會有不同的反應。</li>
</ul>
<h3>v0.25.2</h3>
<p><b>新功能</b></p>
<ul>
<li>異生會大樓開放（地圖，耗 1 行動）：進去先到 1F 大廳，用電梯到各樓層，同一趟可以全部逛完。格蕾特偶爾會在大廳幫忙。</li>
<li>3F 後勤辦公室：認識瓊。可以查看成就、領取積分和心（也能一次全部領取），心夠了就能升級心等。部分成就會送裝扮（狐面、偵探帽）。</li>
<li>心等 3 時，言盡的商店每次多擺一種商品。2F（心等 2）、B1（心等 3）、頂樓之後開放。</li>
<li>達成成就時，畫面最上方會跳出提示。</li>
</ul>
<h3>v0.25.1</h3>
<ul>
<li>小球們頁的分頁改成「小球們｜已交還｜（空）｜打扮」四等分，打扮分頁用比較淡的顏色。</li>
</ul>
<h3>v0.25.0</h3>
<ul>
<li>小球們頁新增「打扮」分頁：上面選小球（包含這一輪的小球），中間預覽，下面依「頭飾／臉飾／圖示／其他」挑裝扮。選好按「打扮好了」才會換上。</li>
<li>原本小球們列表的「裝扮」按鈕、物品裡的裝扮欄改到「打扮」分頁。</li>
</ul>
<h3>v0.24.6</h3>
<ul>
<li>商店新裝扮：小小球、中二眼罩、ドドド、ゴゴゴ。</li>
</ul>
<h3>v0.24.5</h3>
<ul>
<li>商店不再擺出已經有的東西（手上已有的玩具、買過的裝扮與永久玩具）。</li>
<li>氣泡棒：不喜歡的小球改成「頭昏眼花，不太喜歡」。</li>
</ul>
<h3>v0.24.4</h3>
<ul>
<li>修正：在等結局框出現的那一下進入觀察水缸，之後可能出錯。</li>
<li>說明頁補上外出地圖、商店、互動玩耍、交還與信紙、觀察水缸。</li>
</ul>
<h3>v0.24.3</h3>
<ul>
<li>商店：換上新的行李箱圖；商品外圍多一圈淡淡的白光；裝扮商品圖不再放大。</li>
<li>裝扮預覽改成蓋在行李箱上的大預覽框，可以直接購買。</li>
<li>拿掉像素眼鏡。言盡的介紹台詞改得更簡短。</li>
</ul>
<h3>v0.24.2</h3>
<ul>
<li>商店新增 18 種裝扮（眼鏡、貓耳、蝴蝶結、髮夾、貼紙、翅膀、惡魔套裝……），全部換成手繪圖。</li>
<li>指揮棒、小水桶換上新圖。小水桶可以放在下半部的石頭地；有小球躲進去時，水桶會倒蓋罩住牠、抖一抖再消失。</li>
</ul>
<h3>v0.24.1</h3>
<ul>
<li>換上新圖：格蕾特、言盡的立繪與商店頭像、像素眼鏡的商品圖。</li>
<li>畢業小球的信改成：交還滿 5 週後才會寄；5～7 週的信可能是期許或道別，8 週以上是問候。每輪從最近交還的小球開始判定，最多一封。</li>
</ul>
<h3>v0.24.0</h3>
<ul>
<li>「聊天」變成獨立的按鈕（耗 1 行動），玩耍選單只放玩具。電腦版的行動鍵改成兩欄排列。</li>
<li>觀察水缸上方多了「玩耍」：五種玩具都可以拿來和水缸裡的小球們玩（不會用掉）。</li>
</ul>
<h3>v0.23.2</h3>
<ul>
<li>商店新商品：小水桶（永久持有）。點水缸裡一個地方放下水桶，害羞、頑固、睏睏的小球會躲進去，第一個躲進去的贏。</li>
<li>指揮棒不算「最喜歡的玩具」，改看個性（黏人、好奇、活潑）；水桶剛好相反。</li>
<li>不喜歡時的表情改成藍色線條漩渦。</li>
<li>指揮棒、小鈴鐺、小水桶遊戲進行中，小球們暫時不會互撞。</li>
</ul>
<h3>v0.23.1</h3>
<ul>
<li>互動玩耍會看小球的喜好：最喜歡的玩具（或有「貪玩」標籤）玩得很開心；不喜歡的會懊惱（龍捲風）、追得慢、找到鈴鐺也沒什麼興趣、軟球只意思意思頂一下。指揮棒看個性：黏人、好奇、活潑喜歡追。</li>
</ul>
<h3>v0.23.0</h3>
<p><b>新功能</b></p>
<ul>
<li>互動玩耍：玩耍鍵上的小牌子（或設定）可以切換「精簡／遊玩」。選「遊玩」時，玩具會在水缸裡真的玩一場：
  <br>指揮棒——小球們追著游標（手指）跑，第一個碰到的戴上小皇冠；
  <br>氣泡棒——游標劃過的地方冒出一串泡泡，被捲到的小球轉圈圈；
  <br>小鈴鐺——把鈴鐺藏進裝飾或水草裡，讓小球們猜；
  <br>軟球——小球用頭頂球，頂越多下越開心。</li>
<li>商店新商品：亮亮指揮棒（永久持有）。</li>
<li>水缸裡的同伴被戳、或玩耍時，也會冒出表情氣泡。</li>
</ul>
<h3>v0.22.3</h3>
<ul>
<li>換上新圖：廢棄大樓背景、行李箱、商店的行李箱與六種商品圖。</li>
</ul>
<h3>v0.22.2</h3>
<ul>
<li>小球們頁改版：名字左邊小星號（星號排最前面）；按鈕改成「裝扮」「放入水缸」「交還異生會」。裝扮可以先預覽再戴上，圖鑑縮圖、水缸同伴、觀察水缸都會戴著。</li>
<li>拿掉「隱藏」（以前隱藏的小球回到列表）；分頁改成「小球們／已交還」，已交還紀錄直接列在那一頁。</li>
<li>修正：遇過格蕾特之後，接取新委託的框還留著她的圖。</li>
<li>物品裡「戴上」按鈕縮小。</li>
</ul>
<h3>v0.22.1</h3>
<ul>
<li>商店新商品：像素眼鏡（裝扮，永久持有）。選取後可以「預覽」小球戴上的樣子；買了之後在「物品」裡幫小球戴上／拿下。</li>
<li>日常道具降價（2～3 積分）。</li>
<li>商店電腦版變寬；持有積分移到最下面「離開商店」旁邊。</li>
</ul>
<h3>v0.22.0</h3>
<p><b>新功能</b></p>
<ul>
<li>廢棄大樓的商店：地圖上的「廢棄大樓區」開放（耗 1 行動）。第一次去會遇見言盡；之後每次行李箱上會擺 3 種商品，用積分購買（點一下看介紹，再點一次買）。</li>
<li>出門鍵上多了「隨機／地圖」小牌子，點它可以直接切換外出方式。</li>
</ul>
<p><b>調整</b></p>
<ul>
<li>換上新的地圖底圖。</li>
<li>修正：地圖上選「住所」時說明多出 null。</li>
</ul>
<h3>v0.21.0</h3>
<p><b>新功能</b></p>
<ul>
<li>外出地圖：設定的「外出方式」可以選「自選地點（地圖）」。點一下地點看說明，再點一次出發；選「住所」＝不出門。</li>
<li>中央公園：海草湯、零食比較多。商業區：換水劑、玩具比較多。異生會大樓、廢棄大樓區之後開放。</li>
<li>隨機外出也會顯示去了哪裡。</li>
</ul>
<h3>v0.20.2</h3>
<ul>
<li>信紙分成三種：問候、期許、道別（標題與收藏會顯示）。收到「道別」信，和小球提前消逝一樣，會讓之後多一次遇到回歸者的機會。</li>
<li>收藏品的信紙改成直接「展開」看內文；「收納」按兩次可以從收藏拿掉。</li>
<li>信的近況與祝福多了更多寫法。</li>
<li>統一稱呼為「異生會」。</li>
</ul>
<h3>v0.20.0</h3>
<p><b>新功能</b></p>
<ul>
<li>畢業小球的信紙：交還異生會的小球，過一陣子可能會寄信來（每隻一封）。可以加入收藏，在「收藏品 → 信紙」重看。</li>
<li>設定新增「收到畢業小球的信」：跳出信紙，或只在訊息區提示。</li>
</ul>
<p><b>調整</b></p>
<ul>
<li>版本號回到左上角。</li>
<li>修正開始時偶爾跳出的 ResizeObserver 錯誤訊息。</li>
</ul>
<h3>v0.18.1</h3>
<p><b>新功能</b></p>
<ul>
<li>右上角「☰」選單：小球們、觀察水缸、收藏品、設定與存檔、說明與公告，各自直接打開。</li>
<li>行動按鈕加上圖示。</li>
</ul>
<p><b>調整</b></p>
<ul>
<li>手機版：行動區固定在畫面底部，不用捲動也按得到「結束今日」；筆記、格蕾特小助手、翻譯放在行動區上排。</li>
<li>交還異生會的積分依小球的標籤加分，越難照顧的標籤加越多。</li>
<li>小球帶有一個特殊標籤的機率提高。</li>
<li>七天結束後的按鈕改為「等待新委託」。</li>
<li>開場故事改用內文框；彈出框統一右上角 ✕ 關閉、內文用深色框、分類用橫線隔開。</li>
</ul>
<h3>v0.16.0</h3>
<p><b>新功能</b></p>
<ul>
<li>開場故事與簽名、筆跡顏色。</li>
<li>沒有小球時是第 0 日，可以「接取新委託」開始照顧新的小球。</li>
<li>設定：暱稱、代表色、外出方式。</li>
<li>小球們頁可以把養成的小球「交還異生會」，換取積分（之後用來逛商店）。</li>
</ul>
`;
;
/* ==== js/data/letters.js ==== */
// 【資料】畢業小球的信紙（交還協會的小球，之後偶爾會寄信來）。信的文字在 js/data/texts.js 的 TEXT.letter。
// 判定方式：每輪按「等待新委託」時，把已交還、還沒寄過信的小球從最近交還的開始（剛滿 5 週的先）一隻一隻判定，寄出一封就停（每輪最多一封）。
// 週數＝交還之後過了幾輪（一輪＝一週）。
// minWeeks：未滿這個週數不判定（不寄信）
// stableWeeks：滿這個週數算「穩定期」：normal 的機率寄「問候」信
// 未滿穩定期（minWeeks～stableWeeks-1 週）：farewell 的機率寄「道別」（離開前轉述的極短信，沒有手寫信紙，只有後勤的翻譯稿）、
//   young 的機率寄「期許」（快兩個月了、好希望能順利長大），其餘不寄 → 換下一隻
//   （模擬：不管多常交還，大約 問候 55%／期許 40%／道別 4.5%）
// 收到「道別」信＝那隻小球也離開了：和日常的提前消逝一樣，算一次「消逝」（回歸者標籤的名額＋1，見 js/tags.js 的 lostCount）
const LETTER_RULE={minWeeks:5,stableWeeks:8,normal:.2,young:.18,farewell:.02};
// 信紙圖：assets/letter/letter.png（建議 360×180，或 180×90 像素畫放大 2 倍）。目前是暫用圖。
const LETTER_IMG=(typeof ASSETS!=='undefined'&&ASSETS.letter)||assetPath('letter');                 // 舊的通用信紙圖（找不到分類圖時用）
// 後勤翻譯稿的配圖依種類（720×360，2:1）：問候 letter_normal（櫻花，使用者的 letter_1）｜期許 letter_young（綠葉，letter_2）｜道別 letter_farewell（冬天，letter_3）。LETTER_IMG＝舊的通用圖（找不到時用）
const LETTER_IMGS={normal:'letter_normal',young:'letter_young',farewell:'letter_farewell'};
;
/* ==== js/data/places.js ==== */
// 【資料】外出的地點（地圖模式）。名字與說明在 js/data/texts.js 的 TEXT.place。
//   x、y：名牌在地圖上的位置（百分比，0～100；地圖 750×500）
//   loot：每件戰利品是哪一類的權重（food 海草湯｜snack 零食三選一｜agent 換水劑｜toy 玩具三選一；玩具每種只會有一個）
//   home：回家＝不出門（不耗行動）｜locked：之後開放（灰色名牌，不能前往）｜shop：言盡的商店｜hall：異生會大樓
const PLACES={
  assoc:{x:14,y:30,hall:true},                                    // 異生會大樓（左上的藍色高樓；js/hall.js：大廳、成就、心等）
  ruins:{x:76,y:26,shop:true},                                    // 廢棄大樓區（右上；言盡的商店，js/shop.js）
  mall: {x:62,y:58,loot:{food:15,snack:20,agent:35,toy:30}},     // 商業區（粉色看板大樓）：換水劑、玩具多
  park: {x:26,y:60,loot:{food:45,snack:30,agent:10,toy:15}},     // 中央公園（噴水池）：海草湯、零食多
  home: {x:89,y:62,home:true}                                     // 住所（右邊半山腰的紅屋頂）
};
const RANDOM_PLACES=['park','mall'];   // 外出方式「隨機」時，從這幾個地點平均挑一個
const OUT_ITEMS=3;                     // 每次出門帶回幾件
// 地圖底圖：assets/bg/map.jpg（3:2，目前 1200×800；大圖 bg_hd/map.jpg 2400×1600；不要畫地名，名牌由程式放）。換圖後名牌位置（x、y）要重新對一下。
const MAP_IMG=(typeof ASSETS!=='undefined'&&ASSETS.map)||assetPath('map');
;
/* ==== js/data/shop.js ==== */
// 【資料】廢棄大樓的商店（言盡）。名字與言盡的介紹在 js/data/texts.js 的 TEXT.shop。
//   price：積分｜give：買了會得到的東西（物品 id：數量，放進這一輪的物品欄）｜icon：還沒有商品圖時用的圖示（js/data/icons.js）與顏色
//   img：商品圖（assets/item/ 的檔名，不含副檔名；200×200 透明背景，檔名 item_*）
// 商品之後要換成正式的（小球裝飾品、互動玩具…），在這裡加減就好。
const SHOP_ITEMS={
  // 生活物資（fixed：「固定商品」分頁每次都擺；這一輪用，下一輪物品欄會重置；撿得到，應急用，便宜）
  soup3:   {price:1,fixed:true,give:{food:3},img:'item_soup'},
  agent2:  {price:1,fixed:true,give:{agent:2},img:'item_agent'},
  snacks:  {price:2,fixed:true,give:{sweet:1,salty:1,bitter:1},img:'item_snacks'},
  bubble:  {price:2,fixed:true,give:{bubble:1},img:'item_bubble'},
  bell:    {price:2,fixed:true,give:{bell:1},img:'item_bell'},
  ball:    {price:2,fixed:true,give:{ball:1},img:'item_ball'},
  // 裝扮（永久持有，可以預覽；wear＝js/data/wears.js 的 id，商品圖＝穿戴圖 wear_*.png）。always：每次都會擺出來（還沒買的話）｜hidden：不在商店擺（其他方式拿到）
  squareglasses: {price:8,wear:'squareglasses'},
  glowstick:     {price:9,wear:'glowstick'},
  goldglasses:   {price:9,wear:'goldglasses'},
  shades:        {price:9,wear:'shades'},
  catears:       {price:10,wear:'catears'},
  bow:           {price:6,wear:'bow'},
  clipx:         {price:5,wear:'clipx'},
  clipeq:        {price:5,wear:'clipeq'},
  sparkle:       {price:5,wear:'sparkle'},
  hearts:        {price:5,wear:'hearts'},
  bolts:         {price:5,wear:'bolts'},
  bandaid:       {price:5,wear:'bandaid'},
  coin:          {price:6,wear:'coin'},
  cross:         {price:8,wear:'cross'},
  tie:           {price:6,wear:'tie'},
  bowtie:        {price:6,wear:'bowtie'},
  satchel:       {price:8,wear:'satchel'},
  wings:         {price:10,wear:'wings'},
  devil:         {price:12,wear:'devil'},
  minilarva:     {price:10,wear:'minilarva'},
  bunny:         {price:8,wear:'bunny'},
  shushu:        {price:8,wear:'shushu'},
  phone:         {price:8,wear:'phone'},
  puppy:         {price:8,wear:'puppy'},
  snake:         {price:8,wear:'snake'},
  blackcat:      {price:8,wear:'blackcat'},
  eyepatch:      {price:7,wear:'eyepatch'},
  dododo:        {price:6,wear:'dododo'},
  gogogo:        {price:6,wear:'gogogo'},
  detective:     {price:0,wear:'detective',hidden:true},   // 成就「看透小球心」的獎勵，不在商店擺
  foxmask:       {price:0,wear:'foxmask',hidden:true},   // 成就「千球千面」的獎勵，不在商店擺
  // 互動道具（永久持有；tool＝META.tools 的 id）。玩耍選單會多一個選項，「遊玩」方式時會在水缸裡互動
  wand:    {price:10,tool:'wand',img:'item_wand'},
  bucket:  {price:10,tool:'bucket',img:'item_bucket'},
  // 雜誌（永久學會，聊天染色用；cond：要先跟格蕾特學會雙色才會擺出來）。magV 外殼上下兩色、magH 外殼左右兩色（都可以選柔和或分色）
  magV:    {price:12,tool:'magV',img:'item_magV',cond:()=>META.chatDual},
  magH:    {price:12,tool:'magH',img:'item_magH',cond:()=>META.chatDual}
};
const SHOP_SHOW=3;                                     // 「隨機商品」每次擺幾種（裝扮、永久玩具；always 的先擺，其他隨機；心等 3 多一種，見 HEART_RULE.shop）
const SHOP_SLOTS6=[{x:22,y:36},{x:50,y:36},{x:78,y:36},{x:22,y:74},{x:50,y:74},{x:78,y:74}];   // 「固定商品」六種的位置
const SHOP_SLOTS=[{x:26,y:38},{x:74,y:38},{x:50,y:74}];   // 商品在行李箱圖上的位置（百分比）
const SHOP_SLOTS4=[{x:24,y:36},{x:62,y:34},{x:36,y:74},{x:76,y:72}];   // 心等 3：擺 4 種時的位置
const SHOP_CASE='shop_case';                           // 行李箱（由上往下看）：assets/ui/shop_case.png，3:2（750×500；目前是使用者的圖切掉上蓋）
// 閒聊畫面（商店的「閒聊」）：廢墟背景＋行李箱＋言盡（戳她發呆時換 yanjin_L_6）＋偶爾一隻小球
// chatAlt：閒聊畫面打開時那句（TEXT.shop.chat 的第幾句，從 0 起算）用第二張圖 yanjin_L_6（v0.32.3 使用者在總表指定第 5 則）
const SHOP_SCENE={bg:'place_ruins_in',suitcase:'suitcase',chr:['yanjin_L_0','yanjin_L_6'],pokeAlt:[2],chatAlt:[4],larva:.35,larvaSc:.85,giftMax:3};   // 閒聊畫面的小球也會送東西（機率、種類同大樓 HALL_RULE），每次去商店最多 giftMax 個
// （v0.29.2 起商品畫面不放言盡的頭像；assets/npc/yanjin_face.png 先留著）
;
/* ==== js/data/hall.js ==== */
// 【資料】異生會大樓（地圖上的「異生會大樓」，耗 1 行動）：樓層、成就、心等。文字在 js/data/texts.js 的 TEXT.hall、TEXT.ach。
// 樓層（由上往下排成電梯按鈕）：
//   bg：背景圖（assets/bg/ 的檔名，720×360；大圖在 bg_hd/）｜chr：站在畫面裡的角色立繪（[平常, 第二張]；沒有圖時先用暫代圖）
//   pokeAlt：被戳時哪幾句（TEXT.hall.poke 的第幾句，從 0 起算）換第二張；沒寫＝每戳一次輪流換
//   need：要幾等心等才開放（沒到＝按鈕灰色，按了只看說明）｜lock：還沒做好、不能按｜ch：主線完成第幾章才開放（META.chDone；沒到＝不能按）
const HALL_FLOORS={
  top:  {bg:'hall_top',  chr:['yanjie_L_0+acc','yanjie_L_1+acc'],ch:1,pokeAlt:[1]},   // 5F 董事長辦公室（v0.40.63 和主線統一）：大部分時間是顧問言街（眼鏡常駐＝+acc）。ch：主線第幾章完成後開放（v0.40.59）
  f4:   {bg:'hall_4f',   chr:['yanxiang_L_0+acc','yanxiang_L_2+acc'],ch:1,pokeAlt:[0]},   // 4F 研究中心：真正的掌權者言巷（只有在研究室戴眼鏡＝+acc）。主線第一章完成後開放；L_2（怒）＝被戳到不耐煩
  f3:   {bg:'hall_3f',   chr:['joan_L_0+acc','joan_L_5+acc'],pokeAlt:[0,2]},         // 3F 後勤辦公室：瓊（成就、心等）。joan_L_5（驚）是驚訝表情；瓊在大樓都戴工作證（+acc）：只有被戳的第 1、3 句（TEXT.hall.poke.f3）用
  f2:   {bg:'hall_2f',   chr:['silence_L_0','silence_L_4'],need:2,pokeAlt:[1]}, // 2F 實習生辦公室：賽倫絲（特殊委託，v0.26）。silence_L_4（樂）是瞇眼笑；賽倫絲在大樓不戴耳骨夾
  lobby:{bg:'hall_lobby',chr:['grete_L_0','grete_L_4','grete_L_6'],pokeIdx:{0:2}},                     // 1F 大廳：進來先到這裡；格蕾特偶爾在櫃檯或當電梯小姐
  b1:   {bg:'hall_b1',   chr:['xiaojun_L_0+acc','xiaojun_L_3+acc'],need:3,back:4,pokeAlt:[2]}   // B1 特殊任務室：言曉君。心等 3 能進來（只有紙條），心等 back（4）她任務回來；xiaojun_L_3 是閉眼嘆氣（被戳第 3 句用）。緊急委託 v0.4
};
const HALL_ORDER=['top','f4','f3','f2','lobby','b1'];
// 被戳時跳多高（px，依角色個性）：瓊、格蕾特跳得大，賽倫絲中等，言盡很小
const NPC_HOP={f3:24,lobby:24,f2:16,b1:8,shop:6,f4:6,top:6};   // 5F 言街和言盡一樣小（身體不好，v0.40.69）
// 1F 大廳的訪客（v0.32.2）：認識了（met）才會出現，每次進大廳隨機一位或沒人。w＝權重（格蕾特是大廳常客）
//   home：平常在哪一層——在 1F 遇到他之後按那一層，會有「原來你是來找我的」（TEXT.hall.follow），同一趟不會再出現在 1F
//   hop：被戳跳多高（NPC_HOP 的 key）｜pokeAlt：同 HALL_FLOORS（TEXT.hall.visitPoke 的第幾句用第二張圖）｜pokeIdx：{第幾句:用第幾張圖}（格蕾特被戳第 1 句用觸肢 _6）
//   文字：格蕾特沿用 TEXT.hall.lobbyGrete／poke.lobby；其他人 TEXT.hall.visit／visitPoke／follow／visitName
const LOBBY_NPC={
  grete:  {chr:['grete_L_0','grete_L_4','grete_L_6'],pokeIdx:{0:2},w:2,hop:'lobby',            met:()=>META.greteMet},
  joan:   {chr:['joan_L_0+acc','joan_L_5+acc'],       w:1,hop:'f3',home:'f3',pokeAlt:[0],met:()=>META.joanMet},
  silence:{chr:['silence_L_0','silence_L_4'], w:1,hop:'f2',home:'f2',pokeAlt:[1],met:()=>META.silenceMet&&floorOpen('f2')},
  xiaojun:{chr:['xiaojun_L_0','xiaojun_L_3'], w:1,hop:'b1',home:'b1',pokeAlt:[2],met:()=>META.xiaojunMet&&META.heartLv>=(HALL_FLOORS.b1.back||1)},
  yanjin: {chr:['yanjin_L_0','yanjin_L_6'],   w:1,hop:'shop',pokeAlt:[0],met:()=>META.shopMet}   // 言盡：沒有自己的樓層，只是晃進來
};
const HALL_RULE={lobbyNpc:.5,                                          // 大廳有訪客的機率（認識的人裡挑，見 LOBBY_NPC；v0.32.2 前只有格蕾特 .35）
  larva:.5,                // 每到一層，背景裡有一隻小球在爬的機率（0～1 隻；不會走到人那邊）
  gift:.25,giftMax:3,      // 戳背景的小球：這個機率送你一個道具（gifts 裡挑），每次去大樓最多拿 giftMax 個
  gifts:['agent','snack'],  // 一半換水劑、一半點心（snack＝甜果／鹹貝／苦藻三選一）
  larvaSc:.9,              // 背景小球的大小
  known:.3,                // 有交還過的小球時：背景的小球是「交還過的那隻」的機率（顏色照牠交還時；舊存檔沒記到顏色＝原色）
  strangerDay:2,
  yanxiangPt:100};         // 心等 5 第一次去 4F：言巷給的積分（v0.40.59）          // 不認識的小球的顏色：照第幾日的小球（1＝全白，越大越有顏色）

// 心等：累積的心（領取成就得到）到了就可以去 3F 找瓊「升級」（要自己按）。目前最高 4 等（v0.30）。
//   need[等級]＝升到這一等要的心｜shop：商店每次擺幾種
//   ch：升到這一等還要主線完成第幾章（v0.40.59：心等 5＝第一章完成＋心等 4，不用多的心）
const HEART_RULE={max:5,need:{2:6,3:20,4:36,5:36},ch:{5:1},shop:{1:3,2:3,3:4,4:4,5:5}};   // v0.30：心等 4（36 心；獎勵是特殊委託名單多一隻，見 SPECIAL_RULE.count）｜心等 5：商店多擺一種、4F 言巷給積分（HALL_RULE.yanxiangPt）

// 成就：id 對應 TEXT.ach.list 的名稱與條件。
//   heart 心｜pt 積分（沒寫就照心數：1→3、2→5、3→8、5→12）｜wear 獎勵的裝扮｜hide：'all'＝達成前連條件都看不到（預設只有名稱是？？？）
//   prog()：回傳 [目前, 目標]
const gotSet=k=>new Set([...CODEX.map(e=>k==='end'?e.end:k==='temper'?e.temp:null).filter(Boolean),...META.got[k],...META.returned.map(r=>k==='end'?r.end:k==='temper'?r.temp:null).filter(Boolean)]);
const tagSet=()=>new Set([...CODEX.flatMap(e=>e.tags),...META.got.tag]);
const souvKinds=()=>Object.keys(SOUV_SRC).filter(k=>META.souv[k]>0).length;
const souvTotal=()=>Object.keys(SOUV_SRC).reduce((n,k)=>n+(META.souv[k]||0),0);
const letterTotal=()=>(META.letterGot.normal||0)+(META.letterGot.young||0)+(META.letterGot.farewell||0);
const openPlaces=()=>Object.keys(PLACES).filter(k=>!PLACES[k].home&&!PLACES[k].locked);
const twoTone=()=>[...CODEX,...(S&&!PV?[S]:[])].some(e=>e.tc&&e.tb&&e.tc!==e.tb);
const ACH=[
  // 養育
  {id:'round1',  cat:'raise',heart:1,pt:5, prog:()=>[META.rounds,1]},
  {id:'round3',  cat:'raise',heart:1,pt:5, prog:()=>[META.rounds,3]},
  {id:'round7',  cat:'raise',heart:2,pt:10,prog:()=>[META.rounds,7]},
  {id:'safe7',   cat:'raise',heart:1,      prog:()=>[[...CODEX,...META.returned].some(e=>e.end&&e.end!=='END-07')?1:0,1]},
  {id:'return1', cat:'raise',heart:1,      prog:()=>[META.returned.length,1]},
  {id:'return5', cat:'raise',heart:2,      prog:()=>[META.returned.length,5]},
  {id:'special1',cat:'raise',heart:1,      prog:()=>[Math.min(1,META.specialDone||0),1]},   // v0.30：完成特殊委託（2F 賽倫絲）
  {id:'special3',cat:'raise',heart:2,      prog:()=>[META.specialDone||0,3]},
  {id:'story1',  cat:'raise',heart:2,      prog:()=>[Math.min(1,META.chDone||0),1]},   // v0.40.59：主線第一章完成
  // 圖鑑
  {id:'end3',    cat:'book', heart:1,      prog:()=>[gotSet('end').size,3]},
  {id:'end6',    cat:'book', heart:3,wear:'foxmask',prog:()=>[[...gotSet('end')].filter(x=>x!=='END-07').length,6]},
  {id:'temper6', cat:'book', heart:2,      prog:()=>[gotSet('temper').size,TEMPER_IDS.length]},
  {id:'tag5',    cat:'book', heart:3,      prog:()=>[tagSet().size,5]},
  {id:'tag10',   cat:'book', heart:5,wear:'detective',prog:()=>[tagSet().size,10]},
  {id:'tag15',   cat:'book', heart:5,avail:()=>Object.keys(TAGS).length>=15,prog:()=>[tagSet().size,15]},   // avail：標籤種類夠了才出現（不寫死「全部」，之後加標籤可以再加 20…）
  // 交流
  {id:'grete',   cat:'talk', heart:1,      prog:()=>[META.greteMet||META.grete?1:0,1]},
  {id:'meetYanjin',cat:'talk',heart:1,     prog:()=>[META.shopMet?1:0,1]},       // v0.32.2：NPC 初見成就
  {id:'meetJoan',cat:'talk',  heart:1,      prog:()=>[META.joanMet?1:0,1]},
  {id:'meetSilence',cat:'talk',heart:1,     prog:()=>[META.silenceMet?1:0,1]},
  {id:'xiaojun', cat:'talk', heart:2,      prog:()=>[META.xiaojunMet?1:0,1]},   // v0.32.1：在 B1 見到言曉君（心等 4）
  {id:'meetYanxiang',cat:'talk',heart:1,   prog:()=>[META.yanxiangMet?1:0,1]},   // v0.40.59：4F、5F 初見（主線第一章完成後）
  {id:'meetYanjie',cat:'talk',heart:1,     prog:()=>[META.yanjieMet?1:0,1]},
  {id:'dye1',    cat:'talk', heart:1,      prog:()=>[Math.min(1,META.chatWins||0),1]},
  {id:'dye2',    cat:'talk', heart:1,      prog:()=>[twoTone()?1:0,1]},
  {id:'crown',   cat:'talk', heart:1,      prog:()=>[Math.min(1,META.crowns||0),1]},
  // 禮物
  {id:'gift10k', cat:'gift', heart:1,      prog:()=>[souvKinds(),10]},
  {id:'gift10',  cat:'gift', heart:1,      prog:()=>[souvTotal(),10]},
  {id:'gift20',  cat:'gift', heart:2,      prog:()=>[souvTotal(),20]},
  // 信
  {id:'letterN', cat:'letter',heart:1,     prog:()=>[Math.min(1,META.letterGot.normal||0),1]},
  {id:'letterY', cat:'letter',heart:2,     prog:()=>[Math.min(1,META.letterGot.young||0),1]},
  {id:'letterF', cat:'letter',heart:3,hide:'all',prog:()=>[Math.min(1,META.letterGot.farewell||0),1]},
  {id:'letter3', cat:'letter',heart:1,     prog:()=>[letterTotal(),3]},
  {id:'letter5', cat:'letter',heart:2,     prog:()=>[letterTotal(),5]},
  {id:'keep1',   cat:'letter',heart:1,     prog:()=>[META.letters.length,1]},
  {id:'keep3',   cat:'letter',heart:2,     prog:()=>[META.letters.length,3]},
  // 外出
  {id:'places',  cat:'out',  heart:1,      prog:()=>{const o=openPlaces();return [o.filter(k=>META.visited.includes(k)).length,o.length]}},
  {id:'buy1',    cat:'out',  heart:1,      prog:()=>[Math.min(1,META.buys||0),1]},
  {id:'tools',   cat:'out',  heart:2,      prog:()=>[['wand','bucket'].filter(k=>META.tools.includes(k)).length,2]},
  {id:'decor3',  cat:'out',  heart:1,      prog:()=>[META.decor.length,3]}
].filter(a=>!a.avail||a.avail());
const ACH_PT={1:3,2:5,3:8,5:12};
const achPts=a=>a.pt!=null?a.pt:(ACH_PT[a.heart]||a.heart*3);

// 特殊委託（2F 賽倫絲，心等 2）：每次來大樓名單換一批（同一趟不變）；每一輪只能預約一隻，預約後不能改；下一輪接到的就是牠。
//   count：心等→名單幾隻｜odds：標籤數量的機率（none 0 個、one 1 個，其他 2 個）｜noTag：不會出現在委託裡的標籤
//   why：說明文（TEXT.special.why 通用、whyTag 依標籤、whyTemp 依個性）；有對應的時候 tagWhy 的機率用對應的
const SPECIAL_RULE={count:{2:2,3:3,4:4},odds:{2:{none:.5,one:.45},3:{none:.25,one:.55},4:{none:.25,one:.55}},noTag:['homereturn'],tagWhy:.6};
;
/* ==== js/data/lineimg.js ==== */
// 【資料】大樓、言盡商店的台詞「這一句專用的人物圖」（v0.40.13）。設定總表「5 事件」的「換人物圖（填檔名）」欄會寫回這裡。
// key＝台詞的程式位置（例 hall.poke.lobby[0]）；值＝圖名，或陣列＝每次出現這句時輪流換。沒寫的句子照原本的規則（HALL_FLOORS／LOBBY_NPC／SHOP_SCENE 的 chr、pokeAlt）。
const LINE_IMG={
  "hall.larvaSay.lobby":"grete_L_6",
  "hall.lobbyGrete[0]":"grete_L_1",
  "hall.lobbyGrete[1]":"grete_L_4",
  "hall.lobbyGrete[2]":"grete_L_5",
  "hall.poke.b1[1]":"xiaojun_L_3+acc",
  "hall.poke.b1[2]":"xiaojun_L_2+acc",
  "hall.poke.b1[3]":"xiaojun_L_1+acc",
  "hall.poke.lobby[0]":"grete_L_6",
  "hall.poke.lobby[1]":["grete_L_1", "grete_L_4"],
  "hall.poke.lobby[2]":["grete_L_4", "grete_L_5"],
  "hall.visit.xiaojun[0]":"xiaojun_L_0+acc",
  "hall.visit.xiaojun[1]":"xiaojun_L_2+acc",
  "hall.visit.xiaojun[2]":"xiaojun_L_0+acc",
  "hall.visit.yanjin[1]":"yanjin_L_6",
  "hall.visit.yanjin[2]":"yanjin_L_4",
  "hall.visitPoke.xiaojun[1]":"xiaojun_L_5",
  "hall.visitPoke.xiaojun[2]":"xiaojun_L_2",
  "shop.chat[1]":"yanjin_L_5",
  "shop.chat[3]":"yanjin_L_4",
  "shop.chat[5]":"yanjin_L_1",
  "shop.poke[0]":"yanjin_L_6",
  "shop.poke[2]":"yanjin_L_0",
  "shop.sceneLarva[2]":"yanjin_L_4",
};
const LINE_IMG_N={};
function lineImg(k){const v=LINE_IMG[k];if(!v)return '';if(!Array.isArray(v))return v;const n=LINE_IMG_N[k]=(LINE_IMG_N[k]||0)+1;return v[(n-1)%v.length]}
;
/* ==== js/data/doll.js ==== */
// 【資料】紙娃娃（玩家的長相，v0.35）。圖在 assets/doll/（372×400 整張畫布、照位置畫好的灰階圖），程式用 186×200 當座標。
// 規格見專案文件「紙娃娃規格」。文字（部件名稱、按鈕）在 TEXT.doll。
//   新增部件圖：檔名＝部件_編號（例：back_15.png）放進 assets/doll/，再把檔名加進 DOLL_LISTS、有畫的範圍加進 DOLL_BB（tools 裡可以算，或請 Claude 算）。
const DOLL_W=186,DOLL_H=200,DOLL_K=2;   // 邏輯尺寸｜內部 2 倍解析度
// 每種部件有哪些圖（順序＝格子裡的順序；編號＝原檔編號）
const DOLL_LISTS={
  front:["front_1", "front_2", "front_3", "front_4", "front_5", "front_6", "front_7", "front_8"],
  back:["back_1", "back_2", "back_3", "back_4", "back_5", "back_6", "back_7", "back_8", "back_9", "back_10", "back_11", "back_12", "back_13", "back_14"],
  tie:["tie_1", "tie_2", "tie_3", "tie_4", "tie_5", "tie_6", "tie_7", "tie_8", "tie_9", "tie_10"],
  sideR:["sideR_2", "sideR_3", "sideR_4", "sideR_5", "sideR_6", "sideR_7", "sideR_8"],
  sideL:["sideL_3", "sideL_4", "sideL_5", "sideL_6", "sideL_7", "sideL_8"],
  ahoge:["ahoge_1", "ahoge_2", "ahoge_3", "ahoge_4", "ahoge_5", "ahoge_6", "ahoge_7"],
  brow:["brow_1", "brow_2", "brow_3", "brow_4", "brow_5", "brow_6", "brow_7", "brow_8", "brow_9", "brow_10", "brow_11"],
  eye:["eye_1", "eye_2", "eye_3", "eye_4", "eye_5", "eye_6", "eye_7", "eye_8", "eye_9", "eye_10", "eye_11", "eye_12", "eye_13", "eye_14", "eye_15", "eye_16", "eye_17", "eye_18"],
  hl:["hl_0", "hl_1", "hl_11", "hl_14", "hl_15"],
  mouth:["mouth_1", "mouth_2", "mouth_3", "mouth_4", "mouth_5", "mouth_6", "mouth_7", "mouth_8", "mouth_9", "mouth_10", "mouth_11", "mouth_12"],
  ear:["ear_1", "ear_2"],
  top:["top_1","top_tee","top_crop","top_tank","top_tankS","top_shirt"],             // v0.40.41：基礎衣物（可以換色）
  pants:["pants_1","pants_long","pants_short","skirt_long","skirt_short"],             // 褲子、裙子都在「下身」
  socks:["socks_short","socks_long","socks_tights"],                                   // 襪子（褲襪可以調透明度）
  shoes:["shoes_1","shoes_sneaker","shoes_slipper"],                                   // 鞋子（shoes_1＝預設的雙色球鞋，v0.40.42 從牛仔褲拆出來）
  glass:["glass_square","glass_trend","glass_sun"],                                 // 配飾：眼鏡（v0.40.65；方框、潮流可以換色，墨鏡不行）
  hold:["fan_yellow","fan_purple","fan_grey","fan_blue","fan_white"]                // 配飾：手拿的（神秘應援組合）
};
// 要買（或領）才有的衣物（v0.40.65）：在服飾店拿到後記在 META.wearOwn（全存檔共用，和長相一樣）；其他的一開始就有
const DOLL_SHOP_WEAR=['glass_square','glass_trend','glass_sun','fan_yellow','fan_purple','fan_grey','fan_blue','fan_white'];
// 衣物（v0.40.41）：可以換色的（灰階白底、黑線，multiply 上色）｜半透明的（整片黑：照顏色、透明度 multiply 疊在腿上）。之後的新衣服不換色就不用寫進來
const DOLL_WEAR_TINT=['top_tee','top_crop','top_tank','top_tankS','top_shirt','pants_long','pants_short','skirt_long','skirt_short','socks_short','socks_long','socks_tights','shoes_sneaker','shoes_slipper','glass_square','glass_trend'];
const DOLL_SHEER=['socks_tights'];
const DOLL_SLOTS=['top','pants','socks','shoes','glass','hold'];   // 穿在身上的格子（顏色存在 st.wc[格子]、褲襪透明度 st.wa）
const DOLL_CLOTH=['#ffffff','#2b2b33','#7d8794','#c94a4a','#e58fb5','#f2c14e','#4ea886','#5b7fd6','#8a63c9','#a8743f'];   // 衣服色票（也可以自己選）
const DOLL_WEAR_DEF={wc:{top:'#ffffff',pants:'#5b7fd6',socks:'#ffffff',shoes:'#ffffff',glass:'#2b2b33',hold:'#ffffff'},wa:.6};
// 每張圖有畫的範圍 [x0,y0,x1,y1]（186×200 座標）：縮圖放大、以中心縮放移動用
const DOLL_BB={top_tee:[65,103,116,146],top_crop:[65,103,116,138],top_tank:[71,103,106,146],top_tankS:[71,103,104,137],top_shirt:[58,99,126,156],pants_long:[70,141,111,193],pants_short:[70,141,111,166],skirt_long:[67,141,118,192],skirt_short:[68,141,113,168],socks_short:[71,180,110,197],socks_long:[71,166,110,197],socks_tights:[71,142,110,197],shoes_sneaker:[70,187,110,198],shoes_slipper:[70,189,110,199],sideR_2:[115,55,128,84],sideL_3:[38,51,57,105],sideR_3:[107,47,129,99],sideR_4:[111,50,128,103],sideL_4:[41,51,59,105],sideL_5:[41,46,58,110],sideR_5:[105,42,127,113],sideL_6:[37,45,56,137],sideR_6:[109,43,138,139],sideL_7:[34,47,57,99],sideR_7:[111,48,138,95],sideR_8:[112,47,134,117],sideL_8:[37,53,59,114],ahoge_1:[70,2,93,39],ahoge_2:[65,5,104,32],ahoge_3:[60,21,84,52],ahoge_4:[49,21,74,40],ahoge_5:[62,14,82,57],ahoge_6:[71,18,98,59],ahoge_7:[82,21,116,65],mouth_1:[73,81,83,85],mouth_2:[69,80,86,88],mouth_3:[67,80,88,93],mouth_4:[71,81,83,85],mouth_5:[72,79,86,88],mouth_6:[73,80,81,89],mouth_7:[73,82,81,84],mouth_8:[70,81,85,88],mouth_9:[70,81,85,86],mouth_10:[70,80,84,85],mouth_11:[72,79,80,85],mouth_12:[68,81,90,88],back_1:[39,13,139,102],back_2:[37,13,141,103],back_3:[39,13,139,116],back_4:[37,13,141,113],back_5:[34,13,141,132],back_6:[28,13,153,168],back_7:[34,12,140,118],back_8:[25,12,155,134],back_9:[31,12,150,132],back_10:[30,13,152,157],back_11:[29,12,156,181],back_12:[37,12,141,132],back_13:[37,12,141,155],back_14:[29,12,146,154],front_1:[40,12,132,94],front_2:[32,14,143,81],front_3:[34,16,143,83],front_4:[32,15,134,70],front_5:[36,14,139,74],front_6:[39,19,134,101],front_7:[36,15,134,74],front_8:[37,16,132,87],brow_1:[55,56,107,61],brow_2:[52,54,106,61],brow_3:[53,55,106,62],brow_4:[52,51,108,61],brow_5:[54,55,105,65],brow_6:[51,52,106,62],brow_7:[55,56,105,63],brow_8:[49,51,106,61],brow_9:[54,48,111,63],brow_10:[54,53,106,61],brow_11:[51,52,109,62],eye_1:[58,63,101,81],eye_2:[58,66,101,81],eye_3:[58,66,100,81],eye_4:[53,69,104,77],eye_5:[56,69,103,77],eye_6:[55,63,100,79],eye_7:[54,69,105,78],eye_8:[53,63,105,81],eye_9:[53,66,102,81],eye_10:[55,69,101,78],eye_11:[46,63,109,81],eye_12:[51,58,108,80],eye_13:[50,62,103,81],eye_14:[50,59,107,82],eye_15:[47,65,110,80],eye_16:[51,61,103,80],eye_17:[52,62,106,82],eye_18:[50,66,106,78],hl_0:[59,71,96,77],hl_1:[61,71,98,79],hl_11:[56,69,98,77],hl_14:[55,69,99,80],hl_15:[59,71,99,77],tie_1:[92,97,142,179],tie_2:[92,97,125,128],tie_3:[92,97,134,155],tie_4:[91,97,122,126],tie_5:[27,14,156,114],tie_6:[27,14,72,114],tie_7:[111,14,156,114],tie_8:[80,1,139,111],tie_9:[85,1,129,135],tie_10:[59,1,140,142],ear_1:[123,62,137,85],ear_2:[121,56,139,86],pants_1:[68,146,111,198],shoes_1:[69,185,110,198],top_1:[63,102,118,156],body:[43,20,129,198],glass_sun:[43,62,130,82],glass_square:[42,63,129,79],glass_trend:[42,59,130,82],fan_yellow:[18,97,135,192],fan_purple:[18,97,135,192],fan_grey:[17,97,135,192],fan_blue:[18,97,135,192],fan_white:[18,97,135,192]};
// 部件設定：tint＝用哪個顏色上色（hair 髮色｜skin 膚色｜eye 瞳色｜mouth 固定粉色｜null 不上色）｜none＝可以選「無」｜fixed＝衣服（只挑圖，不上色、不調大小位置）
const DOLL_PARTS={
  front:{tint:'hair',none:true},back:{tint:'hair',none:true},tie:{tint:'hair',none:true},   // 前髮｜後髮｜綁髮（在後髮再後面一層）
  sideR:{tint:'hair',none:true},sideL:{tint:'hair',none:true},ahoge:{tint:'hair',none:true},  // 鬢角右（疊在臉上）｜鬢角左（在臉後面）｜呆毛
  brow:{tint:'hair'},eye:{tint:'eye'},hl:{tint:null,none:true},mouth:{tint:'mouth'},          // 眉（跟髮色）｜眼｜眼睛光（白色，跟著眼睛移動縮放）｜口（張嘴的地方固定粉色）
  ear:{tint:'skin',none:true},top:{tint:null,fixed:true},pants:{tint:null,fixed:true},          // 耳（跟膚色）｜上衣｜褲子（上衣固定疊在褲子上面）
  socks:{tint:null,fixed:true,none:true},shoes:{tint:null,fixed:true,none:true},                // 襪子｜鞋子（v0.40.41）
  glass:{tint:null,fixed:true,none:true},hold:{tint:null,fixed:true,none:true}                  // 眼鏡｜手拿的（v0.40.65，配飾）
};
// 圖層（由下往上）
const DOLL_ORDER=['tie','back','sideL','body','ear','socks','shoes','pants','top','sideR','hold','eye','hl','mouth','glass','front','brow','ahoge'];   // 手拿的在鬢角右上面、眼鏡在前髮下面（v0.40.65）
const DOLL_FACE=['brow','eye','hl','mouth'];   // 表情可以換的部件
// 編輯器左邊（手機在預覽下面）的部件按鈕順序；skin＝膚色（不是圖）
const DOLL_PLIST=['front','back','tie','sideR','sideL','ahoge','brow','eye','hl','mouth','ear','skin','top','pants','socks','shoes'];
const DOLL_EMOS=['joy','anger','sad','fun','shock'];   // 喜 怒 哀 樂 驚
const DOLL_SKINS=['#fbe7da','#f3d2bd','#e5b998','#c99572','#8d5b3d','#dfe6f0'];
const DOLL_HAIRS=['#2b2b33','#6b4a3a','#a8743f','#e8c46a','#e9e4dc','#c94a4a','#e58fb5','#5b7fd6','#4ea886','#8a63c9'];   // 髮色色票（也可以自己選）
const DOLL_EYES=['#3f7fd0','#6b4a3a','#2f9e6e','#d9a43a','#c94a4a','#8a63c9','#2b2b33'];
const DOLL_FIXED={mouth:'#f2a0aa'};
// 有自己顏色的眼睛（漫畫表現，v0.35.1）：預設用這個顏色；玩家可以改成「瞳色」（平常、每個表情各自選，存在部件的 c：'def' 預設色｜'eye' 瞳色）
const DOLL_EYE_DEF={eye_13:'#8fcdf0',eye_16:'#f39ab9',eye_17:'#e04a4a'};   // 13 淡藍｜16 粉色（愛心）｜17 紅色   // 不給玩家選、固定的顏色
const DOLL_LIM={d:12,smin:.8,smax:1.2};   // 移動 ±12、大小 80～120%
const DOLL_LIM_D={ahoge:18};               // 個別部件的移動上限（v0.35.3：呆毛 ±18，可以拿來補髮型缺的地方）
const dollD=k=>DOLL_LIM_D[k]||DOLL_LIM.d;
const DOLL_HEAD=[76,30,206];   // 頭像範圍 [x, y, 邊長]（372×400 的圖上；和人物的 _face 頭像同一個位置，v0.40.4）
const DOLL_OUTLINE=3;                     // 白邊粗細（邏輯 px）
// 預設長相（第一次登記時）
const dollTf=()=>({x:0,y:0,s:1});
const dollDef=()=>({skin:DOLL_SKINS[0],hair:'#6b4a3a',eye:'#3f7fd0',top:'top_1',pants:'pants_1',socks:'none',shoes:'shoes_1',glass:'none',hold:'none',wc:{...DOLL_WEAR_DEF.wc},wa:DOLL_WEAR_DEF.wa,
  parts:{front:{id:'front_3',...dollTf()},back:{id:'back_8',...dollTf()},tie:{id:'none',...dollTf()},sideR:{id:'none',...dollTf()},sideL:{id:'none',...dollTf()},ahoge:{id:'none',...dollTf()},
    brow:{id:'brow_1',...dollTf()},eye:{id:'eye_1',...dollTf(),c:'def'},hl:{id:'hl_1',...dollTf()},mouth:{id:'mouth_1',...dollTf()},ear:{id:'ear_1',...dollTf()}},
  emo:{joy:dollEmo('brow_1','eye_6','none','mouth_7'),anger:dollEmo('brow_4','eye_13','none','mouth_4'),sad:dollEmo('brow_1','eye_9','none','mouth_6'),
    fun:dollEmo('brow_1','eye_8','none','mouth_8'),shock:dollEmo('brow_1','eye_1','hl_1','mouth_10')}});
// 表情：mode＝face（換眉眼口）｜bubble（臉不變，頭上跳泡泡）；x／y／s 是 null＝跟平常一樣
function dollEmo(brow,eye,hl,mouth){const p=id=>({id,x:null,y:null,s:null});return {mode:'face',brow:p(brow),eye:{...p(eye),c:'def'},hl:p(hl),mouth:p(mouth)}}
// 存檔讀進來時檢查（匯入的檔案不可信）；不對的欄位用預設值
function dollNorm(o){
  if(!o||typeof o!=='object')return null;
  const D=dollDef(),col=(v,d)=>parseColor(String(v||''))||d,num=(v,a,b,r)=>Math.max(a,Math.min(b,Math.round((+v||0)*r)/r));
  const okId=(k,id)=>(DOLL_PARTS[k].none&&id==='none')||DOLL_LISTS[k].includes(id);
  const r={skin:col(o.skin,D.skin),hair:col(o.hair,D.hair),eye:col(o.eye,D.eye),
    top:DOLL_LISTS.top.includes(o.top)?o.top:D.top,pants:DOLL_LISTS.pants.includes(o.pants)?o.pants:D.pants,
    socks:DOLL_LISTS.socks.includes(o.socks)?o.socks:'none',shoes:DOLL_LISTS.shoes.includes(o.shoes)||o.shoes==='none'?o.shoes:D.shoes,
    glass:DOLL_LISTS.glass.includes(o.glass)?o.glass:'none',hold:DOLL_LISTS.hold.includes(o.hold)?o.hold:'none',   // 配飾（v0.40.65）   // 舊存檔沒有鞋子＝預設的雙色球鞋（原本畫在牛仔褲上）
    wc:Object.fromEntries(DOLL_SLOTS.map(k=>[k,col(o.wc&&o.wc[k],D.wc[k])])),wa:o.wa==null?D.wa:num(o.wa,.1,1,100),parts:{},emo:{}};
  const P=o.parts&&typeof o.parts==='object'?o.parts:{};
  for(const k in D.parts){const p=P[k]||{};r.parts[k]=okId(k,p.id)?{id:p.id,x:num(p.x,-dollD(k),dollD(k),1),y:num(p.y,-dollD(k),dollD(k),1),s:p.s==null?1:num(p.s,DOLL_LIM.smin,DOLL_LIM.smax,100),...(k==='eye'?{c:p.c==='eye'?'eye':'def'}:{})}:D.parts[k]}
  const E=o.emo&&typeof o.emo==='object'?o.emo:{};
  DOLL_EMOS.forEach(e=>{const x=E[e]&&typeof E[e]==='object'?E[e]:{},d=D.emo[e];
    r.emo[e]={mode:x.mode==='bubble'?'bubble':'face'};
    DOLL_FACE.forEach(k=>{const p=x[k]||{},n=(v,a,b,q)=>v==null?null:num(v,a,b,q);
      r.emo[e][k]=okId(k,p.id)?{id:p.id,x:n(p.x,-dollD(k),dollD(k),1),y:n(p.y,-dollD(k),dollD(k),1),s:n(p.s,DOLL_LIM.smin,DOLL_LIM.smax,100),...(k==='eye'?{c:p.c==='eye'?'eye':'def'}:{})}:d[k]})});
  return r;
}
;
/* ==== js/story/data/texts.js ==== */
// ===== 主線的介面文字（TEXT.story）=====
// 主線總表「主線介面」頁（tools/storyui.py 產生，套用寫回這裡）。日常模式的字在 js/data/texts.js（設定總表）。
// 要在 js/data/texts.js 之後載入。
const STORY_TEXT={
    idleBtn:'主線：緊急委託',
    chapter:{1:'第一章・救治',2:'第二章・信任',3:'第三章・親近'},
    week:'第 {n} 週',goal:'月底評估：健康 {n}',money:'{n} 元',moneyUnit:'元',
    btn:{stat:'狀態',plan:'行程',bag:'收納',tank:'水缸',sys:'系統',leave:'離開',run:'執行這週'},
    ico:{stat:'狀',plan:'行',bag:'收',tank:'缸',sys:'系',leave:'離',run:'執'},
    days:['一','二','三','四','五','六','日'],dayName:'週{d}',
    cats:{care:'照顧',job:'打工',rest:'休閒'},
    cmd:{med:'換藥水',talk:'說話',touch:'觸碰',note:'紀錄狀況',cvs:'便利商店',stock:'幫忙整理',clerk:'初階文書工讀',clerk2:'進階文書工讀',busk:'街頭藝人',walk:'公園散步',shop:'商店街逛街',clean:'清潔隊',sleep:'在家睡覺',read:'讀《異種生物入門》',arcade:'玩電動',ktv:'唱 KTV',volunteer:'活動中心義工',lab:'研究開發',f5:'幫忙照顧小球',free:'自由行動',readStr:'讀《居家伸展入門》',readSoc:'讀《聊天的小技巧》',browse:'逛道具店',snack:'買零食',cafeJob:'咖啡廳店員',ktvJob:'KTV 店員',arcadeJob:'電玩店店員',coffee:'喝咖啡'},
    cmdShort:{med:'換藥水',talk:'說話',touch:'觸碰',note:'紀錄狀況',cvs:'便利商店',stock:'整理',clerk:'初階文書',clerk2:'進階文書',busk:'街頭藝人',walk:'公園散步',shop:'逛街',clean:'清潔隊',sleep:'睡覺',read:'讀書知識',arcade:'電動',ktv:'KTV',volunteer:'義工',lab:'研究開發',f5:'照顧小球',free:'自由行動',readStr:'讀書體能',readSoc:'讀書社交',browse:'道具店',snack:'零食',cafeJob:'咖啡店員',ktvJob:'KTV店員',arcadeJob:'電玩店員',coffee:'喝咖啡'},   // 手機直放的行程格（最多 4 個字）
    note:{free:'空白的日子：當天在地圖上自己選要去哪裡',lab:'知識需求 25',volunteer:'錢很少；言街常在這裡',f5:'言街忙文書的時候，幫他顧跑來找他玩的小球'},
    item:{medItem:'藥瓶',talkItem:'對話',touchItem:'手',noteItem:'筆記'},
    rnd:'能力隨機一種↑',
    poor:'錢不夠（要 {n} 元）',capNote:'（{stat}最多讀到 {n}）',noBook:'還沒有這本書（道具店）',
    over:{title:'遊戲結束',load:'讀取',leave:'離開主線'},
    mid:{title:'{ch}　完成',save:'儲存中繼存檔',saved:'已儲存',savedToast:'存好了（中繼 {n}）'},
    freeTag:'自由模式',freeCapTalk:'（錢包好像裝不下了……去買點東西吧。）',
    poorDay:'（錢不夠{cmd}了……今天自己安排吧。）',
    jobNews:'（{list}……現在的我，好像也做得來了。排行程的時候可以考慮看看。）',
    items:{bookStr:{n:'居家伸展入門',d:'在家也能做的伸展和肌力訓練。讀了體能 +3（最多到 25）。'},bookSoc:{n:'聊天的小技巧',d:'怎麼開口、怎麼接話。讀了社交 +3（最多到 25）。'},bookKnow:{n:'異種生物入門',d:'異生會推薦的入門書。讀了知識 +3（最多到 25）。'},soothe:{n:'舒緩液',d:'滴幾滴在水缸裡，小球的疲倦 −40。用一次就沒了。'},energy:{n:'能量飲料',d:'喝了疲勞 −80。用一次就沒了。'}},
    need:'需要{stat} {n}（目前 {v}）',
    fixedTag:'固定',fixedPay:'固定：每週{days}',minNote:'本月至少 {n} 次',
    medCount:'{name}：已做 {done}＋這週 {week}／至少 {min} 次',medShort:'{name}\n{done}＋{week}／{min}',late:'來不及了！',
    tipDay:'週{d}要做什麼呢？',tipSet:'週{d}：{cmd}。點一下那格可以取消。',
    undo:'復原',ok:'確定',okToast:'這週的行程排好了',okToastFree:'排好了（空白的 {n} 天是自由行動）',fixedToast:'{cmd}：每週{days}',
    encN:'？',
    S:{hp:'健康',calm:'安心',mood:'情緒',tired:'疲倦',str:'體能',soc:'社交',know:'知識',fat:'疲勞',money:'錢'},
    rowMe:'玩家',rowLarva:'小球',rowPpl:'人際',fav:'♥ +{n}',favMax:'好感已達這章上限',favMeet:'認識了',visitBy:'【{name}】來陪你了。',rowBuy:'買到',kick:'',larvaId:'UM-{n}',
    stat:{title:'狀態',tabs:{me:'我',larva:'小球',ppl:'人際'},role:'異生會．緊急照顧者',moneyNote:'月初異生會發薪',larvaNote:'牠不認這個編號。',unknown:'還沒見過'},
    npc:{xiaojun:{n:'言曉君',d:'異生會．特殊任務組'},grete:{n:'格蕾特',d:'自由自在的異種朋友'},yanjin:{n:'言盡',d:'廢墟的行李箱商店'},silence:{n:'賽倫絲',d:'2F 實習生辦公室'},joan:{n:'瓊',d:'3F 後勤辦公室'},yanmo:{n:'言默',d:'短期義工'},yanjie:{n:'言街',d:'異生會顧問'},yanxiang:{n:'言巷',d:'4F 研究中心'},ayen:{n:'阿言',d:'神秘的女性'}},
    bag:{title:'收納',tabs:{wear:'衣櫃',item:'道具',coll:'收藏品',diary:'日記本'},collEmpty:'還沒有收藏品。電玩店的抽獎、之後的獎品會放在這裡。',diaryEmpty:'還沒有可以回顧的事。',diaryKinds:{main:'主線',side:'支線',event:'小事件'},diaryLock:'未解鎖',use:'使用',have:'×{n}',used:'用了{n}',
      // 日記本裡還沒觸發的事件，條件怎麼寫（v0.40.60）
      dc:{meet:'遇到{who}',meetAt:'{at}時遇到{who}',first:'第一次{cmd}',firstX:{crit:'第一次大成功',fumble:'第一次大失敗',collapse:'第一次累倒',tiredMax:'小球疲倦第一次滿',free:'第一次自由行動'},roll:'{cmd}時偶爾',alone:'{cmd}時，平常在的人不在',pick:'把{cmd}排進行程',weekStart:'第 {n} 週開始時',weekEnd:'第 {n} 週結束時',newNpc:'還不認識{who}',knowNpc:'認識{who}',fav:'{who}的好感 {op}{n}',seen:'做過{cmd}',week:'週 {op}{n}',weekGe:'第 {n} 週以後'},noItem:'還沒有道具。道具店（自由行動）可以買。'},
    tank:{st:{sleep:'牠縮成一團，在水缸角落睡著了。身上的傷還很明顯。',scared:'牠縮在水缸角落，你一靠近，牠就把身體縮得更小。',calm:'牠在水裡慢慢漂著，偶爾看你一眼。',close:'牠在水缸裡游來游去，看到你就游到玻璃邊。'},hide:'牠躲起來了。',peek:'牠貼著玻璃，輕輕碰了碰你的手指的位置。',poke:'（點一下水缸裡的牠）',note:'（之後關係變好，牠會在房間裡跳來跳去）'},
    run:{head:'第 {w} 週　週{d}　{cmd}',headFree:'週{d}　{cmd}',tapExec:'點一下：直接看結果',tapEnd:'點一下：下一天',skip:'跳過，看一週結果',done:'完成',wait:'……',
      rank:{ok:'成功',great:'大成功',fail:'失敗',bad:'大失敗'},sumTitle:'第 {w} 週的結果',total:'這週合計',ok:'確定',collapse:'累倒了，這天只能睡覺。',living:'生活費',forced:'（累倒）'},
    sys:{title:'系統',save:'儲存',load:'讀取',set:'設定',leave:'離開主線',book:'畫面配色',books:{day:'永晝',night:'永夜',auto:'隨時間變化'},now:'（使用中）',slot:'存檔 {n}',empty:'（空）',slotInfo:'第 {w} 週｜{at}',slotInfoDay:'第 {w} 週週{d}（白天在家）｜{at}',saved:'存好了（存檔 {n}）',loaded:'讀取了存檔 {n}',
      auto:'每週開始、白天回到家時會自動存檔。手動存檔有 3 格。',onlyWeek:'存的是這週開始（排行程前）的狀態。',onlyDay:'存的是現在（這週週中、白天在家）的狀態。',freeSaved:'存好了（中繼存檔）'},
    leave:{title:'離開主線',body:'進度會停在這週開始的時候（自動存檔），下次從這裡接著玩。這週排好的行程不會留下。',bodyDay:'現在的進度（這週週中、白天在家）會自動存好，下次從這裡接著玩。',ok:'離開',cancel:'再想想',saveFirst:'先存檔再離開'},
    start:{title:'緊急委託',body:'言曉君把一顆受傷的小球交給你。\n接下來一個月，你是牠的緊急照顧者。',ok:'開始',cont:'繼續主線（第 {w} 週）',
      newGame:'新遊戲',loadGame:'讀取',menuBody:'從第一章開始，或接著之前的存檔玩。',back:'返回',
      newAsk:'開始新遊戲',newBody:'從第一章第 1 週開始。\n自動存檔會被新的進度蓋掉；手動存檔、自由模式存檔都還在。',
      loadTitle:'讀取',loadNormal:'一般存檔',autoSlot:'自動存檔　{info}',loadFree:'自由模式存檔',freeNone:'還沒有（每章結束時存一筆，第一章過關後才有）',freeSlot:'中繼 {n}　{ch}　{id}　{at}',freeEmpty:'中繼 {n}　（空）',freeLoaded:'讀取了中繼存檔（自由模式）'},
    grete:['這週還沒排行程喔。','換藥水已經幫你排在週二和週五了。','小球還很怕人，碰牠的事慢慢來。','空著的日子會變成自由行動。','累了就睡一天吧，你倒下的話牠也會擔心的。'],
    loading:'讀取中……',txt:{title:'對話顯示方式',type:'逐字',line:'整行'},
    skip:'跳過',skipAsk:'跳過這段劇情？',skipBody:'選項會自動選第一個。\n跳過的劇情之後可以在「收納 → 日記本」回顧。',skipYes:'跳過',skipNo:'繼續看',diaryQuit:'回到日記本',
    favPop:'{name}　好感 {n}',
    pv:{title:'劇情預覽',body:'選一段直接播放（不會動到存檔）。播完回到這裡。',quit:'結束預覽',cond:'判定 {c} → {go}',condElse:'其他情況',condEnd:'結束',condNone:'判定：都不符合，接著往下'},
    greteMore:'（點我換下一句）',
    // 自由行動（v0.40.14）：行程空白的日子，執行時在地圖上自己選
    free:{tag:'自由行動',stat:'狀態',today:'今天（自由行動）',todayS:'今天',
      scene:{hall:'異生會大樓'},out:{hall:'離開大樓'},
      floor:{f5:'5F',f4:'4F',f3:'3F',f2:'2F',b1:'B1'},
      hub:{out:'出門'},
      shop:{clerk:'店員',hello:'「歡迎光臨，今天有這些。」',thanks:'「謝謝惠顧！」',none:'「今天的東西都賣完了，歡迎再來。」',sold:'售完',left:'剩 {n} 元',leave:'離開',pack:'{n}×{q}',
        bopen:'（新開的服飾店……門口寫著開幕慶祝，神秘應援組合免費領。）',empty:'這一類還沒有進貨。',bcats:{all:'全部',set:'套裝',top:'上衣',pants:'褲裙',acc:'飾品'},
        clerks:{silence:{n:'賽倫絲',hello:'「歡迎光臨～今天剛好輪到我顧店！」',thanks:'「謝謝惠顧！要好好用喔～」',none:'「今天的東西都賣完了，下次請早！」',idle:['（一邊整理貨架，一邊哼著歌。）','（偷偷在櫃檯下面寫報告。）','（發現你在看她，比了一個 YA。）']},ayen:{n:'阿言',hello:'「啊，是你。要買什麼嘛？我幫你拿。」',thanks:'「多謝惠顧……是這樣說的吧？」',none:'「賣完了嘛？明天再來看看。」',idle:['（拿著商品看了又看，好像在研究這是什麼。）','（把收銀機的按鈕一個一個按過去。）','（打了一個大大的呵欠。）']}},free:'免費',own:'已擁有'}},
    place:{home:{n:'家',d:'回家可以睡覺、照顧小球，也可以改之後幾天的行程、存檔。'},cafe:{n:'咖啡廳',d:'街角的小咖啡廳，常常在找假日的店員。'},hall:{n:'異生會大樓',d:'異生會的辦公大樓。'},ruins:{n:'廢棄大樓區',d:'言盡在這附近擺攤，可以幫忙整理。'},
      park:{n:'中央公園',d:'噴水池和大片草地。散步時常遇到熟人。'},avenue:{n:'商店街',d:'各式各樣的小店，隨便逛逛也開心。'},
      boutique:{n:'服飾店',d:'可以買衣服和配飾。'},itemShop:{n:'道具店',d:'照顧小球用得到的東西，也有一些入門書。'},cvs:{n:'便利商店',d:'24 小時營業，常常在缺人。'},
      arcade:{n:'電玩中心',d:'夾娃娃機、扭蛋和新出的遊戲。'},ktv:{n:'KTV',d:'包廂可以待一整個下午。'},community:{n:'活動中心',d:'市區的社區活動中心。聽說有人會念故事給小球們聽。'},
      b1:{n:'特殊任務室',d:'言曉君的辦公室。電梯的 B1 按鈕怎麼按都沒有反應。'},f2:{n:'實習生辦公室',d:'賽倫絲在這裡。初階文書工讀（知識 15）排進行程本就能來。'},f3:{n:'後勤辦公室',d:'瓊在這裡。進階文書工讀（社交 15）排進行程本就能來。'},f4:{n:'研究室',d:'言巷主導的研究團隊，加入門檻很高。'},f5:{n:'董事長辦公室',d:'言街常在這裡幫妹妹處理文書，跑來找他玩的小球也不少。'}},greteCall:'叫格蕾特',
};
TEXT.story=STORY_TEXT;
;
/* ==== js/story/data/story.js ==== */
// 【資料】主線（故事模式，v0.40 起）：數值、指令、地點。文字（名字、說明、台詞）在 js/data/texts.js 的 TEXT.story。
// 規則見專案文件「v0.4 規格（確認版）」。疲勞＝玩家，疲倦＝小球。

// 起始數值（第一章）
const STORY_START={hp:0,calm:-20,mood:40,tired:0,str:10,soc:10,know:10,fat:20,money:1500};
const STORY_RULE={
  rollP:30,   // 執行行程隨機：參數沒寫機率時，那天播的機率（%）（v0.40.60）
  weeks:4,               // 一章幾週
  goalHp:50,             // 第一章過關：健康 ≥50
  goalCalm:25,           // 安心 ≥25：結語差分
  vary:.2,               // 效果在表定值 ±20% 隨機
  crit:.10,fumble:.10,   // 成功中大成功、失敗中大失敗的機率
  rest:-20,              // 玩家沒照顧的那天，小球疲倦回復
  moodOk:3,moodFail:-5,moodRest:4,moodTiredAt:80,moodTired:-5,   // 情緒：照顧成功／失敗、小球休息日、疲倦太高
  slots:3,               // 手動存檔格數
  typeMs:30,             // 劇情逐字顯示：每個字幾毫秒
  tExec:1500,tEnd:1500,  // 執行這週：每天「執行」「結束」各幾毫秒（點一下可以跳過）
  jobGreat:.10,jobBad:.10,   // v0.40.37：打工也有大成功／大失敗（照顧的成功率看情緒；打工固定機率）
  jobMul:{great:{gain:1.5,cost:1},bad:{gain:.5,cost:1.5}},   // 打工結果的倍率：gain＝增加的能力、cost＝增加的疲勞（錢不變）
  living:200,            // v0.40.47：每週生活費（週結算扣；錢可以變負數）
  freeCap:3000,          // v0.40.53：自由模式的錢上限（到了週結算時主角提醒去買東西）
  debtOver:2             // 連續幾週結算時錢是負的＝小球被帶回異生會（遊戲結束）；第 1 週＝考察人員提醒（條件「負債週數」）
};
// 指令
//   cat：care 照顧｜job 打工｜rest 休閒（v0.40.35：外出併進休閒；自由行動＝空白的日子）
//   eff：基本效果（hp 健康、calm 安心、tired 疲倦、fat 疲勞、str 體能、soc 社交、know 知識、money 錢；rnd：體能／社交／知識隨機一種）
//   fixed：固定日行程（每週星期幾，0＝週一），min：本月最少次數
//   need：門檻（例 {know:15}）：打工沒到門檻＝不出現在行程表，到了就直接出現（v0.40.44；下週排行程時玩家會提一句，stJobNews）
//   freeOnly：不出現在行程表（自由行動才會發生：逛道具店）｜ord：行程表裡的順序（小的在前，沒寫＝50）
//   big：執行時的大背景｜small：小框的圖（陣列＝隨機挑）｜act：執行時的動作（care 靠近小球｜work 工作｜rest 搖晃｜sleep Zz）
//   at：在哪裡（STORY_MAP 的地點；做過就記進 STY.visit）
//   enc：可能遇到的人 [[人物 id, 機率, 限定], …]（人物見 STORY_NPC；限定 {w:第幾週, d:[星期幾，0＝週一]}＝只有那時候才會遇到；照順序挑第一個遇到的）
//   cap：這個行程最多把能力加到多少（讀書）｜book：要有那本書才會出現（STY.items；書在自由行動的道具店買，STORY_SHOP）
//   open：劇情開放後才出現（劇情效果「開放:…」，STY.open）｜kick：數值不夠會被趕出來（還是會遇到人，但只拿 kickEff）｜item：照顧時浮出來的道具（還沒有圖，先寫字）
const STORY_CMDS={
  med:  {cat:'care',at:'home',eff:{hp:8,tired:12,fat:8},fixed:[1,4],min:5,hurt:{n:3,calm:-3},act:'care',item:'medItem'},
  talk: {cat:'care',at:'home',eff:{calm:6,tired:6,fat:6},act:'care',item:'talkItem'},
  touch:{cat:'care',at:'home',eff:{calm:7,tired:6,fat:5},scared:{calm:2,tired:15},act:'care',item:'touchItem'},   // scared：安心還是負的時候
  note: {cat:'care',at:'home',eff:{hp:3,calm:2,know:2,tired:4,fat:10},act:'care',item:'noteItem'},
  cvs:  {cat:'job',at:'cvs',eff:{money:300,str:1,soc:1,fat:20},big:'place_avenue',small:'place_cvs',act:'work'},
  stock:{cat:'job',at:'ruins',eff:{rnd:1},big:'place_ruins_out',small:'place_ruins_in',act:'work',enc:[['yanjin',.6]],stage:{away:'yanjin'}},   // 言盡沒「遇到」＝她在旁邊發呆、看向另一邊（不加好感；v0.40.48）
  clerk:{cat:'job',at:'hall',eff:{money:300,know:2,fat:12},need:{know:15},big:'hall_lobby',small:'hall_2f',act:'work',enc:[['silence',.6]]},
  clerk2:{cat:'job',at:'hall',eff:{money:600,soc:2,fat:12},need:{soc:15},big:'hall_lobby',small:'hall_3f',act:'work',enc:[['joan',.6]]},
  busk: {cat:'job',at:'park',eff:{money:300,soc:2,fat:20},need:{soc:15},big:'place_park',small:'place_plaza',act:'work',enc:[['yanmo',.6]]},
  walk: {cat:'rest',ord:2,at:'park',eff:{fat:-20},big:'place_park',small:['place_park','place_river'],act:'rest',enc:[['yanmo',1,{w:2,d:[2,5]}],['xiaojun',.15],['yanmo',.1]],
         stage:{npcCrowd:{yanmo:{p:.25,n:6,face:6,sing:true}}}},   // 第二週的週三、週六言默一定在（C1-03 言街說的）｜遇到言默時 25%：一群小球圍著她聽歌、她唱歌（立繪 6＋慢慢晃；v0.40.47）
  shop: {cat:'rest',at:'avenue',eff:{fat:-20},big:'place_avenue',small:['place_shop','place_boutique'],act:'rest',enc:[['joan',.1],['silence',.08],['yanjin',.05]]},
  clean:{cat:'job',at:'park',eff:{money:300,str:2,fat:20},big:'place_park',small:'place_park',act:'work'},   // v0.40.14：清潔隊
  sleep:{cat:'rest',ord:0,at:'home',eff:{fat:-40},act:'sleep'},
  // 讀書（v0.40.33）：要先在道具店買那本初階書；能力最多讀到 cap
  readStr:{cat:'rest',at:'home',eff:{str:3,fat:8},cap:{str:25},book:'bookStr',act:'rest'},
  readSoc:{cat:'rest',at:'home',eff:{soc:3,fat:8},cap:{soc:25},book:'bookSoc',act:'rest'},
  read: {cat:'rest',at:'home',eff:{know:3,fat:8},cap:{know:25},book:'bookKnow',act:'rest'},
  // 道具店（v0.40.44）：自由行動進店裡＝這天逛道具店（有沒有買都算一天；買的東西、價錢在 STORY_SHOP）
  browse: {cat:'rest',at:'itemShop',eff:{fat:-10},freeOnly:true,big:'place_avenue',small:'place_shop',act:'rest'},
  snack:  {cat:'rest',at:'cvs',eff:{money:-50,fat:-10},big:'place_avenue',small:'place_cvs',act:'rest'},   // v0.40.44：便利商店買零食（之後二、三章可能改）
  // 店員打工（v0.40.33）：咖啡廳（體能、知識）、KTV（體能）、電玩中心（知識）
  cafeJob:  {cat:'job',at:'cafe',eff:{money:300,str:1,know:1,fat:15},big:'place_avenue',small:'place_cafe',act:'work'},
  ktvJob:   {cat:'job',at:'ktv',eff:{money:300,str:2,fat:20},big:'place_avenue',small:'place_ktv',act:'work'},
  arcadeJob:{cat:'job',at:'arcade',eff:{money:300,know:2,fat:15},big:'place_avenue',small:'place_arcade',act:'work'},
  coffee:   {cat:'rest',at:'cafe',eff:{money:-150,fat:-20,know:1},big:'place_avenue',small:'place_cafe',act:'rest'},
  arcade:{cat:'rest',at:'arcade',eff:{money:-200,fat:-25,soc:1},big:'place_avenue',small:'place_arcade',act:'rest'},
  ktv:  {cat:'rest',at:'ktv',eff:{money:-300,fat:-30,soc:2},big:'place_avenue',small:'place_ktv',act:'rest'},
  volunteer:{cat:'job',at:'community',eff:{money:150,soc:2,know:1,fat:15},big:'place_community',small:'place_community',act:'work',enc:[['yanjie',.6]],stage:{npcCrowd:{yanjie:{p:1,n:6}},crowdAlone:6}},   // 言街在＝小球圍著他；不在＝圍著玩家（v0.40.49）   // v0.40.30：活動中心義工（言街念故事給小球們聽；還沒有背景，先借廣場）
  lab:  {cat:'job',at:'hall',open:'f4',need:{know:25},eff:{money:800,know:3,fat:12},kick:{know:25},kickEff:{fat:10},big:'hall_lobby',small:'hall_4f',act:'work',enc:[['yanxiang',1]]},   // v0.40.23：4F 研究室（自由行動第一次去、知識不夠會被言巷趕出來；知識 25 以上才出現在行程表）
  f5:   {cat:'job',at:'hall',open:'f5',eff:{money:50,soc:2,fat:-10},big:'hall_lobby',small:'hall_top',act:'work',enc:[['yanjie',.6]],
         stage:{crowd:6,crowdBad:.5,npc:{bad:{face:1}},me:{bad:'shock'},pass:{n:[1]}}},   // 小球們圍著玩家；大失敗＝一半跑去找言街，言街無奈地笑（喜）、玩家嚇到（驚）   // v0.40.36：5F 幫言街顧跑來找他玩的小球（言街忙文書的時候）
  free: {cat:'rest',ord:1,eff:{fat:-10},act:'rest'}     // 自由行動（行程空白）：那天執行時打開地圖自己選（v0.40.14）；這裡只是行程表上的名字
};
const STORY_CATS=['care','job','rest'];
// 執行這週的小動畫（v0.40.37）：預設規則。個別指令要特別演＝在 STORY_CMDS 寫 stage:{…}，只蓋過寫到的那幾項
//   npc：遇到的人照結果反應 {結果:{face 表情 0～6（0 正常 1 喜 2 怒 3 哀 4 樂 5 驚 6 特殊）, hop 跳一下, p 機率（沒寫＝一定）}}；結果＝ok 完成｜great 大成功｜bad 大失敗｜fail 失敗
//   me：玩家（紙娃娃）的表情 {結果:'' fun 樂 sad 哀 shock 驚 joy 喜 anger 怒}
//   pass：路人小球（只在家以外；顏色隨機）{n：這次出現幾種行動模式的機率 [0 種, 1 種, 2 種], modes：各模式的權重（0＝不會出現）}
//     run 在人物後面跑過去（快跑或慢慢走，左右隨機）｜follow 在玩家或遇到的人旁邊、跟著一起動｜nest 在旁邊窩著
//     head 在頭上（跟著跳、晃）｜big 大隻的、窩在左下或右下角（擋住其他人）｜pair 兩隻一組在一個地方玩（輪流跳）
//   visit：在家（照顧、睡覺、讀書…）時，日常模式養過的小球（圖鑑裡還在的）隨機來陪你 {p 機率}：睡覺＝在旁邊一起睡｜照顧＝在後面看、揮手｜其他＝跑來跑去
//   crowd：圍在玩家身邊的小球幾隻｜crowdBad：大失敗時跑去找遇到的人的比例
//   crowdAlone：沒遇到人的時候，圍在玩家身邊的小球幾隻（活動中心義工）
//   away：沒遇到人的時候，這個人還是在畫面上、但看向另一邊（不算遇到、不加好感）
//   npcCrowd：遇到某個人時，一群小球圍在那個人旁邊跳 {人物:{p 機率, n 幾隻, face 那個人的立繪, sing 慢慢晃（唱歌）}}（例：公園散步遇到言默＝小球們聽她唱歌）
const STORY_STAGE={
  npc:{ok:{hop:true,p:.5},great:{face:4,hop:true},bad:{face:3},fail:{face:0}},
  me:{great:'fun',bad:'sad'},
  pass:{n:[.3,.45,.25],modes:{run:1,follow:1,nest:1,head:1,big:.6,pair:1}},
  visit:{p:.5},
  crowd:0,crowdBad:0
};
// 道具（v0.40.33）：名字、說明在 TEXT.story.items。初階書：買了行程本的休閒多一個讀書的行程
const ST_FREE_KEYS=['money','fat','tired'];   // 自由模式（v0.40.62）：只有這些會變（錢、玩家疲勞、小球疲倦）；道具也會變
const STORY_ITEMS=['bookStr','bookSoc','bookKnow','soothe','energy'];   // 道具店（STORY_SHOP）
// 自由行動的地圖（v0.40.14；v0.40.44 點了直接做）：x、y＝名牌在地圖上的位置（%，assets/bg/map.jpg 3:2）｜img＝「？」說明卡的小圖
//   do＝點了直接做的事（休閒；打工都要排行程，例外：廢墟、活動中心、5F）｜go：點了進去（STORY_SCENES 的 key：家、異生會大樓）｜shop：點了進店裡（STORY_SHOP）
//   要花錢的事錢不夠＝地點鎖著（v0.40.45）。名字、說明在 TEXT.story.place。
const STORY_MAP={
  home:    {x:85,y:50,go:'home'},
  hall:    {x:13,y:20,go:'hall'},
  ruins:   {x:74,y:16,img:'place_ruins_out',do:'stock'},
  park:    {x:25,y:63,img:'place_park',do:'walk'},
  avenue:  {x:45,y:49,img:'place_avenue',do:'shop'},
  boutique:{x:55,y:58,img:'place_boutique',shop:'boutique'},
  itemShop:{x:38,y:57,img:'place_shop',shop:'itemShop'},
  cvs:     {x:33,y:41,img:'place_cvs',do:'snack'},
  arcade:  {x:62,y:41,img:'place_arcade',do:'arcade'},
  ktv:     {x:52,y:31,img:'place_ktv',do:'ktv'},
  cafe:    {x:44,y:22,img:'place_cafe',do:'coffee'},   // v0.40.33；v0.40.36 移到 KTV 左上
  community:{x:10,y:71,img:'place_community',do:'volunteer'}   // v0.40.30：市區的活動中心
};
// 店（v0.40.44）：goods＝[[道具, 價錢], …]，一次最多擺 show 樣；買過的＝售完（不能點）；全部賣完／沒有商品＝地圖上鎖著。店員沒有臉（之後再換圖）
//   進店就算這天的行程（day），有沒有買都一樣。待辦：道具店的一番賞、服飾店的衣服
// 消耗品（v0.40.62，在收納 → 道具「使用」，用一次少一個）：效果是休息的兩倍——舒緩液＝小球疲倦（沒照顧的那天 STORY_RULE.rest）×2、能量飲料＝玩家疲勞（睡覺）×2
const STORY_USE={soothe:{tired:STORY_RULE.rest*2},energy:{fat:STORY_CMDS.sleep.eff.fat*2}};
const STORY_SHOP={
  itemShop:{bg:'place_shop',day:'browse',show:7,clerk:['silence','ayen'],goods:[['bookStr',250],['bookSoc',250],['bookKnow',250],['soothe',300],['soothe',850,3],['energy',300],['energy',850,3]]},   // 第三格＝一次買幾個（v0.40.62）；v0.40.63 拿掉測試商品
  boutique:{bg:'place_boutique',day:'browse',show:8,goods:[['fan_yellow',0],['fan_purple',0],['fan_grey',0],['fan_blue',0],['fan_white',0],['glass_square',350],['glass_trend',450],['glass_sun',500]]}   // 應援組合＝開幕免費領；眼鏡價錢是 Claude 暫定（v0.40.65）｜v0.40.66 省略店員   // J＝服裝店店員（固定的紙娃娃 STORY_J_DOLL，v0.40.64）
};
// 點進去的地方：家（v0.40.44：白天的家＝直接按的按鈕：睡覺、照顧小球、出門；旁邊的按鈕都能用，可以改還沒到的日子的行程、存檔）
//   異生會大樓（list＝由上到下的樓層按鈕）：do＝點了直接做｜open＝劇情開放後才能去｜once＝去過一次就鎖起來｜沒有 do＝鎖著（之後可以帶小球去串門子）
const STORY_SCENES={
  home:{bg:'home_day',hub:['sleep','care','out'],care:['talk','touch','note']},
  hall:{bg:'hall_lobby',list:['f5','f4','f3','f2','b1'],pins:{
    f5:{img:'hall_top',do:'f5',open:'f5'},
    f4:{img:'hall_4f',do:'lab',open:'f4',once:true},
    f3:{img:'hall_3f'},
    f2:{img:'hall_2f'},
    b1:{img:'hall_b1'}}}
};
// 家：排行程是晚上；執行時在家（照顧的大背景、睡覺、自由行動回家）是白天。照顧的小框＝小魚缸
const STORY_HOME={plan:'home_night',day:'home_day',tank:'place_tank',bag:'home_shelf'};
// 人物（遇到的人、人際頁）：img＝Q 版立繪（沒有圖＝''，先畫「？」）｜face＝頭像｜acc：配件什麼時候戴（in＝在異生會大樓裡〔瓊的工作證〕、out＝在大樓外〔賽倫絲的耳骨夾〕、always＝一直戴〔言街的眼鏡〕、lab＝只在 4F 研究室〔言巷的眼鏡；主線還沒有研究室的場景〕）
const STORY_NPC={
  xiaojun:{img:'xiaojun_L_0',face:'xiaojun_face'},grete:{img:'grete_L_0',face:'grete_face'},yanjin:{img:'yanjin_L_0',face:'yanjin_face'},silence:{img:'silence_L_0',face:'silence_face',acc:'out'},joan:{img:'joan_L_0',face:'joan_face',acc:'in'},yanmo:{img:'yanmo_L_0',face:'yanmo_face'},
  ayen:{img:'ayen_L_0',face:'ayen_face'},   // 阿言（神秘的女性）
  yanjie:{img:'yanjie_L_0',face:'yanjie_face',acc:'always'},yanxiang:{img:'yanxiang_L_0',face:'yanxiang_face',acc:'lab'}   // v0.40.7：每週來家裡查看的人（言街、賽倫絲、言巷、瓊）
};
// 好感（v0.40.22 起 0～100：一顆心＝20）：start 起始值｜meet 主線第一次遇到｜enc 之後每次遇到｜cap 每章上限 [一般, {例外}]（見專案文件「NPC故事線與好感」）
// ---------- 條件（v0.40.31 統整：觸發條件、判定都用這一份）----------
// 一個條件＝「變數 比較 數字」，好幾個用「,」（總表寫「、」）連起來＝全部都要符合
//   k：程式裡的名字｜cn：總表寫的中文｜of：後面要接誰（npc 人物、cmd 行程），寫成 k.對象／中文:對象
// 新增條件變數：這裡加一行，再到 js/story/script.js 的 ST_COND_GET 寫怎麼取值（沒寫＝小球／玩家的數值 STY.st[k]）
const STORY_COND=[
  {k:'fav0',cn:'原本好感',of:'npc'},   // 這段劇情開始時的好感（遇到人的劇情＝這週遇到之前），劇情裡加的不算
  {k:'fav',cn:'好感',of:'npc'},        // 現在的好感
  {k:'seen',cn:'做過',of:'cmd'},       // 做過這個行程沒（1／0）
  {k:'alone',cn:'沒遇到人'},   // 執行行程時：那天平常會在的人不在＝1（v0.40.60；只在「執行行程隨機」有意義）
  {k:'week',cn:'週'},{k:'med',cn:'換藥次數'},{k:'debt',cn:'負債週數'},   // debt：連續幾週結算時錢是負的（v0.40.47）
  {k:'hp',cn:'健康'},{k:'calm',cn:'安心'},{k:'mood',cn:'情緒'},{k:'tired',cn:'疲倦'},
  {k:'str',cn:'體能'},{k:'soc',cn:'社交'},{k:'know',cn:'知識'},{k:'fat',cn:'疲勞'},{k:'money',cn:'錢'}];
const STORY_COND_OPS=['>=','<=','==','>','<','='];
// 程式 → 一個一個拆開：[{v 變數定義, of 對象, op, n}]；看不懂的放 bad
function storyCondParse(c){const out=[],bad=[];
  String(c||'').split(/[,，、]/).map(x=>x.trim()).filter(Boolean).forEach(t=>{
    const m=t.match(/^([A-Za-z]\w*)(?:\.(\w+))?\s*(>=|<=|==|>|<|=)\s*(-?\d+)$/),v=m&&STORY_COND.find(x=>x.k===m[1]);
    const okOf=!v||!v.of||!m[2]||(v.of==='npc'?typeof TEXT==='undefined'||!!TEXT.story.npc[m[2]]:!!STORY_CMDS[m[2]]);   // 對象要存在
    if(!v||(v.of&&!m[2])||(!v.of&&m[2])||!okOf)bad.push(t);else out.push({v,of:m[2]||'',op:m[3],n:+m[4]})});
  return {terms:out,bad};}
// 程式 → 總表的中文（npc／cmd＝{id:名字}）
function storyCondCn(c,npc,cmd){
  return String(c||'').split(/[,，、]/).map(x=>x.trim()).filter(Boolean).map(t=>{const {terms}=storyCondParse(t);if(!terms.length)return t;const x=terms[0];
    return x.v.cn+(x.v.of?':'+((x.v.of==='npc'?npc:cmd)[x.of]||x.of):'')+x.op+x.n}).join('、');}
// 總表的中文 → 程式；看不懂的留原樣並列在 bad
function storyCondId(c,npc,cmd){const bad=[],rev=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[v,k]));const rn=rev(npc),rc=rev(cmd);
  const vars=STORY_COND.slice().sort((a,b)=>b.cn.length-a.cn.length);
  const code=String(c||'').replace(/＞/g,'>').replace(/＜/g,'<').replace(/＝/g,'=').replace(/：/g,':').replace(/[＋]/g,'+').replace(/[－]/g,'-')
    .split(/[,，、]/).map(x=>x.replace(/\s/g,'')).filter(Boolean).map(t=>{
      const m=t.match(/^(.+?)(>=|<=|==|>|<|=)(-?\d+)$/);if(!m){bad.push(t);return t}
      let L=m[1],k=null;
      if(/^[A-Za-z]/.test(L))k=L;   // 本來就是程式寫法
      else{const v=vars.find(x=>L===x.cn||L.startsWith(x.cn+':')||(x.of&&L.startsWith(x.cn)));
        if(v){const o=L.slice(v.cn.length).replace(/^:/,'');k=v.of?(o?v.k+'.'+((v.of==='npc'?rn:rc)[o]||o):null):(o?null:v.k)}}
      const r=k?k+m[2]+m[3]:t;if(!k||storyCondParse(r).bad.length)bad.push(t);return r}).join(',');
  return {code,bad};}

const STORY_FAV={start:{grete:30,xiaojun:20,joan:20,silence:20,yanjin:20},meet:10,enc:2,cap:[[30,{grete:40}],[80],[90]]};
function storyFavCap(ch,k){const c=STORY_FAV.cap[ch-1]||[100];return (c[1]&&c[1][k])||c[0]}
const STORY_PPL=['xiaojun','grete','yanjin','silence','joan','yanmo','yanjie','yanxiang','ayen'];   // 人際頁的順序（也是存檔裡會留的好感；v0.40.62 補上阿言，原本讀檔會掉）
// 手機直放時背景的左右焦點（%）
const STORY_FOCUS={home_night:72,home_day:72};

// 新的一章／讀存檔時的檢查（匯入的檔案不可信）。放在 data 檔是因為讀存檔（js/codex.js）比 js/story/*.js 早
function storyNew(){return {ch:1,week:1,st:{...STORY_START},medDone:0,meds:0,fav:{...STORY_FAV.start},favV:2,open:[],num:String(Math.floor(Math.random()*9000)+1000),at:'',done:[],seen:[],visit:[],items:{},wearOwn:[],met:[],jobSeen:null,debt:0}}   // done：播過的劇情｜seen：做過的指令｜visit：去過的地點（v0.40.14）｜items：買到的東西（v0.40.33）｜jobSeen：行程表已經出現過的打工（null＝還沒記，第一次排行程時記下來、不提示；v0.40.44）
// 日記本的頭像：支線 B、小事件 L 後面兩位數＝主要人物（v0.40.61）；larva＝自家小球｜unknown＝陌生小球（？）｜me＝玩家自己
const STORY_WHO_CODE={'00':'ayen','01':'yanjin','02':'yanmo','03':'silence','04':'joan','05':'xiaojun','06':'yanxiang','07':'grete','08':'yanjie','09':'larva','10':'unknown','11':'me'};
// 每個數值的範圍（讀存檔、週中途存檔共用；v0.40.62 統一：原本讀存檔時能力夾到 100、週中途夾到 999）：安心 −100～100｜錢可以是負的（負債）｜能力 0～999｜其他 0～100
const storyStatRange=k=>k==='calm'?[-100,100]:k==='money'?[-9999999,9999999]:k==='str'||k==='soc'||k==='know'?[0,999]:[0,100];
// 讀存檔時檢查（匯入的檔案不可信）
// 認識的人：存檔的 met＋播過的 B／L 編號事件的人物（STORY_WHO_CODE）＋遇到人（meet）事件的對象
function storyMetNorm(o){const m=new Set((Array.isArray(o.met)?o.met:[]).map(String));
  (Array.isArray(o.done)?o.done:[]).forEach(id=>{const x=String(id).match(/^[BL](\d\d)-/),c=x&&STORY_WHO_CODE[x[1]];if(c)m.add(c);
    const e=typeof STORY_SCRIPT!=='undefined'&&STORY_SCRIPT.find(e=>e.id===id);if(e&&e.trig==='meet')m.add(String(e.arg||'').split(/[@,]/)[0])});
  return STORY_PPL.filter(k=>m.has(k))}
function storyNorm(o){
  if(!o||typeof o!=='object')return null;
  const n=(v,a,b)=>Math.max(a,Math.min(b,Math.round(+v||0)));
  const st={};for(const k in STORY_START)st[k]=n(o.st&&o.st[k]!=null?o.st[k]:STORY_START[k],...storyStatRange(k));
  const fav={};STORY_PPL.forEach(k=>{const v=o.fav&&o.fav[k];if(v)fav[k]=n(v,0,100)});
  if(o.favV!==2)STORY_PPL.forEach(k=>{const v=Math.min(fav[k]*10||0,storyFavCap(n(o.ch,1,3)||1,k));if(v||STORY_FAV.start[k])fav[k]=Math.max(v,STORY_FAV.start[k]||0)});   // v0.40.21 以前是 0～5 顆心
  const free=!!o.freeMode;   // 自由模式（中繼存檔，v0.40.53；v0.40.62 起數值、好感直接留在 st／fav，不再存 base）
  return {...(free?{freeMode:true,freeSlot:n(o.freeSlot,0,2)}:{}),debt:n(o.debt,0,9),favV:2,ch:n(o.ch,1,3)||1,week:n(o.week,1,free?999:STORY_RULE.weeks)||1,st,medDone:n(o.medDone,0,99),meds:n(o.meds,0,999),fav,num:String(o.num||'0417').replace(/\D/g,'').slice(0,4)||'0417',at:String(o.at||'').slice(0,10),wearOwn:[...new Set((Array.isArray(o.wearOwn)?o.wearOwn:[]).filter(x=>DOLL_SHOP_WEAR.includes(x)))],   // 這個存檔拿到的衣物（v0.40.69）
    met:storyMetNorm(o),   // 認識的人（v0.40.69：自由模式好感不變，第一次見面記在這裡；舊存檔從播過的支線補）
    
    done:(Array.isArray(o.done)?o.done:[]).map(String).filter(x=>/^[\w-]{1,20}$/.test(x)).slice(0,500),seen:(Array.isArray(o.seen)?o.seen:[]).map(String).filter(x=>has(STORY_CMDS,x)),visit:(Array.isArray(o.visit)?o.visit:[]).map(String).filter(x=>has(STORY_MAP,x)||has(STORY_SCENES,x)),
    open:(Array.isArray(o.open)?o.open:[]).map(String).filter(x=>/^\w{1,12}$/.test(x)).slice(0,50),
    items:Object.fromEntries(STORY_ITEMS.filter(k=>o.items&&o.items[k]).map(k=>[k,n(o.items[k],1,99)])),
    jobSeen:Array.isArray(o.jobSeen)?o.jobSeen.map(String).filter(x=>has(STORY_CMDS,x)&&STORY_CMDS[x].cat==='job'):null,   // v0.40.36～43 的 jobs（領到的工作）不用了：打工改成數值到了就出現
    run:storyRunNorm(o.run,n)};   // open：劇情開放的地點（v0.40.23）
}
// 週中途的存檔（v0.40.44）：白天回到家（自由行動）時存＝這週跑到哪一天 {i 今天（還沒決定，一定是自由行動）, ids 七天的行程, start 週初數值, end 現在的數值, res 前幾天的結果, met 這週播過見面劇情的人}
//   不對勁就丟掉（＝從這週開始重來；好感、做過的事已經照存檔時的樣子）
function storyRunNorm(o,n){
  if(!o||typeof o!=='object')return null;
  const i=n(o.i,0,6),ids=Array.isArray(o.ids)?o.ids.map(String):[];
  if(ids.length!==7||ids.some(x=>x!=='free'&&!has(STORY_CMDS,x))||ids[i]!=='free'||!Array.isArray(o.res)||o.res.length!==i)return null;
  const stat=(v,meds)=>{const r={};for(const k in STORY_START)r[k]=n(v&&v[k]!=null?v[k]:STORY_START[k],...storyStatRange(k));if(meds)r.meds=n(v&&v.meds,0,999);return r};
  const RK=['ok','great','fail','bad'],img=v=>/^\w{1,30}$/.test(String(v||''))?String(v):'';
  const res=o.res.map(x=>{if(!x||!has(STORY_CMDS,String(x.id)))return null;const d={};
    for(const k in STORY_START)if(x.d&&x.d[k]!=null)d[k]=Math.round(+x.d[k]||0);
    return {id:String(x.id),r:RK.includes(x.r)?x.r:'ok',before:stat(x.before),d,small:img(x.small),big:img(x.big)||STORY_HOME.day,
      enc:STORY_PPL.includes(x.enc)||x.enc==='ayen'?x.enc:null,forced:!!x.forced,kick:!!x.kick,fg:n(x.fg,0,100),meet:!!x.meet,free:!!x.free,
      buys:(Array.isArray(x.buys)?x.buys:[]).map(String).filter(k=>STORY_ITEMS.includes(k)),vis:String(x.vis||'').slice(0,20)}});
  if(res.some(x=>!x))return null;
  return {i,ids,start:stat(o.start),end:stat(o.end,true),res,met:Object.fromEntries(Object.keys(o.met||{}).filter(k=>has(STORY_NPC,k)).map(k=>[k,1]))};
}
;
/* ==== js/story/data/storyscript.js ==== */
// 【資料】主線劇情（v0.40.1；第一章劇情初稿 v0.40.5）。由設定總表「主線劇情」分頁產生（python3 tools/textsheet.py apply），也可以直接改這裡。
// 一個事件＝{id 編號, kind 種類（main 主線｜side 支線｜event 小事件；總表分成三頁，遊戲裡觸發方式一樣）, ch 章, trig 觸發, arg 觸發參數, note 說明, title 日記標題（寫了才會出現在收納 → 日記本）, lines:[一行一句]}
// 教學演出：scr:畫面.頁籤（stat/plan/tank/bag；none＝關）、hl:區塊（data-hl，見 js/story/view.js 的畫面）
//   trig：start 開場｜weekStart 週開始（arg＝第幾週）｜weekEnd 週結束（arg＝第幾週）｜first 第一次做（arg＝指令 id；或 crit 第一次大成功、fumble 第一次大失敗、collapse 第一次累倒、tiredMax 小球疲倦第一次滿）｜
//         stat 數值（arg＝條件，例 hp>=20）｜chapterEnd 章末（arg＝條件，空白＝都符合；照順序挑第一個符合的）｜chapterPass 過關後（章末之後播）｜
//         open 第一次打開畫面（arg＝plan 行程／stat 狀態／bag 背包／tank 水缸）｜pick 第一次排進行程（arg＝指令 id）｜meet 遇到人（arg＝人物 id，或 人物@指令＝在那個行程遇到；一個人一週最多一段）
//   stat、chapterEnd 以外的觸發，參數後面可以再加條件：例 touch,calm<0｜3,med<3｜yanmo@walk,fav.yanmo==0（fav.X＝好感；meet 是加好感之前判斷，所以 ==0＝主線裡第一次遇到）
//   每行：tag 標籤（給「跳到」用）、who 說話者（narr 旁白｜player 玩家｜choice 選項｜人物 id：xiaojun grete yanjin silence joan yanmo…）、face 表情（人物：0 正常 1 喜 2 怒 3 哀 4 樂 5 驚，舊格式的人物＝圖的編號；玩家：joy anger sad fun shock，空白＝平常）、
//         text 內容、bg 背景（檔名；之後一直用到換掉）、chr 右邊立繪（檔名，例 xiaojun_L_0；加 +acc＝疊配件；none＝收起來）、chl 左邊立繪（兩個人對話時；自動用面向右的 _R_ 圖）、fx 演出（shake 震動｜flash 閃白｜larvaIn 小球出現｜larvaOut 小球消失｜hop 立繪跳一下｜crouch 立繪蹲下｜sway 立繪晃一晃｜all 整段一起出現；好幾個用「,」隔開）；bg 寫 black＝全黑；text 有換行＝一次出一行，**字**＝強調、
//         go 跳到（標籤；end＝結束）、eff 數值變化（例 calm+3, fav.xiaojun+1）、note 備註（不會出現在遊戲裡）
// 條件寫法：hp>=20、calm<25、week==2，多個用「,」＝而且。數值：hp 健康、calm 安心、mood 情緒、tired 疲倦、str 體能、soc 社交、know 知識、fat 疲勞、money 錢、week 週、med 換藥水次數、fav.人物 好感。
const STORY_SCRIPT=[
  {"id": "M1-01", "kind": "main", "ch": 1, "trig": "start", "arg": "", "note": "導入：接到通知 → B1 交付小球（◎CG 候選：第一次見到小球）", "title": "緊急委託","lines":[
    {"who": "narr", "text": "接到言曉君的訊息，是在一個很普通的早上。", "bg": "home_day"},
    {"who": "narr", "text": "「今天方便來一趟 B1 嗎？任務有後續了。」"},
    {"who": "narr", "text": "……", "bg": "hall_lobby"},
    {"who": "narr", "text": "電梯一路往下。B1 的走廊很安靜，只有特殊任務室的門縫透出一點光。", "bg": "black"},
    {"who": "narr", "text": "言曉君站在資料櫃旁，似乎正在閱讀資料，還沒等你開口，她便像是早已注意到般轉過身來。", "bg": "hall_b1", "chr": "xiaojun_R_0+acc"},
    {"who": "xiaojun", "face": "0", "text": "「來了。你先坐吧。」", "chr": "xiaojun_L_0+acc"},
    {"who": "narr", "text": "她招呼你坐下後，從桌子底下提出一個金屬箱子，打開，裡面是一個小小的水缸。", "fx": "crouch:R", "note": "類似那種蹲下找東西的感覺\n\n這裡的兩行可以先出第一行，按一下在出第二行，不換頁"},
    {"who": "xiaojun", "face": "0", "text": "「這個，上次跟你提過的孩子，他前幾天剛出院。」", "fx": "larvaIn"},
    {"who": "narr", "text": "那是一顆淡得幾乎透明的小球，縮在水缸的角落……｜身上有一道還沒癒合的傷，顏色暗暗的，看起來很痛。\n\n雖然言曉君搬移水缸時幾乎沒有造成什麼震動，｜但當冷色燈管的光線照入後，小球彷彿被什麼嚇到一般，微微顫抖。", "fx": "larvaSway@4", "note": "同樣多行的話點選出下一行，全出完才換頁，後續的多行都是默認這樣處理，除非有另外備註"},
    {"who": "narr", "text": "言曉君從旁拿了一個不透明的資料板稍微蓋在水缸上方，這才讓他稍微緩和下來。", "fx": "sway:R"},
    {"who": "narr", "text": "這個小球的狀況顯然與你先前見過的都不同。言曉君也沒讓你久等，輕聲解釋道。"},
    {"who": "xiaojun", "face": "3", "text": "「這孩子是上個月的任務救回來的。｜找到他的時候情況很糟，地面的積水有逝留痕跡反應，附近……沒有找到任何異種。」"},
    {"who": "choice", "text": "怎麼這樣……", "go": "M1-01_1_1"},
    {"who": "choice", "text": "逝留痕跡反應？", "go": "M1-01_1_2"},
    {"tag": "M1-01_1_1", "who": "xiaojun", "face": "2", "text": "「世事本無常。」", "fx": "contNl2", "go": "M1-01_1_3"},
    {"tag": "M1-01_1_2", "who": "xiaojun", "face": "2", "text": "「……嗯，字面上的。」\n「異種消逝化為水後，那些水分會殘留營養供給同伴……｜這個法則除了小球以外，對成年異種也適用。」", "fx": "contNl2"},
    {"tag": "M1-01_1_3", "who": "xiaojun", "face": "3", "text": "「**消逝後殘留的痕跡**——｜或許那就是某個人努力留給他的希望吧。」", "fx": "contNl2", "note": "如果想強調某個詞（我在想要粗體還是換色），那我要怎麼在內容文本裡表現？添加**框起來？還是有什麼方便你辨識的語法？\n\n我想特別標示「消逝後殘留的痕跡」"},
    {"who": "xiaojun", "face": "0", "text": "「總之，我們能做的就是辦好各自的工作。事情的始末我會繼續追查，而初步的治療……\n得益於**上面那位**的研究熱忱和這孩子自身的毅力，治療算是撐過來了。」\n「但接下來每天都要有人看著、按時換藥。」", "note": "「上面那位」強調"},
    {"who": "xiaojun", "face": "0", "text": "「研究中心忙得要死，後勤組人來人往……我這邊更不用說了，都不是適合休養的地方。」\n\n「所以，才會請託達到心等4的你。」"},
    {"who": "narr", "text": "似乎是給你消化的時間，她拿起水壺喝了一口，才繼續任務交接。"},
    {"who": "xiaojun", "face": "0", "text": "「這孩子的案件登記編號是UM-{num}。」"},
    {"who": "xiaojun", "face": "3", "text": "「……不過他當然不認識這個編號。叫他也不會有反應。」", "fx": "contNl"},
    {"who": "choice", "text": "他原本叫什麼名字？", "go": "M1-01_2_1"},
    {"who": "choice", "text": "我可以幫他取名字嗎？", "go": "M1-01_2_2"},
    {"tag": "M1-01_2_1", "who": "xiaojun", "face": "3", "text": "「沒人知道。他這個年紀還不會說話，｜醫療組的人試著用紙筆或字卡問過，但他不願意交流。」", "go": "M1-01_2_3"},
    {"tag": "M1-01_2_2", "who": "xiaojun", "face": "5", "text": "「……。」"},
    {"who": "xiaojun", "face": "1", "text": "「雖然時機有點太早了，但你有這個想法挺好的。」\n\n「等他願意待在你身邊再說吧。」", "fx": "contNl2", "note": "第二章開放取暱稱"},
    {"tag": "M1-01_2_3", "who": "xiaojun", "face": "0", "text": "「那麼來交代醫療組的叮囑吧，這是他要用的藥水。」\n\n「藥水一週用兩次，週二和週五。這個月至少要換滿五次，傷口才收得起來。」", "fx": "sway", "note": "像是拿東西放桌上的動作"},
    {"who": "xiaojun", "face": "0", "text": "「上藥會痛。前幾次他大概會更怕你，這是正常的，不要因為這樣就停下來。」"},
    {"who": "xiaojun", "face": "2", "text": "「雖然可能不好聽，但有件事也得先說清楚。」\n「接下來這一個月是評估期。｜雖說你是他的緊急照顧者，生活上的一切會由你安排，但案件還是需要追蹤。」"},
    {"who": "xiaojun", "face": "2", "text": "「每周異生會都會安排不同的人去查看他的狀況。如果恢復得不好，或是他沒辦法待在你那裡……｜異生會會另外安排。」\n\n「畢竟他可能沒有這麼多時間。」"},
    {"who": "choice", "text": "我會好好照顧他。", "go": "M1-01_3_1", "eff": "fav.xiaojun+3", "note": "好感+1我覺得可以做個小提示，從畫面左下浮出來"},
    {"who": "choice", "text": "……我做得到嗎？", "go": "M1-01_3_2"},
    {"tag": "M1-01_3_1", "who": "xiaojun", "face": "1", "text": "「嗯，交給你。」", "go": "M1-01_3_3"},
    {"tag": "M1-01_3_2", "who": "xiaojun", "face": "0", "text": "「做不到的話，我就不會找你了。」"},
    {"who": "narr", "text": "她說得很平淡，像是在陳述一件早就確認過的事。"},
    {"tag": "M1-01_3_3", "who": "xiaojun", "face": "0", "text": "「好了，先回家吧，晚點異生會會有專門的車送他過去。」"},
    {"who": "narr", "text": "你點點頭，在離開前看了小球一眼……自始至終他都縮在水缸的一角，從頭到尾都沒有動過。", "bg": "black"}
  ]},
  {"id": "M1-02", "kind": "main", "ch": 1, "trig": "weekStart", "arg": "1", "note": "到家＋教學（狀態→行程→水缸→收納，同一段）", "title": "格蕾特來了","lines":[
    {"who": "narr", "text": "回到家後你先整理了水缸……傍晚，異生會的工作車抵達了。\n同時還帶來了一位意想不到的人。", "bg": "home_night"},
    {"who": "grete", "face": "4", "text": "「我來啦！」", "chr": "grete_L_4"},
    {"who": "player", "face": "shock", "text": "「格蕾特？你怎麼來了？」"},
    {"who": "grete", "face": "1", "text": "「嘿嘿，{name}有想我嗎？」"},
    {"who": "grete", "face": "0", "text": "「我在大樓閒逛的時候，聽到言曉君讓後勤帶這孩子來找你，我就跟來了。」", "fx": "contNl"},
    {"who": "grete", "face": "3", "text": "「……｜他還好小喔。」", "fx": "squat", "note": "這個我想要單純蹲一下就站起來，不用晃一晃，可能要和上面的做差別"},
    {"who": "grete", "face": "0", "text": "「但，沒問題的，我也來幫你吧！日常換水餵食的部分交給我。」"},
    {"who": "grete", "face": "1", "text": "「……啊，對了對了，你知道行程本嗎？瓊雖然每次都寫兩頁就放棄了，但她和賽倫絲都很推薦喔！」"},
    {"who": "grete", "face": "4", "text": "「我剛好有一本，送你！現在就來看看吧！」"},
    {"who": "grete", "face": "0", "text": "「首先這裡！這裡可以看你和小球的狀態。」", "chr": "grete_L_0", "fx": "helperIn:67%,scr:stat.larva,hl:tabs", "note": "教學：畫面打開狀態（小球頁），立繪縮到右下，講到的地方以外調暗"},
    {"who": "grete", "face": "3", "text": "「小球最重要的是『健康』。月底評估要到 50……現在是 0。」", "fx": "hl:hp"},
    {"who": "grete", "face": "0", "text": "「【安心】現在是負的。他現在還很怕人，太熱情反而會嚇到他。」", "fx": "hl:calm"},
    {"who": "grete", "face": "0", "text": "「【情緒】好的時候，照顧比較容易成功。【疲倦】太高的話做什麼都會失敗，要讓他休息。」", "fx": "hl:mood,hl:tired"},
    {"who": "grete", "face": "0", "text": "「你的【疲勞】也一樣。疲勞滿了，你會直接倒下去睡一整天喔！｜作為照顧者，你也要好好照顧自己。」", "fx": "scr:stat.me,hl:fat"},
    {"who": "narr", "text": "她輕輕地摸了摸你的頭，明明平時言行舉止都像個孩子，此刻卻莫名的給人一種長輩的氛圍……？"},
    {"who": "grete", "face": "1", "text": "「【人際】那頁會記下你遇到的人。……你看，我已經在上面了！」", "fx": "scr:stat.ppl,hl:ppl"},
    {"who": "grete", "face": "4", "text": "「目前我最喜歡你喔！」", "fx": "contNl2"},
    {"who": "grete", "face": "1", "text": "「然後我們往後翻，這就是行程本～有一週七天，以及能執行的項目。」", "chr": "grete_L_1", "fx": "scr:plan.care,hl:week,hl:cmds"},
    {"who": "grete", "face": "0", "text": "「【照顧】是有關小球的事，會增加他的疲倦，也會增加你的疲勞，不過當你去做其他事情的時候，他自己也會休息啦！」", "fx": "hl:cat-care,hl:cmds"},
    {"who": "grete", "face": "4", "text": "「【打工】可以賺錢、鍛鍊能力；【休閒】就是放鬆休息，當然這些活動都有機會遇到其他人喔。」", "fx": "hl:cat-job,hl:cat-rest"},
    {"who": "grete", "face": "0", "text": "「最重要的換藥水已經先排在週二和週五了。它是【固定日行程】，只能放在那兩天，可以被其他行程蓋過……這個月至少要換 5 次。」", "fx": "hl:fixed,hl:medsum"},
    {"who": "grete", "face": "3", "text": "「點一下排好的格子就能取消。不過換藥水跳過太多次，月底會來不及喔。」", "fx": "hl:fixed"},
    {"who": "grete", "face": "0", "text": "「空著的日子是【自由行動】，那天可以自己決定要去哪裡。」", "fx": "hl:blank"},
    {"who": "grete", "face": "1", "text": "「對了，照顧小球的費用都是異生會出的，不用擔心！打工錢是給你自己用的。」"},
    {"who": "grete", "face": "0", "text": "「現在我們來看看水缸吧。」"},
    {"who": "grete", "face": "3", "text": "「……」"},
    {"who": "narr", "text": "牠縮在水缸最角落，背對著你。", "fx": "scr:tank,hl:tank"},
    {"who": "narr", "text": "你稍微靠近一點，牠就把身體縮得更小，像是想把自己藏進玻璃裡。", "fx": "hl:tank"},
    {"who": "grete", "face": "3", "text": "「……他在說『不要過來』。」\n\n「不是討厭你喔。只是他現在什麼都怕。」", "chr": "grete_L_3"},
    {"who": "grete", "face": "0", "text": "「慢慢來吧，給他一點時間。」"},
    {"who": "narr", "text": "在格蕾特去準備小球的晚餐時，你把異生會送來的藥品收到收納櫃。\n\n收納櫃裡還可以放衣服和道具……不過目前什麼都沒有。", "chr": "none", "fx": "scr:bag.wear,hl:tabs"},
    {"who": "narr", "text": "商店街有服裝店和道具店，之後有空再去逛逛吧。", "note": "v0.42 開店"},
    {"who": "narr", "text": "不過，每週還得付 200 元的生活費，買東西的時候記得留一點。", "fx": "contNl", "note": "v0.40.63 補：每週生活費 STORY_RULE.living"}
  ]},
  {"id": "M1-03", "kind": "main", "ch": 1, "trig": "weekEnd", "arg": "1", "note": "第一週末：言街來家裡檢查（見過／沒見過言街兩種開頭）；提到言巷、言默；開放 4F、5F", "title": "言街來訪","lines":[
    {"who": "narr", "text": "第一週過去，到了異生會考察的日子。你抓了差不多的時間來到門外，正好看見有人遠遠走來……", "bg": "home_out", "chl": "yanjie_R_0+acc", "fx": "walkL", "note": "可以有一些上下晃動，像是走路，可以在第一秒就早點入場但走路速度慢一點"},
    {"who": "cond", "text": "fav.yanjie>0", "go": "M1-03_0_1"},
    {"who": "cond", "text": "", "go": "M1-03_0_2"},
    {"tag": "M1-03_0_1", "who": "yanjie", "face": "4", "text": "「又見面了，{玩家名稱}……沒錯，我是這次異生會派來考察的人員喔。」", "go": "M1-03_0_3"},
    {"tag": "M1-03_0_2", "who": "yanjie", "face": "1", "text": "「你好，是{玩家名稱}嗎？」\n「我是異生會前來考察的人員，你可以叫我言街。」\n", "eff": "fav.yanjie+10", "note": "第一次見到言街＝認識 +10\n初次見面為隱藏數值，不顯示好感變動訊息"},
    {"tag": "M1-03_0_3", "who": "yanjie", "face": "0", "text": "「……啊、雖然說是考察，但其實只是因為這孩子情況特殊，要來確定他的健康數值。」", "fx": "contNl2"},
    {"who": "choice", "text": "我也很在意他的情況。", "go": "M1-03_1_1", "eff": "fav.yanjie+3"},
    {"who": "choice", "text": "請進。", "go": "M1-03_1_2"},
    {"tag": "M1-03_1_1", "who": "yanjie", "face": "0", "text": "「是啊，希望檢測出來沒問題……我們趕緊去看看吧。」", "go": "M1-03_1_3"},
    {"tag": "M1-03_1_2", "who": "yanjie", "face": "0", "text": "「謝謝。」"},
    {"tag": "M1-03_1_3", "who": "narr", "text": "你帶他進到屋內，走到水缸旁邊……｜小球依然瑟縮在某個角落，對於你們的到來，他雖然沒有四處逃竄，卻也不敢亂動。", "bg": "home_day", "chr": "larva:curl"},
    {"who": "narr", "text": "言街在水缸前蹲下，從包裡拿出一個僅有巴掌大的儀器，輕輕貼上玻璃，再接上一條細細管線小心地垂到水缸邊。\n\n儀器安靜地亮起燈，他一邊測量水質，一邊用手機查看儀器紀錄小球的狀況。", "fx": "crouch:L"},
    {"who": "yanjie", "face": "0", "text": "「生命狀況穩定不少……嗯？還是常常在角落窩著嗎？\n……那看來還需要一些時間讓他放下心來。」"},
    {"who": "narr", "text": "在檢測好數據後，他耐心的聽你描述這週的情況，手裡仔細的紀錄著。"},
    {"who": "yanjie", "face": "0", "text": "「原來如此……對了，那你有試著和他說說話嗎？」"},
    {"who": "choice", "text": "有", "go": "M1-03_2_1"},
    {"who": "choice", "text": "沒有", "go": "M1-03_2_2"},
    {"tag": "M1-03_2_1", "who": "yanjie", "face": "4", "text": "「那很好呢，可以多多說話，讓他慢慢習慣。」", "go": "M1-03_2_3"},
    {"tag": "M1-03_2_2", "who": "yanjie", "face": "0", "text": "「是嗎？或許可以試試看喔。」"},
    {"tag": "M1-03_2_3", "who": "yanjie", "face": "0", "text": "「雖然他還小，但依然能聽到聲音的……嗯，這部分是個謎呢。」\n「我的妹妹每次都會叨念著"},
    {"who": "yanjie", "face": "2", "text": "『這不合理，到底是從哪裡聽見的？』一邊和這些孩子們說話……」", "fx": "cont,sway"},
    {"who": "choice", "text": "妹妹？", "go": "M1-03_3_1"},
    {"who": "choice", "text": "我也很好奇。", "go": "M1-03_3_2"},
    {"tag": "M1-03_3_1", "who": "yanjie", "face": "1", "text": "「嗯，她叫言巷，雖然看起來脾氣不太好，但是實際上沒有惡意喔——」"},
    {"who": "yanjie", "face": "4", "text": "「啊，當哥哥的這樣說是不是不太公正。」", "fx": "contNl", "go": "M1-03_3_3"},
    {"tag": "M1-03_3_2", "who": "yanjie", "face": "1", "text": "「是吧？真是可愛又神秘的小生命。」"},
    {"tag": "M1-03_3_3", "who": "narr", "text": "他說話的語氣溫和而緩慢，彷彿恰好能吹起髮絲的微風。使人跟著放鬆下來。\n\n接著他又做了些簡單的測試，用某個印著異生會標誌的錄音裝置播放一些異種們熟悉的聲音——｜你聽不出那是什麼意思，只聽他說是成年異種們呼喚幼體吃飯或休息的頻率，類似於人類的對小孩子說話時所用的無意義音節或疊字……"},
    {"who": "narr", "text": "小球似乎有點反應，但片刻後還是縮了縮觸肢，沒有靠近。", "fx": "larvaSway"},
    {"who": "yanjie", "face": "1", "text": "「剛剛播放的是安撫的錄音……他有反應真是太好了，｜上週在醫療室時他只顧著害怕，什麼都聽不進去。」\n"},
    {"who": "narr", "text": "他放鬆地笑了笑，向你解釋著相關的資訊，｜但當你詢問是否能借用那段音檔時卻是搖了搖頭。"},
    {"who": "yanjie", "face": "3", "text": "「抱歉，這部分異生會的規定很嚴苛，這些檔案只能由特定裝置執行……而且使用也得申請。」\n\n「雖然在這個地方大家都習以為常了，但異種在外面……在其他的國家與城市，還是一個秘密，你當初也是有簽過保密條款的，不是嗎？」"},
    {"who": "narr", "text": "他說完後沉思了片刻，幾秒後才又看向你。"},
    {"who": "yanjie", "face": "0", "text": "「我想想有沒有其他的……對了，下週三或週六，言默小姐會去公園當義工，演唱歌曲。」"},
    {"who": "choice", "text": "她是誰？", "go": "M1-03_4_1"},
    {"who": "choice", "text": "為什麼這裡這麼多人姓言？", "go": "M1-03_4_2"},
    {"tag": "M1-03_4_1", "who": "yanjie", "face": "0", "text": "「是來異生會幫忙的義工，她每次結束巡迴演出都會抽空過來一趟。｜除此之外，言默小姐平時是一名歌劇演唱家，也有發行過專輯。」", "go": "M1-03_4_3"},
    {"tag": "M1-03_4_2", "who": "yanjie", "face": "4", "text": "「啊哈哈哈、確實，很有趣的巧合吧？感覺像是冥冥之中的安排？」\n"},
    {"tag": "M1-03_4_3", "who": "yanjie", "face": "1", "text": "「她對聲音的控制有些見解，之前也幫忙安撫過小球們，去聊聊的話，或許能問到一些訊息。」"},
    {"who": "narr", "text": "他將記錄著小球狀態的手機資料儲存並上傳，看了看時間。", "fx": "sway:L"},
    {"who": "yanjie", "text": "「那麼，第一週的考察到這裡就差不多了，不好意思佔用不少時間。｜下周會有其他人員前來。這孩子就再麻煩你多多照顧……」\n\n"},
    {"who": "narr", "text": "他取回儀器與管線，收進隨身的側背包，似乎還是帶著些許沒能借出檔案的歉意，輕聲說道："},
    {"who": "cond", "text": "fav0.yanjie>0", "go": "M1-03_6_1"},
    {"who": "cond", "text": "", "go": "M1-03_6_2"},
    {"tag": "M1-03_6_1", "who": "yanjie", "face": "1", "text": "「如果有什麼需要也可以去找我。活動中心你已經知道了，除此之外，我也常在異生會的五樓。」", "go": "M1-03_5_1", "note": "Claude 草稿：見過言街（之前在活動中心認識）的版本，請改"},
    {"tag": "M1-03_6_2", "who": "yanjie", "face": "1", "text": "「如果有什麼需要也可以去找我，我通常會在異生會的五樓或者市區的活動中心。」"},
    {"who": "choice", "text": "異生會的五樓？", "go": "M1-03_5_1"},
    {"who": "choice", "text": "市區的活動中心？", "go": "M1-03_5_2"},
    {"tag": "M1-03_5_1", "who": "yanjie", "face": "4", "text": "「我在那協助處理一些文書……｜其實就是幫我妹代班啦，她更喜歡在四樓的研究室工作。」", "go": "M1-03_5_3"},
    {"tag": "M1-03_5_2", "who": "yanjie", "face": "4", "text": "「嗯，我在那邊當志工，念些故事給小球們聽，你有空也可以去看看喔。」"},
    {"tag": "M1-03_5_3", "who": "cond", "text": "debt>=1", "go": "M1-03_debt"},
    {"who": "cond", "text": "", "go": "M1-03_debt_x"},
    {"tag": "M1-03_debt", "who": "yanjie", "face": "3", "text": "「還有……對了，帳本看起來有點吃緊呢。要是下週還是周轉不過來，下一位來考察的人，可能就得先把小球帶回異生會了。」\n「畢竟我們也得確保照顧者自己的狀況，照顧的了自己，才能照護這些孩子。」", "note": "負債第一週的提醒（11-07 使用者確認定稿）"},
    {"tag": "M1-03_debt_x", "who": "yanjie", "face": "0", "text": "「那麼，我先回去了，再見，{玩家名稱}。」"},
    {"who": "narr", "text": "他站起身，在你的目送下走了出去。", "bg": "home_out", "chr": "none", "chl": "yanjie_L_1+acc", "fx": "leaveL:L"},
    {"who": "cond", "text": "hp>=15", "go": "M1-03_7_1"},
    {"who": "cond", "text": "", "go": "M1-03_7_2"},
    {"tag": "M1-03_7_1", "who": "narr", "text": "【開啟新地點：異生會4F、異生會5F】\n【獲得資訊：言默的公園街頭表演】\n【完成主線03－第一次考察，考察人員好感度上升。】\n【小球的健康達標：好感度額外上升。】", "go": "end", "eff": "open.f4,open.f5,fav.yanjie+5", "note": "每週檢查：基本 +3，健康達標（週×15）再 +2。最後一行是 Claude 草稿"},
    {"tag": "M1-03_7_2", "who": "narr", "text": "【開啟新地點：異生會4F、異生會5F】\n【獲得資訊：言默的公園街頭表演】\n【完成主線03－第一次考察，考察人員好感度上升。】", "eff": "open.f4,open.f5,fav.yanjie+3", "note": "每週檢查：基本 +3"}
  ]},
  {"id": "M1-04", "kind": "main", "ch": 1, "trig": "weekEnd", "arg": "2", "note": "第2週末：賽倫絲來家裡考察（季節：初春；線索＝言巷在 4F）", "title": "賽倫絲來訪","lines":[
    {"who": "narr", "text": "第二週的最後一天。初春的午後還帶著一點涼意，陽光斜斜地照進客廳，把水缸的影子拉得很長。", "bg": "home_day", "note": "季節：第一章＝剛入春（2026-11-02 定）"},
    {"who": "narr", "text": "當門鈴響起的時候，比約好的時間還早了十分鐘。", "bg": "home_out", "chl": "silence_R_0+acc", "fx": "runL", "note": "在大樓外＝戴耳骨夾"},
    {"who": "silence", "face": "4", "text": "「午安～我是這週來考察的賽倫絲！」"},
    {"who": "narr", "text": "她的瀏海被風吹得有點亂，看起來是一路跑過來的，手上則是拎著印有異生會LOGO的帆布袋。"},
    {"who": "choice", "text": "妳是跑過來的？", "go": "M1-04_1_1", "eff": "fav.silence+2"},
    {"who": "choice", "text": "請進。", "go": "M1-04_1_2"},
    {"tag": "M1-04_1_1", "who": "silence", "face": "1", "text": "「被發現了？要轉車的時候發現公車剛好開走……我想說跑兩站比等下一班快啦！」"},
    {"who": "silence", "face": "4", "text": "「以前常被田徑隊抓去湊人數，跑步還算拿手呢。」", "fx": "contNl", "go": "M1-04_1_3"},
    {"tag": "M1-04_1_2", "who": "silence", "face": "0", "text": "「打擾了！」"},
    {"tag": "M1-04_1_3", "who": "narr", "text": "她在玄關停了一下，把鞋子併好，才跟著你走進客廳。", "bg": "home_day"},
    {"who": "narr", "text": "剛遠遠的看到房裡的水缸，她便已經放輕腳步，連說話的聲音都跟著壓低。"},
    {"who": "silence", "face": "0", "text": "「他就是 UM-{num} 呀……」\n「比資料上的照片看起來好多了呢。」", "chr": "larva:curl"},
    {"who": "narr", "text": "你跟著看了過去，只見小球縮在角落……不過比起上週，牠的位置好像往外挪了一點點？\n也可能只是你的錯覺。"},
    {"who": "narr", "text": "她從帆布袋裡拿出和上週言街手裡一樣的小儀器，又拿出一張折了好幾折的紙攤開。上面是手寫的步驟，字跡工整得像印出來的，只有角落畫上的童趣插圖讓你感受到這確實是手工製作的東西。"},
    {"who": "silence", "face": "4", "text": "「我自己做的筆記，不錯吧？」\n「這是我第一次一個人來考察，有點緊張，所以先去問了言街先生。」"},
    {"who": "narr", "text": "她說緊張，手上的動作卻很穩。貼上儀器、垂下管線，每做一步就對著紙確認一次。", "fx": "crouch:L", "note": "賽倫絲在左格、小球在右格（和 M1-03 一樣）；旁白的演出右邊是小球時給左邊＝賽倫絲"},
    {"who": "narr", "text": "儀器亮起淡藍色的光，映在玻璃上。小球本能的往角落又縮了縮。\n\n而賽倫絲並未急著讓儀器開始檢測，只是繼續蹲在那裡……", "note": "她很會照顧怕生的孩子（弟弟們），這裡不說原因"},
    {"who": "narr", "text": "十秒、二十秒……"},
    {"who": "narr", "text": "過了好一會兒，小球像是確認了什麼，蜷著的觸肢慢慢鬆開了一點。\n雖然並未靠近，但似乎沒那麼害怕了。", "fx": "larvaSway"},
    {"who": "silence", "face": "1", "text": "「乖孩子，好勇敢呢。」"},
    {"who": "cond", "text": "hp>=30", "go": "M1-04_2_1"},
    {"who": "cond", "text": "", "go": "M1-04_2_2"},
    {"tag": "M1-04_2_1", "who": "silence", "face": "4", "text": "「數值比上週高很多耶！傷口那邊的反應也穩定下來了。」", "go": "M1-04_2_3"},
    {"tag": "M1-04_2_2", "who": "silence", "face": "0", "text": "「比上週好一點點。換藥是急不來的，慢慢來就好。」"},
    {"tag": "M1-04_2_3", "who": "narr", "text": "她看起來鬆了一口氣，俏皮地對你做了個小小的「加油」手勢後，從水缸邊悄悄退開。"},
    {"who": "silence", "face": "0", "text": "「那，可以跟我說說這週的事嗎？他吃得怎麼樣、睡得好不好……什麼都可以。」"},
    {"who": "narr", "text": "她一邊用手機記錄，一邊偶爾抬頭看你。你說到卡住的地方，她總會先一步接上你想說的話。\n等你回過神來，連自己這週睡了多久的事都說出來了。", "note": "情商高、會揣測別人的想法"},
    {"who": "silence", "face": "0", "text": "「要睡飽喔，照顧的人要是倒下了，被照顧的那個會比誰都慌喔。」", "note": "第二章「弟弟們」的伏筆：說得太有感觸，馬上用玩笑帶過"},
    {"who": "silence", "face": "4", "text": "「……這是我打工學到的！」", "fx": "contNl"},
    {"who": "narr", "text": "說完，她整理了一下手邊的步驟紀錄——"},
    {"who": "cond", "text": "debt>=1", "go": "M1-04_debt"},
    {"who": "cond", "text": "", "go": "M1-04_debt_x"},
    {"tag": "M1-04_debt", "who": "silence", "face": "0", "text": "「我看看……你目前可動用的資金好像是負的？下週之前要想辦法平衡喔，不然異生會可能會把小球接回去。」", "note": "負債第一週的提醒（11-07 使用者確認定稿）"},
    {"who": "silence", "face": "3", "text": "「之前有些人光顧著小球，結果自己的收入無法平衡，反而把自己的健康賠掉了……那樣很危險的！照顧人的人也要對自己好點才行。」\n", "fx": "contNl"},
    {"tag": "M1-04_debt_x", "who": "silence", "face": "0", "text": "「對了，下週來考察的是言巷小姐。」", "note": "稱呼：賽倫絲叫「言街先生」「言巷小姐」"},
    {"who": "cond", "text": "fav0.yanxiang>0", "go": "M1-04_3_1"},
    {"who": "cond", "text": "", "go": "M1-04_3_2"},
    {"tag": "M1-04_3_1", "who": "silence", "face": "1", "text": "「你在 4F 見過她了吧？那我就不用多說了～」", "go": "M1-04_3_3"},
    {"tag": "M1-04_3_2", "who": "silence", "face": "0", "text": "「她是研究中心的人，很厲害，就是說話比較……直接。」"},
    {"who": "silence", "face": "3", "text": "「如果她說了什麼讓你不舒服的話，別放在心上。她不是針對你，對誰都那樣。」"},
    {"who": "silence", "face": "0", "text": "「她平常待在 4F。對異種懂得夠多的話，說不定還能去幫忙喔。」\n「道具店有在賣入門書，可以參考看看～」", "note": "線索：知識 ≥25 才能留在 4F"},
    {"who": "narr", "text": "……"},
    {"tag": "M1-04_3_3", "who": "narr", "text": "考察結束的時候，窗外的光已經偏橘了。"},
    {"who": "silence", "face": "5", "text": "「啊，這個時間——｜抱歉，我得先走了！要去接人～」", "note": "接人＝弟弟，留給商店街那段，這裡不說"},
    {"who": "narr", "text": "她在玄關穿鞋時，還不忘回頭朝水缸揮了揮手。門關上之後，腳步聲很快就跑遠了。", "bg": "home_out", "chr": "none", "chl": "silence_L_0+acc", "fx": "leaveL:L"},
    {"who": "cond", "text": "hp>=30", "go": "M1-04_9_1"},
    {"who": "cond", "text": "", "go": "M1-04_9_2"},
    {"tag": "M1-04_9_1", "who": "narr", "text": "【完成主線04－第二次考察，考察人員好感度上升。】\n【小球的健康達標：好感度額外上升。】", "go": "end", "eff": "fav.silence+5", "note": "每週檢查：基本 +3，健康達標（週×15）再 +2"},
    {"tag": "M1-04_9_2", "who": "narr", "text": "【完成主線04－第二次考察，考察人員好感度上升。】", "eff": "fav.silence+3", "note": "每週檢查：基本 +3"}
  ]},
  {"id": "M1-05", "kind": "main", "ch": 1, "trig": "weekEnd", "arg": "3", "note": "第3週末：言巷來家裡考察（見過／沒見過兩種開頭；她就是動手術的「上面那位」；線索＝下週瓊做月底評估）", "title": "言巷來訪","lines":[
    {"who": "narr", "text": "第三週的週末。初春的天氣說變就變，早上還有太陽，過了中午就陰了下來，客廳裡的光變得灰白。", "bg": "home_day", "note": "季節：初春；這週是陰天（言巷的冷）"},
    {"who": "narr", "text": "約好的時間一到，門鈴就響了——一秒不差。", "note": "對比：賽倫絲早到十分鐘"},
    {"who": "narr", "text": "門外站著一個個子不高的女人，頭髮大半是白的，左右兩隻眼睛的顏色不一樣。她手上提著一只銀色的保冷箱。", "bg": "home_out", "chl": "yanxiang_R_0", "note": "言巷在研究室外不戴眼鏡"},
    {"who": "cond", "text": "fav0.yanxiang>0", "go": "M1-05_0_1"},
    {"who": "cond", "text": "", "go": "M1-05_0_2"},
    {"tag": "M1-05_0_1", "who": "narr", "text": "是之前在 4F 見過的人。", "note": "見過：她不會特別提 4F 的事"},
    {"who": "yanxiang", "face": "0", "text": "「考察。」", "go": "M1-05_0_3"},
    {"tag": "M1-05_0_2", "who": "yanxiang", "face": "0", "text": "「言巷，研究中心。這週的考察是我。」", "eff": "fav.yanxiang+10", "note": "第一次見到言巷＝認識 +10（不浮提示）"},
    {"tag": "M1-05_0_3", "who": "narr", "text": "她把鞋子踢在玄關，其中一隻翻了過去，她也沒回頭看。", "note": "對比：賽倫絲把鞋子併好"},
    {"who": "narr", "text": "你帶著她走到水缸邊查看小球的情況。", "bg": "home_day", "chr": "larva:curl"},
    {"who": "cond", "text": "calm>=0", "go": "M1-05_1_1"},
    {"who": "cond", "text": "", "go": "M1-05_1_2"},
    {"tag": "M1-05_1_1", "who": "narr", "text": "小球朝你這邊的玻璃游近了一點……｜然後牠看見了你身後的人，又一溜煙縮回角落。", "fx": "larvaSway@2", "go": "M1-05_1_3", "note": "不怕玩家了，但還怕言巷"},
    {"tag": "M1-05_1_2", "who": "narr", "text": "小球照樣縮在角落。你身後的人一靠近，牠縮得更小了。", "fx": "larvaSway"},
    {"tag": "M1-05_1_3", "who": "yanxiang", "face": "4", "text": "「呦，還記得我？」"},
    {"who": "choice", "text": "他認識妳？", "go": "M1-05_2_1"},
    {"who": "choice", "text": "妳別嚇他。", "go": "M1-05_2_2"},
    {"tag": "M1-05_2_1", "who": "yanxiang", "face": "0", "text": "「一個半月前，這隻幼體被送到醫療室的時候，身上卡著東西。喏，就是左側表皮裂開的那一塊。」", "note": "M1-01「上面那位」＝言巷（外科、機械輔助）"},
    {"who": "yanxiang", "face": "0", "text": "「正好我在，就用 RAS……嗯？就是手術輔助機器，處理掉了。」", "note": "RAS＝機器手臂輔助手術"},
    {"who": "narr", "text": "她說著，伸手敲了敲水缸的玻璃。力道很輕，小球還是縮了一下。", "fx": "larvaSway"},
    {"who": "yanxiang", "face": "1", "text": "「呵，記仇。」", "go": "M1-05_2_3"},
    {"tag": "M1-05_2_2", "who": "narr", "text": "她聳聳肩，沒有回答。"},
    {"tag": "M1-05_2_3", "who": "narr", "text": "她把儀器貼上玻璃、接好管線，然後退開兩步，雙手抱胸，等數據跑完。", "fx": "squat:L"},
    {"who": "yanxiang", "face": "0", "text": "「一直躲著不是辦法。多接觸，他才會習慣。」", "note": "她主張脫敏、多接觸（效率派）；對比賽倫絲蹲下來等"},
    {"who": "cond", "text": "hp>=45", "go": "M1-05_3_1"},
    {"who": "cond", "text": "", "go": "M1-05_3_2"},
    {"tag": "M1-05_3_1", "who": "yanxiang", "face": "0", "text": "「癒合速度在預期範圍內。……偏上。」", "go": "M1-05_3_3"},
    {"tag": "M1-05_3_2", "who": "yanxiang", "face": "0", "text": "「比預期慢。還在可以處理的範圍。」"},
    {"tag": "M1-05_3_3", "who": "yanxiang", "face": "0", "text": "「接下來麻煩提供這週的紀錄……沒紀錄？行，你回想一下。」"},
    {"who": "narr", "text": "她問得很精確：每次換藥是幾點、換完多久恢復活動、海草湯剩下多少……像在填一張只有她看得懂的表格。"},
    {"who": "narr", "text": "有一半的問題你答不上來，餵食一直是格蕾特在弄的。"},
    {"who": "yanxiang", "face": "0", "text": "「格蕾特？\n……喔，那個異種，那你叫她做點紀錄。」"},
    {"who": "cond", "text": "debt>=1", "go": "M1-05_debt"},
    {"who": "cond", "text": "", "go": "M1-05_debt_x"},
    {"tag": "M1-05_debt", "who": "yanxiang", "face": "0", "text": "「然後……目前你的帳戶是負的。若下週結算時還是負的，就由我們接回去。」", "note": "負債第一週的提醒（11-07 使用者確認定稿）"},
    {"tag": "M1-05_debt_x", "who": "narr", "text": "數據跑完了。她看了一眼螢幕，從保冷箱裡拿出兩瓶藥水，放在桌上。"},
    {"who": "yanxiang", "face": "0", "text": "「你手邊的藥還沒用完吧？換成這款，檢驗已經通過了，刺激性比較低。」"},
    {"who": "choice", "text": "謝謝。", "go": "M1-05_4_1"},
    {"who": "choice", "text": "是妳調的？", "go": "M1-05_4_2", "eff": "fav.yanxiang+2"},
    {"tag": "M1-05_4_1", "who": "yanxiang", "face": "0", "text": "「不用。」", "go": "M1-05_4_3"},
    {"tag": "M1-05_4_2", "who": "yanxiang", "face": "1", "text": "「不是。我不擅長生物科技，是研究部的傢伙改的配方……他們的技術你可以放心。」", "note": "言巷懂機械、輔助裝備、外科；生物科技、藥物、內服一塌糊塗（老實的一面）"},
    {"tag": "M1-05_4_3", "who": "yanxiang", "face": "0", "text": "「下週是瓊，她會順便進行月底的總評估，通過後……」", "note": "線索：下週＝月底評估（瓊決定）"},
    {"who": "narr", "text": "她頓了頓，看了眼手機裡的時間，便俐落地結束話題，收拾儀器。", "fx": "squat:L"},
    {"who": "yanxiang", "face": "0", "text": "「通過後的事項她會講。行了，我先回去了。」"},
    {"who": "narr", "text": "說完，她就往玄關走，你連送都來不及。"},
    {"who": "narr", "text": "門關上之前，她停了一下，回頭看了水缸一眼，什麼也沒說。", "bg": "home_out", "chr": "none", "fx": "leaveL:L"},
    {"who": "cond", "text": "hp>=45", "go": "M1-05_9_1"},
    {"who": "cond", "text": "", "go": "M1-05_9_2"},
    {"tag": "M1-05_9_1", "who": "narr", "text": "【完成主線05－第三次考察，考察人員好感度上升。】\n【小球的健康達標：好感度額外上升。】", "go": "end", "eff": "fav.yanxiang+5", "note": "每週檢查：基本 +3，健康達標（週×15）再 +2"},
    {"tag": "M1-05_9_2", "who": "narr", "text": "【完成主線05－第三次考察，考察人員好感度上升。】", "eff": "fav.yanxiang+3", "note": "每週檢查：基本 +3"}
  ]},
  {"id": "M1-06", "kind": "main", "ch": 1, "trig": "weekEnd", "arg": "4", "note": "第4週末：瓊來家裡考察＋月底評估（健康 ≥50 通過；不到＝瓊當場把小球帶回異生會，遊戲結束）", "title": "瓊來訪","lines":[
    {"who": "narr", "text": "第四週的週末。這幾天回暖了，你把窗戶開了一條縫，風裡有一點青草的味道。", "bg": "home_day", "note": "季節：初春，回暖"},
    {"who": "narr", "text": "約好的時間快到時，門外傳來急促的腳步聲。", "note": "對比：賽倫絲早到、言巷精算到一秒不差、瓊是趕上準時"},
    {"who": "joan", "face": "5", "text": "「抱、抱歉！我在巷口繞錯了一圈……呼……好險，剛好……」", "bg": "home_out", "chl": "joan_R_5+acc", "fx": "runL", "note": "瓊把這次當成工作，所以在大樓外也戴工作證"},
    {"who": "narr", "text": "她喘著氣，把滑到鼻尖的眼鏡推回去。\n即便是家庭訪問，她依然穿著套裝、胸前掛著異生會的工作證。懷裡的夾板上夾滿了表格紙，以及一些明顯雜亂的字跡。\n而肩上的側背包……與前兩次同樣印著異生會的圖標。"},
    {"who": "joan", "face": "0", "text": "「那麼正式說明一下，這次的考察還有月底的總評估由我負責……啊，不過我可不會放水喔。」", "note": "日常模式已經見過，不自我介紹"},
    {"who": "narr", "text": "於是，你帶她走到水缸邊。", "bg": "home_day", "chr": "larva:curl"},
    {"who": "cond", "text": "calm>=25", "go": "M1-06_1_1"},
    {"who": "cond", "text": "", "go": "M1-06_1_2"},
    {"tag": "M1-06_1_1", "who": "narr", "text": "小球正貼在離你最近的那片玻璃上。看到你來了，牠沒有躲，只是看到瓊的時候稍微往後退了一點點。", "chr": "larva:idle_a", "fx": "larvaSway"},
    {"who": "joan", "face": "1", "text": "「啊……他會主動靠近你了耶。」", "go": "M1-06_1_3"},
    {"tag": "M1-06_1_2", "who": "narr", "text": "小球待在水缸的一側，安安靜靜的。比起一個月前，牠已經不會一看到人就縮進角落了。"},
    {"who": "joan", "face": "0", "text": "「嗯……還在適應期呢。這很正常的。」"},
    {"tag": "M1-06_1_3", "who": "narr", "text": "她蹲下來接儀器，沒想到袋子一打開便看見管線纏在一起，她不禁倒抽一口氣。", "fx": "crouch:L"},
    {"who": "joan", "face": "5", "text": "「嚇……這東西又不是耳機線，怎麼能纏成這樣？」"},
    {"who": "narr", "text": "即便她語氣慌張，但手裡倒是迅速地將管線解開。\n在她忙碌時，你瞧見那夾著文件的夾板上別著一個小小的壓克力吊飾，隨著她的動作晃來晃去……｜似乎是最近挺熱門的遊戲角色。", "note": "慌在嘴上、手很穩（扛壓）；吊飾＝宅宅的一面〔一〕，只露細節"},
    {"who": "narr", "text": "片刻後，她終於把儀器處理好，放著讓它跑，而後轉身看向你。"},
    {"who": "joan", "face": "0", "text": "「那我照表格問囉。」"},
    {"who": "narr", "text": "她一題一題地問，換藥的日子、小球的作息、你自己的狀況……問得很照本宣科，但每一題的答案她都仔細寫了下來，連你隨口提的小事也記了。"},
    {"who": "narr", "text": "在確認完畢後，儀器正好發出一聲輕響——數據跑完了。\n瓊挺直了背脊，小心翼翼的湊過去看螢幕上的數字，夾板邊緣被她握得有點緊。"},
    {"who": "cond", "text": "hp>=50", "go": "M1-06_pass", "note": "月底評估：健康低標 50（瓊決定）"},
    {"who": "cond", "text": "", "go": "M1-06_fail"},
    {"tag": "M1-06_pass", "who": "joan", "face": "4", "text": "「……過、過了！」", "fx": "hop"},
    {"who": "joan", "face": "1", "text": "「恭喜你，這一個月辛苦了。」", "fx": "contNl"},
    {"who": "cond", "text": "hp>=70", "go": "M1-06_2_1"},
    {"who": "cond", "text": "", "go": "M1-06_2_2"},
    {"tag": "M1-06_2_1", "who": "joan", "face": "1", "text": "「而且，數值比恢復的標準還高一截呢，言巷小姐看到應該也會點頭吧。」"},
    {"tag": "M1-06_2_2", "who": "narr", "text": "她笑著將夾板上的文件翻到最後一頁，閱讀了一下後認真地念了起來。"},
    {"who": "joan", "face": "0", "text": "「那，接下來的安排……之後改成兩週來訪一次。等確認他心理上的狀況穩定下來，異生會才會開始安排後續的事。」", "note": "第二章：兩週訪問一次"},
    {"who": "joan", "face": "0", "text": "「例如……幫他找一個能穩定照顧他的家人之類的，在這段期間就在麻煩你繼續照顧他。」"},
    {"who": "narr", "text": "家人……說到這裡你這才想起來，你現在的身分還只是「緊急照顧者」。\n瓊在那些紙本上記錄著，並未看到你的表情的變化。"},
    {"who": "narr", "text": "在把後續的薪水等事宜也確認好後，她開始收拾檢測儀器。\n那些雜亂的管線被她小心摺疊好，甚至綁了綁帶收進袋子裡，隨後揹起袋子走到玄關——卻又像是想起什麼般回過頭來。", "note": "對比：開頭纏成一團的管線"},
    {"who": "joan", "face": "0", "text": "「對了，所以你會想繼續……」", "note": "本來想問會不會想繼續帶著小球，但此刻還太早"},
    {"who": "joan", "face": "1", "text": "「……不，現在還太早了，以後的事情我們以後再說吧！」", "fx": "contNl2"},
    {"who": "joan", "face": "0", "text": "「那我先回去了。」"},
    {"who": "narr", "text": "門關上之後，你還在想她剛剛沒說完的那句話。", "fx": "leaveL:L"},
    {"who": "cond", "text": "hp>=60", "go": "M1-06_9_1"},
    {"who": "cond", "text": "", "go": "M1-06_9_2"},
    {"tag": "M1-06_9_1", "who": "narr", "text": "【完成主線06－第四次考察與月底評估，考察人員好感度上升。】\n【小球的健康達標：好感度額外上升。】", "go": "end", "eff": "fav.joan+5", "note": "每週檢查：基本 +3，健康達標（週×15）再 +2；之後接章末（玩家的自言自語）"},
    {"tag": "M1-06_9_2", "who": "narr", "text": "【完成主線06－第四次考察與月底評估，考察人員好感度上升。】", "go": "end", "eff": "fav.joan+3", "note": "每週檢查：基本 +3"},
    {"tag": "M1-06_fail", "who": "narr", "text": "瓊沉默了很久。\n然後她深深吸了一口氣，抬起頭來，看著你。", "note": "沒通過：健康 <50"},
    {"who": "joan", "face": "3", "text": "「……抱歉，但依照規定，異生會得以小球的狀態優先。」", "note": "扛得住壓力、不被人情影響重大工作"},
    {"who": "narr", "text": "她沒有移開視線。"},
    {"who": "narr", "text": "瓊很有禮貌地向你說明了規定，用手機聯絡了異生會。\n「有時候……或許只是水土不服。帶回去以後，會再安排別人照顧他的。」她這樣安慰你，聲音比剛才還要小，卻沒有任何轉圜的猶豫。", "bg": "black", "chr": "none", "chl": "none", "note": "旁白裡引用別人的話照樣用「」"},
    {"who": "narr", "text": "不久之後，異生會的車到了。幾名員工走進來，小心地把小球移進移動式水缸，蓋上一塊布。\n布蓋下去之前，牠還縮在角落。"},
    {"who": "narr", "text": "車子開走了。", "go": "end", "eff": "gameOver", "note": "效果「遊戲結束」：播完黑畫面、只能讀取或離開（和 M1-08 負債一樣）；不播章末"}
  ]},
  {"id": "M1-07", "kind": "main", "ch": 1, "trig": "chapterEnd", "arg": "", "note": "第二章開始前的暫時結局", "title": "月底評估","lines":[
    {"who": "narr", "text": "瓊離開後，一個月的評估期也宣布結束，小球並未被送回異生會，而是繼續由你照顧。\n當你把這個消息告訴格蕾特時，她高興的跳了跳，去拿點心給小球加餐了。\n\n而你回想了一下這個月……", "bg": "home_night"},
    {"who": "cond", "text": "hp>=70,calm>=25", "go": "M1-07_1_1"},
    {"who": "cond", "text": "hp>=70", "go": "M1-07_1_2"},
    {"who": "cond", "text": "calm>=25", "go": "M1-07_1_3"},
    {"who": "cond", "text": "", "go": "M1-07_1_4"},
    {"tag": "M1-07_1_1", "who": "narr", "text": "這些日子裡，在你的陪伴下，小球不僅恢復了不少，還會主動游到玻璃邊靠近你。", "bg": "home_night", "fx": "contNl", "go": "M1-07_1_5"},
    {"tag": "M1-07_1_2", "who": "narr", "text": "這些日子裡，在你的照顧下，小球雖然還是和你保持著一點距離，但好歹狀態恢復了不少。", "bg": "home_night", "fx": "contNl", "go": "M1-07_1_5"},
    {"tag": "M1-07_1_3", "who": "narr", "text": "這些日子裡，在你的關心中，雖然小球還有些虛弱，不過已經不太怕你了。", "bg": "home_night", "fx": "contNl", "go": "M1-07_1_5"},
    {"tag": "M1-07_1_4", "who": "narr", "text": "這些日子裡，在你的努力下，雖然小球還很虛弱，也還是會躲著人，但至少撐過來了。", "bg": "home_night", "fx": "contNl", "go": "M1-07_1_5"},
    {"tag": "M1-07_1_5", "who": "narr", "text": "以後的日子，會更好的吧？\n你如此想著。", "bg": "home_night"},
    {"who": "grete", "face": "1", "text": "「安安！{玩家名字}」", "bg": "black", "chr": "grete_L_0", "fx": "helperIn:100%", "note": "從這裡可跳過"},
    {"who": "grete", "face": "6", "text": "「我發現一封不知道是誰給你的字條，讓我來念一下吧！——\n\n"},
    {"who": "narr", "text": "恭喜你來到第一章的臨時結局！接下來你可以進行中繼存檔，等第二章更新時，可以直接用中繼存檔繼續遊戲。\n\n中繼存檔與一般存檔會分開，如果你在第二章開始前讀取中繼存檔，就會開啟自由模式！\n\n由於目前還在第一章，自由模式中的數值——例如你的能力，小球的能力，與NPC的好感度都不會變動，只是一個單純供你看看事件，賺錢，買東西的模式。"},
    {"who": "narr", "text": "不過要注意的是，同樣因為還在第一章，自由模式賺的錢等第二章開放後就會恢復預設狀態喔。\n\n至於買東西的部分……我、我會慢慢更新的。QQ\n\n以上"},
    {"who": "grete", "face": "0", "text": "……大概就寫了這些東西。」\n"},
    {"who": "grete", "face": "4", "text": "「既然字條訊息已經帶到了，那麼，我先走啦！掰掰～」", "fx": "helperOut", "note": "進入結局中繼存檔，與負債結局的作法相似，但給予的選擇是儲存中繼結局和離開\n\n而後在所有的讀取功能都會增加讀取中繼結局的選擇（自由模式的部分）"}
  ]},
  {"id": "M1-08", "kind": "main", "ch": 1, "trig": "gameOver", "arg": "debt", "note": "遊戲結束：連續兩週結算時錢是負的（不跑考察，播完黑畫面、只能讀檔或離開；不存檔）", "title": "負債","lines":[
    {"who": "narr", "text": "這一週，你幾乎都在為了生活費奔波，連好好看看小球的時間都沒有。", "bg": "home_day"},
    {"who": "narr", "text": "來考察的人看過紀錄以後，沒有多說什麼，小心地把水缸裡的小球接了過去。"},
    {"who": "narr", "text": "小球被交還給異生會了。", "bg": "black"}
  ]},
  {"id": "B09-01", "kind": "side", "ch": 1, "trig": "stat", "arg": "hp>=20", "note": "健康 ≥20：傷口結痂", "title": "慢慢恢復","lines":[
    {"who": "narr", "text": "換藥的時候，你發現小球身上的傷口結了一層薄薄的痂。", "bg": "place_tank", "fx": "larvaIn", "note": "傷疤圖開始變淡（畫法待定）"},
    {"who": "grete", "face": "1", "text": "「結痂了！這是在變好的意思喔！」", "chr": "grete_L_1"}
  ]},
  {"id": "B09-02", "kind": "side", "ch": 1, "trig": "stat", "arg": "hp>=40", "note": "健康 ≥40：第一次自己游一小段", "title": "自己游動","lines":[
    {"who": "narr", "text": "今天早上，小球第一次離開了角落。", "bg": "place_tank", "fx": "larvaIn"},
    {"who": "narr", "text": "牠沿著玻璃慢慢游了一小段，又慌慌張張地回到原來的位置。", "fx": "contNl,hop:L"},
    {"who": "player", "face": "joy", "text": "「格蕾特！他剛剛動了！」"},
    {"who": "grete", "face": "4", "text": "「看到了看到了！」", "chr": "grete_L_4"}
  ]},
  {"id": "B09-03", "kind": "side", "ch": 1, "trig": "stat", "arg": "calm>=0", "note": "安心 ≥0：玩家靠近時第一次沒有躲", "title": "熟悉","lines":[
    {"who": "narr", "text": "你走到水缸前。小球退縮了些，似乎有些猶豫的樣子……但最終並沒有如往常那樣躲開。", "bg": "place_tank", "fx": "larvaIn"},
    {"who": "narr", "text": "牠待在原地，用一種能感覺出很小心的方式看著你。\n", "fx": "contNl"},
    {"who": "grete", "face": "1", "text": "「他在說……『是你啊』。」", "chr": "grete_L_1"}
  ]},
  {"id": "B09-04", "kind": "side", "ch": 1, "trig": "stat", "arg": "calm>=25", "note": "安心 ≥25：第一次主動靠近玻璃", "title": "他說了什麼","lines":[
    {"who": "narr", "text": "你坐在桌前寫東西的時候，聽到玻璃輕輕「咚」了一聲。", "bg": "home_night"},
    {"who": "narr", "text": "回頭一看，小球貼在離你最近的那片玻璃上，似乎好奇你在做什麼。", "bg": "place_tank", "fx": "larvaIn"},
    {"who": "narr", "text": "當你開口和他打招呼，他似乎愣了下，小小的觸肢在玻璃上拍了拍後慌慌張張地游開了。", "fx": "larvaSway,contNl"},
    {"who": "grete", "face": "4", "text": "「他在說——", "chr": "grete_L_4", "fx": "larvaOut"},
    {"who": "grete", "face": "1", "text": "……嘿嘿，這個先保密。」", "fx": "contNl"}
  ]},
  {"id": "B09-05", "kind": "side", "ch": 1, "trig": "stat", "arg": "hp>=30", "note": "自家小球：健康 ≥30 新的皮（格蕾特：和人類一樣會癒合，但不是同一塊皮）", "title": "新的皮","lines":[
    {"who": "narr", "text": "換藥的時候，你注意到傷口邊緣多了一層薄薄的、透明的東西。燈光照下去，看得見細細的紋路。", "bg": "place_tank", "fx": "larvaIn"},
    {"who": "grete", "face": "1", "text": "「是新的皮喔！」", "chr": "grete_L_0"},
    {"who": "grete", "face": "0", "text": "「而且他年紀還小，等之後傷口好了，可以幾乎看不出來喔。」", "note": "格蕾特的觀念：異種和人類很像，大家都是普通生物"},
    {"who": "player", "text": "「異種也會這樣？」"},
    {"who": "grete", "face": "4", "text": "「會呀，我們跟人類有很多共同點呢。」"}
  ]},
  {"id": "B09-06", "kind": "side", "ch": 1, "trig": "stat", "arg": "hp>=45", "note": "自家小球：格蕾特與銀河（異種的孩子離開時化成水中的銀河；只講異種，不說是她的孩子）", "title": "銀河","lines":[
    {"who": "narr", "text": "夜裡，房間只開著水缸的燈。｜格蕾特抱著膝蓋坐在水缸前，看小球慢慢隨著濾水器的水流漂浮。\n\n幾條觸肢從她的裙襬延伸出來，在水缸邊輕拍，彷彿正在傳達某種古老的節奏。\n\n見你走來，她才慢慢起身。", "bg": "place_tank", "chr": "grete_L_0", "fx": "larvaIn,larvaSway@2", "note": "健康 40 已有 B09-02（第一次游），所以放 45"},
    {"who": "grete", "face": "1", "text": "「他今天游得比昨天遠一點點耶。」"},
    {"who": "narr", "text": "她愉快地和你分享，橘色的瞳孔在燈光下反射著白色燈管的光影，那過於亮麗的色彩讓人說不出該算是異常又或者是迷人。\n"},
    {"who": "narr", "text": "你循著她的觸肢看向水缸，水面的光映在牆面與天花板上，輕輕晃著，像一小片星空。\n"},
    {"who": "cond", "text": "calm>=0", "go": "B09-06_1"},
    {"who": "cond", "text": "", "go": "B09-06_2"},
    {"tag": "B09-06_1", "who": "narr", "text": "小球注意到你們兩個都在，卻沒有像以往那樣逃跑……他依然隨著水流漂浮著，自在了很多。", "fx": "contNl2", "go": "B09-06_3"},
    {"tag": "B09-06_2", "who": "narr", "text": "小球注意到你們兩個都在，警戒的縮回了水缸的石頭與水草間，悄悄的注意著你們。", "fx": "contNl2,larvaSway"},
    {"tag": "B09-06_3", "who": "narr", "text": "格蕾特看著小球這模樣，不禁勾起嘴角。\n她的目光追隨著那小小的、比剛來的時候稍微結實的身影，突然開口說道：\n"},
    {"who": "grete", "face": "0", "text": "「{name}，你知道嗎？異種的孩子，很多都長不大喔。」", "note": "格蕾特自己的孩子〔二〕，這裡不說"},
    {"who": "narr", "text": "她的聲音很沉靜，若說平常像是下雨時湖面滴滴答答的水聲，｜現在則像是沉入湖底時，耳裡能聽到似有似無的、低頻的嗡嗡聲。\n\n這顯然是個你沒想過會聽見的話題，卻又下意識覺得莫名適合今天的夜。\n而她注意到你的視線，揚起了一抹輕輕的微笑。"},
    {"who": "grete", "face": "1", "text": "「但這也沒辦法，因為我們活得很～久很久。」\n「所以，一次只能有一點點的孩子活在世界上，這樣大家才住得下。」"},
    {"who": "grete", "face": "0", "text": "「而且，很美的喔……孩子離開的時候，會自己散開。像亮粉撒在水裡，一閃一閃的……變成一條摸得到的銀河。」"},
    {"who": "grete", "face": "0", "text": "「那一幕是留給照顧他的人的。身體的營養呢，就留給還在水缸裡的兄弟姊妹……啊，長大的異種離開的時候，也是這樣的。」"},
    {"who": "narr", "text": "你突然想起言曉君說過的「消逝後殘留的痕跡」。\n\n這顆小球被找到時，周邊有檢測出……\n", "note": "呼應 M1-01"},
    {"who": "narr", "text": "格蕾特看見你在沉思，便把視線轉回水缸，她的觸肢依然輕輕貼在玻璃上，對著小球的位置。\n沉默片刻後，她輕輕地吸了一口氣。", "fx": "larvaSway"},
    {"who": "grete", "face": "0", "text": "「我們都覺得那是很溫柔的事。所以{name}，不要因此悲傷喔。而且……」"},
    {"who": "grete", "face": "4", "text": "「這孩子看起來並不想這麼早就變成銀河呢。」"},
    {"who": "narr", "text": "那天晚上，她比平常安靜了一點。", "chr": "none", "fx": "larvaOut"}
  ]},
  {"id": "B09-07", "kind": "side", "ch": 1, "trig": "stat", "arg": "hp>=60", "note": "自家小球：健康 ≥60 疤變淡（變成身體的一部分）", "title": "淡去的疤","lines":[
    {"who": "narr", "text": "傍晚的光斜斜照進水缸。你忽然發現，那道傷疤的顏色已經和周圍差不多了，不仔細看就找不到。", "bg": "place_tank", "fx": "larvaIn"},
    {"who": "grete", "face": "0", "text": "「如何？和之前說的一樣吧！變淡了。」", "chr": "grete_L_0"},
    {"who": "grete", "face": "1", "text": "「哎呀……年輕真好啊，如果是我這個年紀，搞不好就看得出差別了……」"},
    {"who": "narr", "text": "她咕噥著，隨後哼著歌離開。\n而你看著小球，當他遊過燈光底下時，那塊曾經怵目驚心的裂口反射著淡淡的光。", "fx": "larvaSway"}
  ]},
  {"id": "B09-08", "kind": "side", "ch": 1, "trig": "first", "arg": "med", "note": "自家小球：第一次換藥水（痛、縮緊；格蕾特「他沒有逃到水面上」）", "title": "第一次換藥","lines":[
    {"who": "narr", "text": "藥水是淡綠色的，聞起來有一點像雨後的草地。", "bg": "place_tank", "fx": "larvaIn"},
    {"who": "narr", "text": "你照著醫療組的說明，把滴管伸進水缸，在距離小球一定的距離時投入藥水。\n那淡色的藥水在水中擴散的很快，當延伸到小球周圍時，他頓時整顆縮緊，彷彿某種躲避危險的本能般變得有些透明。", "fx": "larvaSway"},
    {"who": "narr", "text": "換完藥，牠躲到離你最遠的角落，縮到水草後頭，連觸肢都收得看不見了。"},
    {"who": "grete", "face": "3", "text": "「……很痛吧。」", "chr": "grete_L_0"},
    {"who": "grete", "face": "0", "text": "「不過你看，他沒有逃到水面上喔。」"},
    {"who": "grete", "face": "0", "text": "「他知道這是在幫他的。只是知道歸知道，還是會怕痛啦。」", "note": "呼應 M1-01 言曉君「前幾次他大概會更怕你」"}
  ]},
  {"id": "B09-09", "kind": "side", "ch": 1, "trig": "first", "arg": "talk", "note": "自家小球：第一次說話", "title": "第一次說話","lines":[
    {"who": "narr", "text": "你在水缸前坐下，才發現自己不知道該說什麼。", "bg": "place_tank", "fx": "larvaIn"},
    {"who": "player", "text": "「呃……今天天氣不錯。」"},
    {"who": "narr", "text": "小球沒有反應。你只好繼續說下去：早餐吃了什麼、路上看到一隻很胖的貓、樓下的花開了……"},
    {"who": "narr", "text": "說到某件事的時候，牠的觸肢輕輕動了一下。", "fx": "larvaSway"},
    {"who": "narr", "text": "你又說了一次。這次牠沒有動。｜也許只是巧合。"},
    {"who": "narr", "text": "不過那天晚上，你多講了很多與之相關的話題。"}
  ]},
  {"id": "B09-10", "kind": "side", "ch": 1, "trig": "first", "arg": "note,week>=4", "note": "自家小球：言巷來訪後第一次紀錄狀況（格蕾特在頁角畫小球）", "title": "第一本紀錄","lines":[
    {"who": "narr", "text": "你翻開一本空白的筆記本，想起言巷那句「讓她做點紀錄」……｜不過小球的生活方面已經很麻煩格蕾特了，於是你決定自己先記錄一部分。", "bg": "home_day", "note": "【需要程式窗】「第一次做」只看真正第一次做的那天；這段要「條件符合之後的第一次做」（言巷來訪＝第三週末之後）"},
    {"who": "narr", "text": "換藥的時間、游了多遠、海草湯剩下多少……寫著寫著，才發現自己其實記得不少。", "fx": "contNl2"},
    {"who": "grete", "face": "1", "text": "「在寫什麼？」", "chr": "grete_L_0", "fx": "runR"},
    {"who": "narr", "text": "她湊過來看了一眼，隨後拿起筆，當你以為她要補充什麼資料，卻看她只是在頁角畫了一顆圓圓的小球，旁邊還加了一個笑臉。", "fx": "squat:R"},
    {"who": "grete", "face": "4", "text": "「不錯吧？有插圖可愛多了！」"},
    {"who": "choice", "text": "「真可愛。」", "go": "B09-10_1"},
    {"who": "choice", "text": "「我以為你要補充一些紀錄。」", "go": "B09-10_2"},
    {"tag": "B09-10_1", "who": "grete", "face": "1", "text": "「嘿嘿，很可愛吧！我最會吃飯了，我來帶，他以後一定會變得這麼圓滾滾。」", "fx": "sway:R", "go": "end"},
    {"tag": "B09-10_2", "who": "grete", "face": "1", "text": "「他今天心情很好喔！這也是重要的紀錄吧？」", "fx": "hop:R"}
  ]},
  {"id": "B09-11", "kind": "side", "ch": 1, "trig": "first", "arg": "touch,calm>=0", "note": "自家小球：安心 ≥0 後第一次觸碰", "title": "第一次觸碰","lines":[
    {"who": "narr", "text": "你捲起袖子，慢慢把手指伸進水裡。\n\n水比想像中涼，在淨水器的運轉下，你可以感覺到水流從你的手心與指尖滑過。", "bg": "place_tank", "fx": "larvaIn", "note": "【需要程式窗】「第一次做」只看真正第一次做的那天；這段要「條件符合之後的第一次做」（安心 ≥0；安心 <0 時排觸碰有 L07-01 的提醒）"},
    {"who": "narr", "text": "小球這天依然窩在他熟悉的角落，但如今他已經比剛來的時候放鬆許多。\n至少當你的手伸入水裡時，他沒有因為水溫與周遭的流動嚇得縮起身子。"},
    {"who": "narr", "text": "你把指尖停在離牠還有些距離地方，耐心地等著。｜約莫快一分鐘後，有什麼很軟的東西輕輕碰了一下你的指尖。", "fx": "larvaSway@2"},
    {"who": "narr", "text": "只有一下。\n在幾乎是瞬間的接觸後，牠就縮回了觸肢，但並沒有退縮或者移動……"},
    {"who": "grete", "face": "1", "text": "「他說你『熱熱的，好神奇』……", "chr": "grete_L_1", "note": "水比人涼，所以玩家的手對小球來說是燙的"},
    {"who": "grete", "face": "4", "text": "很可愛的感想吧？」", "fx": "cont", "note": "水比人涼，所以玩家的手對小球來說是燙的"}
  ]},
  {"id": "B09-12", "kind": "side", "ch": 1, "trig": "weekStart", "arg": "2,calm<0", "note": "自家小球：半夜的不安（陪著／讓他靜一靜）", "title": "半夜的不安","lines":[
    {"who": "narr", "text": "半夜，你被一陣細細的聲響吵醒。｜咚、咚——是水缸的玻璃。", "bg": "home_night", "note": "【需要程式窗】使用者希望是「隨機觸發一次，限安心 <0」；目前先用第 2 週開始、安心 <0 代替"},
    {"who": "narr", "text": "你打開小夜燈。小球在水裡亂撞，一下撞上玻璃，一下又縮成一團，像是想逃離什麼。", "bg": "place_tank", "fx": "larvaIn,larvaSway"},
    {"who": "narr", "text": "是做惡夢了嗎？還是傷口在痛？"},
    {"who": "choice", "text": "陪著他", "go": "B09-12_1", "eff": "calm+3,fat+10"},
    {"who": "choice", "text": "讓他自己靜一靜", "go": "B09-12_2", "eff": "tired+5"},
    {"tag": "B09-12_1", "who": "narr", "text": "你搬了張椅子坐到水缸旁邊，拿出手機找了些氛圍和緩的閒聊台，小聲的撥放著。"},
    {"who": "narr", "text": "過了一陣子，碰撞聲慢慢停下來，似乎是人們輕聲細語的談話讓他稍微冷靜了一些。\n天快亮的時候，牠縮在離你最近的那個角落睡著。", "go": "end"},
    {"tag": "B09-12_2", "who": "narr", "text": "你把小夜燈調到最暗，回到床上。", "bg": "home_night"},
    {"who": "narr", "text": "黑暗裡的聲音斷斷續續，一直響到後半夜才安靜下來。\n早上起來時你看見牠縮在老位置，似乎累得睡著了。"}
  ]},
  {"id": "L00-01", "kind": "event", "ch": 1, "trig": "roll", "arg": "stock,fav.ayen==0", "note": "認識阿言", "title": "搞不懂的相聲","lines":[
    {"who": "narr", "text": "你今天如往常般前往了廢墟，想看看言盡又蒐集了那些奇怪東西……\n卻沒想到看到了別人。", "bg": "place_ruins_out"},
    {"who": "ayen", "face": "0", "text": "「我不知道嘛，所以這個你還是得問別人……", "bg": "place_ruins_in", "chr": "ayen_L_0", "chl": "yanjin_R_0", "note": "此刻名字還是問號"},
    {"who": "ayen", "face": "5", "text": "啊。」", "chr": "ayen_R_5", "fx": "moveLB:R", "note": "此刻名字還是問號"},
    {"who": "narr", "text": "那個看起來二十出頭的女性注意到你的出現，稍微往言盡身旁縮去，而言盡則一如往常的面無表情地看向你，舉起手。"},
    {"who": "yanjin", "text": "「嗨。」", "fx": "sway:L"},
    {"who": "ayen", "face": "0", "text": "「啊，你認識的人嗎？」", "chr": "ayen_L_0", "fx": "moveC:R"},
    {"who": "yanjin", "text": "「嗯，{name}，是好人。」"},
    {"who": "narr", "text": "莫名就被發卡了。"},
    {"who": "ayen", "face": "4", "text": "「這樣啊，嗨，我是阿言。」", "fx": "moveR:R"},
    {"who": "choice", "text": "……難不成你也姓言？", "go": "L00-01_1"},
    {"who": "choice", "text": "嗨，初次見面。", "go": "L00-01_2"},
    {"tag": "L00-01_1", "who": "ayen", "face": "5", "text": "「啊？那是什麼意思？」"},
    {"who": "yanjin", "face": "5", "text": "「這裡，很多言。」\n「賽倫絲和瓊，本名也姓言。」"},
    {"who": "ayen", "text": "「他們又是誰？？」"},
    {"who": "yanjin", "face": "0", "text": "「好人。」"},
    {"who": "ayen", "face": "1", "text": "「啊……好。｜總之我不姓言啦，我姓……呃、"},
    {"who": "ayen", "face": "4", "text": "反正你叫我阿言就好了嘛！幸會，{name}。」", "fx": "cont", "go": "L00-01_3"},
    {"tag": "L00-01_2", "who": "ayen", "face": "4", "text": "「幸會幸會。」"},
    {"tag": "L00-01_3", "who": "yanjin", "text": "「阿言，現在，比較少用幸會。」"},
    {"who": "ayen", "face": "5", "text": "「真假？那你們都用什麼？」"},
    {"who": "yanjin", "face": "6", "text": "「……」"},
    {"who": "ayen", "text": "「欸不是，不要在這種時候發呆呀！」"},
    {"who": "narr", "text": "雖然總覺得哪裡怪怪的，但你和她們一起度過了愉快的一天。", "eff": "fav.ayen+10", "note": "第一次見到阿言＝認識 +10\n初次見面為隱藏數值，不顯示好感變動訊息"}
  ]},
  {"id": "L00-02", "kind": "event", "ch": 1, "trig": "roll", "arg": "cvs,fav.ayen>0", "note": "第一次便利商店打工碰到阿言", "title": "微妙感","lines":[
    {"who": "narr", "text": "便利商店的工作比想像中忙。補貨、結帳、微波便當，一下子就到了快要下班的時間……", "bg": "place_cvs"},
    {"who": "narr", "text": "就在你盤算著晚餐要吃什麼的時候，一個之前看過的身影走進了店內。"},
    {"who": "ayen", "face": "4", "text": "「歡迎光臨～」", "chr": "ayen_L_0", "fx": "walkR"},
    {"who": "narr", "text": "只見阿言學著店門口招呼客人語音的調，滿臉愉快地走向食品區。"},
    {"who": "narr", "text": "她先是走到了零食區。", "fx": "moveL:R"},
    {"who": "ayen", "face": "0", "text": "「洋芋片……好好吃，但是昨天剛吃過……」", "chr": "ayen_R_0"},
    {"who": "narr", "text": "她又走到了冷凍食品區。", "fx": "moveR:R"},
    {"who": "ayen", "face": "0", "text": "「煎餃……也好好吃嘛……可是言盡沒有微波爐，｜不知道廢墟撿不撿的到。」", "chr": "ayen_L_0"},
    {"who": "narr", "text": "她的自言自語似乎有些微妙的……讓人擔心？聽起來總有種輟學不良少女流浪到了此地似的情境感。"},
    {"who": "choice", "text": "告訴她店內有微波爐可以幫忙微波。", "go": "L00-02_1"},
    {"who": "choice", "text": "建議她去吃附近的自助餐。", "go": "L00-02_2"},
    {"tag": "L00-02_1", "who": "narr", "text": "你告訴她店內有微波爐可以幫忙微波。"},
    {"who": "ayen", "face": "1", "text": "「哎？真的嘛？那我要買這個！」", "fx": "sway"},
    {"who": "narr", "text": "伴隨著她雀躍的腳步，她買了一份微波煎餃和茶。", "go": "end"},
    {"tag": "L00-02_2", "who": "narr", "text": "你建議她去吃附近的自助餐。"},
    {"who": "ayen", "face": "5", "text": "「自助餐……那是什麼？」", "fx": "hop", "note": "因為不用吃喝的言盡沒辦法教她去哪裡吃飯"},
    {"who": "player", "text": "（她居然不知道自助餐……？）"},
    {"who": "narr", "text": "抱持著疑惑，但你還是向她解釋了一番，隨後看著她愉快地叨念著「自助餐，自助餐，在哪裡？」走出店外。", "eff": "fav.ayen+2"}
  ]},
  {"id": "L01-01", "kind": "event", "ch": 1, "trig": "meet", "arg": "yanjin@stock", "note": "支線：幫忙理貨遇到言盡（故事模式不開店）", "title": "言盡的收藏","lines":[
    {"who": "narr", "text": "廢墟裡，言盡蹲在那個老舊的大行李箱旁邊。", "bg": "place_ruins_in", "chr": "yanjin_L_0"},
    {"who": "yanjin", "face": "0", "text": "「唔。你來幫忙？」"},
    {"who": "yanjin", "face": "0", "text": "「箱子太亂了。這個月，不開店。要整理。」"},
    {"who": "narr", "text": "你看著她打開行李箱，裡頭塞滿了各種東西：沒電的手電筒、只剩一隻的耳環、一盒舊的遊戲卡帶……\n她把一些拿出來擺到左邊，又拿下一個，", "fx": "sway:R@2"},
    {"who": "narr", "text": "看到左側沒位置放以後停頓了數秒，才轉向另一遍", "chr": "yanjin_R_0", "fx": "cont,sway:R"},
    {"who": "yanjin", "text": "「這個，很久以前的。那個，昨天的。」", "chr": "yanjin_L_0"},
    {"who": "player", "text": "「妳記得每一樣東西是哪裡來的？」"},
    {"who": "yanjin", "face": "0", "text": "「……不記得。」"},
    {"who": "yanjin", "face": "1", "text": "「但是，亮亮的。」"},
    {"who": "narr", "text": "整理到最後，她從箱底翻出一顆會閃光的彈力球，盯著看了很久。", "fx": "squat:R"}
  ]},
  {"id": "L01-02", "kind": "event", "ch": 1, "trig": "meet", "arg": "yanjin@shop", "note": "支線：傍晚的商店街，言盡盯著電子看板", "title": "亮亮的","lines":[
    {"who": "narr", "text": "天快黑的時候，商店街的街燈一盞盞亮了起來。", "bg": "place_avenue_night"},
    {"who": "narr", "text": "當你路過商業大樓的大型廣告看板時，你注意到看板底下站著一個穿迷彩外套的人，仰著頭，一動也不動。", "chr": "yanjin_L_0", "fx": "contNl"},
    {"who": "player", "text": "「言盡？」"},
    {"who": "narr", "text": "聽到你的聲音，她轉頭看了你一眼，而後抬手，指向那正閃爍播放著遊戲新卡池的活動動畫。"},
    {"who": "yanjin", "face": "5", "text": "「……唔。」\n「它，會換顏色。」"},
    {"who": "narr", "text": "她像是分享了一個天大的祕密\n你們一起看了一會兒。除了遊戲外，看板上還輪流播放著飲料廣告、天氣預報，還有一隻跳舞的卡通熊。"},
    {"who": "yanjin", "face": "6", "text": "「熊，跳得不好，怪怪。」"},
    {"who": "yanjin", "face": "0", "text": "「但是，亮亮的，喜歡。」"}
  ]},
  {"id": "L02-01", "kind": "event", "ch": 1, "trig": "meet", "arg": "yanmo@walk|busk,fav.yanmo==0", "note": "支線：第一次遇到言默", "title": "歌唱的女人","lines":[
    {"who": "narr", "text": "公園的樹蔭下傳來歌聲。很輕、很慢，你好像聽過幾個單字，卻又不太確定。", "bg": "place_plaza"},
    {"who": "narr", "text": "唱歌的是一位穿著黑色長裙的女性。袖子是半透明的黑紗，長髮用緞帶綁起，風吹過她的髮絲，陽光從樹葉的縫隙中投下，使她彷彿從一幅舊油畫裡走出來般，帶著距離感——\n\n不過附近那些小球似乎不是這麼想的，他們雖然沒直接碰到她，但也靠得很近，隨著拍子在她身邊跳啊跳的。", "chr": "yanmo_L_6", "chl": "larvae:3", "fx": "larvaSway:L1,lvJump:L2,larvaSway:L3"},
    {"who": "narr", "text": "一曲唱完，小球們一哄而散，而她看見了你，輕輕點了點頭。", "chr": "yanmo_L_0", "fx": "leaveL:L"},
    {"who": "yanmo", "text": "「……不好意思，吵到您了嗎？」"},
    {"who": "player", "text": "「不會。那首歌是……？」"},
    {"who": "yanmo", "face": "1", "text": "「只是隨意練習而已。」", "fx": "sway"},
    {"who": "yanmo", "face": "0", "text": "「因為接了異生會的委託，之後要在附近的小廣場表演……想說先來練習一下。」", "fx": "contNl"},
    {"who": "yanmo", "text": "「啊，失禮了，還沒自我介紹，我叫言默。」", "fx": "contNl2"},
    {"who": "player", "text": "「我是{name}。」"},
    {"who": "yanmo", "face": "1", "text": "「多多指教。」"}
  ]},
  {"id": "L02-02", "kind": "event", "ch": 1, "trig": "meet", "arg": "yanmo@walk|busk", "note": "支線：又遇到言默", "title": "安心的秘訣","lines":[
    {"who": "narr", "text": "廣場上，又看到言默了，她這天並未歌唱，而是眺望著公園旁的河水。\n當注意到你走近，她便微微瞇起眼，輕聲說道：", "bg": "place_plaza"},
    {"who": "yanmo", "face": "1", "text": "「Servus。」", "chr": "yanmo_L_0"},
    {"who": "player", "text": "「……什麼？」"},
    {"who": "yanmo", "face": "0", "text": "「是奧地利的打招呼。見面和道別都可以用，很方便喔。」"},
    {"who": "narr", "text": "你和她閒聊了幾句，聊到了小球們。"},
    {"who": "player", "text": "「小球們都會喜歡你的歌嗎？我家有一個受傷的小球……不知道音樂能否讓他放鬆些？」"},
    {"who": "yanmo", "face": "0", "text": "「異種的幼體嗎？」"},
    {"who": "yanmo", "face": "1", "text": "「我想想……試著把窗戶打開吧？」"},
    {"who": "yanmo", "face": "4", "text": "「有時候與其保持寧靜，有一些自然的聲音更能讓異種感到安心……當然，對人也是。」", "fx": "contNl"},
    {"who": "yanmo", "face": "0", "text": "「至於我的歌……嗯，或許哪天也可以試試看呢。」"}
  ]},
  {"id": "L03-01", "kind": "event", "ch": 1, "trig": "meet", "arg": "silence@clerk", "note": "支線：初階文書工讀遇到賽倫絲（實習生學姊帶新人）", "title": "最強打工仔","lines":[
    {"who": "silence", "face": "4", "text": "「欸？是你？」", "bg": "hall_2f", "chr": "silence_L_4"},
    {"who": "silence", "face": "0", "text": "「照顧者也來打工嗎～好勤勞！」", "fx": "contNl"},
    {"who": "player", "text": "「生活費總要賺一點。」"},
    {"who": "silence", "face": "0", "text": "「懂！超懂！」"},
    {"who": "silence", "face": "4", "text": "「那我來帶你吧。這邊是委託的資料，照日期歸檔就好。」"},
    {"who": "narr", "text": "賽倫絲做事又快又仔細。來詢問的照顧者才開口，她就猜到對方想問什麼了。"},
    {"who": "silence", "face": "0", "text": "「看人臉色？嘿嘿，打工打久了就會了。」"},
    {"who": "silence", "face": "4", "text": "「我做過便利商店、餐廳、家教、搬家……啊，還有發傳單！」", "fx": "contNl2"},
    {"who": "silence", "face": "0", "text": "「想打工的話，下次有缺人的時候也找你喔！」", "fx": "contNl"}
  ]},
  {"id": "L03-02", "kind": "event", "ch": 1, "trig": "meet", "arg": "silence@shop,week>=3", "note": "支線：商店街遇到賽倫絲和兩個弟弟\n第二週後（賽倫絲來訪過後）可觸發", "title": "手足","lines":[
    {"who": "narr", "text": "傍晚的商店街。賽倫絲的手臂上掛著大包小包從超市走出來，兩手各牽著一個小男孩。\n在目光與你對上後，她揚起笑容。", "bg": "place_avenue"},
    {"who": "silence", "face": "4", "text": "「啊，是你！」", "chr": "silence_L_4+acc"},
    {"who": "silence", "face": "0", "text": "「這兩個是我弟弟，奕清和奕笙。來，打招呼～」", "fx": "contNl"},
    {"who": "narr", "text": "只見兩個長得一模一樣的男孩互看一眼，一個躲到她身後，露出半張臉看你，而另一個則是停在原地，有些侷促的模樣……｜不過片刻後，兩人還是互相牽著，禮貌地向你點頭打招呼。"},
    {"who": "silence", "face": "1", "text": "「有好好打招呼很棒，你們很勇敢喔！」"},
    {"who": "narr", "text": "她輕聲鼓勵道。\n明明也就只是個年輕的大學生，做這些事情卻莫名的……好像很習慣似的。", "note": "弟弟的故事之後的章節展開"},
    {"who": "silence", "face": "0", "text": "「怎麼啦？"},
    {"who": "silence", "face": "5", "text": "……啊、不對，今天還要煮湯、沒時間閒聊，我先帶他們回去啦！」", "fx": "cont"},
    {"who": "narr", "text": "她笑著說，語氣很輕鬆，但匆匆離去的步伐卻透露出了某種無法停下的忙碌。", "note": "弟弟的故事之後的章節展開"}
  ]},
  {"id": "L04-01", "kind": "event", "ch": 1, "trig": "meet", "arg": "joan@clerk2", "note": "支線：進階文書工讀遇到瓊（拘謹的後勤前輩）", "title": "工作時的心靈支柱","lines":[
    {"who": "joan", "face": "5", "text": "「啊、今天的工讀是……你嗎？」", "bg": "hall_3f", "chr": "joan_L_5+acc"},
    {"who": "joan", "face": "0", "text": "「那麻煩你幫忙核對這些表格……」"},
    {"who": "narr", "text": "3F 的工作是核對成就紀錄和積分。瓊一邊對照，一邊小聲地念著數字。"},
    {"who": "narr", "text": "午休的時候，你注意到她的手機桌布是一個金髮的動畫角色。"},
    {"who": "choice", "text": "那是誰？", "go": "ask"},
    {"who": "choice", "text": "假裝沒看到", "go": "skip"},
    {"tag": "ask", "who": "joan", "face": "5", "text": "「欸！？你看到了……」"},
    {"who": "joan", "face": "0", "text": "「……是我推。最近的活動限定。」"},
    {"who": "joan", "face": "0", "text": "「抽了——一百二十抽……｜還沒來，哈哈。」"},
    {"who": "narr", "text": "她說出數字的時候，眼神突然變得很遙遠。", "go": "end", "eff": "fav.joan+3"},
    {"tag": "skip", "who": "narr", "text": "你移開視線。瓊好像鬆了一口氣，偷偷把手機翻了過去。"}
  ]},
  {"id": "L04-02", "kind": "event", "ch": 1, "trig": "meet", "arg": "joan@shop", "note": "支線：商店街遇到瓊（在周邊店門口猶豫）", "title": "糾結的阿宅","lines":[
    {"who": "narr", "text": "週末的商店街。周邊店的門口，有個熟悉的身影來回踱步。", "bg": "place_avenue"},
    {"who": "joan", "face": "0", "text": "「可是這個月已經課了……」", "chr": "joan_L_0", "fx": "moveL"},
    {"who": "narr", "text": "她拿起一個壓克力立牌，放下，又拿起來。"},
    {"who": "player", "text": "「瓊？」"},
    {"who": "joan", "face": "5", "text": "「哇啊！？」", "chr": "joan_R_5", "fx": "hop"},
    {"who": "joan", "face": "0", "text": "「我只是路過！真的只是路過！」"},
    {"who": "narr", "text": "你看了看她手上的立牌。"},
    {"who": "joan", "face": "3", "text": "「……好吧，不是路過。」"},
    {"who": "joan", "face": "2", "text": "「但是！｜你也覺得這個很好看吧？對吧？」"},
    {"who": "choice", "text": "很好看", "go": "yes", "eff": "fav.joan+3"},
    {"who": "choice", "text": "這個月不是已經課了嗎？", "go": "no"},
    {"tag": "yes", "who": "joan", "face": "0", "text": "「對吧！那就是命運了！沒錯……」"},
    {"who": "narr", "text": "她拿著立牌，彷彿突然覺醒了替身使者般，昂首闊步的走向結帳櫃台。", "chr": "joan_L_0", "fx": "leaveL:R", "go": "end"},
    {"tag": "no", "who": "joan", "face": "5", "text": "「……嗚。」"},
    {"who": "narr", "text": "她知道你說的合理，咬牙把立牌放回架上。走了幾步，又回頭看了一眼，可憐兮兮。"}
  ]},
  {"id": "L05-01", "kind": "event", "ch": 1, "trig": "meet", "arg": "xiaojun@walk", "note": "支線：公園遇到言曉君（私下不太笑的那一面）", "title": "笑容","lines":[
    {"who": "narr", "text": "公園的長椅上，坐著一個熟悉的人。", "bg": "place_park"},
    {"who": "narr", "text": "言曉君拿著一罐咖啡，看著遠處的噴水池。她臉上什麼表情也沒有，和在異生會的時候完全不一樣——\n\n在異生會時，她雖然看起來挺嚴肅的，但不至於這樣……冷冰冰？", "chr": "xiaojun_L_0"},
    {"who": "narr", "text": "下一秒，她注意到了你。"},
    {"who": "xiaojun", "face": "1", "text": "「啊，是你。來散步？」"},
    {"who": "narr", "text": "她笑了。那個笑容很自然，自然得像是有人按下了開關。"},
    {"who": "choice", "text": "坐到她旁邊", "go": "sit", "eff": "fav.xiaojun+3"},
    {"who": "choice", "text": "打個招呼就走", "go": "bye"},
    {"tag": "sit", "who": "narr", "text": "你在長椅的另一端坐下。她沒有說話，你也沒有。", "chr": "xiaojun_L_0"},
    {"who": "xiaojun", "face": "0", "text": "「……他最近怎麼樣？」"},
    {"who": "narr", "text": "你說了這週的事。她聽得很認真，偶爾點一下頭。"},
    {"who": "xiaojun", "face": "0", "text": "「這樣啊。」"},
    {"who": "xiaojun", "face": "0", "text": "「……那就好。」"},
    {"who": "narr", "text": "那句「那就好」沒有笑。但你覺得，那是她今天說的話裡最真心的一句。", "go": "end"},
    {"tag": "bye", "who": "xiaojun", "face": "1", "text": "「嗯，路上小心。」"},
    {"who": "narr", "text": "走遠之後回頭，她又變回了剛才那張沒有表情的臉。", "chr": "xiaojun_L_0"}
  ]},
  {"id": "L06-01", "kind": "event", "ch": 1, "trig": "meet", "arg": "yanxiang@lab", "note": "支線：4F 研究室第一次遇到言巷（知識夠／不夠兩種）", "title": "研究室工作","lines":[
    {"who": "narr", "text": "異生會大樓4F的研究室……據說裡頭更像是資料分析室，實際上需要大型機具與精密操作的作業都在別的地方。\n\n而這間突兀的研究室，單純是為了滿足目前任職董事的言巷——｜「要我坐辦公室？謀殺嗎？」據說她被推舉時這樣吐槽著，最終耍賴似的把工作丟給了自己的老哥，真是愛撒嬌的妹妹……\n\n↑ PS. 以上部分資料來源是言街，本旁白並不負責也沒有任何立場。", "bg": "hall_corridor", "note": "感覺應該可以改成是第一次去研究室？或者乾脆拆成兩個，知識低第一次去實驗室，知識超過後第一次去實驗室"},
    {"who": "narr", "text": "……", "fx": "walk", "note": "像是玩家往前走的感覺，不用移動太多"},
    {"who": "narr", "text": "當你走近時，正好從門邊的小窗與研究室內的言巷對上視線。\n她並沒有遲疑太久便開了門。"},
    {"who": "yanxiang", "face": "0", "text": "「有什麼事？」", "bg": "hall_4f", "chr": "yanxiang_L_0+acc"},
    {"who": "narr", "text": "她的臉上戴著工作時用的眼鏡，據說是防藍光還什麼的貴鬆鬆鏡片。\n看向你的時候，那雙一藍一棕的異色瞳孔筆直地向著你，詢問簡短的像是每一秒都極其珍貴。\n\n……對她來說也確實如此。"},
    {"who": "cond", "text": "know>=25", "go": "L06-01_1"},
    {"who": "cond", "text": "", "go": "L06-01_2"},
    {"tag": "L06-01_1", "who": "narr", "text": "你把手裡的文件給了她，那是一份簡單的筆記。記錄了你這段時間蒐集到的知識……", "fx": "crouch:R"},
    {"who": "yanxiang", "text": "「來應徵的？」\n「……」", "fx": "sway@2"},
    {"who": "yanxiang", "text": "「可以，進來吧。」", "go": "end"},
    {"tag": "L06-01_2", "who": "narr", "text": "你看了看她，說只是路過。\n她意會的點點頭後，便關上門回去忙碌了。"}
  ]},
  {"id": "L07-01", "kind": "event", "ch": 1, "trig": "pick", "arg": "touch,calm<0", "note": "提示：安心還是負的時候第一次排「觸碰」","lines":[
    {"who": "grete", "face": "5", "text": "「等一下等一下！」", "chr": "grete_L_5"},
    {"who": "grete", "face": "3", "text": "「他現在還在怕你。這時候碰他，他會很緊張、很累的。」"},
    {"who": "grete", "face": "0", "text": "「先多跟他說說話，等他不怕了再試試看吧？」", "fx": "contNl"},
    {"who": "narr", "text": "（還是可以排，只是小球的疲倦會增加更多。）"}
  ]},
  {"id": "L07-02", "kind": "event", "ch": 1, "trig": "weekStart", "arg": "3,med<3", "note": "提示：第 3 週開始時換藥水還不到 3 次","lines":[
    {"who": "grete", "face": "3", "text": "「那個……換藥水的次數好像有點不夠喔。」", "bg": "home_night", "chr": "grete_L_3"},
    {"who": "grete", "face": "0", "text": "「這個月至少要換 5 次。接下來的週二、週五，盡量不要再跳過了！」"}
  ]},
  {"id": "L07-03", "kind": "event", "ch": 1, "trig": "first", "arg": "tiredMax", "note": "提示：小球疲倦第一次滿","lines":[
    {"who": "grete", "face": "3", "text": "「小球好像累壞了……」", "chr": "grete_L_3"},
    {"who": "grete", "face": "0", "text": "「他太累的時候，照顧一定會失敗，心情也會變差。」\n「去打工、散步、睡覺的日子，他就能休息。下週讓他喘口氣吧？」"}
  ]},
  {"id": "L07-04", "kind": "event", "ch": 1, "trig": "first", "arg": "collapse", "note": "提示：玩家疲勞第一次滿（累倒）","lines":[
    {"who": "narr", "text": "你倒在床上，一覺睡到了隔天傍晚。", "bg": "home_day"},
    {"who": "grete", "face": "2", "text": "「都說了累了要休息嘛！」", "chr": "grete_L_2"},
    {"who": "grete", "face": "0", "text": "「你倒下的話，他也會擔心的喔。」", "fx": "contNl"}
  ]},
  {"id": "L07-05", "kind": "event", "ch": 1, "trig": "first", "arg": "crit", "note": "提示：第一次大成功","lines":[
    {"who": "grete", "face": "4", "text": "「剛剛那次很棒喔！」", "chr": "grete_L_4"},
    {"who": "grete", "face": "1", "text": "「偶爾會像這樣特別順利：效果加倍，他也不會變累！」", "fx": "contNl"}
  ]},
  {"id": "L07-06", "kind": "event", "ch": 1, "trig": "first", "arg": "fumble", "note": "提示：第一次大失敗","lines":[
    {"who": "grete", "face": "3", "text": "「……今天不太順利呢。」", "chr": "grete_L_3"},
    {"who": "grete", "face": "0", "text": "「有時候就是會這樣。他心情好一點的時候，照顧就比較容易成功。」", "fx": "contNl"}
  ]},
  {"id": "L07-07", "kind": "event", "ch": 1, "trig": "first", "arg": "free", "note": "提示：第一次自由行動（地圖怎麼玩；v0.40.45 取代畫面上的說明字）","lines":[
    {"who": "narr", "text": "自由行動時可以自己決定要去哪裡。\n地圖上的地方點一下，就會直接過去。", "bg": "map"},
    {"who": "narr", "text": "不知道那裡能做什麼的話，先打開資訊列上的「？」吧。\n可切換為點一下顯示說明，再點一次才會過去的模式。"},
    {"who": "narr", "text": "回家的話，也可以改之後幾天的行程。"}
  ]},
  {"id": "L07-08", "kind": "event", "ch": 1, "trig": "first", "arg": "sleep", "note": "支線：第一次在家睡覺，格蕾特聊她的族名「小花」", "title": "很可愛吧？","lines":[
    {"who": "narr", "text": "難得睡到自然醒的一天。你醒來的時候，格蕾特正坐在水缸旁邊哼著歌。", "bg": "home_day"},
    {"who": "grete", "face": "1", "text": "「早安，睡得好嗎？」", "chr": "grete_L_1"},
    {"who": "player", "text": "「格蕾特，妳之前說的一百二十四歲……是真的？」"},
    {"who": "grete", "face": "4", "text": "「是真的喔！」"},
    {"who": "grete", "face": "1", "text": "「我剛出生的時候是粉粉的一顆，大家都說好可愛，所以族名叫『小花』。」"},
    {"who": "grete", "face": "0", "text": "「現在也很可愛吧？」"},
    {"who": "choice", "text": "很可愛", "go": "yes", "eff": "fav.grete+3"},
    {"who": "choice", "text": "不予置評", "go": "no"},
    {"tag": "yes", "who": "grete", "face": "4", "text": "「嘿嘿～」", "go": "end"},
    {"tag": "no", "who": "grete", "face": "2", "text": "「欸——！」"}
  ]},
  {"id": "L08-01", "kind": "event", "ch": 1, "trig": "roll", "arg": "volunteer,alone==0", "note": "支線：活動中心義工遇到言街", "title": "龍潭虎穴的活動中心","lines":[
    {"who": "narr", "text": "你來到活動中心，這個堪稱龍潭虎穴的地方，原因是……\n", "bg": "place_community", "chr": "yanjie_L_0+acc", "chl": "larvae:3", "fx": "lvJump"},
    {"who": "yanjie", "face": "1", "text": "「別、別急，點心大家都有！」", "fx": "moveRF:L,sway:R"},
    {"who": "narr", "text": "看，例如眼前這名男子，他正被一群跳來跳去的小球圍著，這些頑皮的小東西看中了他手裡的點心，用短短的觸肢抓住了他的褲管與外套衣角。\n\n注意到你來，他抽空朝你揮了揮手——看起來像是打招呼，也很像是在求救。", "fx": "lvJump"},
    {"who": "yanjie", "face": "6", "text": "「哇啊！」", "fx": "fall"},
    {"who": "narr", "text": "看來應該是求救。"}
  ]},
  {"id": "L10-01", "kind": "event", "ch": 1, "trig": "meet", "arg": "yanjie@f5", "note": "陌生小球：5F 言街念繪本，小球爬滿他；", "title": "天賦異稟","lines":[
    {"who": "narr", "text": "董事長辦公室的門一推開，就看見被小球們當成攀爬架的言姓男子——又或者說，言街。", "bg": "hall_top", "chr": "larvae:3", "chl": "yanjie_R_6+acc", "note": "言街在 5F 戴眼鏡"},
    {"who": "narr", "text": "他坐在沙發上，膝上攤著一本繪本，身邊、腿上、肩膀上，全都是小球。\n\n似乎因為球數眾多，他這天早早放棄了工作，拿出了繪本陪小球們。", "fx": "lvJump,contNl"},
    {"who": "yanjie", "face": "1", "text": "「啊，{name}，來得正好……能幫我一下嗎？我好像動不了了。」", "fx": "sway"},
    {"who": "narr", "text": "他無奈的笑道，只見其中兩顆小球，一顆剛好壓在他的手腕上，一顆正趴在他的書頁上，剛好擋住下一行字。", "fx": "lvWave:R1"},
    {"who": "yanjie", "face": "4", "text": "「每次翻頁，都得先請他們讓一讓……尤其他們好像特別喜歡這一頁畫的大餐。」"},
    {"who": "narr", "text": "你仔細一看，喔，是賣火柴的小女孩從燭火中看到大餐與玩具的故事……\n而那兩隻小球的觸肢正啪搭啪搭的往書上的烤雞與麵包濃湯拍著，像是很疑惑為什麼碰不到——\n\n天知道他們是用什麼方式看到這些圖畫的。", "fx": "lvJump@2"},
    {"who": "yanjie", "face": "0", "text": "「正常的火柴沒辦法變出大餐……｜嗯，如果你們真的想看，要找大人幫忙，不可以自己偷玩喔，火是有危險性的，這個上次的故事也講過了對吧。」\n\n「……也不要拿這一頁去找言巷問能不能做可以變出大餐的火柴喔？」", "note": "言街＝學文學的，用詞優美但平易近人"},
    {"who": "narr", "text": "言街輕聲安撫道，片刻後終於在你的幫助下終於擺脫了右手的「重壓」……\n那顆小球確實吃得挺胖的。"},
    {"who": "yanjie", "face": "1", "text": "「其實，這些孩子們喜歡的是聲音的起伏，聽不聽得懂倒在其次……不過某些孩子在某些地方特別有天分呢。」", "note": "言街＝學文學的，用詞優美但平易近人"},
    {"who": "narr", "text": "他活動著手腕，看著你手裡的那顆胖胖貪吃球，溫和的笑了。"}
  ]},
  {"id": "L10-02", "kind": "event", "ch": 1, "trig": "roll", "arg": "volunteer,calm>-10,alone==1", "note": "陌生小球：活動中心躲在桌腳的小球", "title": "桌腳後的身影","lines":[
    {"who": "narr", "text": "活動中心的地墊上，一群小球滾來滾去，開心的玩鬧著。\n每當有義工經過，他們便會帶著好奇與親近的湊過去……活動中心內時不時便會傳出：「等等我在忙！」、「小心，別爬到頭上。」等等帶著無奈笑意的字句。", "bg": "place_community", "chr": "larvae:1", "chl": "larvae:3", "fx": "lvJump:L1,lvJump:L2,lvJump:L3", "note": "已經認識言街（第一次見面是 L08-01）"},
    {"who": "narr", "text": "當你好不容易從一棵小球聖誕樹變回人類時，你突然發現有一顆小球躲在桌腳後面。\n桌腳並不粗，他露出了大半的身體但渾然不覺，你能從那緊繃不Q彈的球體上感受到他正在試圖縮小自己……", "fx": "larvaSway:R"},
    {"who": "narr", "text": "你恍惚想起家裡那隻剛來的時候，也是這樣躲著。"},
    {"who": "narr", "text": "「你也注意到了啊。」一旁的志工看你注意著小球，便向你說明：「據說那孩子比較內向，又剛好今天第一次被送來……」\n志工看著那顆小球溫和地笑著：「放心吧，很快就會適應了。」"},
    {"who": "narr", "text": "你點點頭，休息片刻後便繼續回到軟墊區，拿起書本給小球們講著故事……"},
    {"who": "narr", "text": "在某個時候，你注意到那顆小球往外挪了一點點。", "fx": "larvaSway:R"}
  ]},
  {"id": "L11-01", "kind": "event", "ch": 1, "trig": "roll", "arg": "f5,alone==1", "note": "小事件：去 5F 幫忙照顧小球，言街剛好不在（v0.40.47）", "title": "人呢？人呢？","lines":[
    {"who": "narr", "text": "當你踏入號稱全異生會保安程度最低的董事長辦公室時，裡頭空蕩蕩的。\n根據附近員工的說法，言街似乎是剛來不久便又開始咳了，被從四樓殺上來的言巷壓著送上救護車。\n\n「我沒這麼嚴重，不要浪費社會資源……」據說他被扛走時這樣抗議著，而言巷則冷哼一聲——\n「醫院是我投資的，救護車也是我買的，不算社會資源。」\n\n壕無人性。", "bg": "hall_top", "chr": "larvae:2", "chl": "larvae:2", "fx": "bigFace:yanjie_L_6@3", "note": "就是那種搞笑動漫風格的表現方式\n整段都算是旁白，雖然有對話框但不算對話"},
    {"who": "narr", "text": "然而，不明真相的小球們還是照樣聚在這裡，在言街過去努力的教導下，這些小朋友倒是安分，沒有亂玩辦公室內的東西。\n只是在你進門後一顆一顆無辜的歪著身體看你，好像在問：「人呢？」", "fx": "lvJump"},
    {"who": "grete", "text": "「啊，打擾了，雖然劇情上我人不在這裡，但最可愛的格蕾特還是會打破第四面牆給你翻譯服務喔！」", "chr": "grete_L_1", "fx": "helperIn:39%", "note": "大概就像教學那樣，格蕾特會出現在右下角，會從畫面外滑進來，並停在約半身的位置，用來表示她此刻是遊戲規格外的小助手\n\n而總計六隻小球們的立繪依然存在"},
    {"who": "narr", "text": "最右邊的小球跳了跳，觸肢揮舞著。\n而後他旁邊的小球被觸肢拍到，Q彈Q彈的拍了回去。", "fx": "lvJump:R1,lvWave:R2", "note": "照描述讓小球做動作"},
    {"who": "grete", "text": "「最右邊的好奇寶寶說：『找不到黑頭髮的人類』，但他打到旁邊的黏人小球了，現在他們玩起來了。」\n\n『你為什麼拍我，我都扁了！』\n『哪有，你這麼圓，我戳給你看。』", "fx": "lvKeep", "note": "不要讓動作被按鍵打斷"},
    {"who": "narr", "text": "左邊的小球則是已經趴了下去。\n而旁邊的那隻小球見狀，伸出觸肢搖晃他。", "fx": "lvSleep:L1,lvWave:L2", "note": "照描述讓小球做動作"},
    {"who": "grete", "text": "「那隻睏睏的孩子說：『地板好好睡～』，他旁邊的頑固小球正要和他搶位置。」\n\n『讓讓，讓讓，這塊地板今天是我的地盤。』\n『Zzzz……唔？那我是……你的地盤上的球？』\n『咦？好像是？……好吧，既然是我地盤上的球，那你可以在這裡睡覺。』", "fx": "lvKeep"},
    {"who": "grete", "text": "「以上翻譯結束，掰掰囉！」\n", "fx": "helperOut"},
    {"who": "narr", "text": "搞不太懂他們想做什麼……總之，先陪牠們玩吧。", "note": "格蕾特說完以後就縮回去"}
  ]},
  {"id": "L11-02", "kind": "event", "ch": 1, "trig": "roll", "arg": "stock,alone==1", "note": "小事件：幫忙整理時，言盡整理到一半發呆、晃走了（不加好感；v0.40.48）", "title": "遊蕩","lines":[
    {"who": "narr", "text": "你和言盡一起把行李箱裡的東西一件一件拿出來整理。", "bg": "place_ruins_in", "chr": "yanjin_L_0"},
    {"who": "narr", "text": "整理到一半，她手上的動作停了下來，歪著頭盯著某個地方發呆……", "chr": "yanjin_R_6"},
    {"who": "narr", "text": "等你回過神來，她已經晃到別的地方去了……｜你猶豫了一下，還是幫她把剩下的整理完。", "chr": "yanjin_R_0", "fx": "leaveR:R", "note": "點選時不要讓動畫重播"}
  ]}
];
;
/* ==== js/data/wears.js ==== */
// 【資料】小球的裝扮道具（在言盡的商店買，永久持有；在「物品」裡幫這一輪的小球戴上／拿下）。名字在 TEXT.shop.items。
//   art：像素圖（每個字一格；. 透明，其他字對應 pal 的顏色）｜scale：每格放大幾倍（小球圖是 96×96）
//   （舊格式）art＋pal＋scale＋dx、dy：程式畫的像素圖，相對於核心的中心
// 用圖片：img:'wear_xxx'（assets/wear/wear_xxx.png，96×96 透明底，照 tools/wear_template 的小球位置直接畫上去）。
//   v0.35.4 起也可以給 2 倍圖（192×192，位置一樣、放大兩倍畫）：程式自動縮成 96 畫；box 一律寫 96 的座標（2 倍圖的範圍除以 2）。
//   換姿勢時程式會讓圖跟著核心移動。商店的商品圖也直接用這張（box＝有畫東西的範圍 [左,上,右,下]，商店只放大這一塊；換圖後要重算）。
// cat：打扮頁的分類（head 頭飾｜face 臉飾｜icon 圖示（符號類）｜other 其他）
const WEARS={
  // glow：會發光、可以換顏色的部分（白色或淺灰的圖，程式上色）；顏色存在小球的 wearCol（色碼或 'rainbow'＝慢慢彩虹變色）
  glowstick:{img:'wear_glowstick',glow:'wear_glowstick_glow',box:[0,0,93,78],cat:'other'},
  squareglasses:{img:'wear_squareglasses',box:[3,14,85,56],cat:'face'},
  goldglasses:{img:'wear_goldglasses',box:[6,14,81,76],cat:'face'},
  shades:{img:'wear_shades',box:[2,4,78,53],cat:'face'},
  catears:{img:'wear_catears',box:[3,2,84,53],cat:'head'},
  bow:{img:'wear_bow',box:[6,0,57,34],cat:'head'},
  clipx:{img:'wear_clipx',box:[2,25,23,47],cat:'head'},
  clipeq:{img:'wear_clipeq',box:[59,7,78,28],cat:'head'},
  sparkle:{img:'wear_sparkle',box:[7,1,84,54],cat:'icon'},
  hearts:{img:'wear_hearts',box:[4,4,83,51],cat:'icon'},
  bolts:{img:'wear_bolts',box:[3,0,41,61],cat:'icon'},
  bandaid:{img:'wear_bandaid',box:[32,29,58,45],cat:'face'},
  coin:{img:'wear_coin',box:[3,5,32,49],cat:'icon'},
  cross:{img:'wear_cross',box:[0,25,93,69],cat:'other'},
  tie:{img:'wear_tie',box:[32,50,83,86],cat:'other'},
  bowtie:{img:'wear_bowtie',box:[37,50,69,72],cat:'other'},
  satchel:{img:'wear_satchel',box:[1,11,85,87],cat:'other'},
  wings:{img:'wear_wings',box:[0,32,95,78],cat:'other'},
  devil:{img:'wear_devil',box:[0,0,92,75],cat:'other'},
  foxmask:{img:'wear_foxmask',box:[1,0,86,44],cat:'head'},
  minilarva:{img:'wear_minilarva',box:[0,0,51,48],cat:'head'},
  // v0.31.3：趴在頭上的小動物
  bunny:{img:'wear_bunny',box:[4,1,41,39],cat:'head'},
  shushu:{img:'wear_shushu',box:[6,1,37,37],cat:'head'},   // v0.32.4 鼠薯
  phone:{img:'wear_phone',box:[3,25,93,87],cat:'other'},   // v0.35.4 手機（第一件 2 倍圖 192×192）
  puppy:{img:'wear_puppy',box:[3,2,43,41],cat:'head'},
  snake:{img:'wear_snake',box:[7,4,44,55],cat:'head'},
  blackcat:{img:'wear_blackcat',box:[8,4,47,49],cat:'head'},
  eyepatch:{img:'wear_eyepatch',box:[6,12,92,71],cat:'face'},
  dododo:{img:'wear_dododo',box:[12,4,44,78],cat:'icon'},
  gogogo:{img:'wear_gogogo',box:[47,1,90,63],cat:'icon'},
  detective:{img:'wear_detective',box:[1,0,52,54],cat:'head'},   // 偵探帽（成就「看透小球心」的獎勵）
};
;
/* ==== js/data/decor.js ==== */
// 【資料】背景裝飾（出門有機會撿到，撿到後永久保留，之後每個周目都會出現在水缸裡）。
// 圖片放 assets/larva/deco_<id>.png，並在 js/data/sprites.js 的 IMGN 登記。x、y 是圖片「底部中心」在畫布上的位置。
const DECOR={
  castle:{name:'海底小城堡',x:195,y:360},
  shell:{name:'大貝殼',x:70,y:482},
  coral:{name:'珊瑚叢',x:385,y:385}
};
;
/* ==== js/data/sprites.js ==== */
// 【資料】圖片檔清單與每個姿勢的核心位置。新增姿勢圖時，在這裡登記。
// ---- 圖片載入（ASSETS 為內嵌版專用，GitHub 版讀 assets/larva/）----
const BASE='assets/larva/';
// 小球的光：hl＝身體光點（body_*_L）的不透明度、glow＝核心外圈光暈的強度（1＝原圖）。想調亮暗改這裡（v0.34，使用者定 80%／50%）
const LARVA_FX={hl:.8,glow:.5};
// bg_preview（觀察水缸的背景，589KB）不在開頭讀：進觀察水缸才讀（pvEnter，v0.40.69）
const IMGN=['bg_tank','bg_tank_glass_1','bg_tank_glass_2','deco_castle','deco_shell','deco_coral','body_close','body_curl','body_droop','body_flat_a','body_flat_b','body_idle_a','body_idle_b','body_open_a','body_open_b','body_reach_a','body_reach_b','body_rest','core_mask','core_glow','body_close_L','body_curl_L','body_droop_L','body_flat_a_L','body_flat_b_L','body_idle_a_L','body_idle_b_L','body_open_a_L','body_open_b_L','body_reach_a_L','body_reach_b_L','body_rest_L','scar_1'];   // body_*_L＝光點（白色、不上色，疊在身體上；v0.34）
// 核心中心位置（以 96×96 幼體圖為座標），不同姿勢可微調
const CORE={rest:[48,62],curl:[46,50],droop:[46,48],flat_a:[46,50],flat_b:[46,50]};
const coreAt=p=>CORE[p]||[46,46];
;
/* ==== js/state.js ==== */
// ===== 遊戲狀態 S（唯一的一份）、新周目建立、把數值轉成文字 =====
let S=null, selColor=COLORS[5];

// ---------- 新周目 ----------
// 每個周目隨機生成：個性、喜歡的零食、不喜歡的零食、喜歡的玩具、核心顏色（hue）
function newGame(pname,name,col){
  const g=R(GIFTS);
  S={day:1,ap:2,life:90,sat:70,dirt:15,ph:7,trust:10,bond:0,explore:0,outs:0,
    pname,name,col,hue:Math.floor(Math.random()*360),colored:false,over:null,
    pref:{gift:g,dislike:R(GIFTS.filter(x=>x!==g)),toy:R(TOYS)},
    temp:R(TEMPER_IDS),
    inv:{food:3,agent:3,sweet:1,salty:0,bitter:0,bubble:0,bell:0,ball:0,kit:META.kit?1:0},   // 水質檢測儀跨周目繼承
    waterToday:0,history:[],found:{gift:false,toy:false},
    tags:rollTags(),tagsFound:[],                 // tags：擁有的特殊標籤（開局依機率分配）；tagsFound：已被發現的
    playedToday:false,noPlay:0,touchGain:0,grete:false,trans:false,
    tc:'',tb:'',tb2:'',tbm:'',tbs:'soft',chatC:[],chatB:[],chatB2:[]};      // 標籤用：今天有沒有玩、連續幾天沒玩、今天被戳加了幾次信賴
  const sp=META.special;                            // 特殊委託（2F 賽倫絲）：預約好的個性、標籤、顏色
  if(sp){S.temp=sp.temp;S.tags=[...sp.tags];S.hue=sp.hue;S.pre=.4;S.special=true;META.special=null}   // pre：已經被照顧過，一開始就帶顏色（和名單縮圖一樣）
  if(S.tags.includes('homereturn'))S.trust+=15;     // 回歸者：覺得一切都很熟悉，一開始就比較信任你
  tagsReset();
  Object.keys(S.inv).forEach(k=>{if(S.inv[k]>0)seeItem(k)});codexSave();   // 開局就有的物品也記進物品圖鑑

  // 重設幼體在水缸裡的狀態
  Object.assign(C,{lastFood:0,x:250,y:180,vx:1,vy:.15,tx:1,ty:0,rot:0,rv:0,next:0,calm:0,steering:false,home:pickHome()});
  document.body.classList.remove('idle');
  M=null;pokes=[];CHAT_SEL.core=CHAT_SEL.shell=CHAT_SEL.shell2=null;CHAT_SEL.part='core';CHAT_SEL.style='';

  $('pname').textContent=pname;paintName($('pname'),col);$('cname').textContent=name;
  $('log').innerHTML='';
  say(TEXT.start.born,'sys');
  say(TEXT.start.tip,'sys');
  if(sp)say(fmt(TEXT.special.start,{why:sp.why}),'ev');
  refresh();
  GUESTS=[];syncGuests(false);                    // 勾選的圖鑑同伴會從邊緣飄進來
}

// ---------- 把數值轉成玩家看得懂的文字 ----------
// 虛弱的小球對水質更挑剔（門檻比較低）
const waterOver=w=>S.dirt>w.dirt||Math.abs(S.ph-7)>w.ph;   // 門檻在 js/data/rules.js 的 WATER_RULE
const waterBad=()=>waterOver(hasTag('frail')?WATER_RULE.frailBad:WATER_RULE.bad);
const waterSevere=()=>waterOver(hasTag('frail')?WATER_RULE.frailSevere:WATER_RULE.severe);
// 水質：有檢測儀才顯示精確數值，沒有就顯示「未知」，要從行為線索判斷
function waterW(){
  if(S.inv.kit>0)return fmt(TEXT.misc.waterNum,{d:Math.round(S.dirt),p:S.ph.toFixed(1)});
  return TEXT.misc.waterUnknown;
}
// 沒有儀器時的觀察線索（每日結算時顯示）
function hints(){
  const h=[];
  if(S.dirt>60)h.push(TEXT.hint.dirty);
  else if(S.dirt>35)h.push(TEXT.hint.hazy);
  if(S.ph-7>1.2)h.push(TEXT.hint.base);
  if(7-S.ph>1.2)h.push(TEXT.hint.acid);
  if(S.sat<=35)h.push(hasTag('smalleat')?TEXT.hint.hungrySmall:TEXT.hint.hungry);   // 不愛吃：餓了也不太積極（不管有沒有被發現，都是一個線索）
  if(S.life<=50)h.push(TEXT.hint.weak);
  return h;
}
;
/* ==== js/ui.js ==== */
// ===== 畫面：訊息、狀態面板、選單彈窗、提示框。只負責顯示，不改遊戲規則 =====

// 訊息區加一行。文字裡的「幼體」會換成你取的名字（用【】框起來）。cls：'ev' 事件、'bad' 警告、'sys' 系統
function say(t,cls=''){
  bounce=1;
  const p=document.createElement('p');
  p.textContent=withLarva(t);
  if(cls)p.className=cls;
  $('log').appendChild(p);$('log').scrollTop=1e9;
}

// ---------- 成就提示框：水缸上方黑底半透明的框，依序顯示 ----------
const toastQ=[];let toastBusy=false;
function toast(text){toastQ.push(withLarva(text));if(!toastBusy)nextToast()}
function nextToast(){
  const t=toastQ.shift();
  if(!t){toastBusy=false;return}
  toastBusy=true;
  const el=$('toast');el.textContent=t;el.className='show';
  setTimeout(()=>{el.className='';setTimeout(nextToast,400)},3600);
}

// 重畫上方日期、行動點、狀態面板，並依狀態啟用／停用按鈕
function refresh(){
  if(PV)return;                                          // 預覽模式沒有這些面板
  paintName($('cname'),S.colored?S.col:'');
  $('day').textContent=fmt(TEXT.misc.dayLabel,{d:Math.min(S.day,7)});
  $('pips').innerHTML=[0,1].map(i=>`<span class="${i<S.ap?'on':''}"></span>`).join('');

  // 筆記：個性（加上已發現的標籤，用「／」連起來；滑鼠移上去或點一下會顯示說明）、喜好（發現前顯示 ？）
  const T=TEXT.temper[S.temp];
  const tip=(txt,desc,cls)=>`<span class="tipc ${cls||''}" data-tip="${esc(desc)}" tabindex="0">${esc(txt)}</span>`;
  const traits=[tip(T.name,T.desc),...S.tagsFound.map(id=>tip(TEXT.tags[id].name,TEXT.tags[id].desc,'tagc'))].join(' / ');
  const X=TEXT.misc;$('notes').innerHTML=`<b>${esc(X.notes)}</b><div>${esc(X.notesTemp)}${traits}</div><div>${esc(X.notesLike)}${S.found.gift?esc(NAME[S.pref.gift]):esc(X.unknown)} / ${S.found.toy?esc(NAME[S.pref.toy]):esc(X.unknown)}</div>`;
  // 水質：有檢測儀才會在水缸角落顯示數值（飽食不顯示，太餓時小球會冒出刀叉泡泡）
  const wq=$('wq');wq.hidden=!(S.inv.kit>0);wq.textContent=fmt(TEXT.misc.water,{w:waterW()});

  // 格蕾特小助手：遇見之後才出現。開著時，換水與餵食收起來，改成多一個翻譯開關
  const gr=!!META.grete&&!S.over,L=TEXT.layout;
  // 按鈕內容：圖示＋名字（電腦版多顯示 dk 的字）＋開／關。手機版三行直排，電腦版一行
  const togHTML=(ic,name,on)=>icoHTML(ic)+`<span class="bt">${name}</span><span class="bs">${on?L.on:L.off}</span>`;
  $('bGrete').hidden=!gr;$('bGrete').className='tog'+(S.grete?' on':'');$('bGrete').setAttribute('aria-pressed',String(!!S.grete));
  $('bGrete').innerHTML=togHTML('grete',`<span class="dk">${L.gDesk}</span>${L.grete}`,S.grete);
  // 翻譯：要小助手開著才能用（關著時顯示「關」並停用）
  $('bTrans').hidden=!gr;$('bTrans').disabled=!S.grete;$('bTrans').className='tog'+(S.trans?' on':'');$('bTrans').setAttribute('aria-pressed',String(!!S.trans));
  $('bTrans').innerHTML=togHTML('trans',`${L.trans}<span class="dk">${L.tDesk}</span>`,S.grete&&S.trans);
  $('bWater').hidden=$('bFeed').hidden=gr&&!!S.grete;
  const off=!!S.over;
  $('bWater').disabled=off||S.inv.agent<1;
  $('bFeed').disabled=off||!FOODS.some(k=>S.inv[k]>0);
  $('bPlay').disabled=off||S.ap<1;
  $('bChat').disabled=off||S.ap<1;
  $('bOut').disabled=off||S.ap<1;
  $('end').disabled=off;
}

// ---------- 單色圖示（資料在 js/data/icons.js）：用 CSS 遮罩，顏色跟著文字色 ----------
const ICON_URL={};
function icoUrl(id){
  if(ICON_URL[id])return ICON_URL[id];
  const v=ICONS[id];if(!v)return '';
  if(typeof v==='string')return ICON_URL[id]='url("'+v+'")';
  let d='';v.forEach((row,y)=>[...row].forEach((c,x)=>{if(c==='#')d+=`M${x} ${y}h1v1h-1z`}));
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges"><path d="${d}"/></svg>`;
  return ICON_URL[id]='url("data:image/svg+xml,'+encodeURIComponent(svg)+'")';
}
const icoHTML=id=>`<i class="ico" style='--ico:${icoUrl(id)}' aria-hidden="true"></i>`;
function paintIcons(root){(root||document).querySelectorAll('.ico[data-i]').forEach(e=>{e.style.setProperty('--ico',icoUrl(e.dataset.i));e.setAttribute('aria-hidden','true')})}
paintIcons();

// ---------- index.html 裡寫死的介面文字：有 data-t="路徑" 的元素，換成 TEXT 裡的文字（文字都在 texts.js，方便從設定總表改）----------
const textAt=p=>p.split('.').reduce((o,k)=>o&&o[k],TEXT);
document.querySelectorAll('[data-t]').forEach(e=>{const v=textAt(e.dataset.t);if(typeof v==='string')e.textContent=v});

// 彈出選單：title 標題、opts 選項 [{id,label,off}]、cb(id) 選了之後做的事
function pick(title,opts,cb,body){
  $('pt').textContent=title;$('pp').textContent=withLarva(body||'');$('pp').hidden=!body;
  $('pNote').hidden=true;$('pScene').hidden=true;
  $('pFig').hidden=true;$('pTag').hidden=true;   // 頭像與名牌只有事件會用（showEvent 再打開）
  $('po').innerHTML='';
  opts.forEach(o=>{
    if(o.rule){$('po').appendChild(document.createElement('hr'));if(o.label){const d=document.createElement('div');d.className='phead';d.textContent=o.label;$('po').appendChild(d)}return}
    if(o.node){$('po').appendChild(o.node);return}
    if(o.head){const d=document.createElement('div');d.className='phead';d.textContent=o.head;$('po').appendChild(d);return}
    const b=document.createElement('button');
    b.textContent=o.label;b.disabled=!!o.off;if(o.main)b.className='main';   // main＝這個框最主要的一下（黃底）
    b.onclick=()=>{$('ovPick').classList.remove('show');cb(o.id)};
    $('po').appendChild(b);
  });
  $('ovPick').classList.add('show');
}
$('pc').onclick=()=>$('ovPick').classList.remove('show');
$('bagClose').onclick=()=>$('ovBag').classList.remove('show');

// ---------- 提示框：任何有 data-tip 的元素，滑鼠移上去、點一下或鍵盤聚焦都會顯示說明 ----------
const tipBox=document.createElement('div');tipBox.id='tip';tipBox.setAttribute('role','tooltip');
document.body.appendChild(tipBox);
function showTip(el){
  tipBox.textContent=el.getAttribute('data-tip');tipBox.style.display='block';
  const r=el.getBoundingClientRect(),w=tipBox.offsetWidth,h=tipBox.offsetHeight;
  let x=r.left+r.width/2-w/2,y=r.bottom+6;
  x=Math.max(8,Math.min(innerWidth-w-8,x));
  if(y+h>innerHeight-8)y=Math.max(8,r.top-h-6);
  tipBox.style.left=x+'px';tipBox.style.top=y+'px';
}
const hideTip=()=>{tipBox.style.display='none'};
const tipOf=e=>e.target&&e.target.closest?e.target.closest('[data-tip]'):null;
document.addEventListener('mouseover',e=>{const el=tipOf(e);el?showTip(el):hideTip()});
document.addEventListener('click',e=>{const el=tipOf(e);el?showTip(el):hideTip()});
document.addEventListener('focusin',e=>{const el=tipOf(e);if(el)showTip(el)});
document.addEventListener('focusout',hideTip);
;
/* ==== js/actions.js ==== */
// ===== 玩家指令：換水、餵食（海草湯＋零食）、玩耍、出門、查看物品 =====
// 要新增指令：在這裡寫一個 actXxx 函式，在 index.html 加按鈕，在 js/main.js 綁定，文字放進 js/data/texts.js。
// 慣例：先扣庫存／行動次數 → 改狀態 → 表情氣泡 emote() → 訊息 say() → refresh() 重畫面板。

// 信賴增加量：基本值 n × 個性倍率；碰到「喜歡的東西」時（fav＝true）再乘上個性的 favGain（頑固特別高）
function gain(n,fav){
  const T=TEMPERS[S.temp];
  return Math.round(n*T.trustGain*(fav?T.favGain:1));
}
const FOODS=['food',...GIFTS];                 // 可以餵的東西：海草湯 ＋ 三種零食
const itemLabel=k=>`${NAME[k]} ×${S.inv[k]}`;

// ---------- 換水 ----------
function actWater(){
  S.inv.agent--;S.waterToday++;
  const AW=ACT_RULE.water;
  S.dirt=Math.max(AW.min,S.dirt-AW.dirt);S.ph+=(7-S.ph)*AW.ph;
  if(S.waterToday>1){                           // 一天換超過一次：嚇到幼體
    S.life=clamp(S.life-AW.overLife);emote('x');say(TEXT.water.over,'bad');
  }else{emote('drop');say(TEXT.water.ok)}
  refresh();
}

// ---------- 餵食 ----------
// 海草湯是主食（飽食 +35）；零食飽食較少（+15），但幼體對零食有自己的喜惡
function actFeed(){
  const have=FOODS.filter(k=>S.inv[k]>0);
  const opts=[];
  if(have.includes('food'))opts.push({head:TEXT.feed.headMain},{id:'food',label:itemLabel('food')});      // 主食：飽足 +35
  if(have.some(k=>k!=='food'))opts.push({head:TEXT.feed.headSnack},...have.filter(k=>k!=='food').map(k=>({id:k,label:itemLabel(k)})));   // 零食：飽足 +15
  pick(TEXT.feed.pick,opts,feedItem);
}
// 餵一份東西（玩家自己餵和格蕾特餵都走這裡）
function feedItem(k){
  S.inv[k]--;S.history.push('feed');
  const glut=hasTag('glutton'),snack=GIFTS.includes(k),before=S.tagsFound.filter(id=>snack||id!=='glutton');
  const AF=ACT_RULE.feed,amt=Math.round((k==='food'?AF.food:AF.snack)*(hasTag('smalleat')?AF.smalleatMul:1)),full=   // 不愛吃：每次吃得少
    S.sat>(glut?AF.fullGlutton:AF.full),v={item:NAME[k]};   // 貪吃鬼更容易吃撐、什麼零食都不推開
  if(k===S.pref.dislike&&!glut&&S.sat<=AF.dislikeSat){          // 不喜歡的零食：餓得受不了才勉強吃
    S.sat=clamp(S.sat+AF.dislikeAmt);emote('q');say(fmt(TEXT.feed.dislikeEat,v));
  }else if(k===S.pref.dislike&&!glut){               // 不喜歡的零食：推開（還是會消耗）
    emote('x');say(fmt(TEXT.feed.dislike,v));
  }else if(full){                              // 已經吃飽還硬塞：傷身體
    S.life=clamp(S.life-(k==='food'?AF.overFood:AF.overSnack));S.sat=clamp(S.sat+amt);
    emote('x');say(TEXT.feed.full,'bad');
  }else if(k==='food'){
    S.sat=clamp(S.sat+amt);emote('star');say(TEXT.feed.soup);
  }else if(k===S.pref.gift){                   // 喜歡的零食：信賴大增，並記進「喜好」欄
    S.sat=clamp(S.sat+amt);S.trust=clamp(S.trust+gain(AF.favTrust,true));S.bond++;S.found.gift=true;
    emote('heart');say(fmt(TEXT.temper[S.temp].feedFav||TEXT.feed.fav,v),'ev');
  }else{                                       // 普通零食
    S.sat=clamp(S.sat+amt);S.trust=clamp(S.trust+gain(AF.okTrust));
    emote('star');say(fmt(TEXT.feed.ok,v));
  }
  if(glut&&snack)discoverTag('glutton');
  if(hasTag('smalleat'))discoverTag('smalleat');
  tagReact('feed',v,before);
  refresh();
}

// ---------- 玩耍（耗 1 行動）----------
function actPlay(){
  const toys=[...TOYS.filter(t=>S.inv[t]>0),...META.tools.filter(t=>PLAY_TOOLS.includes(t))].map(t=>({id:t,label:NAME[t]}));   // 玩具＋永久道具（指揮棒）
  const opts=toys.length?[{head:TEXT.play.toyHead},...toys]:[];   // 聊天改成獨立的「聊天」鍵（js/chat.js 的 chatOpen）
  pick(TEXT.play.pick,opts,t=>{
    S.ap--;S.playedToday=true;
    const v={item:NAME[t]},before=[...S.tagsFound],pl=hasTag('playful');
    const AP=ACT_RULE.play,pgain=(n,f)=>hasTag('scholar')?Math.round(gain(n,f)*AP.scholarMul):gain(n,f);   // 學者：玩耍加的信賴只有一半
    if(t===S.pref.toy){
      S.trust=clamp(S.trust+pgain(AP.fav,true));S.bond++;S.found.toy=true;
      emote('heart');say(fmt(TEXT.temper[S.temp].playFav||TEXT.play.fav,v),'ev');
    }else if(pl){                                   // 貪玩：每種玩具都喜歡（信賴增加比最愛的少一點）
      S.trust=clamp(S.trust+pgain(AP.playful));emote('heart');
    }else{
      S.trust=clamp(S.trust+pgain(AP.meh));emote('q');say(fmt(TEXT.play.meh,v));
    }
    if(pl)discoverTag('playful');
    tagReact('play',v,before);
    if(TEMPERS[S.temp].explorer)S.explore++;     // 探索型個性：累積探索次數（結局用）
    refresh();
    if(META.playMode==='play')gameStart(t);      // 玩耍方式＝遊玩：在水缸裡真的玩一場（js/minigame.js）
  },toys.length?'':TEXT.play.noToy);
}

// ---------- 出門（耗 1 行動）----------
// 出門鍵：外出方式「隨機」＝從 RANDOM_PLACES 挑一個地點；「地圖」＝打開地圖自己選（js/places.js）
function goOut(){if(META.outMode==='map')mapOpen();else actOut(R(RANDOM_PLACES))}
// 依地點的權重擲一件戰利品的種類（js/data/places.js 的 loot）
function lootPick(w){
  let n=Math.random()*Object.values(w).reduce((a,b)=>a+b,0);
  for(const k in w){n-=w[k];if(n<0)return k==='snack'?R(GIFTS):k==='toy'?R(TOYS):k}
  return 'food';
}
// 在 place 帶回 OUT_ITEMS 件東西（海草湯、換水劑、零食、玩具）；有機會撿到「水質檢測儀」和「背景裝飾」，兩者都永久保留。
function actOut(place){
  place=PLACES[place]&&PLACES[place].loot?place:RANDOM_PLACES[0];
  S.ap--;S.outs++;S.explore++;
  if(!META.visited.includes(place))META.visited.push(place);   // 去過的地點（成就）
  const got={};
  for(let i=0;i<OUT_ITEMS;i++){const k=lootPick(PLACES[place].loot);got[k]=(got[k]||0)+1}
  if(S.inv.kit<1&&(S.outs>=ACT_RULE.out.kitSure||Math.random()<ACT_RULE.out.kitChance))got.kit=1;      // 水質檢測儀：第 3 次出門起必拿到，之前有 25% 機率

  const list=[];
  for(const k in got){
    if(k==='kit'||TOYS.includes(k)){            // 工具與玩具只會有一份，有了就不重複給
      if(S.inv[k]>0){got[k]=0;continue}
      S.inv[k]=1;list.push(NAME[k]);
      if(k==='kit'){META.kit=true}
    }else{S.inv[k]+=got[k];list.push(`${NAME[k]}×${got[k]}`)}
    seeItem(k);                                  // 記進物品圖鑑
  }
  const free=Object.keys(DECOR).filter(k=>!META.decor.includes(k));
  let deco=null;
  if(free.length&&Math.random()<ACT_RULE.out.decor){deco=R(free);META.decor.push(deco)}   // 背景裝飾：35% 機率撿到沒有的一種
  codexSave();

  emote(list.length||deco?'ex':'q');
  const pn=TEXT.place[place].name;
  say(list.length?fmt(TEXT.out.back,{list:list.join('、'),place:pn}):fmt(TEXT.out.empty,{place:pn}));
  if(got.kit)say(TEXT.out.kit,'ev');
  if(deco)say(fmt(TEXT.out.deco,{deco:DECOR[deco].name}),'ev');
  // 遇見格蕾特：每次 20%，第 4 次出門起一定會遇見；遇見後永久解鎖「小助手」
  if(!META.grete&&(META.greteMet?Math.random()<GRETE_MEET.again:(S.outs>=GRETE_MEET.sure||Math.random()<GRETE_MEET.chance))){
    runEvent(META.greteMet?'greteAgain':'greteMeet');return;
  }
  // 認識格蕾特之後：遇到她閒聊，學會「聊天染色」；之後有機會再學「雙色」（小球至少成功染過一次）
  if(META.grete&&!META.chatColor&&Math.random()<CHAT_RULE.event){runEvent('colorTalk');return}
  if(META.grete&&META.chatColor&&!META.chatDual&&META.chatWins>0&&Math.random()<CHAT_RULE.event){runEvent('colorTalk2');return}
  refresh();
}

// ---------- 查看物品 ----------
// 物品欄：依分類列出（分類之間用橫線隔開）｜名稱 ×數量，右上 ✕ 關閉
function actBag(){
  const groups=ITEM_GROUPS.map(([label,ids])=>[label,ids.filter(id=>S.inv[id]>0).map(id=>[NAME[id],S.inv[id]])]);
  groups.push([TEXT.bag.decorHead,META.decor.map(id=>[DECOR[id].name,1])]);
  const box=$('bagBody');box.textContent='';
  const shown=groups.filter(g=>g[1].length);
  if(!shown.length)box.append(h('p',{class:'dim'},TEXT.bag.empty));
  shown.forEach(([label,rows],i)=>{                  // 裝扮改到「小球們 → 打扮」
    if(i)box.append(h('hr',{class:'div'}));
    box.append(h('div',{class:'bagh'},label),...rows.map(r=>h('div',{class:'bagrow'},h('span',{},r[0]),h('span',{class:'num'},'×'+r[1]))));
  });
  $('ovBag').classList.add('show');
}
;
/* ==== js/tags.js ==== */
// ===== 特殊標籤：分配、揭曉、受影響的文字，以及需要特別行為的標籤（鑑賞家、人類愛好者）=====
// S.tags＝這隻小球擁有的標籤（開局時依機率分配），S.tagsFound＝玩家已經發現的。
// 效果一開始就生效，但專屬文字要等「發現」之後才會出現；發現的那一刻呼叫 discoverTag(id)。
const hasTag=id=>!!S&&S.tags.includes(id);
// 虛弱的徵兆：水質差或肚子餓（門檻比一般小球低）時，身體會變得更透明、動作更慢
const frailSym=()=>hasTag('frail')&&(S.sat<=50||S.dirt>45||Math.abs(S.ph-7)>.9);
// 目前顯示在水缸裡的裝飾 id
const visibleDecor=()=>Object.keys(DECOR).filter(id=>META.decor.includes(id)&&!META.hidden.includes(id));

// ---------- 分配 ----------
// 回歸者：消逝過幾隻，最多就出現幾隻（已經帶過回歸者標籤的要扣掉）
// 消逝過幾隻＝圖鑑裡提前消逝的＋收到「道別」信的畢業小球（META.farewells）
const lostCount=()=>CODEX.filter(e=>e.end==='END-07').length+(META.farewells||0);
const homeLeft=()=>lostCount()-CODEX.filter(e=>e.own.includes('homereturn')).length-META.homeUsed;
function tagOK(id,have){
  const d=TAGS[id];
  if(d.off||have.includes(id))return false;
  if(TAG_CLASH.some(([a,b])=>(a===id&&have.includes(b))||(b===id&&have.includes(a))))return false;
  if(d.needsLost&&homeLeft()<=0)return false;
  return true;
}
function rollTags(){
  const r=Math.random(),n=r<TAG_ODDS.none?0:r<TAG_ODDS.none+TAG_ODDS.one?1:2;
  const have=[];
  for(let i=0;i<n;i++){
    const pool=Object.keys(TAGS).filter(id=>tagOK(id,have));
    if(!pool.length)break;
    let w=Math.random()*pool.reduce((s,id)=>s+TAGS[id].weight,0);
    have.push(pool.find(id=>(w-=TAGS[id].weight)<0)||pool[pool.length-1]);
  }
  return have;
}

// ---------- 揭曉 ----------
// 回傳 true＝這次才剛發現。訊息區先寫專屬的「被發現當下」文字，再寫標籤名稱，水缸上方跳提示框。
function discoverTag(id){
  if(!S||!has(TAGS,id)||!S.tags.includes(id)||S.tagsFound.includes(id))return false;
  S.tagsFound.push(id);
  const v={tag:TEXT.tags[id].name,desc:TEXT.tags[id].desc};
  if(TEXT.tags[id].found)say(TEXT.tags[id].found,'ev');
  say(fmt(TEXT.tag.found,v),'ev');       // 訊息區
  toast(fmt(TEXT.tag.toast,v));          // 水缸上方的提示框
  refresh();
  return true;
}
// 已經發現的標籤，在某個情境（feed／play／poke／day）會多說一句。
// ids＝要看的標籤（預設全部已發現的；呼叫前先複製一份，剛發現的那個就不會重複說）；chance＝出現機率
function tagReact(kind,v,ids,chance){
  (ids||S.tagsFound).forEach(id=>{
    let t=TEXT.tags[id][kind];
    if(kind==='day'&&TEXT.tags[id].dayNone&&!visibleDecor().length)t=TEXT.tags[id].dayNone;
    if(kind==='day'&&TEXT.tags[id].daySleepy&&TEMPERS[S.temp].sleepy)t=TEXT.tags[id].daySleepy;   // 高高在上的睏睏：浮在水面睡
    if(kind==='day'&&id==='smalleat'&&S.sat<=35)return;   // 不愛吃：餓的時候換日提示已經寫了（hint.hungrySmall），不再重複
    if(!t||(chance!=null&&Math.random()>chance))return;
    if(t.includes('{deco}')){
      const ds=visibleDecor();if(!ds.length)return;
      v=Object.assign({},v,{deco:DECOR[R(ds)].name});
    }
    say(fmt(t,v),'ev');
  });
}

// ---------- 鑑賞家：會去裝飾旁邊打轉 ----------
const JD={id:null,until:0,heart:false};
function judgeSteer(t){
  if(!hasTag('judge'))return null;
  const ids=visibleDecor();
  if(!ids.length){JD.id=null;return null}
  if(t>JD.until){
    if(JD.id){JD.id=null;JD.until=t+8000+Math.random()*7000}                 // 逛夠了，去別處
    else{JD.id=R(ids);JD.until=t+6000+Math.random()*3000;JD.heart=false;discoverTag('judge')}
  }
  if(!JD.id)return null;
  if(!ids.includes(JD.id)){JD.id=null;return null}
  const d=DECOR[JD.id],p={x:d.x+WORLD.dx,y:Math.min(300,d.y-30)};
  if(dist(C,p)<45){
    if(!JD.heart&&Math.random()<.02){JD.heart=true;emote('heart')}
    return [Math.sin(t/900)*.12,Math.cos(t/700)*.06];                       // 在裝飾旁輕輕打轉
  }
  return aim(C,p,1);
}

// ---------- 人類愛好者：偶爾停下來「看」你、追游標 ----------
const CUR={x:0,y:0,t:-1e9,vx:0,vy:0};               // 游標最後在水缸上的位置與時間（creature.js 更新）
const LV={on:false,until:0,next:0,heart:false};
function loveySteer(t){
  if(!hasTag('lovey'))return null;
  if(!LV.next)LV.next=t+8000;
  if(LV.on&&t>LV.until){LV.on=false;LV.next=t+9000+Math.random()*9000}
  if(!LV.on&&t>=LV.next){LV.on=true;LV.until=t+3500;LV.heart=false;discoverTag('lovey')}
  if(!LV.on)return null;
  if(t-CUR.t>6000)return [0,0];                                             // 沒有游標：只是停下來盯著你的方向
  if(dist(C,CUR)<50){if(!LV.heart){LV.heart=true;emote('heart')}return [0,0]}
  return aim(C,CUR,1.1);
}
function tagsReset(){JD.id=null;JD.until=0;LV.on=false;LV.next=0}
;
/* ==== js/grete.js ==== */
// ===== 格蕾特小助手：出門遇見後永久解鎖 =====
// 開啟「小助手」之後：換水與餵食（基礎照顧）在換日之後（和剛開啟時）由她自動處理，畫面上的換水／餵食按鈕會收起來，
// 多出一個「翻譯」開關（開著時戳小球，有機會聽見心聲）。玩耍、出門、物品照舊。
// 東西不夠時會跳出提示、關掉小助手模式，讓玩家回到原本的按鈕自己處理。

// 跳出格蕾特的提示框（有頭像就顯示頭像）。cb＝按下「知道了」之後要做的事
function gretePrompt(text,cb){
  showEvent(text,{title:TEXT.misc.grete,img:GRETE_IMG,name:TEXT.misc.grete,cb});
}
function gretOff(){S.grete=false;S.trans=false;refresh()}

// 換日之後、以及剛開啟小助手時呼叫。東西不夠就跳提示並關掉小助手（不影響結束今天）
function greteDaily(){
  if(!S.grete)return true;
  const R_=GRETE_RULE,lack=[];
  // 1) 換水：水質下降了才換（今天玩家已經換過就不重複）
  const needWater=S.dirt>R_.waterDirt||Math.abs(S.ph-7)>R_.waterPh;
  if(needWater){
    if(S.inv.agent<1)lack.push(TEXT.grete.shortWater);
    else{say(TEXT.grete.water,'ev');const w=S.waterToday;S.waterToday=0;actWater();S.waterToday=w}   // 她換的不算玩家的次數（也不會因為玩家今天換過而被當成換太多次）
  }
  // 2) 餵食：先餵喜歡的零食 → 海草湯 →（真的很餓才）其他零食；不喜歡的零食不餵
  if(S.sat<R_.feedBelow){
    const others=GIFTS.filter(k=>k!==S.pref.gift&&k!==S.pref.dislike);
    const order=[S.pref.gift,'food',...others,S.pref.dislike];     // 不喜歡的零食是最後手段
    say(TEXT.grete.feed,'ev');
    let n=0;
    while(S.sat<R_.feedBelow&&n<R_.maxFeeds){
      const k=order.find(k=>S.inv[k]>0&&(k===S.pref.dislike?S.sat<=40:(!others.includes(k)||S.sat<R_.hungryBelow)));
      if(!k)break;
      if(k===S.pref.gift)S.found.gift=true;                 // 她餵的是最愛的零食，玩家也就知道了
      feedItem(k);n++;
    }
    if(S.sat<R_.feedBelow&&!order.some(k=>S.inv[k]>0))lack.push(TEXT.grete.shortFood);   // 還需要吃、但已經沒有東西可餵
  }
  if(lack.length){gretOff();gretePrompt(lack.join('\n'));return false}
  return true;
}

// 心聲：翻譯開著時戳小球。約 45% 什麼都沒在想（格蕾特說）；其餘是主腦（本體）與觸肢副腦的對話，不加格蕾特前綴。
// 學者、回歸者：第一次聽見心聲時揭曉（VOICE_FOUND 由 creature.js 的 poke 讀取）
let VOICE_FOUND=null;
function voiceLine(sub){
  if(Math.random()<.45)return TEXT.grete.nothing;
  // sub＝說話的是誰（預覽模式戳其他小球時用）；沒給就是玩家養的這隻
  const w=sub||{temp:S.temp,tags:S.tags,found:S.tagsFound,sat:S.sat,dirt:S.dirt,life:S.life,trust:S.trust,self:C};
  const V=TEXT.voice,v={},r=Math.random();
  const first=!sub&&['scholar','homereturn'].find(id=>w.tags.includes(id)&&!w.found.includes(id));
  if(first){VOICE_FOUND=first;return R(V.tag[first]).map(([a,t])=>a+'：'+t).join('\n')}
  const others=[...(PV?[]:[C]),...GUESTS].filter(b=>b!==w.self&&isLive(b));      // 水缸裡其他的小球
  let pool=null;
  if(others.length&&r<.3){
    const b=R(others);v.g=nm(b===C?S.name:b.name);pool=V.guest[b===C?S.temp:b.e.temp];
  }
  if(!pool){
    const st=[];
    if(w.sat<=35)st.push(V.hungry);else if(w.sat>=75)st.push(V.full);
    if(w.dirt>60)st.push(V.dirty);
    if(w.life<40)st.push(V.weak);
    if(w.trust>75)st.push(V.love);
    if(st.length&&r<.65)pool=R(st);
  }
  if(!pool&&r<.78)pool=V.notice;
  if(!pool){
    const tg=w.tags.filter(id=>has(V.tag,id));
    if(tg.length&&Math.random()<.35)pool=V.tag[R(tg)];
    else if(w.temp==='sleepy'&&Math.random()<.4)pool=V.stone;
    else pool=V.temper[w.temp];
  }
  return R(pool).map(([a,t])=>a+'：'+fmt(t,v)).join('\n');
}
;
/* ==== js/events.js ==== */
// ===== 事件：彈出框標題固定是「事件」，內文是一小段文字，可選頭像。 =====
// 之後的隨機事件都用這個模板：在 EVENTS 加一筆，就可以用 runEvent('id') 觸發。
//   text：內文（字串，或回傳字串的函式）　img：頭像圖片網址（可省略）
//   apply：事件發生時要做的事（發獎勵、解鎖…）。log：同時寫進訊息區的文字（可省略）
const EVENTS={
  // 第一次去廢棄大樓：遇見言盡，走完最後一頁（進入商店）才算見過（js/shop.js）
  shopIntro:{
    pages:()=>TEXT.shop.intro.map(p=>({...p,opts:p.opts&&p.opts.map(o=>({...o,next:undefined}))})),
    apply(){META.shopMet=true;codexSave()}
  },
  // pages：每頁 {text, img, name, note, btn｜opts[{label,next}], next}。next＝要去第幾頁（-1＝結束、不執行 apply）；沒寫就是下一頁。
  // 事件開始時執行 start；最後一頁出現時才執行 apply（中途按 ✕ 離開＝事件沒完成）。declined＝選了 -1 時寫進訊息區的字。
  greteMeet:{
    pages:()=>TEXT.grete.pages.map(withImg),
    start(){META.greteMet=true;codexSave()},         // 見過面了：之後會觸發「再次遇到」的版本
    apply(){META.grete=true;codexSave()},           // 永久解鎖「格蕾特小助手」
    log:()=>TEXT.grete.meet,
    declined:()=>TEXT.grete.declined
  },
  // 聊顏色：認識格蕾特後出門遇到。走完最後一頁才永久解鎖
  colorTalk:{
    pages:()=>TEXT.chatEv.talk.pages.map(withImg),
    apply(){META.chatColor=true;codexSave()},
    log:()=>TEXT.chatEv.talk.log
  },
  colorTalk2:{
    pages:()=>TEXT.chatEv.dual.pages.map(withImg),
    apply(){META.chatDual=true;codexSave()},
    log:()=>TEXT.chatEv.dual.log
  },
  greteAgain:{
    pages:()=>[withImg({...TEXT.grete.again,opts:TEXT.grete.again.opts.map(o=>({...o,next:o.next==='intro'?1:o.next}))}),withImg(TEXT.grete.pages[TEXT.grete.pages.length-1])],
    apply(){META.grete=true;codexSave()},
    log:()=>TEXT.grete.meet,
    declined:()=>TEXT.grete.declined
  }
};
const withImg=p=>({...p,img:[GRETE_IMG,GRETE_IMG2][p.img]});
// 跳出事件框。opt.preview＝true 時只預覽，不執行 start／apply。cb＝事件走完之後要做的事
function runEvent(id,opt){
  const ev=EVENTS[id];if(!ev)return;
  opt=opt||{};
  const pages=ev.pages();
  if(!opt.preview&&ev.start)ev.start();
  const show=i=>{
    const p=pages[i],last=i===pages.length-1;
    if(last&&!opt.preview){if(ev.apply)ev.apply();if(ev.log)say(ev.log(),'ev');refresh()}
    const go=n=>{
      if(n===-1){if(!opt.preview&&ev.declined)say(ev.declined(),'ev');refresh();return}
      if(n>=pages.length){if(opt.cb)opt.cb();return}
      show(n)
    };
    const opts=p.opts?p.opts.map((o,k)=>({id:k,label:o.label})):[{id:0,label:p.btn||TEXT.misc.ok}];
    showEvent(p.text,{img:p.img,name:p.name,note:p.note,scene:p.bg?{bg:p.bg,chr:p.chr,item:p.item,name:p.name}:null,opts,cb:k=>go(p.opts&&p.opts[k].next!==undefined?p.opts[k].next:(p.next!==undefined?p.next:i+1))});   // 選項沒寫 next＝下一頁
  };
  show(0);
}
// 事件／提示框的共用外觀（標題 + 內文框 + 可選小字、圖片、名牌 + 按鈕）。o：title img name note btn｜opts cb(id)
function showEvent(text,o){
  o=o||{};
  pick(o.title||TEXT.misc.evTitle,o.opts||[{id:0,label:o.btn||TEXT.misc.ok}],id=>{if(o.cb)o.cb(id)},text);
  const im=$('pAv'),nm_=$('pTag'),fig=$('pFig'),nt=$('pNote');
  if(im&&o.img){if(/^[\w-]+(\+(acc|配件))?$/.test(o.img))chrSet(im,o.img);else{delete im.dataset.chr;im.style.background='';im.src=o.img}}   // 圖名（grete_L_0）或網址
  if(nm_)nm_.textContent=o.name||'';
  if(nm_)nm_.hidden=!o.name;
  if(fig)fig.hidden=!o.img;
  if(nt){nt.textContent=o.note||'';nt.hidden=!o.note}
  // 場景：背景（360×180，2:1）上疊角色（靠右、腳貼下緣）與道具（置中），名牌在角色下方。有場景時不用右邊的頭像框
  const sc=$('pScene');sc.hidden=!o.scene;
  if(o.scene){
    const set=(c,k)=>{const e=sc.querySelector(c);e.hidden=!k;if(k)chrSet(e,k)};
    set('.sbg',o.scene.bg);set('.schr',o.scene.chr);set('.sitem',o.scene.item);
    const n=sc.querySelector('.sname');n.textContent=o.scene.name||'';n.hidden=!(o.scene.name&&o.scene.chr);
    if(fig)fig.hidden=true;if(nm_)nm_.hidden=true;
  }
}
// 圖片檔名（assets/ 底下，不含副檔名）→ 網址；單檔預覽版用打包好的 ASSETS
const assetImg=k=>(typeof ASSETS!=='undefined'&&ASSETS[k])||assetPath(k);   // 資料夾見 js/utils.js 的 ASSET_DIRS
// 人物立繪（v0.40.3）：檔名＝人物_方向_表情（xiaojun_L_0；L 面向左＝平常、R 面向右；0 正常 1 喜 2 怒 3 哀 4 樂 5 驚）。
// 後面加「+acc」（或「+配件」）＝疊上那個方向的配件圖 xiaojun_L_acc（例如言曉君工作時的耳麥）。配件圖和立繪同尺寸，
// 做法：<img> 的圖＝配件，背景＝立繪（同一個元素，跳動、點擊都跟著）。
function chrSplit(k){const m=String(k||'').match(/^(.*?)\+(?:acc|配件)$/);return m?{base:m[1],acc:m[1].replace(/_[^_]+$/,'_acc')}:{base:k,acc:''}}
function chrSet(el,k){el.dataset.chr=k;const o=chrOl(k);if(o){el.src=o;el.style.background='';return}
  const c=chrSplit(k);el.src=assetImg(c.acc||c.base);el.style.background=c.acc?`url('${assetImg(c.base)}') center/100% 100% no-repeat`:''}
function chrAttr(k){const o=chrOl(k),c=chrSplit(k);if(o)return `data-chr="${esc(k)}" src="${esc(o)}"`;   // 資安（v0.40.40）：屬性值都 esc
  return `data-chr="${esc(k)}" src="${esc(assetImg(c.acc||c.base))}"`+(c.acc?` style="background:url('${esc(assetImg(c.base))}') center/100% 100% no-repeat"`:'')}
// 白邊（v0.40.4）：新格式立繪（人物_L_／_R_）和玩家紙娃娃一樣由程式描白邊（js/doll.js dollOutline 的作法，粗細 DOLL_OUTLINE）。
// 配件和立繪先合成一張再描（白邊只描在外圍）。畫好轉成圖片網址記在 CHR_OL；畫好之前先顯示原圖，畫好後畫面上那張圖自動換掉。
// 本機直接開 index.html（file://）時瀏覽器不准把畫布轉成圖片，就維持原圖（GitHub Pages、單檔預覽版都正常）。
const CHR_OL={},CHR_OL_Q=[];let CHR_OL_BUSY=false;
const chrNew=k=>/_[LR]_[^_]+$/.test(chrSplit(k).base);
// first＝馬上要用（劇情這段的人物，v0.41.0）：排到隊伍最前面，不用等背景預先描的那些
function chrOl(k,first){if(!k||!chrNew(k))return '';
  if(CHR_OL[k]===undefined){CHR_OL[k]=false;CHR_OL_Q[first?'unshift':'push'](k);chrOlRun()}
  else if(first&&CHR_OL[k]===false){const i=CHR_OL_Q.indexOf(k);if(i>0){CHR_OL_Q.splice(i,1);CHR_OL_Q.unshift(k)}}
  return CHR_OL[k]||''}
function chrOlRun(){
  if(CHR_OL_BUSY||!CHR_OL_Q.length)return;CHR_OL_BUSY=true;
  const k=CHR_OL_Q.shift(),c=chrSplit(k),srcs=[c.base,c.acc].filter(Boolean);
  const next=()=>{CHR_OL_BUSY=false;setTimeout(chrOlRun,0)};
  // 遊戲頁（artifact）版的圖是附加檔案（v0.41.0）：先 fetch 成 blob 再畫，畫布才能輸出；fetch 不行就照舊直接讀
  const load=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=u});
  const get=s=>{const u=assetImg(s);if(/^(data|blob):/.test(u)||location.protocol==='file:'||typeof fetch!=='function')return load(u);
    return fetch(u).then(x=>{if(!x.ok)throw 0;return x.blob()}).then(b=>load(URL.createObjectURL(b))).catch(()=>load(u))};
  Promise.all(srcs.map(get)).then(ims=>{
    if(!ims[0]){CHR_OL[k]=null;next();return}
    const W=ims[0].naturalWidth,H=ims[0].naturalHeight,cv=()=>{const e=document.createElement('canvas');e.width=W;e.height=H;return e};
    const s=cv(),sg=s.getContext('2d');ims.forEach(i=>i&&sg.drawImage(i,0,0,W,H));
    const m=cv(),mg=m.getContext('2d');mg.drawImage(s,0,0);mg.globalCompositeOperation='source-in';mg.fillStyle='#fff';mg.fillRect(0,0,W,H);
    const o=cv(),og=o.getContext('2d'),r=Math.round(DOLL_OUTLINE*W/DOLL_W);
    olStamp(og,m,r);   // js/doll.js（v0.41.0：只蓋在圓的邊界＋內圈，49 次；原本 113 次）
    og.drawImage(s,0,0);ims.forEach(i=>i&&i.src.startsWith('blob:')&&URL.revokeObjectURL(i.src));   // fetch 來的暫存圖用完就丟
    try{CHR_OL[k]=o.toDataURL()}catch(e){CHR_OL[k]=null}   // （試過 toBlob：在手機模擬上反而慢很多，維持 toDataURL）
    if(CHR_OL[k])document.querySelectorAll('img[data-chr]').forEach(e=>{if(e.dataset.chr===k)chrSet(e,k)});
    next();
  });
}
// 開遊戲後先在背景把常用的立繪描好
function chrOlPreload(){[...Object.values(HALL_FLOORS).flatMap(f=>f.chr||[]),...Object.values(LOBBY_NPC).flatMap(n=>n.chr||[]),...SHOP_SCENE.chr,GRETE_IMG,GRETE_IMG2,
  ...Object.values(STORY_NPC).flatMap(n=>n.img?[n.img,n.img.replace(/_L_/,'_R_')]:[])].forEach(chrOl)}
{const go=()=>setTimeout(()=>{try{chrOlPreload()}catch(e){}},800);if(document.readyState==='complete')go();else addEventListener('load',go)}   // 整頁讀完才開始（v0.40.69：不和開頭搶網路）
;
/* ==== js/chat.js ==== */
// ===== 聊天染色：「聊天」鍵（v0.24.0 從玩耍選單拆出來）。選一個顏色聊同一個顏色的東西，累積 CHAT_RULE.need 次，小球就會染上那個顏色 =====
// 單色：核心染色（身體會跟著稍微染一點）。聽格蕾特提過雙色之後，可以分別指定「核心」或「外殼」，兩邊各自累積。
// S.tc／S.tb＝已染上的核心／外殼顏色（'' 為沒有）；S.chatC／S.chatB＝累積中的 [{c,n}]。聊天色優先於「核心染上代表色」。
const CHAT_SEL={core:null,shell:null,shell2:null,part:'core',style:'',soft:true};      // 選單裡目前選的顏色（核心／外殼／外殼第二色，null＝沒選）、正在指定哪個部位、外殼樣式（''單色｜v 上下｜h 左右）、柔和／分色
// 雜誌染色（v0.27，言盡的商店）：買了雜誌（META.tools 的 magV／magH），聊天框多一列「外殼：單色｜上下｜左右」＋「柔和｜分色」。
//   選了上下／左右時，外殼分成兩邊（shell＝上／左、shell2＝下／右），兩邊各自累積 CHAT_RULE.need 次（S.chatB／S.chatB2）。
//   兩邊都染好（S.tb、S.tb2）之後，外殼就變兩色（S.tbm、S.tbs）。之後想換樣式（上下↔左右、柔和↔分色），選好樣式聊一次就會換。
const MAG_SPLIT=false;                                  // 分色（一刀切開）先關掉，只有柔和（使用者 v0.28.6：效果不好，之後再想）
const magOwned=()=>['magV','magH'].filter(k=>META.tools.includes(k));
function rgbHsl(hex){
  const [r,g,b]=hexRgb(hex).map(v=>v/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;
  let hh=0;if(d){hh=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;hh=(hh*60+360)%360}
  return {h:hh,s:d?d/(1-Math.abs(2*l-1)):0,l};
}
// 大約是什麼顏色（用在文字裡）
function colName(hex){
  const {h,s,l}=rgbHsl(hex);
  if(l>.9)return '白';if(l<.15)return '黑';if(s<.14)return l>.55?'淺灰':'灰';
  if((h<18||h>=335)&&l>.72)return '粉';
  if(h>=15&&h<48&&l<.42)return '褐';
  if(h<15||h>=345)return '紅';if(h<42)return '橘';if(h<68)return '黃';if(h<165)return '綠';if(h<198)return '青';
  if(h<255)return '藍';if(h<290)return '紫';return '粉';
}
const sameCol=(a,b)=>{const x=hexRgb(a),y=hexRgb(b);return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2])<CHAT_RULE.near};

// 聊天框的內容（「聊天」鍵打開）：
//   一開始只有「普通聊天」；學會染色後多出「3×4 色票（最後一格是自訂顏色）＋小球預覽」與「推薦顏色」；
//   學會雙色後再多出「全部設定／設定核心／設定外殼」（決定下一個點的顏色要設定哪裡）。
// 預覽：用目前選的顏色（沒選的部位用已經染上的顏色）畫出小球染色後的樣子。再點同一個顏色可取消那一邊。
function chatBox(){
  const box=h('div',{class:'chatbox'});
  const go=color=>{$('ovPick').classList.remove('show');actChat(color)};
  box.append(h('div',{class:'crow'},h('button',{class:'cbtn',onclick:()=>go(false)},TEXT.chat.btnPlain)));
  if(!META.chatColor)return box;
  const X=TEXT.misc,dual=!!META.chatDual,show=c=>c?colName(c)+X.colorSuffix:X.none,T=TEXT.chat;
  const mags=dual?magOwned():[];
  // 上次選的（樣式、顏色、部位）都留著；只有沒雜誌時把樣式清掉
  if(CHAT_SEL.style&&!mags.includes(CHAT_SEL.style==='v'?'magV':'magH'))CHAT_SEL.style='';
  if(!CHAT_SEL.style&&S.tbm&&mags.includes(S.tbm==='v'?'magV':'magH'))CHAT_SEL.style=S.tbm;   // 已經是兩色：預設照現在的樣式
  if(!MAG_SPLIT)CHAT_SEL.soft=true;
  if(!CHAT_SEL.style){CHAT_SEL.shell2=null;if(CHAT_SEL.part==='shell2')CHAT_SEL.part='shell'}
  const bColor=h('button',{class:'cbtn main',onclick:()=>go(true)},TEXT.chat.btnColor);
  const info=h('div',{class:'chatinfo dim'}),pc=h('canvas',{width:96,height:96,class:'cprev'});
  const drawPrev=(t)=>{
    if(nLoaded<IMGN.length)return;
    const g=pc.getContext('2d');g.imageSmoothingEnabled=false;
    const gr=g.createLinearGradient(0,0,0,96);gr.addColorStop(0,'#2b7f93');gr.addColorStop(1,'#12485c');g.fillStyle=gr;g.fillRect(0,0,96,96);
    const st=CHAT_SEL.style,o={...S,tc:CHAT_SEL.core||S.tc,tb:(dual&&CHAT_SEL.shell)||S.tb,tb2:st?(CHAT_SEL.shell2||S.tb2):'',tbm:st,tbs:CHAT_SEL.soft?'soft':'split'},tt=(t||0)/1000;
    drawLarva(g,48,44+Math.sin(tt*.9)*2,0,Math.sin(tt*2)*.03,'idle_a',larvaLook(o),tt,1,1);
  };
  const keysOf=P=>P==='both'?['core','shell',...(CHAT_SEL.style?['shell2']:[])]:[P];
  // 注意：按鈕只建一次，之後只改文字／狀態（點擊時把按鈕拿掉重建，會被當成點到框外而關掉選單）
  const prow=h('div',{class:'crow'}),pb={};
  [['both',X.partAll],['core',X.partCore],['shell',X.partShell],['shell2','']].forEach(([k,t])=>prow.append(pb[k]=h('button',{class:'pbtn cbtn','data-p':k,onclick:()=>{CHAT_SEL.part=k;paint()}},t)));
  const partRow=()=>{                                                      // 部位按鈕（雙色）：選了上下／左右時，外殼分成兩個按鈕
    const sd=CHAT_SEL.style?T.side[CHAT_SEL.style]:null;prow.classList.toggle('c4',!!sd);
    pb.core.textContent=sd?X.core:X.partCore;pb.shell.textContent=sd?X.shell+sd[0]:X.partShell;pb.shell2.textContent=sd?X.shell+sd[1]:'';pb.shell2.hidden=!sd;
  };
  const srow=h('div',{class:'crow srow'}),yb=[];
  const styleRow=()=>yb.forEach(([b,k,v])=>{if(k==='style')b.classList.toggle('on',CHAT_SEL.style===v);else{b.classList.toggle('on',!!CHAT_SEL.style&&CHAT_SEL.soft===v);b.disabled=!CHAT_SEL.style}});
  srow.append(h('span',{class:'slab dim'},T.style));
  [['',T.styleOne],['v',T.styleV,'magV'],['h',T.styleH,'magH']].filter(x=>!x[2]||mags.includes(x[2])).forEach(([v,t])=>{
    const b=h('button',{class:'ybtn cbtn',onclick:()=>{CHAT_SEL.style=v;if(!v){CHAT_SEL.shell2=null;if(CHAT_SEL.part==='shell2')CHAT_SEL.part='shell'}styleRow();partRow();paint()}},t);yb.push([b,'style',v]);srow.append(b)});
  if(MAG_SPLIT){srow.append(h('span',{class:'sgap'}));[[true,T.soft],[false,T.split]].forEach(([v,t])=>{const b=h('button',{class:'ybtn cbtn',onclick:()=>{CHAT_SEL.soft=v;styleRow();paint()}},t);yb.push([b,'soft',v]);srow.append(b)})}
  const styleOnly=()=>!!(CHAT_SEL.style&&S.tb&&S.tb2&&(CHAT_SEL.style!==S.tbm||CHAT_SEL.soft!==(S.tbs!=='split')));   // 兩色都有了，只換樣式
  const paint=()=>{
    const P=CHAT_SEL.part,ks=keysOf(P);
    box.querySelectorAll('.sw1').forEach(b=>b.classList.toggle('sel',ks.every(k=>CHAT_SEL[k]===b.dataset.c)));
    box.querySelectorAll('.pbtn').forEach(b=>b.classList.toggle('on',b.dataset.p===P));
    info.textContent='';
    if(dual&&CHAT_SEL.style){const sd=T.side[CHAT_SEL.style];info.append(h('div',{},X.core+'：'+show(CHAT_SEL.core)),h('div',{},X.shell+sd[0]+'：'+show(CHAT_SEL.shell)),h('div',{},X.shell+sd[1]+'：'+show(CHAT_SEL.shell2)))}
    else if(dual)info.append(h('div',{},X.core+'：'+show(CHAT_SEL.core)),h('div',{},X.shell+'：'+show(CHAT_SEL.shell)));
    else info.textContent=X.infoColor+show(CHAT_SEL.core);
    bColor.disabled=!(CHAT_SEL.core||(dual&&(CHAT_SEL.shell||CHAT_SEL.shell2))||styleOnly());
    drawPrev(performance.now());
  };
  const choose=c=>{
    const ks=dual?keysOf(CHAT_SEL.part):['core'];
    const same=ks.every(k=>CHAT_SEL[k]===c);ks.forEach(k=>{CHAT_SEL[k]=same?null:c});paint();
  };
  const clear=()=>{CHAT_SEL.core=CHAT_SEL.shell=CHAT_SEL.shell2=null;paint()};
  if(mags.length){styleRow();box.append(srow)}
  if(dual){partRow();box.append(prow)}
  else CHAT_SEL.part='core';
  const grid=h('div',{class:'sgrid'});
  COLORS.forEach((c,i)=>grid.append(h('button',{class:'sw1',style:'background:'+c,'data-c':c,title:CNAME[i],'aria-label':CNAME[i],onclick:()=>choose(c)})));
  const cp=h('input',{type:'color',value:'#58a6ff','aria-label':X.customColor,title:X.customColor});
  cp.oninput=()=>choose(cp.value);
  grid.append(h('label',{class:'scust'},cp,h('span',{},X.custom)));
  const fr=h('div',{class:'cpv'},pc),cancel=h('button',{class:'cclr',onclick:clear},TEXT.chat.cancel);
  box.append(h('div',{class:'cmid'},grid,h('div',{class:'cfr'},fr),cancel,info),h('div',{class:'crow'},bColor));
  const fit=()=>{const n=grid.offsetHeight;if(n>0){fr.style.width=fr.style.height=n+'px'}};     // 小球框是正方形，邊長＝色票區的高度
  paint();setTimeout(fit,0);setTimeout(fit,80);
  const tm=setInterval(()=>{if(!pc.isConnected||!$('ovPick').classList.contains('show')){clearInterval(tm);return}fit();drawPrev(performance.now())},120);   // 預覽裡的小球輕輕晃動
  return box;
}

// 聊天（耗 1 行動，已包含在「玩耍」；不耗道具）：心情與信賴和「不喜歡也不討厭的玩具」相同。color＝true 時依選好的顏色聊
// 「聊天」鍵：打開聊天框（普通聊天＋學會染色後的色票）
function chatOpen(){pick(TEXT.chat.head,[{node:chatBox()}])}
function actChat(color){
  S.ap--;S.playedToday=true;
  const before=[...S.tagsFound];
  S.trust=clamp(S.trust+(hasTag('scholar')?Math.round(gain(2)/2):gain(2)));emote('q');
  const T=TEXT.chat,sel=[],st=color&&META.chatDual?CHAT_SEL.style:'',sd=st?T.side[st]:null;
  if(color){
    if(CHAT_SEL.core)sel.push(['core',CHAT_SEL.core]);
    if(META.chatDual&&CHAT_SEL.shell)sel.push(['shell',CHAT_SEL.shell]);
    if(st&&CHAT_SEL.shell2)sel.push(['shell2',CHAT_SEL.shell2]);
  }
  const shells=sel.filter(x=>x[0]!=='core');
  if(st&&(shells.length||(S.tb&&S.tb2))){                                 // 雜誌染色：和小球一起看雜誌
    const mag=NAME[st==='v'?'magV':'magH'],s1=CHAT_SEL.shell||S.tb,s2=CHAT_SEL.shell2||S.tb2;
    if(s1&&s2)say(fmt(T.magTalk,{mag,a:sd[0],b:sd[1],c:colName(s1),c2:colName(s2)}));
    else{const [p,c]=shells[0];say(fmt(T.magTalkOne,{mag,a:sd[p==='shell'?0:1],c:colName(c)}))}
    say(R(T.magReact));
    let done2=false;
    sel.forEach(([part,c])=>{
      const key={core:'chatC',shell:'chatB',shell2:'chatB2'}[part],arr=S[key]||(S[key]=[]),pv={c:colName(c)};
      let e=arr.find(x=>sameCol(x.c,c));if(!e){e={c,n:0};arr.push(e)}
      e.n++;
      if(e.n>=CHAT_RULE.need){
        S[{core:'tc',shell:'tb',shell2:'tb2'}[part]]=e.c;S[key]=[];META.chatWins=(META.chatWins||0)+1;codexSave();
        const dv={c:colName(e.c),a:part==='core'?'':sd[part==='shell'?0:1]};
        if(part==='core'){say(fmt(T.done.core,dv),'ev');toast(fmt(T.toast,dv))}else{say(fmt(T.done2,dv),'ev');done2=true}
        emote('heart');
      }else say(fmt(R(T['p'+e.n+(part==='core'?'':'s')]),pv),'ev');
    });
    if(S.tb&&S.tb2){
      const ns=CHAT_SEL.soft?'soft':'split',changed=S.tbm!==st||S.tbs!==ns;
      S.tbm=st;S.tbs=ns;
      const v={a:sd[0],b:sd[1],c:colName(S.tb)+TEXT.misc.colorSuffix,c2:colName(S.tb2)+TEXT.misc.colorSuffix,s:fmt(TEXT.misc.styleName,{soft:CHAT_SEL.soft?T.soft:T.split,style:T['style'+st.toUpperCase()]})};
      if(done2){say(fmt(T.doneTwo,v),'ev');toast(T.toastTwo)}else if(changed)say(fmt(T.styleSet,v),'ev');
      codexSave();
    }
  }
  else if(!sel.length)say(R(T.plain));
  else{
    const cn=colName(sel[0][1]),v={c:cn,things:T.things[cn]||TEXT.misc.things};
    if(sel.length===2)say(fmt(T.talkBoth,{...v,c2:colName(sel[1][1])}));
    else say(fmt(META.chatDual?T[sel[0][0]==='core'?'talkCore':'talkShell']:T.talk,v));
    say(R(T.react));
    sel.forEach(([part,c])=>{
      const key=part==='core'?'chatC':'chatB',arr=S[key],pv={c:colName(c)};
      let e=arr.find(x=>sameCol(x.c,c));if(!e){e={c,n:0};arr.push(e)}
      e.n++;
      if(e.n>=CHAT_RULE.need){
        S[part==='core'?'tc':'tb']=e.c;S[key]=[];META.chatWins=(META.chatWins||0)+1;if(part==='shell')S.tbm='';codexSave();   // 單色外殼：回到單色
        const dv={c:colName(e.c)};
        say(fmt(T.done[part],dv),'ev');toast(fmt(T.toast,dv));emote('heart');
      }else say(fmt(R(T['p'+e.n+(part==='core'?'':'s')]),pv),'ev');
    });
  }
  if(TEMPERS[S.temp].explorer)S.explore++;
  tagReact('play',{},before);
  refresh();
}
;
/* ==== js/souvenirs.js ==== */
// ===== 小球送的禮物與「偷偷七逃」 =====
// 規則的數字在 js/data/souvenirs.js，文字在 js/data/texts.js 的 TEXT.souv／TEXT.sneak。
const TEMPER_SOUV=Object.keys(SOUV_SRC).filter(k=>SOUV_SRC[k][0]==='temper').reduce((o,k)=>(o[SOUV_SRC[k][1]]=k,o),{});
const TAG_SOUV=Object.keys(SOUV_SRC).filter(k=>SOUV_SRC[k][0]==='tag').reduce((o,k)=>(o[SOUV_SRC[k][1]]=k,o),{});
const OUTSIDE_IDS=Object.keys(SOUV_SRC).filter(k=>SOUV_SRC[k][1]==='sneak');   // 偷偷七逃會帶回的東西
// 收到一份禮物：數量 +1、訊息區寫送禮的描述、水缸上方跳提示
function giveSouv(id,v){
  META.souv[id]=(META.souv[id]||0)+1;codexSave();
  const t=TEXT.souv[id];
  say(fmt(t.give,v||{}),'ev');toast(fmt(TEXT.misc.giftToast,{name:t.name}));
}
// 每天換日：依信賴與個性、標籤決定今天有沒有收到禮物
function souvDaily(){
  if(!S||S.over||S.day<2||S.trust<SOUV_RULE.trust)return 0;
  let n=0;
  if(Math.random()<SOUV_RULE.temper){giveSouv(TEMPER_SOUV[S.temp]);n++}
  S.tags.forEach(id=>{
    if(n>=SOUV_RULE.maxPerDay||id==='sneak'||!TAG_SOUV[id]||Math.random()>=SOUV_RULE.tag)return;
    giveSouv(TAG_SOUV[id]);n++;
  });
  return n;
}
// 偷偷七逃：換日時，幼體先從一側游出水缸，消失一會兒，再從另一側游進來（發現牠昨晚溜出去過）。
// force＝開發者模式直接觸發。動畫在 snStep（每格由 creature.js 的 step 呼叫），回到水缸時才寫文字、揭曉標籤、送禮物。
let SN=null;      // {ph:'out'|'gone'|'in', dir:出去的方向（-1 左／1 右）, until}
function sneakDaily(force){
  if(!S||S.over||SN||!hasTag('sneak'))return false;
  const first=!S.tagsFound.includes('sneak');
  if(!force&&!(S.day>=2&&(Math.random()<SOUV_RULE.sneak||(first&&S.day>=4))))return false;
  M=null;C.steering=false;
  SN={ph:'out',dir:C.x<250?-1:1,until:0};
  return true;
}
function snStep(t,dt){
  const s=SN;
  if(s.ph==='out'){                                         // 朝最近的一側游出去
    C.x+=s.dir*2.8*dt;C.vx=s.dir*2;C.vy=0;C.tx=s.dir;C.ty=0;
    if(C.x<-70||C.x>570){s.ph='gone';s.until=t+2800}
  }else if(s.ph==='gone'){                                   // 水缸裡暫時沒有牠
    if(t>s.until){
      s.ph='in';C.x=s.dir>0?-70:570;C.y=C.dy=110+Math.random()*150;C.vx=s.dir*2;C.tx=s.dir;       // 從另一側進來（方向不變，像是穿過水缸）
      say(R(TEXT.sneak.back),'ev');
      discoverTag('sneak');
      if(Math.random()<SOUV_RULE.sneakGift){const id=R(OUTSIDE_IDS);giveSouv(id,{item:TEXT.souv[id].item})};
    }
  }else{
    C.x+=s.dir*2*dt;C.vx=s.dir*2;
    if(C.x>WALL.l+30&&C.x<WALL.r-30){SN=null;C.next=0;C.steering=false}
  }
}
;
/* ==== js/settle.js ==== */
// ===== 每日結算：飽食、水質、生命、信賴的變化，核心變色事件，死亡與結局判定 =====
// 順序固定：① 飽食與水質 → ② 生命 → ③ 信賴 → ④ 事件 → ⑤ 死亡／結局 → 進入下一天
// 數值在 js/data/rules.js 的 DAY_RULE（v0.30 抽出），要調難度改那裡。文字在 js/data/texts.js。
function settle(){
  // ① 一天過去：肚子變餓（貪吃鬼餓得更快）、水變髒、酸鹼度隨機飄移
  const before=[...S.tagsFound];
  const DR=DAY_RULE;
  S.sat=clamp(S.sat-(hasTag('glutton')?DR.sat.glutton:hasTag('smalleat')?DR.sat.smalleat:DR.sat.normal));   // 貪吃鬼餓得快、不愛吃餓得慢
  const dirt0=S.dirt,clean=hasTag('clean');                                     // 愛乾淨：水變髒的速度減半、酸鹼度漂移小一半
  S.dirt=clamp(S.dirt+(clean?DR.dirt.clean:DR.dirt.normal));
  S.ph+=((Math.random()-0.5)*DR.ph.drift+(S.ph>7?DR.ph.bias:-DR.ph.bias))*(clean?DR.ph.cleanMul:1);
  S.ph=clamp(S.ph,DR.ph.min,DR.ph.max);

  // ② 生命：太餓、水質差會扣，照顧得好會回復
  let d=0;
  const LS=DR.lifeSat,LW=DR.lifeWater;
  d+=S.sat<LS.starve?LS.starveD:S.sat<LS.hungry?LS.hungryD:LS.okD;
  d+=waterSevere()?LW.severeD:waterBad()?LW.badD:LW.okD;
  if(hasTag('frail')&&d<0)d=Math.round(d*DR.frailMul);        // 虛弱：不好的狀況傷得更重
  S.life=clamp(S.life+d);

  // ③ 信賴：吃飽又健康 +2，否則 -5
  S.trust=clamp(S.trust+((S.sat>=DR.trust.sat&&S.life>DR.trust.life)?DR.trust.up:DR.trust.down));

  // 標籤的代價：貪玩太久沒玩、人類愛好者沒人陪都會掉信賴
  S.noPlay=S.playedToday?0:S.noPlay+1;
  const cost=[];
  const TC=DR.tagCost;
  if(hasTag('playful')&&S.noPlay>=TC.playfulDays){S.trust=clamp(S.trust-TC.playful);cost.push('playful')}
  if(hasTag('lovey')&&!S.playedToday){S.trust=clamp(S.trust-TC.lovey);cost.push('lovey')}
  if(clean&&S.dirt>TC.cleanDirt){S.trust=clamp(S.trust-TC.clean);cost.push('clean')}          // 愛乾淨：水真的髒了會悶悶不樂
  const vainOn=hasTag('vain')&&!!S.wear;                                        // 愛美：戴著裝扮心情好，沒戴會無聊
  if(hasTag('vain')){if(vainOn)S.trust=clamp(S.trust+TC.vain);else{S.trust=clamp(S.trust-TC.vain);cost.push('vain')}}
  S.playedToday=false;S.touchGain=0;

  // ④ 事件：核心變色（最早第 3 日；信賴 ≥60、互動 ≥2 次、生命 ≥50）
  const lines=hints();
  const ev=[];
  const CR=DR.color;
  if(!S.colored&&!S.tc&&S.day>=CR.day&&S.trust>=CR.trust&&S.bond>=CR.bond&&S.life>=CR.life){
    S.colored=true;setTimeout(()=>emote('heart'),400);ev.push(TEXT.settle.color);
  }
  S.waterToday=0;

  // ⑤ 死亡判定、第七日結局
  if(S.life<=0){finish('END-07');return}
  if(S.day>=7){finish(endCode());return}

  // 進入下一天
  S.day++;S.ap=2;
  say('','rule');                                      // 換日：先畫一條橫線分隔
  say(fmt(TEXT.settle.day,{day:S.day}),'sys');
  syncGuests(true);                                   // 勾選的同伴飄進來／飄出去
  lines.forEach(l=>say(l,'bad'));
  cost.filter(id=>S.tagsFound.includes(id)).forEach(id=>say(TEXT.tagCost[id],'bad'));
  // 愛乾淨：普通小球今天會變得有點霧的時候，牠的水還是清的 → 揭曉（最晚第 3 日一定揭曉）
  if(clean&&((clamp(dirt0+DR.dirt.normal)>35&&S.dirt<=35)||S.day>=3))discoverTag('clean');
  if(frailSym())discoverTag('frail');                 // 虛弱：水質或飢餓出現徵兆時揭曉
  if(hasTag('vain')&&(vainOn||S.day>=3))discoverTag('vain');   // 愛美：戴著裝扮過了一天（最晚第 3 日）揭曉
  if(hasTag('high')&&S.day>=2)discoverTag('high');      // 高高在上：過了一晚就看得出來
  tagReact('day',{},before.filter(id=>id!=='frail'||frailSym()));
  sneakDaily();souvDaily();                           // 偷偷七逃從缸邊游進來、小球送禮
  ev.forEach(e=>say(e,'ev'));
  if(!lines.length&&!ev.length)say(TEXT.temper[S.temp].mood);
  refresh();
  greteDaily();                                       // 換日完小助手先跑：東西不夠就跳提示
}
;
/* ==== js/endings.js ==== */
// ===== 結局判定（endCode）與結局畫面（finish）。結局文字在 js/data/endings.js =====
// 判定順序：特殊色彩 → 遺憾 → 親密 → 好奇探索 → 慢熱獨立 → 平穩。（提前消逝 END-07 由每日結算直接觸發）
function endCode(){
  if(S.colored&&!S.tc)return'END-05';                          // 核心被聊天染成別的顏色，就不算「染上你的代表色」
  const E=END_RULE;
  if(S.life<E.sadLife||S.trust<E.sadTrust)return'END-06';
  if(S.trust>=E.bondTrust&&S.bond>=E.bondN)return'END-02';
  if(S.explore>=E.explore&&TEMPERS[S.temp].explorer)return'END-03';     // 探索型個性（好奇、活潑）
  if(S.life>=E.lonerLife&&S.bond<=E.lonerBond)return'END-04';
  return'END-01';
}
function finish(code){
  S.over=code;refresh();codexRecord(code);
  const [t,x]=ENDS[code];
  $('et').textContent=`${code}　${t}`;
  const nmS=s=>withLarva(s,S.name);
  $('ex').textContent=nmS(x);
  // 摘要：表 1＝個性與發現的標籤（標籤用結局的那一句）｜表 2＝時間、喜歡、色彩（顏色寫 #色碼（色名））
  const X=TEXT.misc,look=larvaLook(S),hex=c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase(),col=c=>`${c.toUpperCase()}（${colName(c)}）`;
  const tr=(k,v)=>h('tr',{},h('th',{},k||''),h('td',{},v));
  // 一張表（欄寬一致）：個性、標籤 → 時間、喜歡（零食 / 玩具，同筆記欄）→ 色彩
  const core=S.tc||(S.colored?S.col:hex(look.core));
  const coreNote=S.tc?X.sumByChat:S.colored?X.sumDyed:X.sumNatural;
  const shell=S.tb?col(S.tb)+'｜'+X.sumByChat:X.sumPlain;
  const two=S.tbm&&S.tb2?col(S.tb2)+'｜'+(S.tbm==='v'?X.sumV:X.sumH):'';
  const tbl=h('table',{class:'etab'},tr(TEXT.temper[S.temp].name,TEXT.temper[S.temp].desc),...S.tagsFound.map(id=>tr(TEXT.tags[id].name,nmS(TEXT.tags[id].end||TEXT.tags[id].desc))),
    tr(X.sumTime,fmt(X.sumDays,{day:S.day})),tr(X.sumLike,NAME[S.pref.gift]+' / '+NAME[S.pref.toy]),
    tr(X.sumColor,X.core+'：'+col(core)+'｜'+coreNote),tr('',X.shell+'：'+shell),...(two?[tr('',X.sumTwo+'：'+two)]:[]));
  $('sum').textContent='';$('sum').append(tbl,h('p',{class:'dim'},X.sumSaved));
  setTimeout(()=>{if(PV)pvExit();$('ovEnd').classList.add('show')},code==='END-07'?1800:600);   // 等結局框的這段時間如果進了觀察水缸，先離開
}
;
/* ==== js/codex.js ==== */
// ===== 圖鑑、收藏與存檔 =====
// 資料存在瀏覽器（localStorage），可「下載進度／上傳進度」成 JSON 檔搬到別的裝置。
// 選單有三頁：說明與存檔／收藏（結局、個性、物品、裝飾）／小球們（以前養的每一隻）。
const CODEX_KEY='xenolarva.codex.v1';
let CODEX=[];          // 養過的每一隻小球（見 codexNorm 的欄位）
let GUEST_IDS=[];      // 勾選「放入水缸」的小球 id（最多 3 隻）
// ---------- 跨周目繼承的東西（META）：所有要存的欄位都寫在 SAVE_FIELDS 這張表 ----------
// 新增一個要存的欄位：只要在表裡加一列（預設值、怎麼從存檔讀、合併進度時怎麼合）。META 預設、存檔、讀檔、合併、清除存檔都會照這張表。
//   def：預設值（函式，每次給一份新的）｜read(d)：從存檔物件 d 讀出來並檢查（匯入的檔案不可信）｜merge：合併進度的方式
//     'or' 有一邊是 true 就 true｜'max' 取大的｜'union' 陣列取聯集｜'mine' 保留自己的｜'fill' 自己沒有才用對方的｜函式 (mine,theirs)=>合併後的值
//   save(v)：存檔時要先整理的（沒寫就原樣存）
// 欄位說明：intro 看過開場故事｜points 積分｜returned 已交還的小球 [{id,name,at,back,gift,temp,own,pg,pt,end,rnd,lkind,look}]（rnd＝交還時的輪數；look＝外觀，大樓背景用）
//   got 交還後仍算已收集的結局／個性／標籤｜homeUsed 交還掉的回歸者名額｜outMode 外出方式（random／map）｜rounds 完成過幾輪｜farewells 收到幾封「道別」信
//   letterMode 收到信紙的方式（popup／log）｜letters 收藏的信紙｜letterGot 各種信收過幾封｜crowns 玩耍拿過幾次王冠｜special 預約的特殊委託｜specialDone 完成過幾次特殊委託
//   visited 去過的地點｜buys 買過幾次｜achGot 領過的成就｜achSeen 達成過（跳過橫幅）的成就｜heartLv 心等｜hallMet／joanMet／silenceMet／xiaojunMet 看過大樓／瓊／賽倫絲／言曉君的開場
//   shopMet 見過言盡｜wears 有的裝扮｜tools 永久道具（指揮棒、水桶、雜誌）｜playMode 玩耍方式（quick／play）｜kit 水質檢測儀｜grete 遇見格蕾特｜greteMet 認識格蕾特
//   chatColor／chatDual 學會聊天染色／雙色｜chatWins 染色成功幾次｜souv 禮物收藏｜decor 撿到的裝飾｜hidden 在水缸隱藏的裝飾｜seen 見過的物品｜pname／pcol 玩家名字與代表色
//   doll 玩家的長相（紙娃娃）｜urgentAsked／urgent 言曉君問過緊急委託／已登記
const _list=a=>Array.isArray(a)?a:[];
const _gl=(a,ok)=>[...new Set(_list(a).map(String).filter(ok))];
const _num=(v,m)=>Math.max(0,Math.min(m,Math.floor(Number(v))||0));
const _str=(v,n)=>String(v==null?'':v).slice(0,n);
const _bool=k=>({def:()=>false,read:d=>d[k]===true,merge:'or'});
const _hue=v=>((+v||0)%360+360)%360;
const _look=l=>l&&parseColor(String(l.col||''))?{col:parseColor(String(l.col)),hue:_hue(l.hue),colored:!!l.colored,tc:parseColor(String(l.tc||''))||'',tb:parseColor(String(l.tb||''))||'',
  tb2:parseColor(String(l.tb2||''))||'',tbm:['v','h'].includes(l.tbm)?l.tbm:'',tbs:l.tbs==='split'?'split':'soft',day:Math.max(1,Math.min(7,+l.day||7))}:null;
const _byId=(mine,theirs)=>{theirs.forEach(x=>{if(!mine.some(y=>y.id===x.id))mine.push(x)});return mine};
const _maxKeys=(mine,theirs)=>{Object.keys(theirs).forEach(k=>{mine[k]=Math.max(mine[k]||0,theirs[k])});return mine};
const LETTER_KINDS=['normal','young','farewell'];
const SAVE_FIELDS={
  intro:_bool('intro'),
  points:{def:()=>0,read:d=>_num(d.points,999999),merge:'max'},
  returned:{def:()=>[],merge:(m,t)=>{t.forEach(r=>{const o=m.find(x=>x.id===r.id);if(!o)m.push(r);else if(r.gift)o.gift=true});return m},
    read:d=>_list(d.returned).filter(r=>r&&typeof r==='object').slice(0,500).map(r=>({id:_str(r.id||'',40),name:String(r.name||'小球').slice(0,8),at:_str(r.at,10),back:_str(r.back,10),gift:r.gift===true,
      temp:has(TEMPERS,r.temp)?r.temp:'',own:_list(r.own).map(String).filter(x=>has(TAGS,x)).slice(0,6),pg:has(NAME,r.pg)?r.pg:'',pt:has(NAME,r.pt)?r.pt:'',end:has(ENDS,r.end)?r.end:'',
      rnd:_num(r.rnd,99999),lkind:LETTER_KINDS.includes(r.lkind)?r.lkind:'',look:_look(r.look)}))},
  got:{def:()=>({end:[],temper:[],tag:[]}),merge:(m,t)=>{['end','temper','tag'].forEach(k=>{m[k]=[...new Set([...m[k],...t[k]])]});return m},
    read:d=>{const g=d.got&&typeof d.got==='object'?d.got:{};return {end:_gl(g.end,x=>has(ENDS,x)),temper:_gl(g.temper,x=>has(TEMPERS,x)),tag:_gl(g.tag,x=>has(TAGS,x))}}},
  homeUsed:{def:()=>0,read:d=>_num(d.homeUsed,9999),merge:'max'},
  outMode:{def:()=>'random',read:d=>d.outMode==='map'?'map':'random',merge:'mine'},
  rounds:{def:()=>0,read:d=>_num(d.rounds,99999),merge:'max'},
  letterMode:{def:()=>'popup',read:d=>d.letterMode==='log'?'log':'popup',merge:'mine'},
  letters:{def:()=>[],merge:_byId,
    read:d=>_list(d.letters).filter(x=>x&&typeof x==='object').slice(0,300).map(x=>({id:_str(x.id,40),from:_str(x.from,8),at:_str(x.at,10),kind:LETTER_KINDS.includes(x.kind)?x.kind:'normal',
      intro:_str(x.intro,400),body:_str(x.body,800),note:_str(x.note,200),note2:_str(x.note2,200),img:x.img!==false}))},
  letterGot:{def:()=>({normal:0,young:0,farewell:0}),read:d=>LETTER_KINDS.reduce((o,k)=>(o[k]=_num(d.letterGot&&d.letterGot[k],9999),o),{}),merge:_maxKeys},
  crowns:{def:()=>0,read:d=>_num(d.crowns,99999),merge:'max'},
  visited:{def:()=>[],read:d=>_gl(d.visited,x=>has(PLACES,x)),merge:'union'},
  buys:{def:()=>0,read:d=>_num(d.buys,99999),merge:'max'},
  specialDone:{def:()=>0,read:d=>_num(d.specialDone,99999),merge:'max'},   // 完成過幾次特殊委託（v0.30，成就用）
  special:{def:()=>null,merge:'fill',
    read:d=>d.special&&has(TEMPERS,d.special.temp)?{temp:d.special.temp,tags:_list(d.special.tags).map(String).filter(x=>has(TAGS,x)).slice(0,2),hue:_hue(d.special.hue),why:String(d.special.why||'').slice(0,200),rnd:_num(d.special.rnd,99999)}:null},
  achGot:{def:()=>[],read:d=>_gl(d.achGot,x=>ACH.some(a=>a.id===x)),merge:'union'},
  achSeen:{def:()=>[],read:d=>_gl(d.achSeen,x=>ACH.some(a=>a.id===x)),merge:'union'},
  heartLv:{def:()=>1,read:d=>Math.max(1,Math.min(HEART_RULE.max,_num(d.heartLv,9)||1)),merge:'max'},
  hallMet:_bool('hallMet'),joanMet:_bool('joanMet'),silenceMet:_bool('silenceMet'),xiaojunMet:_bool('xiaojunMet'),
  storyDiaryHide:_bool('storyDiaryHide'),
  wearOwn:{def:()=>[],read:d=>_gl(d.wearOwn,x=>DOLL_SHOP_WEAR.includes(x)),merge:'union'},   // v0.40.65：服飾店拿到的衣物（配飾）   // v0.40.61：主線日記本隱藏還沒觸發的
  yanxiangMet:_bool('yanxiangMet'),yanjieMet:_bool('yanjieMet'),yanxiangPt:_bool('yanxiangPt'),   // v0.40.59：4F 言巷、5F 言街見過｜言巷給過積分（心等 5）
  chDone:{def:()=>0,read:d=>Math.max(_num(d.chDone,9),[].concat(d.storyFree||[]).some(x=>x&&typeof x==='object')?1:0),merge:'max'},   // v0.40.59：主線完成到第幾章（舊存檔有中繼存檔＝1）
  farewells:{def:()=>0,read:d=>_num(d.farewells,9999),merge:'max'},
  shopMet:_bool('shopMet'),
  wears:{def:()=>[],read:d=>_gl(d.wears,x=>has(WEARS,x)),merge:'union'},
  tools:{def:()=>[],read:d=>_gl(d.tools,x=>['wand','bucket','magV','magH'].includes(x)),merge:'union'},
  playMode:{def:()=>'quick',read:d=>d.playMode==='play'?'play':'quick',merge:'mine'},
  kit:_bool('kit'),grete:_bool('grete'),greteMet:_bool('greteMet'),chatColor:_bool('chatColor'),chatDual:_bool('chatDual'),
  chatWins:{def:()=>0,read:d=>_num(d.chatWins,9999),merge:'max'},
  souv:{def:()=>({}),merge:_maxKeys,save:v=>Object.keys(SOUV_SRC).reduce((o,k)=>(v[k]>0&&(o[k]=v[k]),o),{}),
    read:d=>Object.keys(SOUV_SRC).reduce((o,k)=>{const n=Math.floor(Number(d.souv&&d.souv[k]));if(n>0)o[k]=Math.min(n,9999);return o},{})},
  decor:{def:()=>[],read:d=>_list(d.decor).filter(k=>has(DECOR,k)),merge:'union'},
  hidden:{def:()=>[],read:d=>_list(d.hidden).filter(k=>has(DECOR,k)),merge:'union'},
  seen:{def:()=>[],read:d=>_list(d.seen).filter(k=>has(NAME,k)),merge:'union'},
  pname:{def:()=>'',read:d=>String(d.pname||'').slice(0,8),merge:'fill'},
  pcol:{def:()=>'',read:d=>parseColor(String(d.pcol||''))||'',merge:'fill'},
  doll:{def:()=>null,read:d=>dollNorm(d.doll),merge:'fill'},   // v0.35：玩家的長相（紙娃娃，js/data/doll.js）；null＝還沒登記
  urgentAsked:_bool('urgentAsked'),urgent:_bool('urgent'),        // v0.35：言曉君問過要不要接緊急委託｜登記了（選「有」並完成長相登記）
  story:{def:()=>null,read:d=>storyNorm(d.story),merge:'fill'},   // v0.40：主線進度（這週開始時的狀態；js/story/*.js）
  storyFree:{def:()=>[null,null,null],read:d=>{const v=d.storyFree,a=Array.isArray(v)?v:[v];return [0,1,2].map(i=>storyNorm(a[i]))},merge:(m,t)=>m.map((x,i)=>x||t[i])},   // 中繼存檔 3 格（章末存；讀取＝自由模式）。v0.40.53 只有一筆（物件）＝讀成第 1 格
  storySlots:{def:()=>[null,null,null],read:d=>[0,1,2].map(i=>storyNorm(_list(d.storySlots)[i])),merge:(m,t)=>m.map((x,i)=>x||t[i])}   // 主線的手動存檔 3 格
};
const metaDefaults=()=>Object.keys(SAVE_FIELDS).reduce((o,k)=>(o[k]=SAVE_FIELDS[k].def(),o),{});
const META=metaDefaults();
// 存檔物件：v（格式版本）＋ META 的每個欄位 ＋ 圖鑑（codex）與同伴（guests）
const saveObj=()=>{const o={v:2};for(const k in SAVE_FIELDS){const F=SAVE_FIELDS[k];o[k]=F.save?F.save(META[k]):META[k]}o.codex=CODEX;o.guests=GUEST_IDS;return o};
// 合併：把 theirs（讀好的存檔）併進 META
function metaMerge(s){
  for(const k in SAVE_FIELDS){
    const m=SAVE_FIELDS[k].merge,a=META[k],b=s[k];
    META[k]=typeof m==='function'?m(a,b):m==='or'?(a||b):m==='max'?Math.max(a||0,b||0):m==='union'?[...new Set([...a,...b])]:m==='fill'?(a||b):a;
  }
}

// ---------- 讀取與驗證（匯入的檔案不可信，每個欄位都檢查）----------
function codexNorm(e){
  if(!e||typeof e!=='object')return null;
  const col=parseColor(String(e.col||''));if(!col)return null;
  return {
    id:String(e.id||Date.now().toString(36)+Math.random().toString(36).slice(2,6)).slice(0,40),
    name:String(e.name||'小球').slice(0,8),pname:String(e.pname||'').slice(0,8),col,
    hue:((+e.hue||0)%360+360)%360,colored:!!e.colored,tc:parseColor(String(e.tc||''))||'',tb:parseColor(String(e.tb||''))||'',
    tb2:parseColor(String(e.tb2||''))||'',tbm:['v','h'].includes(e.tbm)?e.tbm:'',tbs:e.tbs==='split'?'split':'soft',
    day:Math.max(1,Math.min(7,Math.round(+e.day)||7)),
    temp:has(TEMPERS,e.temp)?e.temp:'curious',end:has(ENDS,e.end)?e.end:'END-01',
    pg:has(NAME,e.pg)?e.pg:R(GIFTS),pt:has(NAME,e.pt)?e.pt:R(TOYS),      // 舊資料沒有記錄喜好時，隨機補一個（之後存檔就固定了）
    at:String(e.at||'').slice(0,10),
    star:!!e.star,hide:false,                                      // 星號（「隱藏」已拿掉，舊存檔隱藏的放回來）
    tags:(Array.isArray(e.tags)?e.tags:[]).map(String).filter(x=>has(TAGS,x)).slice(0,6),   // 已發現的特殊標籤（id）
    own:(Array.isArray(e.own)?e.own:[]).map(String).filter(x=>has(TAGS,x)).slice(0,6),      // 實際擁有的標籤（含沒被發現的，回歸者計數用）
    wear:has(WEARS,e.wear)?e.wear:'',                                                         // 戴著的裝扮
    wearCol:e.wearCol==='rainbow'?'rainbow':(parseColor(String(e.wearCol||''))||'')            // 發光裝扮的顏色（'' 或 rainbow＝彩虹）
  };
}
function readSave(d){
  d=(d&&typeof d==='object')?d:{};
  const o={};for(const k in SAVE_FIELDS)o[k]=SAVE_FIELDS[k].read(d);
  o.codex=_list(d.codex).map(codexNorm).filter(Boolean);o.guests=_list(d.guests).map(String);
  return o;
}
function codexLoad(){
  try{
    const s=readSave(JSON.parse(localStorage.getItem(CODEX_KEY)||'{}'));
    CODEX=s.codex;GUEST_IDS=s.guests;
    for(const k in SAVE_FIELDS)META[k]=s[k];
  }catch(e){}
}
const saveRaw=()=>{try{localStorage.setItem(CODEX_KEY,JSON.stringify(saveObj()))}catch(e){}};   // 只寫進瀏覽器（不檢查成就）
function codexSave(){saveRaw();if(typeof achSoon==='function')achSoon()}   // 存檔後檢查成就（js/hall.js）

// ---------- 收錄與查詢 ----------
function codexRecord(code){
  CODEX.push(codexNorm({name:S.name,pname:S.pname,col:S.col,hue:S.hue,colored:S.colored,tc:S.tc,tb:S.tb,tb2:S.tb2,tbm:S.tbm,tbs:S.tbs,day:S.day,temp:S.temp,end:code,
    pg:S.pref.gift,pt:S.pref.toy,wear:S.wear||'',wearCol:S.wearCol||'',tags:S.tagsFound,own:S.tags,at:new Date().toISOString().slice(0,10)}));
  codexSave();
}
function seeItem(k){if(has(NAME,k)&&!META.seen.includes(k))META.seen.push(k)}
const findLarva=id=>CODEX.find(e=>e.id===id);
// 會出現在水缸的同伴：勾選、活著、沒被隱藏，最多 3 隻
const guestEntries=()=>GUEST_IDS.map(findLarva).filter(e=>e&&e.end!=='END-07'&&!e.hide).slice(0,3);

function toggleGuest(id,on){
  GUEST_IDS=GUEST_IDS.filter(x=>x!==id);if(on)GUEST_IDS.push(id);
  GUEST_IDS=GUEST_IDS.slice(-3);codexSave();
  $('lmsg').textContent=on?TEXT.guest.queue:TEXT.guest.queueLeave;renderLarvae();
}
function toggleDecor(id,show){
  META.hidden=META.hidden.filter(x=>x!==id);if(!show)META.hidden.push(id);
  codexSave();
}
function toggleStar(id){const e=findLarva(id);if(e){e.star=!e.star;codexSave();renderLarvae()}}
// 儲存新名字（空白就當作取消）。RENAMING 是目前正在改名的那一隻的 id
function renameLarva(id,v){
  const e=findLarva(id),n=String(v).trim().slice(0,8);
  if(e&&n){e.name=n;GUESTS.forEach(g=>{if(g.e.id===id)g.name=n});codexSave()}
  RENAMING=null;renderLarvae();
}

// ---------- 小圖（把存下來的資料畫成一隻小球）----------
function thumb(c,e){
  if(nLoaded<IMGN.length){setTimeout(()=>thumb(c,e),300);return}
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  const gr=g.createLinearGradient(0,0,0,96);gr.addColorStop(0,'#2b7f93');gr.addColorStop(1,'#12485c');
  g.fillStyle=gr;g.fillRect(0,0,96,96);
  drawLarva(g,48,44,0,0,'idle_a',larvaLook(e),0,e.end==='END-07'?.45:1,1);
}
// 小球那一列共用的兩行：第幾日｜日期｜照顧者、標籤（小球們、觀察水缸的選擇都用）
const rowInfo=e=>[h('div',{class:'dim'},fmt(TEXT.misc.rowInfo,{day:e.day,at:e.at||'—',p:e.pname||'—'})),
  h('div',{class:'dim'},TEXT.misc.rowTags+(e.tags.length?e.tags.map(t=>TEXT.tags[t].name).join('、'):'—'))];
const tipSpan=(id)=>h('span',{class:'tipc','data-tip':TEXT.temper[id].desc,tabindex:0},TEXT.temper[id].name);

// ---------- 收藏（每個種類一頁，文字列表；沒發現的顯示 ？？？）----------
// 圖鑑（book）＝發現過的紀錄；收藏品（coll）＝持有的東西。兩頁共用 #pg_coll 這個畫面，分類不同（v0.31）
const COLL_SETS={book:['end','temper','tag','souv','letter'],coll:['item','tool','decor','wear']};   // 名字在 TEXT.misc.collTabs
let CSET='book';
const CT_OF={book:'end',coll:'item'};     // 每一頁目前選的分類
const CSEL={tool:null,wear:null};          // 道具／裝扮：選中的那一格
const UNK='？？？';
let REVEAL=false;      // 開發者模式：把所有收藏都顯示成已發現（不會存檔）
// 回傳這個種類的表頭與每一列。found＝已發現
function collData(k){
  const X_=TEXT.misc;
  if(k==='end'){
    const got=new Set([...CODEX.map(e=>e.end),...META.got.end]);
    return {head:[X_.colName,X_.colDesc],rows:Object.keys(ENDS).map(id=>got.has(id)||REVEAL?{found:1,cells:[ENDS[id][0],withLarva(ENDS[id][1],LARVA_FALLBACK)]}:{cells:[UNK,UNK]})};
  }
  if(k==='temper'){
    const got=new Set([...CODEX.map(e=>e.temp),...META.got.temper]);
    return {head:[X_.colName,X_.colDesc],rows:TEMPER_IDS.map(id=>got.has(id)||REVEAL?{found:1,cells:[TEXT.temper[id].name,TEXT.temper[id].desc]}:{cells:[UNK,UNK]})};
  }
  if(k==='item'){
    const seen=id=>REVEAL||META.seen.includes(id)||(id==='kit'&&META.kit),rows=[];
    ITEM_GROUPS.forEach(([label,ids])=>ids.forEach(id=>rows.push(seen(id)?{found:1,cells:[label,NAME[id],TEXT.item[id]]}:{cells:[label,UNK,UNK]})));
    return {head:[X_.colKind,X_.colName,X_.colDesc],rows};
  }
  if(k==='decor'){
    return {head:[X_.colShow,X_.colName,X_.colDesc],rows:Object.keys(DECOR).map(id=>META.decor.includes(id)||REVEAL
      ?{found:1,cells:[META.decor.includes(id)?h('input',{type:'checkbox',checked:!META.hidden.includes(id),'aria-label':X_.showInTank,onchange:ev=>toggleDecor(id,ev.target.checked)}):'—',DECOR[id].name,TEXT.decor[id]||'']}
      :{cells:['—',UNK,UNK]})};
  }
  if(k==='souv'){
    return {head:[X_.colName,X_.colSrc,X_.colCount,X_.colDesc],rows:Object.keys(SOUV_SRC).map(id=>{
      const n=META.souv[id]||0,[kind,key]=SOUV_SRC[id],t=TEXT.souv[id];
      const src=kind==='temper'?h('span',{class:'srcT'},TEXT.temper[key].name):kind==='grad'?h('span',{class:'srcL'},TEXT.letter.src):h('span',{class:'srcG'},TEXT.tags[key].name);
      return n>0||REVEAL?{found:1,cells:[t.name,src,String(n),t.desc]}
        :{cells:[UNK,UNK,'0',UNK]}})};
  }
  if(k==='letter')return {count:META.letters.length,rows:[],custom:letterList};
  if(k==='tool'){const own=COLL_TOOLS.filter(id=>META.tools.includes(id));return {count:own.length,rows:[],custom:box=>collGallery(box,'tool',own)}}
  if(k==='wear'){const own=Object.keys(WEARS).filter(id=>META.wears.includes(id));return {count:own.length,rows:[],custom:box=>collGallery(box,'wear',own)}}   // 收藏的信紙（js/letters.js 的 letterList；數量＝收藏幾封）
  const got=new Set(CODEX.reduce((a,e)=>a.concat(e.tags),[...META.got.tag]));   // 標籤：有小球在結局前被發現過就算
  return {head:[X_.colName,X_.colDesc],rows:Object.keys(TAGS).map(id=>got.has(id)||REVEAL?{found:1,cells:[TEXT.tags[id].name,TEXT.tags[id].desc]}:{cells:[UNK,UNK]})};
}
function renderColl(){
  const fb=$('cfilter');fb.textContent='';
  let CT=CT_OF[CSET];
  COLL_SETS[CSET].forEach(k=>{const t=TEXT.misc.collTabs[k];
    const d=collData(k);
    fb.append(h('button',{class:CT===k?'on':'',onclick:()=>{CT_OF[CSET]=k;renderColl()}},t,h('small',{},d.count!=null?String(d.count):`${d.rows.filter(r=>r.found).length}/${d.rows.length}`)));
  });
  const d=collData(CT),box=$('collBody');box.textContent='';
  if(d.custom){d.custom(box);return}
  box.append(h('table',{class:'ctab'},
    h('thead',{},h('tr',{},...d.head.map(t=>h('th',{},t)))),
    h('tbody',{},...d.rows.map(r=>h('tr',{class:r.found?'':'unk'},...r.cells.map(c=>h('td',{},c)))))));
}

// 收藏品的道具／裝扮：上（電腦在左）＝選中的那一格（圖、名字、言盡的介紹、怎麼來的），下（電腦在右）＝持有的格子。只顯示已持有的。
const COLL_TOOLS=['wand','bucket','magV','magH'];
const shopKeyOf=(kind,id)=>Object.keys(SHOP_ITEMS).find(k=>SHOP_ITEMS[k][kind]===id);
const shopTalk=(kind,id)=>{const k=shopKeyOf(kind,id);return k&&TEXT.shop.items[k]?TEXT.shop.items[k].talk||'':''};
function collPic(kind,id){
  if(kind==='wear')return wearIcon(id);
  const k=shopKeyOf('tool',id),im=h('img',{class:'sicon',alt:'',src:assetImg(SHOP_ITEMS[k].img)});return im;
}
function collGallery(box,kind,own){
  const X_=TEXT.misc;
  if(!own.length){box.append(h('p',{class:'dim'},kind==='wear'?X_.collNoWear:X_.collNoTool));return}
  if(!own.includes(CSEL[kind]))CSEL[kind]=own[0];
  const id=CSEL[kind],k=shopKeyOf(kind,id),it=SHOP_ITEMS[k]||{};
  const name=kind==='wear'?wearName(id):NAME[id];
  const from=it.hidden||!it.price?X_.collAch:fmt(X_.collShop,{n:it.price});
  const pic=collPic(kind,id);pic.classList.add('cgpic');
  const info=h('div',{class:'cginfo'},pic,h('div',{class:'cgtxt'},h('strong',{},name),h('span',{class:'dim'},from)),
    h('p',{class:'pp cgtalk'},shopTalk(kind,id)));
  const grid=h('div',{class:'dgrid cggrid'},...own.map(x=>h('button',{class:'dcell'+(x===id?' on':''),onclick:()=>{CSEL[kind]=x;renderColl()}},
    collPic(kind,x),h('span',{},kind==='wear'?wearName(x):NAME[x]))));
  box.append(h('div',{class:'cgal'},info,grid));
}

// ---------- 小球們 ----------
let LF='all';          // 目前的分頁：all 小球們（星號排前面）／dress 打扮／ret 已交還
let RENAMING=null;     // 正在改名的小球 id
// 名字那一列：平常是「名字 …… ✎」（筆固定在最右側）；按下筆後變成輸入框＋✔（儲存）＋✖（取消）
function nameRow(e){
  // 名字左邊：小小的星號方塊；右邊：改名（✎）
  const star=h('button',{class:'ib sq lstar'+(e.star?' on':''),'aria-pressed':String(!!e.star),'aria-label':e.star?TEXT.larvae.unstar:TEXT.larvae.star,title:TEXT.larvae.star,onclick:()=>toggleStar(e.id)},e.star?'★':'☆');
  if(RENAMING!==e.id){
    return h('div',{class:'nrow'},star,h('strong',{class:'nm'},e.name),
      h('span',{class:'nbtn'},h('button',{class:'ib pen','aria-label':TEXT.misc.rename,title:TEXT.misc.rename,onclick:()=>{RENAMING=e.id;renderLarvae()}},'✎')));
  }
  const inp=h('input',{type:'text',maxLength:8,value:e.name,class:'rn','aria-label':TEXT.misc.newName});
  const ok=()=>renameLarva(e.id,inp.value),no=()=>{RENAMING=null;renderLarvae()};
  inp.onkeydown=ev=>{if(ev.key==='Enter')ok();else if(ev.key==='Escape')no()};
  setTimeout(()=>{inp.focus();inp.select()},0);
  return h('div',{class:'nrow'},star,inp,
    h('span',{class:'nbtn'},h('button',{class:'ib sq','aria-label':TEXT.misc.saveName,onclick:ok},'✔'),
    h('button',{class:'ib sq','aria-label':TEXT.misc.cancelName,onclick:no},'✖')));
}
function larvaRow(e){
  const alive=e.end!=='END-07',L=TEXT.larvae;
  const c=h('canvas',{width:96,height:96});thumb(c,e);
  const mid=h('div',{class:'lmid'},
    nameRow(e),
    h('div',{},ENDS[e.end][0],' ｜ ',tipSpan(e.temp)),
    ...rowInfo(e),
    h('div',{class:'dim'},fmt(TEXT.misc.rowLike,{g:NAME[e.pg],t:NAME[e.pt]})+(e.wear?`｜${L.wearing}：${wearName(e.wear)}`:'')));
  const act=h('div',{class:'lact'});
  if(alive){
    const on=GUEST_IDS.includes(e.id);
    act.append(h('button',{class:'ib'+(on?' on':''),'aria-pressed':String(on),onclick:()=>toggleGuest(e.id,!on)},on?TEXT.misc.guestOff:TEXT.misc.guestOn));
    const rb=h('button',{class:'ib lret'},TEXT.assoc.ret);let armed=0,tm=null;       // 交還給異生會：離開圖鑑、換積分（按兩次確認）
    rb.onclick=()=>{
      if(!armed){armed=1;rb.textContent=fmt(TEXT.assoc.retConfirm,{pts:assocPts(e)});rb.classList.add('arm');tm=setTimeout(()=>{armed=0;rb.textContent=TEXT.assoc.ret;rb.classList.remove('arm')},4000);return}
      clearTimeout(tm);const msg=assocReturn(e);renderLarvae();$('lmsg').textContent=msg;
    };
    act.append(rb);
  }
  return h('div',{class:'lrow'+(alive?'':' dead')},c,mid,act);
}
function renderLarvae(){
  const L=TEXT.larvae,fb=$('lfilter');fb.textContent='';
  if(LF!=='ret')LF='all';
  // 分頁：小球們｜已交還｜（空一格）｜打扮（打扮用比較淡的顏色，和另外兩個區分）
  [['all',L.tabNow],['ret',L.tabRet],[null],['dress',L.tabDress]].forEach(([k,t])=>
    fb.append(k?h('button',{class:(LF===k?'on':'')+(k==='dress'?' tdress':''),onclick:()=>{if(k==='dress'){dressOpen();return}LF=k;renderLarvae()}},t):h('span',{class:'tgap'})));
  const box=$('llist');box.textContent='';
  if(LF==='ret'){        // 已交還：直接列出紀錄（名字｜交還日期｜信寄了沒）
    $('lstat').textContent=fmt(L.retStat,{n:META.returned.length})+`｜${TEXT.assoc.pts} ${META.points}`;
    if(!META.returned.length){box.append(h('p',{class:'dim'},L.retEmpty));return}
    [...META.returned].reverse().forEach(r=>box.append(h('div',{class:'rrow'},h('strong',{},r.name),h('span',{class:'dim'},fmt(L.retAt,{d:r.back||'—'})),h('span',{class:'dim'},r.gift?L.retLetter:''))));
    return;
  }
  const list=[...CODEX].reverse().sort((a,b)=>(b.star?1:0)-(a.star?1:0));   // 最新的在前，星號排最前面
  $('lstat').textContent=fmt(L.nowStat,{n:list.length})+`｜${TEXT.assoc.pts} ${META.points}`;
  if(!list.length)box.append(h('p',{class:'dim'},TEXT.misc.noLarva));
  list.forEach(e=>box.append(larvaRow(e)));
}

// ---------- 打扮（小球們的第二個分頁）----------
// v0.33.2 起是獨立彈出框 #ovDress（「小球們」的「打扮」打開）。
// 上＝預覽卡（左預覽＋名牌，右裝扮名稱＋言盡的介紹，右下「確定」）｜下＝分類列＋格子（框內捲動，至少 140px；太矮時整頁捲動）。電腦：左欄預覽卡、右欄分類＋格子。
// 分類列最前面是「小球」（v0.33.4 起是字，原本是目前那隻的小頭像），一條直槓，再接全部／頭飾／臉飾／圖示／其他。點小頭像＝格子換成小球清單（DRESS.cat='who'），選好一隻自動跳回原本的分類。
// 選好裝扮要按「確定」才會換上；換別隻或離開＝放棄。DRESS.who＝'_cur'（這一輪）或圖鑑 id；pick＝選的裝扮（'' 不戴）
const DRESS={who:null,pick:null,cat:'all',col:'rainbow',back:'all',msg:''};   // col：發光裝扮（螢光棒）選的顏色
function dressList(){
  const L=[];
  if(S&&!S.over&&!PV)L.push({id:'_cur',name:S.name,look:()=>larvaLook(S),wear:()=>S.wear||'',col:()=>S.wearCol||'rainbow',cur:true});
  [...CODEX].reverse().sort((a,b)=>(b.star?1:0)-(a.star?1:0)).filter(e=>e.end!=='END-07')
    .forEach(e=>L.push({id:e.id,name:e.name,look:()=>larvaLook(e),wear:()=>e.wear||'',col:()=>e.wearCol||'rainbow',e}));
  return L;
}
// clear＝透明底（分類列的小頭像、小球清單：直接用按鈕的底色，跟著配色變；v0.33.3）
function dressDraw(c,look,wear,col,tt,clear){
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  if(clear)g.clearRect(0,0,96,96);else{const gr=g.createLinearGradient(0,0,0,96);gr.addColorStop(0,'#2b7f93');gr.addColorStop(1,'#12485c');g.fillStyle=gr;g.fillRect(0,0,96,96)}
  if(nLoaded<IMGN.length){setTimeout(()=>dressDraw(c,look,wear,col,tt,clear),300);return}
  drawLarva(g,48,44,0,0,'idle_a',{...look,wear,wcol:col||look.wcol},tt||0,1,1);
}
// 會發光的裝扮：畫布持續重畫（彩虹會慢慢換色），離開畫面就停
function dressGlowLoop(c,look,wear,col,clear){
  if(!wear||!WEARS[wear]||!WEARS[wear].glow)return;
  const tm=setInterval(()=>{if(!c.isConnected){clearInterval(tm);return}dressDraw(c,look,wear,col,performance.now()/1000,clear)},100);
}
// DRESS.back：從小球清單選完要回到的分類｜DRESS.msg：剛換好時卡片上的一行字
function dressOpen(){DRESS.who=null;DRESS.pick=null;DRESS.msg='';if(DRESS.cat==='who')DRESS.cat=DRESS.back;$('dressTitle').textContent=TEXT.larvae.dressTitle;$('ovDress').classList.add('show');dressRefresh(true)}
function dressClose(){$('ovDress').classList.remove('show');if($('ovMenu').classList.contains('show'))renderLarvae()}
// 每點一下都整個重畫：記住整頁、格子、顏色列的捲動位置，畫完放回去（first＝剛打開，從頭開始）
function dressRefresh(first){
  const pg=$('pg_dress'),q=s=>pg.querySelector(s);
  const keep=first?null:{pg:pg.scrollTop,g:(q('.dgrid')||{}).scrollTop||0,c:(q('.dcols')||{}).scrollLeft||0,cat:DRESS.cat};
  pg.textContent='';dressRender(pg);
  if(keep){pg.scrollTop=keep.pg;const g=q('.dgrid'),c=q('.dcols');if(g&&keep.cat===DRESS.cat)g.scrollTop=keep.g;if(c)c.scrollLeft=keep.c}else pg.scrollTop=0;
}
function dressRender(box){
  const L=TEXT.larvae,list=dressList();
  if(!list.length){box.append(h('p',{class:'dim'},L.dressNoLarva));return}
  let who=list.find(x=>x.id===DRESS.who);
  if(!who){who=list[0];DRESS.who=who.id;DRESS.pick=null}
  if(DRESS.pick===null){DRESS.pick=who.wear();DRESS.col=who.col()}
  const larvaCv=x=>{const c=h('canvas',{width:96,height:96});dressDraw(c,x.look(),x.wear(),x.col(),0,true);dressGlowLoop(c,x.look(),x.wear(),x.col(),true);return c};
  // 預覽
  const glow=!!(DRESS.pick&&WEARS[DRESS.pick]&&WEARS[DRESS.pick].glow);
  const pv=h('canvas',{width:96,height:96,class:'dpvc'});dressDraw(pv,who.look(),DRESS.pick,DRESS.col);dressGlowLoop(pv,who.look(),DRESS.pick,DRESS.col);
  const changed=DRESS.pick!==who.wear()||(glow&&DRESS.col!==who.col());
  const done=h('button',{class:'ddone main',disabled:!changed,onclick:()=>dressApply(who)},L.dressDone);
  // 發光裝扮：選顏色（色票＋彩虹）
  const setCol=c=>{DRESS.col=c;DRESS.msg='';dressRefresh()};
  const colRow=glow?h('div',{class:'dcols'},h('span',{class:'t3'},L.dressColor),
    ...COLORS.map((c,i)=>h('button',{class:'sw1'+(DRESS.col===c?' sel':''),style:'background:'+c,title:CNAME[i],'aria-label':CNAME[i],onclick:()=>setCol(c)})),
    h('button',{class:'sw1 rainbow'+(DRESS.col==='rainbow'?' sel':''),title:L.dressRainbow,'aria-label':L.dressRainbow,onclick:()=>setCol('rainbow')})):null;
  if(colRow)colRow.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)&&colRow.scrollWidth>colRow.clientWidth){colRow.scrollLeft+=e.deltaY;e.preventDefault()}},{passive:false});   // 顏色列放不下時橫向捲動；電腦用滑鼠滾輪也能捲
  // 左：預覽＋小球名牌｜右：裝扮名稱＋言盡的介紹（＋發光裝扮的顏色），右下「確定」（v0.31.4 使用者要求）
  const talk=DRESS.pick?shopTalk('wear',DRESS.pick):'';
  const pvBox=h('div',{class:'dpv'},
    h('figure',{class:'dfig'},pv,h('div',{class:'pname'},who.name)),
    h('div',{class:'dinfo'},h('strong',{class:'dwear'},DRESS.pick?wearName(DRESS.pick):L.dressNone),
      talk?h('p',{class:'pp dtalk'},talk):null,colRow,DRESS.msg?h('p',{class:'dim dmsg',role:'status'},DRESS.msg):null,h('div',{class:'dact'},done)));
  // 分類列：小頭像｜全部 頭飾 臉飾 圖示 其他
  const cats=Object.keys(L.dressCats);
  const tabs=h('div',{class:'filter dcats'},
    h('button',{class:'dwhob'+(DRESS.cat==='who'?' on':''),title:L.dressWho,'aria-label':L.dressWho,onclick:()=>{if(DRESS.cat==='who')DRESS.cat=DRESS.back;else{DRESS.back=DRESS.cat;DRESS.cat='who'}dressRefresh()}},L.dressWhoTab),   // v0.33.4：寫字（使用者：小頭像跟著選中的小球變會讓人疑惑）
    h('span',{class:'dbar','aria-hidden':'true'}),
    ...cats.map(k=>h('button',{class:DRESS.cat===k?'on':'',onclick:()=>{DRESS.cat=k;dressRefresh()}},L.dressCats[k])));
  let grid;
  if(DRESS.cat==='who'){   // 小球清單（這一輪的＋圖鑑裡還在的）；選好自動跳回原本的分類
    grid=h('div',{class:'dgrid'},...list.map(x=>h('button',{class:'dcell'+(x.id===who.id?' on':''),onclick:()=>{if(x.id!==who.id){DRESS.who=x.id;DRESS.pick=null;DRESS.msg=''}DRESS.cat=DRESS.back;dressRefresh()}},
      larvaCv(x),h('span',{},x.cur?L.dressCur+'｜'+x.name:x.name))));
  }else if(!META.wears.length)grid=h('p',{class:'dim'},L.noWears);
  else{
    const own=META.wears.filter(id=>WEARS[id]&&(DRESS.cat==='all'||WEARS[id].cat===DRESS.cat));
    const cell=(id,label,pic)=>h('button',{class:'dcell'+(DRESS.pick===id?' on':'')+(who.wear()===id?' worn':''),onclick:()=>{DRESS.pick=id;DRESS.msg='';dressRefresh()}},pic,h('span',{},label));
    grid=h('div',{class:'dgrid'},cell('',L.dressNone,h('span',{class:'dnone'},'∅')),...own.map(id=>cell(id,wearName(id),wearIcon(id))));
  }
  box.append(h('div',{class:'dress'},pvBox,h('div',{class:'dpick'},tabs,grid)));
}
function dressApply(who){
  const L=TEXT.larvae,id=DRESS.pick,wc=id&&WEARS[id]&&WEARS[id].glow?DRESS.col:'';
  if(who.cur){S.wear=id;S.wearCol=wc;if(id&&hasTag('vain')){emote('heart');discoverTag('vain')}}   // 愛美：一戴上就很開心
  else{who.e.wear=id;who.e.wearCol=wc;GUESTS.forEach(g=>{if(g.e===who.e)g.look=larvaLook(who.e)})}   // 水缸裡的同伴馬上換上
  codexSave();
  const msg=id?fmt(L.dressOn,{name:who.name,item:wearName(id)}):fmt(L.dressOff,{name:who.name});
  say(msg,'sys');DRESS.pick=null;DRESS.msg=msg;dressRefresh();
}

// ---------- 選單頁面（從右上角 ☰ 各自打開，沒有切換頁籤）----------
// 頁面：larvae 小球們｜book 圖鑑｜coll 收藏品｜player 玩家設定（v0.35，js/flow.js playerBuild）｜save 設定與存檔（上方兩顆按鈕跳到該段）｜about 說明與公告。標題文字在 TEXT.layout.pages
let TAB='larvae';
const MENU_PAGES=['larvae','book','coll','player','save','about'];
const PAGE_ALIAS={info:'save',set:'save',news:'about'};
const PAGE_DOM={book:'coll'};             // 圖鑑和收藏品用同一個畫面
function showTab(n,sec){
  n=PAGE_ALIAS[n]||n;
  TAB=n;
  const dom=k=>PAGE_DOM[k]||k;
  MENU_PAGES.forEach(k=>{if(!PAGE_DOM[k])$('pg_'+k).hidden=(k!==dom(n))});
  $('menuTitle').textContent=TEXT.layout.pages[n];
  if(n==='coll'||n==='book'){CSET=n;renderColl()}
  if(n==='larvae')renderLarvae();
  if(n==='player')playerBuild();
  if(n==='save'){settingsBuild();$('saveText').value=JSON.stringify(saveObj())}
  $('pg_'+dom(n)).scrollTop=0;
  if(n==='save')jumpFit(sec);
  if(n==='about')['aboutBody','newsBody'].forEach(id=>{$(id).scrollTop=0});
}
function openMenu(tab,sec){$('cmsg').textContent='';$('lmsg').textContent='';RENAMING=null;$('ovMenu').classList.add('show');showTab(tab||'larvae',sec)}

// ---------- 下載、上傳、合併 ----------
// v0.40.69：日常進度、主線存檔分開下載；上傳自動看檔案裡有哪一邊（舊的整包檔案＝兩邊都有），模式＝合併／覆蓋
const STORY_SAVE_KEYS=['story','storyFree','storySlots','storyDiaryHide','chDone'];   // 主線那一份（chDone 兩邊都放：完成第幾章也影響日常）
const savePart=kind=>{const o=saveObj(),r={v:2,kind};
  if(kind==='story'){STORY_SAVE_KEYS.forEach(k=>r[k]=o[k]);return r}
  for(const k in o)if(k!=='v'&&(k==='chDone'||!STORY_SAVE_KEYS.includes(k)))r[k]=o[k];return r};
// artifact 頁面不能用 <a download>：有 downloads 能力就用它（GitHub 版照舊）
let SAVE_DL=null;try{if(window.claude&&typeof claude.use==='function')claude.use('downloads').then(d=>{SAVE_DL=d}).catch(()=>{})}catch(e){}
function codexDownload(kind){
  const txt=JSON.stringify(savePart(kind),null,1),name=kind==='story'?'xenolarva_story.json':'xenolarva_daily.json';
  if(SAVE_DL){SAVE_DL.save({filename:name,data:txt}).catch(e=>{if(e&&e.code!=='declined')$('cmsg').textContent=TEXT.misc.downBad});return}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
let SAVE_MODE='merge';   // 上傳模式：merge 合併（補上沒有的）｜over 覆蓋（檔案裡有的那一邊整個換掉）
// 這個檔案有哪一邊：kind 標記，沒有標記的舊檔案看欄位
function savePartsOf(d){if(d.kind==='story')return {story:true,daily:false};if(d.kind==='daily')return {story:false,daily:true};
  return {story:STORY_SAVE_KEYS.some(k=>k!=='chDone'&&d[k]!=null),daily:'codex' in d||'points' in d||'intro' in d}}
function codexImport(txt){let d;
  try{d=JSON.parse(txt);if(!d||typeof d!=='object'||Array.isArray(d))throw 0}catch(e){$('cmsg').textContent=TEXT.misc.mergeBad;return}
  const P=savePartsOf(d);if(!P.story&&!P.daily){$('cmsg').textContent=TEXT.misc.mergeBad;return}
  if(SAVE_MODE!=='over'){codexApply(d,P,false);return}
  const T=TEXT.misc,what=[P.daily&&T.partDaily,P.story&&T.partStory].filter(Boolean).join(T.partAnd);
  pick(fmt(T.overAsk,{what}),[{id:'go',label:T.overOk,main:true},{id:'back',label:T.overNo}],k=>{if(k==='go')codexApply(d,P,true)},T.overBody);
}
function codexApply(d,P,over){
  try{
    const s=readSave(d),T=TEXT.misc,msg=[];
    if(P.daily){
      if(over){CODEX=s.codex;for(const k in SAVE_FIELDS)if(!STORY_SAVE_KEYS.includes(k))META[k]=s[k];GUEST_IDS=s.guests.slice(-3);if(S)syncGuests(false);msg.push(T.overDaily)}
      else{let n=0;s.codex.forEach(e=>{if(!findLarva(e.id)&&!META.returned.some(r=>r.id===e.id)){CODEX.push(e);n++}});
        const SK=STORY_SAVE_KEYS.filter(k=>k!=='chDone'),keep={};SK.forEach(k=>keep[k]=META[k]);metaMerge(s);if(!P.story)SK.forEach(k=>META[k]=keep[k]);
        GUEST_IDS=[...new Set([...GUEST_IDS,...s.guests])].slice(-3);msg.push(fmt(T.mergeOk,{n}))}}
    if(P.story){
      if(over)STORY_SAVE_KEYS.forEach(k=>{META[k]=k==='chDone'?Math.max(META.chDone||0,s.chDone||0):s[k]});
      else if(!P.daily){const m={...SAVE_FIELDS};STORY_SAVE_KEYS.forEach(k=>{const F=m[k].merge,a=META[k],b=s[k];META[k]=typeof F==='function'?F(a,b):F==='max'?Math.max(a||0,b||0):F==='or'?(a||b):F==='fill'?(a||b):a})}
      msg.push(over?T.overStory:T.mergeStory)}
    // 主線存檔裡買過的衣物，日常也能用（同 storyOwnSync）
    const own=[META.story,...(META.storyFree||[]),...(META.storySlots||[])].filter(Boolean).flatMap(x=>x.wearOwn||[]);
    if(own.length)META.wearOwn=[...new Set([...(META.wearOwn||[]),...own])];
    prefillPlayer();codexSave();if(S&&over&&P.daily)refresh();showTab(TAB);
    $('cmsg').textContent=msg.join(' ');
  }catch(err){$('cmsg').textContent=TEXT.misc.mergeBad}
}
codexLoad();

// ---------- 清除存檔：圖鑑、同伴、物品、裝飾、玩家名字全部清空（目前進行中的周目不受影響）----------
function codexWipe(){
  CODEX=[];GUEST_IDS=[];
  Object.assign(META,metaDefaults());
  codexSave();
  if(S){syncGuests(false);refresh()}
  showTab(TAB);
  $('cmsg').textContent=TEXT.misc.wiped;
}
;
/* ==== js/render/canvas.js ==== */
// 水缸畫布與基本畫點函式。
// ---------- 像素水缸 ----------
const cv=$('tank'),cx=cv.getContext('2d');
const CVK=2;   // 水缸畫布內部 2 倍解析度（座標照舊用 500×500；v0.34）
cv.width=500*CVK;cv.height=500*CVK;cx.setTransform(CVK,0,0,CVK,0,0);
let dead=0,bounce=0,EM=null;
cx.imageSmoothingEnabled=false;
function px(x,y,w,h,col,al){cx.globalAlpha=al;cx.fillStyle=col;cx.fillRect(Math.round(x),Math.round(y),w,h)}
;
/* ==== js/render/sprites.js ==== */
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
;
/* ==== js/render/larva.js ==== */
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
  if(look.scar&&imgOK(IMG.scar_1)){g.globalAlpha=alpha*look.scar;g.drawImage(IMG.scar_1,0,0,96,96);g.globalAlpha=alpha}   // 傷疤（主線的特殊小球，v0.40）
  const hl=look.noHl?null:IMG['body_'+pose+'_L'];if(imgOK(hl)){g.globalAlpha=alpha*LARVA_FX.hl;g.drawImage(hl,0,0,96,96);g.globalAlpha=alpha}   // 光點：白色，不跟著換色
  g.imageSmoothingEnabled=sm;
  if(look.wear&&WEARS[look.wear]){                   // 裝扮（js/data/wears.js）
    const w=wearImg(look.wear),W_=WEARS[look.wear];
    if(W_.img){if(w.naturalWidth){const [bx,by]=coreAt('idle_a'),wx=Math.round(kx-bx),wy=Math.round(ky-by);if(w.naturalWidth>96){g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high'}g.drawImage(w,wx,wy,96,96);g.imageSmoothingEnabled=sm;if(W_.glow)drawGlow(g,look.wear,look.wcol,tt,wx,wy,96,96)}}   // 圖片版：照 idle_a 畫好，換姿勢時跟著核心移動
    else g.drawImage(w,Math.round(kx-w.width/2+W_.dx),Math.round(ky-w.height/2+W_.dy));
  }
  g.restore();
}
;
/* ==== js/render/emote.js ==== */
// 表情氣泡的繪製。圖案資料在 js/data/emotes.js。
// ---- 表情氣泡 ----
function emote(type){EM={type,t:performance.now()}}
// 任何一隻小球冒氣泡：玩家養的那隻用 EM，同伴存在自己身上（g.em）
function emoteOn(o,type){if(o===C)emote(type);else o.em={type,t:performance.now()}}
function drawEmote(t,x,y){if(EM&&!drawBubble(EM,t,x,y))EM=null}
// 畫一個氣泡；過期回傳 false
function drawBubble(em,t,x,y){
  const age=t-em.t;if(age>2000)return false;
  const ic=ICON[em.type],m=ic.m,K=5,T=3,P=12,w=Math.max(...m.map(r=>r.length))*K,h=m.length*K,al=age>1600?(2000-age)/400:1,pop=Math.min(1,age/150);
  const bw=w+P*2,bh=h+P*2,X=Math.round(Math.max(4,Math.min(WORLD.w-4-bw,x-bw/2))),Y=Math.round(Math.max(2,y-bh-14-Math.sin(age/200)*4-(1-pop)*16)),o='#3b6b80';
  px(X+T,Y,bw-2*T,bh,o,al);px(X,Y+T,bw,bh-2*T,o,al);
  px(X+2*T,Y+T,bw-4*T,bh-2*T,'#fff',al);px(X+T,Y+2*T,bw-2*T,bh-4*T,'#fff',al);
  px(x-2*T,Y+bh-T,4*T,T,'#fff',al);px(x-3*T,Y+bh-T,T,T,o,al);px(x+2*T,Y+bh-T,T,T,o,al);
  px(x-2*T,Y+bh,T,T,o,al);px(x+T,Y+bh,T,T,o,al);px(x-T,Y+bh,2*T,T,'#fff',al);px(x-T,Y+bh+T,2*T,T,o,al);
  m.forEach((row,j)=>{for(let i=0;i<row.length;i++)if(row[i]==='#')px(X+P+i*K,Y+P+j*K,K,K,ic.c,al)});
  cx.globalAlpha=1;
  return true;
}
;
/* ==== js/render/motion.js ==== */
// ===== 小球的共用移動（玩家養的那隻、圖鑑同伴都用這裡）=====
// 每個「身體」是一個物件：
//   x,y 位置｜vx,vy 速度｜tx,ty 想去的方向（速度會慢慢追上它）｜rot,rv 旋轉角度與角速度
//   next 下次換方向的時間｜home 自己的角落（頑固用）｜calm 這個時間前先回角落冷靜（頑固撞人後）
const PI2=Math.PI*2;
const WALL={l:40,r:460,t:48,b:308};
const WORLD={w:500,dx:0};                               // 水缸寬度（一般 500；預覽模式 750）。dx＝比 500 多出來的一半，用來把裝飾置中
const FLOOR_LOW=392;                                   // 睏睏可以躺到更低（水缸下方三分之一的沙地）
const floorOf=o=>(o===C?(S&&TEMPERS[S.temp].sleepy):(o.e&&TEMPERS[o.e.temp].sleepy))?FLOOR_LOW:WALL.b;                    // 活動範圍（水缸玻璃邊緣）
const IDLE_CYCLE=['idle_a','idle_b','idle_a','open_a','open_b','open_a','close','idle_b'];   // 待機時輪流用的姿勢

const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// 朝 p 前進的速度向量。s 是速度，s 為負數就是「遠離 p」。已經很近就停下。
function aim(o,p,s){const dx=p.x-o.x,dy=p.y-o.y,d=Math.hypot(dx,dy);return d<6?[0,0]:[dx/d*s,dy/d*s]}
// 隨機挑一個水缸底部的角落當「自己的領地」
function pickHome(){return {x:Math.random()<.5?WALL.l+16:WALL.r-16,y:304}}
// 目前在水缸裡、可以互動的小球（飄進／飄出中的不算）
const isLive=o=>o===C||o.phase==='live';

// 找離 o 最近的其他小球。回傳 {o:那隻或null, d:距離}
function nearest(o,ok){
  let best=null,bd=1e9;
  [...(PV?[]:[C]),...GUESTS].forEach(b=>{if(b===o||!isLive(b)||(ok&&!ok(b)))return;const d=dist(o,b);if(d<bd){bd=d;best=b}});
  return {o:best,d:bd};
}
// 找 o 附近的泡泡（range 範圍內最近的一顆）
function nearestBubble(o,range){
  let best=null,bd=range;
  BUB.forEach(b=>{if(b.y<60||b.y>320)return;const d=Math.hypot(b.x-o.x,b.y-o.y);if(d<bd){bd=d;best=b}});
  return best;
}

// 一般漫遊：每隔 1.5～4 秒隨機挑一個新方向。sp＝速度，low＝虛弱時往下沉一點
function wander(o,t,sp,low){
  const a=Math.random()*PI2,k=Math.random()<.6?1:.3;
  o.tx=Math.cos(a)*sp*k;
  o.ty=Math.sin(a)*sp*k*.6+(low?.15:0);
  if(isHigh(o)&&o.y>150)o.ty=-Math.abs(o.ty)-.2;          // 高高在上：往上游
  o.next=t+1500+Math.random()*2500;
}
// 標籤「高高在上」（玩家養的那隻看 S.tags；同伴看 e.own）
const isHigh=o=>o===C?hasTag('high'):!!(o.e&&(o.e.own||[]).includes('high'));
// 最近一次小球相撞的位置（guests.js 的 collide 記；守序會去勸架、好奇會去看熱鬧）
let HIT=null;
// 守序的巡邏路線（四個點繞圈；高高在上的話整條往上移）
const patrolPts=o=>{const dx=WORLD.dx,hi=isHigh(o);return [{x:110+dx,y:hi?80:120},{x:390+dx,y:hi?80:120},{x:390+dx,y:hi?170:260},{x:110+dx,y:hi?170:260}]};
const others=o=>[...(PV?[]:[C]),...GUESTS].filter(b=>b!==o&&isLive(b));

// 個性造成的「特別想去的地方」。回傳 [tx,ty]；沒有特別想法就回傳 null（照一般漫遊）。
// 玩家養的那隻和圖鑑同伴共用這段。T 是 TEMPERS 裡的一列。
function steer(o,t,T){
  if(T.patrol){                                          // 守序：附近有小球相撞就游過去勸架，平常照固定路線巡邏
    if(HIT&&t-HIT.t<1500&&HIT.a!==o&&HIT.b!==o&&t>(o.medCool||0)&&Math.hypot(HIT.x-o.x,HIT.y-o.y)<320){
      o.med={x:HIT.x,y:HIT.y,until:t+2200};o.medCool=t+9000;socialLog(o,HIT.a,'mediate',t);
    }
    if(o.med&&t<o.med.until)return aim(o,inTank(o.med,o),1.7);
    o.med=null;
    if(Math.floor(t/12000+(o.ph||0))%4===3)return null;   // 偶爾休息，隨便游一下
    const R_=patrolPts(o);if(o.wp==null)o.wp=Math.floor(Math.random()*4);
    if(dist(o,R_[o.wp])<30){o.wp=(o.wp+1)%4;o.wait=t+700}
    if(t<(o.wait||0))return [0,0];
    return aim(o,R_[o.wp],.75);
  }
  if(T.mimic&&Math.floor(t/10000+(o.ph||0)*3)%10<7){    // 易染：學附近小球的動作（守序優先），沒有同伴就學游標
    const ob=others(o);
    let m=ob.find(b=>TEMPERS[idOf(b)].patrol&&dist(o,b)<380)||nearest(o).o;
    if(m&&dist(o,m)>380)m=null;
    if(m){
      if(t>(o.mlog||0)){o.mlog=t+25000;socialLog(o,m,'mimic',t)}
      if(Math.abs(m.rv)>.04)o.rv+=m.rv*.06;               // 對方轉圈，自己也轉
      return dist(o,m)>150?aim(o,m,1.1):[m.vx*.95,m.vy*.95];   // 太遠先靠過去，近了就跟著同方向游
    }
    if(t-CUR.t<1200&&Math.abs(CUR.vx)+Math.abs(CUR.vy)>.3)return [Math.max(-1.6,Math.min(1.6,CUR.vx*.6)),Math.max(-1.2,Math.min(1.2,CUR.vy*.6))];   // 學游標的移動方向
    return null;
  }
  if(T.follow){                                          // 黏人（跟屁蟲）：每天挑一隻最喜歡的跟著；沒有同伴就黏你的游標
    const day=S?S.day:0;
    if(o.favDay!==day||(o.fav&&!isLive(o.fav))){o.favDay=day;const c=others(o);o.fav=c.length?R(c):null}
    if(!o.fav&&others(o).length){o.fav=R(others(o))}
    const ph=Math.floor(t/9000+(o.ph||0)*2)%3;           // 三段時間裡兩段在黏
    if(ph<2&&o.fav){
      if(t>(o.flog||0)){o.flog=t+30000;socialLog(o,o.fav,'follow',t)}
      const d=dist(o,o.fav);
      if(ph===1&&d<170){const a=t/700+(o.ph||0)*3;return aim(o,inTank({x:o.fav.x+Math.cos(a)*85,y:o.fav.y+Math.sin(a)*58},o),1.1)}   // 繞圈圈
      return d>95?aim(o,o.fav,1):[o.fav.vx*.8,o.fav.vy*.8];
    }
    if(ph<2&&!o.fav&&t-CUR.t<4000)return dist(o,CUR)>70?aim(o,inTank(CUR,o),.9):[0,0];
    return null;
  }
  if(T.nosy){                                            // 好奇（湊熱鬧）：哪裡有動靜就過去看一下，看完就走
    if(o.nosy&&t<o.nosy.until){
      const p=o.nosy.p;
      if(dist(o,p)<60){o.nosy.look=o.nosy.look||t;if(t-o.nosy.look>1500){o.nosy=null;o.ncool=t+7000;return null}return [Math.sin(t/300)*.15,0]}
      return aim(o,inTank(p,o),1.2);
    }
    o.nosy=null;
    if(t>(o.ncool||0)&&Math.random()<.02){
      const c=[];
      if(HIT&&t-HIT.t<2000)c.push({x:HIT.x,y:HIT.y});
      others(o).forEach(b=>{if(Math.hypot(b.vx,b.vy)>1.2&&dist(o,b)<320)c.push({x:b.x,y:b.y})});
      if(GAME&&GAME.kind==='bubble'&&GAME.parts&&GAME.parts.length){const b=GAME.parts[GAME.parts.length-1];c.push({x:b.x,y:b.y})}
      if(typeof visibleDecor==='function'&&Math.random()<.3)visibleDecor().forEach(id=>{const d=DECOR[id];c.push({x:d.x+WORLD.dx,y:Math.min(300,d.y-30)})});
      if(c.length){o.nosy={p:R(c),until:t+5000};o.ncool=t+7000;if(Math.random()<.25&&S&&!S.over)say(fmt(R(TEXT.social.nosy),{a:nameOf(o)}))}
    }
  }
  if(T.territory){                                       // 頑固：守自己的角落
    const n=nearest(o,b=>!isStubborn(b));                 // 頑固彼此不撞，只撞不是頑固的
    if(n.o&&n.d<150&&t>(o.calm||0))return aim(o,n.o,1.5);   // 有人闖進來：衝過去輕輕撞開
    if(o.home&&dist(o,o.home)>80)return aim(o,o.home,.6);   // 離角落太遠就慢慢游回去
    return null;
  }
  if(T.sleepy){                                          // 睏睏：每 4 段時間裡有 3 段躺在水缸下方的沙地睡覺，1 段慢慢游
    const ry=o.ry||(o.ry=isHigh(o)?58+Math.random()*18:340+Math.random()*45);   // 自己喜歡躺的高度（下方三分之一；高高在上＝浮在水面附近）
    if(o.moveTo&&t<o.moveTo.until)return aim(o,{x:o.moveTo.x,y:ry},.7);   // 被撞開後換地方
    if(Math.floor(t/8000+(o.ph||0)*3)%4!==0)return Math.abs(o.y-ry)>6?aim(o,{x:o.x,y:ry},.4):[0,0];
    return null;
  }
  if(T.bubbles){                                         // 活潑：追泡泡，碰到就戳破
    const b=nearestBubble(o,220);
    if(b){if(Math.hypot(b.x-o.x,b.y-o.y)<22){b.y=0}return aim(o,b,1.9)}   // b.y=0 → 畫面會讓它從底部重新冒出來
  }
  return null;
}

// 讓身體動一格：速度追上目標、移動、撞牆反彈、旋轉。still＝true 時不做撞牆旋轉（例如已經消逝）。
// 回傳撞牆的方向（0＝沒撞到），呼叫的人可以拿來做彈跳效果。
function moveBody(o,t,dt,still){
  o.vx+=(o.tx-o.vx)*.03*dt;o.vy+=(o.ty-o.vy)*.03*dt;
  o.x+=o.vx*dt;o.y+=o.vy*dt;
  let hit=0;
  if(o.x<WALL.l){o.x=WALL.l;o.vx=Math.abs(o.vx)+.25;o.tx=Math.abs(o.tx);hit=-1}
  else if(o.x>WALL.r){o.x=WALL.r;o.vx=-Math.abs(o.vx)-.25;o.tx=-Math.abs(o.tx);hit=1}
  if(o.y<WALL.t){o.y=WALL.t;o.vy=Math.abs(o.vy)+.15;o.ty=Math.abs(o.ty);hit=hit||.6}
  else if(o.y>floorOf(o)){o.y=floorOf(o);o.vy=-Math.abs(o.vy)*.5;o.ty=-Math.abs(o.ty)*.5;hit=hit||-.6}
  if(hit&&!still)o.rv=hit*(.08+Math.random()*.08);       // 撞牆時整隻轉一下
  // 旋轉會慢慢回到「順著游動方向微微傾斜」的角度
  const lean=Math.max(-.3,Math.min(.3,o.vx*.25))+Math.sin(t/900+(o.ph||0))*.05;
  const diff=((lean-o.rot+Math.PI*3)%PI2)-Math.PI;
  o.rv+=diff*.004*dt;o.rv*=Math.pow(.97,dt);o.rot+=o.rv*dt;
  return still?0:hit;
}
;
/* ==== js/render/social.js ==== */
// ===== 小球之間的互動（玩家養的那隻、圖鑑同伴共用）=====
// 規則來自設定總表分頁 3 的 A2：「主動方個性 × 對象個性」→ 行為。要改互動，改下面的 REL 表與 ACT 參數就好。
// 行為（REL 表裡的字）：
//   play      一起玩：靠近對方、繞著對方游（對方也願意的話，兩邊一起）
//   together  一起游：跟在對方旁邊一起游
//   chase     追逐：衝向對方一小段
//   tryPush   想湊過去：衝向頑固的小球，然後被牠輕輕撞開（撞開的規則在 guests.js 的 bump）
//   bounce    相撞：兩隻黏人互相衝過去，彈開好幾次才各做各的
//   nestle    窩在旁邊：靠過去，貼著睏睏待一陣子（害羞特別喜歡）
//   flee      躲開：對方靠近時短暫加速逃跑（這幾秒不會被碰撞彈回去）
//   null      沒有互動
// 頑固的「領地」（撞開靠近的人、退回角落）寫在 motion.js 的 steer；睏睏不主動理人，所以整列都是 null。
const REL={
  //          黏人      害羞    好奇        頑固       活潑        睏睏      守序        易染
  clingy:  {clingy:'bounce',shy:'chase',curious:'play',    stubborn:'tryPush',lively:'play',    sleepy:null,helper:'play',    mimic:'play'},
  shy:     {clingy:'flee',  shy:null,   curious:'flee',    stubborn:'flee',   lively:'flee',    sleepy:'nestle',helper:null,mimic:'flee'},
  curious: {clingy:'play',  shy:'chase',curious:'together',stubborn:'tryPush',lively:'play',    sleepy:null,helper:'play',    mimic:'play'},
  stubborn:{clingy:null,    shy:null,   curious:null,      stubborn:null,     lively:null,      sleepy:null,helper:null,      mimic:null},
  lively:  {clingy:'play',  shy:'chase',curious:'play',    stubborn:'tryPush',lively:'together',sleepy:null,helper:'play',    mimic:'chase'},
  sleepy:  {clingy:null,    shy:null,   curious:null,      stubborn:null,     lively:null,      sleepy:null,helper:null,      mimic:null},
  helper:  {clingy:'together',shy:null, curious:'together',stubborn:null,     lively:null,      sleepy:null,helper:'together',mimic:'together'},   // 守序：主要是巡邏和勸架（motion.js）
  mimic:   {clingy:null,    shy:null,   curious:null,      stubborn:null,     lively:null,      sleepy:null,helper:null,      mimic:null}         // 易染：學動作寫在 motion.js
};
// p＝每次「決定要做什麼」時發生的機率｜dur＝持續毫秒｜cd＝同一隻要隔多久才會再來一次
const ACT={
  play:{p:.25,dur:3000,cd:12000}, together:{p:.25,dur:3500,cd:12000},
  chase:{p:.10,dur:1800,cd:9000}, tryPush:{p:.25,dur:2000,cd:9000}, bounce:{p:.40,dur:4000,cd:12000},
  nestle:{p:.35,dur:9000,cd:6000}
};
// 相性好的組合：互動機率 ×1.6（文字上也會多一句）。要新增相性就加一組。
const FRIENDS=[['shy','sleepy'],['lively','curious'],['clingy','stubborn'],['helper','mimic']];
const isFriend=(a,b)=>FRIENDS.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
const idOf=o=>o===C?S.temp:o.e.temp;
// 目標點不能在水缸邊界外（否則會一直頂著牆原地打轉）
const inTank=(p,o)=>({x:Math.max(WALL.l+20,Math.min(WALL.r-20,p.x)),y:Math.max(WALL.t+20,Math.min(floorOf(o)-8,p.y))});

// 決定要不要對最近的小球做什麼。有開始就回傳 true
function socialPick(o,t){
  const n=nearest(o);if(!n.o||n.d>320)return false;
  const rel=REL[idOf(o)][idOf(n.o)],s=rel&&ACT[rel];
  if(!s||t<(o.cool||0)||Math.random()>s.p*(isFriend(idOf(o),idOf(n.o))?1.6:1))return false;
  o.mode=rel;o.partner=n.o;o.nx=0;o.mu=t+s.dur;o.next=o.mu;o.cool=t+s.cd;
  if((rel==='play'||rel==='together')&&REL[idOf(n.o)][idOf(o)]===rel&&!(n.o.mode&&t<n.o.mu)){   // 對方也想的話，一起
    Object.assign(n.o,{mode:rel,partner:o,mu:o.mu,next:o.mu,cool:o.cool});
  }
  socialLog(o,n.o,rel,t);
  return true;
}
// 進行中的互動，回傳 [tx,ty]；沒有就回傳 null
function socialSteer(o,t){
  if(!o.mode||t>=o.mu){o.mode=null;return null}
  const p=o.partner;
  if(!p||!isLive(p)){o.mode=null;return null}
  const d=dist(o,p);
  switch(o.mode){
    case 'play':{const a=t/600+(o.ph||0)*2+(o===C?0:Math.PI);return aim(o,inTank({x:p.x+Math.cos(a)*85,y:p.y+Math.sin(a)*60},o),1.2)}
    case 'together':return d>120?aim(o,p,.9):[p.vx*.9,p.vy*.9];
    case 'chase':case 'tryPush':return aim(o,p,1.1);
    case 'bounce':return aim(o,p,1.2);
    case 'nestle':{                                      // 窩在睏睏的一側（選有空間的那邊，不貼牆、不鑽進牆外）
      if(!o.nx)o.nx=(p.x<WORLD.w/2?1:-1)*80;
      if(p.x+o.nx<WALL.l+25||p.x+o.nx>WALL.r-25)o.nx=-o.nx;
      return aim(o,inTank({x:p.x+o.nx,y:p.y},o),.6);
    }
  }
  o.mode=null;return null;
}

// ---------- 躲開（害羞）：有人靠近就短暫加速逃跑，方向會避開牆壁，這幾秒不會被撞回去 ----------
function escapeDir(o,n){
  let dx=o.x-n.x,dy=o.y-n.y,d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
  const wall=Math.min(o.x-WALL.l,WALL.r-o.x,o.y-WALL.t,WALL.b-o.y),k=Math.max(0,Math.min(1,(110-wall)/110));   // 越靠牆 k 越大
  let cx_=WORLD.w/2-o.x,cy_=180-o.y;const cd=Math.hypot(cx_,cy_)||1;cx_/=cd;cy_/=cd;                              // 水缸中央的方向
  let px=-dy,py=dx;if(px*cx_+py*cy_<0){px=-px;py=-py}                                                        // 沿牆往開闊那側滑
  let vx=dx*(1-k)+cx_*k*.8+px*k*.6,vy=dy*(1-k)+cy_*k*.8+py*k*.6;const l=Math.hypot(vx,vy)||1;
  return [vx/l,vy/l];
}
function dashSteer(o,t){
  const id=idOf(o);
  if(t<(o.dash||0))return [o.dv[0]*2,o.dv[1]*2];
  if(t<(o.dcool||0))return null;
  const n=nearest(o);
  if(n.o&&n.d<130&&REL[id][idOf(n.o)]==='flee'){
    o.dv=escapeDir(o,n.o);o.dash=t+1100;o.dcool=t+3200;
    o.vx=o.dv[0]*1.8;o.vy=o.dv[1]*1.8;o.mode=null;socialLog(o,n.o,'flee',t);               // 立刻衝出去
    return [o.dv[0]*2,o.dv[1]*2];
  }
  return null;
}

// ---------- 頑固：兩隻頑固不要搶同一個角落，後來的換到另一邊 ----------
function fixHomes(){
  const st=[...(PV?[]:[C]),...GUESTS].filter(b=>b===C?(S&&TEMPERS[S.temp].territory):TEMPERS[b.e.temp].territory);
  for(let i=0;i<st.length;i++)for(let j=i+1;j<st.length;j++){
    if(Math.abs(st[i].home.x-st[j].home.x)>50)continue;
    const mv=st[j]===C?st[i]:st[j],nx=mv.home.x<WORLD.w/2?WALL.r-16:WALL.l+16;
    if(!st.some(b=>b!==mv&&Math.abs(b.home.x-nx)<50))mv.home={x:nx,y:304};   // 另一邊沒人才換
  }
}

// ---------- 互動的文字描述：同伴之間也會寫，間隔至少 12 秒（和頑固撞人的訊息共用間隔，避免洗版）----------
const nameOf=o=>nm(o===C?S.name:o.name);
function socialLog(o,p,rel,t){
  if(!S||S.over||t-lastBumpMsg<12000)return;
  const pool=TEXT.social[rel];if(!pool)return;
  lastBumpMsg=t;
  const v={a:nameOf(o),b:nameOf(p)};
  let line=fmt(R(pool),v);
  const ids=[idOf(o),idOf(p)].sort(),fr=TEXT.social.friend[ids.join('+')];       // 相性好的組合：用名字補一句
  if(fr&&Math.random()<.5)line+=fmt(fr,{x:idOf(o)===ids[0]?v.a:v.b,y:idOf(o)===ids[0]?v.b:v.a});
  say(line);
}
;
/* ==== js/render/creature.js ==== */
// ===== 玩家養的那隻幼體：游動、姿勢、被戳的反應 =====
// 共用的移動規則（撞牆、旋轉、漫遊、個性行為）在 js/render/motion.js；個性參數在 js/data/temperaments.js。
const C={x:250,y:180,vx:1,vy:.15,tx:1,ty:0,rot:0,rv:0,next:0,last:0,p:'idle_a',pt:0,
         lastPoke:0,dy:180,home:{x:56,y:304},calm:0,steering:false};
let PV=false;      // 預覽模式中（js/preview.js）
let M=null;        // 被戳後正在進行的反應：{k:反應名稱, until:結束時間, ...}。null＝沒有
let pokes=[];      // 最近被戳的時間（用來判斷「戳太多次」）

// ---------- 每一格的移動 ----------
function step(t){
  const dt=Math.min(3,(t-(C.last||t))/16.7);C.last=t;
  if(SN){snStep(t,dt);return}                                          // 偷偷七逃：游出去／游回來的動畫
  const T=TEMPERS[S.temp];
  const low=S.dirt>60||S.life<40||!!S.over||frailSym();              // 水髒、虛弱或已消逝：動作變慢、往下沉

  // 1) 被戳後的反應優先
  if(M){
    if(t>M.until){M=null;C.next=0}                        // 反應結束，馬上重新決定要去哪
    else{C.next=t+200;POKE[M.k].tick(M)}
  }
  // 2) 沒有反應時：先看個性有沒有特別想去的地方（領地、泡泡），否則隨機漫遊
  if(!M){
    const s=gameSteer(C,t)||((!low)&&(dashSteer(C,t)||judgeSteer(t)||loveySteer(t)||steer(C,t,T)||socialSteer(C,t)));   // 互動玩耍中（js/minigame.js）優先
    if(s){C.tx=s[0];C.ty=s[1];C.steering=true}
    else{
      if(C.steering){C.steering=false;C.next=0}
      if(t>C.next&&!(!low&&!S.over&&socialPick(C,t)))wander(C,t,S.over?0:low?.2:T.speed,low);
    }
  }
  // 太餓：每 20 秒冒一次刀叉泡泡
  if(S.sat<=35&&!S.over&&t-(C.lastFood||0)>20000){C.lastFood=t;emote('food')}
  // 3) 真正移動
  const hit=moveBody(C,t,dt,!!S.over);
  if(hit)bounce=Math.max(bounce,.5);                      // 撞牆時身體彈一下
}

// ---------- 姿勢選擇（每約 0.26 秒換一次）----------
function pickPose(t){
  const f=(t%440<220?'a':'b');                           // 兩格輪流，做出擺動感
  const T=TEMPERS[S.temp];
  if(M)return POKE[M.k].pose(M,f);                       // 被戳的反應
  if(EM&&t-EM.t<1800){                                   // 表情氣泡出現時配合動作
    if(EM.type==='heart')return 'reach_'+(t%400<200?'a':'b');
    if(EM.type==='x')return 'curl';
    return 'open_'+(t%500<250?'a':'b');
  }
  if(LV.on&&hasTag('lovey'))return 'open_'+f;            // 人類愛好者停下來看你
  if(S.over||S.life<40||S.dirt>60||S.sat<=20||frailSym())return 'droop';   // 不舒服
  const spd=Math.hypot(C.vx,C.vy);
  if(spd>.6)return 'flat_'+f;                            // 游動中
  if((C.y>=300||(T.sleepy&&hasTag('high')&&C.y<110))&&spd<.35)return 'rest';   // 貼在底部休息（睏睏＋高高在上：浮在水面睡）
  // 害羞（信賴低）或頑固（在自己的角落）偶爾縮起來
  if(((T.shyPose&&S.trust<35)||T.territory)&&Math.floor(t/5000)%3===0)return 'curl';
  if(S.trust>50&&Math.floor(t/6000)%3===0)return 'reach_'+f;   // 信賴高：偶爾揮手
  return IDLE_CYCLE[Math.floor(t/450)%IDLE_CYCLE.length];
}

// ---------- 被戳的反應表 ----------
// 每種反應有三個函式：
//   start(t,x,y)  開始時做的事（設定 M、表情氣泡、訊息）。x,y 是戳的位置。
//   tick(m)       反應進行中，每一格要做的事（通常是設定要游去哪）。
//   pose(m,f)     這段期間用哪個姿勢。f 是 'a' 或 'b'（輪流切換）。
// 個性用 TEMPERS[...].poke 指名要用哪一種；新增反應就在這裡加一項。
const clampN=(v,a,b)=>Math.max(a,Math.min(b,v));
function goTo(m,speed){const v=aim(C,m,speed);C.tx=v[0];C.ty=v[1];m.near=dist(C,m)<40}
const POKE={
  // 信賴太低：嚇一跳，往反方向退開（所有個性都一樣）
  flee:{
    start(t,x,y){
      const away=Math.atan2(C.y-y,C.x-x);
      M={k:'flee',until:t+2200};
      C.tx=Math.cos(away)*2.2;C.ty=Math.sin(away)*1.2;C.vx=C.tx;C.vy=C.ty;
      emote('ex');say(TEXT.poke.flee);
    },
    tick(){},
    pose(m,f){return 'flat_'+f}
  },
  // 黏人：游過來貼著你戳的地方
  come:{
    start(t,x,y){
      M={k:'come',until:t+3000,x:clampN(x,60,WALL.r-20),y:clampN(y,60,300)};
      emote(S.trust>=40?'heart':'q');say(TEXT.poke.come);
    },
    tick(m){goTo(m,1)},
    pose(m,f){return m.near?'reach_'+f:'flat_'+f}
  },
  // 害羞：縮成一團，躲到最近的底部角落
  hide:{
    start(t){
      M={k:'hide',until:t+5000,x:C.x<WORLD.w/2?WALL.l+12:WALL.r-12,y:306};
      emote('q');say(TEXT.poke.hide);
    },
    tick(m){goTo(m,1.4)},
    pose(){return 'curl'}
  },
  // 好奇：停在原地，朝你揮觸肢
  wave:{
    start(t){M={k:'wave',until:t+2200};emote('ex');say(TEXT.poke.wave)},
    tick(){C.tx=0;C.ty=0},
    pose(m,f){return 'reach_'+f}
  },
  // 頑固：背過身去，慢慢游回自己的角落
  turn:{
    start(t){
      M={k:'turn',until:t+3500,x:C.home.x,y:C.home.y};
      emote('x');say(TEXT.poke.turn);
    },
    tick(m){goTo(m,.7)},
    pose(){return 'curl'}
  },
  // 睏睏：慢吞吞地伸展觸肢，然後又睡回去
  stretch:{
    start(t){M={k:'stretch',until:t+3200};emote('q');say(TEXT.poke.stretch)},
    tick(){C.tx=0;C.ty=0},
    pose(m,f){return 'reach_'+f}
  },
  // 喜歡觸碰（標籤）：不退開，伸出觸肢碰你戳的地方
  touch:{
    start(t,x,y){
      M={k:'touch',until:t+2500,x:clampN(x,60,WALL.r-20),y:clampN(y,60,300)};
      emote('heart');say(TEXT.poke.touch);
    },
    tick(m){goTo(m,.5)},
    pose(m,f){return 'reach_'+f}
  },
  // 活潑：原地轉好幾圈
  spin:{
    start(t){
      M={k:'spin',until:t+1800};
      C.rv=(Math.random()<.5?-1:1)*.5;                    // 給一個很大的轉速，它會自己慢慢停下來
      emote('star');say(TEXT.poke.spin);
    },
    tick(){C.tx=0;C.ty=0},
    pose(m,f){return 'flat_'+f}
  }
};

function poke(x,y){
  const t=performance.now();
  if(SN||t-C.lastPoke<500)return;                        // 戳太快不算；溜出去的時候戳不到
  C.lastPoke=t;pokes=pokes.filter(v=>t-v<10000);pokes.push(t);bounce=1;
  const touchy=hasTag('touchy');
  if(pokes.length>=(touchy?9:6)){                        // 10 秒內戳 6 次：煩躁，扣一點信賴（喜歡觸碰的小球 9 次）
    S.trust=clamp(S.trust-2);emote('x');say(TEXT.poke.tooMany,'bad');pokes=[];refresh();return;
  }
  let kind=S.trust<=25?'flee':TEMPERS[S.temp].poke;      // 信賴太低一律先退開
  if((touchy||hasTag('homereturn'))&&['flee','hide','turn'].includes(kind))kind='touch';   // 喜歡觸碰、回歸者：不會躲開
  const before=[...S.tagsFound];
  POKE[kind].start(t,x,y);
  if(touchy){
    if(S.touchGain<3){S.touchGain++;S.trust=clamp(S.trust+1);refresh()}   // 每天最多 3 次小幅加信賴
    discoverTag('touchy');
  }
  tagReact('poke',{},before,.5);
  if(S.grete&&S.trans){const vl=voiceLine();say(vl,vl===TEXT.grete.nothing?'ev':'voice');if(VOICE_FOUND){const id=VOICE_FOUND;VOICE_FOUND=null;discoverTag(id)}}                // 格蕾特的翻譯：心聲
}

// 點擊或觸碰幼體本身才算「戳」
cv.addEventListener('pointerdown',e=>{
  if(!S||S.over)return;
  const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)*WORLD.w/r.width,y=(e.clientY-r.top)*500/r.height;
  if(GAME&&GAME.tap){GAME.tap(x,y);return}                // 互動玩耍中：點水缸交給遊戲（例如選鈴鐺藏哪）
  if(GAME){CUR.x=x;CUR.y=y;CUR.t=performance.now();return}   // 指揮棒、氣泡棒：按下去的位置也算游標
  if(PV){pvPoke(x,y);return}
  if(Math.abs(x-C.x)<52&&Math.abs(y-((C.dy||C.y)-6))<52)poke(x,y);
});
// 記下游標在水缸上的位置（人類愛好者會追）
cv.addEventListener('pointermove',e=>{
  const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)*WORLD.w/r.width,y=(e.clientY-r.top)*500/r.height,now=performance.now(),k=Math.max(1,(now-CUR.t)/16.7);
  if(now-CUR.t<200){CUR.vx=CUR.vx*.7+(x-CUR.x)/k*.3;CUR.vy=CUR.vy*.7+(y-CUR.y)/k*.3}else{CUR.vx=0;CUR.vy=0}   // 游標的移動速度（易染會學）
  CUR.x=x;CUR.y=y;CUR.t=now;
});
cv.style.cursor='pointer';
;
/* ==== js/render/guests.js ==== */
// ===== 圖鑑同伴：以前養的小球在水缸裡游動、追逐、互撞 =====
// 只是互動要素，沒有生命與需求。移動規則在 js/render/motion.js，個性參數在 js/data/temperaments.js。
// 同伴有三個階段（g.phase）：
//   'in'   從畫面邊緣或上方緩緩飄進來（不參與碰撞）
//   'live' 正常游動、追逐、互撞
//   'out'  緩緩飄出畫面後消失
let GUESTS=[];
const FLY_IN=3000, FLY_OUT=2600;     // 飄進／飄出花的時間（毫秒）
let lastBumpMsg=0;

// ---------- 進場與離場 ----------
function makeGuest(e){
  const side=R(['top','top','left','right']);              // 從上方飄下，或從左右側飄進來
  const g={e,name:e.name,phase:'in',t0:null,dur:FLY_IN,al:0,
    x:0,y:0,vx:0,vy:0,tx:0,ty:0,rot:0,rv:0,bn:0,next:0,steering:false,mode:'wander',mu:0,
    p:'open_a',pt:0,ph:Math.random()*6,look:larvaLook(e),home:pickHome(),calm:0};
  g.ex=WALL.l+70+Math.random()*(WALL.r-WALL.l-140);g.ey=100+Math.random()*180;   // 最後停下來的位置
  if(side==='top'){g.sx=g.ex;g.sy=-70}
  else if(side==='left'){g.sx=-70;g.sy=g.ey}
  else{g.sx=WORLD.w+70;g.sy=g.ey}
  g.x=g.sx;g.y=g.sy;
  return g;
}
function leaveGuest(g){
  g.phase='out';g.t0=null;g.dur=FLY_OUT;g.sx=g.x;g.sy=g.y;
  if(Math.random()<.4){g.ex=g.x;g.ey=-80}                  // 往上飄走
  else{g.ex=g.x<WORLD.w/2?-80:WORLD.w+80;g.ey=g.y}                      // 或往最近的側邊飄走
}
// 飄動中的每一格：緩入緩出地移動，帶一點晃動，淡入或淡出
function flyStep(g,t){
  if(g.t0==null)g.t0=t;
  const k=Math.min(1,(t-g.t0)/g.dur),e=k*k*(3-2*k);        // e：0→1 的緩入緩出
  const sway=Math.sin((t-g.t0)/420+g.ph)*(g.phase==='in'?1-e:e)*16;
  g.x=g.sx+(g.ex-g.sx)*e+(g.sx===g.ex?sway:0);               // 垂直飄時才左右晃
  g.y=g.sy+(g.ey-g.sy)*e+(g.sy===g.ey?sway*.6:0);            // 水平飄時才上下晃
  g.rot=Math.sin((t-g.t0)/500+g.ph)*.2;
  g.al=g.phase==='in'?Math.min(1,.25+e*1.2):1-e*e;
  if(k>=1){
    if(g.phase==='in'){g.phase='live';g.t0=null;g.al=1;g.vx=g.vy=0;g.tx=g.ty=0;g.next=0}   // 到位，開始互動
    else g.gone=true;                                                                    // 飄出去了，等一下移除
  }
}
// 依圖鑑勾選同步水缸裡的同伴：新勾的飄進來，取消勾選的飄出去（開新周目與每次換日時呼叫）
// announce＝true 時在訊息區寫一行
function syncGuests(announce){
  const want=guestEntries();
  GUESTS.forEach(g=>{
    if(g.phase!=='out'&&!want.some(e=>e.id===g.e.id)){
      leaveGuest(g);
      if(announce)say(fmt(TEXT.guest.leave,{name:nm(g.name)}));
    }
  });
  want.forEach(e=>{
    if(!GUESTS.some(g=>g.e.id===e.id&&g.phase!=='out')){
      GUESTS.push(makeGuest(e));
      if(announce){say(fmt(TEXT.guest.join,{name:nm(e.name)}),'ev');const j=TEXT.temper[e.temp].join;if(j)say(fmt(j,{name:nm(e.name)}),'ev')}
    }
  });
}

// ---------- 每一格的行動 ----------
function stepGuests(t){
  const dt=Math.min(3,(t-(stepGuests.last||t))/16.7);stepGuests.last=t;
  GUESTS.forEach(g=>{
    g.bn*=.96;
    if(g.phase!=='live'){flyStep(g,t);return}
    const T=TEMPERS[g.e.temp];
    // 躲開 → 個性特別行為（領地、追泡泡、睡覺）→ 對其他小球的互動（見 social.js）→ 一般漫遊
    const tgt=gameSteer(g,t)||dashSteer(g,t)||pkSteer(g,t)||steer(g,t,T)||socialSteer(g,t);   // 互動玩耍中（js/minigame.js）優先
    if(tgt){g.tx=tgt[0];g.ty=tgt[1];g.steering=true}
    else{
      if(g.steering){g.steering=false;g.next=0}
      if(t>g.next&&!socialPick(g,t))wander(g,t,T.speed,false);
    }
    if(moveBody(g,t,dt,false))g.bn=Math.max(g.bn,.5);
  });
  GUESTS=GUESTS.filter(g=>!g.gone);
  fixHomes();collide(t);
}

// ---------- 互相碰撞 ----------
const isStubborn=o=>!!TEMPERS[o===C?S.temp:o.e.temp].territory;
function collide(t){
  if(GAME&&!GAME.done&&['wand','bell','bucket'].includes(GAME.kind))return;   // 互動玩耍（追指揮棒、找鈴鐺、搶水桶）時暫時不互撞
  const bodies=[...(PV||(S&&S.over)?[]:[C]),...GUESTS.filter(g=>g.phase==='live')];
  const R2=68;                                                // 兩隻靠得比這個近就算碰到
  for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
    const a=bodies[i],b=bodies[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
    if(d>=R2||d===0)continue;
    const nx=dx/d,ny=dy/d,ov=(R2-d)/2;
    const da=t<(a.dash||0),db=t<(b.dash||0);
    if(da||db){                                              // 有人正在逃跑：只把另一隻推開，逃跑的不會被彈回去
      if(!da){a.x-=nx*ov*2;a.y-=ny*ov*2}else if(!db){b.x+=nx*ov*2;b.y+=ny*ov*2}
      bump(a,b,nx,ny,t);bump(b,a,-nx,-ny,t);continue;
    }
    if(!HIT||t-HIT.t>400)HIT={x:(a.x+b.x)/2,y:(a.y+b.y)/2,t,a,b};   // 記下相撞的位置（守序、好奇會過來）
    a.x-=nx*ov;a.y-=ny*ov;b.x+=nx*ov;b.y+=ny*ov;             // 分開
    const vn=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
    if(vn<0){a.vx+=vn*nx;a.vy+=vn*ny;b.vx-=vn*nx;b.vy-=vn*ny}
    a.vx-=nx*.6;a.vy-=ny*.6;b.vx+=nx*.6;b.vy+=ny*.6;         // 彈開
    a.rv-=.14;b.rv+=.14;                                      // 各自轉一下
    [a,b].forEach(o=>{
      if(o===C){bounce=Math.max(bounce,.7);C.tx=C.vx*.6;C.ty=C.vy*.6}   // 玩家養的那隻身體彈一下
      else o.bn=.7;
    });
    bump(a,b,nx,ny,t);bump(b,a,-nx,-ny,t);
  }
}
// 頑固的小球撞到別人：把對方輕輕（Q 彈地）彈開，自己回角落冷靜一下。(nx,ny) 是從 from 指向 to 的方向。
function bump(from,to,nx,ny,t){
  if(!isStubborn(from)||isStubborn(to))return;
  to.vx+=nx*1.6;to.vy+=ny*1.6;to.rv+=nx>0?.25:-.25;
  from.vx-=nx*.5;from.vy-=ny*.5;
  from.calm=t+2500;
  const sl=TEMPERS[idOf(to)].sleepy;
  if(sl)to.moveTo={x:to.x<WORLD.w/2?WORLD.w*.6+Math.random()*130:60+Math.random()*130,until:t+5000};   // 睏睏被撞開：換個地方繼續躺
  if(t-lastBumpMsg>8000&&S&&!S.over){                          // 訊息最多每 8 秒一次，不洗版（同伴之間也會寫）
    lastBumpMsg=t;
    if(sl)say(fmt(R(TEXT.social.moved),{b:nameOf(to)}));
    else if(from===C)say(fmt(TEXT.guest.bumpOut,{name:nm(to.name)}));
    else if(to===C)say(fmt(TEXT.guest.bumpIn,{name:nm(from.name)}));
    else say(fmt(TEXT.guest.bumpAny,{a:nameOf(from),b:nameOf(to)}));
  }
}

// ---------- 畫出同伴 ----------
function guestPose(g,i,t){
  if(g.phase!=='live')return t%700<350?'open_a':'open_b';    // 飄動時觸肢張開
  if(g.pk&&t<g.pk.until)return ['hide','turn'].includes(g.pk.kind)?'curl':['wave','stretch','touch'].includes(g.pk.kind)||(g.pk.kind==='come'&&Math.hypot(g.pk.x-g.x,g.pk.y-g.y)<40)?'reach_'+(t%440<220?'a':'b'):'flat_'+(t%440<220?'a':'b');   // 被戳的反應
  if(Math.hypot(g.vx,g.vy)>.6)return 'flat_'+(t%440<220?'a':'b');
  if(TEMPERS[g.e.temp].sleepy&&(g.y>=296||(isHigh(g)&&g.y<110))&&Math.hypot(g.vx,g.vy)<.35)return 'rest';   // 睏睏貼底睡覺（高高在上＝浮在水面睡）
  return IDLE_CYCLE[Math.floor(t/450+i*3)%IDLE_CYCLE.length];
}
function drawGuests(t,tt){
  GUESTS.forEach((g,i)=>{
    if(t-g.pt>260){g.p=guestPose(g,i,t);g.pt=t}
    const live=g.phase==='live';
    const dy=g.y+(live?Math.sin(tt*.9+i)*5:0)-g.bn*Math.abs(Math.sin(tt*9))*14;
    const sq=Math.sin(tt*2+i)*.03+g.bn*Math.sin(tt*13)*.08;
    if(live){cx.globalAlpha=.2;cx.fillStyle='#000';cx.beginPath();cx.ellipse(g.x,Math.max(342,g.y+38),26,7,0,0,PI2);cx.fill()}   // 影子
    drawLarva(cx,g.x,dy,g.rot,sq,g.p,g.look,tt+i*1.3,.95*g.al,.9);
    if(g.em&&!drawBubble(g.em,t,g.x,dy-42))g.em=null;                 // 同伴的表情氣泡
    cx.globalAlpha=g.al;cx.font='bold 13px sans-serif';cx.textAlign='center';cx.lineWidth=3;
    cx.strokeStyle='rgba(8,26,36,.8)';cx.strokeText(g.name,g.x,dy+58);cx.fillStyle='#e6f6f2';cx.fillText(g.name,g.x,dy+58);
    cx.globalAlpha=1;
  });
}

// ---------- 被戳（預覽模式：每隻同伴都能戳）----------
// 反應和玩家養的那隻一樣，照個性的 poke 種類（見 POKE 表）：黏人靠過來、害羞躲角落、好奇揮觸肢、頑固背過身回角落、活潑轉圈、睏睏伸展。
function pokeGuest(g,t,x,y){
  if(g.phase!=='live'||t-(g.lp||0)<500)return false;
  g.lp=t;g.bn=Math.max(g.bn,.9);
  let kind=TEMPERS[g.e.temp].poke;
  if((g.e.own.includes('touchy')||g.e.own.includes('homereturn'))&&['hide','turn'].includes(kind))kind='touch';   // 和玩家養的那隻一樣：喜歡觸碰、回歸者不會躲開
  const dur={come:3000,hide:5000,wave:2200,turn:3500,spin:1800,stretch:3200,touch:2500}[kind]||2000;
  g.pk={kind,x:Math.max(60,Math.min(WALL.r-20,x)),y:Math.max(60,Math.min(300,y)),until:t+dur};
  g.next=0;
  if(kind==='spin')g.rv=(Math.random()<.5?-1:1)*.5;
  if(kind==='hide'){g.vx+=(g.x<x?-1:1)*1.6}
  say(withLarva(TEXT.poke[kind],nm(g.name)));
  emoteOn(g,{come:'heart',hide:'q',wave:'ex',turn:'x',spin:'star',stretch:'q',touch:'heart'}[kind]||'ex');   // 被戳時也冒氣泡（和玩家養的那隻一樣）
  return true;
}
// 被戳之後這段時間要去哪裡（回傳 [tx,ty]；沒有就 null）
function pkSteer(g,t){
  const k=g.pk;if(!k)return null;
  if(t>=k.until){g.pk=null;return null}
  if(k.kind==='come')return aim(g,k,1);
  if(k.kind==='touch')return aim(g,k,.5);
  if(k.kind==='hide')return aim(g,{x:g.x<WORLD.w/2?WALL.l+12:WALL.r-12,y:306},1.4);
  if(k.kind==='turn')return aim(g,g.home,.7);
  return [0,0];
}
;
/* ==== js/render/land.js ==== */
// ===== 陸地上的小球（已經可以離水的穩定小球）：商店的行李箱、之後大樓背景等地方共用 =====
// 用法：const L=landStart(canvas,{n:1或2, floor:地面 y, xmin, xmax, look, sc:縮放（預設 1）, k:畫布解析度倍數（預設 1；畫布放大顯示時用 2，小球比較清楚，座標照舊用 1 倍）}); L.poke(x)＝戳離 x 最近的那隻（回傳那隻）；L.stop()
// 動作（每隻自己隨機換）：crawl 爬（往左 idle_a＋flat_a、往右 idle_a＋flat_b，一伸一縮）｜rest 窩著休息（rest）｜wave 揮手（reach_a／reach_b）｜hop 自己跳（open_a 往上、open_b 往下）
// Q彈：身體的壓扁／拉長用彈簧算（落地、被戳、被壓到都會晃幾下才停）。
// 兩隻時：靠太近會互相彈開一點（不會像水裡亂飛）；一隻跳起來落在另一隻頭上，會再彈一次，下面那隻被壓扁一下。
const LAND_RULE={g:.32,hop:5.6,pokeHop:6.4,crawl:.55,push:1.8,bump:2.4,headH:46,near:74,ontop:.45,toward:.6,
  act:{crawl:.45,rest:.25,wave:.18,hop:.12},dur:{crawl:[1800,3600],rest:[2000,4200],wave:[1200,2000],hop:[0,0]}};
function landStart(c,opt){
  const g=c.getContext('2d'),k=(opt&&opt.k)||1,W=c.width/k,H=c.height/k,o=Object.assign({n:1,floor:H*.7,xmin:60,xmax:W-60,look:larvaLook({day:1,hue:200,col:'#ffffff'}),sc:1},opt);
  const R_=LAND_RULE,rnd=(a,b)=>a+Math.random()*(b-a);
  const span=o.xmax-o.xmin;
  const list=Array.from({length:o.n},(_,i)=>({x:o.n===1?o.xmin+span/2:o.xmin+span*(i?.72:.28),z:0,vz:0,vx:0,dir:i?-1:1,sq:0,sqv:0,
    act:'rest',until:0,ph:Math.random()*6,bumpAt:0,look:o.look}));
  const pick=(b,t)=>{                                         // 換下一個動作
    let r=Math.random(),a='crawl';
    for(const k in R_.act){r-=R_.act[k];if(r<0){a=k;break}}
    b.act=a;const d=R_.dur[a];b.until=t+rnd(d[0],d[1]);
    if(a==='crawl'){
      const u=list.find(x=>x!==b);
      if(u&&Math.random()<R_.toward)b.dir=u.x>b.x?1:-1;else if(Math.random()<.4)b.dir*=-1;   // 兩隻時：比較常往對方爬過去
    }
    if(a==='hop'){b.vz=R_.hop;b.vx=b.dir*.6;b.sq=.16}       // 起跳前先壓一下
  };
  let raf=0,last=0,alive=true;
  const step=t=>{
    if(!alive||!c.isConnected){alive=false;return}
    const dt=Math.min(3,last?(t-last)/16.7:1);last=t;const tt=t/1000;
    list.forEach(b=>{
      if(!b.until)pick(b,t);
      // 空中
      if(b.z>0||b.vz>0){
        b.z+=b.vz*dt;b.vz-=R_.g*dt;b.x+=b.vx*dt;
        list.forEach(u=>{                                     // 落在別隻頭上：再彈一次，下面那隻被壓扁
          if(u===b||b.vz>0||(b.heads||0)>=2)return;            // 最多在頭上彈兩次（角落不會一直彈）
          if(Math.abs(u.x-b.x)<40&&b.z<u.z+R_.headH&&b.z>u.z+R_.headH-14){b.heads=(b.heads||0)+1;const mid=(o.xmin+o.xmax)/2,away=u.x<mid?1:-1;   // 往空曠的那一邊彈開
          b.z=u.z+R_.headH;b.vz=R_.hop*(b.heads>1?.55:.8);b.vx=away*(b.heads>1?2.6:1.6);b.sqv-=.06;u.sqv+=.14;u.act='rest';u.until=t+900}
        });
        if(b.z<=0){b.z=0;b.vz=0;b.vx=0;b.sqv+=.16;b.heads=0;if(b.act==='hop')b.until=t+300}   // 落地：Q彈
      }else{
        if(t>b.until)pick(b,t);
        if(b.act==='crawl'){const s=Math.max(0,Math.sin(tt*3.2+b.ph));b.x+=b.dir*s*R_.crawl*dt}
        b.x+=b.vx*dt;b.vx*=.86;
      }
      if(b.x<o.xmin){b.x=o.xmin;b.dir=1}else if(b.x>o.xmax){b.x=o.xmax;b.dir=-1}
      // 彈簧（壓扁／拉長）
      b.sqv+=(-.22*b.sq-.14*b.sqv)*dt;b.sq+=b.sqv*dt;
    });
    // 兩隻靠太近：互相彈開一點
    if(list.length>1){
      const [a,b]=list,d=b.x-a.x;
      if(Math.abs(d)<R_.near&&Math.abs(a.z-b.z)<20&&t-a.bumpAt>700&&a.z===0&&b.z===0&&Math.random()<R_.ontop){   // 低機率：其中一隻跳到另一隻頭上
        const [j,u]=Math.random()<.5?[a,b]:[b,a],vz=6.4,tf=(vz+Math.sqrt(vz*vz-2*R_.g*R_.headH))/R_.g;
        j.vz=vz;j.vx=(u.x-j.x)/tf;j.act='hop';j.until=t;j.sq=.16;u.act='rest';u.until=t+tf*17+1200;a.bumpAt=b.bumpAt=t+600;
      }else if(Math.abs(d)<R_.near&&Math.abs(a.z-b.z)<20&&t-a.bumpAt>700){
        const s=d>=0?1:-1;a.vx=-s*R_.push;b.vx=s*R_.push;a.vz=Math.max(a.vz,R_.bump);b.vz=Math.max(b.vz,R_.bump);a.sqv+=.08;b.sqv+=.08;a.bumpAt=b.bumpAt=t;a.dir=-s;b.dir=s;[a,b].forEach(u=>{u.act='crawl';u.until=t+rnd(1200,2200)});   // 彈開後各自往反方向爬走
      }
    }
    // 畫
    g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);g.setTransform(k,0,0,k,0,0);g.imageSmoothingEnabled=false;
    [...list].sort((a,b)=>a.z-b.z).forEach(b=>{
      const air=b.z>0||b.vz>0;
      const pose=air?(b.vz>0?'open_a':'open_b'):b.act==='crawl'?(Math.sin(tt*3.2+b.ph)>0?(b.dir<0?'flat_a':'flat_b'):'idle_a'):b.act==='rest'?'rest':b.act==='wave'?(Math.floor(tt*4)%2?'reach_a':'reach_b'):'idle_a';
      const breathe=b.act==='rest'&&!air?Math.sin(tt*2+b.ph)*.025:0;
      g.globalAlpha=.25;g.fillStyle='#000';g.beginPath();g.ellipse(b.x,o.floor+36*o.sc,Math.max(14,30-b.z*.2)*o.sc,6*o.sc,0,0,PI2);g.fill();g.globalAlpha=1;
      drawLarva(g,b.x,o.floor-b.z,(b.act==='crawl'&&!air?b.dir*.06:0)+(air?b.vx*.04:0),Math.max(-.3,Math.min(.35,b.sq+breathe)),pose,b.look,tt,1,o.sc);
    });
    raf=requestAnimationFrame(step);
  };
  raf=requestAnimationFrame(step);
  return {list,k,
    poke(x){const b=list.reduce((a,u)=>Math.abs(u.x-x)<Math.abs(a.x-x)?u:a);if(b.z<=0){b.vz=R_.pokeHop;b.vx=(Math.random()-.5)*1.2;b.sq=.2}else b.sqv+=.1;b.act='hop';return b},
    stop(){alive=false;cancelAnimationFrame(raf)}};
}
;
/* ==== js/minigame.js ==== */
// ===== 互動玩耍（玩耍方式＝「遊玩」時，選了玩具就在水缸裡真的玩一場）=====
// 數值效果和「精簡」一樣（js/actions.js 的 actPlay 先算信賴），這裡只負責水缸裡的表演，玩完自動結束。文字在 TEXT.game。
//   wand   指揮棒：所有小球追著游標（或手指）游，第一個碰到的冒小皇冠
//   bubble 氣泡棒：游標劃過的地方冒出一串泡泡，被泡泡氣流捲到的小球轉圈圈、冒音符
//   bell   小鈴鐺：點一個發光的地方（裝飾或水草）把鈴鐺藏起來，小球們各自去猜，猜中的冒小皇冠
//   bucket 小水桶：點水缸下半部的石頭地放水桶（item_bucket），小球們搶著躲進去；第一個躲進去的被倒蓋的水桶（item_bucket_2）罩住，抖一抖、水桶消失，冒小皇冠
//   ball   軟球：只有一隻（日常＝這一輪養的小球；觀察水缸＝隨機挑一隻，喜歡軟球的優先），用頭頂球，頂 4～5 下冒音符、3 下沒反應、1～2 下懊惱（漩渦）
// 喜好（gameLikes）：喜歡的照上面玩；不喜歡的——指揮棒追得慢、碰到也懊惱；氣泡棒被捲到懊惱；小鈴鐺找到了也「……」；軟球只意思意思頂一下
// 觀察水缸（PV）也能玩：沒有養的那隻（C），只有同伴。
// 對外：gameStart(玩具) 開始｜gameStop() 中止｜gameSteer(身體,t) 給移動程式用｜gameStep(t)、gameDraw(t) 每一格
let GAME=null;
const GAME_RULE={grace:1500,wandTime:9000,bucketTime:9000,bucketPlaceMax:15000,bubbleTime:9000,bellHideMax:20000,bellSeekMax:7000,linger:1600};
const gameName=o=>nm(o===C?S.name:o.name);
const gameBodies=()=>[...(S&&!S.over&&!SN&&!PV?[C]:[]),...GUESTS.filter(g=>g.phase==='live')];
const gameSpeed=o=>.9+TEMPERS[o===C?S.temp:o.e.temp].speed*.6;
const gameSay=(s,cls)=>say(withLarva(s,GAME&&GAME.who?gameName(GAME.who):nm(S.name)),cls||'ev');   // 文字裡的 {larva}＝玩的那隻
// 這隻喜不喜歡這個玩具：最喜歡的玩具（養的那隻 S.pref.toy；同伴 e.pt）或有「貪玩」標籤＝喜歡。
// 指揮棒、小水桶（商店買的永久道具）不會是「最喜歡的玩具」，改看個性：
//   指揮棒＝黏人、好奇、活潑、守序喜歡追；小水桶＝害羞、頑固、睏睏、易染喜歡躲（剛好相反）
const GAME_LIKE={wand:['clingy','curious','lively','helper'],bucket:['shy','stubborn','sleepy','mimic']};   // 守序（helper）＝指揮棒派、易染（mimic）＝水桶派（使用者 v0.29.10）
function gameLikes(o,toy){
  const fav=o===C?S.pref.toy:o.e.pt,tags=o===C?S.tags:o.e.own,temp=o===C?S.temp:o.e.temp;
  if(toy===fav||tags.includes('playful'))return true;
  if(GAME_LIKE[toy])return GAME_LIKE[toy].includes(temp);
  return false;
}

function gameStart(toy){
  if(!S||S.over)return;
  const t=performance.now(),G=TEXT.game;
  gameStop();
  if(toy==='wand'){
    GAME={kind:'wand',t0:t,until:t+GAME_RULE.wandTime,meh:new Set()};
    gameSay(G.wand.start,'sys');
  }else if(toy==='bubble'){
    GAME={kind:'bubble',t0:t,until:t+GAME_RULE.bubbleTime,parts:[],last:0,spun:new Map()};
    gameSay(G.bubble.start,'sys');
  }else if(toy==='bell'){
    GAME={kind:'bell',t0:t,until:t+GAME_RULE.bellHideMax,phase:'hide',spots:bellSpots(),hidden:-1,guess:new Map()};
    GAME.tap=bellTap;
    gameSay(G.bell.start,'sys');
  }else if(toy==='bucket'){
    GAME={kind:'bucket',t0:t,until:t+GAME_RULE.bucketPlaceMax,phase:'place',pos:null,meh:new Set(),win:null};
    GAME.tap=bucketTap;
    gameSay(G.bucket.start,'sys');
  }else if(toy==='ball'){
    const all=gameBodies();if(!all.length)return;
    const fans=all.filter(o=>gameLikes(o,'ball')),who=PV?R(fans.length?fans:all):C,like=gameLikes(who,'ball');
    GAME={kind:'ball',t0:t,until:t+20000,who,like,hits:like?1+Math.floor(Math.random()*5):1,n:0,ball:{x:who.x,y:30,vx:0,vy:0},missed:false};
    gameSay(G.ball.start,'sys');
  }else return;
  cv.style.touchAction='none';                          // 手機：在水缸上拖曳不會捲動畫面
}
// 有小球拿到小皇冠：記一次（成就「今天的王者」）
function gameCrown(){META.crowns=(META.crowns||0)+1;codexSave()}
function gameStop(){GAME=null;cv.style.touchAction=''}
// 結束：寫訊息，留一下下讓氣泡、球停在畫面上
function gameEnd(t,msg){
  if(!GAME||GAME.done)return;
  GAME.done=true;GAME.doneAt=t;GAME.tap=null;
  if(msg)gameSay(msg);
}
// 移動程式（creature.js、guests.js）每一格會問：這隻現在要去哪？（回傳 [tx,ty] 或 null＝照平常）
function gameSteer(o,t){
  if(GAME&&GAME.kind==='bucket'&&GAME.win===o&&GAME.phase==='cover'&&S)return [0,0];   // 被水桶罩住的那隻：不動
  if(!GAME||GAME.done||!S)return null;
  if(GAME.kind==='bucket'&&GAME.phase==='hide')return aim(o,bucketIn(o),gameSpeed(o)*(gameLikes(o,'bucket')?1.4:.35));
  if(GAME.kind==='wand')return aim(o,wandPos(t),gameSpeed(o)*(gameLikes(o,'wand')?1.4:.35));
  if(GAME.kind==='bell'&&GAME.phase==='seek'){
    const sp=GAME.spots[GAME.guess.get(o)];if(!sp)return null;
    return aim(o,{x:sp.x,y:Math.min(floorOf(o),Math.max(WALL.t,sp.y))},gameSpeed(o));
  }
  if(GAME.kind==='ball'&&o===GAME.who&&!GAME.missed)return aim(o,{x:GAME.ball.x,y:250},2.4);
  return null;
}

// ---------- 每一格 ----------
function gameStep(t){
  if(!GAME)return;
  if(GAME.done){if(t-GAME.doneAt>GAME_RULE.linger)gameStop();return}
  if(!S||S.over){gameStop();return}
  const G=TEXT.game,dt=Math.min(3,GAME.lt?(t-GAME.lt)/16.7:1);GAME.lt=t;   // dt：以 60fps 為 1（高更新率的螢幕不會變快）
  if(GAME.kind==='wand'){
    const p=wandPos(t);
    const touch=t-GAME.t0>GAME_RULE.grace?gameBodies().filter(o=>Math.hypot(o.x-p.x,(o===C?(C.dy||C.y):o.y)-p.y)<36):[];
    touch.filter(o=>!gameLikes(o,'wand')&&!GAME.meh.has(o)).forEach(o=>{GAME.meh.add(o);emoteOn(o,'swirl');gameSay(fmt(G.wand.meh,{name:gameName(o)}))});   // 不喜歡：碰到了也懊惱
    const w=touch.find(o=>gameLikes(o,'wand'));
    if(w){emoteOn(w,'crown');gameCrown();gameEnd(t,fmt(G.wand.win,{name:gameName(w)}));return}
    if(t>GAME.until)gameEnd(t,G.wand.none);
  }
  else if(GAME.kind==='bubble'){
    // 游標（手指）最近有動：在那裡冒泡泡
    if(t-CUR.t<150&&t-GAME.last>45&&CUR.y>20&&CUR.y<480){
      GAME.last=t;
      for(let i=0;i<2;i++)GAME.parts.push({x:CUR.x+(Math.random()-.5)*14,y:CUR.y,r:3+Math.random()*6,vx:(Math.random()-.5)*.6,vy:-1.4-Math.random()*1.2});
    }
    GAME.parts.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=Math.pow(.98,dt)});
    GAME.parts=GAME.parts.filter(b=>b.y>16).slice(-160);
    // 泡泡從身體下面往上衝過去：被氣流捲得轉圈
    gameBodies().forEach(o=>{
      const last=GAME.spun.get(o)||0;if(t-last<1800)return;
      const oy=o===C?(C.dy||C.y):o.y;
      if(GAME.parts.some(b=>Math.abs(b.x-o.x)<34&&b.y<oy+30&&b.y>oy-10)){
        GAME.spun.set(o,t);o.rv+=(Math.random()<.5?-1:1)*.55;o.vy-=.8;
        if(o===C)bounce=1;else o.bn=1;
        const like=gameLikes(o,'bubble');emoteOn(o,like?'note':'swirl');if(!last)gameSay(fmt(like?G.bubble.spin:G.bubble.spinMeh,{name:gameName(o)}));
      }
    });
    if(t>GAME.until)gameEnd(t,G.bubble.end);
  }
  else if(GAME.kind==='bucket'){
    if(GAME.phase==='place'&&t>GAME.until)bucketPlace(WORLD.w/2,380,t);      // 太久沒放：放在中間
    if(GAME.phase==='hide'){
      const touch=gameBodies().filter(o=>{const p=bucketIn(o);return Math.abs(o.x-p.x)<40&&Math.abs(bodyY(o)-p.y)<40});
      touch.filter(o=>!gameLikes(o,'bucket')&&!GAME.meh.has(o)).forEach(o=>{GAME.meh.add(o);emoteOn(o,'swirl');gameSay(fmt(G.bucket.meh,{name:gameName(o)}))});
      const w=touch.find(o=>gameLikes(o,'bucket'));
      if(w){GAME.win=w;GAME.phase='cover';GAME.coverAt=t;GAME.tap=null;return}   // 換成倒蓋的水桶罩住牠
      if(t>GAME.until)gameEnd(t,G.bucket.none);
    }
    if(GAME.phase==='cover'&&t-GAME.coverAt>BUCKET_COVER.lift){             // 抖完：水桶消失，冒小皇冠
      const w=GAME.win;GAME.phase='reveal';emoteOn(w,'crown');gameCrown();gameEnd(t,fmt(G.bucket.win,{name:gameName(w)}));
    }
  }
  else if(GAME.kind==='bell'){
    if(GAME.phase==='hide'&&t>GAME.until)bellHide(Math.floor(Math.random()*GAME.spots.length),t);   // 太久沒選：隨便藏一個
    if(GAME.phase==='seek'){
      const bodies=gameBodies();
      bodies.forEach(o=>{if(!GAME.guess.has(o))GAME.guess.set(o,Math.floor(Math.random()*GAME.spots.length))});
      const arrived=bodies.every(o=>{const sp=GAME.spots[GAME.guess.get(o)];return Math.abs(o.x-sp.x)<34&&Math.abs(o.y-Math.min(floorOf(o),Math.max(WALL.t,sp.y)))<40});
      if(arrived||t>GAME.until){
        const found=bodies.filter(o=>GAME.guess.get(o)===GAME.hidden),win=found.filter(o=>gameLikes(o,'bell')),meh=found.filter(o=>!gameLikes(o,'bell'));
        bodies.forEach(o=>emoteOn(o,win.includes(o)?'crown':meh.includes(o)?'dots':'q'));if(win.length)gameCrown();
        GAME.phase='reveal';
        gameEnd(t,win.length?fmt(G.bell.win,{names:win.map(gameName).join('、')}):meh.length?'':G.bell.lose);
        if(meh.length)gameSay(fmt(G.bell.meh,{names:meh.map(gameName).join('、')}));
      }
    }
  }
  else if(GAME.kind==='ball'){
    const b=GAME.ball;
    b.vy+=.14*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.x<WALL.l-10){b.x=WALL.l-10;b.vx=Math.abs(b.vx)}else if(b.x>WALL.r+10){b.x=WALL.r+10;b.vx=-Math.abs(b.vx)}
    const W=GAME.who,hx=W.x,hy=(W===C?(C.dy||C.y):W.y)-40,hop=()=>{if(W===C)bounce=1;else W.bn=1};
    if(!GAME.missed&&b.vy>0&&Math.abs(b.x-hx)<34&&b.y>hy-14&&b.y<hy+12){
      if(GAME.n<GAME.hits){                                  // 頂到了
        GAME.n++;b.vy=-(5.2+Math.random()*1.4);b.vx=(b.x-hx)*.05+(Math.random()-.5)*1.4;hop();
        if(GAME.n>=GAME.hits)GAME.missed=true;                  // 這是最後一下：之後就接不到了
      }
    }
    if(b.y>392){                                             // 掉到沙地上（頂完了，或沒接到）：結束
      b.y=392;
      const n=GAME.n;
      if(!GAME.like){emoteOn(W,'swirl');gameEnd(t,G.ball.dislike);return}
      emoteOn(W,n>=4?'note':n<=2?'swirl':'q');
      gameEnd(t,fmt(G.ball.count,{n})+(n>=4?G.ball.great:n<=2?G.ball.bad:G.ball.meh));
    }
    if(t>GAME.until)gameEnd(t,fmt(G.ball.count,{n:GAME.n}));
  }
}

// ---------- 指揮棒：游標位置（還沒動過就停在水缸中間上方）----------
function wandPos(t){
  const moved=CUR.t>=GAME.t0;
  const x=moved?CUR.x:WORLD.w/2,y=moved?CUR.y:140;
  return {x:Math.max(WALL.l,Math.min(WALL.r,x)),y:Math.max(WALL.t,Math.min(330,y))};
}

// ---------- 小水桶：點一下放下去（放在沙地上方一點），小球要游到桶口 ----------
function bucketTap(x,y){if(GAME&&GAME.phase==='place')bucketPlace(x,y,performance.now())}
// 可以放的範圍：下半部的石頭地（y＝桶底）
const BUCKET_AREA={t:300,b:450},BUCKET_COVER={drop:220,shake:[300,1100],lift:1300};   // 罩住的動畫（毫秒）：落下｜抖動｜消失
const BUCKET_IMG=[new Image(),new Image()];BUCKET_IMG[0].src=assetImg('item_bucket');BUCKET_IMG[1].src=assetImg('item_bucket_2');
const bodyY=o=>o===C?(C.dy||C.y):o.y;
function bucketPlace(x,y,t){
  GAME.pos={x:Math.max(WALL.l+30,Math.min(WALL.r-30,x)),y:Math.max(BUCKET_AREA.t,Math.min(BUCKET_AREA.b,y))};
  GAME.phase='hide';GAME.until=t+GAME_RULE.bucketTime;GAME.tap=null;GAME.t0=t;
  gameSay(TEXT.game.bucket.placed,'sys');
}
const bucketIn=o=>({x:GAME.pos.x,y:Math.min(o?floorOf(o):WALL.b,GAME.pos.y-40)});     // 桶口（小球要游到的地方；石頭地太低時，游到最低處就算）

// ---------- 小鈴鐺：可以藏的地方＝水缸裡顯示中的裝飾＋左右兩叢水草 ----------
function bellSpots(){
  const L=TEXT.game.bell,sp=[];
  META.decor.filter(id=>!META.hidden.includes(id)).forEach(id=>{
    const d=DECOR[id],im=IMG['deco_'+id];
    sp.push({x:d.x+WORLD.dx,y:d.y-((im&&im.height)||40)/2,name:DECOR[id].name});
  });
  const weed=(n,x,yB,label)=>{const im=IMG[n];const w=(im&&im.width||40)*1.5,h=(im&&im.height||80)*1.5;sp.push({x:x+w/2,y:yB-h*.72,name:label})};
  weed('bg_tank_glass_1',22,452,L.weedL);weed('bg_tank_glass_2',416+WORLD.dx*2,456,L.weedR);
  return sp;
}
function bellTap(x,y){
  if(!GAME||GAME.phase!=='hide')return;
  let best=-1,bd=60;
  GAME.spots.forEach((s,i)=>{const d=Math.hypot(s.x-x,s.y-y);if(d<bd){bd=d;best=i}});
  if(best>=0)bellHide(best,performance.now());
}
function bellHide(i,t){
  GAME.hidden=i;GAME.phase='seek';GAME.until=t+GAME_RULE.bellSeekMax;GAME.tap=null;
  gameSay(fmt(TEXT.game.bell.hidden,{spot:GAME.spots[i].name}),'sys');
}

// ---------- 畫面 ----------
const BALL_IMG=new Image();BALL_IMG.src=assetImg('item_ball');
function gameStar(x,y,r,c,al){                          // 像素小星星（指揮棒的光）
  px(x-1,y-r,3,r*2+1,c,al);px(x-r,y-1,r*2+1,3,c,al);px(x-r/2,y-r/2,r,r,c,al*.6);
}
// 畫在小球後面的東西（水桶放好、還沒有人躲進去時）
function gameDrawBack(t){
  if(!GAME||GAME.kind!=='bucket'||GAME.phase!=='hide'||!GAME.pos)return;
  const {x,y}=GAME.pos,im=BUCKET_IMG[0],a=GAME.done?Math.max(0,1-(t-GAME.doneAt)/GAME_RULE.linger):1;
  cx.globalAlpha=a;
  if(im.naturalWidth)cx.drawImage(im,x-50,y-92,100,100);else{cx.fillStyle='#e07a2a';cx.fillRect(x-40,y-70,80,64)}
  cx.globalAlpha=1;
}
const WAND_IMG=new Image();WAND_IMG.src=assetImg('item_wand');
function gameDraw(t){
  if(!GAME)return;
  cx.globalAlpha=1;                                       // 前面畫泡泡時留下的透明度
  const al=GAME.done?Math.max(0,1-(t-GAME.doneAt)/GAME_RULE.linger):1;
  if(GAME.kind==='wand'&&!GAME.done){
    const p=wandPos(t),tw=Math.sin(t/120)*2;
    cx.globalAlpha=.25;cx.fillStyle='#fff7c2';cx.beginPath();cx.arc(p.x,p.y,22+tw,0,PI2);cx.fill();
    cx.globalAlpha=1;
    if(WAND_IMG.naturalWidth)cx.drawImage(WAND_IMG,p.x-15,p.y-15,64,64);           // 指揮棒圖：星星在游標的位置
    else{gameStar(p.x,p.y,10+tw,'#ffe26b',1);gameStar(p.x,p.y,4,'#fff',1)}
    gameStar(p.x+Math.sin(t/90)*12,p.y+Math.cos(t/110)*12,2,'#fff7c2',.8);
  }
  if(GAME.kind==='bubble'){
    cx.lineWidth=2;
    GAME.parts.forEach(b=>{cx.globalAlpha=.7*al;cx.strokeStyle='#e8fbfa';cx.beginPath();cx.arc(b.x,b.y,b.r,0,PI2);cx.stroke();cx.fillStyle='#fff';cx.fillRect(Math.round(b.x-b.r*.5),Math.round(b.y-b.r*.55),2,2)});
    cx.globalAlpha=1;
  }
  if(GAME.kind==='bell'){
    if(GAME.phase==='hide'){
      GAME.spots.forEach(s=>{
        const k=.6+Math.sin(t/220)*.25;
        cx.globalAlpha=.35*k;cx.fillStyle='#ffe26b';cx.beginPath();cx.arc(s.x,s.y,24,0,PI2);cx.fill();
        cx.globalAlpha=1;cx.lineWidth=2;cx.strokeStyle='#ffe26b';cx.beginPath();cx.arc(s.x,s.y,24,0,PI2);cx.stroke();
        cx.font='bold 16px sans-serif';cx.textAlign='center';cx.fillStyle='#fff';cx.fillText('?',s.x,s.y+6);
      });
    }else if(GAME.phase==='reveal'&&GAME.hidden>=0){
      const s=GAME.spots[GAME.hidden];
      cx.globalAlpha=al;cx.fillStyle='#f2c14e';cx.beginPath();cx.arc(s.x,s.y,10,0,PI2);cx.fill();
      cx.fillStyle='#8a5a12';cx.fillRect(s.x-2,s.y+2,4,5);gameStar(s.x+14,s.y-12,5,'#fff7c2',al);
      cx.globalAlpha=1;
    }
  }
  if(GAME.kind==='bucket'){
    if(GAME.phase==='place'){                               // 還沒放：提示可以放的範圍（石頭地）
      cx.globalAlpha=.35+Math.sin(t/220)*.15;cx.strokeStyle='#9fd0ff';cx.lineWidth=2;cx.setLineDash([6,6]);
      cx.strokeRect(WALL.l,BUCKET_AREA.t-60,WALL.r-WALL.l,BUCKET_AREA.b-BUCKET_AREA.t+60);cx.setLineDash([]);cx.globalAlpha=1;
    }else if(GAME.phase==='cover'&&GAME.win){               // 倒蓋的水桶罩住贏的那隻（畫在小球前面）：落下→抖一抖
      const w=GAME.win,e=t-GAME.coverAt,S_=BUCKET_COVER,im=BUCKET_IMG[1];
      const drop=Math.min(1,e/S_.drop),yy=bodyY(w)+44-(1-drop)*(1-drop)*90;
      const sh=e>S_.shake[0]&&e<S_.shake[1]?Math.sin(e/38)*.09:0;
      cx.save();cx.translate(w.x,yy);cx.rotate(sh);
      if(im.naturalWidth)cx.drawImage(im,-60,-112,120,120);else{cx.fillStyle='#e07a2a';cx.fillRect(-46,-100,92,96)}
      cx.restore();
    }
  }
  if(GAME.kind==='ball'){
    const b=GAME.ball;cx.globalAlpha=al;
    if(BALL_IMG.naturalWidth)cx.drawImage(BALL_IMG,b.x-18,b.y-18,36,36);
    else{cx.fillStyle='#ffd1e0';cx.beginPath();cx.arc(b.x,b.y,16,0,PI2);cx.fill()}
    cx.globalAlpha=1;
  }
}
;
/* ==== js/render/scene.js ==== */
// 每一格畫面的繪製：背景、水草、泡泡、幼體、核心、氣泡。
const BUB=Array.from({length:10},(_,i)=>({x:30+i*47+(i%3)*9,y:60+(i*83)%280,r:3+(i*5)%6,sp:.4+(i%4)*.25,ph:i*1.7}));
function plant(n,x,yBottom,sc,t,ph){
  const im=IMG[n];if(!im.naturalWidth)return;
  const w=im.width,h=im.height,sl=2;
  for(let y=0;y<h;y+=sl){
    const k=(h-y)/h,off=Math.sin(t/1100+ph)*10*k*k;
    cx.drawImage(im,0,y,w,sl,Math.round(x+off),Math.round(yBottom-(h-y)*sc),w*sc,sl*sc+1);
  }
}
let drawLast=0;
function draw(t){
  requestAnimationFrame(draw);
  const fdt=Math.min(3,drawLast?(t-drawLast)/16.7:1);drawLast=t;   // 以 60fps 為 1
  const W=WORLD.w,H=500;
  cx.globalAlpha=1;
  if(nLoaded<IMGN.length){cx.fillStyle='#0f3a4c';cx.fillRect(0,0,W,H);if(IMG.bg_tank.naturalWidth)cx.drawImage(IMG.bg_tank,0,0,W,H);return}
  const bg=(W>500&&IMG.bg_preview&&IMG.bg_preview.naturalWidth)?IMG.bg_preview:IMG.bg_tank;   // 預覽模式專用背景（assets/larva/bg_preview.png，750×500）；沒有就把一般背景拉寬
  if(imgOK(bg))cx.drawImage(bg,0,0,W,H);else{cx.fillStyle='#0f3a4c';cx.fillRect(0,0,W,H)}   // 背景圖壞掉（沒上傳）時用底色，不讓整個畫面停住
  const noC=PV||!S;                                   // 預覽模式、第 0 日（沒有小球）：不處理玩家的小球
  if(!noC)step(t);
  stepGuests(t);
  gameStep(t);                                        // 互動玩耍（js/minigame.js）
  const tt=t/1000;
  bounce*=Math.pow(.96,fdt);
  if(S&&S.over==='END-07')dead=Math.min(1,dead+.004*fdt);else dead=0;
  const a=1-dead;
  // 水草（程式擺動）
  plant('bg_tank_glass_1',22,452,1.5,t,0);
  plant('bg_tank_glass_2',416+WORLD.dx*2,456,1.5,t,2);
  cx.globalAlpha=1;
  META.decor.filter(id=>!META.hidden.includes(id)).forEach(id=>{const d=DECOR[id],im=IMG['deco_'+id];if(d&&im.naturalWidth)cx.drawImage(im,Math.round(d.x+WORLD.dx-im.width/2),Math.round(d.y-im.height))});
  gameDrawBack(t);                                    // 互動玩耍：畫在小球後面的（水桶）
  drawGuests(t,tt);
  if(!noC){
  // 影子
  const drawY=C.y+Math.sin(tt*.9)*5-bounce*Math.abs(Math.sin(tt*9))*14;C.dy=drawY;
  const sw=Math.min(64,Math.max(34,64-(318-C.y)*.12));
  cx.globalAlpha=.22*a;cx.fillStyle='#000';cx.beginPath();cx.ellipse(C.x,Math.max(342,C.y+38),sw/2,8,0,0,PI2);cx.fill();cx.globalAlpha=1;
  // 姿勢
  if(t-C.pt>260||(EM&&t-EM.t<120)){C.p=pickPose(t);C.pt=t}
  const sq=Math.sin(tt*2)*.03+bounce*Math.sin(tt*13)*.08,look=larvaLook(S);
  drawLarva(cx,C.x,drawY,C.rot,sq,C.p,look,tt,a*(frailSym()?.72:1),1);   // 虛弱徵兆：身體更透明
  // 彩色小光點
  if(S.colored)for(let i=0;i<4;i++){
    const sx=C.x+Math.cos(tt+i*1.6)*70,sy=drawY+Math.sin(tt*1.3+i*1.6)*60,on=Math.sin(tt*4+i)>0?1:0;
    const sc=(look.core[0]*.3+look.core[1]*.59+look.core[2]*.11)<64?'#fff':S.col;px(sx-1,sy-5,3,11,sc,.9*on);px(sx-5,sy-1,11,3,sc,.9*on);
  }
  }
  // 泡泡（程式）
  cx.lineWidth=2;
  BUB.forEach(b=>{
    b.y-=b.sp*fdt;if(b.y<30){b.y=330+Math.random()*30;b.x=30+Math.random()*(W-60)}
    const x=b.x+Math.sin(tt*1.2+b.ph)*6;
    cx.globalAlpha=.55;cx.strokeStyle='#e8fbfa';cx.beginPath();cx.arc(x,b.y,b.r,0,PI2);cx.stroke();
    cx.fillStyle='#fff';cx.fillRect(Math.round(x-b.r*.5),Math.round(b.y-b.r*.55),2,2);
  });
  gameDraw(t);
  // 水質色調
  if(S){cx.globalAlpha=Math.min(.45,S.dirt/260);cx.fillStyle='#6b8e3a';cx.fillRect(0,0,W,H);
  if(Math.abs(S.ph-7)>1.2){cx.globalAlpha=.12;cx.fillStyle=S.ph>7?'#ffd37a':'#d77aff';cx.fillRect(0,0,W,H)}}
  cx.globalAlpha=1;
  if(!noC)drawEmote(t,C.x,C.dy-46);
}
requestAnimationFrame(draw);
;
/* ==== js/letters.js ==== */
// ===== 畢業小球的信紙 =====
// 交還協會的小球（META.returned），之後偶爾會寄信來：每輪按「等待新委託」時判定（規則 LETTER_RULE，文字 TEXT.letter）。
// 每隻只寄一次（r.gift）。設定裡可以選「跳出信紙」或「只在訊息區提示」；跳出時可以勾選加入收藏（META.letters），在「收藏品 → 信紙」重看。
// 不管哪種方式，收藏品的「禮物」頁都會記一次「信紙」（META.souv.letter）。

// 可以寄信的小球：還沒寄過，而且交還之後已經滿 minWeeks 週；最近交還的排前面（剛滿 5 週的先判，一路判到 8 週以上的）
const letterWeeks=r=>META.rounds-(r.rnd||0);
const letterCands=()=>META.returned.filter(r=>!r.gift&&letterWeeks(r)>=LETTER_RULE.minWeeks).sort((a,b)=>(b.rnd||0)-(a.rnd||0));
// 這一隻這輪會寄哪種信（null＝不寄）
function letterRoll(r){
  const RL=LETTER_RULE,n=Math.random();
  if(letterWeeks(r)>=RL.stableWeeks)return n<RL.normal?'normal':null;
  return n<RL.farewell?'farewell':n<RL.farewell+RL.young?'young':null;
}

// 每輪結束時呼叫：從最近交還的開始逐隻判定，寄出一封就停；寄出就回傳 true
function letterCheck(){
  let r=null,kind=null;
  for(const c of letterCands()){kind=letterRoll(c);if(kind){r=c;break}}
  if(!r)return false;
  r.gift=true;r.lkind=kind;                 // lkind：寄了哪種信（之後大樓背景用）
  const L=letterMake(r,kind);
  META.souv.letter=(META.souv.letter||0)+1;
  META.letterGot[L.kind]=(META.letterGot[L.kind]||0)+1;   // 每種信各收到幾封（成就用）
  if(L.kind==='farewell')META.farewells++;   // 道別＝那隻也離開了，算一次消逝（回歸者名額）
  codexSave();
  if(META.letterMode==='log')say(fmt(TEXT.letter.log,{name:r.name}),'ev');
  else letterShow(L,true);
  return true;
}

// 寫信：kind＝normal 問候｜young 期許（未滿兩個月）｜farewell 道別（離開前轉述）
function letterMake(r,kind){
  const T=TEXT.letter;
  const weeks=Math.max(1,letterWeeks(r));
  kind=kind||'normal';
  const pickV=x=>Array.isArray(x)?R(x):x;   // 近況、祝福可以有好幾種寫法，隨機挑一個
  const v={player:META.pname||TEXT.misc.defPlayer,name:r.name,weeks,staff:R(T.staff),bless:pickV(T.bless[r.end]||T.blessAny)};
  const base={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),from:r.name,at:new Date().toISOString().slice(0,10),kind,note:fmt(T.note,v)};
  if(kind==='farewell')return {...base,intro:T.farewellIntro,body:fmt(T.farewellBody,v),note2:T.farewellNote2,img:true};
  // 近況：從這隻的個性、標籤、喜好裡隨機挑一個（舊紀錄沒有這些資料時用通用的）
  const opts=[];
  if(r.temp&&T.recentTemper[r.temp])opts.push(pickV(T.recentTemper[r.temp]));
  (r.own||[]).forEach(t=>{if(T.recentTag[t])opts.push(pickV(T.recentTag[t]))});
  if(r.pg&&NAME[r.pg])opts.push(fmt(T.recentGift,{item:NAME[r.pg]}));
  if(r.pt&&NAME[r.pt])opts.push(fmt(T.recentToy,{item:NAME[r.pt]}));
  const recent=R(opts.length?opts:T.recentAny);
  const reason=R(kind==='young'?T.reasonYoung:T.reason);
  return {...base,intro:T.intro,body:fmt(T.body,{...v,reason,recent}),note2:'',img:true};
}

// 顯示信紙（事件框）。fresh＝剛收到（有「加入收藏」勾選；預設勾起來，勾或取消會立刻存）
const letterBox=L=>h('div',{class:'pp letter'},
  h('p',{},L.intro),h('div',{class:'lbody'},L.body),
  h('p',{class:'lnote'},L.note),L.note2?h('p',{class:'lnote'},L.note2):null);
const letterKind=L=>TEXT.letter.kinds[L.kind]||TEXT.letter.kinds.normal;
function letterShow(L,fresh){
  const T=TEXT.letter;
  const nodes=[{node:letterBox(L)}];
  // 圖：依種類的一張 CG（劇情上每種都有後勤的翻譯稿；問候、期許另外附小球手寫的信紙，但畫面只放這張 CG）
  {const cg=h('img',{class:'lpaper',src:assetImg(LETTER_IMGS[L.kind]||LETTER_IMGS.normal),alt:''});cg.onerror=()=>{cg.src=LETTER_IMG};nodes.push({node:cg})}
  if(fresh){
    const keep=on=>{META.letters=META.letters.filter(x=>x.id!==L.id);if(on)META.letters.push(L);codexSave()};
    keep(true);
    const cb=h('input',{type:'checkbox',checked:true,onchange:e=>keep(e.target.checked)});
    nodes.push({node:h('label',{class:'lkeep'},cb,' '+T.keep)});
  }
  nodes.push({id:'close',label:T.close});
  pick(fmt(T.titleKind,{kind:letterKind(L)}),nodes,()=>{});
}

// ---------- 收藏品 → 信紙：一封一列（寄件者｜日期｜種類），按「展開」在下方直接看內文；「收納」按兩次＝從收藏拿掉 ----------
const LETTER_OPEN=new Set();
function letterList(box){
  const T=TEXT.letter;
  if(!META.letters.length){box.append(h('p',{class:'dim'},T.collEmpty));return}
  box.append(h('p',{class:'dim lhint'},T.dropHint));
  [...META.letters].reverse().forEach(L=>{
    const open=LETTER_OPEN.has(L.id);
    const tg=h('button',{class:'ib'+(open?' on':''),'aria-expanded':String(open),onclick:()=>{open?LETTER_OPEN.delete(L.id):LETTER_OPEN.add(L.id);renderColl()}},open?T.fold:T.expand);
    let armed=0,tm=null;
    const dp=h('button',{class:'ib ldrop'},T.drop);
    dp.onclick=()=>{
      if(!armed){armed=1;dp.textContent=T.dropConfirm;dp.classList.add('arm');tm=setTimeout(()=>{armed=0;dp.textContent=T.drop;dp.classList.remove('arm')},4000);return}
      clearTimeout(tm);META.letters=META.letters.filter(x=>x.id!==L.id);LETTER_OPEN.delete(L.id);codexSave();renderColl();
    };
    box.append(h('div',{class:'lrowL'},
      h('div',{class:'lhead'},h('strong',{},L.from),h('span',{class:'dim'},L.at),h('span',{class:'lkind lk-'+L.kind},letterKind(L)),h('span',{class:'lbtns'},tg,dp)),
      open?letterBox(L):null));
  });
}
;
/* ==== js/places.js ==== */
// ===== 外出地圖（外出方式＝「自選地點（地圖）」時，按出門會打開）=====
// 上面是地圖（底圖 MAP_IMG＋程式放的名牌，位置在 js/data/places.js），下面是說明。
// 點一下名牌＝選取（名牌變成「前往」、下方顯示說明），再點一次＝出發。住所＝回家（不出門、不耗行動）；灰色名牌＝之後開放；shop＝商店。
let MAP_SEL=null;
function mapOpen(){
  MAP_SEL=null;
  $('mapTitle').textContent=TEXT.map.title;
  $('mapImg').src=MAP_IMG;
  mapDraw();
  $('ovMap').classList.add('show');
}
function mapClose(){$('ovMap').classList.remove('show');MAP_SEL=null}
function mapDraw(){
  const W=$('mapWrap'),M=TEXT.map;
  W.querySelectorAll('.pin').forEach(e=>e.remove());
  Object.keys(PLACES).forEach(id=>{
    const P=PLACES[id],sel=MAP_SEL===id;
    const label=sel&&!P.locked?(P.home?M.back:M.go):TEXT.place[id].name;
    const b=h('button',{class:'pin'+(sel?' sel':'')+(P.locked?' locked':'')+(P.home?' home':''),style:`left:${P.x}%;top:${P.y}%`,
      'aria-label':TEXT.place[id].name+(P.locked?'（'+M.locked+'）':''),onclick:()=>mapTap(id)},label);
    W.append(b);
  });
  // 說明區：沒選＝操作提示；選了＝名字、說明、比較容易撿到什麼
  const I=$('mapInfo');I.textContent='';
  if(!MAP_SEL){I.append(h('p',{class:'dim'},M.hint));return}
  const P=PLACES[MAP_SEL],T=TEXT.place[MAP_SEL];
  I.append(...[h('p',{class:'mname'},T.name,P.locked?h('span',{class:'mtag'},M.locked):null,P.home?h('span',{class:'dim'},' '+M.homeNote):null),
    h('p',{},T.desc),T.find?h('p',{class:'mfind'},M.findHead+T.find):null].filter(Boolean));   // 沒有的項目不要放（append(null) 會印出 "null"）
}
function mapTap(id){
  const P=PLACES[id];
  if(MAP_SEL!==id||P.locked){MAP_SEL=id;mapDraw();return}   // 第一下：選取（灰色名牌只看說明）
  mapClose();                                                // 第二下：出發
  if(P.home)return;                                          // 回家＝不出門
  if(P.shop){shopGo();return}                                // 廢棄大樓＝言盡的商店（js/shop.js）
  if(P.hall){hallGo();return}                                // 異生會大樓（js/hall.js）
  actOut(id);
}
$('mapClose').onclick=mapClose;

// ---------- 出門鍵右上角的小牌子：顯示目前的外出方式，點它＝切換（隨機⇄地圖），不會出門 ----------
function outChip(){$('bOutMode').textContent=TEXT.ui.outChip[META.outMode]||''}
function outToggle(e){
  e.stopPropagation();e.preventDefault();
  META.outMode=META.outMode==='map'?'random':'map';codexSave();outChip();
  say(fmt(TEXT.ui.outSwitched,{m:TEXT.ui.outChip[META.outMode]}),'sys');
}
$('bOutMode').addEventListener('click',outToggle);
$('bOutMode').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')outToggle(e)});
outChip();

// ---------- 玩耍鍵上的小牌子：玩耍方式（精簡⇄遊玩），點它切換 ----------
function playChip(){$('bPlayMode').textContent=TEXT.game.mode[META.playMode]||''}
function playToggle(e){
  e.stopPropagation();e.preventDefault();
  META.playMode=META.playMode==='play'?'quick':'play';codexSave();playChip();
  say(fmt(TEXT.game.switched,{m:TEXT.game.mode[META.playMode]}),'sys');
}
$('bPlayMode').addEventListener('click',playToggle);
$('bPlayMode').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')playToggle(e)});
playChip();
;
/* ==== js/shop.js ==== */
// ===== 廢棄大樓的商店（言盡）=====
// 地圖選「廢棄大樓區」出發（耗 1 行動）→ 第一次：事件 shopIntro（js/events.js，文字 TEXT.shop.intro）→ 商店畫面。
// 商店：上面是打開的行李箱（由上往下看），擺 SHOP_SHOW 種商品（always 的先擺）；點一下＝選取（名牌變「購買」、言盡介紹），再點一次＝用積分買。
//   裝扮道具（wear）選取時多一顆「預覽」：行李箱上蓋一個預覽框（小球戴上的樣子，和聊天染色的預覽一樣），框裡可以直接購買或關掉。
// 下面是言盡的對話框＋頭像，最下面左邊持有積分、右邊「離開商店」。資料 js/data/shop.js、js/data/wears.js。
// 裝扮的名字（用商店商品的名字）
// 裝扮的商品圖：把有畫東西的那一塊（WEARS 的 box）原尺寸置中放進 96×96（不放大，避免糊）
function wearIcon(id){
  const W=WEARS[id],c=h('canvas',{class:'sicon swear',width:96,height:96});
  if(!W.img){c.getContext('2d').drawImage(wearImg(id),0,0);return c}
  const im=wearImg(id),[x0,y0,x1,y1]=W.box||[0,0,96,96],w=x1-x0,hh=y1-y0,k=Math.min(1,92/w,92/hh);
  const draw=()=>{const g=c.getContext('2d'),q=im.naturalWidth/96||1;g.imageSmoothingEnabled=true;g.drawImage(im,x0*q,y0*q,w*q,hh*q,48-w*k/2,48-hh*k/2,w*k,hh*k);
    if(W.glow){const gc=glowImg(id,'255,233,77');if(gc){g.save();g.shadowColor='#ffe94d';g.shadowBlur=5;g.drawImage(gc,x0,y0,w,hh,48-w*k/2,48-hh*k/2,w*k,hh*k);g.restore()}else setTimeout(draw,200)}};   // 會發光的：商品圖用黃色
  if(im.complete&&im.naturalWidth)draw();else im.addEventListener('load',draw,{once:true});
  return c;
}
const wearName=id=>{const k=Object.keys(SHOP_ITEMS).find(k=>SHOP_ITEMS[k].wear===id);return k?TEXT.shop.items[k].name:id};
let SHOP_NOW=[],SHOP_SEL=null,SHOP_SOLD=new Set(),SHOP_SAY='',SHOP_PV=null;

// 從地圖出發
function shopGo(){
  S.ap--;
  if(!META.visited.includes('ruins'))META.visited.push('ruins');
  say(TEXT.shop.arrive,'ev');
  refresh();
  if(!META.shopMet)runEvent('shopIntro',{cb:shopOpen});
  else shopOpen();
}
// 行李箱上有兩個分頁：隨機商品（裝扮、永久玩具；每次去才換，切分頁不會刷新）｜固定商品（生活物資，每次都一樣）
// 隨機商品全部買完：行李箱上擺一隻可以戳的小球
let SHOP_TAB='rand',SHOP_RAND=[];
const shopPoolLeft=()=>Object.keys(SHOP_ITEMS).filter(id=>!SHOP_ITEMS[id].fixed&&!SHOP_ITEMS[id].hidden&&(!SHOP_ITEMS[id].cond||SHOP_ITEMS[id].cond())&&!(SHOP_ITEMS[id].wear?META.wears.includes(SHOP_ITEMS[id].wear):SHOP_ITEMS[id].tool?META.tools.includes(SHOP_ITEMS[id].tool):false)).length;
// ---------- 行李箱裡的小球（隨機商品賣完時）：陸地上的小球（js/render/land.js），偶爾兩隻 ----------
let SHOP_LARVA=null;
const SHOP_LARVA_K=2;   // 行李箱畫布（邏輯 360×240）放大到整個行李箱顯示，所以內部用 2 倍解析度，2 倍的小球圖才清楚
function shopLarvaInit(){const two=Math.random()<.35;SHOP_LARVA={two,land:null};return two}
function shopLarvaRun(c){
  if(!SHOP_LARVA)shopLarvaInit();
  if(SHOP_LARVA.land)SHOP_LARVA.land.stop();
  SHOP_LARVA.land=landStart(c,{n:SHOP_LARVA.two?2:1,floor:160,xmin:70,xmax:290,k:SHOP_LARVA_K});   // 畫布放大顯示：用 2 倍解析度畫（v0.35）
}
function shopLarvaPoke(c,e){
  if(!SHOP_LARVA||!SHOP_LARVA.land)return;
  const r=c.getBoundingClientRect(),x=(e.clientX-r.left)*c.width/SHOP_LARVA_K/r.width,T=TEXT.shop;
  SHOP_LARVA.land.poke(x);
  SHOP_SAY=Math.random()<.3?R(T.yanjinLarva):R(T.emptyPoke);$('shopTalk').textContent=SHOP_SAY;
}
function shopOpen(){
  const T=TEXT.shop,ids=Object.keys(SHOP_ITEMS);
  SHOP_SOLD=new Set();                                                       // 先清掉上次的「賣完」（不然上次買的東西會被當成還沒有）
  const pool=ids.filter(id=>!SHOP_ITEMS[id].fixed&&!SHOP_ITEMS[id].hidden&&(!SHOP_ITEMS[id].cond||SHOP_ITEMS[id].cond())&&shopState(id)!=='have');
  const must=pool.filter(id=>SHOP_ITEMS[id].always);
  const rest=pool.filter(id=>!must.includes(id)).sort(()=>Math.random()-.5);
  SHOP_RAND=[...must,...rest].slice(0,HEART_RULE.shop[META.heartLv]||SHOP_SHOW);   // 心等 3：多擺一種
  SHOP_TAB='rand';SHOP_NOW=SHOP_RAND;
  SHOP_SEL=null;SHOP_PV=null;SHOP_LARVA=null;SHOP_GIFT=0;
  SHOP_SAY=SHOP_RAND.length?R(T.hello):(shopLarvaInit()?T.emptyTwo:T.empty);
  $('shopTitle').textContent=T.title;$('shopLeave').textContent=T.leave;$('shopWho').textContent=T.who;
  $('shopImg').src=assetImg(SHOP_CASE);
  shopView('goods');
  $('ovShop').classList.add('show');
}
function shopTabSet(t){
  if(SHOP_TAB===t)return;
  SHOP_TAB=t;SHOP_SEL=null;SHOP_PV=null;
  SHOP_NOW=t==='fixed'?Object.keys(SHOP_ITEMS).filter(id=>SHOP_ITEMS[id].fixed):SHOP_RAND;
  SHOP_SAY=t==='fixed'?TEXT.shop.fixedSay:(SHOP_RAND.length?R(TEXT.shop.hello):(SHOP_LARVA&&SHOP_LARVA.two?TEXT.shop.emptyTwo:TEXT.shop.empty));
  shopDraw();
}
function shopClose(){$('ovShop').classList.remove('show');if(SHOP_LARVA&&SHOP_LARVA.land){SHOP_LARVA.land.stop();SHOP_LARVA.land=null}shopSceneStop();SHOP_PV=null;refresh()}
// ---------- 兩個畫面：goods 商品（行李箱＋對話框）｜chat 閒聊（廢墟場景：行李箱、言盡、偶爾一隻小球）----------
let SHOP_VIEW='goods',SHOP_CHR=0,SHOP_LAND=null,SHOP_GIFT=0;
function shopView(v){
  const T=TEXT.shop;SHOP_VIEW=v;
  $('shopWrap').hidden=v!=='goods';$('shopScene').hidden=v!=='chat';
  $('shopChat').textContent=v==='goods'?T.chatBtn:T.goodsBtn;
  if(v==='goods'){shopSceneStop();shopDraw();return}
  SHOP_PV=null;SHOP_SEL=null;SHOP_CHR=0;
  const S_=SHOP_SCENE;$('shopSBg').src=assetImg(S_.bg);$('shopSCase').src=assetImg(S_.suitcase);
  const ci=Math.floor(Math.random()*T.chat.length);SHOP_SAY=T.chat[ci];SHOP_CHR=(S_.chatAlt||[]).includes(ci)?1:0;shopLineImg('shop.chat['+ci+']',SHOP_SAY);shopSceneDraw();
  shopSceneStop();
  if(Math.random()<S_.larva){const c=$('shopLand'),sc=S_.larvaSc;
    SHOP_LAND=landStart(c,{n:1,floor:c.height-36*sc-14,xmin:150,xmax:420,sc,look:larvaLook({day:HALL_RULE.strangerDay,hue:Math.floor(Math.random()*360),col:'#ffffff'})})}
}
let SHOP_IMG=null;   // 這句專用的人物圖 {say,img}（js/data/lineimg.js）
const shopLineImg=(key,t)=>{const im=lineImg(key);SHOP_IMG=im?{say:t,img:im}:null};
function shopSceneDraw(){chrSet($('shopChr'),(SHOP_IMG&&SHOP_IMG.say===SHOP_SAY&&SHOP_IMG.img)||SHOP_SCENE.chr[SHOP_CHR]);$('shopTalk').textContent=SHOP_SAY;$('shopPts').textContent=fmt(TEXT.shop.points,{n:META.points})}
function shopSceneStop(){if(SHOP_LAND){SHOP_LAND.stop();SHOP_LAND=null}const c=$('shopLand');c.getContext('2d').clearRect(0,0,c.width,c.height)}
// 這件商品現在能不能買：sold 賣完｜have 已經有了（玩具每種只能有一個；裝扮永久持有）
function shopState(id){
  if(SHOP_SOLD.has(id))return 'sold';
  const it=SHOP_ITEMS[id];
  if(it.wear)return META.wears.includes(it.wear)?'have':'';
  if(it.tool)return META.tools.includes(it.tool)?'have':'';
  if(Object.keys(it.give).every(k=>TOYS.includes(k)&&S.inv[k]>0))return 'have';
  return '';
}
function shopDraw(){
  const T=TEXT.shop,W=$('shopWrap');
  const keep=SHOP_TAB==='rand'&&!SHOP_RAND.length&&SHOP_LARVA&&SHOP_LARVA.land&&W.querySelector('.sempty');   // 小球還在跑：保留，不重來
  W.querySelectorAll(keep?'.sslot,.stabs':'.sslot,.stabs,.sempty').forEach(e=>e.remove());
  W.append(h('div',{class:'stabs'},...[['rand',T.tabRand],['fixed',T.tabFixed]].map(([k,t])=>h('button',{class:SHOP_TAB===k?'on':'',onclick:()=>shopTabSet(k)},t))));
  if(SHOP_TAB==='rand'&&!SHOP_RAND.length&&!keep){                                   // 隨機商品全買完：可以戳的小球
    const c=h('canvas',{class:'sempty',width:360*SHOP_LARVA_K,height:240*SHOP_LARVA_K});
    c.onclick=e=>shopLarvaPoke(c,e);W.append(c);shopLarvaRun(c);
  }
  const slots=SHOP_TAB==='fixed'?SHOP_SLOTS6:SHOP_NOW.length>3?SHOP_SLOTS4:SHOP_SLOTS;
  SHOP_NOW.forEach((id,i)=>{
    const it=SHOP_ITEMS[id],pos=slots[i],st=shopState(id),sel=SHOP_SEL===id,off=st==='sold'||st==='have';
    const pic=it.img?h('img',{class:'sicon',src:assetImg(it.img),alt:''})
      :it.wear?wearIcon(it.wear)
      :h('i',{class:'ico sicon',style:`--ico:${icoUrl(it.icon)};color:${it.color}`});
    const tag=st==='sold'?T.sold:st==='have'?T.items[id].name+'｜'+T.have2:sel?T.tagBuy+'｜'+fmt(T.price,{n:it.price}):T.items[id].name;
    const slot=h('div',{class:'sslot'+(sel?' sel':'')+(off?' sold':''),style:`left:${pos.x}%;top:${pos.y}%`},
      h('button',{class:'spic',disabled:off,'aria-hidden':'true',tabindex:-1,onclick:()=>shopTap(id)},pic),
      h('span',{class:'stags'},
        h('button',{class:'stag',disabled:off,'aria-label':T.items[id].name+'，'+fmt(T.price,{n:it.price}),onclick:()=>shopTap(id)},tag),
        sel&&it.wear&&st!=='sold'?h('button',{class:'stag spv'+(SHOP_PV===id?' on':''),onclick:()=>shopPreview(id)},T.tagPreview):null));
    W.append(slot);
  });
  $('shopPts').textContent=fmt(T.points,{n:META.points});
  $('shopTalk').textContent=SHOP_SAY;
  // 預覽框（蓋在行李箱上）
  const pv=!!SHOP_PV;$('shopPvBox').hidden=!pv;
  if(pv){
    const it=SHOP_ITEMS[SHOP_PV],st=shopState(SHOP_PV);
    $('shopPvBuy').textContent=fmt(T.pvBuy,{n:it.price});$('shopPvBuy').disabled=st==='sold'||st==='have';$('shopPvBack').textContent=T.pvBack;
    cancelAnimationFrame(SHOP_RAF);const loop=t=>{if(!SHOP_PV||!$('ovShop').classList.contains('show'))return;shopPvDraw(t);SHOP_RAF=requestAnimationFrame(loop)};SHOP_RAF=requestAnimationFrame(loop);
  }
}
let SHOP_RAF=0;
// 預覽：用這一輪的小球（沒有的話用一隻白色的）戴上這個裝扮
function shopPvDraw(t){
  const c=$('shopPv'),g=c.getContext('2d'),tt=(t||0)/1000;g.imageSmoothingEnabled=false;
  const gr=g.createLinearGradient(0,0,0,96);gr.addColorStop(0,'#2b7f93');gr.addColorStop(1,'#12485c');g.fillStyle=gr;g.fillRect(0,0,96,96);   // 和聊天染色的預覽同一個底色
  const base=S||{day:1,hue:200,col:'#ffffff'};
  drawLarva(g,48,44+Math.sin(tt*.9)*2,0,Math.sin(tt*2)*.03,'idle_a',{...larvaLook(base),wear:SHOP_ITEMS[SHOP_PV].wear},tt,1,1);
}
function shopPreview(id){
  if(SHOP_PV===id){SHOP_PV=null;SHOP_SAY=TEXT.shop.items[id].talk+'\n'+fmt(TEXT.shop.price,{n:SHOP_ITEMS[id].price})}
  else{SHOP_PV=id;SHOP_SAY=TEXT.shop.preview}
  shopDraw();
}
function shopTap(id){
  const T=TEXT.shop,it=SHOP_ITEMS[id];
  if(SHOP_SEL!==id){SHOP_SEL=id;SHOP_PV=null;SHOP_SAY=T.items[id].talk+'\n'+fmt(T.price,{n:it.price});shopDraw();return}   // 第一下：選取＋介紹
  SHOP_PV=null;
  const st=shopState(id);                                                                                    // 第二下：買
  if(st==='have'){SHOP_SAY=it.wear?T.wearHave:it.tool?(PLAY_TOOLS.includes(it.tool)?T.toolHave:T.magHave):T.have;shopDraw();return}
  if(META.points<it.price){SHOP_SAY=T.poor;shopDraw();return}
  META.points-=it.price;
  let list;
  if(it.wear){META.wears.push(it.wear);list=T.items[id].name}
  else if(it.tool){META.tools.push(it.tool);list=T.items[id].name}
  else{
    const L=[];
    for(const k in it.give){S.inv[k]=(S.inv[k]||0)+it.give[k];seeItem(k);L.push(TOYS.includes(k)?NAME[k]:`${NAME[k]}×${it.give[k]}`)}
    list=L.join('、');
  }
  META.buys=(META.buys||0)+1;
  SHOP_SOLD.add(id);SHOP_SEL=null;SHOP_SAY=R(T.thanks);
  if(SHOP_TAB==='rand'&&!shopPoolLeft()){SHOP_RAND=[];SHOP_NOW=[];SHOP_SAY=T.soldOut;SHOP_LARVA=null}   // 再也沒有可以擺的：馬上換成小球（免得下次白跑一趟）
  codexSave();say(fmt(T.bought,{n:it.price,list}),'ev');
  shopDraw();
}
$('shopPvBuy').onclick=()=>{const id=SHOP_PV;if(id){SHOP_SEL=id;shopTap(id)}};
$('shopPvBack').onclick=()=>{if(SHOP_PV)shopPreview(SHOP_PV)};
// 小球和言盡靠很近時，小球優先（言盡的圖左右有留白，會先蓋住小球）
const shopLarvaHit=e=>{if(!SHOP_LAND)return false;const c=$('shopLand'),r=c.getBoundingClientRect(),x=(e.clientX-r.left)*c.width/r.width,y=(e.clientY-r.top)*c.height/r.height;
  const b=SHOP_LAND.list[0],sc=SHOP_SCENE.larvaSc,by=c.height-36*sc-14-b.z;return Math.abs(b.x-x)<=60*sc&&Math.abs(by-y)<=70*sc?x:false};
function shopLarvaTap(x){
  const T=TEXT.shop;SHOP_LAND.poke(x);
  if(SHOP_GIFT<SHOP_SCENE.giftMax&&Math.random()<HALL_RULE.gift){       // 送東西（同大樓：換水劑或點心）
    SHOP_GIFT++;let k=R(HALL_RULE.gifts);if(k==='snack')k=R(GIFTS);S.inv[k]=(S.inv[k]||0)+1;seeItem(k);
    const got=fmt(TEXT.hall.larvaGot,{item:NAME[k]});SHOP_SAY=got+'\n'+T.larvaGive;say(got,'ev');codexSave();npcHop($('shopChr'),'shop');
  }else{const li=Math.floor(Math.random()*T.sceneLarva.length);SHOP_SAY=T.sceneLarva[li];shopLineImg('shop.sceneLarva['+li+']',SHOP_SAY)}
  $('shopTalk').textContent=SHOP_SAY;
}
$('shopChr').onclick=e=>{                                          // 戳言盡：發呆那句換第二張圖；跳得很小
  const lx=shopLarvaHit(e);if(lx!==false){shopLarvaTap(lx);return}
  const L=TEXT.shop.poke,i=Math.floor(Math.random()*L.length);SHOP_SAY=L[i];SHOP_CHR=SHOP_SCENE.pokeAlt.includes(i)?1:0;shopLineImg('shop.poke['+i+']',SHOP_SAY);shopSceneDraw();npcHop($('shopChr'),'shop')};
$('shopLand').onclick=e=>{const x=shopLarvaHit(e);if(x!==false)shopLarvaTap(x)};   // 戳閒聊畫面裡的小球
$('shopChat').onclick=()=>shopView(SHOP_VIEW==='goods'?'chat':'goods');
$('shopClose').onclick=shopClose;$('shopLeave').onclick=shopClose;
;
/* ==== js/hall.js ==== */
// ===== 異生會大樓（地圖「異生會大樓」，耗 1 行動）＋成就＋心等 =====
// 進大樓先到 1F 大廳（第一次有開場），右邊（手機在下面）是電梯按鈕：4F｜3F｜2F｜1F｜B1（電腦版：左 2F 1F B1、右 4F 3F）。同一趟可以逛所有樓層。
//   3F 後勤辦公室（瓊）：查看成就（領取積分、心、裝扮）、升級心等（心夠了要自己按）。第一次去有認識瓊的對話。
//   2F（賽倫絲，心等 2）：特殊委託（v0.26）｜B1（心等 3 只有紙條；心等 4 言曉君回來，可以戳；第一次見面後問要不要接緊急委託→長相登記 v0.35；委託本身 v0.4）｜4F、5F：還不能去。
// 成就：存檔時（codexSave）檢查，剛達成的在畫面最上方跳橫幅＋訊息區記一行（META.achSeen）；領取後記在 META.achGot。
// 資料 js/data/hall.js，文字 TEXT.hall／TEXT.ach。
let HALL_IMG=null;   // 這句專用的人物圖 {say,img}（js/data/lineimg.js；只在 HALL_SAY 還是那句時有效）
// 從清單挑一句，有專用圖就記下來
function hallKeyPick(arr,key){const i=Math.floor(Math.random()*arr.length),t=arr[i],im=lineImg(key+'['+i+']');HALL_IMG=im?{say:t,img:im}:null;return t}
let HALL_AT='lobby',HALL_SAY='',HALL_CHR=0,HALL_OFFERS=null,HALL_LAND=null,HALL_GIFT=0;
let HALL_VISIT=null,HALL_GONE=[];   // 1F 現在的訪客（LOBBY_NPC 的 id）｜這一趟已經跟著回自己樓層的人（不會再出現在 1F）

EVENTS.hallFirst={pages:()=>TEXT.hall.first,apply(){META.hallMet=true;codexSave()}};
EVENTS.silenceFirst={pages:()=>TEXT.special.first,apply(){META.silenceMet=true;codexSave()}};
EVENTS.xiaojunFirst={pages:()=>TEXT.hall.xiaojunFirst,apply(){META.xiaojunMet=true;codexSave()}};
EVENTS.joanFirst={pages:()=>TEXT.hall.joanFirst,apply(){META.joanMet=true;codexSave()}};
EVENTS.yanxiangFirst={pages:()=>TEXT.hall.yanxiangFirst,apply(){META.yanxiangMet=true;codexSave()}};   // v0.40.59：4F、5F（主線第一章完成後）
EVENTS.yanjieFirst={pages:()=>TEXT.hall.yanjieFirst,apply(){META.yanjieMet=true;codexSave()}};
EVENTS.yanxiangPt={pages:()=>TEXT.hall.yanxiangPt.map(p=>p.note?{...p,note:fmt(p.note,{n:HALL_RULE.yanxiangPt})}:p),apply(){if(META.yanxiangPt)return;META.yanxiangPt=true;META.points+=HALL_RULE.yanxiangPt;say(fmt(TEXT.hall.yanxiangPtLog,{n:HALL_RULE.yanxiangPt}),'ev');codexSave()}};   // 心等 5 第一次去 4F

// 從地圖出發
function hallGo(){
  S.ap--;
  if(!META.visited.includes('assoc'))META.visited.push('assoc');
  say(TEXT.hall.arrive,'ev');codexSave();refresh();
  HALL_AT='lobby';HALL_OFFERS=null;HALL_GIFT=0;HALL_VISIT=null;HALL_GONE=[];                    // 委託名單：這一趟第一次看時才產生
  if(!META.hallMet)runEvent('hallFirst',{cb:()=>hallOpen('lobby')});
  else hallOpen('lobby');
}
function hallOpen(f){
  $('hallTitle').textContent=TEXT.hall.title;$('hallLeave').textContent=TEXT.hall.leave;
  hallFloor(f||HALL_AT);
  $('ovHall').classList.add('show');
}
function hallClose(){$('ovHall').classList.remove('show');hallLandStop();if(S)refresh()}
const heartsNow=()=>ACH.filter(a=>META.achGot.includes(a.id)).reduce((n,a)=>n+a.heart,0);
const chOk=F=>!F.ch||(META.chDone||0)>=F.ch;   // 主線章節到了沒（4F／5F）
const floorOpen=f=>!HALL_FLOORS[f].lock&&chOk(HALL_FLOORS[f])&&(META.heartLv>=(HALL_FLOORS[f].need||1));
// 換樓層：決定這層的人說什麼、站誰
function hallFloor(f){
  const H=TEXT.hall,F=HALL_FLOORS[f];
  if(!floorOpen(f)){HALL_SAY=F.lock||!chOk(F)?H.topLock:(f==='f2'?H.silenceLock:H.b1Lock)+'\n（'+fmt(H.needLv,{n:F.need})+'）';hallDraw();return}
  const from=HALL_AT,met=HALL_VISIT,followed=from==='lobby'&&met&&LOBBY_NPC[met].home===f;   // 在 1F 遇到的人，按了他那一層
  HALL_AT=f;HALL_CHR=0;
  if(f==='f2'&&!META.silenceMet){$('ovHall').classList.remove('show');runEvent('silenceFirst',{cb:()=>{hallOpen('f2');specialOpen()}});return}
  const xjBack=f==='b1'&&META.heartLv>=(F.back||1);                     // 言曉君任務回來了沒
  if(xjBack&&!META.xiaojunMet){$('ovHall').classList.remove('show');runEvent('xiaojunFirst',{cb:()=>{HALL_AT='b1';urgentAsk()}});return}   // 見面完接著問緊急委託
  if(xjBack&&!META.urgentAsked){HALL_AT='b1';urgentAsk();return}                                                                     // 舊存檔：已經見過，第一次再來時問
  if(f==='f4'||f==='top'){                                              // 4F 言巷／5F 言街：第一次有見面；言巷在心等 5 第一次會給積分
    const evs=[];
    if(f==='f4'&&!META.yanxiangMet)evs.push('yanxiangFirst');
    if(f==='top'&&!META.yanjieMet)evs.push('yanjieFirst');
    if(f==='f4'&&META.heartLv>=5&&!META.yanxiangPt)evs.push('yanxiangPt');
    if(evs.length){$('ovHall').classList.remove('show');const nx=()=>{const e=evs.shift();if(e)runEvent(e,{cb:nx});else{HALL_SAY=R(f==='f4'?H.yanxiang:H.yanjie);hallOpen(f)}};nx();return}
  }
  if(f==='f3'&&!META.joanMet){$('ovHall').classList.remove('show');runEvent('joanFirst',{cb:()=>{HALL_SAY=R(H.joan);hallOpen('f3')}});return}
  if(f==='lobby'){HALL_VISIT=lobbyPick();HALL_CHR=HALL_VISIT?0:-1;HALL_SAY=!HALL_VISIT?R(H.lobby):HALL_VISIT==='grete'?hallKeyPick(H.lobbyGrete,'hall.lobbyGrete'):hallKeyPick(H.visit[HALL_VISIT],'hall.visit.'+HALL_VISIT)}
  else if(f==='f3')HALL_SAY=R(H.joan);
  else if(f==='f4')HALL_SAY=R(H.yanxiang);
  else if(f==='top')HALL_SAY=R(H.yanjie);
  else if(f==='f2')HALL_SAY=META.special?fmt(TEXT.special.reserved,{temp:TEXT.temper[META.special.temp].name}):R(TEXT.special.idle);
  else if(f==='b1'){if(xjBack)HALL_SAY=R(H.xiaojun);else{HALL_SAY=H.b1+'\n'+fmt(H.b1Back,{n:F.back});HALL_CHR=-1}}   // 還在任務中：只有紙條、不站人
  if(followed&&H.follow[met]){HALL_SAY=H.follow[met];HALL_GONE.push(met)}
  if(f!=='lobby')HALL_VISIT=null;
  hallDraw();hallLandRun();
}
// 1F 的訪客：認識的人裡照權重挑一位（這一趟已經跟你回樓層的除外）；沒挑到＝沒人
function lobbyPick(){
  if(Math.random()>=HALL_RULE.lobbyNpc)return null;
  const c=Object.keys(LOBBY_NPC).filter(k=>!HALL_GONE.includes(k)&&LOBBY_NPC[k].met());if(!c.length)return null;
  let r=Math.random()*c.reduce((n,k)=>n+LOBBY_NPC[k].w,0);for(const k of c){r-=LOBBY_NPC[k].w;if(r<0)return k}return c[c.length-1];
}
// 畫面裡站的是誰：1F 看訪客，其他樓層是樓層主人
const hallCast=()=>{const v=HALL_AT==='lobby'&&HALL_VISIT&&HALL_VISIT!=='grete'?LOBBY_NPC[HALL_VISIT]:null,F=HALL_FLOORS[HALL_AT];
  return v?{chr:v.chr,pokeAlt:v.pokeAlt,pokeIdx:v.pokeIdx,pokeKey:'hall.visitPoke.'+HALL_VISIT,hop:v.hop,poke:TEXT.hall.visitPoke[HALL_VISIT],who:TEXT.hall.visitName[HALL_VISIT],larva:v.home}
          :{chr:F.chr,pokeAlt:F.pokeAlt,pokeIdx:F.pokeIdx,pokeKey:'hall.poke.'+HALL_AT,hop:HALL_AT,poke:TEXT.hall.poke[HALL_AT],who:TEXT.hall.who[HALL_AT],larva:HALL_AT}};
// ---------- 背景裡爬的小球（0～1 隻，js/render/land.js）：有人站著時只在左邊爬，不會撞到人 ----------
// NPC 跳一下（高度照 NPC_HOP）
function npcHop(el,who){el.style.setProperty('--hop',-(NPC_HOP[who]||16)+'px');el.classList.remove('hop');void el.offsetWidth;el.classList.add('hop')}
function hallLandStop(){if(HALL_LAND){HALL_LAND.stop();HALL_LAND=null}const c=$('hallLand');c.getContext('2d').clearRect(0,0,c.width,c.height)}
function hallLandRun(){
  hallLandStop();if(Math.random()>=HALL_RULE.larva)return;
  const c=$('hallLand'),sc=HALL_RULE.larvaSc,alone=HALL_CHR<0;
  const known=META.returned.length&&Math.random()<HALL_RULE.known?R(META.returned):null;   // 交還過的小球回來逛逛
  HALL_LAND=landStart(c,{n:1,floor:c.height-36*sc-14,xmin:60,xmax:alone?c.width-60:380,sc,
    look:known?larvaLook(known.look||{day:1,hue:0,col:'#ffffff'}):larvaLook({day:HALL_RULE.strangerDay,hue:Math.floor(Math.random()*360),col:'#ffffff'})});
  HALL_LAND.known=known;HALL_LAND.hi=false;
}
// 有沒有戳到背景的小球（回傳畫布上的 x；沒戳到＝false）。和人物重疊時小球優先
const hallLarvaHit=e=>{if(!HALL_LAND)return false;const c=$('hallLand'),r=c.getBoundingClientRect(),x=(e.clientX-r.left)*c.width/r.width,y=(e.clientY-r.top)*c.height/r.height;
  const b=HALL_LAND.list[0],sc=HALL_RULE.larvaSc,by=c.height-36*sc-14-b.z;return Math.abs(b.x-x)<=60*sc&&Math.abs(by-y)<=70*sc?x:false};
$('hallLand').onclick=e=>{const x=hallLarvaHit(e);if(x!==false)hallLarvaTap(x)};
function hallLarvaTap(x){
  const b=HALL_LAND.list[0];
  const H=TEXT.hall,k0=HALL_LAND.known;
  if(k0&&!HALL_LAND.hi){                                                  // 交還過的小球：戳的第一下＝認出你、揮手
    HALL_LAND.hi=true;b.act='wave';b.until=performance.now()+2200;
    HALL_SAY=fmt((H.knownHiTemp&&H.knownHiTemp[k0.temp])||H.knownHi,{name:k0.name});$('hallTalk').textContent=HALL_SAY;return;
  }
  HALL_LAND.poke(x);
  if(HALL_GIFT<HALL_RULE.giftMax&&Math.random()<HALL_RULE.gift){         // 小球送你道具
    HALL_GIFT++;let k=R(HALL_RULE.gifts);if(k==='snack')k=R(GIFTS);S.inv[k]=(S.inv[k]||0)+1;seeItem(k);
    const C=hallCast(),got=fmt(H.larvaGot,{item:NAME[k]}),who=HALL_CHR>=0?H.larvaSay[C.larva]:'';
    HALL_SAY=got+(who?'\n'+who:'');{const im=who&&lineImg('hall.larvaSay.'+C.larva);HALL_IMG=im?{say:HALL_SAY,img:im}:null}say(got,'ev');codexSave();
    if(who)npcHop($('hallChr'),C.hop);
  }else HALL_SAY=R(H.larvaPoke);
  $('hallTalk').textContent=HALL_SAY;
}
function hallDraw(){
  const H=TEXT.hall,f=HALL_AT,F=HALL_FLOORS[f];
  $('hallBg').src=assetImg(F.bg);
  const C=hallCast(),ch=HALL_CHR<0?null:(HALL_IMG&&HALL_IMG.say===HALL_SAY&&HALL_IMG.img)||C.chr[HALL_CHR];$('hallChr').hidden=!ch;if(ch){const e=$('hallChr');e.style.maxHeight='';e.onload=()=>{e.style.maxHeight=e.naturalHeight+'px'};chrSet(e,ch)}   // 不放大超過原圖
  $('hallWho').textContent=C.who;$('hallWho').hidden=!ch;
  $('hallWhere').textContent=H.floors[f]+'｜'+H.floorName[f];
  $('hallTalk').textContent=HALL_SAY;
  // 電梯
  const L=$('hallLift');L.textContent='';
  HALL_ORDER.forEach(k=>{
    const o=floorOpen(k),Fk=HALL_FLOORS[k];
    L.append(h('button',{class:'lbtn'+(k===f?' on':'')+(o?'':' locked'),'data-f':k,disabled:!!Fk.lock||!chOk(Fk),title:Fk.lock||!chOk(Fk)?'':(o?H.floorName[k]:fmt(H.needLv,{n:Fk.need})),onclick:()=>hallFloor(k)},H.floors[k]));
  });
  // 這一層能做的事
  const A=$('hallActs');A.textContent='';
  if(f==='f3'){
    const n=achReady().length;
    A.append(h('button',{onclick:achOpen},H.btnAch+(n?`（${n}）`:'')),h('button',{onclick:heartUp},H.btnUp));
  }
  if(f==='f2')A.append(h('button',{onclick:specialOpen},TEXT.special.btnList));
  if(f==='b1'&&HALL_CHR>=0&&META.heartLv>=(F.back||1)){   // 言曉君在：登記過＝緊急委託（準備中）＋下面「更改登記」｜還沒＝「緊急委託」再問一次
    if(META.urgent&&META.doll)A.append(h('button',{onclick:urgentGo},H.btnUrgent),h('button',{onclick:urgentEdit},H.btnReg));
    else A.append(h('button',{onclick:urgentAsk},H.btnUrgentAsk));
  }
  while(A.children.length<2)A.append(h('button',{class:'hph',tabindex:-1,'aria-hidden':'true'},'—'));   // 按鈕位置固定兩格（框的大小不變）
  heartFoot($('hallHeart'));
}
// ---------- 緊急委託的登記（B1 言曉君，v0.35）----------
// 問要不要接：有 →「好，我幫你登記」→ 長相登記（紙娃娃，js/doll.js）；按確定才算登記好｜還在考慮 →「好，你考慮。」（之後按「緊急委託」可以再回答）
function urgentAsk(){
  const H=TEXT.hall,sc=chr=>({bg:'hall_b1',chr,name:H.who.b1});
  $('ovHall').classList.remove('show');
  const back=say_=>{hallOpen('b1');HALL_SAY=say_;HALL_CHR=0;hallDraw()};   // 回到 B1，言曉君說最後那句
  showEvent(H.urgentAsk,{scene:sc('xiaojun_L_0+acc'),opts:[{id:0,label:H.urgentYes},{id:1,label:H.urgentLater}],cb:k=>{
    META.urgentAsked=true;codexSave();
    if(k===1){showEvent(H.urgentLaterSay,{scene:sc('xiaojun_L_3+acc'),cb:()=>back(H.urgentLaterSay)});return}
    showEvent(H.urgentYesSay,{scene:sc('xiaojun_L_0+acc'),btn:H.urgentStart,cb:()=>dollOpen({done:ok=>{
      if(ok){META.urgent=true;codexSave();say(H.urgentLog,'ev');back(H.urgentDone)}
      else back(H.urgentCancel);
    }})});
  }});
}
// 進主線（v0.40.1）：正在照顧小球時，言曉君確認後由賽倫絲接手（這一輪不收錄）；第 0 日直接進
function urgentGo(){
  const H=TEXT.hall,sc=chr=>({bg:'hall_b1',chr,name:H.who.b1});
  $('ovHall').classList.remove('show');
  const go=()=>{if(S&&!PV){toIdle()}storyOpen()};
  if(!S||PV){go();return}
  showEvent(H.urgentGoAsk,{scene:sc('xiaojun_L_0+acc'),opts:[{id:0,label:H.urgentGoYes,main:true},{id:1,label:H.urgentGoNo}],cb:k=>{
    if(k===1){hallOpen('b1');return}
    showEvent(H.urgentHandover,{scene:sc('xiaojun_L_0+acc'),cb:go});
  }});
}
// 更改登記：直接打開長相登記
function urgentEdit(){dollOpen({done:ok=>{if(ok){HALL_SAY=TEXT.hall.regDone;HALL_CHR=0;hallDraw()}}})}
// 心等徽章（點亮到目前等級）＋心數
function heartFoot(box){
  const H=TEXT.hall,lv=META.heartLv;box.textContent='';
  const b=h('span',{class:'hbadges'});
  for(let i=1;i<=HEART_RULE.max;i++)b.append(h('img',{class:'hbadge'+(i<=lv?' on':''),src:assetImg('heart_badge'),alt:''}));
  const nx=HEART_RULE.need[lv+1];
  const nc=(HEART_RULE.ch||{})[lv+1],chNo=nc&&(META.chDone||0)<nc;   // 心等 5：還要主線第一章完成
  box.append(b,h('span',{},fmt(H.status,{lv,h:heartsNow()})),h('small',{class:'dim'},nx?fmt(chNo?H.nextCh:H.next,{n:lv+1,need:nx,ch:nc}):H.maxLv));
}
function heartUp(){
  const H=TEXT.hall,lv=META.heartLv,nx=HEART_RULE.need[lv+1];
  HALL_CHR=0;
  if(!nx){HALL_SAY=H.upMax;hallDraw();return}
  const nc=(HEART_RULE.ch||{})[lv+1];
  if(nc&&(META.chDone||0)<nc){HALL_SAY=H.upCh;hallDraw();return}
  if(heartsNow()<nx){HALL_SAY=H.upNo;hallDraw();return}
  META.heartLv=lv+1;codexSave();HALL_CHR=0;
  HALL_SAY=H.up[META.heartLv]||'';
  say(fmt(H.upLog,{n:META.heartLv})+((HEART_RULE.shop[META.heartLv]||0)>(HEART_RULE.shop[lv]||0)?H.upShop:''),'ev');
  toast(fmt(H.upLog,{n:META.heartLv}));
  hallDraw();
}

// ---------- 成就 ----------
const achDone=a=>{const [c,n]=a.prog();return c>=n};
const achReady=()=>ACH.filter(a=>achDone(a)&&!META.achGot.includes(a.id));
function achOpen(){
  $('achTitle').textContent=TEXT.ach.title;achDraw();$('ovAch').classList.add('show');
}
function achDraw(){
  const T=TEXT.ach,box=$('achBody');box.textContent='';
  const ready=achReady();
  $('achAll').textContent=T.claimAll;$('achAll').disabled=!ready.length;
  heartFoot($('achHead'));
  let last=null;
  ACH.forEach(a=>{
    if(a.cat!==last){if(last)box.append(h('hr',{class:'div'}));box.append(h('div',{class:'bagh'},T.cats[a.cat]));last=a.cat}
    const L=T.list[a.id],done=achDone(a),got=META.achGot.includes(a.id),[c,n]=a.prog();
    const name=done?L.name:T.hidden,cond=done||a.hide!=='all'?L.cond:T.hidden;
    const rw=fmt(T.reward,{h:a.heart,pt:achPts(a)})+(a.wear?fmt(T.rewardWear,{w:wearName(a.wear)}):'');
    const right=got?h('span',{class:'dim'},T.claimed):done?h('button',{class:'ib achget',onclick:()=>{achClaim(a);achDraw();hallDraw()}},T.claim)
      :h('span',{class:'dim'},a.hide==='all'?'':`${Math.min(c,n)}／${n}`);
    box.append(h('div',{class:'achrow'+(got?' got':done?' ready':'')},h('div',{class:'achtxt'},h('strong',{},name),h('div',{class:'dim'},cond),h('div',{class:'achrw'},rw)),right));
  });
}
function achClaim(a,quiet){
  if(META.achGot.includes(a.id)||!achDone(a))return;
  const T=TEXT.ach;
  META.achGot.push(a.id);META.points+=achPts(a);
  if(a.wear&&WEARS[a.wear]&&!META.wears.includes(a.wear)){META.wears.push(a.wear);say(fmt(T.gotWear,{w:wearName(a.wear)}),'ev')}
  say(fmt(T.got,{name:T.list[a.id].name,h:a.heart,pt:achPts(a)}),'ev');
  if(!quiet)codexSave();
}
function achClaimAll(){achReady().forEach(a=>achClaim(a,true));codexSave();achDraw();hallDraw()}

// 存檔後檢查：剛達成的跳橫幅（一次很多個就合併成一則）
let ACH_T=0;
function achSoon(){clearTimeout(ACH_T);ACH_T=setTimeout(achCheck,60)}
function achCheck(){
  if(typeof ACH==='undefined')return;
  const fresh=ACH.filter(a=>!META.achSeen.includes(a.id)&&achDone(a));
  if(!fresh.length)return;
  const T=TEXT.ach;
  fresh.forEach(a=>META.achSeen.push(a.id));
  saveRaw();                                     // 不用 codexSave：避免又觸發一次成就檢查
  if(fresh.length>2){achBanner(fmt(T.bannerMany,{n:fresh.length}));if(S)say(fmt(T.logMany,{n:fresh.length}),'ev');return}
  fresh.forEach(a=>{const nm_=T.list[a.id].name;achBanner(fmt(T.banner,{name:nm_}));if(S)say(fmt(T.log,{name:nm_}),'ev')});
}
// 畫面最上方滑下來的橫幅（排隊依序顯示）
const BANNER_Q=[];let bannerBusy=false;
function achBanner(t){BANNER_Q.push(t);if(!bannerBusy)bannerNext()}
function bannerNext(){
  const t=BANNER_Q.shift();if(!t){bannerBusy=false;return}
  bannerBusy=true;const el=$('achBanner');
  el.textContent='';el.append(h('img',{src:assetImg('heart_badge'),alt:''}),h('span',{},t));
  el.classList.add('show');
  setTimeout(()=>{el.classList.remove('show');setTimeout(bannerNext,450)},3200);
}

// 戳一下站在畫面裡的人：隨機一句（TEXT.hall.poke）
$('hallChr').onclick=e=>{const lx=hallLarvaHit(e);if(lx!==false){hallLarvaTap(lx);return}const C=hallCast(),L=C.poke;if(!L)return;const i=Math.floor(Math.random()*L.length);HALL_SAY=L[i];{const im=lineImg(C.pokeKey+'['+i+']');HALL_IMG=im?{say:HALL_SAY,img:im}:null}if(C.chr[1])HALL_CHR=C.pokeIdx&&C.pokeIdx[i]!=null?C.pokeIdx[i]:C.pokeAlt?(C.pokeAlt.includes(i)?1:0):HALL_CHR===0?1:0;hallDraw();
  npcHop($('hallChr'),C.hop)};   // 跳一下
$('hallClose').onclick=hallClose;$('hallLeave').onclick=hallClose;
$('achClose').onclick=()=>$('ovAch').classList.remove('show');
$('achAll').onclick=achClaimAll;
setTimeout(achCheck,800);   // 讀檔後：舊存檔已經達成的成就（合併成一則）

// ---------- 特殊委託（2F 賽倫絲）----------
function specialRoll(){
  const lv=Math.min(Math.max(...Object.keys(SPECIAL_RULE.count).map(Number)),META.heartLv),n=SPECIAL_RULE.count[lv]||2,od=SPECIAL_RULE.odds[lv]||SPECIAL_RULE.odds[2],T=TEXT.special;
  return Array.from({length:n},()=>{
    const r=Math.random(),k=r<od.none?0:r<od.none+od.one?1:2,tags=[];
    for(let i=0;i<k;i++){
      const pool=Object.keys(TAGS).filter(id=>!SPECIAL_RULE.noTag.includes(id)&&!TAGS[id].off&&!tags.includes(id)&&!TAG_CLASH.some(([a,b])=>(a===id&&tags.includes(b))||(b===id&&tags.includes(a))));
      if(!pool.length)break;let w=Math.random()*pool.reduce((s,id)=>s+TAGS[id].weight,0);tags.push(pool.find(id=>(w-=TAGS[id].weight)<0)||pool[pool.length-1]);
    }
    const temp=R(TEMPER_IDS),fit=[...tags.flatMap(t=>T.whyTag[t]||[]),...(T.whyTemp[temp]||[])];   // 有對應標籤或個性的說明文：比較常用
    const why=fmt(fit.length&&Math.random()<SPECIAL_RULE.tagWhy?R(fit):R(T.why),{who:R(T.who)});
    return {temp,tags,hue:Math.floor(Math.random()*360),why};
  });
}
const specialLocked=()=>!!META.special;          // 這一輪已經預約（下一輪開始時才清掉）
function specialOpen(){
  if(!HALL_OFFERS)HALL_OFFERS=specialRoll();
  $('spTitle').textContent=TEXT.special.title;specialDraw();$('ovSpecial').classList.add('show');
}
function specialDraw(){
  const T=TEXT.special,box=$('spBody');box.textContent='';
  $('spHint').textContent=specialLocked()?T.locked:T.hint;
  HALL_OFFERS.forEach((o,i)=>{
    const c=h('canvas',{width:96,height:96,class:'spthumb'});const g=c.getContext('2d');g.imageSmoothingEnabled=false;
    const gr=g.createLinearGradient(0,0,0,96);gr.addColorStop(0,'#2b7f93');gr.addColorStop(1,'#12485c');g.fillStyle=gr;g.fillRect(0,0,96,96);
    drawLarva(g,48,44,0,0,'idle_a',larvaLook({day:3,hue:o.hue,col:'#ffffff'}),0,1,1);
    const mine=META.special&&META.special.why===o.why&&META.special.temp===o.temp;
    const btn=mine?h('span',{class:'achrw'},T.booked):h('button',{class:'ib main',disabled:specialLocked(),onclick:()=>specialBook(o)},T.book);
    // 和「小球們」同一種卡片：縮圖｜名字與說明｜按鈕
    box.append(h('div',{class:'lrow'+(mine?' on':'')},c,
      h('div',{class:'lmid'},h('div',{class:'nrow'},h('strong',{class:'nm'},tipSpan(o.temp))),h('div',{class:'dim'},T.tagHead+(o.tags.length?o.tags.map(t=>TEXT.tags[t].name).join('、'):T.noTag)),h('div',{class:'spwhy'},o.why)),
      h('div',{class:'lact'},btn)));
  });
}
function specialBook(o){
  if(specialLocked())return;
  META.special={...o,tags:[...o.tags],rnd:META.rounds};codexSave();
  const T=TEXT.special,tg=o.tags.length?'、'+o.tags.map(t=>TEXT.tags[t].name).join('、'):'';
  say(fmt(T.log,{temp:TEXT.temper[o.temp].name,tags:tg}),'ev');
  HALL_SAY=fmt(T.reserved,{temp:TEXT.temper[o.temp].name});HALL_CHR=1;
  specialDraw();hallDraw();
}
$('spClose').onclick=()=>$('ovSpecial').classList.remove('show');
;
/* ==== js/doll.js ==== */
// ===== 紙娃娃（玩家的長相，v0.35）：合成、白邊、長相登記編輯器 =====
// 資料在 js/data/doll.js，文字在 TEXT.doll。圖第一次用到時才讀（dollLoad），不拖慢開遊戲。
// 打開編輯器：dollOpen({done:ok=>{…}})　ok＝按了「確定」（長相已存進 META.doll）；按 ✕＝取消，不存。
// 畫到畫布上：dollPaint(canvas, META.doll, 表情 id 或 '')；畫布大小隨意（建議 186×200 的倍數）。
const DOLL_IMG={};let DOLL_READY=null;
const dollSrc=k=>(typeof ASSETS!=='undefined'&&ASSETS['doll/'+k])||'assets/doll/'+k+'.png?v='+VERSION;   // ?v：換圖後不會讀到瀏覽器裡的舊圖
const DOLL_ONE={};   // 每個部件的讀取（Promise），讀過就不再讀
const dollOne=k=>DOLL_ONE[k]||(DOLL_ONE[k]=new Promise(r=>{const i=new Image();i.onload=()=>{DOLL_IMG[k]=i;r()};i.onerror=r;i.src=dollSrc(k)}));
// dollLoad()＝全部部件（長相登記、衣櫃縮圖要用）｜dollLoad(長相)＝只讀這個長相用到的部件（含各表情），比較快（v0.41.0）
function dollLoad(st){
  const all=['body',...Object.values(DOLL_LISTS).flat()];
  if(!st){if(!DOLL_READY)DOLL_READY=Promise.all(all.map(dollOne));return DOLL_READY}
  const has=new Set(all),need=new Set(['body']),walk=v=>{if(typeof v==='string'){if(has.has(v))need.add(v)}else if(v&&typeof v==='object')Object.values(v).forEach(walk)};
  walk(st);return Promise.all([...need].map(dollOne));
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
  if(!im)return c;                     // 圖還沒讀好：先不記（v0.40：不然讀好之後還是空白）
  if(DOLL_TINT.size>240)DOLL_TINT.clear();
  DOLL_TINT.set(key,c);return c;
}
// 褲襪：整片剪影填上顏色（畫的時候 multiply，所以腿的線條、膚色都透出來）
function dollSheer(file,col){const key='sheer|'+file+'|'+col,hit=DOLL_TINT.get(key);if(hit)return hit;
  const im=DOLL_IMG[file],c=dollCv(),g=c.getContext('2d');if(!im)return c;
  g.drawImage(im,0,0,c.width,c.height);g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,c.width,c.height);DOLL_TINT.set(key,c);return c}
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
    if(DOLL_SLOTS.includes(k)){const id=st[k];if(!id||id==='none')return;   // 衣物：可以換色的照 st.wc；褲襪＝顏色片 multiply 疊上去（透明度 st.wa）
      if(DOLL_SHEER.includes(id)){g.save();g.globalAlpha=st.wa??DOLL_WEAR_DEF.wa;g.globalCompositeOperation='multiply';g.drawImage(dollSheer(id,(st.wc||{})[k]||DOLL_WEAR_DEF.wc[k]),0,0,DOLL_W,DOLL_H);g.restore();return}
      return dollFile(g,id,null,DOLL_WEAR_TINT.includes(id)?((st.wc||{})[k]||DOLL_WEAR_DEF.wc[k]):null)}
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
  olStamp(og,s,r);
  og.drawImage(src,0,0);return o;
}
// 描白邊：把白色剪影蓋在「原本那個圓（x²+y²≤r²+r）的邊界」上，再加一圈半徑一半的內圈（很小的碎點才不會描成空心圈）。
// v0.41.0：原本把整個圓裡的每一點都蓋一次（r=6 要 113 次，31 張立繪在手機上要跑 30 秒以上），改成 49 次；和原本比只差幾個像素
const OL_OFS={};
function olOffsets(r){if(OL_OFS[r])return OL_OFS[r];const seen=new Set(),out=[],add=(x,y)=>{const k=x+','+y;if(!seen.has(k)){seen.add(k);out.push([x,y])}};
  const inD=(x,y)=>x*x+y*y<=r*r+r;
  for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(inD(x,y)&&(!inD(x+1,y)||!inD(x-1,y)||!inD(x,y+1)||!inD(x,y-1)))add(x,y);
  const R=r/2,n=Math.max(8,Math.ceil(2*Math.PI*R/1.5));for(let i=0;i<n;i++){const a=i/n*2*Math.PI;add(Math.round(R*Math.cos(a)),Math.round(R*Math.sin(a)))}
  return OL_OFS[r]=out}
function olStamp(g,mask,r){olOffsets(r).forEach(([x,y])=>g.drawImage(mask,x,y))}
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

function dollThumbSheer(file,col){const c=h('canvas',{width:120,height:120}),g=c.getContext('2d'),[x0,y0,x1,y1]=DOLL_BB[file],w=x1-x0,ht=y1-y0,k=Math.min(100/w,100/ht,6),K=DOLL_K;
  g.drawImage(dollSheer(file,col||'#2b2b33'),x0*K,y0*K,w*K,ht*K,60-w*k/2,60-ht*k/2,w*k,ht*k);return c}
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
  if(DOLL_SLOTS.includes(k)){   // 衣服：只挑圖（顏色在主線的收納 → 衣櫃換）
    if(DOLL_PARTS[k].none)grid.append(h('button',{class:'dcell'+(E.st[k]==='none'?' on':''),onclick:()=>{E.st[k]='none';dollDraw()}},dollThumb(null),h('span',{},T.none)));
    DOLL_LISTS[k].forEach(f=>grid.append(h('button',{class:'dcell'+(E.st[k]===f?' on':''),onclick:()=>{E.st[k]=f;dollDraw()}},dollThumb(f,DOLL_WEAR_TINT.includes(f)?(E.st.wc||{})[k]:null),h('span',{},(T.wear&&T.wear[f])||f.split('_')[1]))));
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
;
/* ==== js/wardrobe.js ==== */
// ===== 衣櫃（v0.40.43）：主線「收納 → 衣櫃」和日常「玩家設定 → 長相」共用 =====
// 畫出來是一段 HTML（wardHTML），點擊交給 wardClick、自己選顏色／透明度交給 wardChange，縮圖畫在 wardPaint。
// 衣服資料在 js/data/doll.js（DOLL_LISTS、DOLL_WEAR_TINT 可以換色、DOLL_SHEER 褲襪），字在 TEXT.doll（wear 名字、ward 介面）。
// 穿上就存（META.doll，全存檔共用）。
const WARD_TABS=['set','top','pants','socks','shoes','acc'];   // 套裝｜上衣｜下身（褲、裙）｜襪子｜鞋子｜配飾
const WARD_SLOT={top:'top',pants:'pants',socks:'socks',shoes:'shoes',acc:'glass'};   // 分頁 → 身上的格子（套裝還沒有衣服；配飾＝眼鏡＋手拿的兩格，換色的是眼鏡）
// 這件有沒有：要買的衣物在主線看這個存檔（STY.wearOwn），日常看 META.wearOwn（主線存過檔的都算；v0.40.69）
const wearHas=id=>!DOLL_SHOP_WEAR.includes(id)||(document.body.classList.contains('story')&&typeof STY!=='undefined'&&STY?STY.wearOwn||[]:META.wearOwn||[]).includes(id);
const wardDoll=()=>META.doll||dollDef();
// 一格衣服：縮圖（照現在的顏色）＋名字；點了直接穿上（none＝不穿，只有襪子、鞋子有）
function wardCell(slot,id){const d=wardDoll(),on=slot==='acc'?d.glass==='none'&&d.hold==='none':(d[slot]||'none')===id,col=DOLL_WEAR_TINT.includes(id)?(d.wc||{})[slot]:'';
  return `<button class="sbcell swc${on?' on':''}" data-wear="${slot}:${id}"><canvas class="swthumb" data-wid="${id}" data-tc="${esc(col||'')}" width="120" height="120"></canvas><span>${esc(id==='none'?(TEXT.doll.noneSlot||{})[slot]||TEXT.doll.none:TEXT.doll.wear[id]||id)}</span></button>`}
// 換色（穿著可以換色的才出現）：色票＋自己選；褲襪多一條透明度（電腦左右各半、手機上下）
function wardCol(slot){const d=wardDoll(),id=d[slot];if(!id||id==='none'||!DOLL_WEAR_TINT.includes(id))return '';
  const W=TEXT.doll.ward,cur=(d.wc||{})[slot]||DOLL_WEAR_DEF.wc[slot],sheer=DOLL_SHEER.includes(id),a=Math.round((d.wa??DOLL_WEAR_DEF.wa)*100);
  return `<div class="swcol${sheer?' two':''}"><div class="swc1"><span class="swlab">${esc(fmt(W.col,{n:TEXT.doll.wear[id]||id}))}</span><div class="swsw">${DOLL_CLOTH.map(c=>`<button class="${c===cur?'on':''}" style="background:${c}" data-wcol="${slot}:${c}" aria-label="${c}"></button>`).join('')}<label class="swown" style="background:${esc(cur)}"><input type="color" value="${esc(cur)}" data-wcolin="${slot}" aria-label="${esc(W.own)}"></label></div></div>`
    +(sheer?`<label class="swa"><span>${esc(W.sheer)}</span><input type="range" min="10" max="100" step="10" value="${a}" data-wa="1"><b>${a}%</b></label>`:'')+'</div>';}
// 分類按鈕｜（線）｜格子｜（線）｜換色
function wardHTML(wt){const W=TEXT.doll.ward;wt=WARD_TABS.includes(wt)?wt:'top';const sl=WARD_SLOT[wt];
  const lock=n=>Array(n).fill(`<button class="sbcell lock" disabled><span class="ssw"></span>${esc(W.shop)}</button>`).join('');
  const cells=s=>(DOLL_PARTS[s].none?wardCell(s,'none'):'')+DOLL_LISTS[s].filter(wearHas).map(id=>wardCell(s,id)).join(''),has=s=>DOLL_LISTS[s].filter(wearHas).map(id=>wardCell(s,id)).join('');
  const grid=!sl?lock(6):wt==='acc'?wardCell('acc','none')+has('glass')+has('hold')+lock(2):cells(sl)+lock(2);   // 配飾：「不戴配飾」（眼鏡、手拿的都拿掉，v0.40.67）＋有的眼鏡、應援組合
  return `<div class="swtabs">${WARD_TABS.map(t=>`<button class="${t===wt?'on':''}" data-wtab="${t}">${esc(W.tabs[t])}</button>`).join('')}</div><div class="sbgrid" data-hl="grid">${grid}</div>${sl?wardCol(sl):''}`;}
function wardSet(f){const d=META.doll=META.doll||dollDef();f(d);META.doll=dollNorm(d);codexSave();if(typeof STORY_DOLL!=='undefined')STORY_DOLL={}}
const WARD_SEL='[data-wtab],[data-wear],[data-wcol]';
// 衣物說明（v0.40.67，主線的收納 → 衣櫃）：最後點的那件的名字＋說明（TEXT.doll.wearDesc）
let WARD_LAST=null;
const wardDesc=()=>{const id=WARD_LAST;return `<div class="swdesc">${id?`<b>${esc(TEXT.doll.wear[id]||id)}</b><span>${esc((TEXT.doll.wearDesc||{})[id]||'')}</span>${id.startsWith('fan_')?`<small>${esc(TEXT.doll.fanNote)}</small>`:''}`:''}</div>`};
// 點擊：t＝點到的那個（closest(WARD_SEL)）；tab＝換分頁要做的事。回傳 true＝處理了（呼叫的人重畫）
function wardClick(t,tab){const d=t&&t.dataset;if(!d)return false;
  if(d.wtab){tab(d.wtab);return true}
  if(d.wear){const [k,id]=d.wear.split(':');WARD_LAST=id==='none'?null:id;wardSet(o=>{if(k==='acc'){o.glass='none';o.hold='none'}else o[k]=id});return true}
  if(d.wcol){const [k,c]=d.wcol.split(':');wardSet(o=>{o.wc={...(o.wc||{}),[k]:c}});return true}
  return false;}
// 自己選顏色、透明度（change＝放開才套用：重畫會換掉輸入框）
function wardChange(t){const d=t.dataset;
  if(d.wcolin){wardSet(o=>{o.wc={...(o.wc||{}),[d.wcolin]:t.value}});return true}
  if(d.wa){wardSet(o=>{o.wa=+t.value/100});return true}
  return false;}
// 縮圖（圖要先讀好：dollLoad）
function wardPaint(root){root.querySelectorAll('canvas.swthumb').forEach(c=>{const g=c.getContext('2d'),id=c.dataset.wid;g.clearRect(0,0,c.width,c.height);
  g.drawImage(id==='none'?dollThumb(null):DOLL_SHEER.includes(id)?dollThumbSheer(id,c.dataset.tc):dollThumb(id,c.dataset.tc||null),0,0,c.width,c.height)})}
;
/* ==== js/story/main.js ==== */
// ===== 主線（故事模式，v0.40）：家、行程、執行這週、狀態、背包、水缸、系統 =====
// v0.40.34 起主線全部在 js/story/：
//   main.js 進入／離開、存檔｜week.js 行程＋執行這週｜script.js 劇情引擎｜vn.js 劇情畫面＋預覽｜sys.js 系統
//   art.js 圖｜view.js 各畫面｜free.js 自由行動｜render.js 重畫＋點擊
//   資料 js/story/data/story.js（STORY_*）、storyscript.js（劇情）、texts.js（TEXT.story）；樣式 css/story.css。
// 畫面是一張固定大小的「舞台」再整張縮放：電腦／橫放 1280×720（放不下就加黑邊）、手機直放寬 390、高度跟著螢幕。
// 存檔：META.story＝自動存檔（每週開始、白天回到家時）；META.storySlots＝手動存檔 3 格。週中途存的會多一個 run（這週跑到哪一天，見 storyRunNorm）。
// 進入：第 0 日的「主線：緊急委託」按鈕（長相登記過才有）→ storyOpen()。

let STY=null;          // 進行中的主線（從 META.story 複製出來；週結束後寫回）
let STRUN=null;        // 執行這週的進度 {i, phase 0 執行｜1 結束, still, res[], start, end, bgFade}
const SUI={scr:'home',sel:0,tab:'care',stab:'me',btab:'wear',greteOn:false,tip:0,bgx:null,toast:'',encPop:null,sched:null};
const ST_DAYS=()=>TEXT.story.days;
const stT=()=>TEXT.story;

// ---------- 存檔 ----------
const storyCopy=o=>JSON.parse(JSON.stringify(o));
// 要存的東西：STY＋（白天在家時）這週的進度。讀進來：stResume 把進度接回去（v0.40.44）
// 主線存檔時：這個存檔拿到的衣物併進 META.wearOwn（日常模式看得到；v0.40.69）
function storyOwnSync(){const w=STY&&STY.wearOwn||[];if(w.some(x=>!(META.wearOwn||[]).includes(x)))META.wearOwn=[...new Set([...(META.wearOwn||[]),...w])]}
function storyPack(){storyOwnSync();const o=storyCopy(STY);delete o.run;if(typeof stHub==='function'&&stHub())o.run=stRunPack();return o}
function storyAutoSave(){STY.at=new Date().toISOString().slice(0,10);if(STY.freeMode){META.storyFree=META.storyFree||[null,null,null];META.storyFree[STY.freeSlot||0]=storyPack()}else META.story=storyPack();codexSave()}   // 自由模式只存回中繼存檔（和一般存檔分開）

// ---------- 進入／離開 ----------
// v0.40.33：入口＝新遊戲｜讀取（一般存檔：自動存檔＋手動 3 格｜自由模式存檔：每章結束時存，第一章過關後才有）
function storyOpen(){
  if(!META.urgent||!META.doll)return;
  const T=stT().start,has=!!META.story||(META.storyFree||[]).some(Boolean)||(META.storySlots||[]).some(Boolean);
  if(!has){pick(T.title,[{node:stTxtNode()},{id:'go',label:T.ok,main:true}],()=>storyEnter(null),T.body);return}
  pick(T.title,[{id:'new',label:T.newGame},{id:'load',label:T.loadGame,main:true}],k=>k==='new'?storyNewAsk():storyLoadMenu(),T.menuBody);
}
function storyNewAsk(){const T=stT().start;
  pick(T.newAsk,[{node:stTxtNode()},{id:'go',label:T.ok,main:true},{id:'back',label:T.back}],k=>k==='go'?storyEnter(null):storyOpen(),T.newBody);}
// 讀取清單的中繼存檔 3 格（id：free0～free2；全空＝一行說明）
function stFreeItems(){const T=stT().start,F=META.storyFree||[];
  if(!F.some(Boolean))return [{id:'free',label:T.freeNone,off:true}];
  return [0,1,2].map(i=>{const f=F[i];return {id:'free'+i,label:stFreeLabel(f,i),off:!f}})}
function storyLoadMenu(){const T=stT().start,TS=stT().sys,sl=META.storySlots||[],au=META.story;
  pick(T.loadTitle,[{head:T.loadNormal},
    {id:'auto',label:fmt(T.autoSlot,{info:au?stSlotInfo(au):TS.empty}),off:!au,main:!!au},
    ...[0,1,2].map(i=>({id:i,label:stSlotLabel(sl[i],i),off:!sl[i]})),
    {rule:true,label:T.loadFree},...stFreeItems(),
    {id:'back',label:T.back}],k=>{
    if(k==='back'){storyOpen();return}
    if(k==='auto')storyEnter(storyCopy(au));
    else if(String(k).startsWith('free')){const f=(META.storyFree||[])[+String(k).slice(4)];if(f)storyEnter(storyCopy(f))}
    else if(typeof k==='number'&&sl[k]){storyEnter(storyCopy(sl[k]));storyAutoSave();stFlash(fmt(TS.loaded,{n:k+1}))}
  });}
// 進到主線：sty＝讀進來的存檔；null＝新遊戲（第一章開頭，播開場）
function storyEnter(sty){
  const fresh=!sty;STY=sty||storyNew();SUI.greteOn=false;
SUI.bgx=null;STORY_DOLL={};stResume();stJobNews(!Array.isArray(STY.jobSeen));if(fresh)storyAutoSave();
  $('ovStory').classList.add('show');document.body.classList.add('story');stPreload();
  if(META.doll&&['glass','hold'].some(k=>META.doll[k]!=='none'&&!wearHas(META.doll[k])))wardSet(o=>{['glass','hold'].forEach(k=>{if(!wearHas(o[k]))o[k]='none'})});   // 這個存檔沒有的配飾就拿掉（衣物分存檔，v0.40.69）

  if(fresh)SUI.loading=true;   // 新遊戲：先黑畫面讀取，不要先閃出房間（開場讀好就會換掉）
  stDollLoad();
  if(fresh)stPlay([...stEvents('start'),...stEvents('weekStart',1)],()=>storyAutoSave());
  stRender();
}
function storyClose(){SUI.over=false;document.body.classList.remove('storyday');clearTimeout(ST_TIMER);clearInterval(ST_TW);SUI.loading=false;STRUN=null;SUI.vn=null;$('ovStory').classList.remove('show');document.body.classList.remove('story')}
function storyLeaveAsk(){
  const T=stT().leave;
  const hub=stHub();
  pick(T.title,[{id:'save',label:T.saveFirst},{id:'ok',label:T.ok,main:true},{id:'no',label:T.cancel}],k=>{
    if(k==='ok'){if(hub)storyAutoSave();storyClose()}
    if(k==='save')stSysSave(()=>{if(hub)storyAutoSave();storyClose()});
  },hub?T.bodyDay:T.body);
}
;
/* ==== js/story/week.js ==== */
// ===== 主線 week.js：行程（排行程的規則）＋執行這週（一天的結果 stRoll、一天一天播 stStep、當天的劇情、週結算、章末） =====
// 主線的程式拆成 js/story/*.js（v0.40.34），照 index.html 的順序載入，全部是全域變數。

// ---------- 行程 ----------
const stCmdName=id=>stT().cmd[id];
// 固定日（換藥水）：自由模式不固定（不預先排進去，當普通指令；v0.40.64）
const stFixed=c=>STY.freeMode?null:c.fixed;
function stFixedFill(){const a=Array(7).fill('');for(const id in STORY_CMDS){const f=stFixed(STORY_CMDS[id]);if(f)f.forEach(d=>a[d]=id)}return a}
const stMedN=()=>SUI.sched.filter(x=>x==='med').length;
// ---------- 指令能不能做（v0.40.37 統整：所有「顯示／隱藏／變灰」都在這張表）----------
// 兩個地方會列出指令：plan＝行程表、free＝自由行動（地點卡、大樓）。
// 每一條規則：in＝在哪裡檢查（both／plan／free）、hide＝符合就不列出來、off＝符合就列出來但變灰（回傳要寫的原因）。
// 照順序檢查，第一條符合的就決定。新的條件＝這張表加一行；特例寫成 STORY_CMDS 的欄位（例 need、kick），畫面程式不另外判斷。
// v0.40.44：自由行動改成點了直接做（js/story/free.js），這張表主要給行程表用；打工不用先去過，數值到了就出現
const stOpen=o=>!o.open||(STY.open||[]).includes(o.open);   // 劇情開放後才出現（v0.40.23；地圖名牌、大樓樓層也用）
const stHas=k=>!!((STY.items||{})[k]||(STRUN&&STRUN.res.some(x=>x&&(x.buys||[]).includes(k))));   // 買到的東西（這週前面買的也算）
const stDid=id=>STY.seen.includes(id)||!!(STRUN&&STRUN.res.some(x=>x&&x.id===id));   // 做過這件事（這週前面也算；4F 去過一次就鎖）
const stCur=()=>STRUN?STRUN.end:STY.st;   // 現在的數值：週中途（回家改行程、看狀態）用這週目前的
const ST_GATES=[
  {k:'open',    in:'both', hide:c=>!stOpen(c)},                            // 劇情還沒開放（開放:異生會4F）
  {k:'book',    in:'both', hide:c=>c.book&&!stHas(c.book)},                // 讀書：要先買那本書
  {k:'freeOnly',in:'plan', hide:c=>c.freeOnly},                            // 只在自由行動發生（逛道具店、白跑一趟）
  {k:'need',    in:'plan', hide:(c,id,st)=>c.need&&Object.keys(c.need).some(k=>st[k]<c.need[k])},   // 數值門檻：沒到不顯示，到了直接出現（v0.40.44）
  {k:'money',   in:'both', off:(c,id,st)=>c.eff.money<0&&st.money<-c.eff.money&&fmt(stT().poor,{n:-c.eff.money})}   // 錢不夠
];
// where：plan｜free。回傳 {hide, off（變灰的原因，''＝可以做）}。週中途用這週目前的數值
function stGate(id,where){const c=STORY_CMDS[id],st=stCur();
  for(const g of ST_GATES){if(g.in!=='both'&&g.in!==where)continue;
    if(g.hide&&g.hide(c,id,st))return {hide:true,off:''};
    const o=g.off&&g.off(c,id,st);if(o)return {hide:false,off:o};}
  return {hide:false,off:''};}
const stShown=(id,where='free')=>!stGate(id,where).hide;
const stOff=(id,free)=>stGate(id,free?'free':'plan').off;
// 指令下面那行：效果的上下箭頭（好的綠、壞的紅）＋備註
function stEffHTML(id){const c=STORY_CMDS[id],T=stT(),e=c.eff,parts=[];
  for(const k in e){if(k==='rnd'){parts.push(`<i>${esc(T.rnd)}</i>`);continue}if(k==='money')continue;
    const v=e[k],cost=k==='fat'||k==='tired',good=cost?v<0:v>0,ar=Math.abs(v)>=20?(v>0?'↑↑':'↓↓'):(v>0?'↑':'↓');
    parts.push(`<${good?'i':'u'}>${esc(T.S[k])}${ar}</${good?'i':'u'}>`);}
  if(c.hurt&&(STRUN?STRUN.end.meds:STY.meds)<c.hurt.n)parts.push(`<u>${esc(T.S.calm)}↓</u>`);   // 換藥水：前三次會痛（第四次以後不寫）
  if(c.cat==='care'&&!e.tired)parts.push(`<u>${esc(T.S.tired)}↑</u>`);
  const note=T.note[id];return parts.join(' ')+(note?'　'+esc(note):'')+(c.min?'　'+esc(fmt(T.minNote,{n:c.min})):'')+(c.cap?Object.keys(c.cap).map(k=>esc(fmt(T.capNote,{stat:T.S[k],n:c.cap[k]}))).join(''):'');}

// ---------- 一天的結果（規則照「後續規劃（v0.4）」）----------
function stRoll(st,id,forced){
  const c=STORY_CMDS[id],R_=STORY_RULE,care=c.cat==='care';
  let r='ok';
  if(care){const ok=st.tired<100&&Math.random()<.5+st.mood/200;r=ok?(Math.random()<R_.crit?'great':'ok'):(Math.random()<R_.fumble?'bad':'fail')}
  else if(c.cat==='job'){const q=Math.random();r=q<R_.jobGreat?'great':q<R_.jobGreat+R_.jobBad?'bad':'ok'}   // 打工：固定機率
  let e={...c.eff};
  const first=!STY.seen.includes(id)&&!(STRUN&&STRUN.res.some(x=>x&&x.id===id));   // 第一次做（這週前面的日子也算）
  const kick=(c.kickFirst&&first)||(c.kick&&Object.keys(c.kick).some(k=>st[k]<c.kick[k]));if(kick){e={...c.kickEff};r='fail'}   // 數值不夠：被趕出來（還是會遇到人）
  if(c.scared&&st.calm<0)e={...e,...c.scared};
  if(c.hurt&&st.meds<c.hurt.n)e.calm=(e.calm||0)+c.hurt.calm;
  if(e.rnd){delete e.rnd;e[R(['str','soc','know'])]=1}
  const vary=v=>Math.round(v*(1+(Math.random()*2-1)*R_.vary));
  const d={};
  for(const k in e){let v=e[k];if(k!=='money'&&Math.abs(v)>2)v=vary(v);
    if(care){const cost=k==='tired'||k==='fat';
      v=Math.round(v*(cost?{ok:1,great:k==='tired'?0:1,fail:1.5,bad:2}[r]:v>0?{ok:1,great:2,fail:.5,bad:0}[r]:{ok:1,great:1,fail:1.5,bad:2}[r]));}
    else if(r!=='ok'&&R_.jobMul[r]&&k!=='money'&&v>0){const cost=k==='tired'||k==='fat';v=Math.round(v*R_.jobMul[r][cost?'cost':'gain'])}   // 打工的大成功／大失敗
    d[k]=v;}
  if(!care)d.tired=(d.tired||0)+R_.rest;
  if(STY.freeMode)for(const k in d)if(!ST_FREE_KEYS.includes(k))delete d[k];   // 自由模式：只有錢、疲勞、疲倦會變（v0.40.62）
  const before={...st};
  for(const k in d)st[k]+=d[k];
  if(c.cap)for(const k in c.cap)if(k in d)st[k]=Math.min(st[k],Math.max(before[k],c.cap[k]));   // 讀書最多讀到 cap
  if(!STY.freeMode){st.mood+=care?(r==='ok'||r==='great'?R_.moodOk:R_.moodFail):R_.moodRest;
  if(st.tired>=R_.moodTiredAt)st.mood+=R_.moodTired;}
  st.hp=clamp(st.hp);st.calm=clamp(st.calm,-100,100);st.mood=clamp(st.mood);st.tired=clamp(st.tired);st.fat=clamp(st.fat);
  ['str','soc','know'].forEach(k=>st[k]=clamp(st[k],0,999));   // 錢不夾：可以是負的（v0.40.47 負債；花錢的事錢不夠本來就做不了）
  for(const k in d)d[k]=st[k]-before[k];
  if(id==='med')st.meds++;
  const sm=c.small||(care?STORY_HOME.tank:STORY_HOME.day),small=Array.isArray(sm)?R(sm):sm;
  const day=STRUN?STRUN.i:0,lim=o=>!o||((o.w==null||o.w===STY.week)&&(!o.d||o.d.includes(day)));
  const encs=(c.enc||[]).filter(([,p,o])=>lim(o)&&Math.random()<p).map(([n])=>n);const enc=encs[0]||null;
  return {id,r,before,d,small,big:c.big||STORY_HOME.day,enc,forced,kick,stg:stStageRoll(c,r,enc)};
}
// 小動畫要演什麼（算結果時先決定好，畫面重畫時不會變）：規則在 js/story/data/story.js 的 STORY_STAGE＋指令的 stage
const stStage=c=>{const s=c.stage||{},o={...STORY_STAGE,...s};o.npc={...STORY_STAGE.npc};for(const k in s.npc||{})o.npc[k]={...STORY_STAGE.npc[k],...s.npc[k]};o.me={...STORY_STAGE.me,...(s.me||{})};o.pass={...STORY_STAGE.pass,...(s.pass||{})};return o};
function stLarvaCol(){const h=Math.random()*360,c=(s,l)=>{const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))))};return [f(0),f(8),f(4)].join(',')};return c(.55,.82)+'|'+c(.8,.6)}   // 身體（淡）｜核心（亮）
// 一種行動模式的路人小球（tgt＝在誰旁邊／頭上：me 玩家｜npc 遇到的人）
function stPassMake(m,hasNpc){const L=()=>stLarvaCol(),rn=(a,b)=>Math.round(a+Math.random()*(b-a)),tgt=hasNpc&&Math.random()<.5?'npc':'me',dl=rn(0,900);
  if(m==='run')return [{m,look:L(),pose:R(['idle_a','open_a']),y:rn(6,16),rev:Math.random()<.5,dur:Math.random()<.5?1600:5200,dl:rn(0,4000)}];
  if(m==='follow')return [{m,look:L(),pose:'idle_a',tgt,dl}];
  if(m==='nest')return [{m,look:L(),pose:R(['rest','curl']),tgt,dl}];
  if(m==='head')return [{m,look:L(),pose:R(['idle_a','rest','curl']),tgt,dl}];
  if(m==='big')return [{m,look:L(),pose:R(['rest','idle_a']),side:Math.random()<.5?'L':'R',dl}];
  const x=rn(28,58),y=rn(2,12);return [{m:'pair',look:L(),pose:'idle_a',x,y,i:0,dl:0},{m:'pair',look:L(),pose:'open_a',x:x+7,y,i:1,dl:0}];}
function stStageRoll(c,r,enc){const S=stStage(c),o={};
  const n=S.npc[r];if(enc&&n&&(n.p==null||Math.random()<n.p))o.npc={face:n.face,hop:!!n.hop};
  if(S.me[r]!=null)o.me=S.me[r];
  const hasNpc=!!(enc&&stNpcImg(enc));
  if(c.at!=='home'){   // 路人小球：先決定這次有幾種行動模式（0～2），再照權重挑不重複的模式
    let q=Math.random(),k=0;for(;k<S.pass.n.length-1&&q>=S.pass.n[k];k++)q-=S.pass.n[k];
    const pool=Object.keys(S.pass.modes).filter(m=>S.pass.modes[m]>0);o.pass=[];
    for(let i=0;i<k&&pool.length;i++){let t=Math.random()*pool.reduce((a,m)=>a+S.pass.modes[m],0),j=0;for(;j<pool.length-1&&t>=S.pass.modes[pool[j]];j++)t-=S.pass.modes[pool[j]];
      o.pass.push(...stPassMake(pool.splice(j,1)[0],hasNpc))}}
  else if(S.visit.p&&typeof CODEX!=='undefined'&&Math.random()<S.visit.p){   // 在家：日常模式的小球來陪你
    const al=CODEX.filter(e=>e.end!=='END-07');if(al.length){const e=R(al);o.visit={cid:e.id,name:e.name,pose:c.act==='sleep'?'rest':R(['idle_a','open_a']),m:c.act==='sleep'?'sleep':c.cat==='care'?'watch':'roam',spot:Math.random()<.5?'head':'side',dl:Math.round(Math.random()*900)}}}
  const nCrowd=S.crowd||(!enc&&S.crowdAlone)||0;   // crowdAlone：沒遇到人時圍著玩家（v0.40.49）
  if(nCrowd){o.crowd=[];for(let i=0;i<nCrowd;i++){const go=r==='bad'&&enc&&i<Math.round(nCrowd*S.crowdBad);   // 大失敗：前一半跑去找遇到的人
    o.crowd.push({look:stLarvaCol(),x:Math.round(55+((i*37)%40)),y:Math.round(((i*53)%5)*4),pose:R(['idle_a','open_a','reach_a']),sp:Math.round(550+Math.random()*350),go:go?Math.round(6+Math.random()*22):null,front:i%2===0,dl:Math.round(Math.random()*600)})}}
  if(!enc&&S.away&&stNpcImg(S.away))o.away=S.away;   // 人在、但沒在理你（看向另一邊）
  const nc=S.npcCrowd&&enc&&hasNpc&&S.npcCrowd[enc];   // 圍著遇到的人的小球（例：言默唱歌）
  if(nc&&Math.random()<nc.p){if(nc.face!=null)o.npc={face:nc.face,sing:!!nc.sing};o.crowd=o.crowd||[];for(let i=0;i<nc.n;i++)o.crowd.push({look:stLarvaCol(),x:Math.round(2+i*38/Math.max(1,nc.n-1)),y:Math.round(((i*53)%5)*3),pose:R(['idle_a','open_a','reach_a']),sp:Math.round(550+Math.random()*350),go:null,front:i%2===0,dl:Math.round(Math.random()*600)})}
  return o;}
// v0.40.14：一天一天算（end＝這週目前的數值）。行程空白的日子＝自由行動：輪到那天時打開地圖（STRUN.free），選好才算
function stStartRun(){
  const st={...STY.st};st.meds=STY.meds;
  STRUN={i:0,phase:0,still:false,start:{...STY.st},end:st,ids:SUI.sched.map(x=>x||'free'),res:[],tired:false,bgFade:true,skip:false,free:null,met:{}};
  SUI.scr='home';SUI.greteOn=false;SUI.encPop=null;
  // v0.40.36：按下執行這週先黑畫面「讀取中」，這週會用到的背景讀好才開始（不會先閃過行程動畫）
  SUI.loading=true;stRender();
  const ks=new Set([STORY_HOME.day,STORY_HOME.tank,...STRUN.ids.flatMap(id=>{const c=STORY_CMDS[id]||{};return [c.big,...[].concat(c.small||[])]}).filter(Boolean)]);
  const img=k=>new Promise(r=>{const i=new Image();i.onload=i.onerror=()=>r();i.src=stBg(k,true);if(i.complete)r()});
  Promise.race([Promise.all([...ks].map(img)),new Promise(r=>setTimeout(r,3000))]).then(()=>setTimeout(()=>{if(!STRUN)return;SUI.loading=false;stStep()},250));
}
// 這一天的結果：還沒算就算。前一天累倒＝強制睡覺。回傳 false＝自由行動，等玩家在地圖上選
function stDay(){const R=STRUN,i=R.i;if(R.res[i])return true;
  if(R.tired)R.res[i]=stRoll(R.end,'sleep',true);
  else if(R.ids[i]==='free'){if(!R.free)R.free=stFreeNew();return false}
  else{const c=STORY_CMDS[R.ids[i]];   // 排了要花錢的事、到那天錢不夠：這天改成自由行動（v0.40.46；主角說一句）
    if(c.eff.money<0&&R.end.money<-c.eff.money){R.free=stFreeNew();R.free.poor=R.ids[i];R.ids[i]='free';return false}
    R.res[i]=stRoll(R.end,R.ids[i]);}
  R.tired=R.end.fat>=100;R.bgFade=(i?R.res[i-1].big:STORY_HOME.plan)!==R.res[i].big;return true}
// 道具能不能用（v0.40.63）：消耗品＝排行程時、白天回家時｜書＝白天回家時（自由行動的那天拿來讀）
const stReadCmd=k=>Object.keys(STORY_CMDS).find(id=>STORY_CMDS[id].book===k);
const stItemUsable=k=>!!(STY.items||{})[k]&&(STORY_USE[k]?(!STRUN||stHub()):!!(stReadCmd(k)&&stHub()));
// 用道具：消耗品加在現在的數值上（週中途＝這週的），用一次少一個、存檔｜書＝這天讀書（和在行程裡排讀書一樣）
function stUseItem(k){if(!stItemUsable(k))return;const u=STORY_USE[k],T=stT();
  if(!u){SUI.scr='home';stFreeGo(stReadCmd(k));return}
  const st=stCur();for(const s in u)st[s]=clamp(st[s]+u[s]);if(!--STY.items[k])delete STY.items[k];
  stFlash(fmt(T.bag.used,{n:T.items[k].n})+'　'+Object.entries(u).map(([s,v])=>T.S[s]+' '+v).join('、'));storyAutoSave()}
// 自由行動決定了：x＝蓋過結果的欄位（白跑一趟的背景）｜buys＝在店裡買的 [[道具, 價錢], …]（錢在這天的結果裡扣）
function stFreeGo(id,x,buys){const R=STRUN;R.free=null;SUI.scr='home';const r=R.res[R.i]=stRoll(R.end,id);r.free=true;if(x)Object.assign(r,x);
  if(buys&&buys.length){const n=buys.reduce((a,b)=>a+b[1],0);R.end.money-=n;r.d.money=(r.d.money||0)-n;r.buys=buys.filter(b=>!STORY_USE[b[0]]&&!stIsWear(b[0])).map(b=>b[0]);
    buys.filter(b=>STORY_USE[b[0]]).forEach(([k,,q])=>{STY.items[k]=Math.min(99,(STY.items[k]||0)+(q||1))});
    const wr=buys.filter(b=>stIsWear(b[0])).map(b=>b[0]);
    if(wr.length)STY.wearOwn=[...new Set([...(STY.wearOwn||[]),...wr])]}   // 服飾店：買了記在這個存檔（STY.wearOwn），不會自動穿上；存檔時併進 META.wearOwn（v0.40.69）   // 消耗品（舒緩液、能量飲料）：買了馬上放進道具（v0.40.62）；書照舊週末才算
  R.tired=R.end.fat>=100;R.bgFade=true;R.phase=0;R.still=false;stStep()}
// v0.40.33：劇情在那一天播，不等週末——
//   pre（這天的動畫之前）：遇到人（一個人一週最多一段）、第一次做這個行程、第一次累倒
//   post（這天的結果之後、下一天之前）：第一次大成功／大失敗／小球疲倦滿、數值達到（v0.40.62）
//   遇到人的好感也在這時候加（x.fg＝這次加多少，x.meet＝第一次認識）；「原本好感」＝遇到之前（ST_FAVPRE）
function stDayEvs(x,when){const R=STRUN,q=[];
  if(when==='pre'){
    // 執行行程隨機＋沒遇到人：今天會遇到人、但沒有見面劇情時先擲；擲中＝那個人今天不在（小動畫重算），播這段
    if(x.enc&&!x.forced&&!(R.met[x.enc]?null:stMeetEv(x.enc,x.id))){const ev=stRollEv(x,true);if(ev){x.enc=null;x.stg=stStageRoll(STORY_CMDS[x.id],x.r,null);q.push(ev)}}
    if(x.enc){ST_FAVPRE={...STY.fav};ST_METPRE=[...(STY.met||[])];const ev=R.met[x.enc]?null:stMeetEv(x.enc,x.id);if(ev)R.met[x.enc]=1;
      const a=STY.fav[x.enc]||0;x.meet=!a;x.fg=stFavAdd(x.enc,a>0?STORY_FAV.enc:STORY_FAV.meet);if(ev)q.push(ev);}
    if(!x.forced){if(!STY.seen.includes(x.id))STY.seen.push(x.id);q.push(...stEvents('first',x.id))}   // 累倒的那天不算「第一次睡覺」｜v0.40.61：每次做都看一次＝有條件的「第一次做」是條件符合之後的第一次（例 觸碰、安心≥0）
    if(x.forced)q.push(...stEvents('first','collapse'));
    if(!x.enc&&!x.forced&&(STORY_CMDS[x.id].enc||[]).length)q.push(...stEvents('alone',x.id));   // 沒遇到平常會在的人（例：5F 言街不在；v0.40.47）
    if(!q.length&&!x.forced){const ev=stRollEv(x);if(ev)q.push(ev)}   // 執行行程隨機：這天沒有別的劇情才擲（v0.40.60）
  }else{
    if(x.r==='great'&&STORY_CMDS[x.id].cat==='care')q.push(...stEvents('first','crit'));   // 第一次大成功／大失敗的提示：只算照顧
    if(x.r==='bad'&&STORY_CMDS[x.id].cat==='care')q.push(...stEvents('first','fumble'));
    if(x.before.tired+(x.d.tired||0)>=100)q.push(...stEvents('first','tiredMax'));
    if(!STY.freeMode)q.push(...stEvents('stat'));   // 數值達到：每天結果出來就看（v0.40.62；原本週末才看，會擠在一起）
  }
  return q.filter((e,i)=>q.indexOf(e)===i);}
// 這一天還沒播的劇情：播完回到 then；回傳 true＝有劇情（跳過會停下來）
function stDayPlay(x,when,then){const k=when==='pre'?'preDone':'postDone';if(x[k])return false;x[k]=1;
  const q=stDayEvs(x,when);if(!q.length)return false;clearTimeout(ST_TIMER);STRUN.skip=false;stPlay(q,then);return true}
let ST_TIMER=0;
function stStep(){clearTimeout(ST_TIMER);const R=STRUN;
  if(R&&R.i<7){
    if(R.skip){   // 跳過：一路算到週末；碰到自由行動要選、碰到劇情先播（播完回到那天的動畫，要再按一次跳過）
      while(R.i<7&&stDay()){const x=R.res[R.i];
        if(stDayPlay(x,'pre',stStep))return;
        if(!x.postDone&&stDayEvs(x,'post').length){R.phase=1;R.still=true;R.skip=false;break}   // 有結果後的劇情：停在這天的結果，接著播劇情
        R.i++;}
    }else if(stDay()&&R.phase===0&&stDayPlay(R.res[R.i],'pre',stStep))return;
  }
  if(R&&R.i>=7&&!R.lived){R.lived=1;R.end.money-=STORY_RULE.living}   // 週結算：扣生活費（結算表多一列）
  stRender();
  if(R&&R.free&&!SUI.vn&&!R.free.tip){R.free.tip=1;const q=stEvents('first','free');
    if(R.free.poor)q.unshift(stTalk('_poor',fmt(stT().poorDay,{cmd:stCmdName(R.free.poor)})));
    if(q.length){stPlay(q,stRender);return}}   // 第一次自由行動：說明玩法的劇情（主線總表，觸發＝第一次做：自由行動）
  if(!R||R.i>=7||R.free||SUI.vn)return;
  ST_TIMER=setTimeout(()=>{if(STRUN.phase===0){STRUN.phase=1;STRUN.still=false;stStep()}else stNext()},STRUN.phase===0?STORY_RULE.tExec:STORY_RULE.tEnd);}
function stNext(){const R=STRUN,x=R.res[R.i],go=()=>{R.i++;R.phase=0;R.still=false;stStep()};if(x&&stDayPlay(x,'post',go))return;go()}
function stTap(){if(!STRUN||STRUN.i>=7||STRUN.free||SUI.vn)return;if(STRUN.phase===0){STRUN.phase=1;STRUN.still=true;stStep()}else stNext()}
function stSkip(){clearTimeout(ST_TIMER);const R=STRUN,x=R.res[R.i];if(R.phase===1&&x&&!x.postDone&&stDayPlay(x,'post',()=>{R.i++;R.phase=0;R.still=false;stStep()}))return;R.skip=true;stStep()}   // 跳過：一路算到週末（自由行動、劇情會停下來）
// 做完一件事會解鎖什麼（週結算時照順序跑；這週裡面的判斷用 stHas／stDid 先算進去）
const ST_UNLOCKS=[
  (x,c)=>{if(c.at&&!STY.visit.includes(c.at))STY.visit.push(c.at)},                                // 去過的地點（記錄；v0.40.44 起打工不看這個）
  (x,c)=>{(x.buys||[]).forEach(k=>{STY.items=STY.items||{};STY.items[k]=1})},                       // 在店裡買到的東西 → 讀書的行程
  (x,c)=>{if(c.min)STY.medDone++}                                                                  // 有「本月至少幾次」的（換藥水）：記次數
];
// 週結算「確定」：寫回、下一週（自動存檔）
let ST_FAVPRE=null,ST_METPRE=null;
function stWeekDone(){
  const e=STRUN.end,w=STY.week;STY.meds=e.meds;delete e.meds;STY.st=e;
  // 遇到人、第一次做（含大成功等）、好感已經在那一天處理過了（stDayEvs）
  STRUN.res.forEach(x=>ST_UNLOCKS.forEach(f=>f(x,STORY_CMDS[x.id])));   // 做完這週解鎖的東西（v0.40.37 統整成一張表）
  STRUN=null;SUI.sched=stFixedFill();SUI.sel=0;ST_FAVPRE=null;
  const capQ=[];
  if(STY.freeMode){   // 自由模式（v0.40.62）：第一章結束時的數值、好感都不動（每天只有錢、疲勞、疲倦會變，ST_FREE_KEYS），錢上限 STORY_RULE.freeCap；不算負債、沒有考察
    const m=STY.st.money;STY.st.money=Math.min(m,STORY_RULE.freeCap);STY.debt=0;
    if(m>=STORY_RULE.freeCap)capQ.push(stTalk('_cap',stT().freeCapTalk));}
  else STY.debt=STY.st.money<0?(STY.debt||0)+1:0;   // 負債：連續幾週結算時錢是負的
  if(STY.debt>=STORY_RULE.debtOver){stPlay(STORY_SCRIPT.filter(x=>x.ch===STY.ch&&x.trig==='gameOver'&&stArg(x)[0]==='debt'&&x.lines.length),stGameOver);return}   // 小球被帶回異生會：不跑考察
  const q=STY.freeMode?capQ:[...stEvents('weekEnd',w),...stEvents('stat')];
  stPlay(q,()=>{
    if(ST_OVER){ST_OVER=false;stGameOver();return}   // 劇情效果「遊戲結束」（例 C1-06 月底評估沒過）
    if(STY.week>=STORY_RULE.weeks&&!STY.freeMode){stChapterEnd();return}
    STY.week++;
    stPlay([...stEvents('weekStart',STY.week),...stJobNews()],()=>{storyAutoSave();if(STY.freeMode)stRender();else stFlash(fmt(stT().week,{n:STY.week}))});   // 自由模式不跳「第幾週」，但一樣要重畫（v0.40.63 修正：沒重畫＝結算框還在，再按一次出錯）
  });
}
// 新出現的打工（v0.40.44）：數值到了就出現在行程表；下週開始排行程時，玩家自己的對話框提一句（一段臨時劇情，不記進播過的劇情）
//   silent＝只記下來不提（新遊戲、舊存檔第一次讀進來）
function stJobNews(silent){const now=stPlanIds('job');
  if(!Array.isArray(STY.jobSeen)||silent){STY.jobSeen=now;return []}
  const nw=now.filter(x=>!STY.jobSeen.includes(x));if(!nw.length)return [];STY.jobSeen.push(...nw);
  return [stTalk('_jobs',fmt(stT().jobNews,{list:nw.map(stCmdName).join('、')}))];}
// 遊戲結束（負債）：黑畫面，只能讀檔或離開；不存檔（自動存檔還是這週開始時的）
function stGameOver(){SUI.over=true;SUI.scr='home';stRender()}
// 章末（v0.40.53）：月底評估在第 4 週的考察裡（C1-06；沒過＝劇情效果「遊戲結束」）。走到這裡＝過關：
//   照順序挑第一個符合條件的章末劇情（C1-50）＋過關後，播完是「中繼存檔」畫面：儲存中繼存檔／離開主線
function stChapterEnd(){
  if(!ST_PV&&(META.chDone||0)<STY.ch){META.chDone=STY.ch;codexSave()}   // 日常模式：4F／5F、心等 5（v0.40.59）
  const ev=STORY_SCRIPT.find(x=>x.ch===STY.ch&&x.trig==='chapterEnd'&&stCond(x.arg)&&x.lines.length);
  stPlay([...(ev?[ev]:[]),...stEvents('chapterPass')],()=>{SUI.over='mid';SUI.midSaved=false;SUI.scr='home';stRender()});
}
// 中繼存檔（自由模式存檔，v0.40.55 起 3 格 META.storyFree[i]）：自由模式一直存回讀進來的那一格（freeSlot）。base＝存的當下的數值、好感（自由模式每週回到這裡）
function storyFreeMake(i){storyOwnSync();const o=storyCopy(STY);o.freeSlot=i;delete o.run;o.freeMode=true;o.week=STY.week+1;o.debt=0;o.at=new Date().toISOString().slice(0,10);return o}
;
/* ==== js/story/script.js ==== */
// ===== 主線 script.js：劇情引擎：條件 stCond、找觸發的劇情 stEvents／stMeetEv、播放 stPlay、進到某一句 stVnEnter、效果 stEff、好感 =====
// 主線的程式拆成 js/story/*.js（v0.40.34），照 index.html 的順序載入，全部是全域變數。

// 人物說的話自動加「」（一行一組；已經有「『（開頭或」』結尾的不動；裡面原本的「」改成『』）；旁白、選項不加。tools/storysheet.py 的 quote 一樣
function stQuote(who,t){if(!t||!who||who==='narr'||who==='choice'||who==='cond')return t;
  return String(t).split('\n').map(c=>{const s=c.trim();if(!s||/^[「『（(]/.test(s)||/[」』]$/.test(s))return c;const m=c.match(/^(\s*)([\s\S]*?)(\s*)$/);return m[1]+'「'+m[2].replace(/「/g,'『').replace(/」/g,'』')+'」'+m[3]}).join('\n')}
STORY_SCRIPT.forEach(e=>e.lines.forEach(l=>{if(l.text)l.text=stQuote(l.who,l.text)}));
// ---------- 劇情（STORY_SCRIPT，js/story/data/storyscript.js；設定總表「主線劇情」）----------
// 條件：hp>=20、calm<25、week==2，用「,」連起來＝而且
// 條件是否符合（變數表在 js/story/data/story.js 的 STORY_COND）。看不懂的條件＝不符合，主控台會提醒（預覽時畫面左下也會）
let ST_DAYX=null;   // 正在處理的那一天（執行行程隨機的條件「沒遇到人」用）
const ST_COND_GET={alone:()=>ST_DAYX&&!ST_DAYX.enc&&(STORY_CMDS[ST_DAYX.id].enc||[]).length?1:0,debt:()=>STY.debt||0,week:()=>STY.week,med:()=>STY.medDone,fav:id=>STY.fav[id]||0,fav0:id=>((SUI.vn&&SUI.vn.fav0)||STY.fav)[id]||0,seen:id=>STY.seen.includes(id)?1:0};
function stCond(c){const {terms,bad}=storyCondParse(c);
  if(bad.length){console.warn('看不懂的條件',bad);if(ST_PV)stPopMsg('看不懂的條件：'+bad.join('、'));return false}
  return terms.every(t=>{const g=ST_COND_GET[t.v.k],v=g?g(t.of):(stCur()[t.v.k]??0),n=t.n;
    // 好感 >0／==0＝認識了沒（v0.40.69：自由模式第一次見面好感還是 0，但算認識）；原本好感看劇情開始時的認識名單
    if((t.v.k==='fav'||t.v.k==='fav0')&&n===0&&['>','==','=','<='].includes(t.op)){const kn=t.v.k==='fav'?stKnow(t.of):v>0||((SUI.vn&&SUI.vn.met0)||STY.met||[]).includes(t.of);return t.op==='>'?kn:!kn}
    return {'>=':v>=n,'<=':v<=n,'>':v>n,'<':v<n,'==':v===n,'=':v===n}[t.op]});}
// 這一章、這個觸發還沒播過、有台詞的事件
//   stat／chapterEnd 的參數＝條件；其他觸發的參數＝「對象,條件…」（例 touch,calm<0｜3,med<3），條件可以省略
const stArg=x=>{const [k,...c]=String(x.arg??'').split(/[,，、]/);return [k.trim(),c.join(',')]};
function stEvents(trig,arg){
  return STORY_SCRIPT.filter(x=>{if(x.ch!==STY.ch||x.trig!==trig||!x.lines.length||STY.done.includes(x.id))return false;
    if(trig==='stat'||trig==='chapterEnd')return stCond(x.arg);
    const [k,c]=stArg(x);return (arg==null||k===String(arg))&&stCond(c);});}
// 執行行程隨機（v0.40.60）：參數「行程%機率,條件…」；這天做的是那個行程、條件符合，就各自擲一次，最多播一段
//   away＝只看條件裡有「沒遇到人==1」的：擲中就讓那天平常會在的人不在（v0.40.64；原本要那天剛好不在才擲，機率太低）
function stRollEv(x,away){ST_DAYX=away?{...x,enc:null}:x;
  try{return STORY_SCRIPT.find(e=>{if(e.ch!==STY.ch||e.trig!=='roll'||!e.lines.length||STY.done.includes(e.id))return false;
    const [k,c]=stArg(e),[cmd,p]=k.split('%');if(away&&!/(^|,)alone==1(,|$)/.test(c))return false;
    return cmd===x.id&&stCond(c)&&Math.random()*100<(p?+p:STORY_RULE.rollP)})||null}
  finally{ST_DAYX=null}}
// 遇到人：參數「人物」或「人物@行程」（例 yanmo@busk）；指定行程的優先
function stMeetEv(who,cmd){
  const ok=STORY_SCRIPT.filter(x=>{if(x.ch!==STY.ch||x.trig!=='meet'||!x.lines.length||STY.done.includes(x.id))return false;
    const [k,c]=stArg(x),[w,at]=k.split('@');return w===who&&(!at||at.split('|').includes(cmd))&&stCond(c);});   // 人物@行程｜行程＝其中一個行程（v0.40.57）
  return ok.find(x=>stArg(x)[0].includes('@'))||ok[0]||null;}
// 週中途播的劇情（打開畫面、排行程）：記進自動存檔，離開再回來不會重播
function stDoneKeep(){if(!ST_PV&&META.story){META.story.done=[...new Set([...(META.story.done||[]),...STY.done])];codexSave()}}
function stPlay(evs,done){
  if(!evs.length){if(done)done();return}
  const [ev,...rest]=evs;if(!ST_REPLAY&&!ev.tmp)STY.done.push(ev.id);   // tmp＝臨時的一段（新出現的打工），不記
  // 先讀好這段用到的背景、立繪（含白邊）、玩家頭像；超過 0.15 秒才顯示「讀取中」
  const lt=setTimeout(()=>{SUI.loading=true;stRender()},150);
  stLoadEv(ev).then(()=>{clearTimeout(lt);SUI.loading=false;
    SUI.vn={ev,i:0,fav0:{...(ev.trig==='meet'&&ST_FAVPRE&&!ST_PV?ST_FAVPRE:STY.fav)},met0:[...(ev.trig==='meet'&&ST_FAVPRE&&!ST_PV&&ST_METPRE?ST_METPRE:STY.met||[])],bg:null,chr:null,chl:null,larva:false,fx:[],fxAll:[],scr:null,done:()=>{if(ev.lines.some(l=>/(^|,)scr:/.test(l.fx||''))){SUI.scr='home'}stPlay(rest,done)}};
    stVnEnter();});
}
// 這段劇情會用到的圖：照 stVnEnter 的規則走一遍（立繪換表情、左邊換 _R_）
// 立繪移動的七個位置：x＝在兩格之間的哪裡（0 左格、1 右格），z＝前後（前層 3、平常 2、後層 1）
const ST_POS={RF:{x:.9,z:3},R:{x:1,z:2},RB:{x:.86,z:1},C:{x:.5,z:2},LF:{x:.1,z:3},L:{x:0,z:2},LB:{x:.14,z:1}};
const stWho=k=>k?String(k).split(/[_:]/)[0]:null;   // 立繪格裡是誰（larvae:3 → larvae）
// 玩家自己說一句的臨時劇情（不記進播過的劇情；錢不夠、新的打工、自由模式錢滿了）
const stTalk=(id,text)=>({id,tmp:true,ch:STY.ch,trig:'',arg:'',lines:[{who:'player',text}]});
// 換表情：圖名最後的 _數字 換掉，方向、配件（+acc）不變
const stFaceSwap=(k,f)=>k.replace(/_[^_+]+(\+.*)?$/,(m,acc)=>'_'+f+(acc||''));
// 這句的立繪格是不是說話的人自己（是＝照立繪格，不換表情；v0.40.62：只看說話的人自己，另一格換成小球之類的也要換表情）
const stOwnImg=L=>[L.chr,L.chl].some(k=>k&&k!=='none'&&String(k).startsWith(L.who+'_'));
function stLoadEv(ev){
  const bgs=new Set(),chrs=new Set();let chr=null,chl=null,me=false;
  ev.lines.forEach(L=>{if(L.bg&&L.bg!=='black')bgs.add(L.bg);if(L.who==='player')me=true;
    if(L.chr)chr=L.chr==='none'?null:L.chr;if(L.chl)chl=L.chl==='none'?null:L.chl;
    const N=L.who&&STORY_NPC[L.who];
    if(N&&N.img&&L.face!=null&&L.face!==''&&!stOwnImg(L)){const sw=k=>stFaceSwap(k,L.face);const mine=k=>k&&k.startsWith(L.who+'_');
      if(mine(chr))chr=sw(chr);else if(mine(chl))chl=sw(chl);else chr=sw(N.img);}
    if(chr&&!stIsLarva(chr))chrs.add(chr);if(chl&&!stIsLarva(chl))chrs.add(stFaceR(chl));});
  const img=src=>new Promise(r=>{const i=new Image();i.onload=i.onerror=()=>r();i.src=src;if(i.complete)r()});
  const ol=k=>new Promise(r=>{chrOl(k,true);if(!chrNew(k))return img(assetImg(k.replace(/\+acc$/,''))).then(r);const t0=Date.now(),w=()=>{if(CHR_OL[k]!==false||Date.now()-t0>6000)r();else setTimeout(w,80)};w()});
  const all=[...[...bgs].map(b=>img(stBg(b,true))),...[...chrs].map(ol),img(IMG.scar_1?IMG.scar_1.src:BASE+'scar_1.png')]   // 傷疤在 assets/larva（sprites.js 開頭就讀了；v0.40.69 續 15：原本走 assetImg 會找成 assets/scar_1.png）;
  if(me)all.push(dollLoad(META.doll).then(()=>{ST_DOLL_OK=true}));
  return Promise.race([Promise.all(all),new Promise(r=>setTimeout(r,8000))]);
}
// 進到某一行：套用背景、立繪、演出、數值；選項行一起顯示
// 判定（差分）：連續幾行 who:'cond'，text＝條件（同 stCond），go＝標籤。第一個符合的跳過去；text 空白＝其他情況；都不符合＝接著往下
const stCondCn=c=>{const T=stT();return storyCondCn(c,Object.fromEntries(Object.entries(T.npc).map(([k,v])=>[k,v.n])),T.cmd)};
function stCondJump(ls,i){let k=i;while(k<ls.length&&ls[k].who==='cond')k++;
  for(let j=i;j<k;j++){const c=ls[j];if(!c.text||stCond(c.text)){const t=c.go==='end'?ls.length:c.go?ls.findIndex(l=>l.tag===c.go):j+1;
    if(ST_PV)stPopMsg(fmt(stT().pv.cond,{c:c.text?stCondCn(c.text):stT().pv.condElse,go:c.go==='end'?stT().pv.condEnd:(c.go||'')}));return t<0?ls.length:t}}
  if(ST_PV)stPopMsg(stT().pv.condNone);return k}
function stVnEnter(){
  const V=SUI.vn;let n=0;while(V.ev.lines[V.i]&&V.ev.lines[V.i].who==='cond'&&n++<50)V.i=stCondJump(V.ev.lines,V.i);
  const L=V.ev.lines[V.i];
  if(!L){const d=V.done;SUI.vn=null;stRender();d();return}
  if(L.bg&&L.bg!==V.bg){V.bgPrev=V.bg;V.bgFade=true;V.bg=L.bg;V.bgZ=false}else V.bgFade=false;   // bgZ＝走過去放大了（換背景就回來）   // 換背景：新的淡入（第一張從黑色淡入）
  // 立繪兩格：chr 右邊（面向左，平常用這格）、chl 左邊（兩個人對話時；自動換成面向右的 _R_ 圖）。none＝收起來
  if(V.gone){V[V.gone]=null;V.gone=null}   // 上一句走開的人：這句起收掉（已經走出畫面，不用再淡出）
  const pr=V.chr,pl=V.chl;
  // 右下角的小助手（v0.40.49；v0.40.50 改成從畫面下緣冒出來）：helperIn＝這句的右立繪（沒寫＝說話的人）從右下角冒出來，原本的立繪不動；helperIn:39%＝露出整張圖的 39%（從上面算，沒寫＝60%）；helperOut＝縮回去（下一句起收掉）；右立繪寫「無」也會一起收掉
  const fx0=String(L.fx||'').split(/[,，、\n]/).map(x=>x.trim().split('@')[0]),hx=fx0.find(x=>/^helperIn(:|$)/.test(x)),hIn=!!hx;
  if(V.helperGone||(L.chr==='none'&&!hIn)){V.helper=null;V.helperGone=false}V.helperIn=hIn;V.helperOut=fx0.includes('helperOut');V.tl=performance.now();
  if(hIn)V.helperPct=Math.max(10,Math.min(100,parseInt(hx.split(':')[1])||60));
  if(hIn)V.helper=L.chr&&L.chr!=='none'&&!stIsLarva(L.chr)?L.chr:(STORY_NPC[L.who]&&STORY_NPC[L.who].img)||null;
  if(V.helperOut)V.helperGone=true;
  if(L.chr&&!hIn)V.chr=L.chr==='none'?null:L.chr;
  if(L.chl)V.chl=L.chl==='none'?null:L.chl;
  // 人物說話時寫了表情：換掉正在顯示他的那一格（方向、配件不變）；兩格都沒有他＝放到右邊
  const N=L.who&&STORY_NPC[L.who];
  if(N&&N.img&&L.face!=null&&L.face!==''&&!stOwnImg(L)){
    const sw=k=>stFaceSwap(k,L.face);
    const mine=k=>k&&k.startsWith(L.who+'_');
    if(mine(V.helper))V.helper=sw(V.helper);else if(mine(V.chr))V.chr=sw(V.chr);else if(mine(V.chl))V.chl=sw(V.chl);else V.chr=sw(N.img);
  }
  // 人物出場／退場：換了一個人（不是同一個人換表情、轉向）＝新的淡入（或跑進來）、舊的淡出
  const pp=k=>k?String(k).split('_')[0]:null;
  V.inR=!!V.chr&&pp(V.chr)!==pp(pr);V.inL=!!V.chl&&pp(V.chl)!==pp(pl);
  V.outR=pr&&pp(pr)!==pp(V.chr)?pr:null;V.outL=pl&&pp(pl)!==pp(V.chl)?pl:null;
  // 演出可以寫好幾個（用「,」隔開）；寫成「演出@3」＝這句的第 3 段出來時才演（段＝換行或「｜」）
  V.fxAll=String(L.fx||'').split(/[,，、\n]/).map(x=>x.trim()).filter(Boolean);
  // 一群小球的動作（v0.40.49）：lvJump／lvWave／lvSleep（:L1＝左邊第 1 隻、:R2＝右邊第 2 隻，從外側數；沒寫＝全部）。只演這一句；lvKeep＝接著上一句的動作（不重來）
  if(!V.fxAll.includes('lvKeep'))V.lv={};
  V.fxAll.forEach(x=>{const m=x.split('@')[0].match(/^lv(Jump|Wave|Sleep)(?::(\w+))?$/)||x.split('@')[0].match(/^larva(Sway):(\w+)$/);if(m)V.lv[m[2]||'*']={a:m[1].toLowerCase(),t0:performance.now()}});   // 小球晃一晃:左1＝一群小球裡那一隻晃（v0.40.57）
  // 立繪移動（v0.40.62，七個位置 ST_POS）：move+位置[:L／:R]＝那一格（沒寫＝說話的人那格，旁白＝右）滑過去；V.pos＝每格現在在哪，換了人就回原位
  const fxb=V.fxAll.map(x=>x.split('@')[0]);V.mvA={};
  V.pos=V.pos||{};['chr','chl'].forEach(k=>{if(!V[k]||(k==='chr'?pr:pl)&&stWho(V[k])!==stWho(k==='chr'?pr:pl))delete V.pos[k]});
  fxb.forEach(f=>{const [b,t]=f.split(':'),m=b.match(/^move(RF|RB|R|C|LF|LB|L)$/);if(!m)return;
    const k=t==='L'?'chl':t==='R'?'chr':V.chl&&L.who&&V.chl.startsWith(L.who+'_')?'chl':'chr',home=k==='chr'?'R':'L',from=V.pos[k]||home;
    if(from!==m[1]){V.mvA[k]=[from,m[1]];V.pos[k]=m[1]}});
  // 立繪晃一晃倒下：倒著到那格換圖為止（V.fallen）；對象＝:左／:右，沒寫＝說話的人（旁白＝右）
  V.fallen=V.fallen||{};if(L.chr)V.fallen.chr=false;if(L.chl)V.fallen.chl=false;V.fallA=null;
  const ff=fxb.find(x=>x.split(':')[0]==='fall');
  if(ff){const t=ff.split(':')[1];V.fallA=t==='L'?'chl':t==='R'?'chr':V.chl&&L.who&&V.chl.startsWith(L.who+'_')?'chl':'chr';V.fallen[V.fallA]=true}
  V.bgWalk=V.fxAll.some(x=>x.split('@')[0]==='walk');if(V.bgWalk)V.bgZ=true;   // 背景上下搖晃稍微放大：像往前走（v0.40.60）
  if(V.fxAll.includes('larvaIn'))V.larva=true;if(V.fxAll.includes('larvaOut'))V.larva=false;
  // 走開（leaveL／leaveR＝往左／右走）：後面寫 :L／:R（總表「:左」「:右」）＝那一格走開（旁白一律寫，v0.40.52）；沒寫＝這句寫了哪一格／說話的人那一格。演完下一句收掉
  const lv=V.fxAll.find(x=>/^leave[LR](:|$)/.test(x.split('@')[0]));V.leave=null;
  const lvT=lv&&lv.split('@')[0].split(':')[1];if(lvT){V.leave=lvT==='L'?'chl':'chr';V.gone=V.leave}
  else if(lv){const who=k=>k&&L.who&&k.startsWith(L.who+'_');V.leave=L.chl?'chl':L.chr?'chr':who(V.chl)?'chl':who(V.chr)?'chr':V.chr&&!stIsLarva(V.chr)?'chr':V.chl&&!stIsLarva(V.chl)?'chl':V.chr?'chr':'chl';   /* 旁白：優先走開的是人（不是小球） */V.gone=V.leave}
  // 教學：scr:畫面.頁籤＝打開那個畫面（一直開到換掉；scr:none 關掉），立繪縮到右下；hl:區塊＝這句講到的地方（其他地方調暗）
  V.fxAll.filter(x=>x.startsWith('scr:')).forEach(x=>{const [sc,tab]=x.slice(4).split('.');
    if(sc==='none'){V.scr=null;SUI.scr='home';return}V.scr=sc;SUI.scr=sc;
    if(tab){if(sc==='stat')SUI.stab=tab;if(sc==='bag')SUI.btab=tab;if(sc==='plan')SUI.tab=tab}});
  V.hl=V.fxAll.filter(x=>x.startsWith('hl:')).map(x=>x.slice(3));V.dtop=false;
  // 接續：和上一句放在同一個對話框（cont 接在後面｜contNl 換一行），例如同一句話中間換表情
  //   contNl＝換一行再接、contNl2＝換兩行（中間空一行）再接
  const lf=V.lastFull||'',lt=lf.replace(/\n+$/,'');
  V.carry=V.fxAll.includes('cont')?lf:V.fxAll.includes('contNl')?(lf?lt+'\n':''):V.fxAll.includes('contNl2')?(lf?lt+'\n\n':''):'';
  V.t0=performance.now();V.tk=0;V.typing=false;V.scroll=0;
  V.k=1;V.fx=stFxAt(V,1);   // 多行的內容：一次出一行（點一下出下一行，全出完才換句）；演出寫 all＝整段一起出現
  if(L.eff&&L.who!=='choice')stEff(L.eff,true);
  stRender();
}
// 好感：加到這章的上限為止（本來就超過上限的不扣）；回傳實際加了多少
let ST_OVER=false;
// 認識了沒：好感 >0，或記在 met（自由模式第一次見面，好感不變；v0.40.69）
const stKnow=k=>(STY.fav[k]||0)>0||(STY.met||[]).includes(k);
function stFavAdd(k,d){if(STY.freeMode){if(d>0&&STORY_PPL.includes(k)&&!stKnow(k))(STY.met=STY.met||[]).push(k);return 0}   // 自由模式：好感不變
  const a=STY.fav[k]||0,b=d>0?Math.max(a,Math.min(storyFavCap(STY.ch,k),a+d)):Math.max(0,a+d);STY.fav[k]=b;return b-a}
// 這週行程裡遇到人各加多少（第一次 meet、之後 enc，到上限為止）：結果表顯示和週末結算用同一份
function stFavSim(){const f={...STY.fav},g=new Map();(STRUN&&STRUN.res||[]).forEach(x=>{if(!x.enc)return;const a=f[x.enc]||0,b=Math.max(a,Math.min(storyFavCap(STY.ch,x.enc),a+(a>0?STORY_FAV.enc:STORY_FAV.meet)));f[x.enc]=b;g.set(x,b-a)});return g}
function stEff(str,pop){if(ST_REPLAY)return;String(str).split(/[,，、]/).forEach(p=>{p=p.trim();
  if(p.startsWith('open.')){const k=p.slice(5);if(!STY.open.includes(k))STY.open.push(k);return}
  if(p==='gameOver'){if(!ST_PV)ST_OVER=true;return}   // 這段播完遊戲結束（週結算時看，v0.40.53）   // 劇情開放新地點（例 open.f4＝異生會 4F）
  const m=p.match(/^(fav\.)?(\w+)\s*([+-]\d+)$/);if(!m)return;
  if(m[1]){const was=STY.fav[m[2]]||0,d=stFavAdd(m[2],+m[3]);if(pop&&d&&was>0)stFavPop(m[2],d);return}   // 初次見面（原本 0）不浮提示
  const st=stCur();if(m[2] in st&&(!STY.freeMode||ST_FREE_KEYS.includes(m[2])))st[m[2]]+= +m[3];});}   // 週中途的劇情加在這週的數值上（v0.40.62 修正：原本加在週初，週末會被蓋掉）
// 教學：把講到的區塊以外的畫面調暗；講到的地方在下半部時，對話框移到上面
function stGuideDim(st){const V=SUI.vn;if(!V||!V.scr||!V.hl||!V.hl.length)return;
  const pane=st.querySelector('.spane'),svn=st.querySelector('.svn');if(!pane||!svn)return;
  const els=V.hl.flatMap(k=>[...st.querySelectorAll(`[data-hl~="${k}"]`)]);if(!els.length)return;
  const sc=+st.dataset.s||1,s0=st.getBoundingClientRect(),R=e=>{const r=e.getBoundingClientRect();return {x:(r.left-s0.left)/sc,y:(r.top-s0.top)/sc,r:(r.right-s0.left)/sc,b:(r.bottom-s0.top)/sc}};
  const p=R(pane),u=els.map(R).reduce((a,b)=>({x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),r:Math.max(a.r,b.r),b:Math.max(a.b,b.b)}));
  const d=document.createElement('div');d.className='svdim';Object.assign(d.style,{left:p.x+'px',top:p.y+'px',width:(p.r-p.x)+'px',height:(p.b-p.y)+'px'});
  const hole=document.createElement('div');hole.className='svhole';Object.assign(hole.style,{left:(u.x-p.x-4)+'px',top:(u.y-p.y-4)+'px',width:(u.r-u.x+8)+'px',height:(u.b-u.y+8)+'px'});
  d.append(hole);svn.prepend(d);
  const g0=st.querySelector('.svdlg:not(.top)'),gt=g0?R(g0).y:st.offsetHeight-200;
  // 講到的地方整個被對話框擋住時，對話框才移到上面
  const top=V.dtop?true:u.y>gt-10;if(top!==!!V.dtop){V.dtop=top;const g=st.querySelector('.svdlg');if(g)g.classList.toggle('top',top)}}
// 第 k 段要演的：沒寫 @ 的在第 1 段，寫 @n 的在第 n 段
function stFxAt(V,k){return V.fxAll.filter(x=>{const m=x.split('@');return m[1]?+m[1]===k:k===1}).map(x=>x.split('@')[0])}
// 好感變化：畫面左下浮出來的小提示（劇情裡的數值變化、選項）
let ST_FAVPOP=[],ST_FAVN=0;
// 預覽用的小提示（判定走了哪一條）：和好感提示同一個位置
function stPopMsg(t){const id=++ST_FAVN;ST_FAVPOP.push({id,t0:performance.now(),t,bad:false});setTimeout(()=>{ST_FAVPOP=ST_FAVPOP.filter(x=>x.id!==id);const e=document.querySelector('#ovStory .svfav[data-id="'+id+'"]');if(e)e.remove()},3200);}
function stFavPop(who,n){const T=stT(),id=++ST_FAVN;ST_FAVPOP.push({id,t0:performance.now(),t:fmt(T.favPop,{name:T.npc[who]?T.npc[who].n:who,n:(n>0?'+':'')+n}),bad:n<0});
  setTimeout(()=>{ST_FAVPOP=ST_FAVPOP.filter(x=>x.id!==id);const e=document.querySelector('#ovStory .svfav[data-id="'+id+'"]');if(e)e.remove()},2600);}
;
/* ==== js/story/vn.js ==== */
// ===== 主線 vn.js：劇情畫面：逐字、對話框、立繪與演出 stVn、跳過、日記本重看、劇情預覽 =====
// 主線的程式拆成 js/story/*.js（v0.40.34），照 index.html 的順序載入，全部是全域變數。

// 對話顯示方式：type 逐字｜line 整行（存在這台裝置）
const ST_TXTS=['type','line'];
let ST_TXT=(()=>{try{const v=localStorage.getItem('xenolarva_storytext');return ST_TXTS.includes(v)?v:'type'}catch(e){return 'type'}})();
let ST_TW=0;
function stTypeStart(){clearInterval(ST_TW);const V=SUI.vn;if(!V||!V.typing)return;
  const box=document.querySelector('#ovStory .svdlg p');if(!box)return;const sp=[...box.querySelectorAll('.tw')];let i=0;
  ST_TW=setInterval(()=>{for(let n=0;n<2&&i<sp.length;n++)sp[i++].classList.remove('tw');stScrollDlg(box,sp[i-1]);
    if(i>=sp.length)stTypeDone();},STORY_RULE.typeMs*2);}
function stTypeDone(){clearInterval(ST_TW);const V=SUI.vn;if(!V)return;V.typing=false;V.tk=V.k;
  document.querySelectorAll('#ovStory .svdlg .tw').forEach(e=>e.classList.remove('tw'));
  const box=document.querySelector('#ovStory .svdlg p');if(box)stScrollDlg(box);}
// 對話框捲到看得到最新的字（慢慢捲下去）
function stScrollDlg(box,el){const want=el?Math.max(0,el.offsetTop+el.offsetHeight-box.clientHeight):box.scrollHeight-box.clientHeight;
  if(want>box.scrollTop+1)box.scrollTo({top:want,behavior:'smooth'});}
// 逐字用：每個字一個 span（先藏起來、位置先佔好，不會跳行）；**字**＝強調
function stTypeHTML(t){let h='',em=false;const s=stSub(t);
  for(let i=0;i<s.length;i++){if(s[i]==='*'&&s[i+1]==='*'){em=!em;i++;continue}if(s[i]==='\n'){h+='<br>';continue}
    h+=em?`<b class="svem tw">${esc(s[i])}</b>`:`<span class="tw">${esc(s[i])}</span>`;}
  return h;}
function stTxtNode(after){const T=stT().txt,d=document.createElement('div');d.className='stxtset';
  const draw=()=>{d.innerHTML=`<div class="phead">${esc(T.title)}</div><div class="prow">${ST_TXTS.map(k=>`<button class="pbtn${k===ST_TXT?' on':''}" data-k="${k}">${esc(T[k])}</button>`).join('')}</div>`;
    d.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();ST_TXT=b.dataset.k;try{localStorage.setItem('xenolarva_storytext',ST_TXT)}catch(x){}draw();if(after)after()});};
  draw();return d;}
// 這一句還有沒出來的行？
// 一句拆成「一次出來的單位」：每一行、以及行內的「｜」（停頓：點一下才繼續，不換行）。pre＝前面要換幾行（空行＝段落間隔）
const ST_PAUSE=/[｜|]/;
function stUnits(t){const u=[];let pre='';
  String(t||'').split('\n').forEach((ln,i)=>{if(i)pre+='\n';if(!ln.trim())return;
    ln.split(ST_PAUSE).forEach((p,j)=>{if(!p&&j)return;u.push({pre,t:p});pre=''});});
  return u.length?u:[{pre:'',t:''}];}
const stLineN=t=>stUnits(t).length;
function stVnMore(){const V=SUI.vn,L=V&&V.ev.lines[V.i];return !!L&&L.who!=='choice'&&!V.fxAll.includes('all')&&V.k<stLineN(L.text)}
function stVnNext(go){
  const V=SUI.vn,ls=V.ev.lines,cur=ls[V.i];
  if(cur&&cur.who!=='choice')V.lastFull=(V.carry||'')+String(cur.text||'').replace(new RegExp(ST_PAUSE.source,'g'),'');   // 給下一句「接續」用
  if(go==='end'){V.i=ls.length;stVnEnter();return}
  if(go){const j=ls.findIndex(l=>l.tag===go);V.i=j>=0?j:ls.length;stVnEnter();return}
  const L=ls[V.i];if(L&&L.go){stVnNext(L.go);return}
  V.i++;while(ls[V.i]&&ls[V.i].who==='choice'&&ls[V.i-1]&&ls[V.i-1].who==='choice')V.i++;   // 選項之後跳過其他選項
  stVnEnter();
}
// 內容：**字**＝強調（粗體、亮色）
const stTxt=t=>esc(stSub(t).replace(new RegExp(ST_PAUSE.source,'g'),'')).replace(/\*\*(.+?)\*\*/g,'<b class="svem">$1</b>');
const stSub=t=>String(t||'').replace(/\{(num|編號)\}/g,STY.num).replace(/\{(name|玩家名字|玩家名稱|名字)\}/g,META.pname||TEXT.misc.defPlayer);
function stVn(D){
  const V=SUI.vn,ls=V.ev.lines,L=ls[V.i],T=stT();if(!L)return '';
  const fx=V.fx||[],bg=V.bg||STORY_HOME.plan,lay=(b,c)=>b==='black'||!b?`<div class="svbg svblack${c}"></div>`:`<img class="svbg${c}" alt="" src="${esc(stBg(b,true))}">`;
  if(V.scr){   // 教學：畫面本身就是背景（不畫背景圖）；立繪＝右下角的小助手（從對話框右上角冒出來，v0.40.49）
    let h=`<div class="svn guide${fx.includes('shake')?' a-fail':''}">`;
    const hp=V.helper||(V.chr&&!stIsLarva(V.chr)?V.chr:null);
    return h+stVnDlg(V,L,T,hp)+stVnHelp(V,hp)+stVnTop(V)+'</div>';
  }
  const z=V.bgWalk?` svwalk" style="animation-delay:-${Math.round(performance.now()-(V.tl||0))}ms`:V.bgZ?' svzoom':'';   // 往前走：放大後維持到換背景
  let h=`<div class="svn${fx.includes('shake')?' a-fail':''}">`+(V.bgFade?lay(V.bgPrev,'')+lay(bg,' svfade'+z):bg==='black'?'':lay(bg,z));
  const two=V.chr&&V.chl,talk=k=>k&&L.who&&k.startsWith(L.who+'_'),isL=stIsLarva;
  // 立繪的演出：說話的人（旁白時＝右邊那個；右邊是小球就換左邊）；hop 跳一下｜crouch 蹲下再起來｜sway 晃一晃
  const narrK=V.chr&&!isL(V.chr)?V.chr:V.chl;
  //   演出後面寫 :L／:R（總表「:左」「:右」）＝指定左／右立繪，不管誰說話（v0.40.51）
  const mv=(v,k)=>{const def=talk(v)||!two||(L.who==='narr'&&v===narrK);let c='';
    [['hop','a-ok'],['crouch','a-crouch'],['squat','a-squat'],['sway','a-sway']].forEach(([x,cl])=>fx.forEach(f=>{const [b,t]=f.split(':');if(b===x&&(t?(t==='L')===(k==='chl'):def))c+=' '+cl}));
    if(V.fallen&&V.fallen[k])c+=V.fallA===k?' a-fall':' fallen';   // 晃一晃倒下（v0.40.61）
    return c};
  // 出場：預設淡入；runL／runR＝從左／右邊畫面外跑進來；walkL／walkR＝走進來（面向走的方向）
  //   退場：leaveL／leaveR＝往左／右走出畫面（面向走的方向，下一句起收掉）
  const walk=fx.includes('walkL')?'L':fx.includes('walkR')?'R':'',lvDir=(V.fxAll||fx).some(x=>/^leaveL(:|@|$)/.test(x))?'L':'R';
  const ent=on=>on?(fx.includes('runL')?' a-runL':fx.includes('runR')?' a-runR':walk?' a-walk'+walk:' svin'):'';
  const lvc=k=>V.leave===k?' a-leave'+lvDir:'';
  // 畫面重畫（例：逐字打完）時動畫不要重來：從這句開始算已經過了多久
  const dl=(k,on)=>(on||V.leave===k)?` style="animation-delay:-${Math.round(performance.now()-(V.tl||V.t0))}ms"`:'';   // 從這一句開始算（點出下一段時進場／走開不重播，v0.40.51）
  const slot=(k,on)=>{const v=V[k];if(!v)return '';const side=k==='chl';if(V.leave===k)on=false;   // 走開的人不再淡入
    if(/^larvae:\d$/.test(v)){let g='';V.lvLook=V.lvLook||{};const now=performance.now();   // 一群小球（v0.40.49）：那一側站 n 隻，顏色隨機（這段劇情裡不變）；動作見 V.lv
      for(let i=0;i<+v.slice(7);i++){const key=(side?'L':'R')+(i+1),a=V.lv&&(V.lv[key]||V.lv['*']),look=V.lvLook[key]||(V.lvLook[key]=stLarvaCol());
        const lvg=V.leave===k;   // 這一群走開（例 小球們一哄而散）
        g+=`<canvas class="slarva svlarva svlg${ent(on)}${lvg?lvc(k):a?' a-lv'+a.a:''}" data-look="${look}" data-pose="${a&&a.a==='sleep'?'rest':a&&a.a==='wave'?'reach_a':'idle_a'}" width="192" height="192" style="${side?'left':'left:auto;right'}:${D?16+i*10:4+i*14}%;animation-delay:-${Math.round(now-(lvg?(V.tl||V.t0):a?a.t0:V.t0))}ms"></canvas>`}
      return stMvWrap(V,k,g,true)}
    if(isL(v))return stMvWrap(V,k,`<canvas class="slarva svlarva svlslot ${side?'svlslotL':'svlslotR'}${ent(on)}${lvc(k)}${fx.includes('larvaSway')?' a-lsway':''}" data-pose="${esc(v.split(':')[1]||'curl')}" width="192" height="192"${dl(k,on)}></canvas>`,true);
    let im=side?stFaceR(v):v;
    if(V.leave===k)im=lvDir==='L'?stFaceL(v):stFaceR(v);else if(on&&walk)im=walk==='L'?stFaceR(v):stFaceL(v);
    const x=`<img class="svchr${side?' svchl':''}${two?' two':''}${mv(v,k)}${ent(on)}${lvc(k)}${two&&L.who!=='narr'&&L.who!=='choice'&&!talk(v)&&!isL(V[side?'chr':'chl'])?' off':''}" alt="" ${(a=>{const d=dl(k,on);return !d?a:a.includes(' style="')?a.replace(' style="',d.slice(0,-1)+';'):a+d})(chrAttr(im))}>`;
    // 右立繪移到左邊（後層）／滑回右邊（v0.40.61）：包一層從右到左的軌道，left 和 translateX 一起動
    return stMvWrap(V,k,x,false)};
  const out=(v,side)=>/^larvae:/.test(v)?'':isL(v)?`<canvas class="slarva svlarva svlslot ${side?'svlslotL':'svlslotR'} svout" data-pose="${esc(v.split(':')[1]||'curl')}" width="192" height="192"></canvas>`
    :`<img class="svchr${side?' svchl':''} svout${two?' two':''}" alt="" ${chrAttr(side?stFaceR(v):v)}>`;
  if(bg!=='black'){   // 全黑畫面：人物、小球都不畫（狀態留著，換回背景再出現）
    if(V.outL)h+=out(V.outL,true);
    if(V.outR)h+=out(V.outR,false);
    h+=slot('chl',V.inL)+slot('chr',V.inR);
    if(V.larva)h+=stLarva('','svlarva'+(two?' two':'')+(fx.includes('larvaSway')?' a-lsway':''));   // 兩個人時小球在正中間
  }
  const bf=fx.find(x=>x.startsWith('bigFace'));   // 大臉飄過（v0.40.49）：那個人的頭像，半透明地從左上飄過
  if(bf){const w=bf.split(':')[1]||L.who,im=STORY_NPC[w]?STORY_NPC[w].img:w;   // 對象＝人物（用他的 _L_0）或圖名（例 yanjie_L_6）；只擷取頭部、邊緣淡化
    if(im)h+=`<div class="svbigface" style="animation-delay:-${Math.round(performance.now()-V.t0)}ms"><img alt="" ${chrAttr(im)}></div>`}
  if(fx.includes('flash'))h+='<div class="svflash"></div>';
  h+=stVnDlg(V,L,T,V.helper)+stVnHelp(V,V.helper)+stVnTop(V);
  return h+'</div>';
}

// 立繪移動（v0.40.62）：不在原位或這句在移動的那一格，包一層軌道（兩格立繪之間）
//   圖片：left＝x×軌道寬、translateX＝−x×自己的寬（x 0＝貼左格、1＝貼右格）｜小球（一群或單隻）：整群平移 (x−原位)×軌道寬
function stMvWrap(V,k,inner,lv){const home=k==='chr'?'R':'L',p=(V.pos&&V.pos[k])||home,a=V.mvA&&V.mvA[k];if(p===home&&!a)return inner;
  const P=ST_POS[p],x0=a?ST_POS[a[0]].x:P.x,dl=`--dl:-${Math.round(performance.now()-(V.tl||0))}ms`;
  if(lv){const h0=ST_POS[home].x,n=/^larvae:(\d)/.test(V[k])?+V[k].slice(7):1;return `<div class="svlgw${a?' mving':''}" style="--x0:${x0-h0};--x1:${P.x-h0};--n:${n};z-index:${P.z};${dl}">${inner}</div>`}
  return `<div class="svmv" style="z-index:${P.z}"><div class="svmb${a?' mving':''}" style="--x0:${x0};--x1:${P.x};${dl}">${inner}</div></div>`}
// 對話框（或選項）
// hp＝右下角的小助手：從畫面下緣冒出來，露出整張圖的 V.helperPct%（從上面算），擋住對話框右邊一點（對話框的字縮短，不會被擋到）。教學的格蕾特、helperIn
const stVnHelp=(V,hp)=>hp?`<div class="svhelp${V.helperIn?' in':''}${V.helperOut?' out':''}" style="--hp:${(V.helperPct||60)/100};--dl:-${Math.round(performance.now()-(V.tl||0))}ms"><img alt="" ${chrAttr(hp)}></div>`:'';
function stVnDlg(V,L,T,hp){const ls=V.ev.lines,fx=V.fx||[];let h='';
  if(L.who==='choice'){
    const ch=[];for(let j=V.i;ls[j]&&ls[j].who==='choice';j++)ch.push(j);
    // 選項出來時，上一句的對話框留著（不能點）
    let pj=V.i-1;while(pj>=0&&ls[pj].who==='choice')pj--;const P=ls[pj];
    if(P&&V.lastFull){const who=P.who==='narr'||!P.who?'':P.who==='player'?(META.pname||TEXT.misc.defPlayer):(T.npc[P.who]?T.npc[P.who].n:P.who);
      h+=`<div class="svdlg still${hp?' hhelp'+(V.helper===hp&&(V.helperPct||60)<=45?' hlow':''):''}">${who?`<span class="svwho">${esc(who)}</span>`:''}${P.who==='player'?`<span class="svava">${stHead(P.face||'','svhead')}</span>`:''}<p class="${who?'':'svnarr'}">${stTxt(V.lastFull).replace(/\n/g,'<br>')}</p></div>`;}
    h+=`<div class="svchoices">${ch.map(j=>`<button data-vnc="${j}">${stTxt(ls[j].text)}</button>`).join('')}</div>`;
  }else{
    const who=L.who==='narr'||!L.who?'':L.who==='player'?(META.pname||TEXT.misc.defPlayer):(T.npc[L.who]?T.npc[L.who].n:L.who);
    // 多行：只顯示到第 k 個有字的行（空行照樣留空隙）
    //   head＝已經出完的部分，cur＝這次新出的那一行（逐字模式：一個字一個字出來）
    let head=V.carry||'',cur=String(L.text||'').replace(new RegExp(ST_PAUSE.source,'g'),'');
    if(!V.fxAll.includes('all')){const u=stUnits(L.text),k=Math.min(V.k,u.length);
      head+=u.slice(0,k-1).map(x=>x.pre+x.t).join('');cur=u[k-1].pre+u[k-1].t;}
    V.typing=ST_TXT==='type'&&V.tk<V.k;
    const body=stTxt(head).replace(/\n/g,'<br>')+(V.typing?stTypeHTML(cur):stTxt(cur).replace(/\n/g,'<br>'));
    h+=`<div class="svdlg${V.dtop?' top':''}${hp&&!V.dtop?' hhelp'+(V.helper===hp&&(V.helperPct||60)<=45?' hlow':''):''}" data-act="vnext">${who?`<span class="svwho">${esc(who)}</span>`:''}${L.who==='player'?`<span class="svava">${stHead(L.face||'','svhead')}</span>`:''}<p class="${who?'':'svnarr'}">${body}</p><span class="svnx">▼</span></div>`;
  }
  return h;}
// 畫面上層：好感提示、預覽的句號、跳過
function stVnTop(V){let h='';
  h+=stFavPopHtml();
  if(!ST_REPLAY)h+=`<button class="svskip" data-act="vskip">${esc(stT().skip)}</button>`;
  if(ST_REPLAY)h+=`<button class="svpvx" data-act="rpquit">${esc(stT().diaryQuit)}</button>`;
  if(ST_PV)h+=`<span class="svpvno">${esc(V.ev.id)} #${V.i+1}</span>`;   // 預覽：跳過＝結束這段（不另外放「結束預覽」）   // 預覽：左上顯示句號（和總表「句號」欄一樣）
  return h;}
// 跳過這段劇情：照預設路線（選項選第一個）把還沒算的數值變化算完，直接結束這段
// 好感提示（劇情裡）
const stFavPopHtml=()=>ST_FAVPOP.length?`<div class="svfavs">${ST_FAVPOP.map(x=>`<div class="svfav${x.bad?' bad':''}" data-id="${x.id}" style="animation-delay:-${Math.round(performance.now()-x.t0)}ms">${esc(x.t)}</div>`).join('')}</div>`:'';
function stVnSkip(){const V=SUI.vn;if(!V)return;const ls=V.ev.lines;let i=V.i,first=true,n=0;
  while(i<ls.length&&n++<999){const L=ls[i];
    if(L.who==='cond'){i=stCondJump(ls,i);continue}
    if(L.who==='choice'){const e=String(L.eff||'').split(/[,，、]/).filter(p=>!/^\s*fav\./.test(p)).join(',');if(e)stEff(e);const j=L.go==='end'?ls.length:L.go?ls.findIndex(l=>l.tag===L.go):i+1;i=j<0?ls.length:j;first=false;continue}   /* 跳過：選項的好感不給（使用者 11-08：只算一定會給的），其他效果照算、走第一個選項 */
    if(!first&&L.eff)stEff(L.eff);first=false;   // 跳過：效果照算、不浮好感提示（使用者 11-08：有給就好）
    if(L.go){const j=L.go==='end'?ls.length:ls.findIndex(l=>l.tag===L.go);i=j<0?ls.length:j}else i++;}
  clearInterval(ST_TW);const d=V.done;SUI.vn=null;stRender();d();}
// 日記本：重看看過的劇情（ST_REPLAY：不加數值、不記錄，看完回到日記本）
let ST_REPLAY=false;
function stReplay(id){const ev=STORY_SCRIPT.find(x=>x.id===id);if(!ev)return;ST_REPLAY=true;ST_FAVPOP=[];
  stPlay([ev],stReplayEnd);}
function stReplayEnd(){clearInterval(ST_TW);SUI.vn=null;ST_REPLAY=false;SUI.scr='bag';SUI.btab='diary';stRender()}
// ---------- 劇情預覽（不動到存檔）：日常的開發者模式 →「劇情預覽」（v0.40.69 起沒有預覽頁了）----------
let ST_PV=false;
function stPvMenu(){const T=stT().pv;
  const evs=STORY_SCRIPT.filter(x=>x.lines.length);
  pick(T.title,[{node:stTxtNode()},{rule:true},...evs.map(e=>({id:e.id,label:e.id+'　'+(e.note||'')}))],k=>stPvPlay(k),T.body);}
// id＝事件編號，或直接給一個事件（匯入的、試播用的）；after＝播完要回哪裡（預設回清單）
function stPvPlay(id,after){
  const ev=typeof id==='object'?id:STORY_SCRIPT.find(x=>x.id===id);if(!ev)return;ST_PV_AFTER=after||null;
  ST_PV=true;$('ovPick').classList.remove('show');if(!META.doll)META.doll=dollDef();
  STY=storyNew();SUI.scr='home';SUI.sched=stFixedFill();SUI.sel=0;SUI.greteOn=false;STRUN=null;STORY_DOLL={};ST_FAVPOP=[];
  $('ovStory').classList.add('show');document.body.classList.add('story');
  stDollLoad();
  stPlay([ev],stPvEnd);
}
let ST_PV_AFTER=null;
function stPvEnd(){storyClose();ST_PV=false;STY=null;const f=ST_PV_AFTER;ST_PV_AFTER=null;(f||stPvMenu)()}
;
/* ==== js/story/sys.js ==== */
// ===== 主線 sys.js：系統：儲存、讀取、設定（對話顯示、行程本樣式） =====
// 主線的程式拆成 js/story/*.js（v0.40.34），照 index.html 的順序載入，全部是全域變數。

// ---------- 系統：儲存／讀取（每週開始、白天回到家時；其他時候執行中不能開）----------
const stSlotInfo=s=>{const T=stT().sys;return s.run?fmt(T.slotInfoDay,{w:s.week,d:ST_DAYS()[s.run.i],at:s.at}):fmt(T.slotInfo,{w:s.week,at:s.at})};   // 週中途存的：寫星期幾
// 中繼存檔（自由模式）的名字：中繼 n　第一章　UM-XXXX　日期（不寫週；之後小球代號會換成名字，v0.40.69）
const stFreeLabel=(f,i)=>{const T=stT().start;return f?fmt(T.freeSlot,{n:i+1,ch:stT().chapter[f.ch]||'',id:fmt(stT().larvaId,{n:f.num}),at:f.at}):fmt(T.freeEmpty,{n:i+1})};
function stSlotLabel(s,i){const T=stT().sys;return fmt(T.slot,{n:i+1})+'　'+(s?stSlotInfo(s):T.empty)}
function stSys(){
  const T=stT().sys;
  pick(T.title,[{id:'save',label:T.save},{id:'load',label:T.load},{id:'set',label:T.set},{id:'leave',label:T.leave}],k=>{
    if(k==='save')stSysSave();if(k==='load')stSysLoad();if(k==='set')stSysSet();if(k==='leave')storyLeaveAsk();
  },T.auto);
}
// 設定：畫面配色（v0.40.45；只存在這台裝置，像外觀設定）：day 永晝｜night 永夜｜auto 隨時間變化（排行程的家＝晚上，執行這週、自由行動＝早上）
//   控制列、行程本、狀態、收納、水缸、系統、確認框都照這個（背景圖不變）
const ST_THEMES=['day','night','auto'];
let ST_THEME=(()=>{try{const v=localStorage.getItem('xenolarva_storytheme');return ST_THEMES.includes(v)?v:'auto'}catch(e){return 'auto'}})();
const stDayLook=()=>ST_THEME==='day'||(ST_THEME==='auto'&&!!STRUN);   // 現在用早上的配色
function stSysSet(){
  const T=stT().sys;
  pick(T.set,[{node:stTxtNode()},{rule:true,label:T.book},...ST_THEMES.map(b=>({id:b,label:T.books[b]+(b===ST_THEME?T.now:''),main:b===ST_THEME}))],b=>{ST_THEME=b;try{localStorage.setItem('xenolarva_storytheme',b)}catch(e){}stRender()});
}
function stSysSave(after){
  const T=stT().sys,sl=META.storySlots;
  if(STY.freeMode){storyAutoSave();stFlash(T.freeSaved);if(after)after();return}   // 自由模式：存回中繼存檔
  pick(T.save,sl.map((s,i)=>({id:i,label:stSlotLabel(s,i)})),i=>{
    STY.at=new Date().toISOString().slice(0,10);const o=storyPack();sl[i]=o;codexSave();stFlash(fmt(T.saved,{n:i+1}));if(after)after();
  },stHub()?T.onlyDay:T.onlyWeek);
}
function stSysLoad(){
  const T=stT().sys,sl=META.storySlots;
  const TS=stT().start;
  pick(T.load,[...sl.map((s,i)=>({id:i,label:stSlotLabel(s,i),off:!s})),{rule:true,label:TS.loadFree},...stFreeItems()],i=>{
    clearTimeout(ST_TIMER);if(String(i).startsWith('free')){const f=(META.storyFree||[])[+String(i).slice(4)];if(!f)return;STY=storyCopy(f);stResume();storyAutoSave();stFlash(TS.freeLoaded);return}
    STY=storyCopy(sl[i]);stResume();stJobNews(!Array.isArray(STY.jobSeen));storyAutoSave();stFlash(fmt(T.loaded,{n:i+1}));
  });
}
;
/* ==== js/story/art.js ==== */
// ===== 主線 art.js：圖：背景、人物圖、紙娃娃、小球、讀圖 =====
// 主線的程式拆成 js/story/*.js（v0.40.34），照 index.html 的順序載入，全部是全域變數。

// ---------- 圖 ----------
// 大背景：有大圖（assets/bg_hd）就用大圖。單檔預覽版裡只有小圖；預覽頁另外放了 bg_hd 檔案時（v0.40.15），開頭試讀一張成功就改用大圖
let ST_HD=typeof ASSETS==='undefined'||!Object.keys(ASSETS).length||!!ASSETS.__hd;   // __hd：發布版、遊戲頁的對照表寫明有大圖（v0.40.69 續 16）
   // GitHub 版（ASSETS 空的）一定有大圖：不用開頭試讀（v0.40.69：省 394KB）
if(!ST_HD){const t=new Image();t.onload=()=>{ST_HD=true;if($('ovStory').classList.contains('show'))stRender()};t.src=assetPath('home_night',true)}
const stBg=(k,hd)=>{const p=hd&&ST_HD&&assetPath(k,true);return p&&p.includes('bg_hd')?p:(typeof ASSETS!=='undefined'&&ASSETS[k])||assetPath(k,hd)};
let ST_PRE=[];   // 先讀好的圖（留著參考，瀏覽器才不會丟掉）
// 行程會用到的大背景先在背景讀（v0.41.0：一次讀一張、劇情在「讀取中」時先停，不和眼前要用的圖搶網路；不強制解碼，省記憶體）
function stPreload(){if(ST_PRE.length)return;
  const ks=[...new Set([...Object.values(STORY_HOME),...Object.values(STORY_CMDS).map(c=>c.big).filter(Boolean)])];ST_PRE.push(null);
  const next=()=>{if(!ks.length)return;if(SUI.loading){setTimeout(next,500);return}
    const im=new Image();im.onload=im.onerror=()=>setTimeout(next,50);im.src=stBg(ks.shift(),true);ST_PRE.push(im)};
  setTimeout(next,1500)}
const stNpcImg=id=>STORY_NPC[id].img?assetImg(STORY_NPC[id].img):'';
// 小頭像：有頭像圖（xiaojun_face）就用，沒有就用立繪裁上半（class 不同）
// 面向右的版本：新格式的立繪（人物_L_表情）都有對應的 _R_
// 執行時遇到的人：面向右；配件看在不在大樓裡（STORY_NPC.acc）
const stNpcChr=(id,inside)=>{const N=STORY_NPC[id],a=N.acc==='in'?inside:N.acc==='out'?!inside:N.acc==='always';return stFaceR(N.img)+(a?'+acc':'')};
const stFaceR=k=>String(k).replace(/_L_(?=[^_]+$)/,'_R_');
const stFaceL=k=>String(k).replace(/_R_(?=[^_]+$)/,'_L_');
const stIsLarva=k=>!!k&&String(k).startsWith('larva');   // 立繪格放小球：larva 或 larva:姿勢（curl 縮著…）
const stNpcAva=id=>{const N=STORY_NPC[id];return N.face?`<img class="fc" alt="" src="${assetImg(N.face)}">`:N.img?`<img alt="" src="${assetImg(N.img)}">`:''};
let STORY_DOLL={},ST_DOLL_OK=false;     // 紙娃娃每種表情畫一次就記住（白邊很花時間）
// 讀紙娃娃（v0.41.0）：先讀身上穿的部件（畫玩家），好了就畫；其他部件（衣櫃縮圖、服飾店試穿）接著在背景讀，讀好再重畫一次
function stDollLoad(){return dollLoad(META.doll).then(()=>{ST_DOLL_OK=true;STORY_DOLL={};stRender();
  dollLoad().then(()=>{STORY_DOLL={};if($('ovStory').classList.contains('show'))stRender()})})}
function stDollCv(emo){
  if(STORY_DOLL[emo||''])return STORY_DOLL[emo||''];
  const c=document.createElement('canvas');c.width=DOLL_W*DOLL_K;c.height=DOLL_H*DOLL_K;
  if(!META.doll||!ST_DOLL_OK)return c;   // 圖還沒讀好：先空白，讀好後會重畫
  dollPaint(c,META.doll,emo||'');
  return STORY_DOLL[emo||'']=c;
}
// 特殊小球：照剛來的小球（第 1 天：身體、核心白色）、不畫反光、加傷疤
const ST_LOOK={core:[255,255,255],body:[255,255,255],body2:null,bm:'',soft:true,ca:.65,wear:'',wcol:'',noHl:true,scar:1};
// 路人小球：data-look＝「身體 r,g,b｜核心 r,g,b」（js/story/week.js 的 stLarvaCol），一般的小球（有反光、沒有傷疤）
const stPassLook=s=>{const [b,c]=String(s).split('|').map(x=>x.split(',').map(Number));return {core:c,body:b,body2:null,bm:'',soft:true,ca:.85,wear:'',wcol:'',noHl:false,scar:0}};
const stCodexLook=id=>{const e=typeof findLarva==='function'&&findLarva(id);return e?larvaLook(e):ST_LOOK};   // 日常模式養的小球（圖鑑）：照牠的樣子（含裝扮）
function stPaint(root){
  if(ST_DOLL_OK)wardPaint(root);   // 衣櫃的縮圖
  root.querySelectorAll('[data-pname]').forEach(el=>paintName(el,META.pcol||''));   // 名牌照代表色
  root.querySelectorAll('canvas.sdoll[data-try]').forEach(c=>{if(ST_DOLL_OK)dollPaint(c,stTryDoll(),'')});   // 服飾店：玩家穿著試穿的衣物（v0.40.65）
  root.querySelectorAll('canvas.sdoll:not([data-try])').forEach(c=>{const g=c.getContext('2d'),s=stDollCv(c.dataset.emo);g.clearRect(0,0,c.width,c.height);
    if(c.dataset.crop){const k=s.width/DOLL_W/2,[x,y,w]=DOLL_HEAD;g.drawImage(s,x*k,y*k,w*k,w*k,0,0,c.width,c.height)}else g.drawImage(s,0,0,c.width,c.height)});
  root.querySelectorAll('canvas.slarva').forEach(c=>{const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);drawLarva(g,c.width/2,c.width*44/96,0,0,c.dataset.pose||'curl',c.dataset.cid?stCodexLook(c.dataset.cid):c.dataset.look?stPassLook(c.dataset.look):ST_LOOK,performance.now()/1000,1,c.width/96)});
}


// ---------- 水缸的小球（v0.40.35）：照狀態動（stTankMood：sleep 睡著｜scared 縮著發抖｜calm 慢慢漂｜close 游來游去）----------
//   點水缸：sleep／scared／calm＝躲起來（淡出、縮到角落，3 秒後慢慢出來）｜close＝游到玻璃前、伸手
let ST_TANK_RAF=0;
function stTankLoop(){if(ST_TANK_RAF)return;
  const step=()=>{const c=document.querySelector('#ovStory canvas.stanklv');if(!c||!STY){ST_TANK_RAF=0;return}
    const t=performance.now()/1000,m=stTankMood(),P=SUI.tankPoke,pt=P?performance.now()-P.t:1e9;
    // 平常的位置（%）、姿勢、旋轉
    let x,y,pose,rot=0,sq=0,a=1,sc=1;
    if(m==='sleep'){x=22;y=74;pose='rest';sq=Math.sin(t*1.2)*.03}
    else if(m==='scared'){x=18+Math.sin(t*37)*.35;y=76;pose='curl';sq=.02+Math.sin(t*9)*.015}
    else if(m==='calm'){x=36+16*Math.sin(t*.23);y=58+7*Math.sin(t*.61);pose='idle_a';rot=Math.sin(t*.5)*.08}
    else{x=50+30*Math.sin(t*.37);y=46+16*Math.sin(t*.71+1);pose=Math.sin(t*1.3)>.6?'open_a':'idle_a';rot=Math.cos(t*.37)*.12}
    if(P&&pt<4000){const k=P.k;
      if(k==='hide'){   // 0～0.5 秒縮到角落淡出｜躲著｜3～4 秒慢慢出來
        const out=Math.min(1,pt/500),back=pt>3000?(pt-3000)/1000:0,v=out*(1-back);
        x=x+(6-x)*v;y=y+(88-y)*v;a=1-v;pose=v>.3?'curl':pose;sc=1-.3*v;}
      else{const v=Math.min(1,pt/700)*(pt>3000?Math.max(0,1-(pt-3000)/1000):1);   // 貼過來
        x=x+(50-x)*v;y=y+(42-y)*v;sc=1+.35*v;pose=v>.6?'reach_a':pose;sq=v>.6?Math.sin(pt/90)*.04:sq;}}
    c.style.left=x+'%';c.style.top=y+'%';c.style.opacity=a;c.style.transform=`translate(-50%,-50%) scale(${sc})`;
    const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);drawLarva(g,c.width/2,c.width*44/96,rot,sq,pose,ST_LOOK,t,1,c.width/96);
    ST_TANK_RAF=requestAnimationFrame(step)};
  ST_TANK_RAF=requestAnimationFrame(step);}
function stTankPoke(){const m=stTankMood(),k=m==='close'?'peek':'hide',P=SUI.tankPoke;
  if(P&&performance.now()-P.t<3500)return;   // 還在躲：不重來
  SUI.tankPoke={k,t:performance.now()};const p=document.querySelector('#ovStory .stankst');if(p)p.textContent=stT().tank[k];
  setTimeout(()=>{const p=document.querySelector('#ovStory .stankst');if(p&&SUI.tankPoke&&performance.now()-SUI.tankPoke.t>=3000)p.textContent=stT().tank.st[stTankMood()]},3050);}
;
/* ==== js/story/view.js ==== */
// ===== 主線 view.js：畫面：家、行程本、狀態、收納、水缸、執行這週 =====
// 主線的程式拆成 js/story/*.js（v0.40.34），照 index.html 的順序載入，全部是全域變數。

// ---------- 畫面 ----------
const stDoll=(style,emo='',cls='')=>`<canvas class="sdoll ${cls}" data-emo="${emo}" width="${DOLL_W*DOLL_K}" height="${DOLL_H*DOLL_K}" style="${style}"></canvas>`;
// 玩家頭像：和人物頭像（_face）裁同一個範圍
const stHead=(emo='',cls='')=>`<canvas class="sdoll ${cls}" data-emo="${emo}" data-crop="1" width="${DOLL_HEAD[2]}" height="${DOLL_HEAD[2]}"></canvas>`;
// 日記本的頭像（v0.40.61）：編號 B／L 後面的兩位數（STORY_WHO_CODE）；其他編號＝遇到的人、或第一個說話的 NPC。還不認識的人＝？
function stDiaryIco(e){const m=String(e.id).match(/^[BL](\d\d)-/),c=m&&STORY_WHO_CODE[m[1]];
  if(c==='larva')return stLarva('','sdlarva');
  if(c==='me')return stHead('','sdme');
  if(c==='unknown')return '？';
  const k=stArg(e)[0],id=c||(e.trig==='meet'?k.split('@')[0]:null)||(e.lines.find(l=>STORY_NPC[l.who])||{}).who;
  return id&&STORY_NPC[id]&&stKnow(id)?stNpcAva(id)||'？':'？'}
// 還沒觸發的事件：觸發＋條件寫成一句（文字在 TEXT.story.bag.dc）；還不認識的人寫「？？？」
function stEvCond(e){const D=stT().bag.dc,[k,c]=stArg(e),cmd=x=>TEXT.story.cmd[x]||x,who=x=>stKnow(x)&&TEXT.story.npc[x]?TEXT.story.npc[x].n:'？？？';
  const op={'>=':'≥','<=':'≤','==':'＝','=':'＝','>':'＞','<':'＜'};
  const mw=e.trig==='meet'?k.split('@')[0]:null;   // 遇到人：「還不認識那個人」不重複寫
  const cs=storyCondParse(c||(e.trig==='stat'?e.arg:'')).terms.filter(t=>t.v.k!=='alone'&&!((t.v.k==='fav'||t.v.k==='fav0')&&t.of===mw&&t.op==='=='&&t.n===0)).map(t=>
    (t.v.k==='fav'||t.v.k==='fav0')&&t.op==='=='&&t.n===0?fmt(D.newNpc,{who:who(t.of)}):(t.v.k==='fav'||t.v.k==='fav0')&&t.op==='>'&&t.n===0?fmt(D.knowNpc,{who:who(t.of)}):t.v.k==='fav'||t.v.k==='fav0'?fmt(D.fav,{who:who(t.of),op:op[t.op],n:t.n}):t.v.k==='seen'?fmt(D.seen,{cmd:cmd(t.of)}):t.v.k==='week'?fmt(t.op==='>='?D.weekGe:D.week,{op:op[t.op],n:t.n}):t.v.cn+' '+op[t.op]+t.n);
  const [c1]=k.split('%'),[w,at]=k.split('@');
  const head=e.trig==='stat'?'':e.trig==='meet'?(at?fmt(D.meetAt,{who:who(w),at:at.split('|').map(cmd).join('／')}):fmt(D.meet,{who:who(w)})):e.trig==='first'?(D.firstX[k]||fmt(D.first,{cmd:cmd(k)})):e.trig==='roll'?fmt(D.roll,{cmd:cmd(c1)}):e.trig==='alone'?fmt(D.alone,{cmd:cmd(k)}):e.trig==='pick'?fmt(D.pick,{cmd:cmd(k)}):e.trig==='weekStart'?fmt(D.weekStart,{n:k}):e.trig==='weekEnd'?fmt(D.weekEnd,{n:k}):'';
  return [head,...cs].filter(Boolean).join('、')}
const stLarva=(style,cls='')=>`<canvas class="slarva ${cls}" width="192" height="192" style="${style}"></canvas>`;
const ST_ICONS=['stat','plan','bag','tank','sys'];
function stBtn(id,D,extra=''){const T=stT(),cls=id==='run'?'sbtn run':'sbtn'+(SUI.scr===id?' on':'');
  return `<button class="${cls}" data-go="${id}" style="${extra}"><span class="sico">${esc(T.ico[id])}</span>${esc(T.btn[id])}</button>`;}
// 上方橫條的「章節名」「第幾週」（v0.40.62 統一：自由模式＝「自由模式」、不寫第幾週）；地圖的橫條（stFreeBar）也用這個
const stBarCh=()=>STY.freeMode?stT().freeTag:stT().chapter[STY.ch];
const stBarWk=()=>STY.freeMode?'':fmt(stT().week,{n:`<b>${STY.week}</b>`});
function stChrome(D){
  const T=stT(),hub=stHub(),ch=stBarCh(),mn=fmt(T.money,{n:`<b>${stCur().money.toLocaleString('en-US')}</b>`});
  const wk=stBarWk()+(hub?(STY.freeMode?'':'　')+esc(fmt(T.dayName,{d:ST_DAYS()[STRUN.i]})):''),run=hub?'':stBtn('run',D,D?'':'flex:0 0 calc(20% - 3px)');   // 白天回到家：沒有「執行這週」（出門在中間的按鈕）
  let h='';
  if(D){
    h+=`<div class="sside">${ST_ICONS.map(id=>stBtn(id,D)).join('')}${stBtn('leave',D)}<div style="flex:1"></div>${run}</div>`;
    h+=`<div class="sbar"><span class="sch">${esc(ch)}</span><span>${wk}</span>${hub?`<span class="sffree">${esc(T.free.tag)}</span>`:''}${STY.freeMode?'':`<span class="sdim">${esc(fmt(T.goal,{n:STORY_RULE.goalHp}))}</span>`}<span class="smn">${mn}</span></div>`;
  }else{
    h+=`<div class="sbar"><span class="sch">${esc(ch)}</span><span>${wk}</span>${hub?`<span class="sffree">${esc(T.free.tag)}</span>`:''}<span class="smn">${mn}</span></div>`;
    h+=`<div class="sside"><div class="srow">${ST_ICONS.map(id=>stBtn(id,D)).join('')}</div><div class="srow">${stBtn('leave',D,'flex:0 0 calc(20% - 3px)')}<div style="flex:1"></div>${run}</div></div>`;
  }
  if(SUI.scr==='home'&&!STRUN)h+=`<button class="sgcall${SUI.greteOn?' on':''}" data-go="grete" title="${esc(T.greteCall)}" aria-label="${esc(T.greteCall)}"><img class="fc" alt="" src="${assetImg('grete_face')}"></button>`;
  return h;
}
function stHome(D){
  if(STRUN)return '';
  if(SUI.scr!=='home'&&SUI.scr!=='plan')return '<div class="sdimmer"></div>';
  const T=stT();
  let h=stDoll('','','shome');
  if(SUI.greteOn&&SUI.scr==='home')h+=`<div class="sgrete"><img alt="" ${chrAttr('grete_L_0')}><div class="sbub" data-act="tip">${esc(T.grete[SUI.tip%T.grete.length])}<br><small>${esc(T.greteMore)}</small></div></div>`;
  if(SUI.scr==='plan')h+='<div class="sdimmer"></div>';
  return h;
}
function stPane(D,inner,cls=''){return `<div class="spane ${cls}">${inner}</div><button class="sxb" data-go="home" aria-label="${esc(TEXT.misc.close||'關閉')}">✕</button>`}   // v0.40.45：面板跟著舞台的早／晚配色（stDayLook）
// 可能遇到的人（同一個人只算一次）：一個人＝頭像；好幾個人＝「？」，點開只列頭像（v0.40.35）
const stEncIds=id=>[...new Set((STORY_CMDS[id].enc||[]).map(x=>x[0]))];
function stEncAv(id){const e=stEncIds(id);if(!e.length)return '<span class="scav"></span>';
  const T=stT();if(e.length===1){const n=e[0],im=stNpcAva(n);return `<span class="scav"><span class="scavi" title="${esc(T.npc[n].n)}">${im||'？'}</span></span>`}
  return `<span class="scav"><span class="scavi many" data-encpop="${id}">${esc(T.encN)}</span></span>`;}
// 行程表列出來的指令：照 ord 排；打工數值沒到門檻不顯示（v0.40.44）
const stPlanIds=cat=>Object.keys(STORY_CMDS).filter(id=>STORY_CMDS[id].cat===cat&&stShown(id,'plan'))   // 顯示規則在 week.js 的 ST_GATES
  .sort((a,b)=>(STORY_CMDS[a].ord??50)-(STORY_CMDS[b].ord??50));
function stPlan(D){
  const T=stT(),days=ST_DAYS(),s=SUI.sched;
  const lo=stPlanLo();
  const row=i=>{if(i<=lo){const x=STRUN.res[i],nm=x?stCmdName(x.id):D?stT().free.today:stT().free.todayS;   // 週中途：今天以前＝做過的（灰色，不能改）
      return `<div class="sday past${i>4?' we':''}"><span class="sdn">${esc(days[i])}</span><span class="sslot f">${esc(D||!x?nm:T.cmdShort[x.id]||nm)}</span></div>`}
    const id=s[i],c=id?STORY_CMDS[id]:null;
    return `<button class="sday${i===SUI.sel?' sel':''}${i>4?' we':''}" data-day="${i}" data-hl="day${c&&stFixed(c)?' fixed':''}${!id?' blank':''}"><span class="sdn">${esc(days[i])}</span><span class="sslot${c?' f':''}">${c?(D?esc(stCmdName(id))+(c.fixed?`<span class="stg">${esc(T.fixedTag)}</span>`:'')+'<span class="sx">✕</span>':esc(T.cmdShort[id]||stCmdName(id))+(c.fixed?'<span class="stg">●</span>':'')):''}</span></button>`};
  const left=STORY_RULE.weeks-STY.week,need=Math.max(0,STORY_CMDS.med.min-STY.medDone-stMedN());
  const wk=`<div class="sweek" data-hl="week"><div class="swhead"><span>${esc(STY.freeMode?T.freeTag:fmt(T.week,{n:STY.week}))}</span></div>${days.map((_,i)=>row(i)).join('')}
    <div class="ssum" data-hl="medsum"${STY.freeMode?' hidden':''}>${esc(fmt(D?T.medCount:T.medShort,{name:stCmdName('med'),done:STY.medDone,week:stMedN(),min:STORY_CMDS.med.min}))}${!STY.freeMode&&need>left*STORY_CMDS.med.fixed.length?`　<span class="sbad">${esc(T.late)}</span>`:''}</div></div>`;
  const ids=stPlanIds(SUI.tab);
  const list=ids.map(id=>{const c=STORY_CMDS[id],off=stOff(id),pay=stFixed(c)?fmt(T.fixedPay,{days:c.fixed.map(d=>days[d]).join('、')}):c.eff.money?fmt(T.money,{n:c.eff.money}):(c.cat==='job'?fmt(T.money,{n:0}):'');
    return `<button class="scmd${off?' off':''}" ${off?'disabled':''} data-cmd="${id}" data-hl="cmd cmd-${id}"><span class="scrow"><strong>${esc(stCmdName(id))}</strong><span class="scrt">${stEncAv(id)}<span class="spay">${esc(pay)}</span></span></span><span class="sef">${off?esc(off):stEffHTML(id)}</span></button>`
      +(SUI.encPop===id?`<div class="sencpop">${stEncIds(id).map(n=>`<span class="scavi" title="${esc(T.npc[n].n)}">${stNpcAva(n)||'？'}</span>`).join('')}</div>`:'')}).join('');
  const cmd=`<div class="scmdp"><div class="stabs" data-hl="tabs">${STORY_CATS.map(t=>`<button class="${t===SUI.tab?'on':''}" data-tab="${t}" data-hl="cat-${t}">${esc(T.cats[t])}</button>`).join('')}</div><div class="sclist" data-hl="cmds">${list}</div></div>`;
  const foot=`<div class="spfoot"><div class="sgtip"></div><div class="sbtns" data-hl="ok"><button data-act="undo">${esc(T.undo)}</button><button class="run" data-act="ok">${esc(T.ok)}</button></div></div>`;
  return stPane(D,D?`<div class="splanD">${wk}${cmd}</div>${foot}`:wk+cmd+foot,'splan');
}
function stMeter(v,min,max,cls,goal){const p=x=>((x-min)/(max-min)*100).toFixed(1)+'%';
  return `<div class="smeter"><i class="${cls}" style="width:${p(clamp(v,min,max))}"></i>${min<0?`<span class="szero" style="left:${p(0)}"></span>`:''}${goal!=null?`<span class="sgoal" style="left:${p(goal)}"></span>`:''}</div>`;}
function stStat(D){
  const T=stT(),S_=stCur(),ST_=T.stat;
  const row=(k,v,bar,unit='')=>`<div class="skv" data-hl="${k}"><span class="sk">${esc(T.S[k])}</span>${bar}<span class="sv">${v}${unit}</span></div>`;
  let body='';
  if(SUI.stab==='me')body=`<div class="shead" data-hl="head">${stHead('','sface sstathead')}<div><b>${esc(META.pname||TEXT.misc.defPlayer)}</b><br><span class="sdim">${esc(ST_.role)}</span></div></div>`
    +row('str',S_.str,stMeter(S_.str,0,50,''))+row('soc',S_.soc,stMeter(S_.soc,0,50,''))+row('know',S_.know,stMeter(S_.know,0,50,''))+row('fat',S_.fat,stMeter(S_.fat,0,100,'w'))
    +row('money',S_.money.toLocaleString('en-US'),`<span class="sdim">${esc(ST_.moneyNote)}</span>`,' '+esc(T.moneyUnit));
  else if(SUI.stab==='larva')body=`<div class="shead" data-hl="head">${stLarva('width:64px;height:64px','sstatlarva')}<div><b>${esc(fmt(T.larvaId,{n:STY.num}))}</b><br><span class="sdim">${esc(ST_.larvaNote)}</span></div></div>`
    +row('hp',S_.hp,stMeter(S_.hp,0,100,'g',STORY_RULE.goalHp))+row('calm',S_.calm,stMeter(S_.calm,-50,100,'',STORY_RULE.goalCalm))+row('mood',S_.mood,stMeter(S_.mood,0,100,''))+row('tired',S_.tired,stMeter(S_.tired,0,100,'r'));
  else body=STORY_PPL.filter(stKnow).map(n=>{const met=true,im=stNpcAva(n),f=STY.fav[n]||0,cap=storyFavCap(STY.ch,n);
    return `<div class="snpc${met?'':' unk'}" data-hl="ppl${met?' ppl-'+n:''}">${met&&im?im:'<span class="snph"></span>'}<span><b>${met?esc(T.npc[n].n):'？？？'}</b><br><span class="sdim">${esc(met?T.npc[n].d:ST_.unknown)}</span></span><span class="shs">${stHearts(f,cap)}<small>${f}</small></span></div>`}).join('');
  const tabs=`<div class="stabs" data-hl="tabs">${['me','larva','ppl'].map(t=>`<button class="${t===SUI.stab?'on':''}" data-stab="${t}">${esc(ST_.tabs[t])}</button>`).join('')}</div>`;
  return (D?stDoll('','','sstatdoll'):'')+stPane(D,`<h4>${esc(ST_.title)}</h4>${tabs}<div class="sbody">${body}</div>`,'sstat');
}
// 五顆心：一顆 20 點，半顆 10 點；超過這章上限的心是灰的
function stHearts(f,cap){let h='';for(let i=0;i<5;i++){const v=f-i*20,c=v>=20?'f':v>=10?'h':'e';h+=`<i class="sh ${c}${i*20>=cap?' x':''}">♥</i>`}return `<span class="shr">${h}</span>`}
const ST_BTABS=['wear','item','coll','diary'];
function stBag(D){
  const T=stT().bag,tabs=`<div class="stabs" data-hl="tabs">${ST_BTABS.map(t=>`<button class="${t===SUI.btab?'on':''}" data-btab="${t}" data-hl="btab-${t}">${esc(T.tabs[t])}</button>`).join('')}</div>`;
  let body;
  if(SUI.btab==='wear')body=`<div class="sbwear"><div class="sbleft"><div class="sbpv">${stDoll('','','sbagdoll')}<span class="dname" data-pname="1">${esc(META.pname||TEXT.misc.defPlayer)}</span></div>${wardDesc()}</div><div class="sbwr">${wardHTML(SUI.wtab)}</div></div>`;   // 衣櫃：js/wardrobe.js（和日常的玩家設定共用）
  else if(SUI.btab==='item'){   // 道具（v0.40.63 改成清單）：名字（消耗品寫數量）、說明、「使用」。消耗品：排行程時、白天回家時能用｜書：只有自由行動（白天回家）時能用＝這天拿來讀那本書
    const its=STORY_ITEMS.filter(k=>(STY.items||{})[k]),IT=stT().items;
    body=its.length?`<div class="silist" data-hl="grid">${its.map(k=>{const ok=stItemUsable(k);
      return `<div class="sirow"><div class="sitx"><b>${esc(IT[k].n+(STORY_USE[k]?' '+fmt(T.have,{n:STY.items[k]}):''))}</b><span>${esc(IT[k].d)}</span></div><button class="sduse" data-act="use" data-k="${k}"${ok?'':' disabled'}>${esc(T.use)}</button></div>`}).join('')}</div>`
      :`<div class="silist" data-hl="grid"><p class="sdim">${esc(T.noItem)}</p></div>`;}
  else if(SUI.btab==='coll')body=`<div class="sbitem"><div class="sdesk" data-hl="grid"><img class="stankbg" alt="" src="${stBg(STORY_HOME.bag)}"></div><div class="sdinfo">${esc(T.collEmpty)}</div></div>`;   // 收藏品：擺在桌上（之後安排）
  else{   // 日記本：看過的劇情（有「日記標題」的才會列出來），點一下重看（不會改數值）
    const evs=STY.done.map(id=>STORY_SCRIPT.find(x=>x.id===id)).filter(e=>e&&e.title);   // v0.40.57：照種類分組（主線｜支線｜小事件），中間用分隔線
    // v0.40.60：支線、小事件還沒觸發的也列出來（灰的、不能按，只寫標題和條件）；主線寫第幾章，其他寫頭像（stDiaryIco）
    // v0.40.61：右上開關＝顯示／隱藏還沒觸發的（META.storyDiaryHide）（主線的開發者模式 v0.40.69 拿掉）
    const hide=!!META.storyDiaryHide,ev2=evs;
    const todo=hide?[]:STORY_SCRIPT.filter(e=>e.title&&e.lines.length&&e.kind&&e.kind!=='main'&&e.ch<=STY.ch&&!STY.done.includes(e.id));
    const grp=['main','side','event'].map(k=>[k,ev2.filter(e=>(e.kind||'main')===k),todo.filter(e=>e.kind===k)]).filter(g=>g[1].length||g[2].length);
    const lead=e=>(e.kind||'main')==='main'?`<span class="sdch">${esc(stT().chapter[e.ch]||'')}</span>`:`<span class="sdico">${stDiaryIco(e)}</span>`;
    const top=`<div class="sdtop"><button class="sdtog${hide?'':' on'}" data-act="dlock">${esc(T.diaryLock)}</button></div>`;
    body=`<div class="sdiary" data-hl="grid">${top}${grp.length?grp.map(([k,es,ts])=>`<div class="sdhead">${esc(T.diaryKinds[k])}</div>`
      +es.map(e=>`<button class="sdrow" data-diary="${esc(e.id)}">${lead(e)}<span>${esc(e.title)}</span></button>`).join('')
      +ts.map(e=>`<div class="sdrow sdlock">${lead(e)}<span>${esc(e.title)}<small>${esc(stEvCond(e))}</small></span></div>`).join('')).join(''):`<p class="sdim">${esc(T.diaryEmpty)}</p>`}</div>`;
  }
  return stPane(D,`<h4>${esc(T.title)}</h4>${tabs}${body}`,'sbag');
}
// 水缸（v0.40.35）：小球照狀態動（睡著／縮著發抖／慢慢漂／游來游去），點牠＝躲起來（安心夠了＝貼過來）。動畫在 art.js 的 stTankLoop
function stTankMood(){const s=stCur();return s.hp<20||s.tired>=80?'sleep':s.calm<0?'scared':s.calm<25?'calm':'close'}
function stTank(D){const T=stT().tank,m=stTankMood(),P=SUI.tankPoke;
  const txt=P&&performance.now()-P.t<3000?T[P.k]:T.st[m];
  return stPane(D,`<div class="stankbox" data-hl="tank" data-act="tankpoke"><img class="stankbg" alt="" src="${stBg(STORY_HOME.tank)}"><canvas class="stanklv" width="192" height="192"></canvas></div><div class="stanktxt"><p class="stankst">${esc(txt)}</p><p class="sdim">${esc(T.poke)}　${esc(T.note)}</p></div>`,'stank');}
// 結果表：玩家／小球兩排，欄位對齊（能力｜錢｜疲勞疲倦）；遇到人時多一排人際
const ST_ROWS=[['rowMe',[['str','soc','know'],['money'],['fat']]],['rowLarva',[['hp','calm'],[],['tired']]]];
function stVals(x){const T=stT();let h='';
  const cell=k=>{const v=x.d[k],cost=k==='fat'||k==='tired',bad=cost?v>0:v<0,tag=v===0?'span':bad?'u':'i';
    const b=k==='money'?x.before[k].toLocaleString('en-US'):x.before[k];
    return `<span class="svv"><span class="svk">${esc(T.S[k])}</span><b>${b}</b> <${tag}>${v>=0?'+':''}${k==='money'?v.toLocaleString('en-US'):v}</${tag}></span>`};
  for(const [lab,cols] of ST_ROWS){if(!cols.flat().some(k=>k in x.d))continue;
    h+=`<span class="svl">${esc(T[lab])}</span>`+cols.map(ks=>`<span class="svc">${ks.filter(k=>k in x.d).map(cell).join('')}</span>`).join('');}
  if(x.buys&&x.buys.length)h+=`<span class="svl">${esc(T.rowBuy)}</span><span class="svc" style="grid-column:2/-1"><span class="svv">${esc(x.buys.map(k=>T.items[k].n).join('、'))}</span></span>`;   // 在店裡買到的
  if(x.kick&&T.kick)h+=`<span class="svl"></span><span class="svc sdim" style="grid-column:2/-1">${esc(T.kick)}</span>`;
  const V=x.stg&&x.stg.visit;if(V)h+=`<span class="svl">${esc(T.rowPpl)}</span><span class="svc" style="grid-column:2/-1"><span class="svv">${esc(fmt(T.visitBy,{name:V.name}))}</span></span>`;   // 日常模式的小球來陪你（沒有數值）
  if(x.enc)h+=`<span class="svl">${esc(T.rowPpl)}</span><span class="svc" style="grid-column:2/-1"><span class="svv"><span class="svk">${esc(T.npc[x.enc].n)}</span>${x.fg&&x.meet?`<i>${esc(T.favMeet)}</i>`:x.fg?`<i>${esc(fmt(T.fav,{n:x.fg}))}</i>`:STY.freeMode?'':`<span class="sdim">${esc(T.favMax)}</span>`}</span></span>`;
  return `<div class="svg">${h}</div>`;}
function stRun(D){
  const T=stT(),R_=T.run,days=ST_DAYS();
  if(STRUN.i>=7){
    const rows=STRUN.res.map((x,i)=>`<div class="ssrow"><span class="ssd">${esc(fmt(T.dayName,{d:days[i]}))}　<b>${esc(stCmdName(x.id))}</b>${x.forced?`<span class="sdim">${esc(R_.forced)}</span>`:''}${STORY_CMDS[x.id].cat==='care'||x.r==='great'||x.r==='bad'?` <span class="srk ${x.r}">${esc(R_.rank[x.r])}</span>`:''}</span><div class="sres">${stVals(x)}</div></div>`).join('');
    const lv=STRUN.lived?`<div class="ssrow"><span class="ssd">${esc(R_.living)}</span><div class="sres">${stVals({before:{...STRUN.end,money:STRUN.end.money+STORY_RULE.living},d:{money:-STORY_RULE.living}})}</div></div>`:'';   // 生活費
    const tot={before:STRUN.start,d:{}};['hp','calm','str','soc','know','money','fat','tired'].forEach(k=>tot.d[k]=STRUN.end[k]-STRUN.start[k]);
    return `<div class="srunov"><div class="srunbox ssumbox"><div class="srhead"><span>${esc(STY.freeMode?T.freeTag:fmt(R_.sumTitle,{w:STY.week}))}</span></div>
      <div class="ssumlist">${rows}${lv}<div class="ssrow stot"><span class="ssd">${esc(R_.total)}</span><div class="sres">${stVals(tot)}</div></div></div>
      <div class="srfoot" style="justify-content:flex-end"><button class="run" data-act="weekok">${esc(R_.ok)}</button></div></div></div>`;
  }
  const x=STRUN.res[STRUN.i];if(!x)return '';   // 還沒算（讀取中、自由行動還沒選）
  const c=STORY_CMDS[x.id],ph=STRUN.phase,care=c.cat==='care';
  const G=x.stg||{},emo=ph===1?(G.me!=null?G.me:x.r==='great'?'fun':x.r==='bad'?'sad':''):'';   // 演出規則：STORY_STAGE（js/story/data/story.js）
  const anim=ph===0?'a-'+(c.act||'rest'):(STRUN.still?(x.r==='bad'?'sq':''):'a-'+x.r);
  const left=care?stLarva('',`srl slarvaT${ph===0&&(x.id==='med'||x.id==='touch')?' a-fail':''}`):'';
  const nk=x.enc&&stNpcImg(x.enc)?stNpcChr(x.enc,STORY_CMDS[x.id].at==='hall'):'',sing=!!(G.npc&&G.npc.sing),nr=(ph===1||sing)&&G.npc,nanim=sing?'a-sing':nr&&G.npc.hop?'a-ok':'';   // sing：唱歌（從頭到尾用那張立繪、慢慢晃）   // 遇到的人：結果出來時照規則換表情、跳一下
  // 小球們（v0.40.38）：路人小球（G.pass，行動模式見 STORY_STAGE）｜圍著玩家的小球（G.crowd，5F）｜來陪你的小球（G.visit，日常模式養的）
  // 一直重複的動畫（跑過去、晃、跳）：從這一天開始算時間，點一下跳到結果時接著動，不會重來（v0.40.39）
  if(!x.t0)x.t0=performance.now();const el=o=>Math.round(performance.now()-x.t0+(o.dl||0));
  const lv=(o,cls,st='')=>`<canvas class="slarva srpass ${cls}" ${o.cid?`data-cid="${esc(o.cid)}"`:`data-look="${o.look}"`} data-pose="${o.pose}" width="192" height="192" style="${st}${st?';':''}${/animation:/.test(st)?'':`animation-delay:-${el(o)}ms`}"></canvas>`;
  const PS=G.pass||[],used=new Set(),side=t=>{const sl=t==='npc'?[5,49]:x.enc?[93,49]:[93,44],v=sl.find(q=>!used.has(q))??sl[0];used.add(v);return v},   // 旁邊的位置：外側先、再來是兩人中間（不重疊）
    head=t=>PS.filter(o=>o.m==='head'&&o.tgt===t).map(o=>lv(o,'m-head')).join('');
  const pass=PS.map(o=>o.m==='run'?lv(o,'m-run',`bottom:${o.y}%;animation:srunx ${o.dur}ms linear -${el(o)}ms infinite${o.rev?' reverse':''},spbob .5s ease-in-out -${el(o)}ms infinite`)
    :o.m==='follow'?lv(o,'m-side '+(o.tgt==='npc'?nanim:anim),`left:${side(o.tgt)}%`)
    :o.m==='nest'?lv(o,'m-side m-nest',`left:${side(o.tgt)}%`)
    :o.m==='big'?lv(o,'m-big '+(o.side==='L'?'bl':'br'))
    :o.m==='pair'?lv(o,'m-pair'+(o.i?' p2':''),`left:${o.x}%;bottom:${2+o.y}%`):'').join('');
  const V=G.visit,vHead=V&&V.m==='watch'&&V.spot==='head';   // 照顧時：在玩家頭上，或右邊偏下（v0.40.39）
  const visit=!V||vHead?'':V.m==='sleep'?lv(V,'m-side m-nest','left:44%'):V.m==='watch'?lv(V,'m-watch'):lv(V,'m-run',`bottom:8%;animation:srunx 2600ms ease-in-out -${el(V)}ms infinite alternate,spbob .5s ease-in-out -${el(V)}ms infinite`);
  const npc=G.away&&!x.enc?`<div class="srw srnpc"><img class="snpcS" alt="" ${chrAttr(stFaceL(stNpcChr(G.away,STORY_CMDS[x.id].at==='hall')))}></div>`:x.enc?(nk?`<div class="srw srnpc ${nanim}"><img class="snpcS" alt="" ${chrAttr(nr&&G.npc.face!=null?nk.replace(/_R_\d+/,'_R_'+G.npc.face):nk)}>${head('npc')}</div><span class="sencn">${esc(T.npc[x.enc].n)}</span>`:`<span class="snoimg">？<small>${esc(T.npc[x.enc].n)}</small></span>`):'';
  const crowd=(G.crowd||[]).map(o=>{const go=ph===1&&o.go!=null;   // 圍著玩家一直跳；大失敗＝一部分跑去遇到的人那邊繼續跳
    return lv(o,'srcrowd'+(o.front?' fr':''),`left:${go?o.go:o.x}%;bottom:${1+o.y}%;animation:${go?'sgo .9s ease-in-out both,':''}sjump ${o.sp||700}ms ease-in-out -${el(o)}ms infinite;--x0:${o.x}%;--x1:${o.go}%`)}).join('');
  const me=`<div class="srw srme ${care?'scare ':''}${anim}">${stDoll('',emo,'srd')}${head('me')}${vHead?lv(V,'m-head m-wave'):''}</div>`;
  const item=care&&ph===0?`<span class="srit">${esc(T.item[c.item])}</span>`:'';
  const zz=c.act==='sleep'&&ph===0?'<span class="szz">Z z z</span>':'';
  const dots=`<div class="sdots">${days.map((_,i)=>`<span class="${i===STRUN.i?'on':i<STRUN.i?'done':''}"></span>`).join('')}</div>`;
  const rk=care||x.r==='great'||x.r==='bad';   // 打工也有大成功／大失敗（完成就寫「完成」）
  const res=ph===1?`<div class="sln">${rk?`<span class="srk ${x.r}">${esc(R_.rank[x.r])}</span>`:`<span class="sdim">${esc(x.forced?R_.collapse:R_.done)}</span>`}</div>${stVals(x)}`:`<div class="sln sdim">${esc(R_.wait)}</div>`;
  return `<div class="srunov"><div class="srunbox${ph===0?' sfadein':''}" data-act="tap">
    <div class="srhead"><span>${esc(fmt(STY.freeMode?R_.headFree:R_.head,{w:STY.week,d:days[STRUN.i],cmd:stCmdName(x.id)}))}</span>${dots}</div>
    <div class="srscene"><img class="srbg" alt="" src="${stBg(x.small)}">${pass}${visit}${me}${item}${left}${npc}${crowd}${zz}</div>
    <div class="sres sresday">${res}</div>
    <div class="srfoot"><span class="sdim">${esc(ph===0?R_.tapExec:R_.tapEnd)}</span><button data-act="skip">${esc(R_.skip)}</button></div></div></div>`;
}
;
/* ==== js/story/free.js ==== */
// ===== 主線 free.js：自由行動：滿版地圖、異生會大樓、店、白天的家（週中途回家：改行程、存檔） =====
// 主線的程式拆成 js/story/*.js（v0.40.34），照 index.html 的順序載入，全部是全域變數。

// ---------- 自由行動（v0.40.14；v0.40.44 改成點了直接做）----------
// 地圖的名牌、大樓的樓層、家裡的按鈕、店裡的商品：點一下就做（打工都要排行程；例外：廢墟、活動中心、5F）。
// 「？」＝說明模式（開著＝第一次點只出說明卡，再點一次才做；SUI.fhelp，這次玩的時候一直記著；白天的家不用）。第一次自由行動時播「第一次做：自由行動」的劇情說明玩法。
// 介面不寫多餘的說明（開發通則）：鎖著就是變灰、不能點，不另外寫原因。
// 每一個可以點的東西有一個 key：p:地點｜f:樓層｜h:家裡的按鈕｜c:照顧的方式｜g:店裡的商品
const stFreeNew=()=>({scr:'map',sel:null,stat:false,stab:'me',off:{},shop:null,cart:[]});
const stHub=()=>!!(STRUN&&STRUN.free&&STRUN.free.scr==='home');   // 白天回到家（旁邊的按鈕都能用）
const stPlanLo=()=>stHub()?STRUN.i:-1;   // 行程本：這一天（含）以前不能改
// 店：今天擺出來的商品（買過的＝售完）、還有沒有賣完的
const stShopGoods=s=>STORY_SHOP[s].goods.slice(0,STORY_SHOP[s].show);
// 售完：買過的（書、服飾店的衣物）；消耗品（STORY_USE）一直有貨（v0.40.62）
const stIsWear=k=>DOLL_SHOP_WEAR.includes(k);   // 服飾店賣的是紙娃娃的衣物（v0.40.65）
const stShopSold=(k,F)=>!STORY_USE[k]&&((stIsWear(k)?wearHas(k):stHas(k))||!!(F&&F.cart.some(b=>b[0]===k)));
const stGoodDesc=k=>stIsWear(k)?TEXT.doll.wearDesc[k]||'':stT().items[k].d;
const stShopOpen=s=>stShopGoods(s).some(([k])=>!stShopSold(k));
const stCartSum=F=>F.cart.reduce((a,b)=>a+b[1],0);
const stGoodName=g=>{const n=stIsWear(g[0])?TEXT.doll.wear[g[0]]:stT().items[g[0]].n;return g[2]>1?fmt(stT().free.shop.pack,{n,q:g[2]}):n};   // 一次買 3 個＝「舒緩液×3」
// 一個 key 的內容：{n 名字, d 說明, img 小圖, cmd 會做的事, lock 鎖著（地點：店賣完／錢不夠｜樓層：沒開放、去過一次｜商品：售完 sold、錢不夠 poor）}
function stFreeInfo(key){const T=stT(),FT=T.free,F=STRUN.free,[t,k]=key.split(':');
  if(t==='p'){const p=STORY_MAP[k],pl=T.place[k],c=p.do&&STORY_CMDS[p.do];return {n:pl.n,d:pl.d,img:p.img,cmd:p.do,lock:!!(p.shop&&!stShopOpen(p.shop))||!!(c&&c.eff.money<0&&STRUN.end.money<-c.eff.money)}}
  if(t==='f'){const p=STORY_SCENES.hall.pins[k],pl=T.place[k],lock=!p.do||!stOpen(p)||!!(p.once&&stDid(p.do));
    return {n:FT.floor[k]+'　'+pl.n,d:pl.d,img:p.img,cmd:lock?'':p.do,lock}}
  if(t==='g'){const g=stShopGoods(F.shop)[+k],sold=stShopSold(g[0],F),poor=!sold&&g[1]>STRUN.end.money-stCartSum(F);   // 商品用貨架上的第幾格當 key（同一種道具可以有 1 個、3 個兩格）
    return {n:stGoodName(g),d:stGoodDesc(g[0]),lock:sold||poor,sold,poor}}
  return {n:'',d:''};}
const stFreeLocked=key=>!!stFreeInfo(key).lock;
// 會遇到的人（頭像）
const stEncHTML=id=>{const T=stT(),e=id?[...new Set((STORY_CMDS[id].enc||[]).map(x=>x[0]))]:[];return e.length?`<span class="sfwho">${e.map(n=>`<span class="scavi" title="${esc(T.npc[n].n)}">${stNpcAva(n)||'？'}</span>`).join('')}</span>`:''};
// 「？」說明卡：只有說明，沒有按鈕（再點一次那個東西才做）
function stFreeCard(D){
  const F=STRUN.free,T=stT(),FT=T.free,st=STRUN.end,side=F.scr==='map'?'':' lft';
  if(F.stat){   // 狀態：和說明卡同一個框
    const row=(k,bar,v)=>`<div class="skv"><span class="sk">${esc(T.S[k])}</span>${bar}<span class="sv">${v}</span></div>`;
    const body=F.stab==='me'?row('str',stMeter(st.str,0,50,''),st.str)+row('soc',stMeter(st.soc,0,50,''),st.soc)+row('know',stMeter(st.know,0,50,''),st.know)+row('fat',stMeter(st.fat,0,100,'w'),st.fat)+row('money',`<span class="sdim">${esc(T.stat.moneyNote)}</span>`,st.money.toLocaleString('en-US')+' '+esc(T.moneyUnit))
      :row('hp',stMeter(st.hp,0,100,'g',STORY_RULE.goalHp),st.hp)+row('calm',stMeter(st.calm,-50,100,'',STORY_RULE.goalCalm),st.calm)+row('mood',stMeter(st.mood,0,100,''),st.mood)+row('tired',stMeter(st.tired,0,100,'r'),st.tired);
    return `<div class="sfcard sfstat"><div class="sfhd"><b>${esc(T.stat.title)}</b></div>
      <div class="stabs">${['me','larva'].map(t=>`<button class="${t===F.stab?'on':''}" data-fact="stab" data-v="${t}">${esc(T.stat.tabs[t])}</button>`).join('')}</div><div class="sfbody sbody">${body}</div></div>`;
  }
  if(!F.sel)return '';
  const I=stFreeInfo(F.sel),c=I.cmd&&STORY_CMDS[I.cmd];
  const img=I.img?`<div class="sfthumb"><img alt="" src="${stBg(I.img)}"><span class="sfnm">${esc(I.n)}</span>${stEncHTML(I.cmd)}</div>`
    :`<div class="sfhd"><b>${esc(I.n)}</b>${stEncHTML(I.cmd)}</div>`;
  const eff=c?`<p class="sfeff"><span class="sef">${stEffHTML(I.cmd)}</span>${c.eff.money?`<span class="spay">${esc(fmt(T.money,{n:c.eff.money}))}</span>`:''}</p>`:'';
  return `<div class="sfcard sfinfo${side}">${img}<div class="sfbody">${I.d?`<p class="sfdesc">${esc(I.d)}</p>`:''}${eff}</div></div>`;
}
// 異生會大樓：樓層的圖就是按鈕（左下只有樓層），鎖著的變灰
function stFreeHall(){const F=STRUN.free,FT=stT().free,sc=STORY_SCENES.hall;
  return `<div class="sfhall"><div class="sfhlist">${sc.list.map(k=>{const key='f:'+k,lock=stFreeLocked(key);
    return `<button class="sfflr${lock?' lock':''}${F.sel===key?' on':''}" data-fk="${key}"${lock&&!SUI.fhelp?' disabled':''}><img alt="" src="${stBg(sc.pins[k].img)}"><span class="sfflab">${esc(FT.floor[k])}</span></button>`}).join('')}</div></div>`;}
// 店：沒有臉的店員＋今天的商品＋離開（進店就算今天的行程）
// 店員（v0.40.64；v0.40.67 只有道具店有）：賽倫絲、阿言（認識後）照日子輪流。服飾店沒有店員
const stClerk=s=>{const c=STORY_SHOP[s].clerk||[],ok=c.filter(k=>k==='silence'||stKnow(k));return ok.length?ok[(STY.week*7+STRUN.i)%ok.length]:null};
// 店裡的話（F.say，閃一下就收）：道具店＝店員（進店、買了、點店員隨機一句）｜服飾店＝第一次進來時玩家自言自語
function stShopSay(F,t,ms,who){F.say={t,who,until:Date.now()+ms};setTimeout(()=>{if(STRUN&&STRUN.free===F&&F.say&&F.say.t===t){F.say=null;stRender()}},ms+50)}
function stShopEnter(F,shop){F.scr='shop';F.shop=shop;F.cart=[];F.sel=null;F.try=null;F.bcat='all';const ck=stClerk(shop),S=stT().free.shop;
  if(ck)stShopSay(F,S.clerks[ck].hello,1800,ck);
  else if(shop==='boutique'&&!STY.visit.includes('boutique')){STY.visit.push('boutique');stShopSay(F,S.bopen,3500)}}
const ST_CLERK_HOP={silence:16,ayen:14};   // 點店員跳一下的高度（px，v0.40.69）
const stClerkFig=ck=>{const F=STRUN.free,hop=F.hop&&Date.now()-F.hop<450;return `<div class="sfclerk${hop?' hop':''}" data-fact="clerk" style="--hop:-${ST_CLERK_HOP[ck]||12}px"><img alt="" ${chrAttr(STORY_NPC[ck].img)}></div>`};
// 道具店的清單（售完的排到最下面；只寫名字和價錢）
const stShopOrd=(F,gs,ix)=>ix.sort((a,b)=>stShopSold(gs[a][0],F)-stShopSold(gs[b][0],F)||a-b);
function stShopList(F,gs){const T=stT(),S=T.free.shop;
  return stShopOrd(F,gs,gs.map((g,i)=>i)).map(i=>{const g=gs[i],p=g[1],key='g:'+i,I=stFreeInfo(key);
    return `<button class="sfgood${I.lock?' lock':''}${I.poor?' poor':''}${F.sel===key?' on':''}" data-fk="${key}"${I.lock&&!SUI.fhelp?' disabled':''}><span class="scrow"><strong>${esc(stGoodName(g))}</strong><span class="spay">${esc(I.sold?S.sold:p?fmt(T.money,{n:p}):S.free)}</span></span></button>`}).join('')}
// 服飾店：分類（全部｜套裝｜上衣｜褲裙｜飾品）＋小圖格子（和衣櫃一樣的縮圖）
const ST_BCATS={all:null,set:['set'],top:['top'],pants:['pants'],acc:['glass','hold']};
function stWearGrid(F,gs){const T=stT(),S=T.free.shop,cs=ST_BCATS[F.bcat||'all'];
  const ix=stShopOrd(F,gs,gs.map((g,i)=>i).filter(i=>!cs||cs.includes(stWearSlot(gs[i][0]))));
  if(!ix.length)return `<p class="sdim sfwempty">${esc(S.empty)}</p>`;
  return ix.map(i=>{const [k,p]=gs[i],key='g:'+i,I=stFreeInfo(key),own=I.sold&&!F.cart.some(b=>b[0]===k),sl=stWearSlot(k),col=DOLL_WEAR_TINT.includes(k)?(wardDoll().wc||{})[sl]||DOLL_WEAR_DEF.wc[sl]:'';
    return `<button class="sbcell swc sfwc${F.sel===key?' on':''}${I.poor?' poor':''}${own?' own':''}" data-fk="${key}"${I.lock&&!own&&!SUI.fhelp?' disabled':''}><canvas class="swthumb" data-wid="${k}" data-tc="${esc(col)}" width="120" height="120"></canvas><span>${esc(stGoodName(gs[i]))}</span><b class="spay">${esc(I.sold?S.own:p?fmt(T.money,{n:p}):S.free)}</b></button>`}).join('')}
// 服飾店：點衣物＝玩家先穿上看看（F.try，離開沒買就回到原本的）
const stWearSlot=id=>Object.keys(DOLL_LISTS).find(k=>DOLL_SLOTS.includes(k)&&DOLL_LISTS[k].includes(id));
function stTryOn(F,key){if(F.shop!=='boutique'||!key.startsWith('g:'))return;const id=stShopGoods(F.shop)[+key.split(':')[1]][0],s=stWearSlot(id);if(s)F.try={...(F.try||{}),[s]:id}}
const stTryDoll=()=>{const F=STRUN&&STRUN.free,d=JSON.parse(JSON.stringify(META.doll||dollDef()));if(F&&F.try)Object.assign(d,F.try);return d};
function stFreeShop(D){const F=STRUN.free,T=stT(),S=T.free.shop,sh=STORY_SHOP[F.shop],gs=stShopGoods(F.shop),bq=F.shop==='boutique';
  if(F.say&&F.say.until<Date.now())F.say=null;
  const head=`<div class="sfshhd"><b>${esc(T.place[F.shop].n)}</b><span class="smn">${esc(fmt(S.left,{n:(STRUN.end.money-stCartSum(F)).toLocaleString('en-US')}))}</span></div>`;
  const leave=`<button class="sfleave" data-fact="leave">${esc(S.leave)}</button>`,bg=`<img class="sbg sfhbg" alt="" draggable="false" src="${stBg(sh.bg,true)}">`;
  if(!bq){const ck=stClerk(F.shop),CS=ck&&S.clerks[ck],say=F.say&&ck?`<div class="sfsay ck"><b>${esc(CS.n)}</b>${esc(F.say.t)}</div>`:'';
    return `${bg}${ck?stClerkFig(ck):''}${say}<div class="sfshop">${head}<div class="sfglist">${stShopList(F,gs)}</div>${leave}</div>`}
  // 服飾店：玩家站左邊（試穿）；右邊＝說明（名字＋版權小字同一行靠右）、分類、小圖格子
  const g=F.sel&&gs[+F.sel.split(':')[1]],dk=g&&g[0];
  const desc=`<div class="sfwd">${dk?`<div class="sfwdh"><b>${esc(stGoodName(g))}</b>${dk.startsWith('fan_')?`<small>${esc(TEXT.doll.fanNote)}</small>`:''}</div><span>${esc(stGoodDesc(dk))}</span>`:''}</div>`;
  const tabs=`<div class="swtabs sfbtabs">${Object.keys(ST_BCATS).map(c=>`<button class="${c===(F.bcat||'all')?'on':''}" data-fact="bcat" data-v="${c}">${esc(S.bcats[c])}</button>`).join('')}</div>`;
  const say=F.say?`<div class="sfsay me"><b data-pname="1">${esc(META.pname||TEXT.misc.defPlayer)}</b>${esc(F.say.t)}</div>`:'';
  return `${bg}<div class="sfme">${stDoll('','','sftry').replace('<canvas ','<canvas data-try="1" ')}</div>${say}<div class="sfshop bq">${head}${desc}${tabs}<div class="sbgrid sfwgrid">${stWearGrid(F,gs)}</div>${leave}</div>`;}
// 白天的家：睡覺、照顧小球（三種直接列出來）、出門（另一個顏色、隔開）；點了就做（不用「？」）。旁邊的按鈕（狀態、行程、收納、水缸、系統、離開）都能用
function stFreeHome(D){const FT=stT().free,sc=STORY_SCENES.home;
  const fx=!D?(SUI.bgx??STORY_FOCUS[sc.bg]??50):50;
  let h=`<img class="sbg" alt="" draggable="false" src="${stBg(sc.bg,true)}" style="object-position:${fx}% 50%">`+stDoll('','','shome');
  if(SUI.scr==='plan')h+='<div class="sdimmer"></div>'+stPlan(D);
  else if(SUI.scr==='stat')h+='<div class="sdimmer"></div>'+stStat(D);
  else if(SUI.scr==='bag')h+='<div class="sdimmer"></div>'+stBag(D);
  else if(SUI.scr==='tank')h+='<div class="sdimmer"></div>'+stTank(D);
  h+=stChrome(D);
  if(SUI.scr!=='home')return h;
  const b=id=>`<button class="sfhb" data-fk="c:${id}"><strong>${esc(stCmdName(id))}</strong><span class="sef">${stEffHTML(id)}</span></button>`;
  return h+`<div class="sfhub">${['sleep',...sc.care].map(b).join('')}<button class="sfhb sfhout" data-fk="h:out"><strong>${esc(FT.hub.out)}</strong></button></div>`;
}
function stFree(D,W,H){
  const F=STRUN.free,T=stT(),FT=T.free;
  if(F.scr==='home')return stFreeHome(D);
  let h;
  if(F.scr==='shop')h=stFreeShop(D);
  else if(F.scr==='hall')h=`<img class="sbg sfhbg" alt="" draggable="false" src="${stBg(STORY_SCENES.hall.bg,true)}">`+stFreeHall()+`<div class="sftop"><span class="sftitle">${esc(FT.scene.hall)}</span><button class="sfout" data-fact="map">${esc(FT.out.hall)}</button></div>`;
  else{   // 地圖：可以拖
    const lw=Math.max(W,Math.round(H*1.5)),lh=Math.round(lw/1.5);
    if(!F.off.map)F.off.map={x:Math.round((W-lw)*(D?.5:.3)),y:Math.round((H-lh)/2)};
    const o=F.off.map;
    h=`<div class="sfmap" style="width:${lw}px;height:${lh}px;transform:translate(${o.x}px,${o.y}px)"><img class="sfbg" alt="" draggable="false" src="${stBg('map',true)}">`;
    for(const id in STORY_MAP){const p=STORY_MAP[id],key='p:'+id,lock=stFreeLocked(key);
      h+=`<button class="sfpin${F.sel===key?' on':''}${lock?' soon':''}" data-fk="${key}"${lock&&!SUI.fhelp?' disabled':''} style="left:${p.x}%;top:${p.y}%"><span>${esc(T.place[id].n)}</span></button>`}
    h+='</div>';}
  if(F.sel&&(F.scr!=='shop'||SUI.fhelp)||F.stat)h+=stFreeCard(D);   // 店裡點商品＝選取（點兩下才買），不跳說明卡（說明模式才跳）
  return h+stFreeBar();
}
function stFreeBar(){const F=STRUN.free,T=stT(),FT=T.free,days=ST_DAYS();
  const ch=stBarCh(),mn=fmt(T.money,{n:`<b>${(STRUN.end.money-stCartSum(F)).toLocaleString('en-US')}</b>`});
  return `<div class="sbar sfbar"><span class="sch">${esc(ch)}</span><span>${stBarWk()}${STY.freeMode?'':'　'}${esc(fmt(T.dayName,{d:days[STRUN.i]}))}</span><span class="sffree">${esc(FT.tag)}</span><span class="smn">${mn}</span><span class="sfbtns"><button class="sfcirc${F.stat?' on':''}" data-fact="stat" title="${esc(FT.stat)}" aria-label="${esc(FT.stat)}">${esc(T.ico.stat)}</button><button class="sfcirc${SUI.fhelp?' on':''}" data-fact="help" aria-label="?">？</button></span></div>`;
}
// ---------- 點了以後 ----------
// 回到家：行程本改成「這週的行程」（今天以前不能改），自動存檔（下次從這裡接著玩）
function stHubEnter(noSave){const R=STRUN,F=R.free;F.scr='home';F.sel=null;F.stat=false;SUI.scr='home';SUI.encPop=null;
  SUI.sched=R.ids.map(x=>x==='free'?'':x);const nx=SUI.sched.findIndex((x,j)=>!x&&j>R.i);SUI.sel=nx>=0?nx:Math.min(6,R.i+1);
  if(!noSave)storyAutoSave();}
const stHubSync=()=>{const R=STRUN;for(let j=R.i+1;j<7;j++)R.ids[j]=SUI.sched[j]||'free'};   // 行程本改了 → 這週接下來的日子
function stFreeRun(key){const F=STRUN.free,[t,k]=key.split(':');
  if(t==='p'){const p=STORY_MAP[k];
    if(p.go==='home'){stHubEnter();return}
    if(p.go){F.scr=p.go;return}
    if(p.shop){stShopEnter(F,p.shop);return}
    stFreeGo(p.do);return}
  if(t==='f'){stFreeGo(STORY_SCENES.hall.pins[k].do);return}
  if(t==='h'){F.scr='map';SUI.scr='home';return}
  if(t==='c'){stFreeGo(k);return}
  if(t==='g'){const g=stShopGoods(F.shop)[+k],ck=stClerk(F.shop);F.cart.push([g[0],g[1],g[2]||1]);if(ck)stShopSay(F,stT().free.shop.clerks[ck].thanks,1800,ck)}}   // 購物車：[道具, 價錢, 幾個]
let ST_FDRAG=false;
function stFreeClick(e){
  const F=STRUN.free;if(ST_FDRAG){ST_FDRAG=false;return}
  const t=e.target.closest('[data-fk],[data-fact]');
  if(F.scr==='shop'&&F.shop==='boutique'&&F.say){F.say=null;if(!t){stRender();return}}   // 服飾店的自言自語：點哪裡都收掉（v0.40.69）
  if(!t){if(!e.target.closest('.sfbar,.sftop,.sfhall,.sfshop,.sfhub')&&(F.sel||F.stat)){F.sel=null;F.stat=false;stRender()}return}   // 點空白（含說明卡本身）＝關掉
  const d=t.dataset;
  if(d.fk){const key=d.fk;
    if((SUI.fhelp&&F.scr!=='home'||key.startsWith('g:'))&&F.sel!==key){F.sel=key;F.stat=false;stTryOn(F,key);stRender();return}   // 說明模式：第一次點＝看說明（家裡不用）｜商品一律點兩下才買（v0.40.64）
    if(stFreeLocked(key))return;
    F.sel=F.shop==='boutique'&&key.startsWith('g:')?key:null;stFreeRun(key);if(STRUN&&STRUN.free)stRender();return}   // 服飾店買了之後還是選著（看說明、穿著）   // 決定了（stFreeGo）就交給 stStep 重畫
  if(d.fact==='help'){SUI.fhelp=!SUI.fhelp;F.sel=null}
  else if(d.fact==='stat'){F.stat=!F.stat;F.sel=null}
  else if(d.fact==='stab')F.stab=d.v;
  else if(d.fact==='map'){F.scr='map';F.sel=null}
  else if(d.fact==='bcat'){F.bcat=d.v}   // 服飾店的分類
  else if(d.fact==='clerk'){const ck=stClerk(F.shop);if(ck){F.hop=Date.now();stShopSay(F,R(stT().free.shop.clerks[ck].idle),3500,ck)}}   // 點店員＝跳一下＋隨機一句
  else if(d.fact==='leave'){const sh=STORY_SHOP[F.shop];stFreeGo(sh.day,{small:sh.bg},F.cart);return}   // 離開店：這天＝逛店（買的東西一起算）
  stRender();
}
// ---------- 週中途的存檔（v0.40.44）：只有白天在家時能存 ----------
function stRunPack(){const R=STRUN;
  return storyCopy({i:R.i,ids:R.ids,start:R.start,end:R.end,met:R.met,res:R.res.slice(0,R.i).map(x=>({id:x.id,r:x.r,before:x.before,d:x.d,small:x.small,big:x.big,enc:x.enc,forced:!!x.forced,kick:!!x.kick,
    fg:x.fg||0,meet:!!x.meet,free:!!x.free,buys:x.buys||[],vis:x.stg&&x.stg.visit?x.stg.visit.name:''}))});}
// 讀存檔／進主線：有 run＝接回這週（白天的家），沒有＝這週開始排行程
function stResume(){const run=STY.run;delete STY.run;SUI.over=false;SUI.scr='home';SUI.sel=0;SUI.encPop=null;ST_FAVPRE=null;
  if(!run){STRUN=null;SUI.sched=stFixedFill();return}
  STRUN={i:run.i,phase:0,still:false,start:{...run.start},end:{...run.end},ids:[...run.ids],res:run.res.map(x=>({...x,stg:x.vis?{visit:{name:x.vis}}:{},preDone:1,postDone:1})),tired:false,bgFade:true,skip:false,free:stFreeNew(),met:{...run.met}};
  stHubEnter(true);}
;
/* ==== js/story/render.js ==== */
// ===== 主線 render.js：畫面重畫 stRender、點擊 stClick、拖曳／縮放 =====
// 主線的程式拆成 js/story/*.js（v0.40.34），照 index.html 的順序載入，全部是全域變數。

let ST_TOAST_T=0;function stFlash(m){SUI.toast=m;stRender();clearTimeout(ST_TOAST_T);ST_TOAST_T=setTimeout(()=>{SUI.toast='';stRender()},1800)}
function stRender(){
  const box=$('ovStory');if(!box||!STY||!box.classList.contains('show'))return;
  const D=innerWidth/innerHeight>=.8;           // 電腦／橫放 or 手機直放
  const W=D?1280:390,H=D?720:Math.max(640,Math.round(innerHeight*390/innerWidth));
  const sc=D?Math.min(innerWidth/W,innerHeight/H):innerWidth/W;
  const day=stDayLook();                         // 早上／晚上的配色（系統 → 設定；隨時間變化＝執行這週、自由行動是早上，排行程的家是晚上）
  const bn=STRUN&&STRUN.i<7&&STRUN.res[STRUN.i]?STRUN.res[STRUN.i].big:STORY_HOME.plan;
  const fx=!D&&bn.startsWith('home')?(SUI.bgx??STORY_FOCUS[bn]??50):50;
  const fade=STRUN&&STRUN.i<7&&STRUN.res[STRUN.i]&&STRUN.phase===0&&STRUN.bgFade,pb=fade?(STRUN.i?STRUN.res[STRUN.i-1].big:STORY_HOME.plan):'';
  let h=fade?`<img class="sbg" alt="" draggable="false" src="${stBg(pb,true)}" style="object-position:${!D&&pb.startsWith('home')?(SUI.bgx??STORY_FOCUS[pb]??50):50}% 50%">`:'';
  h+=`<img class="sbg${fade?' sfadein':''}" alt="" draggable="false" src="${stBg(bn,true)}" style="object-position:${fx}% 50%">`;
  if(STRUN&&STRUN.free)h=stFree(D,W,H);
  else{
    h+=stHome(D);
    if(!STRUN){if(SUI.scr==='plan')h+=stPlan(D);if(SUI.scr==='stat')h+=stStat(D);if(SUI.scr==='bag')h+=stBag(D);if(SUI.scr==='tank')h+=stTank(D);}
    h+=stChrome(D);
    if(STRUN)h+=stRun(D);
  }
  if(SUI.vn)h+=stVn(D);
  if(SUI.over==='mid'){const M=stT().mid;h=`<div class="sover"><b>${esc(fmt(M.title,{ch:stT().chapter[STY.ch]||''}))}</b><div><button data-act="midsave"${SUI.midSaved?' disabled':''}>${esc(SUI.midSaved?M.saved:M.save)}</button><button data-act="overleave">${esc(stT().over.leave)}</button></div></div>`}   // 章末：中繼存檔
  else if(SUI.over)h=`<div class="sover"><b>${esc(stT().over.title)}</b><div><button data-act="overload">${esc(stT().over.load)}</button><button data-act="overleave">${esc(stT().over.leave)}</button></div></div>`;   // 遊戲結束（負債、月底評估沒過）
  if(SUI.loading)h=`<div class="svload"><span class="svlw"><span class="svlb">${[1,2,3].map(i=>`<img alt="" src="${assetImg('loading_'+i)}">`).join('')}</span>${esc(stT().loading)}</span></div>`;   // 讀取中：跳跳小球（三格輪播，v0.40.69）   // 讀取中：整個畫面黑的（不要先閃出底下的行程動畫）
  if(SUI.toast)h+=`<div class="stoast">${esc(SUI.toast)}</div>`;
  let st=box.querySelector('.sstage');if(!st){st=h_('div','sstage');box.append(st)}
  st.className='sstage '+(D?'sD':'sP')+(day?' pday':'');document.body.classList.toggle('storyday',day);st.style.width=W+'px';st.style.height=H+'px';
  st.style.transform=`translate(${Math.round((innerWidth-W*sc)/2)}px,${D?Math.round((innerHeight-H*sc)/2):0}px) scale(${sc})`;
  // 重畫時捲動位置不要跳回最上面（v0.40.64：點行程表的指令、道具清單等）：同一個 class 的捲動區照順序還原
  const all0=[...st.querySelectorAll('*')],same=(L,c)=>L.filter(x=>x.className===c);
  const keep=all0.filter(e=>e.scrollTop>0&&!e.matches('.svdlg p')).map(e=>[e.className,same(all0,e.className).indexOf(e),e.scrollTop]);
  st.innerHTML=h;st.dataset.s=sc;stPaint(st);
  if(keep.length){const all1=[...st.querySelectorAll('*')];keep.forEach(([cls,i,top])=>{const e=same(all1,cls)[i];if(e)e.scrollTop=top})}box.scrollTop=box.scrollLeft=st.scrollTop=st.scrollLeft=0;
  const dp=st.querySelector('.svdlg p');if(dp){const sv=SUI.vn&&SUI.vn.scroll||0;dp.scrollTop=sv;requestAnimationFrame(()=>{stScrollDlg(dp,SUI.vn&&SUI.vn.typing?dp.querySelector('.tw'):null)})}   // 對話框固定高度：從上次的位置慢慢捲到最新一行
  if(SUI.vn&&SUI.vn.typing)stTypeStart();else clearInterval(ST_TW);
  stGuideDim(st);
  if(st.querySelector('canvas.stanklv'))stTankLoop();
}
function h_(tag,cls){const e=document.createElement(tag);e.className=cls;return e}

// ---------- 操作 ----------
function stClick(e){
  if(STRUN&&STRUN.free&&!SUI.vn){   // 自由行動；白天的家（stHub）只有中間的按鈕歸自由行動管，旁邊的按鈕照平常
    if(!stHub()||e.target.closest('[data-fk],[data-fact]')){stFreeClick(e);return}
    if(STRUN.free.sel&&!e.target.closest('.sfcard')){STRUN.free.sel=null;stRender()}}
  const t=e.target.closest('[data-vnc],[data-encpop],[data-go],[data-day],[data-cmd],[data-tab],[data-stab],[data-btab],[data-act],[data-diary],'+WARD_SEL);if(!t)return;
  const d=t.dataset,T=stT();
  if(SUI.loading)return;
  if(SUI.over){if(d.act==='overload')storyLoadMenu();if(d.act==='overleave')storyClose();
    if(d.act==='midsave'&&!SUI.midSaved){const T=stT().start,F=META.storyFree||[null,null,null];   // 選一格存（3 格）
      pick(stT().mid.save,[0,1,2].map(i=>({id:i,label:stFreeLabel(F[i],i)})),i=>{F[i]=storyFreeMake(i);META.storyFree=F;codexSave();SUI.midSaved=true;stFlash(fmt(stT().mid.savedToast,{n:i+1}))})}return}
  if(SUI.vn){
    if(d.act==='rpquit'){stReplayEnd();return}
    if(d.act==='vskip'){const T=stT();pick(T.skipAsk,[{id:'y',label:T.skipYes,main:true},{id:'n',label:T.skipNo}],k=>{if(k==='y')stVnSkip()},T.skipBody);return}
    const V=SUI.vn;if(performance.now()-V.t0<250)return;   // 換句後 0.25 秒內的點擊不算（避免連點跳過一句）
    if(d.act==='vnext'){if(V.typing){stTypeDone();return}
      if(stVnMore()){const dp=document.querySelector('#ovStory .svdlg p');V.scroll=dp?dp.scrollTop:0;V.k++;V.fx=stFxAt(V,V.k);V.bgFade=false;V.inR=V.inL=false;V.outR=V.outL=null;V.t0=performance.now();stRender()}else stVnNext()}
    else if(d.vnc!=null){const L=SUI.vn.ev.lines[+d.vnc];if(L.eff)stEff(L.eff,true);stVnNext(L.go||'end')}return}
  if(d.encpop){e.stopPropagation();SUI.encPop=SUI.encPop===d.encpop?null:d.encpop;stRender();return}
  if(d.act==='use'){stUseItem(d.k);return}
  if(d.act==='dlock'){META.storyDiaryHide=!META.storyDiaryHide;codexSave();stRender();return}   // 日記本：顯示／隱藏還沒觸發的
  if(d.act==='skip'){e.stopPropagation();stSkip();return}
  if(d.act==='tap'){stTap();return}
  if(d.act==='weekok'){if(STRUN&&STRUN.i>=7)stWeekDone();return}   // 結算框還沒收掉時連按：不再算一次
  if(STRUN&&!stHub())return;
  if(d.act==='tip'){SUI.tip++;stRender();return}
  if(d.go){
    if(d.go==='grete'){SUI.greteOn=!SUI.greteOn;stRender();return}
    if(d.go==='sys'){stSys();return}
    if(d.go==='leave'){storyLeaveAsk();return}
    if(d.go==='run'){stStartRun();return}
    SUI.scr=SUI.scr===d.go?'home':d.go;SUI.encPop=null;stRender();
    if(SUI.scr!=='home'){const ev=stEvents('open',SUI.scr);if(ev.length)stPlay(ev,stDoneKeep)}return}
  if(d.day!=null){const i=+d.day;if(i<=stPlanLo())return;SUI.sched[i]='';SUI.sel=i;if(stHub())stHubSync();stRender();return}   // 週中途：今天以前不能改
  if(d.cmd){const c=STORY_CMDS[d.cmd],ev=stEvents('pick',d.cmd),tip=()=>{if(ev.length)stPlay(ev,stDoneKeep)};
    if(stFixed(c)){c.fixed.forEach(x=>SUI.sched[x]=d.cmd);stFlash(fmt(T.fixedToast,{cmd:stCmdName(d.cmd),days:c.fixed.map(x=>ST_DAYS()[x]).join('、')}));tip();return}
    if(SUI.sel<=stPlanLo())return;SUI.sched[SUI.sel]=d.cmd;const nx=SUI.sched.findIndex((x,j)=>!x&&j>stPlanLo());if(nx>=0)SUI.sel=nx;if(stHub())stHubSync();stRender();tip();return}
  if(d.tab){SUI.tab=d.tab;SUI.encPop=null;stRender();return}
  if(d.stab){SUI.stab=d.stab;stRender();return}
  if(d.btab){SUI.btab=d.btab;stRender();return}
  if(wardClick(t,v=>{SUI.wtab=v})){stRender();return}   // 衣櫃（js/wardrobe.js）
  if(d.act==='tankpoke'){stTankPoke(e);return}
  if(d.diary){stReplay(d.diary);return}
  if(d.act==='undo'){const f=stFixedFill(),lo=stPlanLo();SUI.sched=SUI.sched.map((x,j)=>j<=lo?x:f[j]);SUI.sel=Math.min(6,lo+1);if(stHub())stHubSync();stRender();return}
  if(d.act==='ok'){SUI.scr='home';const n=SUI.sched.filter((x,j)=>!x&&j>stPlanLo()).length;stFlash(n?fmt(T.okToastFree,{n}):T.okToast);return}
}
$('ovStory').addEventListener('click',stClick);
// 衣櫃：自己選顏色、褲襪透明度（放開才套用：重畫會換掉輸入框）
$('ovStory').addEventListener('change',e=>{const t=e.target;if(STRUN)return;
  if(wardChange(t))stRender()});
addEventListener('resize',()=>{if($('ovStory').classList.contains('show'))stRender()});
// 手機直放：左右拖家裡的背景（人物不動）
(()=>{const box=$('ovStory');let sx=null,sb=0;
  box.addEventListener('pointerdown',e=>{const st=box.querySelector('.sstage');if(!st||!st.classList.contains('sP')||SUI.scr!=='home'||(STRUN&&!stHub())||e.target.closest('button,.sbub,.sfhub'))return;
    sx=e.clientX;sb=SUI.bgx??STORY_FOCUS[STORY_HOME.plan]??50;});
  box.addEventListener('pointermove',e=>{if(sx==null)return;const st=box.querySelector('.sstage'),img=st&&st.querySelector('.sbg');if(!img||!img.naturalWidth)return;
    const s=+st.dataset.s||1,over=img.naturalWidth*(st.offsetHeight/img.naturalHeight)-st.offsetWidth;if(over<=0)return;
    SUI.bgx=clamp(sb-(e.clientX-sx)/s/over*100);img.style.objectPosition=SUI.bgx+'% 50%';});
  const up=()=>{sx=null};box.addEventListener('pointerup',up);box.addEventListener('pointercancel',up);box.addEventListener('pointerleave',up);
})();
// 自由行動：拖地圖／房間（電腦上下、手機左右；超過 6px 才算拖，放開後那一下點擊不算）
(()=>{const box=$('ovStory');let s=null;
  box.addEventListener('pointerdown',e=>{const m=e.target.closest('.sfmap');if(!m||e.target.closest('button')||!STRUN||!STRUN.free)return;
    const F=STRUN.free;s={x:e.clientX,y:e.clientY,o:{...F.off[F.scr]},m,moved:false}});
  box.addEventListener('pointermove',e=>{if(!s)return;const st=box.querySelector('.sstage'),k=+st.dataset.s||1,F=STRUN&&STRUN.free;if(!F)return;
    const dx=(e.clientX-s.x)/k,dy=(e.clientY-s.y)/k;if(!s.moved&&Math.hypot(dx,dy)<6)return;s.moved=true;
    const o={x:clamp(s.o.x+dx,st.offsetWidth-s.m.offsetWidth,0),y:clamp(s.o.y+dy,st.offsetHeight-s.m.offsetHeight,0)};F.off[F.scr]=o;s.m.style.transform=`translate(${o.x}px,${o.y}px)`});
  const up=()=>{if(s&&s.moved)ST_FDRAG=true;s=null;setTimeout(()=>{ST_FDRAG=false},0)};box.addEventListener('pointerup',up);box.addEventListener('pointercancel',up);
})();
// 舞台不能被捲動（點到畫面外的名牌時，瀏覽器會自己把 overflow:hidden 的框捲過去）
$('ovStory').addEventListener('scroll',e=>{const t=e.target;if((t.id==='ovStory'||(t.classList&&t.classList.contains('sstage')))&&(t.scrollTop||t.scrollLeft)){t.scrollTop=0;t.scrollLeft=0}},true);   // 只管外框和舞台，裡面的清單照常捲
// 第 0 日的入口按鈕
$('bStory').onclick=storyOpen;
;
/* ==== js/flow.js ==== */
// ===== 流程：開場故事＋簽名（只看一次）、第 0 日（沒有小球的日常畫面）、接取新委託、設定、交還給異生協會 =====
// 沒有小球時 S 是 null，畫面只顯示空水缸與「接取新委託」；接取後 newGame() 才開始第 1 日。

// ---------- 選代表色的元件（開場簽名、設定共用）：左 4×3 色票（最後一格自訂），右邊用這個顏色顯示名字 ----------
function colorWidget(get,set,nameOf){
  const wrap=h('div',{class:'cmid cw'}),grid=h('div',{class:'sgrid'}),sample=h('span',{class:'csample'}),fr=h('div',{class:'cpv cwv'},sample);
  const repaint=()=>{
    grid.querySelectorAll('.sw1').forEach(b=>b.classList.toggle('sel',b.dataset.c===get()));
    sample.textContent=nameOf()||TEXT.misc.defPlayer;paintName(sample,get());
  };
  const pick_=c=>{if(c){set(c);repaint()}};
  COLORS.forEach((c,i)=>grid.append(h('button',{class:'sw1',style:'background:'+c,'data-c':c,title:CNAME[i],'aria-label':CNAME[i],onclick:()=>pick_(c)})));
  const cp=h('input',{type:'color',value:get(),'aria-label':TEXT.misc.customColor,title:TEXT.misc.customColor});
  cp.oninput=()=>pick_(parseColor(cp.value));
  grid.append(h('label',{class:'scust'},cp,h('span',{},TEXT.misc.custom)));
  wrap.append(grid,h('div',{class:'cfr'},fr));
  const fit=()=>{const n=grid.offsetHeight;if(n>0){fr.style.width=fr.style.height=n+'px'}};
  setTimeout(fit,0);setTimeout(fit,100);setTimeout(fit,400);
  wrap.repaint=repaint;repaint();
  return wrap;
}

// ---------- 開場故事（沒看過才會出現）----------
let introCol=null;
function introOpen(){
  const T=TEXT.intro;
  $('introStory').textContent='';
  T.story.forEach(t=>$('introStory').append(h('p',{class:t.startsWith('「')?'q':''},t)));
  $('pn').value=META.pname||'';selColor=META.pcol||selColor;
  $('introCol').textContent='';
  introCol=colorWidget(()=>selColor,c=>{selColor=c},()=>$('pn').value.trim());
  $('introCol').append(introCol);
  $('pn').oninput=()=>introCol.repaint();
  $('ovStart').classList.add('show');
}
$('go').onclick=()=>{
  META.pname=($('pn').value.trim()||TEXT.misc.defPlayer).slice(0,8);META.pcol=selColor;META.intro=true;codexSave();
  $('ovStart').classList.remove('show');
  toIdle();
};

// ---------- 第 0 日：沒有小球 ----------
function toIdle(){
  gameStop();
  S=null;GUESTS=[];M=null;SN=null;EM=null;pokes=[];
  document.body.classList.add('idle');
  ['ovEnd','ovPick','ovBag'].forEach(i=>$(i).classList.remove('show'));
  $('day').textContent=fmt(TEXT.misc.dayLabel,{d:0});$('pips').innerHTML='';
  $('cname').textContent='';paintName($('cname'),'');
  $('pname').textContent=META.pname||'';paintName($('pname'),META.pcol||'');
  $('wq').hidden=true;
  $('log').innerHTML='';say(TEXT.idle.msg,'sys');
  $('bStory').hidden=!(META.urgent&&META.doll);   // v0.40：長相登記過才有主線
}
// 接取新委託：取名字後，小球出現並進入第 1 日
function acceptOpen(){
  const inp=h('input',{type:'text',maxLength:8,value:TEXT.misc.defLarva,'aria-label':TEXT.idle.nameLabel});
  pick(TEXT.idle.accept,[{node:h('div',{class:'acc'},h('label',{},TEXT.idle.nameLabel),inp)},{id:'ok',label:TEXT.idle.ok,main:true}],()=>{
    newGame(META.pname||TEXT.misc.defPlayer,inp.value.trim()||TEXT.misc.defLarva,META.pcol||selColor);
  },META.special?TEXT.special.accept:TEXT.idle.acceptBody);
}
$('bAccept').onclick=acceptOpen;
// 等待新委託：完成一輪（＋1），回到第 0 日，再看畢業小球有沒有寄信來
$('again').onclick=()=>{META.rounds++;if(S&&S.special&&!PV)META.specialDone=(META.specialDone||0)+1;codexSave();toIdle();letterCheck()};

// ---------- 設定：暱稱、代表色、外出方式（隨時可改）。在 ☰「設定與存檔」頁的上半部 ----------
// v0.35：暱稱、代表色搬到「玩家設定」頁（playerBuild）
function settingsBuild(){
  const b=$('setBody');b.textContent='';
  const mode=m=>h('label',{class:'mrow'},h('input',{type:'radio',name:'outMode',value:m[0],checked:META.outMode===m[0],disabled:!!m[2],onchange:()=>{META.outMode=m[0];codexSave();outChip()}}),' '+m[1]);
  const U=TEXT.ui;
  b.append(h('label',{class:'sl'},U.outMode),mode(['random',U.outRandom]),mode(['map',U.outMap]),
    h('hr',{class:'div'}),h('label',{class:'sl'},TEXT.game.modeHead),
    ...[['quick',TEXT.game.modeQuick],['play',TEXT.game.modePlay]].map(m=>h('label',{class:'mrow'},h('input',{type:'radio',name:'playMode',value:m[0],checked:META.playMode===m[0],onchange:()=>{META.playMode=m[0];codexSave();playChip()}}),' '+m[1])),
    h('hr',{class:'div'}),h('label',{class:'sl'},U.letterMode),
    ...[['popup',U.letterPopup],['log',U.letterLog]].map(m=>h('label',{class:'mrow'},h('input',{type:'radio',name:'letterMode',value:m[0],checked:META.letterMode===m[0],onchange:()=>{META.letterMode=m[0];codexSave()}}),' '+m[1])));
}
const settingsOpen=()=>openMenu('save','secSet');

// ---------- 玩家設定（☰「玩家設定」，v0.35）：上面是紙娃娃＋名牌；頁籤切換「長相」｜「名字」（v0.4 會加專屬小球）----------
let PL_TAB='look',PL_WT='top';
// v0.40.43：還沒登記長相＝只有「名字」頁籤；登記後「長相」＝衣櫃（和主線收納共用 js/wardrobe.js），預覽上方「更改長相」開長相登記
function playerBuild(){
  const P=TEXT.player,U=TEXT.ui,tabs=$('plTabs'),b=$('plBody'),pg=$('pg_player'),sy=pg?pg.scrollTop:0;
  tabs.textContent='';b.textContent='';
  const keys=Object.keys(P.tabs).filter(k=>k!=='look'||META.doll);if(!keys.includes(PL_TAB))PL_TAB=keys[0];
  keys.forEach(k=>tabs.append(h('button',{class:PL_TAB===k?'on':'',onclick:()=>{PL_TAB=k;playerBuild()}},P.tabs[k])));
  tabs.hidden=keys.length<2;
  // 紙娃娃：正方形框、角色置中、右下名牌（主線收納的預覽也是這樣）
  const cv=h('canvas',{class:'plcv',width:DOLL_W*DOLL_K,height:DOLL_H*DOLL_K,'aria-label':TEXT.doll.preview});
  const tag=h('span',{class:'dname'},META.pname||TEXT.misc.defPlayer);paintName(tag,META.pcol||'');
  const fig=h('div',{class:'plfig'+(META.doll?'':' none')},cv,tag);
  const side=h('div',{class:'plside'});
  if(PL_TAB==='look'&&META.doll){
    const ward=h('div',{class:'plward'});ward.innerHTML=wardHTML(PL_WT);
    ward.onclick=e=>{const t=e.target.closest(WARD_SEL);if(t&&wardClick(t,v=>{PL_WT=v}))playerBuild()};
    ward.onchange=e=>{if(wardChange(e.target))playerBuild()};
    b.append(h('div',{class:'plcard plcloset'},h('div',{class:'plleft'},h('button',{class:'main pledit',onclick:()=>dollOpen({done:ok=>{if(ok)playerBuild()}})},P.edit),fig),ward));
    dollLoad().then(()=>{if(cv.isConnected){dollPaint(cv,META.doll,'');wardPaint(ward)}});
    if(pg)pg.scrollTop=sy;return;
  }
  if(META.doll)dollLoad().then(()=>{if(cv.isConnected)dollPaint(cv,META.doll,'')});
  b.append(META.doll?h('div',{class:'plcard'},fig,side):h('div',{class:'plcard nodoll'},side));   // 還沒登記：只有名字
  const nm_=h('input',{type:'text',maxLength:8,value:META.pname||'','aria-label':TEXT.misc.nick});
  const col=colorWidget(()=>META.pcol||selColor,c=>{META.pcol=c;selColor=c;if(S)S.col=c;paintName($('pname'),c);paintName(tag,c);if(S)refresh();codexSave()},()=>nm_.value.trim()||META.pname);
  nm_.oninput=()=>{col.repaint();tag.textContent=nm_.value.trim()||TEXT.misc.defPlayer};
  nm_.onchange=()=>{const v=(nm_.value.trim()||TEXT.misc.defPlayer).slice(0,8);META.pname=v;if(S)S.pname=v;$('pname').textContent=v;tag.textContent=v;col.repaint();codexSave()};
  side.append(h('label',{class:'sl'},U.nick),nm_,h('p',{class:'dim'},P.nameHint));
  b.append(h('hr',{class:'div'}),h('label',{class:'sl'},U.color),col);
}
$('bSet').onclick=settingsOpen;
function prefillPlayer(){if(introCol&&$('ovStart').classList.contains('show')){$('pn').value=META.pname||'';selColor=META.pcol||selColor;introCol.repaint()}}

// 交還可得的積分＝基本分＋每個標籤的加分（標籤用小球真正擁有的，沒發現的也算；數值在 js/data/assoc.js）
const assocPts=e=>ASSOC.returnPts+(e.own||[]).reduce((n,t)=>n+(ASSOC.tagPts[t]||0),0);

// ---------- 交還給異生協會：小球離開圖鑑換積分（收藏進度、回歸者名額會保留）----------
function assocReturn(e){
  const G=META.got;
  if(!G.end.includes(e.end))G.end.push(e.end);
  if(!G.temper.includes(e.temp))G.temper.push(e.temp);
  e.tags.forEach(t=>{if(!G.tag.includes(t))G.tag.push(t)});
  if(e.own.includes('homereturn'))META.homeUsed++;
  const pts=assocPts(e);META.points+=pts;
  META.returned.push({id:e.id,name:e.name,at:e.at,back:new Date().toISOString().slice(0,10),gift:false,   // gift：寄過信紙了沒（每隻只寄一次，js/letters.js）
    temp:e.temp,own:e.own,pg:e.pg,pt:e.pt,end:e.end,rnd:META.rounds+(S&&!PV?1:0),
    look:{col:e.col,hue:e.hue,colored:e.colored,tc:e.tc,tb:e.tb,tb2:e.tb2,tbm:e.tbm,tbs:e.tbs,day:e.day}});   // look：外觀（之後大樓背景可能出現寄過信的小球）
  CODEX=CODEX.filter(x=>x!==e);GUEST_IDS=GUEST_IDS.filter(x=>x!==e.id);
  if(typeof WATCH_IDS!=='undefined'){WATCH_IDS=WATCH_IDS.filter(x=>x!==e.id);watchSave()}
  codexSave();
  if(S)syncGuests(false);
  return fmt(TEXT.assoc.done,{pts,name:e.name});
}

// ---------- 啟動 ----------
selColor=META.pcol||selColor;
if(META.intro)toIdle();else introOpen();
;
/* ==== js/main.js ==== */
// ===== 啟動：按鈕事件綁定、開局選色、開始與重新開始、說明／圖鑑選單 =====
// ---------- 遊戲指令按鈕（用 () => 包起來，確保點下去時才呼叫）----------
$('bWater').onclick=()=>actWater();$('bFeed').onclick=()=>actFeed();$('bPlay').onclick=()=>actPlay();$('bChat').onclick=()=>chatOpen();
$('bOut').onclick=()=>goOut();$('bBag').onclick=()=>actBag();
// 結束今日：第一次按先變成「再按一次」，4 秒內再按才真的換日（不跳視窗）
(()=>{let armed=0,tm=null;const b=$('end');
  const reset=()=>{armed=0;clearTimeout(tm);b.textContent=TEXT.ui.end;b.classList.remove('arm')};
  b.onclick=()=>{
    if(!armed){armed=1;b.textContent=S.ap>0?fmt(TEXT.misc.endArmAp,{n:S.ap}):TEXT.misc.endArm;b.classList.add('arm');tm=setTimeout(reset,4000);return}
    reset();gameStop();settle();
  };
})();
// 格蕾特小助手與翻譯開關
$('bGrete').onclick=()=>{S.grete=!S.grete;if(!S.grete)S.trans=false;say(S.grete?TEXT.grete.on:TEXT.grete.off,'ev');refresh();if(S.grete)greteDaily()};
$('bTrans').onclick=()=>{S.trans=!S.trans;say(S.trans?TEXT.grete.transOn:TEXT.grete.transOff,'ev');refresh()};

// ---------- 說明／圖鑑選單（三頁：說明與存檔、收藏、小球們）----------
if(typeof ABOUT_HTML!=='undefined'){$('aboutBody').innerHTML=ABOUT_HTML;   // 說明頁上面一排標籤（h3 的 data-tag）：點了捲到那一段（v0.40.69）
  const ab=$('aboutBody'),tg=$('aboutTags');ab.querySelectorAll('h3[data-tag]').forEach(h3=>{const b=h('button',{type:'button'},h3.dataset.tag);b.onclick=()=>{ab.scrollTop+=h3.getBoundingClientRect().top-ab.getBoundingClientRect().top-4};tg.append(b)})}
if(typeof NEWS_HTML!=='undefined')$('newsBody').innerHTML=NEWS_HTML;
$('bMenu').onclick=()=>openMenu('larvae');
$('again').textContent=TEXT.idle.wait;
$('eLarvae').onclick=()=>openMenu('larvae');
$('menuClose').onclick=()=>$('ovMenu').classList.remove('show');
$('dressClose').onclick=dressClose;
document.addEventListener('keydown',e=>{if(e.key==='Escape')['ovMenu','ovPick','ovBag','ovWatch'].forEach(i=>$(i).classList.remove('show'))});
$('cDown').onclick=()=>codexDownload('daily');$('cDownS').onclick=()=>codexDownload('story');
$('cMode').querySelectorAll('button').forEach(b=>b.onclick=()=>{SAVE_MODE=b.dataset.m;$('cMode').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))});
$('cUp').onchange=e=>{const f=e.target.files[0];if(f&&f.size<=20*1024*1024)f.text().then(codexImport);e.target.value=''};   // 存檔檔案上限 20MB（資安 v0.40.40）
$('cImport').onclick=()=>codexImport($('saveText').value);
$('ver').textContent='v'+VERSION;
// 清除存檔：第一次按先變成「再按一次確認」，4 秒內再按才真的清除
(()=>{let t=0,tm=null;const b=$('cWipe');
  const reset=()=>{t=0;b.textContent=TEXT.misc.wipe;b.className='danger'};
  b.onclick=()=>{
    if(!t){t=1;b.textContent=TEXT.misc.wipeArm;b.className='danger arm';tm=setTimeout(reset,4000);return}
    clearTimeout(tm);reset();codexWipe();
  };
})();
;
/* ==== js/preview.js ==== */
// ===== 觀察水缸模式：沒有換日、和日常模式完全隔開的獨立空間，只看小球們互動、每隻都能戳 =====
// 做法：暫時把 S（遊戲狀態）換成一份空白的假狀態，玩家養的那隻（C）不參與（PV 為 true 時各處都會略過 C），
// 選到的小球（最多 5 隻，來自圖鑑）全部當成 GUESTS 放進水缸。離開時把原本的 S、C、同伴、訊息區、水缸大小全部還原。
// 選擇名單另外存（WATCH_KEY），和說明／圖鑑裡的「放入水缸」勾選互不影響。水缸寬 750×500，背景 assets/larva/bg_preview.png。
const PV_TXT=TEXT.pv;                              // 文字在 js/data/texts.js 的 TEXT.pv
const WATCH_KEY='xenolarva.watch.v1',WATCH_MAX=5;
let WATCH_IDS=[];try{WATCH_IDS=JSON.parse(localStorage.getItem(WATCH_KEY)||'[]').map(String)}catch(e){}
const watchSave=()=>{try{localStorage.setItem(WATCH_KEY,JSON.stringify(WATCH_IDS))}catch(e){}};
let PVS=null;                                    // 進入前的狀態備份
const pvList=()=>CODEX.filter(e=>e.end!=='END-07'&&!e.hide);
const watchEntries=()=>WATCH_IDS.map(findLarva).filter(e=>e&&e.end!=='END-07'&&!e.hide).slice(0,WATCH_MAX);

function setWorld(w){
  const k=w/WORLD.w;
  BUB.forEach(b=>{b.x*=k});
  WORLD.w=w;WORLD.dx=(w-500)/2;WALL.r=w-40;
  cv.width=w*CVK;cv.height=500*CVK;cx.setTransform(CVK,0,0,CVK,0,0);cv.style.aspectRatio=w+'/500';cx.imageSmoothingEnabled=false;
}
// 空白的假狀態：只要讓畫面與移動規則讀得到欄位
const pvState=trans=>({day:1,ap:0,life:90,sat:60,dirt:0,ph:7,trust:60,pname:'',name:'',col:'#ffffff',hue:0,colored:false,over:null,temp:'curious',inv:{},
  found:{gift:true,toy:true},tags:[],tagsFound:[],playedToday:false,noPlay:0,touchGain:9,grete:true,trans:!!trans,preview:true});

function pvBar(){
  const n=watchEntries().length,on=!!(S&&S.trans),t=$('pvTrans');
  $('pvSel').textContent=fmt(PV_TXT.sel,{n,max:WATCH_MAX});
  t.className='tog'+(on?' on':'');t.setAttribute('aria-pressed',String(on));t.textContent=fmt(PV_TXT.trans,{s:on?PV_TXT.on:PV_TXT.off});t.title=PV_TXT.transTitle;
}
// 依選擇更新水缸：新選的飄進來、取消的飄出去
function pvApply(announce){
  const want=watchEntries();
  GUESTS.forEach(g=>{
    if(g.phase!=='out'&&!want.some(e=>e.id===g.e.id)){leaveGuest(g);if(announce)say(fmt(PV_TXT.leave,{name:g.name}),'sys')}
  });
  want.forEach(e=>{
    if(!GUESTS.some(g=>g.e.id===e.id&&g.phase!=='out')){GUESTS.push(makeGuest(e));if(announce)say(fmt(PV_TXT.join,{name:e.name}),'sys')}
  });
  pvBar();
}
// ---------- 選擇小球的彈窗（內容和「小球們」一頁相同，勾選另外存）----------
function watchRow(e){
  const c=h('canvas',{width:96,height:96});thumb(c,e);
  const on=WATCH_IDS.includes(e.id);
  const mid=h('div',{class:'lmid'},h('div',{class:'nrow'},h('strong',{class:'nm'},e.name)),
    h('div',{},ENDS[e.end][0],' ｜ ',tipSpan(e.temp)),
    ...rowInfo(e),
    h('div',{class:'dim'},fmt(TEXT.misc.rowLike,{g:NAME[e.pg],t:NAME[e.pt]})));
  const act=h('div',{class:'lact'},h('button',{class:'ib'+(on?' on':''),'aria-pressed':String(on),onclick:()=>watchToggle(e.id,!on)},on?PV_TXT.watchOff:PV_TXT.watchOn));
  return h('div',{class:'lrow'},c,mid,act);
}
function watchRender(){
  const box=$('wlist');box.textContent='';
  const list=[...pvList()].reverse().sort((a,b)=>(b.star?1:0)-(a.star?1:0));
  $('wstat').textContent=fmt(PV_TXT.stat,{n:watchEntries().length,max:WATCH_MAX});
  if(!list.length)box.append(h('p',{class:'dim'},PV_TXT.noList));
  list.forEach(e=>box.append(watchRow(e)));
}
function watchToggle(id,on){
  WATCH_IDS=WATCH_IDS.filter(x=>x!==id);if(on)WATCH_IDS.push(id);
  WATCH_IDS=WATCH_IDS.filter(x=>findLarva(x)).slice(-WATCH_MAX);watchSave();
  watchRender();if(PV)pvApply(true);
}
function watchOpen(){const b=$('wlist');watchRender();$('ovWatch').classList.add('show')}

function pvEnter(){
  if(!IMG.bg_preview){const im=new Image();im.src=ASSETS.bg_preview||BASE+'bg_preview.png';IMG.bg_preview=im}   // 第一次進來才讀背景（v0.40.69）
  if(PV||$('ovEnd').classList.contains('show'))return;        // 結局框開著時不進來（避免在觀察水缸裡結束這一輪）
  if(!pvList().length){toast(PV_TXT.noList);return}
  ['ovMenu','ovPick','ovBag'].forEach(i=>$(i).classList.remove('show'));$('devp').hidden=true;
  PVS={S,C:Object.assign({},C),GUESTS,M,pokes,SN,EM,log:$('log').innerHTML,start:$('ovStart').classList.contains('show')};
  gameStop();PV=true;S=pvState(false);GUESTS=[];M=null;pokes=[];SN=null;EM=null;
  $('ovStart').classList.remove('show');
  document.body.classList.add('pv');$('pvbar').hidden=false;
  setWorld(750);
  $('log').innerHTML='';
  WATCH_IDS=WATCH_IDS.filter(x=>findLarva(x)).slice(-WATCH_MAX);
  pvApply(false);
  say(watchEntries().length?PV_TXT.hi:PV_TXT.none,'sys');
  if(!watchEntries().length)watchOpen();
}
function pvExit(){
  if(!PV)return;
  const B=PVS;gameStop();PV=false;PVS=null;
  $('ovWatch').classList.remove('show');
  document.body.classList.remove('pv');$('pvbar').hidden=true;
  setWorld(500);
  S=B.S;Object.assign(C,B.C);GUESTS=B.GUESTS;M=B.M;pokes=B.pokes;SN=B.SN;EM=B.EM;
  GUESTS.forEach(g=>{if(g.x>WALL.r+10)g.x=WALL.r-10});
  tagsReset();
  $('log').innerHTML=B.log;$('log').scrollTop=1e9;
  if(B.start)$('ovStart').classList.add('show');
  if(S)refresh();
}
// 點到哪一隻就戳哪一隻（重疊時取最近的）
function pvPoke(x,y){
  const t=performance.now();let best=null,bd=1e9;
  GUESTS.forEach(b=>{
    if(!isLive(b))return;
    const dx=Math.abs(x-b.x),dy=Math.abs(y-(b.y-6));
    if(dx<52&&dy<52&&dx+dy<bd){bd=dx+dy;best=b}
  });
  if(!best||!pokeGuest(best,t,x,y))return;
  if(S.trans){
    const vl=voiceLine({temp:best.e.temp,tags:best.e.own,found:best.e.own,sat:60,dirt:20,life:90,trust:60,self:best});
    say(withLarva(nm(best.name)+'\n'+vl,nm(best.name)),vl===TEXT.grete.nothing?'ev':'voice');
  }
}
$('pvSel').onclick=watchOpen;
$('watchClose').onclick=()=>$('ovWatch').classList.remove('show');
$('pvTrans').onclick=()=>{S.trans=!S.trans;say(S.trans?PV_TXT.transOn:PV_TXT.transOff,'sys');pvBar()};
$('pvExit').onclick=pvExit;
// 觀察水缸的「玩耍」：五種玩具都能玩（不用持有、不耗什麼、不影響日常），一定是「遊玩」方式
const PV_TOYS=['bubble','bell','ball','wand','bucket'];
function pvPlay(){
  if(!GUESTS.some(g=>g.phase!=='out')){toast(PV_TXT.none);return}
  pick(TEXT.play.pick,[{head:TEXT.play.toyHead},...PV_TOYS.map(t=>({id:t,label:NAME[t]}))],t=>gameStart(t),TEXT.play.pvHead);
}
$('pvPlay').onclick=pvPlay;
$('bWatch').onclick=pvEnter;
;
/* ==== js/dev.js ==== */
// ===== 開發者測試模式 =====
// 開啟方式：網址加 ?dev=1，或在畫面上連點畫面左上的版本號 5 次。
// 開啟後「結束今日」下方會出現「開發者模式」按鈕，打開浮動面板，可以直接指定目前這隻的個性、標籤與顏色。
// 這裡只動目前周目的狀態，不會寫進存檔設定；要拿掉這個功能，刪掉這個檔案與 index.html 的對應行即可。
function devUnlock(){$('bDev').hidden=false}
try{if(/[?&]dev=1(&|$)/.test(location.search))devUnlock()}catch(e){}
(()=>{let n=0,tm=null;
  $('ver').addEventListener('click',()=>{
    n++;clearTimeout(tm);tm=setTimeout(()=>{n=0},2500);       // 2.5 秒內連點 5 次
    if(n>=5){n=0;devUnlock()}
  });
})();

function devBuild(){
  const p=$('devp');p.textContent='';
  const close=h('button',{'aria-label':'關閉',onclick:()=>{p.hidden=true}},'✕');
  p.append(h('h4',{},'開發者模式',close));
  // 信紙測試：用一隻假的畢業小球（或最近交還的那隻）馬上寄一封；會照常存進收藏（可以取消勾選）
  const fake=()=>{const r=META.returned[META.returned.length-1];
    return r?{...r,rnd:Math.min(r.rnd||0,META.rounds-1)}:{name:'測試球',temp:R(TEMPER_IDS),own:[R(Object.keys(TAGS))],pg:R(GIFTS),pt:R(TOYS),end:R(Object.keys(ENDS).slice(0,6)),rnd:META.rounds-3}};
  p.append(h('div',{class:'dg'},h('label',{},'信紙（畢業小球）'),
    ...[['normal','一般'],['young','未滿兩個月'],['farewell','離開前轉述']].map(([k,t])=>h('button',{onclick:()=>letterShow(letterMake(fake(),k),true)},t)),
    h('div',{class:'dim'},`可寄信的畢業小球：${letterCands().length} 隻｜已完成 ${META.rounds} 輪`)));
  p.append(h('div',{class:'dg'},h('label',{},'主線劇情'),h('button',{onclick:()=>{p.hidden=true;stPvMenu()}},'劇情預覽（一段一段播）')));
  // 裝扮：全部拿到／全部拿掉（拿掉時，正在戴的也一起脫下）
  p.append(h('div',{class:'dg'},h('label',{},`裝扮（有 ${META.wears.length}／${Object.keys(WEARS).length} 種）`),
    h('button',{onclick:()=>{META.wears=Object.keys(WEARS);codexSave();refresh();devBuild()}},'取得全部裝扮'),
    h('button',{onclick:()=>{META.wears=[];if(S)S.wear='';CODEX.forEach(e=>{e.wear=''});codexSave();refresh();devBuild()}},'刪除全部裝扮')));
  if(!S){p.append(h('p',{class:'dim'},'先開始一局，這裡才能改目前的小球。'));return}
  // 個性
  const sel=h('select',{'aria-label':'個性'},...TEMPER_IDS.map(id=>h('option',{value:id,selected:id===S.temp},TEXT.temper[id].name)));
  sel.onchange=()=>{S.temp=sel.value;C.steering=false;C.next=0;M=null;C.home=pickHome();refresh()};
  p.append(h('div',{class:'dg'},h('label',{},'個性'),sel));
  // 標籤
  const tg=h('div',{class:'dt'});
  Object.keys(TAGS).forEach(id=>{
    const cb=h('input',{type:'checkbox',checked:S.tags.includes(id)});
    cb.onchange=()=>{
      S.tags=S.tags.filter(x=>x!==id);if(cb.checked)S.tags.push(id);
      S.tagsFound=S.tagsFound.filter(x=>S.tags.includes(x));refresh();
    };
    tg.append(h('label',{},cb,' '+TEXT.tags[id].name+(TAGS[id].off?'（停用）':'')));
  });
  p.append(h('div',{class:'dg'},h('label',{},'標籤（勾選＝擁有，效果立即生效）'),tg,
    h('button',{onclick:()=>{S.tags.forEach(id=>discoverTag(id))}},'揭曉全部（看提示框）'),
    h('button',{onclick:()=>{S.tagsFound=[];refresh()}},'全部設為未發現')));
  // 圖鑑：每種個性各一隻（覆蓋現有圖鑑，用來測試小球之間的互動）
  const give=h('button',{},'取得每種個性各一隻（覆蓋圖鑑）');let armed=0;
  give.onclick=()=>{
    if(!armed){armed=1;give.textContent='再按一次確認：會覆蓋現有圖鑑';setTimeout(()=>{armed=0;give.textContent='取得每種個性各一隻（覆蓋圖鑑）'},4000);return}
    armed=0;devGiveAll();give.textContent='已覆蓋：前 3 隻放進水缸';
  };
  const rev=h('button',{},REVEAL?'還原收藏顯示':'揭曉所有圖鑑資料');
  rev.onclick=()=>{REVEAL=!REVEAL;rev.textContent=REVEAL?'還原收藏顯示':'揭曉所有圖鑑資料'};
  p.append(h('div',{class:'dg'},h('label',{},'圖鑑測試資料'),give,rev));
  // 水質、飽食（拖動立刻生效）
  const sl=(label,get,set,min,max,step)=>{
    const out=h('span',{},String(get()));
    const r=h('input',{type:'range',min,max,step,value:get(),'aria-label':label});
    r.oninput=()=>{set(+r.value);out.textContent=r.value;refresh()};
    return h('div',{},h('label',{},label+'：',out),r)};
  p.append(h('div',{class:'dg'},
    sl('污染（0 乾淨～100 很髒）',()=>Math.round(S.dirt),v=>{S.dirt=v},0,100,1),
    sl('酸鹼度 pH（7 為中性）',()=>+S.ph.toFixed(1),v=>{S.ph=v},4,10,.1),
    sl('飽食（0 很餓～100 很飽）',()=>Math.round(S.sat),v=>{S.sat=v},0,100,1)));
  // 物品：一鍵補齊／清空
  const setInv=(keys,n)=>{keys.forEach(k=>{S.inv[k]=n});refresh()};
  p.append(h('div',{class:'dg'},h('label',{},'物品'),
    h('button',{onclick:()=>setInv(FOODS,9)},'補齊食物'),h('button',{onclick:()=>setInv(FOODS,0)},'清空食物'),
    h('button',{onclick:()=>setInv(['agent'],9)},'補齊換水劑'),h('button',{onclick:()=>setInv(['agent'],0)},'清空換水劑')));
  // 格蕾特（事件與解鎖）
  const rs=()=>{if(S){S.grete=false;S.trans=false;S.tc=S.tb=S.tb2=S.tbm='';S.chatC=[];S.chatB=[];S.chatB2=[]}META.greteMet=META.grete=META.chatColor=META.chatDual=false;META.chatWins=0;codexSave();refresh()};
  p.append(h('div',{class:'dg'},h('label',{},'格蕾特'),
    h('button',{onclick:()=>{p.hidden=true;runEvent('greteMeet')}},'遇見格蕾特（跑事件並解鎖小助手）'),
    h('button',{onclick:()=>{META.chatColor=true;codexSave();refresh()}},'開啟染色'),
    h('button',{onclick:()=>{META.chatColor=true;META.chatDual=true;META.chatWins=Math.max(1,META.chatWins);codexSave();refresh()}},'開啟雙色'),
    h('button',{onclick:()=>{['magV','magH'].forEach(k=>{if(!META.tools.includes(k))META.tools.push(k)});codexSave();refresh()}},'雜誌全拿'),
    h('button',{onclick:rs},'全部格蕾特事件重置')));
  // 禮物與偷偷七逃
  p.append(h('div',{class:'dg'},h('label',{},'禮物／偷偷七逃'),
    h('button',{onclick:()=>giveSouv(TEMPER_SOUV[S.temp])},'收到這隻個性的禮物'),
    h('button',{onclick:()=>{const k=Object.keys(TAG_SOUV).find(t=>S.tags.includes(t));if(k)giveSouv(TAG_SOUV[k]);else say('這隻沒有標籤禮物可送。','sys')}},'收到標籤禮物'),
    h('button',{onclick:()=>{if(!S.tags.includes('sneak')){S.tags.push('sneak')}sneakDaily(true)}},'觸發偷偷七逃（補上標籤）')));
  // 顏色
  const hex=h('input',{type:'text',value:S.col,'aria-label':'代表色'});
  const col=h('input',{type:'color',value:parseColor(S.col)||'#58a6ff','aria-label':'選色'});
  const setCol=v=>{const c=parseColor(v);if(!c)return;S.col=c;hex.value=c;col.value=c;paintName($('pname'),c);refresh()};
  hex.onchange=()=>setCol(hex.value);col.oninput=()=>setCol(col.value);
  const colored=h('input',{type:'checkbox',checked:!!S.colored});
  colored.onchange=()=>{S.colored=colored.checked;refresh()};
  const hue=h('input',{type:'range',min:0,max:359,value:S.hue,'aria-label':'核心色相'});
  hue.oninput=()=>{S.hue=+hue.value};
  p.append(h('div',{class:'dg'},h('label',{},'玩家代表色（色碼或選色）'),hex,col,
    h('label',{},colored,' 核心已染上代表色'),h('label',{},'核心色相（未染色時）'),hue));
}
$('bDev').onclick=()=>{const p=$('devp');if(p.hidden){devBuild();p.hidden=false}else p.hidden=true};

// 圖鑑換成「每種個性各一隻」的測試資料（顏色各不同、都活著），前 3 隻直接放進水缸
function devGiveAll(){
  CODEX=TEMPER_IDS.map((id,i)=>codexNorm({id:'dev-'+id,name:TEXT.temper[id].name+'球',pname:META.pname||'測試',col:COLORS[i%COLORS.length],
    hue:i*55,colored:i%2===0,day:7,temp:id,end:'END-02',pg:GIFTS[i%3],pt:TOYS[i%3],at:new Date().toISOString().slice(0,10)}));
  GUEST_IDS=CODEX.slice(0,3).map(e=>e.id);
  codexSave();if(S)syncGuests(true);
}
;
/* ==== js/layout.js ==== */
// ===== 版面：右上角 ☰ 選單（電腦、手機都有）、設定與存檔的跳段按鈕、手機版底部固定的行動區 =====
// 樣式在 css/style.css 最後一段；文字在 TEXT.layout。

// ---------- ☰ 選單：順序與文字在 TEXT.layout.ham（版本號在左上角，連點 5 次＝開發者模式）----------
const HAM_DO={watch:()=>pvEnter()};
function hamClose(){$('hamMenu').hidden=true;$('bHam').setAttribute('aria-expanded','false')}
function hamOpen(){
  const m=$('hamMenu');m.textContent='';
  const who=h('div',{class:'hwho'},META.pname||'');paintName(who,META.pcol||'');
  m.append(who,...TEXT.layout.ham.map(([k,label])=>h('button',{onclick:()=>{hamClose();(HAM_DO[k]||(()=>openMenu(k)))()}},label)));
  m.hidden=false;$('bHam').setAttribute('aria-expanded','true');
}
$('bHam').onclick=e=>{e.stopPropagation();$('hamMenu').hidden?hamOpen():hamClose()};
document.addEventListener('click',e=>{if(!$('hamMenu').hidden&&!e.target.closest('#hamMenu'))hamClose()});

// ---------- 「設定與存檔」頁：上方兩顆按鈕＝跳到該段（同一頁捲動），捲動時按鈕跟著亮 ----------
const JUMP_SECS=['secSet','secSave'];
function jumpOn(){
  const pg=$('pg_save'),top=pg.scrollTop+$('saveTabs').offsetHeight+8;
  let cur=JUMP_SECS[0];JUMP_SECS.forEach(id=>{if($(id).offsetTop<=top)cur=id});
  if(pg.scrollTop+pg.clientHeight>=pg.scrollHeight-2)cur=JUMP_SECS[JUMP_SECS.length-1];
  $('saveTabs').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.to===cur));
}
function jumpTo(id,smooth){
  const pg=$('pg_save');
  pg.scrollTo({top:Math.max(0,$(id).offsetTop-$('saveTabs').offsetHeight-6),behavior:smooth?'smooth':'auto'});
  setTimeout(jumpOn,smooth?400:0);
}
// 最後一段至少一頁高，才捲得到最上面；sec＝打開時要跳到的段落
function jumpFit(sec){
  const pg=$('pg_save'),last=$(JUMP_SECS[JUMP_SECS.length-1]);
  last.style.minHeight=Math.max(0,pg.clientHeight-$('saveTabs').offsetHeight-8)+'px';
  if(sec)jumpTo(sec,false);else jumpOn();
}
$('saveTabs').querySelectorAll('button').forEach(b=>{b.onclick=()=>jumpTo(b.dataset.to,true)});
$('pg_save').addEventListener('scroll',jumpOn);

const mobileQ=window.matchMedia?window.matchMedia('(max-width:759px)'):{matches:false};

// ---------- 底部行動區的高度 → CSS 變數 --actsH（主畫面留出空間、水缸依剩下的高度縮放）----------
// 下一格畫面才更新，避免 ResizeObserver 在同一格裡反覆觸發
let actsRaf=0;
function actsFit(){cancelAnimationFrame(actsRaf);actsRaf=requestAnimationFrame(()=>{const a=$('acts');document.documentElement.style.setProperty('--actsH',(mobileQ.matches?a.offsetHeight:0)+'px')})}
if(window.ResizeObserver)new ResizeObserver(actsFit).observe($('acts'));
addEventListener('resize',actsFit);actsFit();
// 開頭的讀取畫面收掉（js/boot.js；這個檔案是最後一個載入的）
if(window.bootDone)bootDone();
;
