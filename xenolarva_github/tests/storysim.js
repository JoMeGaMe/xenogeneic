// 主線第一章的玩法模擬（v0.40.62）：node tools/test_harness.js . tests/storysim.js [每種玩法幾次，預設 300]
// 用遊戲本身的規則（stRoll、stDayEvs、stWeekDone、劇情的判定與效果）跑完四週，不開畫面：
//   劇情照「預設路線」走（判定照數值；選項：一半選第一個、一半隨機），效果照常算。
// 印出：每種玩法的結局（過關／健康不夠／負債）、第 4 週結束的平均數值、每段劇情的觸發率；最後列出「所有玩法都很難觸發」的劇情。
(()=>{
const N=+(process.argv.find(a=>/^\d+$/.test(a))||300);
// ---- 不開畫面 ----
stRender=()=>{};stFlash=()=>{};storyAutoSave=()=>{};codexSave=()=>{};stFavPop=()=>{};stPopMsg=()=>{};
let PICK='first',OVER=null,MID=false;
stGameOver=()=>{OVER=OVER||'gameOver'};
// 劇情：照順序播完；判定照數值、選項照 PICK、效果照算（和跳過一樣）
stPlay=(evs,done)=>{for(const ev of evs){if(!ev.tmp)STY.done.push(ev.id);const ls=ev.lines;let i=0,n=0;
    while(i<ls.length&&n++<500){const L=ls[i];
      if(L.who==='cond'){i=stCondJump(ls,i);continue}
      if(L.who==='choice'){let k=i;while(k<ls.length&&ls[k].who==='choice')k++;const c=PICK==='first'?ls[i]:ls[i+Math.floor(Math.random()*(k-i))];
        if(c.eff)stEff(c.eff);i=c.go==='end'?ls.length:c.go?ls.findIndex(l=>l.tag===c.go):k;if(i<0)i=ls.length;continue}
      if(L.eff)stEff(L.eff);
      if(L.go){i=L.go==='end'?ls.length:ls.findIndex(l=>l.tag===L.go);if(i<0)i=ls.length;continue}
      i++}}
  if(done)done()};
const _ce=stChapterEnd;stChapterEnd=()=>{MID=true;_ce()};
// ---- 玩法：每週怎麼排行程（固定日＝換藥水已經填好），空白＝自由行動 ----
const avail=cat=>stPlanIds(cat).filter(id=>!STORY_CMDS[id].fixed);
const freeOpts=()=>{const a=[];for(const k in STORY_MAP){const p=STORY_MAP[k];if(p.do&&stShown(p.do,'free'))a.push(p.do)}
  for(const k in STORY_SCENES.hall.pins){const p=STORY_SCENES.hall.pins[k];if(p.do&&stOpen(p)&&!(p.once&&stDid(p.do)))a.push(p.do)}
  return a.filter(id=>{const c=STORY_CMDS[id];return !(c.eff.money<0&&STRUN.end.money<-c.eff.money)})};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const bestJob=()=>avail('job').sort((a,b)=>(STORY_CMDS[b].eff.money||0)-(STORY_CMDS[a].eff.money||0))[0];
const STYLES={
  照顧為主:{plan:s=>{const care=avail('care');let j=0;return s.map((x,d)=>x||(d===6?'sleep':d===0?bestJob():care[j++%care.length]))},free:()=>null},
  打工為主:{plan:s=>s.map((x,d)=>x||(d===3?'sleep':bestJob()||'sleep')),free:()=>null},
  平衡:{plan:s=>{const care=avail('care');return s.map((x,d)=>x||[care[0],bestJob(),'',care[1]||care[0],bestJob(),'',''][d]||(d===6?'sleep':''))},free:a=>pick(a)},
  外出休閒:{plan:s=>s.map((x,d)=>x||(d===2||d===5?bestJob():d===6?'sleep':'')),free:a=>pick(a)},
  隨機:{plan:s=>{const all=[...avail('care'),...avail('job'),...avail('rest')];return s.map(x=>x||(Math.random()<.25?'':pick(all)))},free:a=>pick(a)},
};
function runOne(style){
  STY=storyNew();SUI.over=false;OVER=null;MID=false;STRUN=null;ST_OVER=false;
  stPlay([...stEvents('start'),...stEvents('weekStart',1)]);
  for(let w=0;w<STORY_RULE.weeks&&!OVER&&!MID;w++){
    SUI.sched=STYLES[style].plan(stFixedFill());
    SUI.sched.forEach(id=>{if(id)stPlay(stEvents('pick',id))});
    const st={...STY.st};st.meds=STY.meds;
    STRUN={i:0,phase:0,still:false,start:{...STY.st},end:st,ids:SUI.sched.map(x=>x||'free'),res:[],tired:false,bgFade:true,skip:false,free:null,met:{}};
    for(let i=0;i<7;i++){const R=STRUN;R.i=i;let x;
      if(R.tired)x=stRoll(R.end,'sleep',true);
      else{let id=R.ids[i];const c=STORY_CMDS[id];
        if(id==='free'||(c&&c.eff.money<0&&R.end.money<-c.eff.money)){id=STYLES[style].free(freeOpts())||'sleep';stPlay(stEvents('first','free'))}
        x=stRoll(R.end,id)}
      R.res[i]=x;R.tired=R.end.fat>=100;
      stPlay(stDayEvs(x,'pre'));stPlay(stDayEvs(x,'post'));}
    stWeekDone();
    if(ST_OVER){OVER='eval'}
  }
  const r=OVER?(STY.debt>=STORY_RULE.debtOver?'負債':'健康不夠'):MID?'過關':'？';
  return {r,st:{...STY.st},done:new Set(STY.done)};
}
const ids=STORY_SCRIPT.filter(e=>e.lines.length).map(e=>e.id),rate={};
for(const style in STYLES){const res=[];
  for(let k=0;k<N;k++){PICK=k%2?'first':'random';res.push(runOne(style))}
  const cnt={};res.forEach(x=>cnt[x.r]=(cnt[x.r]||0)+1);
  const avg=k=>Math.round(res.reduce((a,x)=>a+x.st[k],0)/res.length);
  console.log(`\n【${style}】${N} 次：`+Object.entries(cnt).map(([k,v])=>`${k} ${Math.round(v*100/N)}%`).join('、'));
  console.log('  平均（第 4 週結束或遊戲結束時）：'+['hp','calm','mood','tired','str','soc','know','fat','money'].map(k=>`${stT().S[k]} ${avg(k)}`).join('｜'));
  rate[style]={};ids.forEach(id=>rate[style][id]=res.filter(x=>x.done.has(id)).length/N);
}
console.log('\n劇情觸發率（%）：'+Object.keys(STYLES).join('｜'));
ids.forEach(id=>{const e=STORY_SCRIPT.find(x=>x.id===id);console.log(`  ${id.padEnd(7)}${Object.keys(STYLES).map(s=>String(Math.round(rate[s][id]*100)).padStart(4)).join('')}  ${e.title||String(e.note||'').split('\n')[0].slice(0,24)}`)});
const hard=ids.filter(id=>Object.keys(STYLES).every(s=>rate[s][id]<.1));
console.log('\n所有玩法都 <10% 的劇情：'+(hard.length?hard.join('、'):'沒有'));
process.exit(0);
})();
