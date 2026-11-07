"""設定總表「主線劇情」分頁（v0.40.1）：js/story/data/storyscript.js 的 STORY_SCRIPT ⇄ 試算表。
由 tools/textsheet.py 的 build／apply 呼叫，不用單獨執行。
一列一句台詞；事件的欄位（編號、章、觸發、參數、說明）寫在那個事件的第一列，下面空著＝同一個事件。
"""
import json, os, re, subprocess
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.worksheet.datavalidation import DataValidation

F = 'Microsoft JhengHei'
WRAP = Alignment(wrap_text=True, vertical='top')
C_HEAD = PatternFill('solid', fgColor='D9E2F3')
C_EV = PatternFill('solid', fgColor='FFF2CC')
C_NOTE = PatternFill('solid', fgColor='EEEEEE')

TRIG = {'start': '開場', 'weekStart': '週開始', 'weekEnd': '週結束', 'first': '第一次做', 'stat': '數值達到', 'chapterEnd': '章末',
        'chapterPass': '過關後', 'open': '打開畫面', 'pick': '排進行程', 'meet': '遇到人',   # v0.40.5 加後面四個
        'alone': '沒遇到人', 'gameOver': '遊戲結束', 'roll': '執行行程隨機'}   # v0.40.60：執行那個行程的那天，有機率播一次（參數：行程名、條件…、機率30%）   # v0.40.47：沒遇到人＝做了那件事、平常會在的人不在｜遊戲結束（參數：負債）
GAMEOVER = {'debt': '負債'}   # 遊戲結束的原因
FIRST_X = {'crit': '大成功', 'fumble': '大失敗', 'collapse': '累倒', 'tiredMax': '小球疲倦滿'}   # 「第一次做」的特殊對象
SCREEN = {'plan': '行程', 'stat': '狀態', 'bag': '背包', 'tank': '水缸'}
FX = {'walk': '背景上下搖晃稍微放大', 'shake': '震動', 'flash': '閃白', 'larvaIn': '小球出現', 'larvaOut': '小球消失', 'hop': '立繪跳一下', 'crouch': '立繪蹲下晃一晃', 'sway': '立繪晃一晃', 'all': '整段一起出現', 'larvaSway': '小球晃一晃', 'runL': '從左邊跑進來', 'runR': '從右邊跑進來', 'cont': '接續上一句', 'contNl': '換行並接續上一句', 'contNl2': '換兩行並接續上一句', 'squat': '立繪蹲下起來',
      'walkL': '從左邊走進來', 'walkR': '從右邊走進來', 'leaveL': '從左邊走開', 'leaveR': '從右邊走開',   # v0.40.23 走進來／走開
      'lvJump': '小球跳跳', 'lvWave': '小球揮手', 'lvSleep': '小球睡睡', 'lvKeep': '繼續上一個動作', 'helperIn': '右下角冒出', 'helperOut': '右下角縮回去', 'bigFace': '大臉飄過',
      'moveRF': '立繪移到右邊前層', 'moveR': '立繪移到右邊', 'moveRB': '立繪移到右邊後層', 'moveC': '立繪移到中間', 'moveLF': '立繪移到左邊前層', 'moveL': '立繪移到左邊', 'moveLB': '立繪移到左邊後層',
      'fall': '立繪晃一晃倒下'}   # v0.40.62：立繪移動七個位置（:左／:右＝哪一格，沒寫＝說話的人；一群小球也可以）；晃一晃倒下（掉出畫面，到換圖為止）   # v0.40.49：一群小球的動作（:左1／:右2＝哪一隻）、右下角的小助手、大臉飄過（:人物）
FX_ALIAS = {'小球立繪晃一晃': '小球晃一晃', '接續上一句換行': '換行並接續上一句', '半透明的大臉從左上飄過': '大臉飄過'}   # 舊名稱、口語寫法
LV_TGT = {'L': '左', 'R': '右', 'L1': '左1', 'L2': '左2', 'L3': '左3', 'L4': '左4', 'R1': '右1', 'R2': '右2', 'R3': '右3', 'R4': '右4'}   # 一群小球的第幾隻（從外側數）
def _fx_tgt_cn(nm, t, names=None):
    if nm == 'bigFace': return (names or NAMES).get(t, t)
    return LV_TGT.get(t, t)
def _fx_tgt_id(nm, t, rnames=None):
    if nm == 'bigFace': return (rnames or {v: k for k, v in NAMES.items()}).get(t, t)
    return {v: k for k, v in LV_TGT.items()}.get(t, t)
