# 主線總表的「主線介面」分頁（v0.40.32）：TEXT.story（js/story/data/texts.js 的 STORY_TEXT）的每一條字，附上「出現在哪裡」
# 欄位和設定總表一樣（程式位置（key）／你的新文字），所以套用照舊用 textsheet.apply（storysheet.py apply 會轉過去）
import re
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

F = 'Microsoft JhengHei'
WRAP = Alignment(wrap_text=True, vertical='top')
C_HEAD = PatternFill('solid', fgColor='1F4E5F'); C_GROUP = PatternFill('solid', fgColor='DCE9EE')
C_NEW = PatternFill('solid', fgColor='FFF2CC'); C_ADD = PatternFill('solid', fgColor='EEF7E8')
THIN = Border(bottom=Side(style='thin', color='D0D7DB'))
COLS = [('分組', 16), ('對象', 12), ('出現在哪裡', 34), ('目前文字', 50), ('代入字', 14), ('程式位置（key）', 24), ('你的新文字', 50)]

# 分組的順序＝玩家碰到的順序
GROUPS = ['進入主線', '家（排行程的主畫面）', '行程本', '執行這週', '自由行動（地圖、地點）', '狀態', '收納', '水缸', '系統',
          '劇情播放', '月底評估', '劇情預覽工具（只在預覽頁）']
