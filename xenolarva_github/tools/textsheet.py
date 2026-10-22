#!/usr/bin/env python3
# 設定總表工具：從程式產生「設定總表」，以及把總表裡「你的新文字」套回程式。
#
#   產生總表： python3 tools/textsheet.py build <專案根目錄> <舊總表.xlsx 或 -> <輸出.xlsx>
#              （舊總表用來帶入「對象／情境」說明，以及沿用「互動」「數值參考」兩個手動整理的分頁）
#   套用新文字：python3 tools/textsheet.py apply <專案根目錄> <總表.xlsx>
#              （套完再 build 一次，新文字就會併進「目前文字」、新文字欄清空）
#
# 文字來源：js/data/texts.js（TEXT）、items.js（NAME、CNAME）、endings.js（ENDS）、decor.js（DECOR 的 name）。
# 每一條文字在總表剛好出現一次，key＝程式裡的位置。程式改了文字，重新 build 就會同步。
import sys, re, json, subprocess, os, glob
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# ---------------------------------------------------------------- 讀 JS 字面值（只處理資料檔：物件、陣列、字串、數字）
SOURCES = [  # (檔案, 變數名, key 前綴)
    ('js/data/texts.js', 'TEXT', ''),
    ('js/data/items.js', 'NAME', 'NAME.'),
    ('js/data/items.js', 'CNAME', 'CNAME'),
    ('js/data/endings.js', 'ENDS', 'ENDS.'),
    ('js/data/decor.js', 'DECOR', 'DECOR.'),
]

def parse_var(src, name, prefix):
    m = re.search(r'\bconst\s+' + re.escape(name) + r'\s*=\s*', src)
    if not m: raise SystemExit(f'找不到 const {name}')
    strings, arrays, raws = [], [], []
    n = len(src)

    def ws(i):
        while i < n:
            if src[i] in ' \t\r\n': i += 1
            elif src.startswith('//', i):
                j = src.find('\n', i); i = n if j < 0 else j
            elif src.startswith('/*', i): i = src.index('*/', i) + 2
            else: break
        return i

    def pstr(i):
        q = src[i]; j = i + 1; out = []
        while src[j] != q:
            if src[j] == '\\':
                c = src[j + 1]
                if c == 'u':
                    out.append(chr(int(src[j + 2:j + 6], 16))); j += 6; continue
                out.append({'n': '\n', 't': '\t', 'r': '\r'}.get(c, c)); j += 2
            else:
                if q == '`' and src.startswith('${', j): raise SystemExit('文字裡不支援 ${}：' + src[i:i + 40])
                out.append(src[j]); j += 1
        return ''.join(out), j + 1

    def join(path, k):
        return (path + '.' + k) if path else k

    def val(i, path):
        i = ws(i); c = src[i]
        if c in '\'"`':
            v, j = pstr(i)
            node = {'t': 's', 'v': v, 's': i, 'e': j, 'path': path}
            strings.append(node); return node, j
        if c == '{':
            i += 1
            while True:
                i = ws(i)
                if src[i] == '}': return {'t': 'o', 's': None, 'e': i + 1}, i + 1
                if src[i] in '\'"': k, i = pstr(i)
                else:
                    mm = re.compile(r'[^\s:,{}]+').match(src, i); k = mm.group(); i = mm.end()
                i = ws(i)
                assert src[i] == ':', (name, path, src[i:i + 30]); i += 1
                _, i = val(i, join(path, k))
                i = ws(i)
                if src[i] == ',': i += 1
        if c == '[':
            st = i; i += 1; elems = []
            while True:
                i = ws(i)
                if src[i] == ']':
                    node = {'t': 'a', 'elems': elems, 's': st, 'e': i + 1, 'close': i, 'path': path}
                    arrays.append(node); return node, i + 1
                node, j = val(i, f'{path}[{len(elems)}]'); elems.append(node); i = ws(j)
                if src[i] == ',': i += 1
        depth = 0; j = i
        while j < n:
            ch = src[j]
            if ch in '([{': depth += 1
            elif ch in ')]}':
                if depth == 0: break
                depth -= 1
            elif ch == ',' and depth == 0: break
            elif ch in '\'"`': _, j = pstr(j); continue
            j += 1
        node = {'t': 'x', 'v': src[i:j].strip(), 's': i, 'e': j, 'path': path}
        raws.append(node); return node, j

    root = prefix.rstrip('.') if prefix and not prefix.endswith('.') else ''
    if prefix.endswith('.'):
        # 物件：key 前綴＝變數名
        _, _ = val(m.end(), prefix[:-1])
    else:
        _, _ = val(m.end(), prefix)
    return strings, arrays, raws

def is_dialog(a):
    return a['elems'] and all(e['t'] == 'a' and e['elems'] and all(p['t'] == 'a' and len(p['elems']) == 2 and all(x['t'] == 's' for x in p['elems']) for p in e['elems']) for e in a['elems'])

def is_strlist(a):
    return a['elems'] and all(e['t'] == 's' for e in a['elems'])

CODE_RE = re.compile(r'^[A-Za-z0-9_\-]+$')    # 純英數＝程式用的代號，不是給玩家看的文字
# 可以「新增一則」的清單（隨機挑一則的文字）；其他清單（按鈕、頁面、色名）順序有意義，不開放新增
NO_APPEND = re.compile(r'^(layout\.|grete\.pages|grete\.again|chatEv\.|CNAME|ENDS\.|ui\.)')

def collect(root):
    """回傳 rows（依原始順序）與 index（key → 位置資訊，apply 用）"""
    rows, index = [], {}
    for fn, var, prefix in SOURCES:
        src = open(os.path.join(root, fn), encoding='utf-8').read()
        strings, arrays, raws = parse_var(src, var, prefix)
        byPath = {s['path']: s for s in strings}; rawPath = {x['path']: x for x in raws}
        dialog_spans = []
        items = []   # (start, row)
        for a in arrays:
            if is_dialog(a):
                dialog_spans.append((a['s'], a['e']))
                for i, el in enumerate(a['elems']):
                    k = f"{a['path']}[{i}]"
                    v = '\n'.join(f"{p['elems'][0]['v']}：{p['elems'][1]['v']}" for p in el['elems'])
                    items.append((el['s'], {'key': k, 'v': v, 'kind': 'dialog'}))
                    index[k] = {'file': fn, 's': el['s'], 'e': el['e'], 'kind': 'dialog', 'list': a}
                if not NO_APPEND.match(a['path']):
                    items.append((a['close'], {'key': a['path'] + '[+]', 'v': '', 'kind': 'dialog+'}))
                    index[a['path'] + '[+]'] = {'file': fn, 'kind': 'dialog+', 'list': a}
            elif is_strlist(a) and not NO_APPEND.match(a['path']):
                items.append((a['close'], {'key': a['path'] + '[+]', 'v': '', 'kind': 'str+'}))
                index[a['path'] + '[+]'] = {'file': fn, 'kind': 'str+', 'list': a}
        for s in strings:
            if any(a <= s['s'] < b for a, b in dialog_spans): continue
            if CODE_RE.match(s['v']): continue
            if var == 'DECOR' and not s['path'].endswith('.name'): continue
            row = {'key': s['path'], 'v': s['v'], 'kind': 'str'}
            if s['path'].endswith('.text'):                         # 事件頁：同一頁的人物／背景／道具圖
                P_ = s['path'][:-5]; ch = byPath.get(P_ + '.chr'); im = rawPath.get(P_ + '.img')
                row['pic'] = {k: byPath[P_ + '.' + k]['v'] for k in ('chr', 'bg', 'item') if P_ + '.' + k in byPath}
                if im and im['v'] in ('0', '1'): row['pic']['chr'] = ['grete_1', 'grete_2'][int(im['v'])]
                if ch: index[s['path'] + '#pic'] = {'file': fn, 's': ch['s'], 'e': ch['e'], 'kind': 'pic'}
                elif im and im['v'] in ('0', '1'): index[s['path'] + '#pic'] = {'file': fn, 's': im['s'], 'e': im['e'], 'kind': 'picnum'}
            items.append((s['s'], row))
            parent = next((a for a in arrays if is_strlist(a) and any(e is s for e in a['elems'])), None)
            index[s['path']] = {'file': fn, 's': s['s'], 'e': s['e'], 'kind': 'str', 'list': parent}
        items.sort(key=lambda x: x[0])
        rows += [r for _, r in items]
    return rows, index