# 教學用：畫面:狀態-小球（scr:stat.larva）｜亮:健康（hl:hp）
SCR = {'stat': '狀態', 'plan': '行程', 'tank': '水缸', 'bag': '收納', 'none': '關'}
SCRTAB = {'me': '我', 'larva': '小球', 'ppl': '人際', 'care': '照顧', 'job': '打工', 'rest': '休閒', 'out': '外出', 'wear': '衣服', 'acc': '飾品', 'item': '道具', 'diary': '日記本'}
HL = {'tabs': '頁籤', 'head': '頭像', 'hp': '健康', 'calm': '安心', 'mood': '情緒', 'tired': '疲倦', 'str': '體能', 'soc': '社交', 'know': '知識', 'fat': '疲勞', 'money': '錢', 'ppl': '人際',
      'week': '一週', 'day': '每一天', 'fixed': '固定日', 'blank': '空白的日子', 'medsum': '換藥次數', 'cmds': '指令', 'ok': '確定', 'tank': '水缸', 'grid': '格子',
      'cat-care': '照顧頁籤', 'cat-job': '打工頁籤', 'cat-rest': '休閒頁籤', 'cat-out': '外出頁籤', 'btab-wear': '衣服頁籤', 'btab-acc': '飾品頁籤', 'btab-item': '道具頁籤', 'btab-diary': '日記本頁籤'}
def _fx_cn(x):
    if x.startswith('scr:'):
        a, _, b = x[4:].partition('.'); return '畫面:' + SCR.get(a, a) + ('-' + SCRTAB.get(b, b) if b else '')
    if x.startswith('hl:'): return '亮:' + HL.get(x[3:], x[3:])
    nm, at, num = x.partition('@'); b, c, t = nm.partition(':'); return FX.get(b, b) + (':' + _fx_tgt_cn(b, t) if c else '') + (at + num)
def _fx_id(x):
    x = x.replace('：', ':')
    if x.startswith('畫面:'):
        a, _, b = x[3:].partition('-'); return 'scr:' + {v: k for k, v in SCR.items()}.get(a, a) + ('.' + {v: k for k, v in SCRTAB.items()}.get(b, b) if b else '')
    if x.startswith('亮:'): return 'hl:' + {v: k for k, v in HL.items()}.get(x[2:], x[2:])
    return None   # 可以寫好幾個，用「、」隔開
BLACK = ('黑', '全黑', '黑畫面', '（全黑）', '(全黑)', 'black')   # 背景寫這些＝全黑
FW = str.maketrans({chr(0xFF01 + i): chr(0x21 + i) for i in range(94)})   # 全形英數 → 半形（檔名用）
FACE = {'joy': '喜', 'anger': '怒', 'sad': '哀', 'fun': '樂', 'shock': '驚'}   # 玩家（紙娃娃）
NPC_FACE = ['正常', '喜', '怒', '哀', '樂', '驚', '特殊']   # 人物立繪 _0～_6（特殊＝那個人專屬的動作，例：言盡歪頭）
STAT = {'hp': '健康', 'calm': '安心', 'mood': '情緒', 'tired': '疲倦', 'str': '體能', 'soc': '社交', 'know': '知識', 'fat': '疲勞', 'money': '錢', 'week': '週', 'med': '換藥次數'}
COLS = ['事件編號', '章', '觸發', '觸發參數', '事件說明', '日記標題', '標籤', '說話者', '表情', '內容', '背景', '右立繪', '左立繪', '演出', '跳到', '數值變化', '備註']
WIDTH = [10, 5, 10, 16, 22, 12, 8, 10, 7, 60, 14, 18, 18, 14, 9, 18, 18]

def _node(root, expr):
    files = ['js/data/texts.js', 'js/story/data/texts.js', 'js/story/data/story.js', 'js/story/data/storyscript.js']
    code = 'const window={};' + ''.join(open(os.path.join(root, f), encoding='utf-8').read() + '\n' for f in files) + f';console.log(JSON.stringify({expr}))'
    import tempfile   # 程式碼太長時 node -e 會超過命令列長度，改寫成暫存檔
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(code)
    try: return json.loads(subprocess.run(['node', f.name], capture_output=True, text=True, check=True).stdout)
    finally: os.unlink(f.name)

def load(root):
    d = _node(root, '{script:STORY_SCRIPT,npc:TEXT.story.npc,cmd:TEXT.story.cmd,cond:STORY_COND}')
    names = {k: v['n'] for k, v in d['npc'].items()}
    CMDS.update(d['cmd']); NAMES.update(names); COND[:] = d['cond']
    return d['script'], names, d['cmd']

# 條件（v0.40.31 統整）：變數表是 js/story/data/story.js 的 STORY_COND，這裡照同一張表轉（load 時讀進來）
#   和遊戲裡 storyCondCn／storyCondId 的寫法一樣；tools/storycheck.py 會檢查兩邊轉出來一樣
CMDS, NAMES, COND = {}, {}, []
OPS = ('>=', '<=', '==', '>', '<', '=')
def _cond_terms(c): return [t.strip() for t in re.split(r'[,，、]', str(c or '')) if t.strip()]
def cond_bad(c):
    """程式寫法的條件裡看不懂的部分（變數不存在、對象不存在、格式不對）"""
    bad = []
    for t in _cond_terms(c):
        m = re.fullmatch(r'([A-Za-z]\w*)(?:\.(\w+))?\s*(>=|<=|==|>|<|=)\s*(-?\d+)', t)
        v = m and next((x for x in COND if x['k'] == m.group(1)), None)
        of = v.get('of') if v else None
        ok = bool(v) and bool(of) == bool(m.group(2)) and (not of or (m.group(2) in (NAMES if of == 'npc' else CMDS)))
        if not ok: bad.append(t)
    return bad