ONE = {   # 單一一條的說明
    'idleBtn': ('進入主線', '日常模式：心等 4 之後，第 0 日出現的按鈕'),
    'start.title': ('進入主線', '開始主線的確認框：標題'), 'start.body': ('進入主線', '開始主線的確認框：內文'),
    'start.ok': ('進入主線', '開始主線的確認框：開始按鈕'), 'start.cont': ('進入主線', '已經有進度時的按鈕：繼續主線'),
    'week': ('家（排行程的主畫面）', '下方資訊列：第幾週'), 'goal': ('家（排行程的主畫面）', '下方資訊列：這章的目標'),
    'money': ('家（排行程的主畫面）', '下方資訊列：錢'), 'moneyUnit': ('狀態', '「我」頁：錢後面的單位'),
    'greteCall': ('家（排行程的主畫面）', '左上格蕾特頭像的提示（叫她出來）'), 'greteMore': ('家（排行程的主畫面）', '格蕾特對話框下面的小字（點了換一句）'),
    'dayName': ('行程本', '一週七格的星期名稱（週一…）'), 'rnd': ('行程本', '行程效果欄：能力隨機的那種（理貨）'),
    'poor': ('行程本', '錢不夠時，行程變灰的原因'), 'need': ('行程本', '能力不夠時，行程變灰的原因'),
    'fixedTag': ('行程本', '固定日行程（換藥水）右上角的小標籤'), 'fixedPay': ('行程本', '固定日行程的說明：每週哪幾天'),
    'minNote': ('行程本', '固定日行程的說明：本月至少幾次'), 'medCount': ('行程本', '下方：換藥水次數統計（電腦）'),
    'medShort': ('行程本', '下方：換藥水次數統計（手機，兩行）'), 'late': ('行程本', '換藥水次數已經來不及補足時的警告'),
    'tipDay': ('行程本', '格蕾特提示：選到空白的那天'), 'tipSet': ('行程本', '格蕾特提示：那天排好了'),
    'undo': ('行程本', '下方按鈕：復原'), 'ok': ('行程本', '下方按鈕：確定'), 'okToast': ('行程本', '按確定後跳出的提示：全部排滿'),
    'okToastFree': ('行程本', '按確定後跳出的提示：有空白的日子（自由行動）'), 'fixedToast': ('行程本', '點固定日行程時的提示：一次排進那幾天'),
    'encN': ('行程本', '可能遇到好幾個人時的標示（點開看頭像）'),
    'visitBy': ('執行這週', '結果的「人際」那行：日常模式的小球來陪你（沒有數值）'),
    'rowMe': ('執行這週', '每天結果表：玩家那一排'), 'rowLarva': ('執行這週', '每天結果表：小球那一排'), 'rowPpl': ('執行這週', '每天結果表：遇到人那一排'),
    'fav': ('執行這週', '遇到人那一排：好感加多少'), 'favMax': ('執行這週', '遇到人那一排：好感已經到這章上限'),
    'favMeet': ('執行這週', '遇到人那一排：第一次遇到（不顯示數字）'), 'kick': ('執行這週', '4F 被請出去那天的結果小字（空白＝不顯示）'),
    'larvaId': ('狀態', '「小球」頁：小球編號（UM-xxxx）'), 'loading': ('劇情播放', '劇情開始前的讀取畫面'),
    'skip': ('劇情播放', '右上角：跳過按鈕'), 'skipAsk': ('劇情播放', '跳過確認框：標題'), 'skipBody': ('劇情播放', '跳過確認框：說明'),
    'skipYes': ('劇情播放', '跳過確認框：跳過'), 'skipNo': ('劇情播放', '跳過確認框：繼續看'), 'diaryQuit': ('收納', '日記本重看劇情時，右上角的按鈕'),
    'favPop': ('劇情播放', '左下角浮出的好感提示'),
    'start.newGame': ('進入主線', '已經有存檔時：新遊戲按鈕'), 'start.loadGame': ('進入主線', '已經有存檔時：讀取按鈕'),
    'start.menuBody': ('進入主線', '已經有存檔時：選單的說明'), 'start.back': ('進入主線', '新遊戲確認、讀取清單：返回按鈕'),
    'start.newAsk': ('進入主線', '新遊戲確認框：標題'), 'start.newBody': ('進入主線', '新遊戲確認框：說明'),
    'start.loadTitle': ('進入主線', '讀取清單：標題'), 'start.loadNormal': ('進入主線', '讀取清單：一般存檔的小標'),
    'start.autoSlot': ('進入主線', '讀取清單：自動存檔那一格'), 'start.loadFree': ('進入主線', '讀取清單：自由模式存檔的小標'),
    'start.freeNone': ('進入主線', '讀取清單：還沒有自由模式存檔時'),
    'capNote': ('行程本', '讀書的行程：能力最多讀到多少'), 'noBook': ('行程本', '還沒有那本書（不會出現在行程本，備用）'),
    'jobNews': ('行程本', '新的一週開始：有新的打工出現在行程本時，主角自己說的一句（{list}＝打工名稱）'),
    'poorDay': ('執行這週', '排好的花錢行程到那天錢不夠：那天改成自由行動，主角說的一句（{cmd}＝行程名稱）'),
    'freeTag': ('自由模式', '下方資訊列：章名後面'), 'freeCapTalk': ('自由模式', '週結算時錢到上限 3000：主角自己說的一句'),
    'start.freeSlot': ('進入主線', '讀取清單、存中繼存檔：中繼存檔那一格（{n} 第幾格、{ch} 章名、{id} 小球編號、{at} 存檔日期）'), 'start.freeEmpty': ('進入主線', '讀取清單、存中繼存檔：空的中繼存檔格'), 'start.freeLoaded': ('系統', '讀取中繼存檔後的提示'), 'sys.freeSaved': ('系統', '自由模式按儲存：存回中繼存檔的提示'),
    'bag.diaryKinds.main': ('收納', '日記本：主線的小標'), 'bag.diaryKinds.side': ('收納', '日記本：支線的小標'), 'bag.diaryKinds.event': ('收納', '日記本：小事件的小標'),
    'rowBuy': ('執行這週', '結果表：在店裡買到的東西那一排'),
}
PREFIX = [   # 一整組的說明（前綴 → 分組、說明；{x}＝前綴後面那段）
    ('chapter.', '家（排行程的主畫面）', '下方資訊列左邊：章名（第 {x} 章）'),
    ('btn.', '家（排行程的主畫面）', '右側按鈕的文字'), ('ico.', '家（排行程的主畫面）', '右側按鈕圓圈裡的單字'),
    ('grete[', '家（排行程的主畫面）', '叫出格蕾特時她說的話（點一下換下一句，照順序）'),
    ('days[', '行程本', '一週七格的星期（一～日）'), ('cats.', '行程本', '行程的分類頁籤'),
    ('cmd.', '行程本', '行程名稱：行程本、執行這週的標題、地點卡'), ('cmdShort.', '行程本', '手機直放時行程格裡的短名（最多 4 字）'),
    ('note.', '行程本', '行程本裡，這個行程下面的小字'),
    ('item.', '執行這週', '照顧時小框中間浮出的道具字（還沒有圖）'), ('S.', '狀態', '數值名稱：狀態頁、執行結果、提示'),
    ('run.rank.', '執行這週', '每天結果：成功等級'), ('run.', '執行這週', '執行這週的畫面'),
    ('place.', '自由行動（地圖、地點）', '地圖名牌、地點卡'), ('free.scene.', '自由行動（地圖、地點）', '進到大樓時左上的地點名'),
    ('free.out.', '自由行動（地圖、地點）', '大樓裡左上的「回地圖」按鈕'), ('free.floor.', '自由行動（地圖、地點）', '異生會大樓：樓層按鈕左下的樓層'),
    ('free.hub.', '自由行動（白天的家）', '白天的家：最下面的按鈕（另一個顏色）'), ('free.shop.', '自由行動（店）', '店裡的畫面'), ('free.', '自由行動（地圖、地點）', '自由行動的畫面'),
    ('stat.tabs.', '狀態', '狀態的頁籤'), ('stat.', '狀態', '狀態畫面'), ('npc.', '狀態', '人物'),
    ('bag.tabs.', '收納', '收納的頁籤'), ('tank.st.', '水缸', '水缸畫面的描述（照小球的狀態：sleep 睡著｜scared 害怕｜calm 平靜｜close 親近）'), ('bag.', '收納', '收納畫面'), ('tank.', '水缸', '水缸畫面'),
    ('sys.books.', '系統', '設定：畫面配色的選項（永晝＝一直早上、永夜＝一直晚上、隨時間變化＝排行程晚上、白天早上）'), ('sys.', '系統', '系統選單'), ('leave.', '系統', '離開主線的確認框'),
    ('txt.', '系統', '設定：對話顯示方式（預覽頁的清單上也有）'), ('mid.', '章末', '章末劇情播完的畫面：中繼存檔'), ('over.', '遊戲結束', '遊戲結束的黑畫面（負債、月底評估沒過）'),
    ('pv.', '劇情預覽工具（只在預覽頁）', '預覽頁'),
    ('items.', '收納', '道具（初階書）的名字和說明：收納 → 道具'),
]
DETAIL = {   # 一組裡面再細分（key 的最後一段 → 說明）
    'run.head': '每天小動畫上方：第幾週、星期、行程', 'run.tapExec': '小動畫下方提示（執行中）', 'run.tapEnd': '小動畫下方提示（看結果時）',
    'run.skip': '右下按鈕：跳過，直接看一週結果', 'run.done': '七天都跑完時的按鈕', 'run.wait': '還沒輪到的日子', 'run.sumTitle': '週結算框的標題',
    'run.total': '週結算：最下面合計那一列', 'run.ok': '週結算的確定按鈕', 'run.collapse': '疲勞滿了，隔天強制睡覺的說明', 'run.forced': '週結算：累倒那天的小字',
    'stat.title': '標題', 'stat.role': '「我」頁：玩家的身分', 'stat.moneyNote': '「我」頁：錢旁邊的小字', 'stat.larvaNote': '「小球」頁：編號下面的小字',
    'stat.unknown': '「人際」頁：還沒見過的人（目前沒用到：不認識的人不顯示）',
    'bag.title': '標題', 'bag.collEmpty': '收藏品頁：還沒有東西時',
    'bag.diaryEmpty': '日記本：還沒有內容時', 'bag.noItem': '道具頁：還沒有道具時', 'tank.hide': '水缸：點小球後（牠躲起來）', 'tank.peek': '水缸：點小球後（安心夠高，牠貼過來）', 'tank.poke': '水缸：提示可以點小球', 'tank.note': '水缸畫面下面的小字',
    'sys.title': '標題', 'sys.save': '按鈕：儲存', 'sys.load': '按鈕：讀取', 'sys.set': '按鈕：設定', 'sys.leave': '按鈕：離開主線',
    'sys.book': '設定：畫面配色（小標題）', 'sys.now': '設定：使用中的那個後面',
    'sys.slot': '存檔格的名字', 'sys.empty': '空的存檔格', 'sys.slotInfo': '存檔格：存的是哪一週、在哪', 'sys.slotInfoDay': '存檔格：週中途（白天在家）存的', 'sys.saved': '存好時的提示',
    'sys.loaded': '讀好時的提示', 'sys.auto': '存檔／讀取框的說明', 'sys.onlyWeek': '存檔框的說明（存的是週開始）', 'sys.onlyDay': '存檔框的說明（週中途、白天在家時）',
    'leave.title': '標題', 'leave.body': '內文（每週開始時）', 'leave.bodyDay': '內文（週中途、白天在家時）', 'leave.ok': '按鈕：離開', 'leave.cancel': '按鈕：再想想', 'leave.saveFirst': '按鈕：先存檔再離開',
    'txt.title': '小標題', 'txt.type': '選項：一個字一個字出現', 'txt.line': '選項：一整行一起出現',
    'free.tag': '下方資訊列：今天是自由行動', 'free.stat': '下方圓形按鈕：狀態（滑鼠移上去的字；按鈕上是「狀」）', 'free.today': '行程本（週中途）：今天那一格', 'free.todayS': '行程本（週中途、手機）：今天那一格',
    'mid.title': '標題（{ch}＝章名）', 'mid.save': '按鈕：儲存中繼存檔', 'mid.saved': '按鈕：存好以後', 'mid.savedToast': '存好時的提示',
    'over.title': '標題', 'over.load': '按鈕：讀取', 'over.leave': '按鈕：離開主線',
    'pv.title': '清單標題', 'pv.body': '清單說明', 'pv.quit': '（舊）結束預覽按鈕', 'pv.cond': '播放時左下角：判定走了哪一條',
    'pv.condElse': '判定：其他情況', 'pv.condEnd': '判定：跳到結束', 'pv.condNone': '判定：都不符合',
}

