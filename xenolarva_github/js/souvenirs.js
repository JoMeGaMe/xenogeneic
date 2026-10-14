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
