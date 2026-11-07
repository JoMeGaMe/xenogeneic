// 舊存檔樣本都要讀得進新版：node tools/test_harness.js . tests/check_fixtures.js
// tests/fixtures/story_*.json＝META.story（主線存檔）的樣本；meta_*.json＝日常存檔的欄位。每一版改存檔欄位時新增一份
(()=>{const fs=require('fs'),dir='tests/fixtures/';let bad=0;
  for(const f of fs.readdirSync(dir).filter(x=>/^story_.*\.json$/.test(x)).sort()){
    const o=JSON.parse(fs.readFileSync(dir+f,'utf8')),n=storyNorm(o),want=o._expect||{};
    const got={week:n&&n.week,money:n&&n.st.money,items:n&&Object.keys(n.items).join(','),seen:n&&n.seen.join(','),run:n&&n.run?n.run.i:null,runRes:n&&n.run?n.run.res.length:null,jobSeen:n&&n.jobSeen?n.jobSeen.join(','):null,debt:n&&n.debt,free:n&&!!n.freeMode,done:n&&n.done.join(',')};
    const miss=Object.keys(want).filter(k=>String(want[k])!==String(got[k]));
    if(!n||miss.length){bad++;console.log('✗',f,miss.map(k=>`${k}: 要 ${want[k]}，讀到 ${got[k]}`).join('；'))}else console.log('✓',f,JSON.stringify(got));
    if(n&&n.run){const ri=n.run.i;STY=n;stResume();if(!stHub()||STRUN.i!==ri){bad++;console.log('✗',f,'接不回這週')}STRUN=null}}
  for(const f of fs.readdirSync(dir).filter(x=>/^meta_.*\.json$/.test(x)).sort()){   // meta_*.json＝整份日常存檔（SAVE_FIELDS 的欄位，v0.40.59 起）
    const o=JSON.parse(fs.readFileSync(dir+f,'utf8')),want=o._expect||{},got={};for(const k in want)got[k]=SAVE_FIELDS[k].read(o);
    const miss=Object.keys(want).filter(k=>String(want[k])!==String(got[k]));
    if(miss.length){bad++;console.log('✗',f,miss.map(k=>`${k}: 要 ${want[k]}，讀到 ${got[k]}`).join('；'))}else console.log('✓',f,JSON.stringify(got))}
  console.log(bad?bad+' 份有問題':'全部讀得進來');process.exit(bad?1:0);})();