def where(key, T):
    """story.xxx → (分組, 對象, 出現在哪裡)"""
    k = key[len('story.'):]
    if k.endswith('[+]'):
        base = k[:-3]
        for p, g, d in PREFIX:
            if base + '[' == p or base.startswith(p.rstrip('[')): return g, '', '（新增一則）' + d
        return '家（排行程的主畫面）', '', '（新增一則）'
    if k in ONE: g, d = ONE[k]; return g, '', d
    m = re.fullmatch(r'npc\.(\w+)\.(n|d)', k)
    if m: return '狀態', T.get(f'story.npc.{m.group(1)}.n', m.group(1)), '人物名字：對話框名牌、人際頁、遇到人' if m.group(2) == 'n' else '人際頁：名字下面的小字'
    m = re.fullmatch(r'place\.(\w+)\.(n|d)', k)
    if m: return '自由行動（地圖、地點）', T.get(f'story.place.{m.group(1)}.n', m.group(1)), '地圖名牌、地點卡標題' if m.group(2) == 'n' else '地點卡的說明'
    m = re.fullmatch(r'(cmd|cmdShort|note|lock|item)\.(\w+)', k)
    if m:
        who = T.get(f'story.cmd.{m.group(2)}', '') if m.group(1) in ('cmd', 'cmdShort', 'note') else T.get(f'story.place.{m.group(2)}.n', '') if m.group(1) == 'lock' else ''
        for p, g, d in PREFIX:
            if k.startswith(p): return g, who, d
    if k in ('chapter.1', 'chapter.2', 'chapter.3'): return '家（排行程的主畫面）', '', f'下方資訊列左邊：章名（第 {k[-1]} 章）'
    for p, g, d in PREFIX:
        if k.startswith(p):
            last = k.split('.')[-1]
            if k in DETAIL: d = d + '：' + DETAIL[k] if DETAIL[k] not in ('標題',) else d + '：標題'
            elif p in ('btn.', 'ico.'):
                return g, T.get('story.btn.' + last, ''), d
            return g, '', d
    return '其他', '', ''