def _cond_cn(c, names=None):
    out = []
    for t in _cond_terms(c):
        m = re.fullmatch(r'([A-Za-z]\w*)(?:\.(\w+))?\s*(>=|<=|==|>|<|=)\s*(-?\d+)', t)
        v = m and next((x for x in COND if x['k'] == m.group(1)), None)
        if not v or cond_bad(t): out.append(t); continue   # 看不懂的留原樣（和遊戲一樣）
        o = m.group(2) or ''
        if v.get('of'): o = ':' + ((names or NAMES) if v['of'] == 'npc' else CMDS).get(o, o)
        out.append(v['cn'] + o + m.group(3) + m.group(4))
    return '、'.join(out)
def _cond_id(c, rnames=None, bad=None):
    c = str(c or '')
    for a, b in (('≥', '>='), ('≧', '>='), ('≤', '<='), ('≦', '<='), ('＞', '>'), ('＜', '<'), ('＝', '='), ('：', ':')): c = c.replace(a, b)
    rn = rnames or {v: k for k, v in NAMES.items()}; rc = {v: k for k, v in CMDS.items()}
    vs = sorted(COND, key=lambda x: -len(x['cn']))
    out = []
    for t in [re.sub(r'\s', '', x) for x in re.split(r'[,，、]', c)]:
        if not t: continue
        m = re.fullmatch(r'(.+?)(>=|<=|==|>|<|=)(-?\d+)', t)
        if not m:
            out.append(t); bad is not None and bad.append(t); continue
        L, k = m.group(1), None
        if re.match(r'[A-Za-z]', L): k = L
        else:
            v = next((x for x in vs if L == x['cn'] or L.startswith(x['cn'] + ':') or (x.get('of') and L.startswith(x['cn']))), None)
            if v:
                o = L[len(v['cn']):].lstrip(':')
                if v.get('of'): k = v['k'] + '.' + (rn if v['of'] == 'npc' else rc).get(o, o) if o else None
                else: k = None if o else v['k']
        r = k + m.group(2) + m.group(3) if k else t
        if bad is not None and (not k or cond_bad(r)): bad.append(t)
        out.append(r)
    return ','.join(out)
# 觸發參數：stat／chapterEnd＝條件；其他＝「對象、條件…」
def _arg_cn(trig, arg, names, cmds):
    if trig in ('stat', 'chapterEnd'): return _cond_cn(arg, names)
    k, _, c = str(arg or '').partition(',')
    if trig == 'first': k = FIRST_X.get(k, cmds.get(k, k))
    elif trig in ('pick', 'alone'): k = cmds.get(k, k)
    elif trig == 'roll':   # 行程%30 → 行程名、條件…、機率30%
        k, _, p = k.partition('%')
        return '、'.join([cmds.get(k, k)] + ([_cond_cn(c, names)] if c else []) + (['機率' + p + '%'] if p else []))
    elif trig == 'gameOver': k = GAMEOVER.get(k, k)
    elif trig == 'open': k = SCREEN.get(k, k)
    elif trig == 'meet':
        w, _, at = k.partition('@'); k = names.get(w, w) + ('@' + '／'.join(cmds.get(a, a) for a in at.split('|')) if at else '')   # 好幾個行程：言默@公園散步／街頭藝人
    return k + ('、' + _cond_cn(c, names) if c else '')
def _arg_id(trig, arg, rnames, rcmds):
    if trig in ('stat', 'chapterEnd'): return _cond_id(arg, rnames)
    a = str(arg or '').replace('，', ',').replace('、', ',').replace('＠', '@')
    k, _, c = a.partition(','); k = k.strip()
    if trig in ('first', 'pick', 'alone', 'roll'): k = {v: x for x, v in FIRST_X.items()}.get(k, rcmds.get(k, k))
    if trig == 'roll':   # 機率30%（沒寫＝STORY_RULE.rollP）→ 參數變成 行程%30
        m = re.search(r'(?:^|,)\s*機率\s*(\d+)\s*[%％]?\s*(?=,|$)', c)
        if m: k += '%' + m.group(1); c = (c[:m.start()] + c[m.end():]).strip(',')
    elif trig == 'gameOver': k = {v: x for x, v in GAMEOVER.items()}.get(k, k)
    elif trig == 'open': k = {v: x for x, v in SCREEN.items()}.get(k, k)
    elif trig == 'meet':
        w, _, at = k.partition('@'); k = rnames.get(w.strip(), w.strip()) + ('@' + '|'.join(rcmds.get(a.strip(), a.strip()) for a in re.split(r'／|/|\||\bor\b|或', at) if a.strip()) if at else '')
    elif trig in ('weekStart', 'weekEnd'): k = re.sub(r'\D', '', k)
    c = _cond_id(c, rnames)
    return k + (',' + c if c else '')