# ---------------------------------------------------------------- 分頁與分組
def classify(k):
    """回傳 (分頁, 分組)"""
    top = re.split(r'[.\[]', k)[0]
    seg = re.split(r'[.\[\]]+', k)
    last = [x for x in seg if x and not x.isdigit() and x != '+'][-1]
    if top == 'temper':
        return ('個性', '個性') if last in ('name', 'desc') else ('Log', '個性：每天的狀態與喜好')
    if top == 'tags':
        if last in ('name', 'desc'): return ('標籤', '標籤')
        if last == 'end': return ('事件', '結局：標籤的結語')
        return ('Log', '標籤：發現與反應')
    if top in ('tag', 'tagCost'): return ('Log', '標籤：發現與反應')
    if top == 'NAME' or top == 'item': return ('物品與禮物', '物品')
    if top == 'DECOR' or top == 'decor': return ('物品與禮物', '裝飾')
    if top == 'souv':
        return ('Log', '禮物：送出時') if last == 'give' else ('物品與禮物', '禮物')
    if top == 'sneak': return ('Log', '禮物：送出時')
    if top == 'ENDS': return ('事件', '結局')
    if top in ('place', 'map'): return ('介面', '外出地圖')
    if top == 'larvae': return ('介面', '小球們頁')
    if top == 'game': return ('介面', '玩耍選單') if last in ('mode', 'switched', 'modeHead', 'modeQuick', 'modePlay', 'quick', 'play') else ('Log', '互動玩耍')
    if top == 'shop':
        if k.startswith('shop.intro'): return ('事件', '言盡的商店：第一次去')
        if k.startswith('shop.items') and last == 'name': return ('物品與禮物', '商店商品')
        if last in ('arrive', 'bought'): return ('Log', '商店')
        if last in ('title', 'points', 'leave', 'who', 'tagBuy', 'tagPreview', 'price', 'sold', 'tabRand', 'tabFixed', 'have2', 'chatBtn', 'goodsBtn'): return ('介面', '商店')
        return ('事件', '言盡的商店：對話')
    if top == 'letter':
        if last == 'log': return ('Log', '畢業小球的信紙')
        if last in ('collEmpty', 'dropHint', 'src', 'expand', 'fold', 'drop', 'dropConfirm'): return ('介面', '收藏品：信紙')
        return ('事件', '畢業小球的信紙')
    if top == 'intro': return ('事件', '開場故事')
    if top == 'idle':
        if last == 'msg': return ('Log', '第 0 日')
        if last == 'wait': return ('介面', '協會')
        return ('事件', '接取新委託')
    if top == 'grete':
        if k.startswith('grete.pages'): return ('事件', '遇見格蕾特')
        if k.startswith('grete.again'): return ('事件', '再次遇到格蕾特')
        return ('Log', '格蕾特')
    if top == 'chatEv':
        return ('事件', '聊顏色（格蕾特）' if '.talk' in k else '雙色（格蕾特）')
    if top == 'misc':
        if last in ('mergeOk', 'mergeBad', 'wiped', 'wipe', 'wipeArm'): return ('介面', '存檔')
        if k.startswith('misc.sum'): return ('事件', '結局畫面的摘要')
        if last in ('giftToast',): return ('Log', '禮物')
        return ('介面', '零散的介面文字')
    if top == 'pv': return ('介面', '觀察水缸') if last not in ('join', 'leave', 'hi', 'transOn', 'transOff') else ('Log', '觀察水缸')
    if top == 'skin': return ('介面', '設定：外觀（版型、配色、字體）')
    if top in ('doll', 'player'): return ('介面', '長相登記與玩家設定')   # v0.35 紙娃娃
    if top in ('ui', 'layout', 'CNAME'): return ('介面', {'ui': '按鈕與標題', 'layout': '☰ 選單與開關', 'CNAME': '顏色名稱（色票）'}[top])
    if top == 'assoc': return ('Log', '協會') if last == 'done' else ('介面', '協會')
    if top == 'feed': return ('介面', '餵食選單') if last in ('pick', 'headMain', 'headSnack') else ('Log', '餵食')
    if top == 'play': return ('介面', '玩耍選單') if last in ('pick', 'toyHead', 'noToy', 'pvHead') else ('Log', '玩耍')
    if top == 'chat': return ('介面', '玩耍選單') if last in ('head', 'btnPlain', 'btnColor', 'cancel') else ('Log', '聊天')
    if top == 'bag': return ('介面', '物品')
    if top == 'hall':
        if any(x in k for x in ('.floors.', '.floorName.', '.who.')): return ('介面', '異生會大樓')
        if k.startswith('hall.poke'): return ('事件', '異生會大樓：戳一下')
        if k.startswith(('hall.visitName',)): return ('介面', '異生會大樓')
        if k.startswith(('hall.visit', 'hall.follow', 'hall.lobbyGrete')): return ('事件', '異生會大樓：1F 的訪客')
        if last in ('arrive', 'upLog', 'upShop'): return ('Log', '異生會大樓')
        if last in ('urgentLog',): return ('Log', '異生會大樓')
        if last in ('title', 'leave', 'floors', 'floorName', 'who', 'needLv', 'btnAch', 'btnUp', 'status', 'next', 'maxLv', 'btnSpecial', 'btnUrgent', 'btnUrgentAsk', 'btnReg'): return ('介面', '異生會大樓')
        if last.startswith(('urgent', 'regDone')): return ('事件', '異生會大樓：緊急委託的登記（B1 言曉君）')
        return ('事件', '異生會大樓')
    if top == 'special':
        if last in ('log', 'start'): return ('Log', '特殊委託')
        if last in ('btnList', 'title', 'hint', 'book', 'booked', 'locked', 'noTag', 'tagHead'): return ('介面', '特殊委託')
        return ('事件', '特殊委託（賽倫絲）')
    if top == 'ach': return ('Log', '成就') if last in ('got', 'gotWear', 'log', 'logMany') else ('介面', '成就')
    return ('Log', {'start': '開局', 'water': '換水', 'out': '出門', 'settle': '換日', 'hint': '觀察線索（沒有檢測儀時）',
                    'poke': '被戳', 'voice': '心聲（翻譯）', 'social': '小球之間', 'guest': '圖鑑同伴'}.get(top, top))

DOLL_FIELD = {'doll.title': '長相登記：標題', 'doll.done': '確定按鈕', 'doll.none': '格子：無', 'doll.normal': '預覽左上：平常', 'doll.emoTag': '預覽左上：表情（{e}）',
    'doll.labParts': '小標：調整部件', 'doll.labEmoParts': '小標：表情部件', 'doll.labEmo': '小標：調整表情', 'doll.emoAgain': '提示：再按一次表情', 'doll.bubbleNote': '泡泡模式時（部件列）',
    'doll.size': '大小', 'doll.posX': '位置（左右）', 'doll.posY': '位置（上下）', 'doll.left': '方向：左', 'doll.right': '方向：右', 'doll.up': '方向：上', 'doll.down': '方向：下',
    'doll.less': '按鈕說明：減少', 'doll.more': '按鈕說明：增加', 'doll.reset': '重設按鈕', 'doll.same': '表情：恢復按鈕', 'doll.own': '表情：單獨調過的標示', 'doll.noneNote': '選了無時',
    'doll.hair': '髮色標題', 'doll.eyeColHead': '有預設色的眼睛（13、16、17）：標題', 'doll.eyeDef': '有預設色的眼睛：預設色按鈕', 'doll.eyeOwn': '有預設色的眼睛：瞳色按鈕', 'doll.eye': '瞳色標題', 'doll.skin': '膚色標題', 'doll.pickOwn': '自訂顏色', 'doll.skinNote': '膚色的說明', 'doll.clothNote': '衣服的說明',
    'doll.emoHead': '表情的標題（{e}）', 'doll.emoFace': '換臉按鈕', 'doll.emoBubble': '泡泡按鈕', 'doll.emoFaceNote': '換臉的說明', 'doll.emoBubbleNote': '泡泡的說明', 'doll.bubbleEmpty': '泡泡模式時（格子）',
    'doll.loading': '讀取圖片時', 'doll.preview': '預覽圖的說明（讀屏用）',
    'player.edit': '更改長相按鈕', 'player.noDoll': '還沒登記時', 'player.lookHint': '長相頁的說明', 'player.nameHint': '名字頁的說明'}
SHEETS = ['個性', '標籤', '物品與禮物', 'Log', '事件', '介面']
GROUP_ORDER = {
    'Log': ['開局', '第 0 日', '換水', '餵食', '玩耍', '聊天', '出門', '被戳', '換日', '觀察線索（沒有檢測儀時）', '個性：每天的狀態與喜好',
            '標籤：發現與反應', '禮物：送出時', '格蕾特', '心聲（翻譯）', '小球之間', '圖鑑同伴', '協會', '商店', '互動玩耍', '畢業小球的信紙', '異生會大樓', '成就', '特殊委託'],
    '事件': ['開場故事', '接取新委託', '遇見格蕾特', '再次遇到格蕾特', '聊顏色（格蕾特）', '雙色（格蕾特）', '言盡的商店：第一次去', '言盡的商店：對話', '結局', '結局：標籤的結語', '畢業小球的信紙', '異生會大樓', '異生會大樓：戳一下', '異生會大樓：緊急委託的登記（B1 言曉君）', '特殊委託（賽倫絲）'],
    '介面': ['按鈕與標題', '☰ 選單與開關', '小球們頁', '外出地圖', '商店', '餵食選單', '玩耍選單', '物品', '協會', '收藏品：信紙', '顏色名稱（色票）', '異生會大樓', '成就', '特殊委託', '長相登記與玩家設定'],
}

FIELD = {'name': '名字', 'desc': '說明', 'mood': '每天開始時的狀態', 'feedFav': '餵到喜歡的零食', 'playFav': '玩到喜歡的玩具',
         'join': '成為同伴、飄進水缸', 'found': '發現這個標籤時', 'feed': '餵食時', 'play': '玩耍時', 'poke': '被戳時', 'day': '換日時',
         'dayNone': '換日時（沒有裝飾）', 'end': '結局摘要', 'give': '送出時（訊息區）', 'item': '帶回的東西（代入 {item}）',
         'toast': '水缸上方提示框', 'text': '內文', 'btn': '按鈕', 'label': '選項按鈕', 'note': '內文下方小字', 'back': '溜回來時'}

