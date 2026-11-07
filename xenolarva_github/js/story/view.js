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