OPEN = {'f4': '異生會4F', 'f5': '異生會5F'}   # 效果「開放:異生會4F」＝劇情裡開放新地點（v0.40.23）
def _eff_cn(e, names):
    out = []
    for p in re.split(r'[,，、]', e or ''):
        p = p.strip()
        if not p: continue
        m = re.match(r'^fav\.(\w+)([+-]\d+)$', p)
        if m: out.append(f'好感:{names.get(m.group(1), m.group(1))}{m.group(2)}'); continue
        if p.startswith('open.'): out.append('開放:' + OPEN.get(p[5:], p[5:])); continue
        if p == 'gameOver': out.append('遊戲結束'); continue   # v0.40.53：這段播完遊戲結束（例 C1-06 月底評估沒過）
        m = re.match(r'^(\w+)([+-]\d+)$', p)
        out.append(f'{STAT.get(m.group(1), m.group(1))}{m.group(2)}' if m else p)
    return '、'.join(out)
def _eff_id(e, rnames):
    out = []
    for p in re.split(r'[,，、]', str(e or '')):
        p = p.strip().replace('：', ':').replace('＋', '+').replace('－', '-')
        if not p: continue
        m = re.match(r'^好感:?(.+?)([+-]\d+)$', p)
        if m: out.append(f'fav.{rnames.get(m.group(1), m.group(1))}{m.group(2)}'); continue
        if p.startswith('開放:'): out.append('open.' + {v: k for k, v in OPEN.items()}.get(p[3:].strip(), p[3:].strip())); continue
        if p == '遊戲結束': out.append('gameOver'); continue
        m = re.match(r'^(.+?)([+-]\d+)$', p)
        if m:
            k = {v: k for k, v in STAT.items()}.get(m.group(1), m.group(1)); out.append(f'{k}{m.group(2)}')
    return ','.join(out)

# 立繪格放小球（v0.40.23）：小球／小球:縮著 ↔ larva／larva:curl
LARVA_POSE = {'curl': '縮著', 'idle_a': '平常', 'droop': '垂著', 'rest': '休息', 'reach_a': '伸手', 'open_a': '張開'}
def _chr_cn(v):
    v = str(v or '')
    if v == 'none': return '無'
    if v.startswith('larvae:'): return '小球×' + v[7:]   # 一群小球（v0.40.49）
    if v.startswith('larva'): _, _, p = v.partition(':'); return '小球' + (':' + LARVA_POSE.get(p, p) if p else '')
    return v.replace('+acc', '+配件')
def _chr_id(v):
    m = re.fullmatch(r'小球[×xX*](\d+)', v) or re.fullmatch(r'(\d+|好幾|幾)隻.*小球.*', v)
    if m: return 'larvae:' + (m.group(1) if m.group(1).isdigit() else '3')   # 一群小球：小球×2（也看得懂「2隻不同色小球」「好幾隻隨機小球」）
    if not v.startswith('小球'): return v
    _, _, p = v.replace('：', ':').partition(':'); p = p.strip()
    return 'larva' + (':' + {b: a for a, b in LARVA_POSE.items()}.get(p, p) if p else '')
_IMG = {}
def _img(root, who):
    if not _IMG: _IMG.update(_node(root, '(()=>{const o={};for(const k in STORY_NPC)o[k]=STORY_NPC[k].img;return o})()'))
    return _IMG.get(who) or ''

# 三種劇情（v0.40.20）：事件的 kind＝main 主線（開場、教學、每週、章末）｜side 支線（好感達標後的小故事）｜event 小事件（平常隨意觸發的簡短對話、提示）
KINDS = [('main', '主線劇情', 'F4B183'), ('side', '支線劇情', 'A9D08E'), ('event', '小事件', '9DC3E6')]
KIND_OF_TITLE = {t: k for k, t, _ in KINDS}
def quote(who, t):
    '''v0.40.22：人物說的話自動加「」（一行一組；已經有「『（開頭或」』結尾的不動）。旁白、選項不加。遊戲裡 js/story/script.js 的 stQuote 也做一樣的事'''
    if not t or who in ('narr', 'choice', 'cond', ''): return t
    out = []
    for c in t.split('\n'):
        s = c.strip()
        if not s or s[0] in '「『（(' or s[-1] in '」』': out.append(c); continue
        m = re.match(r'^(\s*)(.*?)(\s*)$', c, re.S)
        out.append(m.group(1) + '「' + m.group(2).replace('「', '『').replace('」', '』') + '」' + m.group(3))
    return '\n'.join(out)

def sheet_kind(title):
    for k, t, _ in KINDS:
        if str(title).endswith(t): return k
    return None