FIELD.update({
    # 餵食、玩耍、其他
    'dislikeEat': '不喜歡的零食，餓到受不了還是吃了', 'things': '各顏色的東西（代入 {things}）',
    # 心聲
    'full': '吃飽時', 'hungry': '肚子餓時', 'dirty': '水髒時', 'weak': '身體虛弱時', 'love': '信賴高時', 'notice': '注意到人類時',
    'stone': '睏睏的午睡石頭',
    # 小球之間
    'together': '並排一起游', 'chase': '追逐', 'tryPush': '想推開對方', 'bounce': '互撞彈開', 'flee': '嚇得逃開', 'nestle': '窩在旁邊', 'moved': '被撞開換地方',
    'friend': '相性好的組合（偶爾多一句）',
    # 介面
    'ham': '☰ 選單項目', 'title': '遊戲名稱（開場框標題）', 'sign': '開場：簽名欄標題', 'ink': '開場：筆跡顏色標題', 'go': '開場：開始按鈕',
    'water': '按鈕：換水', 'out': '按鈕：出門', 'bag': '按鈕／標題：物品', 'free': '按鈕小字（不耗行動）', 'cost': '按鈕小字（耗行動）', 'bagSub': '按鈕小字（物品）',
    'tabDress': '小球們：打扮分頁', 'dressCats': '打扮：裝扮分類', 'dressNone': '打扮：不戴', 'dressDone': '打扮：打扮好了按鈕', 'dressCur': '打扮：這一輪的小球', 'dressNoLarva': '打扮：沒有小球', 'dressOn': '打扮：換上訊息', 'dressOff': '打扮：拿下訊息', 'dressHint': '打扮：說明',
    'pvBuy': '商店預覽：購買按鈕', 'pvBack': '商店預覽：關掉按鈕',
    'pvExit': '觀察水缸：離開按鈕', 'pvPlay': '觀察水缸：玩耍按鈕', 'pvHead': '觀察水缸：玩耍框說明', 'noToy': '玩耍框：沒有玩具時的說明',
    'chat': '按鈕：聊天', 'watchPick': '觀察水缸：選擇小球標題', 'seeLarvae': '結局框：查看小球們按鈕',
    'set': '設定（頁籤與標題）', 'save': '存檔（頁籤與標題）', 'nick': '設定：暱稱', 'color': '設定：代表色', 'outMode': '設定：外出方式',
    'outRandom': '設定：外出方式・隨機', 'outMap': '設定：外出方式・地圖', 'saveHint': '存檔說明', 'down': '存檔：下載按鈕', 'up': '存檔：上傳按鈕',
    'code': '存檔：文字進度碼', 'import': '存檔：匯入按鈕', 'wipe': '存檔：清除按鈕', 'about': '說明（頁面標題）', 'news': '更新公告（框標題）',
    'larvae': '小球們（頁面標題）', 'coll': '收藏品（頁面標題）', 'grete': '小助手開關', 'gDesk': '小助手開關（電腦版前面多的字）',
    'trans': '翻譯開關', 'tDesk': '翻譯開關（電腦版後面多的字）', 'on': '開關狀態：開', 'off': '開關狀態：關', 'wait': '結局框：等待新委託按鈕',
})
FIELD.update({
    'intro': '開頭（一般字）', 'body': '信的內容（換色的字）', 'staff': '後勤人員（隨機一位，代入 {staff}）', 'reason': '寄信原因（代入 {reason}）',
    'reasonYoung': '寄信原因・未滿兩個月', 'recentTemper': '近況・依個性', 'recentTag': '近況・依標籤', 'recentGift': '近況・喜歡的零食',
    'recentToy': '近況・喜歡的玩具', 'recentAny': '近況・沒有資料時', 'bless': '祝福・依結局（代入 {bless}）', 'blessAny': '祝福・沒有資料時',
    'farewellIntro': '離開前轉述・開頭', 'farewellBody': '離開前轉述・內容', 'farewellNote2': '離開前轉述・備註２', 'keep': '加入收藏勾選',
    'close': '關閉按鈕', 'log': '只在訊息區提示時', 'collEmpty': '沒有信紙時', 'dropHint': '信紙列表上方的小字（收納說明）', 'src': '禮物頁的來源', 'kinds': '信的種類（標題與收藏顯示）', 'titleKind': '彈出框標題（{kind}＝種類）',
    'expand': '展開按鈕', 'fold': '收合按鈕', 'drop': '收納按鈕（從收藏拿掉）', 'dropConfirm': '收納按鈕・再按一次',
    'letterMode': '設定：收信方式', 'letterPopup': '設定：收信方式・跳出', 'letterLog': '設定：收信方式・只在訊息區',
})
FIELD.update({'start': '開始時', 'win': '有人贏了', 'none': '沒人碰到', 'spin': '被泡泡捲到', 'hidden': '藏好之後（{spot}＝地方）', 'lose': '沒人猜中', 'count': '頂了幾下（{n}）', 'great': '4 下以上', 'spinMeh': '不喜歡的被泡泡捲到', 'dislike': '不喜歡軟球', 'meh': '3 下', 'bad': '2 下以下', 'weedL': '藏的地方：左水草', 'weedR': '藏的地方：右水草', 'toolHave': '互動道具已經買過', 'switched': '切換時的訊息', 'modeHead': '設定：玩耍方式', 'modeQuick': '設定：精簡', 'modePlay': '設定：遊玩', 'quick': '小牌子：精簡'})
FIELD.update({'tabNow': '分頁：小球們', 'tabRet': '分頁：已交還', 'nowStat': '小球們隻數', 'retStat': '已交還隻數', 'retEmpty': '沒有交還過時', 'retAt': '交還日期（{d}）', 'retLetter': '寄過信的標示', 'star': '星號按鈕說明', 'unstar': '取消星號說明', 'wear': '裝扮按鈕', 'wearing': '「戴著」', 'noWear': '沒戴裝扮', 'previewing': '預覽中', 'wearHint': '裝扮面板的提示', 'noWears': '還沒有裝扮時'})
FIELD.update({'tagPreview': '選取裝扮後多出的名牌：預覽', 'preview': '按預覽時言盡說的話', 'wearHave': '裝扮已經買過', 'wearHead': '物品：裝扮的分類名', 'wearOn': '戴上按鈕', 'wearOff': '拿下按鈕', 'woreOn': '戴上時的訊息', 'woreOff': '拿下時的訊息', 'empty': '沒有東西時'})
FIELD.update({'talk': '言盡的介紹（選取商品時）', 'hello': '進商店時言盡說的話', 'poor': '積分不夠', 'have': '玩具已經有了', 'thanks': '買完',
    'arrive': '到達廢棄大樓區', 'bought': '買了東西（{n} 積分、{list} 東西）', 'points': '積分顯示', 'leave': '離開按鈕', 'who': '言盡的名牌',
    'tagBuy': '選取後的名牌：購買', 'price': '價格（{n}）', 'sold': '買過的商品', 'outChip': '出門鍵上的外出方式小牌子', 'outSwitched': '切換外出方式時的訊息'})
FIELD.update({'find': '比較容易撿到什麼', 'hint': '還沒選地點時的提示', 'homeNote': '選到住所時的小字', 'findHead': '「比較容易撿到」的開頭'})
VOICE = {'full': '吃飽時', 'hungry': '肚子餓時', 'dirty': '水髒時', 'weak': '身體虛弱時', 'love': '信賴高時', 'notice': '注意到人類時',
         'stone': '睏睏的午睡石頭', 'guest': '水缸裡有這個個性的同伴', 'temper': '這個個性的自己', 'tag': '這個標籤的自己'}

