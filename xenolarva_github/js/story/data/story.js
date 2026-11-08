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
  lab:  {cat:'job',at:'hall',open:'f4',need:{know:25},eff:{money:900,know:3,fat:12},kick:{know:25},kickEff:{fat:10},big:'hall_lobby',small:'hall_4f',act:'work',enc:[['yanxiang',1]]},   // v0.40.23：4F 研究室（自由行動第一次去、知識不夠會被言巷趕出來；知識 25 以上才出現在行程表）
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