def build_sheet(wb, root, name, kind='main'):
    script, names, cmds = load(root)
    script = [e for e in script if e.get('kind', 'main') == kind]
    ws = wb.create_sheet(name)
    ws.sheet_properties.tabColor = dict((k, c) for k, _, c in KINDS)[kind]
    ws.cell(1, 1, dict((k, t) for k, t, _ in KINDS)[kind]).font = Font(name=F, bold=True, size=14)
    notes = [
        '一列一句。事件的「編號、章、觸發、觸發參數、事件說明」只寫在那個事件的第一列（黃底），下面空著＝同一個事件。要新增事件：在最下面寫新的編號。台詞全部空白的事件不會出現。',
        '觸發：開場（開始這一章）｜週開始／週結束（參數＝第幾週）｜第一次做（參數＝行程名，例 換藥水；或 大成功、大失敗、累倒、小球疲倦滿）｜數值達到（參數＝條件，例 健康>=20）｜章末（參數＝條件，空白＝都符合；照表上順序挑第一個符合的）｜過關後（章末之後播）｜打開畫面（行程、狀態、背包、水缸）｜排進行程（參數＝行程名）｜遇到人（參數＝人物名，或 人物@行程名，例 言默@公園散步；好幾個行程用「／」：言默@公園散步／街頭藝人；一個人一週最多一段）｜沒遇到人（參數＝行程名：做了那件事、平常會在的人不在，例 幫忙照顧小球＝5F 言街不在）｜遊戲結束（參數＝負債：連續 2 週結算時錢是負的，不跑考察直接播這段，播完遊戲結束）｜執行行程隨機（參數＝行程名、條件…、機率30%：執行那個行程的那天有機率播；沒寫機率＝30%；那天已經有別的劇情就不擲；條件寫「沒遇到人==1」＝擲中就讓那天平常會在的人不在，例 活動中心義工時言街不在）。每個事件只播一次。',
        '條件（「數值達到」「章末」的參數；其他觸發可以在參數後面用「、」接條件）：例 健康>=20、安心<25、週==2、換藥次數<3、負債週數>=1、好感:言默==0（遇到人是在加好感之前判斷，==0＝主線裡第一次遇到）。例：週開始「3、換藥次數<3」｜排進行程「觸碰、安心<0」｜遇到人「言默@公園散步、好感:言默==0」。',
        '說話者：旁白｜玩家｜選項｜人物名字（' + '、'.join(names.values()) + '）。表情：正常｜喜｜怒｜哀｜樂｜驚｜特殊（特殊＝那個人專屬的動作，例：言盡歪頭；沒有就不要選。玩家空白＝平常；還沒換新圖的人物寫圖的編號 1、2）。',
        '背景、立繪：填 assets 裡的檔名（不含 .png，例 hall_b1、xiaojun_L_0），會一直用到換掉為止；寫「無」＝收起來。右立繪＝平常的位置（面向左）；左立繪＝兩個人對話時，寫 _L_ 或 _R_ 都會自動用面向右的圖。檔名後面加「+配件」＝疊上配件（例 xiaojun_L_0+配件＝戴耳麥）。人物說話時寫了表情，畫面上的他會自動換表情（方向、配件不變）。立繪格寫「小球」或「小球:姿勢」＝小球站在那一格（姿勢：縮著｜平常｜垂著｜休息｜伸手｜張開；沒寫＝縮著）。立繪格寫「小球×2」＝一群小球（那一側站 2 隻，顏色隨機；也看得懂「2隻不同色小球」）。效果欄：好感:人物+數字（第一次見面那次不浮提示）｜開放:異生會4F／異生會5F｜遊戲結束（這段播完就遊戲結束：黑畫面，只能讀取或離開；例 月底評估沒過）。',
        '判定（差分）：說話者寫「判定」，內容寫條件（例 好感:言街>0、知識>=25；寫法同觸發的條件；另外可以寫「原本好感:言街>0」＝這段劇情開始時的好感，劇情裡加的不算；「做過:行程名>0」＝做過那個行程），跳到寫標籤。連續幾列「判定」從上到下看，第一個符合的就跳過去；內容空白＝其他情況；都不符合就接著往下播。判定是播到那一列當下的數值（前面加的好感已經算進去）。選項：連續幾列「選項」＝一組選擇，「內容」是按鈕字、「跳到」寫要跳去的「標籤」。一般台詞的「跳到」寫標籤或「結束」（分支最後一句記得寫「結束」，不然會接著播下一段）。',
        '演出：震動｜閃白｜背景上下搖晃稍微放大（像往前走，放大後維持到換背景）｜立繪移到右邊前層｜立繪移到右邊｜立繪移到右邊後層｜立繪移到中間｜立繪移到左邊前層｜立繪移到左邊｜立繪移到左邊後層（後面寫「:左」「:右」＝移哪一格，沒寫＝說話的人；那一格會一直留在新位置，換了人才回原位；換圖時面向自己寫；一群小球也可以移）｜立繪晃一晃倒下（掉出畫面，之後到換圖為止都不在）｜小球出現｜小球消失｜小球晃一晃｜立繪跳一下｜立繪蹲下晃一晃（蹲著左右晃，像在拿東西）｜立繪蹲下起來（蹲一下就站起來）｜立繪晃一晃｜從左邊跑進來｜從右邊跑進來｜從左邊走進來｜從右邊走進來（新出場的人，會面向走的方向；沒寫＝淡入）｜從左邊走開｜從右邊走開（這句寫在哪一格立繪就是那一格走開，沒寫＝說話的人；走完就收掉）｜整段一起出現｜接續上一句（和上一句放同一個對話框，直接接在後面；可以換表情）｜換行並接續上一句｜換兩行並接續上一句（中間空一行）。一群小球：小球跳跳｜小球揮手｜小球睡睡（後面加「:左1」「:右2」＝哪一隻，從外側數；沒寫＝全部），動作只演這一句，下一句寫「繼續上一個動作」就不會停。立繪的演出（立繪跳一下、蹲下、晃一晃）和走開後面加「:左」「:右」＝指定那一格（例 立繪蹲下晃一晃:左、從左邊走開:右＝右邊那格往左走開）；旁白一定要寫，人物說話時沒寫＝說話的人。右下角冒出／右下角縮回去＝這句的右立繪（例 格蕾特）從畫面右下角冒出來當小助手（擋住對話框右邊一點，對話框的字會縮短），原本的立繪留著，之後她說話換表情也是換這張；「右下角冒出:39%」＝露出整張圖的 39%（從上面算，沒寫＝60%）；右立繪寫「無」也會收掉。大臉飄過:人物（或圖名，例 大臉飄過:yanjie_L_6）＝只擷取頭部、邊緣淡化，從畫面上方中間淡入、往左飄走（可以加 @段）。好幾個用「、」隔開；後面加 @數字＝那一段出來時才演（例 小球晃一晃@3；段＝換行或「｜」分出來的每一段）。立繪的演出給說話的人；旁白時給右立繪。換人時舊的淡出、新的淡入。背景寫「黑」＝全黑畫面。數值變化：例 安心+3、好感:言曉君+1（選項的數值變化在選了之後才算；好感變化會在畫面左下浮出提示）。',
        '教學（演出欄）：畫面:狀態-小球＝打開那個畫面當背景（立繪縮到右下，一直開到換掉；畫面:關＝回到房間）；亮:健康＝這句講到的地方，其他地方調暗（可以寫好幾個）。畫面：狀態（我／小球／人際）、行程（照顧／打工／休閒／外出）、水缸、收納（衣服／飾品／道具／日記本）。亮：頁籤、頭像、健康、安心、情緒、疲倦、體能、社交、知識、疲勞、錢、人際、一週、每一天、固定日、空白的日子、換藥次數、指令、確定、水缸、格子、照顧頁籤…。「日記標題」（事件說明右邊）：寫了的事件會出現在收納 → 日記本（可以重看）。',
        '內容：有換行的話一次出一行（點一下出下一行，全出完才換下一句；空一行＝段落間隔）；句子中間寫「｜」＝停頓（點一下才繼續，不換行）；不要這樣就在演出寫「整段一起出現」。**字**＝強調（粗體、亮色）。最左邊的「句號」是自動產生的（事件編號#第幾句，和劇情預覽左上角一樣），不用改。代入字：{num} 小球編號、{name}（或 {玩家名稱}）玩家名字。人物說的話不用自己打「」，套用時會自動加（一行一組；話裡面要引用別人的話用『』）；旁白不加，顯示成斜體。',
    ]
    for i, t in enumerate(notes):
        c = ws.cell(2 + i, 1, t); c.font = Font(name=F, size=10); c.alignment = WRAP; c.fill = C_NOTE
        ws.merge_cells(start_row=2 + i, start_column=1, end_row=2 + i, end_column=len(COLS))
        ws.row_dimensions[2 + i].height = 30
    h = 2 + len(notes) + 1
    # 第一欄「句號」＝事件編號#第幾句（自動產生，套用時不讀；和劇情預覽左上角一樣，討論時用）
    for j, t in enumerate(['句號'] + COLS):
        c = ws.cell(h, j + 1, t); c.font = Font(name=F, bold=True); c.fill = C_HEAD
        ws.column_dimensions[chr(65 + j)].width = ([11] + WIDTH)[j]
    ws.freeze_panes = ws.cell(h + 1, 1)
    r = h + 1
    for ev in script:
        lines = ev.get('lines') or [{}]
        for i, L in enumerate(lines):
            vals = [''] * len(COLS)
            if i == 0:
                arg = _arg_cn(ev['trig'], ev.get('arg', ''), names, cmds)
                vals[0:6] = [ev['id'], ev.get('ch', 1), TRIG.get(ev['trig'], ev['trig']), arg, ev.get('note', ''), ev.get('title', '')]
            who = L.get('who', '')
            face = L.get('face', '')
            vals[6:] = [L.get('tag', ''), {'narr': '旁白', 'player': '玩家', 'choice': '選項', 'cond': '判定'}.get(who, names.get(who, who)),
                        FACE.get(face, face) if who == 'player' else (NPC_FACE[int(face)] if re.fullmatch(r'[0-6]', str(face)) and who in names and '_L_' in _img(root, who) else face), _cond_cn(L.get('text', ''), names) if who == 'cond' else L.get('text', ''), '黑' if L.get('bg') == 'black' else L.get('bg', ''),
                        _chr_cn(L.get('chr', '')), _chr_cn(L.get('chl', '')), '、'.join(_fx_cn(x) for x in re.split(r'[,，、]', L.get('fx', '')) if x),
                        '結束' if L.get('go') == 'end' else L.get('go', ''), _eff_cn(L.get('eff', ''), names), L.get('note', '')]
            c = ws.cell(r, 1, f"{ev['id']}#{i + 1}"); c.font = Font(name=F, size=9, color='888888'); c.alignment = WRAP
            for j, v in enumerate(vals):
                c = ws.cell(r, j + 2, v if v != '' else None); c.font = Font(name=F); c.alignment = WRAP
                if i == 0 and j < 6: c.fill = C_EV
            r += 1
    # 下拉選單
    end = r + 300
    for col, opts in [('D', TRIG.values()), ('I', ['旁白', '玩家', '選項', '判定'] + list(names.values())), ('J', NPC_FACE), ('O', FX.values())]:
        dv = DataValidation(type='list', formula1='"' + ','.join(opts) + '"', allow_blank=True, showErrorMessage=False)
        ws.add_data_validation(dv); dv.add(f'{col}{h + 1}:{col}{end}')   # 演出的下拉只能選一個；要兩個以上直接打字，用「、」隔開
    return ws