def who_and_what(k, T):
    seg = [x for x in re.split(r'[.\[\]]+', k) if x]
    top = seg[0]
    def nm(group, i):
        try: return T.get(f'{group}.{seg[i]}.name') or T.get(f'NAME.{seg[i]}') or seg[i]
        except IndexError: return ''
    who = ''
    if top in ('temper', 'tags', 'souv') and len(seg) > 1: who = T.get(f'{top}.{seg[1]}.name', seg[1])
    elif top in ('item', 'NAME') and len(seg) > 1: who = T.get(f'NAME.{seg[1]}', seg[1])
    elif top in ('decor', 'DECOR') and len(seg) > 1: who = T.get(f'DECOR.{seg[1]}.name', seg[1])
    elif top == 'ENDS' and len(seg) > 1: who = T.get(f'ENDS.{seg[1]}[0]', seg[1])
    elif top == 'voice' and len(seg) > 2 and seg[1] in ('temper', 'guest'): who = T.get(f'temper.{seg[2]}.name', seg[2])
    elif top == 'voice' and len(seg) > 2 and seg[1] == 'tag': who = T.get(f'tags.{seg[2]}.name', seg[2])
    elif top == 'tagCost' and len(seg) > 1: who = T.get(f'tags.{seg[1]}.name', seg[1])
    elif top == 'shop' and len(seg) > 2 and seg[1] == 'items': who = T.get(f'shop.items.{seg[2]}.name', seg[2])
    elif top == 'place' and len(seg) > 1: who = T.get(f'place.{seg[1]}.name', seg[1])
    elif top == 'letter' and len(seg) > 2:
        who = T.get(f'temper.{seg[2]}.name') or T.get(f'tags.{seg[2]}.name') or T.get(f'ENDS.{seg[2]}[0]') or ''
    if top == 'letter' and len(seg) > 2 and not seg[2].isdigit(): seg = seg[:2]
    words = [x for x in seg[1:] if not x.isdigit() and x != '+']
    if top == 'letter': words = words[:1] or words
    what = FIELD.get(words[-1], words[-1]) if words else ''
    if top == 'ENDS': what = '結局名稱' if k.endswith('[0]') else '結局文字'
    if top == 'game' and len(seg) > 2 and seg[1] in ('wand', 'bubble', 'bell', 'ball', 'bucket'):
        what = {'wand': '指揮棒', 'bubble': '氣泡棒', 'bell': '小鈴鐺', 'ball': '軟球', 'bucket': '小水桶'}[seg[1]] + '：' + {
            'wand.meh': '不喜歡的被碰到', 'bucket.meh': '不喜歡的游到水桶', 'bucket.placed': '放好之後', 'bell.meh': '不喜歡的找到了', 'ball.meh': '3 下'}.get(seg[1] + '.' + seg[2], what)
    if top == 'voice' and len(seg) > 1: what = '心聲・' + VOICE.get(seg[1], seg[1])
    if top == 'shop' and words and words[-1] == 'name': what = '商品名稱' if 'items' in k else '名牌（角色名）'
    if top == 'place': what = {'name': '名牌（地點名稱）', 'desc': '說明', 'find': '比較容易撿到什麼'}.get(words[-1], what)
    if top == 'map': what = {'title': '地圖標題', 'go': '選取後的名牌：前往', 'back': '選取住所後的名牌：回家', 'locked': '還沒開放的標示'}.get(words[-1], what)
    if top == 'NAME': what = '名字'
    if top in ('doll', 'player'):   # v0.35 紙娃娃：欄位名稱自己一套（不用共用的 FIELD，免得 back、up 被當成別的意思）
        sub = seg[1] if len(seg) > 1 else ''
        if sub == 'parts': what = '部件名稱：' + words[-1]
        elif sub == 'emos': what = '表情名稱：' + words[-1]
        elif sub == 'tabs': what = '玩家設定的頁籤'
        else: what = DOLL_FIELD.get(top + '.' + words[-1], words[-1])
    if top == 'special': what = {'who': '說明文裡的「誰」（代入 {who}）', 'why': '說明文（通用，{who}＝誰）', 'whyTag': '說明文（依標籤）', 'whyTemp': '說明文（依個性）'}.get(seg[1], what)
    if top == 'special' and seg[1] == 'whyTag' and len(seg) > 2: who = T.get(f'tags.{seg[2]}.name', seg[2])
    if top == 'special' and seg[1] == 'whyTemp' and len(seg) > 2: who = T.get(f'temper.{seg[2]}.name', seg[2])
    if top == 'hall' and seg[1] == 'who': what = '名牌（角色名）'
    if top == 'hall' and seg[1] == 'larvaGot': who, what = '背景的小球', '戳背景的小球送你道具（{item}＝道具名）'
    if top == 'hall' and seg[1] == 'larvaSay' and len(seg) > 2: who, what = T.get(f'hall.who.{seg[2]}', seg[2]), '小球送道具時，這層的人說的話（接在「獲得…」下一行；沒人站著就不說）'
    if top == 'chat' and len(seg) > 1:
        CH = {'style': '雜誌染色・聊天框「外殼」列的標題', 'styleOne': '雜誌染色・按鈕：單色', 'styleV': '雜誌染色・按鈕：上下', 'styleH': '雜誌染色・按鈕：左右',
              'soft': '雜誌染色・按鈕：柔和（漸層）', 'split': '雜誌染色・按鈕：分色', 'magTalk': '雜誌染色・兩邊都選了顏色時（{mag} 雜誌名、{a}{b} 哪兩邊、{c}{c2} 顏色）',
              'magTalkOne': '雜誌染色・只選一邊時（{mag}、{a} 哪一邊、{c}）', 'magReact': '雜誌染色・小球的反應（隨機）', 'done2': '雜誌染色・一邊染好（{a} 哪一邊、{c}）',
              'doneTwo': '雜誌染色・兩邊都染好，變成兩色（{a}{c}{b}{c2}）', 'styleSet': '雜誌染色・只換樣式時（{s}＝例如「柔和的上下兩色」）', 'toastTwo': '雜誌染色・變成兩色時的浮動提示'}
        if seg[1] in CH:
            n = re.search(r'（第 \d+ 則）$', what)
            who, what = '雜誌染色', CH[seg[1]] + (n.group(0) if n and seg[1] == 'magReact' else '')
        if seg[1] == 'side' and len(seg) > 2:
            who, what = '雜誌染色', ('上下' if seg[2] == 'v' else '左右') + '的兩邊名稱（' + ('第 1 個＝上／左' if k.endswith('[0]') else '第 2 個＝下／右' if k.endswith('[1]') else '不要新增') + '）'
    if top == 'shop' and len(seg) > 1 and seg[1] in ('chat', 'sceneLarva', 'chatBtn', 'goodsBtn', 'larvaGive'):
        n = re.search(r'（第 \d+ 則）$', what); n = n.group(0) if n else ''
        who, what = '言盡', {'chat': '閒聊畫面：打開時言盡說的話（隨機）', 'sceneLarva': '閒聊畫面：戳背景的小球（隨機）', 'chatBtn': '按鈕：閒聊', 'goodsBtn': '按鈕：從閒聊回到商品', 'larvaGive': '閒聊畫面：小球送東西時言盡說的話（接在「獲得…」下一行）'}[seg[1]] + n
    if top == 'misc' and len(seg) > 1:
        MS = {'defPlayer': '沒填名字時的玩家名', 'defLarva': '小球名字的預設值', 'dayLabel': '左上角的日期（{d}＝第幾日）', 'notes': '筆記欄的標題', 'notesTemp': '筆記欄：個性', 'notesLike': '筆記欄：喜好',
              'unknown': '筆記欄：還不知道的喜好', 'water': '水缸角落的水質（{w}）', 'waterNum': '水質數值（{d} 污、{p} 酸鹼）', 'waterUnknown': '沒有檢測儀時的水質', 'custom': '色票最後一格（自訂）',
              'customColor': '自訂顏色（說明文字）', 'nick': '暱稱輸入框（說明文字）', 'evTitle': '事件框的標題', 'ok': '事件框的預設按鈕', 'grete': '格蕾特提示框的標題與名牌', 'giftToast': '收到禮物時的浮動提示（{name}）',
              'endArm': '結束今日：按第一下之後', 'endArmAp': '結束今日：按第一下之後（還有行動時，{n}）', 'wipeArm': '清除存檔：按第一下之後', 'wipe': '清除存檔按鈕',
              'sumTime': '摘要表：時間', 'sumDays': '摘要表：存活天數（{day}）', 'sumLike': '摘要表：喜歡', 'sumColor': '摘要表：色彩', 'sumTwo': '摘要表：雜誌兩色的第二色',
              'sumByChat': '摘要表：顏色是聊天染的', 'sumDyed': '摘要表：核心染上代表色', 'sumNatural': '摘要表：核心是自然的顏色', 'sumPlain': '摘要表：外殼沒有染色', 'sumV': '摘要表：上下', 'sumH': '摘要表：左右', 'sumSaved': '摘要表下面的備註',
              'colorSuffix': '聊天框：顏色名後面的字', 'none': '聊天框：還沒選顏色', 'partAll': '聊天框：全部設定', 'partCore': '聊天框：設定核心', 'partShell': '聊天框：設定外殼', 'core': '聊天框：核心',
              'shell': '聊天框：外殼', 'infoColor': '聊天框：單色時的顏色欄', 'things': '聊天染色：顏色沒有對應東西時', 'styleName': '雜誌染色：樣式名稱（{soft}{style}）',
              'colName': '收藏品表頭：名稱', 'colDesc': '收藏品表頭：說明', 'colKind': '收藏品表頭：種類', 'colShow': '收藏品表頭：顯示', 'colSrc': '收藏品表頭：來源', 'colCount': '收藏品表頭：數量', 'showInTank': '裝飾勾選框（說明文字）',
              'rename': '改名按鈕（說明文字）', 'newName': '改名輸入框（說明文字）', 'saveName': '儲存名字（說明文字）', 'cancelName': '取消改名（說明文字）', 'rowInfo': '小球那一列：第幾日｜日期｜照顧者',
              'rowTags': '小球那一列：標籤', 'rowLike': '小球那一列：喜好（{g}{t}）', 'guestOn': '小球們：放入水缸', 'guestOff': '小球們：離開水缸', 'noLarva': '小球們：還沒有小球',
              'mergeOk': '上傳進度成功（{n}）', 'mergeBad': '上傳進度失敗', 'wiped': '清除存檔之後'}
        if seg[1] in MS: what = MS[seg[1]]
        if seg[1] == 'collTabs' and len(seg) > 2: what = '收藏品分頁名稱'
    if top == 'pv' and len(seg) > 1:
        PS = {'noList': '圖鑑裡沒有可觀察的小球', 'hi': '進入觀察水缸', 'join': '小球飄進來（{name}）', 'leave': '小球飄出去（{name}）', 'transOn': '翻譯打開', 'transOff': '翻譯關掉', 'none': '水缸裡還沒有小球',
              'sel': '左上的按鈕（{n}{max}）', 'trans': '翻譯按鈕（{s}＝開／關）', 'on': '開', 'off': '關', 'transTitle': '翻譯按鈕（說明文字）', 'watchOn': '選擇小球：放入觀察', 'watchOff': '選擇小球：取消觀察', 'stat': '選擇小球：已選幾隻（{n}{max}）'}
        if seg[1] in PS: who, what = '觀察水缸', PS[seg[1]]
    if top == 'bag' and len(seg) > 1 and seg[1] == 'decorHead': what = '物品欄：裝飾的分類標題'
    if top == 'hall' and seg[1] == 'knownHi': who, what = '交還過的小球', '在大樓背景出現，戳的第一下（通用；{name}＝小球名字）'
    if top == 'hall' and seg[1] == 'knownHiTemp' and len(seg) > 2: who, what = T.get(f'temper.{seg[2]}.name', seg[2]), '交還過的小球，戳的第一下（依個性，沒寫的用通用）'
    if top == 'hall' and seg[1] == 'larvaPoke': who, what = '背景的小球', '戳背景的小球（沒有送道具時）' + (re.search(r'（.*）$', what).group(0) if re.search(r'（第 \d+ 則）$', what) else '')
    if top in ('item', 'decor') and len(words) == 1: what = '說明（收藏頁）'
    if top == 'pages' or ('pages' in k and words and words[-1] == 'name'): what = what.replace('名字', '名牌（圖片下方）')
    if re.search(r'pages\[(\d+)\]', k): what = f"第 {int(re.search(r'pages\[(\d+)\]', k).group(1)) + 1} 頁・" + what
    if k.endswith('[+]'): what = '（新增一則：寫在右邊）'
    elif re.search(r'\[\d+\]$', k) and top not in ('ENDS', 'CNAME', 'intro'): what += f"（第 {int(re.search(r'(\d+)\]$', k).group(1)) + 1} 則）"
    return who, what

# ---------------------------------------------------------------- 舊總表的「對象／情境」說明
def old_context(path):
    ctx = {}
    if not path or path == '-' or not os.path.exists(path): return ctx
    wb = openpyxl.load_workbook(path)
    for ws in wb:
        head = None
        for r in ws.iter_rows(min_row=1, max_row=12):
            vals = [c.value for c in r]
            if '程式位置（key）' in vals: head = (r[0].row, vals); break
        if not head: continue
        row0, vals = head
        ck, cw, cc = vals.index('程式位置（key）'), (vals.index('對象') if '對象' in vals else None), (vals.index('情境') if '情境' in vals else None)
        for r in ws.iter_rows(min_row=row0 + 1, values_only=True):
            if not any(v is not None and str(v).strip() for v in r): break
            k = r[ck] if ck < len(r) else None
            if not k or not isinstance(k, str): continue
            keys = [k]
            if '／' in k:
                base, first = k.rsplit('.', 1) if '.' in k.split('／')[0] else ('', k)
                parts = first.split('／')
                keys = [f'{base}.{p}' for p in parts]
            for kk in keys:
                ctx[kk] = (r[cw] if cw is not None else None, r[cc] if cc is not None else None)
    return ctx

# ---------------------------------------------------------------- 參考資料（數值）：用 node 跑遊戲資料檔取得
def game_data(root):
    snip = os.path.join(root, '.textsheet_tmp.js')
    open(snip, 'w').write("console.log('@@'+JSON.stringify({TEMPERS,TAGS,TAG_ODDS,TAG_CLASH,SOUV_SRC,SOUV_RULE,ASSOC,HALL_FLOORS,LOBBY_NPC,"
        "DAY_RULE,WATER_RULE,ACT_RULE,END_RULE,OUT_ITEMS,NAME,PLACES,GRETE_RULE,GRETE_MEET,CHAT_RULE,LETTER_RULE,HALL_RULE,NPC_HOP,HEART_RULE,SPECIAL_RULE,SHOP_ITEMS,SHOP_SCENE,SHOP_SHOW,GAME_RULE,GAME_LIKE,ACH_PT,"
        "ACH:ACH.map(a=>({id:a.id,cat:a.cat,heart:a.heart,pt:achPts(a),wear:a.wear||''})),VERSION}));process.exit(0);")
    try:
        out = subprocess.run(['node', os.path.join(root, 'tools/test_harness.js'), root, snip], capture_output=True, text=True).stdout
    finally:
        os.remove(snip)
    line = [l for l in out.splitlines() if l.startswith('@@')][-1]
    return json.loads(line[2:])

