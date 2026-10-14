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