def apply_book(sheets, root):
    """主線劇情／支線劇情／小事件分頁 → 合併寫回 js/story/data/storyscript.js（沒附上的那種照舊保留）。回傳 (事件數, 問題清單)"""
    cur, _, _ = load(root)
    old_kind = {e['id']: e.get('kind', 'main') for e in cur}
    got, probs, kinds = [], [], set()
    for ws in sheets:
        k = sheet_kind(ws.title); kinds.add(k)
        evs, pr = parse_sheet(ws, root)
        for e in evs:
            # 舊的總表只有「主線劇情」一頁：已經分到支線／小事件的照舊
            e['kind'] = old_kind.get(e['id'], k) if len(sheets) == 1 and k == 'main' and e['id'] in old_kind else k
        got += evs; probs += [f'{ws.title}｜{x}' for x in pr]
    ids = [e['id'] for e in got]
    for d in sorted(set(i for i in ids if ids.count(i) > 1)): probs.append(f'事件編號 {d} 重複了')
    if len(sheets) == 1 and sheet_kind(sheets[0].title) == 'main': keep = [e for e in cur if e['id'] not in ids and e.get('kind', 'main') != 'main']
    else: keep = [e for e in cur if e.get('kind', 'main') not in kinds]
    order = {k: i for i, (k, _, _) in enumerate(KINDS)}
    # 主線 → 支線 → 小事件；同一種照編號排（M章-序／B人物-序／L人物-序，v0.40.61），其他寫法的編號排在那一種的最後、照原本順序
    idk = lambda i: (0, i) if re.fullmatch(r'[MBL]\d+-\d+\w*', i) else (1, '')
    allev = sorted(got + keep, key=lambda e: (order.get(e.get('kind', 'main'), 0), idk(e['id'])))
    write_script(root, allev)
    return len(allev), probs