# ---------------------------------------------------------------- 寫總表
F = 'Arial'
C_HEAD = PatternFill('solid', fgColor='1F4E5F'); C_GROUP = PatternFill('solid', fgColor='DCE9EE')
C_NEW = PatternFill('solid', fgColor='FFF2CC'); C_ADD = PatternFill('solid', fgColor='EEF7E8'); C_REF = PatternFill('solid', fgColor='F3F3F3')
THIN = Border(bottom=Side(style='thin', color='D0D7DB'))
WRAP = Alignment(wrap_text=True, vertical='top')
COLS = [('分組', 16), ('對象', 12), ('情境', 22), ('目前文字', 58), ('代入字', 14), ('程式位置（key）', 24), ('你的新文字', 58), ('使用的圖片', 20), ('換人物圖（填檔名）', 20)]
PIC_NAME = {'chr': '人物', 'bg': '背景', 'item': '道具'}

def title(ws, t, sub):
    ws['A1'] = t; ws['A1'].font = Font(name=F, bold=True, size=14)
    ws['A2'] = sub; ws['A2'].font = Font(name=F, size=10, color='555555'); ws['A2'].alignment = Alignment(wrap_text=False)

# 不在事件頁、但畫面上有人物的台詞：寫出用哪張圖（只顯示，要換請改 js/data/hall.js 的 pokeAlt）
def pic_of(k, D):
    m = re.match(r'^hall\.poke\.(\w+)\[(\d+)\]$', k)
    if m and D and 'HALL_FLOORS' in D:
        F_ = D['HALL_FLOORS'].get(m.group(1)) or {}; ch = F_.get('chr') or []; i = int(m.group(2))
        if not ch: return None
        if F_.get('pokeAlt') is not None: return f"人物：{ch[1] if i in F_['pokeAlt'] and len(ch) > 1 else ch[0]}"
        return f"人物：{'／'.join(ch)}（輪流）"
    SC = (D or {}).get('SHOP_SCENE') or {}
    m = re.match(r'^shop\.poke\[(\d+)\]$', k)
    if m: return '人物：' + ('yanjin_2' if int(m.group(1)) in (SC.get('pokeAlt') or [2]) else 'yanjin_1') + '（閒聊畫面）'
    m = re.match(r'^shop\.chat\[(\d+)\]$', k)
    if m: return '人物：' + ('yanjin_2' if int(m.group(1)) in (SC.get('chatAlt') or []) else 'yanjin_1') + '\n背景：place_ruins_in（閒聊畫面）'
    if re.match(r'^shop\.(sceneLarva\[|larvaGive$)', k): return '人物：yanjin_1\n背景：place_ruins_in（閒聊畫面）'
    m = re.match(r'^hall\.(visit|visitPoke)\.(\w+)\[(\d+)\]$', k)        # 1F 的訪客
    if m and D and 'LOBBY_NPC' in D:
        N_ = D['LOBBY_NPC'].get(m.group(2)) or {}; ch = N_.get('chr') or []
        if ch: return '人物：' + (ch[1] if m.group(1) == 'visitPoke' and int(m.group(3)) in (N_.get('pokeAlt') or []) else ch[0]) + '\n背景：hall_lobby'
    if k.startswith('special.') and k.split('.')[1] in ('idle', 'reserved'): return '人物：silence_1（預約後 silence_2）' if k.split('.')[1] == 'reserved' else '人物：silence_1'
    if re.match(r'^hall\.(joan\[|up\.|upNo$|upMax$)', k): return '人物：joan_1'
    m = re.match(r'^hall\.larvaSay\.(\w+)$', k)
    if m and D and 'HALL_FLOORS' in D: return '人物：' + ((D['HALL_FLOORS'].get(m.group(1)) or {}).get('chr') or ['—'])[0]
    if re.match(r'^hall\.lobbyGrete', k): return '人物：grete_1'
    return None

def text_table(ws, rows, start, T, ctx, D=None):
    for i, (h, w) in enumerate(COLS, 1):
        c = ws.cell(start, i, h); c.font = Font(name=F, bold=True, color='FFFFFF'); c.fill = C_HEAD; c.alignment = WRAP
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = ws.cell(start + 1, 4)
    r = start + 1; group = None
    for row in rows:
        if row['group'] != group:
            group = row['group']
            for i in range(1, len(COLS) + 1): ws.cell(r, i).fill = C_GROUP
            ws.cell(r, 1, group).font = Font(name=F, bold=True); r += 1
        who, what = who_and_what(row['key'], T)
        o = ctx.get(row['key'])
        if o and (o[0] in SHEETS or o[1] == group): o = None          # 舊總表裡誤填成分頁名／分組名的說明不要沿用
        if o and o[1] and '言盡的名牌' in str(o[1]) and not row['key'].startswith('shop.'): o = None   # 舊總表誤標（special.who 等）不要沿用
        live = who and any(k.endswith('.name') and k.split('.')[0] in ('temper', 'tags') and v == who for k, v in T.items())   # 個性、標籤的名字以遊戲現在的為準（改過名的不要被舊總表蓋掉）
        if o and o[0] and o[0] not in ('全部', '-') and not live and not row['key'].startswith('souv.'): who = o[0]   # 禮物的對象＝禮物現在的名字（改名後要跟著變）
        if o and o[1] and not re.search(r'・[A-Za-z]+$', str(o[1])) and not re.fullmatch(r'[A-Za-z][A-Za-z0-9]*(（第 \d+ 則）)?', str(o[1])): what = o[1]
        m = re.match(r'^hall\.up\.(\d+)$', row['key'])
        if m: who, what = '瓊', f'升到心等 Lv{m.group(1)} 時說的話'
        if row['key'] == 'hall.arrive': what = '到達異生會大樓'
        vals = [group, who, what, row['v'], '、'.join(dict.fromkeys(re.findall(r'\{\w+\}', row['v']))), row['key'], None]
        for i, v in enumerate(vals, 1):
            c = ws.cell(r, i, v); c.alignment = WRAP; c.border = THIN
            c.font = Font(name=F, size=10, color='888888') if i in (1, 5, 6) else Font(name=F, size=11)
        ws.cell(r, 7).fill = C_ADD if row['key'].endswith('[+]') else C_NEW
        pic = row.get('pic') or pic_of(row['key'], D)
        if pic:
            c = ws.cell(r, 8, '\n'.join(f'{PIC_NAME[k]}：{v}' for k, v in pic.items() if k in PIC_NAME) if isinstance(pic, dict) else pic)
            c.alignment = WRAP; c.border = THIN; c.font = Font(name=F, size=10, color='555555')
            if isinstance(pic, dict) and 'chr' in pic: ws.cell(r, 9).fill = C_NEW; ws.cell(r, 9).border = THIN   # 黃底＝可以換人物圖
        if row['kind'] == 'dialog': ws.cell(r, 3).value = (str(what).replace('｜對話：每行「說話者：內容」', '') + '｜對話：每行「說話者：內容」')   # 舊總表帶回來的說明已經有這段，先拿掉再加一次（不然每次 build 會越疊越長）
        r += 1
    return r

def ref_table(ws, r, head, cols, data, widths=None):
    ws.cell(r, 1, head).font = Font(name=F, bold=True, size=12); r += 1
    for i, h in enumerate(cols, 1):
        c = ws.cell(r, i, h); c.font = Font(name=F, bold=True, color='FFFFFF'); c.fill = C_HEAD; c.alignment = WRAP
    r += 1
    for d in data:
        for i, v in enumerate(d, 1):
            c = ws.cell(r, i, v); c.alignment = WRAP; c.font = Font(name=F, size=10); c.fill = C_REF; c.border = THIN
        r += 1
    return r + 1