def build_ui_sheet(wb, root, title='主線介面'):
    import textsheet
    rows, _ = textsheet.collect(root)
    T = {r['key']: r['v'] for r in rows}
    st = [r for r in rows if r['key'].startswith('story.') and r['key'] != 'story.days[+]']   # 星期不用新增
    for r in st: r['g'], r['who'], r['where'] = where(r['key'], T)
    st.sort(key=lambda r: GROUPS.index(r['g']) if r['g'] in GROUPS else 99)   # 同一組照程式裡的順序
    ws = wb.create_sheet(title); ws.sheet_properties.tabColor = 'C9A0DC'
    ws.cell(1, 1, '主線介面').font = Font(name=F, bold=True, size=14)
    ws.cell(2, 1, '主線（故事模式）畫面上的字：按鈕、標題、提示、行程名、地點、人物。「出現在哪裡」是這句在畫面的位置。改法和設定總表一樣：在黃色「你的新文字」寫新的，其他欄不用動；{n}、{name} 這類大括號請保留。淺綠的「（新增一則）」寫了就會加一則。').alignment = WRAP
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=len(COLS)); ws.row_dimensions[2].height = 45
    start = 4
    for i, (h, w) in enumerate(COLS, 1):
        c = ws.cell(start, i, h); c.font = Font(name=F, bold=True, color='FFFFFF'); c.fill = C_HEAD; c.alignment = WRAP
        ws.column_dimensions[chr(64 + i)].width = w
    ws.freeze_panes = ws.cell(start + 1, 4)
    r = start + 1; group = None
    for row in st:
        if row['g'] != group:
            group = row['g']
            for i in range(1, len(COLS) + 1): ws.cell(r, i).fill = C_GROUP
            ws.cell(r, 1, group).font = Font(name=F, bold=True); r += 1
        vals = [group, row['who'], row['where'], row['v'], '、'.join(dict.fromkeys(re.findall(r'\{\w+\}', row['v']))), row['key'], None]
        for i, v in enumerate(vals, 1):
            c = ws.cell(r, i, v); c.alignment = WRAP; c.border = THIN
            c.font = Font(name=F, size=10, color='888888') if i in (1, 5, 6) else Font(name=F, size=11)
        ws.cell(r, 7).fill = C_ADD if row['key'].endswith('[+]') else C_NEW
        r += 1
    return ws