def apply_sheet(ws, root):
    return apply_book([ws], root)

def parse_sheet(ws, root):
    """讀一個分頁 → (事件清單, 問題清單)"""
    _, names, cmds = load(root)
    rnames = {v: k for k, v in names.items()}
    rcmds = {v: k for k, v in cmds.items()}
    rtrig = {v: k for k, v in TRIG.items()}
    rfx = {v: k for k, v in FX.items()}
    rfx.update({'立繪蹲下': 'crouch'})   # v0.40.25 改名前的寫法
    rface = {v: k for k, v in FACE.items()}
    head = None
    for row in ws.iter_rows(min_row=1, max_row=20):
        vals = [c.value for c in row]
        if '事件編號' in vals and '內容' in vals: head = (row[0].row, vals); break
    if not head: return 0, ['找不到表頭（事件編號、內容）']
    row0, hv = head
    hv = ['右立繪' if v == '立繪' else v for v in hv]   # v0.40.1 的總表只有一欄「立繪」
    ix = {t: hv.index(t) for t in COLS if t in hv}
    g0 = lambda r, t: (str(r[ix[t]]).strip() if t in ix and ix[t] < len(r) and r[ix[t]] is not None else '')
    g = g0
    evs, probs, cur = [], [], None
    for n, r in enumerate(ws.iter_rows(min_row=row0 + 1, values_only=True), start=row0 + 1):
        if not any(v is not None and str(v).strip() for v in r): continue
        if g(r, '事件編號'):
            trig = rtrig.get(g(r, '觸發'), g(r, '觸發'))
            if trig not in TRIG: probs.append(f'第 {n} 列：觸發「{g(r, "觸發")}」看不懂'); trig = 'stat'
            arg = _arg_id(trig, g(r, '觸發參數'), rnames, rcmds)
            b = cond_bad(arg if trig in ('stat', 'chapterEnd') else arg.partition(',')[2])
            if b: probs.append(f'第 {n} 列：觸發參數的條件「{"、".join(b)}」看不懂')
            try: ch = int(float(g(r, '章') or 1))
            except ValueError: ch = 1
            cur = {'id': g(r, '事件編號'), 'ch': ch, 'trig': trig, 'arg': arg, 'note': g(r, '事件說明'), 'lines': []}
            if g(r, '日記標題'): cur['title'] = g(r, '日記標題')
            evs.append(cur)
        if cur is None: probs.append(f'第 {n} 列：上面沒有事件編號'); continue
        text, who = g(r, '內容'), g(r, '說話者')
        if text and '內容' in ix and r[ix['內容']] is not None: text = str(r[ix['內容']]).strip(' \t\u3000').replace('\r', '')   # 前後的換行留著（給「接續上一句」用）
        if not text and not who: continue
        L = {}
        if g(r, '標籤'): L['tag'] = g(r, '標籤').translate(FW)   # 全形數字、底線也當半形
        who = {'旁白': 'narr', '玩家': 'player', '選項': 'choice', '判定': 'cond', '': 'narr'}.get(who, rnames.get(who, who))
        if who not in ('narr', 'player', 'choice', 'cond') and who not in names: probs.append(f'第 {n} 列：說話者「{g(r, "說話者")}」不在人物清單（當成名字直接顯示）')
        L['who'] = who
        face = g(r, '表情')
        face = re.sub(r'\.0$', '', face)
        if who in ('narr', 'choice', 'cond'): face = ''
        elif who == 'player': face = '' if face == '正常' else rface.get(face, face)
        elif face in NPC_FACE: face = str(NPC_FACE.index(face))
        if face: L['face'] = face
        if who == 'cond':
            bad = []; L['text'] = _cond_id(text, rnames, bad)
            if bad: probs.append(f'第 {n} 列：條件「{"、".join(bad)}」看不懂')
        else: L['text'] = quote(who, text)
        for t, k in [('背景', 'bg'), ('右立繪', 'chr'), ('左立繪', 'chl')]:
            v = g(r, t).translate(FW).replace('.png', '').replace('+配件', '+acc').replace('+配飾', '+acc')
            if v: L[k] = 'none' if v in ('無', '無立繪', 'none') else 'black' if k == 'bg' and v in BLACK else _chr_id(v) if k != 'bg' else v
        if g(r, '演出'):
            fx = []
            for x in re.split(r'[,，、\n]', g(r, '演出')):
                x = x.strip()
                if not x: continue
                if _fx_id(x): fx.append(_fx_id(x)); continue
                nm, at, num = x.translate(FW).partition('@')
                nm, col, tg = nm.strip().replace('：', ':').partition(':'); nm = FX_ALIAS.get(nm.strip(), nm.strip())
                if nm not in rfx and nm not in FX: probs.append(f'第 {n} 列：演出「{nm}」看不懂（先留著，遊戲裡不會動）')
                k = rfx.get(nm, nm)
                fx.append(k + (':' + _fx_tgt_id(k, tg.strip(), rnames) if col else '') + ('@' + re.sub(r'\D', '', num) if at else ''))
            L['fx'] = ','.join(fx)
        if g(r, '跳到'): L['go'] = 'end' if g(r, '跳到') == '結束' else g(r, '跳到').translate(FW)
        if g(r, '數值變化'): L['eff'] = _eff_id(g(r, '數值變化'), rnames)
        if g(r, '備註'): L['note'] = g(r, '備註')
        cur['lines'].append(L)
    return evs, probs