def ref_sheet(ws, D, T):
    """8 數值參考：從遊戲常數自動產生（DAY_RULE、ACT_RULE…）。「你的調整」欄給使用者寫想改成多少（不會自動套回）"""
    def nm(group, k): return T.get(f'{group}.{k}.name', k)
    def pct(x): return f'{round(x * 100)}%'
    title(ws, f'異種幼體養成模擬器・設定總表｜數值參考（遊戲 {D.get("VERSION", "")}，自動產生）',
          '每次產生總表都會從程式重新讀數字。想調整：在黃色「你的調整」欄寫想要的數字，傳回來時跟 Claude 說，程式不會自動套用這一欄。')
    for i, w in enumerate([26, 70, 26, 30], 1): ws.column_dimensions[get_column_letter(i)].width = w
    r = 4
    def sec(head, rows):
        nonlocal r
        ws.cell(r, 1, head).font = Font(name=F, bold=True, size=12); r += 1
        for i, h in enumerate(['項目', '目前數值', '程式位置', '你的調整'], 1):
            c = ws.cell(r, i, h); c.font = Font(name=F, bold=True, color='FFFFFF'); c.fill = C_HEAD
        r += 1
        for row in rows:
            for i, v in enumerate(row, 1):
                c = ws.cell(r, i, v); c.alignment = WRAP; c.font = Font(name=F, size=10); c.border = THIN
            ws.cell(r, 4).fill = C_NEW; r += 1
        r += 1
    DR, WR, AR, ER = D['DAY_RULE'], D['WATER_RULE'], D['ACT_RULE'], D['END_RULE']
    tg = lambda k: nm('tags', k)
    sec('每日結算（每天換日時，照順序）', [
        ('① 飽食減少', f"每天 −{DR['sat']['normal']}（{tg('glutton')} −{DR['sat']['glutton']}、{tg('smalleat')} −{DR['sat']['smalleat']}）", 'DAY_RULE.sat'),
        ('① 污染增加', f"每天 +{DR['dirt']['normal']}（{tg('clean')} +{DR['dirt']['clean']}）", 'DAY_RULE.dirt'),
        ('① 酸鹼度飄移', f"每天隨機 ±{DR['ph']['drift'] / 2:g}，再往遠離 7 的方向偏 {DR['ph']['bias']:g}；{tg('clean')}飄移 ×{DR['ph']['cleanMul']:g}；範圍 {DR['ph']['min']}～{DR['ph']['max']}", 'DAY_RULE.ph'),
        ('② 生命（飽食）', f"飽食<{DR['lifeSat']['starve']}：{DR['lifeSat']['starveD']}｜<{DR['lifeSat']['hungry']}：{DR['lifeSat']['hungryD']}｜否則 +{DR['lifeSat']['okD']}", 'DAY_RULE.lifeSat'),
        ('② 生命（水質）', f"嚴重 {DR['lifeWater']['severeD']}｜差 {DR['lifeWater']['badD']}｜否則 +{DR['lifeWater']['okD']}；{tg('frail')}時負的變化 ×{DR['frailMul']:g}", 'DAY_RULE.lifeWater、frailMul'),
        ('水質「差」', f"污染>{WR['bad']['dirt']} 或 |pH−7|>{WR['bad']['ph']:g}（{tg('frail')}：>{WR['frailBad']['dirt']}／>{WR['frailBad']['ph']:g}）", 'WATER_RULE'),
        ('水質「嚴重」', f"污染>{WR['severe']['dirt']} 或 |pH−7|>{WR['severe']['ph']:g}（{tg('frail')}：>{WR['frailSevere']['dirt']}／>{WR['frailSevere']['ph']:g}）", 'WATER_RULE'),
        ('③ 信賴', f"飽食≥{DR['trust']['sat']} 且生命>{DR['trust']['life']}：+{DR['trust']['up']}；否則 {DR['trust']['down']}", 'DAY_RULE.trust'),
        ('③ 標籤的代價', f"{tg('playful')} {DR['tagCost']['playfulDays']} 天沒玩 −{DR['tagCost']['playful']}｜{tg('lovey')}當天沒玩 −{DR['tagCost']['lovey']}｜{tg('clean')}污染>{DR['tagCost']['cleanDirt']} −{DR['tagCost']['clean']}｜{tg('vain')}戴裝扮 +{DR['tagCost']['vain']}、沒戴 −{DR['tagCost']['vain']}", 'DAY_RULE.tagCost'),
        ('④ 核心染上代表色', f"第 {DR['color']['day']} 日起，信賴≥{DR['color']['trust']}、互動≥{DR['color']['bond']}、生命≥{DR['color']['life']}", 'DAY_RULE.color'),
        ('⑤ 提前消逝', '生命≤0 → END-07', 'js/settle.js'),
    ])
    AW, AF, AP, AO = AR['water'], AR['feed'], AR['play'], AR['out']
    LOOT = {'food': '海草湯', 'snack': '零食', 'agent': '換水劑', 'toy': '玩具'}
    loot = '｜'.join(f"{T.get(f'place.{k}.name', k)}：" + '、'.join(f"{LOOT.get(a, a)} {b}" for a, b in v['loot'].items()) for k, v in D['PLACES'].items() if v.get('loot'))
    sec('行動', [
        ('換水', f"污染 −{AW['dirt']}（最低 {AW['min']}）、pH 往 7 靠 {pct(AW['ph'])}；同一天第二次換水生命 −{AW['overLife']}", 'ACT_RULE.water'),
        ('餵食', f"海草湯飽食 +{AF['food']}、零食 +{AF['snack']}（{tg('smalleat')} ×{AF['smalleatMul']:g}）｜喜歡的零食信賴 +{AF['favTrust']}、普通 +{AF['okTrust']}（再乘個性倍率）", 'ACT_RULE.feed'),
        ('吃撐', f"飽食>{AF['full']}（{tg('glutton')}>{AF['fullGlutton']}）還硬塞：生命 −{AF['overFood']}（海草湯）／−{AF['overSnack']}（零食）", 'ACT_RULE.feed'),
        ('不喜歡的零食', f"飽食≤{AF['dislikeSat']} 才勉強吃（飽食 +{AF['dislikeAmt']}），否則推開（還是會消耗）", 'ACT_RULE.feed'),
        ('玩耍', f"最愛的玩具信賴 +{AP['fav']}、{tg('playful')} +{AP['playful']}、普通 +{AP['meh']}（再乘個性倍率）；{tg('scholar')} ×{AP['scholarMul']:g}", 'ACT_RULE.play'),
        ('出門', f"帶回 {D['OUT_ITEMS']} 件；水質檢測儀 {pct(AO['kitChance'])}（第 {AO['kitSure']} 次出門起必得）；背景裝飾 {pct(AO['decor'])}", 'ACT_RULE.out、OUT_ITEMS'),
        ('出門的戰利品權重', loot, 'PLACES.loot'),
    ])
    sec('個性', [(nm('temper', k), f"速度 {v['speed']:g}｜信賴倍率 {v['trustGain']:g}｜喜歡加成 {v['favGain']:g}｜探索型 {'是' if v.get('explorer') else '否'}", 'TEMPERS') for k, v in D['TEMPERS'].items()])
    sec('結局條件（由上到下第一個符合的）', [
        ('END-05', '核心被聊天染成代表色以外的顏色', 'js/endings.js'),
        ('END-06', f"生命<{ER['sadLife']} 或 信賴<{ER['sadTrust']}", 'END_RULE'),
        ('END-02', f"信賴≥{ER['bondTrust']} 且 互動≥{ER['bondN']}", 'END_RULE'),
        ('END-03', f"探索≥{ER['explore']} 且是探索型個性", 'END_RULE'),
        ('END-04', f"生命≥{ER['lonerLife']} 且 互動≤{ER['lonerBond']}", 'END_RULE'),
        ('END-01', '其他', ''),
    ])
    TO = D['TAG_ODDS']
    sec('標籤', [('每隻的標籤數', f"{pct(TO['none'])} 無、{pct(TO['one'])} 一個、{pct(1 - TO['none'] - TO['one'])} 兩個", 'TAG_ODDS')] +
        [(tg(k), f"權重 {v['weight']}" + ('（停用）' if v.get('off') else '') + ('（需要有消逝過的小球）' if v.get('needsLost') else ''), 'TAGS') for k, v in D['TAGS'].items()] +
        [('互斥組合', '、'.join(f'{tg(a)}×{tg(b)}' for a, b in D['TAG_CLASH']), 'TAG_CLASH')])
    GR, GM, CR, SR, LR = D['GRETE_RULE'], D['GRETE_MEET'], D['CHAT_RULE'], D['SOUV_RULE'], D['LETTER_RULE']
    sec('格蕾特、聊天、禮物、信', [
        ('遇見格蕾特', f"出門每次 {pct(GM['chance'])}；第 {GM['sure']} 次出門起一定遇見；拒絕之後每次 {pct(GM['again'])}", 'GRETE_MEET'),
        ('小助手換水', f"換日後 污染>{GR['waterDirt']} 或 |pH−7|>{GR['waterPh']:g} 就換", 'GRETE_RULE'),
        ('小助手餵食', f"飽食<{GR['feedBelow']} 才餵，最多 {GR['maxFeeds']} 次；飽食<{GR['hungryBelow']} 才會餵普通零食", 'GRETE_RULE'),
        ('聊天染色', f"同一種顏色聊 {CR['need']} 次、接近度≥{CR['near']}；出門遇到聊顏色／雙色事件 {pct(CR['event'])}", 'CHAT_RULE'),
        ('小禮物', f"信賴≥{SR['trust']} 才送；個性禮物 {pct(SR['temper'])}、每個標籤 {pct(SR['tag'])}；每天最多 {SR['maxPerDay']}｜{tg('sneak')}每天溜出去 {pct(SR['sneak'])}、帶禮物 {pct(SR['sneakGift'])}", 'SOUV_RULE'),
        ('畢業小球的信', f"交還滿 {LR['minWeeks']} 輪才會寄；未滿 {LR['stableWeeks']} 輪：期許 {pct(LR['young'])}、道別 {pct(LR['farewell'])}；之後：問候 {pct(LR['normal'])}；每輪最多一封", 'LETTER_RULE'),
    ])
    FL = {'top': '4F', 'f3': '3F', 'f2': '2F', 'lobby': '1F', 'b1': 'B1'}
    HR, HL, SP = D['HEART_RULE'], D['HALL_RULE'], D['SPECIAL_RULE']
    sec('異生會大樓', [
        ('心等升級', '、'.join(f'Lv{k}：♥{v}' for k, v in HR['need'].items()) + f"（最高 Lv{HR['max']}；心是累積的）", 'HEART_RULE.need'),
        ('商店每次擺幾種', '、'.join(f'Lv{k}：{v} 種' for k, v in HR['shop'].items()), 'HEART_RULE.shop'),
        ('特殊委託名單', '、'.join(f'Lv{k}：{v} 隻' for k, v in SP['count'].items()), 'SPECIAL_RULE.count'),
        ('特殊委託的標籤數', '｜'.join(f"Lv{k}：{pct(v['none'])} 無、{pct(v['one'])} 一個" for k, v in SP['odds'].items()), 'SPECIAL_RULE.odds'),
        ('樓層開放', '、'.join(f"{FL.get(k, k)}：Lv{v.get('need', 1)}" + ('（鎖住）' if v.get('lock') else '') for k, v in D['HALL_FLOORS'].items()), 'HALL_FLOORS'),
        ('背景小球', f"每層 {pct(HL['larva'])} 出現；戳了 {pct(HL['gift'])} 送道具（每趟最多 {HL['giftMax']}）；交還過的那隻 {pct(HL['known'])}", 'HALL_RULE'),
        ('大廳有認識的人（訪客，見 LOBBY_NPC）', pct(HL['lobbyNpc']), 'HALL_RULE.lobbyNpc'),
    ])
    cat = lambda c: T.get(f'ach.cats.{c}', c)
    sec(f"成就（{len(D['ACH'])} 個，♥ 合計 {sum(a['heart'] for a in D['ACH'])}）",
        [(T.get(f"ach.list.{a['id']}.name", a['id']), f"{cat(a['cat'])}｜{T.get('ach.list.' + a['id'] + '.cond', '')}｜♥{a['heart']}、{a['pt']} 積分" + (f"＋裝扮 {a['wear']}" if a['wear'] else ''), 'ACH') for a in D['ACH']])
    sec('言盡的商店（積分）',
        [(T.get(f"shop.items.{k}.name", None) or T.get(f'wears.{v.get("wear")}.name', None) or k,
          (f"{v['price']}" if v['price'] else '非賣品') + ('｜固定商品（這一輪用）' if v.get('fixed') else '') + ('｜不在商店擺' if v.get('hidden') else '') + ('｜永久道具' if v.get('tool') else ''), 'SHOP_ITEMS') for k, v in D['SHOP_ITEMS'].items()] +
        [('閒聊畫面的小球', f"出現 {pct(D['SHOP_SCENE']['larva'])}；每次最多送 {D['SHOP_SCENE']['giftMax']} 個", 'SHOP_SCENE')])
    G = D['GAME_RULE']
    GL = {'grace': '開始後幾毫秒才算碰到', 'wandTime': '指揮棒一場', 'bucketTime': '小水桶一場', 'bucketPlaceMax': '放水桶最久等多久', 'bubbleTime': '氣泡棒一場',
          'bellHideMax': '鈴鐺藏起來最久', 'bellSeekMax': '找鈴鐺最久', 'linger': '結束後道具淡出'}
    sec('互動玩耍（毫秒）', [(GL.get(k, k), f'{v}', f'GAME_RULE.{k}') for k, v in G.items()] + [('喜歡的玩具（個性）', '｜'.join(f"{D['NAME'].get(k, k)}：" + '、'.join(nm('temper', t) for t in v) for k, v in D['GAME_LIKE'].items()), 'GAME_LIKE')])
    ws.freeze_panes = 'A4'

def old_ref(path):
    """舊分頁 1 的手寫說明（平常行為、被戳時、效果、揭曉時機…），以 ID 對應"""
    out = {}
    if not path or path == '-' or not os.path.exists(path): return out
    wb = openpyxl.load_workbook(path)
    for ws in wb:
        if not (ws.title.endswith('個性與標籤') or ws.title.endswith('個性') or ws.title.endswith('標籤')): continue
        head = None
        for row in ws.iter_rows(values_only=True):
            vals = list(row)
            if 'ID' in vals or 'id' in vals:
                head = vals; continue
            if head and vals[head.index('ID') if 'ID' in head else head.index('id')]:
                rid = vals[head.index('ID') if 'ID' in head else head.index('id')]
                out[rid] = {h: v for h, v in zip(head, vals) if h}
    return out

def build(root, oldpath, outpath):
    rows, _ = collect(root)
    T = {r['key']: r['v'] for r in rows}
    ctx = old_context(oldpath)
    D = game_data(root)
    ref = old_ref(oldpath)
    for r in rows: r['sheet'], r['group'] = classify(r['key'])

    # 以舊總表為底：保留「互動」「數值參考」兩個手動整理的分頁，其他重建
    if oldpath and oldpath != '-' and os.path.exists(oldpath):
        wb = openpyxl.load_workbook(oldpath)
        keep = []
        for ws in list(wb):
            if ws.title.endswith('互動'): keep.append(ws)
            else: wb.remove(ws)
    else:
        wb = openpyxl.Workbook(); wb.remove(wb.active); keep = []

    sheets = {}
    names = ['0 使用說明'] + [f'{i + 1} {s}' for i, s in enumerate(SHEETS)]
    for n in names: sheets[n] = wb.create_sheet(n)
    for i, ws in enumerate(keep):
        ws.title = f'{len(names) + i} 互動'
        ws.sheet_properties.tabColor = 'BBBBBB'
    refws = wb.create_sheet(f'{len(names) + len(keep)} 數值參考')
    wb._sheets = [sheets[n] for n in names] + keep + [refws]
    ref_sheet(refws, D, T)

    # ---- 0 使用說明
    ws = sheets['0 使用說明']
    title(ws, '異種幼體養成模擬器・設定總表', '這份總表由程式自動產生（tools/textsheet.py），每一條遊戲文字剛好出現一次。')
    guide = [
        ('怎麼改文字', '在黃色的「你的新文字」欄寫新文字，其他欄不用動。改好把整份傳給 Claude，會自動套回遊戲，套完「目前文字」會更新、黃色欄清空。'),
        ('分頁', '1 個性、2 標籤、3 物品與禮物：名字與說明（下方灰底是參考資料：數值、行為、效果）。4 Log：訊息區的文字（含個性、標籤的反應）。5 事件：彈出框的劇情與按鈕（開場、接取委託、格蕾特、結局）。6 介面：按鈕、標題、選單的字。7 互動：手動整理的參考表。8 數值參考：從程式自動產生（v0.30 起），每次都是最新數字；想調整就寫在黃色欄。'),
        ('代入字', '{name}、{item} 這類大括號會在遊戲裡換成名字或物品，新文字裡請保留（「代入字」欄列出這句用到的）。{larva}＝這句話的主角小球，遊戲裡會換成名字（平常是這一輪的小球；同伴被戳、玩耍、觀察水缸時是那一隻；沒有小球的地方顯示「幼體」）。「幼體」兩個字只是一般名詞，不會被換掉。'),
        ('換行', '儲存格裡直接換行（Excel：Alt＋Enter；Mac：Option＋Enter）就是遊戲裡的換行。'),
        ('新增一則', '淺綠色的「（新增一則）」列：寫在右邊就會加進那個清單（遊戲會隨機挑一則）。要一次加好幾則，用「空一行」隔開。'),
        ('刪除一則', '在清單裡某一則的新文字欄寫「（刪除）」。'),
        ('心聲對話', '心聲一格是一整段對話，每行「說話者：內容」，例如「觸肢A：好餓」。說話者可以是本體、觸肢A、觸肢B、觸肢們。'),
        ('使用的圖片', '人物說話的那幾列，右邊會寫這句用哪張圖（人物、背景、道具；檔名＝assets 資料夾裡的圖，不含 .png）。事件頁的人物圖可以換：在黃色的「換人物圖（填檔名）」欄填檔名，例如 joan_2。大樓被戳的台詞、言盡的頭像這些只顯示，要換請直接告訴 Claude。'),
        ('灰色欄', '「分組」「代入字」「程式位置（key）」是給程式對照用的，請不要改。'),
        ('不在這份總表的', '說明頁與更新公告（js/data/about.js、news.js，有排版），開發者面板、物品分類名稱等少數字還寫在程式裡；想改直接告訴 Claude。'),
    ]
    r = 4
    for a, b in guide:
        ws.cell(r, 1, a).font = Font(name=F, bold=True); ws.cell(r, 2, b).font = Font(name=F); ws.cell(r, 2).alignment = WRAP; r += 1
    ws.column_dimensions['A'].width = 16; ws.column_dimensions['B'].width = 100
    r += 1; ws.cell(r, 1, '顏色').font = Font(name=F, bold=True)
    for fill, t in [(C_NEW, '黃色＝你的新文字'), (C_ADD, '淺綠＝新增一則'), (C_GROUP, '淺藍＝分組標題'), (C_REF, '灰色＝參考資料（不會套回程式）')]:
        ws.cell(r, 2, t).fill = fill; ws.cell(r, 2).font = Font(name=F); r += 1
    counts = {s: sum(1 for x in rows if x['sheet'] == s and not x['key'].endswith('[+]')) for s in SHEETS}
    r += 1; ws.cell(r, 1, '文字條數').font = Font(name=F, bold=True)
    ws.cell(r, 2, '、'.join(f'{s} {n}' for s, n in counts.items()) + f'（共 {sum(counts.values())} 條）').font = Font(name=F)

    # ---- 文字分頁
    for i, s in enumerate(SHEETS):
        ws = sheets[f'{i + 1} {s}']
        sub = {'個性': '名字與說明（滑鼠移上去／點一下個性時顯示）。個性在訊息區的反應在「4 Log」。',
               '標籤': '名字與說明。標籤在訊息區的反應在「4 Log」，結局摘要在「5 事件」。',
               '物品與禮物': '物品、裝飾、禮物的名字與收藏頁說明。禮物送出時的文字在「4 Log」。',
               'Log': '遊戲畫面下方訊息區（log）的文字，依情境分組。',
               '事件': '彈出框的劇情（多頁內文、按鈕、選項）與結局。',
               '介面': '按鈕、標題、選單、開關的字。'}[s]
        title(ws, f'{i + 1} {s}', sub)
        order = GROUP_ORDER.get(s)
        srows = [x for x in rows if x['sheet'] == s]
        if order: srows.sort(key=lambda x: order.index(x['group']) if x['group'] in order else 99)
        if s in ('個性', '標籤', '物品與禮物'):
            # 依對象排：同一個對象的名字、說明放在一起
            def ent(x):
                seg = [y for y in re.split(r'[.\[\]]+', x['key']) if y]
                ent_order = {'NAME': 0, 'item': 0, 'DECOR': 1, 'decor': 1, 'souv': 2}.get(seg[0], 0)
                return (ent_order, seg[1] if len(seg) > 1 else '')
            ids = []
            for x in srows:
                e = ent(x)
                if e not in ids: ids.append(e)
            srows.sort(key=lambda x: ids.index(ent(x)))
        end = text_table(ws, srows, 4, T, ctx, D)
        r = end + 2
        if s == '個性':
            data = []
            for tid, t in D['TEMPERS'].items():
                o = ref.get(tid, {})
                flags = '、'.join(n for k, n in [('explorer', '探索型'), ('territory', '有領地'), ('bubbles', '追泡泡'), ('shyPose', '信賴低時縮起來'), ('sleepy', '常躺在缸底')] if t.get(k))
                gift = '、'.join(T.get(f'souv.{g}.name', g) for g, src in D['SOUV_SRC'].items() if src == ['temper', tid])
                data.append([T.get(f'temper.{tid}.name', tid), tid, f"速度 {t['speed']}｜信賴倍率 {t['trustGain']}｜喜歡加成 {t['favGain']}" + (f'｜{flags}' if flags else ''),
                             o.get('平常行為'), o.get('被戳時'), o.get('遇到其他小球時（見分頁 3）') or o.get('遇到其他小球時'), gift])
            ref_table(ws, r, '參考：數值與行為（灰底不會套回程式；想調整直接跟 Claude 說）', ['個性', 'ID', '數值（js/data/temperaments.js）', '平常行為', '被戳時', '遇到其他小球時', '個性禮物'], data)
        if s == '標籤':
            odds = D['TAG_ODDS']; tw = sum(t['weight'] for t in D['TAGS'].values() if not t.get('off'))
            data = []
            for tid, t in D['TAGS'].items():
                o = ref.get(tid, {})
                clash = '、'.join(T.get(f'tags.{b if a == tid else a}.name') for a, b in D['TAG_CLASH'] if tid in (a, b))
                gift = '、'.join(T.get(f'souv.{g}.name', g) for g, src in D['SOUV_SRC'].items() if src == ['tag', tid])
                rule = f"權重 {t['weight']}（有標籤時約 {t['weight'] / tw:.0%}）" + ('｜要有消逝過的小球' if t.get('needsLost') else '') + (f'｜不會和 {clash} 同時出現' if clash else '')
                data.append([T.get(f'tags.{tid}.name', tid), tid, rule, o.get('效果'), o.get('揭曉時機（我的建議）') or o.get('揭曉時機'), o.get('代價／限制'), gift])
            r = ref_table(ws, r, f"參考：出現規則與效果（每隻小球：{odds['none']:.0%} 沒有標籤、{odds['one']:.0%} 一個、{1 - odds['none'] - odds['one']:.0%} 兩個）",
                          ['標籤', 'ID', '出現規則（js/data/tags.js）', '效果', '揭曉時機', '代價／限制', '標籤禮物'], data)
            pts = D['ASSOC']
            ref_table(ws, r, f"參考：交還協會的積分（基本 {pts['returnPts']}＋標籤加分，js/data/assoc.js）", ['標籤', '加分'],
                      [[T.get(f'tags.{k}.name', k), v] for k, v in pts['tagPts'].items()])
        if s == '物品與禮物':
            R_ = D['SOUV_RULE']
            kindName = {'temper': '個性', 'tag': '標籤', 'grad': '畢業小球'}
            data = [[T.get(f'souv.{g}.name', g), g, kindName.get(src[0], src[0]),
                     T.get(f"{'temper' if src[0] == 'temper' else 'tags'}.{src[1]}.name", '寄信（js/letters.js）' if src[0] == 'grad' else src[1])] for g, src in D['SOUV_SRC'].items()]
            r = ref_table(ws, r, '參考：禮物來源', ['禮物', 'ID', '來源類型', '來源'], data)
            ref_table(ws, r, '參考：送禮規則（js/data/souvenirs.js）', ['項目', '數值', '說明'], [
                ['信賴門檻', R_['trust'], '信賴達到才會送禮（正常照顧第 3 日約六成會達到）'],
                ['個性禮物每天機率', R_['temper'], '換日時判斷'], ['標籤禮物每天機率（每個標籤）', R_['tag'], '偷偷七逃不走這個'],
                ['每天最多份數', R_['maxPerDay'], ''], ['偷偷七逃溜出去的機率', R_['sneak'], '發現之前，第 4 日起一定會溜出去'],
                ['溜出去回來帶禮物的機率', R_['sneakGift'], '6 種東西等機率']])
        for col in 'ABCDEFG': pass
    wb.active = 0
    wb.save(outpath)
    print(f'已產生 {outpath}：' + '、'.join(f'{s} {n}' for s, n in counts.items()))