def write_script(root, evs):
    p = os.path.join(root, 'js/story/data/storyscript.js')
    src = open(p, encoding='utf-8').read()
    hdr = src[:src.index('const STORY_SCRIPT=')]
    def ev_js(e):
        head = json.dumps({k: e[k] for k in ('id', 'kind', 'ch', 'trig', 'arg', 'note', 'title') if k in e}, ensure_ascii=False)[:-1]
        if not e['lines']: return '  ' + head + ',"lines":[]}'
        return '  ' + head + ',"lines":[\n' + ',\n'.join('    ' + json.dumps(l, ensure_ascii=False) for l in e['lines']) + '\n  ]}'
    body = ',\n'.join(ev_js(e) for e in evs)
    open(p, 'w', encoding='utf-8').write(hdr + 'const STORY_SCRIPT=[\n' + body + '\n];\n')

# 主線總表（v0.40.6 小總表；v0.40.20 起三頁劇情；v0.40.32 加主線介面）：python3 tools/storysheet.py build . 主線總表.xlsx ／ python3 tools/storysheet.py apply . 主線總表.xlsx
# 套用也可以用 textsheet.py apply（分頁名稱結尾是「主線劇情」就會寫回）
if __name__ == '__main__':
    import sys
    from openpyxl import Workbook, load_workbook
    cmd, root, path = sys.argv[1], sys.argv[2], sys.argv[3]
    if cmd == 'build':   # v0.40.32：主線總表＝三種劇情＋主線介面（畫面上的字）
        wb = Workbook(); wb.remove(wb.active)
        for k, t, _ in KINDS: build_sheet(wb, root, t, k)
        import storyui; storyui.build_ui_sheet(wb, root)
        wb.save(path); print('已產生', path)
    else:                # 劇情分頁和主線介面一起套用（主線介面和設定總表同一套寫法，交給 textsheet.apply）
        import textsheet; textsheet.apply(root, path)