# ---------------------------------------------------------------- 套用新文字
def jsq(v):
    return "'" + v.replace('\\', '\\\\').replace("'", "\\'").replace('\r', '').replace('\n', '\\n') + "'"

def dialog_lit(text):
    pairs = []
    for line in text.replace('\r', '').split('\n'):
        line = line.strip()
        if not line: continue
        m = re.match(r'^([^：:]{1,8})[：:]\s*(.*)$', line)
        if not m: raise ValueError(f'心聲的每一行要寫成「說話者：內容」：{line}')
        pairs.append(f'[{jsq(m.group(1).strip())},{jsq(m.group(2))}]')
    if not pairs: raise ValueError('空的對話')
    return '[' + ','.join(pairs) + ']'

def apply(root, xlsx):
    _, index = collect(root)
    wb = openpyxl.load_workbook(xlsx)
    edits = {}; done = []; problems = []
    for ws in wb:
        head = None
        for r in ws.iter_rows(min_row=1, max_row=12):
            vals = [c.value for c in r]
            if '程式位置（key）' in vals and '你的新文字' in vals: head = (r[0].row, vals); break
        if not head: continue
        row0, vals = head
        ck, cn = vals.index('程式位置（key）'), vals.index('你的新文字')
        cc = vals.index('目前文字') if '目前文字' in vals else None
        cp = vals.index('換人物圖（填檔名）') if '換人物圖（填檔名）' in vals else None
        if cp is not None:                                                     # 換事件頁的人物圖（填 assets 裡的檔名，不含 .png）
            for r in ws.iter_rows(min_row=row0 + 1, values_only=True):
                if not any(v is not None and str(v).strip() for v in r): break
                k = r[ck] if ck < len(r) else None; pic = r[cp] if cp < len(r) else None
                if not k or pic is None or not str(pic).strip(): continue
                pic = str(pic).strip()
                m_ = re.search(r'人物[：:]\s*([\w-]+)', pic)                    # 也接受照「使用的圖片」格式填的（人物：joan_1／背景：…）
                if m_: pic = m_.group(1)
                elif '背景' in pic: continue                                   # 只寫背景＝沒有要換人物
                pic = pic.removesuffix('.png')
                cur = r[vals.index('使用的圖片')] if '使用的圖片' in vals and vals.index('使用的圖片') < len(r) else ''
                if cur and re.search(r'人物[：:]\s*' + re.escape(pic) + r'(?![\w-])', str(cur)): continue   # 和現在一樣＝不用換
                info = index.get(str(k) + '#pic')
                if not info: problems.append(f'{ws.title}｜{k}：這一列沒有人物圖可以換'); continue
                if not glob.glob(os.path.join(root, 'assets', '**', pic + '.png'), recursive=True) + glob.glob(os.path.join(root, 'assets', '**', pic + '.jpg'), recursive=True):
                    problems.append(f'{ws.title}｜{k}：assets 裡找不到 {pic}.png'); continue
                if info['kind'] == 'picnum':
                    if pic not in ('grete_1', 'grete_2'): problems.append(f'{ws.title}｜{k}：格蕾特的事件只能用 grete_1 或 grete_2'); continue
                    lit = '0' if pic == 'grete_1' else '1'
                else: lit = jsq(pic)
                edits.setdefault(info['file'], []).append((info['s'], info['e'], lit)); done.append(f'{ws.title}｜{k}（人物圖 → {pic}）')
        for r in ws.iter_rows(min_row=row0 + 1, values_only=True):
            if not any(v is not None and str(v).strip() for v in r): break     # 文字表結束（下面是灰底參考資料）
            k = r[ck] if ck < len(r) else None; new = r[cn] if cn < len(r) else None
            if not k or new is None or str(new).strip() == '': continue
            new = str(new).replace('\r\n', '\n').strip('\n')
            if k not in index:
                # 自己插一列、編號接在清單後面（例如清單有 4 則，寫 [4]、[5]）＝新增一則
                m = re.match(r'^(.*)\[(\d+)\]$', k)
                if m and m.group(1) + '[+]' in index and int(m.group(2)) >= len(index[m.group(1) + '[+]']['list']['elems']):
                    k = m.group(1) + '[+]'
                else:
                    problems.append(f'{ws.title}｜{k}：程式裡找不到這個位置（可能已經改名或刪除）'); continue
            info = index[k]; fn = info['file']
            cur = r[cc] if cc is not None else None
            if cur is not None and str(cur).replace('\r\n', '\n') == new: continue
            try:
                if new.strip() == '（刪除）':
                    lst = info.get('list')
                    if not lst or info['kind'] not in ('str', 'dialog'): raise ValueError('只有清單裡的一則可以刪除')
                    src = open(os.path.join(root, fn), encoding='utf-8').read()
                    s, e = info['s'], info['e']
                    j = e
                    while j < len(src) and src[j] in ' \t\r\n': j += 1
                    if j < len(src) and src[j] == ',': e = j + 1
                    else:
                        i = s - 1
                        while i > 0 and src[i] in ' \t\r\n': i -= 1
                        if src[i] == ',': s = i
                    edits.setdefault(fn, []).append((s, e, ''))
                elif info['kind'] == 'str':
                    edits.setdefault(fn, []).append((info['s'], info['e'], jsq(new)))
                elif info['kind'] == 'dialog':
                    edits.setdefault(fn, []).append((info['s'], info['e'], dialog_lit(new)))
                else:   # 新增一則（空一行隔開好幾則）
                    if info['kind'] == 'str+' and not re.search(r'\n\s*\n', new):   # 一行一則（短句清單，例如說明文、人物）
                        parts = [p.strip() for p in new.split('\n') if p.strip()]
                    else:   # 空一行隔開好幾則
                        parts = [p.strip('\n') for p in re.split(r'\n\s*\n', new) if p.strip()]
                    lits = [dialog_lit(p) if info['kind'] == 'dialog+' else jsq(p) for p in parts]
                    lst = info['list']
                    pre = ',' if lst['elems'] else ''
                    edits.setdefault(fn, []).append((lst['close'], lst['close'], pre + ','.join(lits)))
                done.append(f'{ws.title}｜{k}')
            except ValueError as ex:
                problems.append(f'{ws.title}｜{k}：{ex}')
    for fn, es in edits.items():
        p = os.path.join(root, fn); src = open(p, encoding='utf-8').read()
        # 同一個位置有好幾則新增時，照總表的順序（後面的先插，才會排在前面那則之後）
        for s, e, t in sorted(es, key=lambda x: (-x[0], -es.index(x))):
            src = src[:s] + t + src[e:]
        open(p, 'w', encoding='utf-8').write(src)
    print(f'套用 {len(done)} 條')
    for d in done: print('  ✓', d)
    for p in problems: print('  ✗', p)

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'build': build(sys.argv[2], sys.argv[3], sys.argv[4])
    elif cmd == 'apply': apply(sys.argv[2], sys.argv[3])
    else: print(__doc__ or open(__file__).read().split('import sys')[0])
