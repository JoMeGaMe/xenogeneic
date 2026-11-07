# 劇情檢查（v0.40.31）：python3 tools/storycheck.py [專案資料夾]
# 檢查 js/story/data/storyscript.js 每一段劇情：觸發、條件、標籤／跳到、說話者、圖片、演出、效果；
# 也檢查遊戲（js/story/data/story.js 的 storyCondCn／storyCondId）和總表工具（tools/storysheet.py）的條件轉換結果一樣。
# 有問題就列出來，回傳 1；全部沒問題回傳 0。改劇情、改條件變數、出新版前都跑一次。
import os, re, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import storysheet as S

def main(root='.'):
    script, names, cmds = S.load(root)
    probs = []
    P = lambda where, msg: probs.append(f'{where}：{msg}')
    npc_img = os.path.join(root, 'assets/npc'); bg_dir = os.path.join(root, 'assets/bg')
    has_img = lambda k: os.path.exists(os.path.join(npc_img, k + '.png'))
    has_bg = lambda k: os.path.exists(os.path.join(bg_dir, k + '.png')) or os.path.exists(os.path.join(bg_dir, k + '.jpg'))
    ids = [e['id'] for e in script]
    for d in sorted(set(i for i in ids if ids.count(i) > 1)): P(d, '事件編號重複')
    conds = set()
    for e in script:
        eid, trig, arg = e['id'], e.get('trig'), str(e.get('arg', ''))
        if trig not in S.TRIG: P(eid, f'觸發「{trig}」不存在')
        c = arg if trig in ('stat', 'chapterEnd') else arg.partition(',')[2]
        if c: conds.add(c)
        for b in S.cond_bad(c): P(eid, f'觸發條件「{b}」看不懂')
        k = arg.partition(',')[0]
        if trig == 'meet':
            w, _, at = k.partition('@')
            if w not in names: P(eid, f'遇到的人「{w}」不存在')
            for a1 in (at.split('|') if at else []):
                if a1 not in cmds: P(eid, f'行程「{a1}」不存在')
        if trig in ('first', 'pick') and k not in cmds and k not in S.FIRST_X: P(eid, f'行程「{k}」不存在')
        if trig == 'alone' and k not in cmds: P(eid, f'行程「{k}」不存在')
        if trig == 'roll':   # 執行行程隨機：行程%機率
            c1, _, p = k.partition('%')
            if c1 not in cmds: P(eid, f'行程「{c1}」不存在')
            if p and not (p.isdigit() and 0 < int(p) <= 100): P(eid, f'機率「{p}」要是 1～100')
        if trig == 'gameOver' and k not in S.GAMEOVER: P(eid, f'遊戲結束的原因「{k}」不存在')
        if trig in ('weekStart', 'weekEnd') and not k.isdigit(): P(eid, f'第幾週「{k}」不是數字')
        tags = [l['tag'] for l in e['lines'] if l.get('tag')]
        for d in sorted(set(t for t in tags if tags.count(t) > 1)): P(eid, f'標籤「{d}」重複')
        for i, L in enumerate(e['lines'], 1):
            at = f'{eid}#{i}'; who = L.get('who', '')
            if who not in ('narr', 'player', 'choice', 'cond') and who not in names and not re.fullmatch(r'[？?]+', who): P(at, f'說話者「{who}」不存在')
            go = L.get('go')
            if go and go != 'end' and go not in tags: P(at, f'跳到「{go}」找不到這個標籤')
            if who == 'choice' and not go: P(at, '選項沒有寫跳到')
            if who == 'cond':
                if not go: P(at, '判定沒有寫跳到')
                if L.get('text'): conds.add(L['text'])
                for b in S.cond_bad(L.get('text', '')): P(at, f'判定的條件「{b}」看不懂')
            bg = L.get('bg')
            if bg and bg != 'black' and not has_bg(bg): P(at, f'背景「{bg}」沒有這張圖')
            for k in ('chr', 'chl'):
                v = L.get(k)
                if v and re.fullmatch(r'larvae:\d', v): continue   # 一群小球
                if not v or v == 'none' or v.startswith('larva'):
                    if v and v.startswith('larva:') and v[6:] not in S.LARVA_POSE: P(at, f'小球姿勢「{v[6:]}」不存在')
                    continue
                base = v.replace('+acc', '')
                if not has_img(base): P(at, f'立繪「{base}」沒有這張圖')
                if '+acc' in v and not has_img(re.sub(r'_[^_]+$', '_acc', base)): P(at, f'立繪「{base}」沒有配件圖')
            for x in [x.strip() for x in re.split(r'[,，、]', L.get('fx', '')) if x.strip()]:
                b0 = x.split('@')[0]
                if who == 'narr' and b0.split(':')[0] in ('hop', 'crouch', 'squat', 'sway', 'fall', 'leaveL', 'leaveR', 'moveRF', 'moveR', 'moveRB', 'moveC', 'moveLF', 'moveL', 'moveLB') and ':' not in b0: P(at, f'旁白的立繪演出／走開「{S._fx_cn(x)}」要寫「:左」或「:右」')
                if x.startswith('scr:'):
                    a, _, b = x[4:].partition('.')
                    if a not in S.SCR or (b and b not in S.SCRTAB): P(at, f'演出「{x}」看不懂')
                elif x.startswith('hl:'):
                    if x[3:] not in S.HL: P(at, f'演出「{x}」看不懂')
                else:
                    b, _, t = x.split('@')[0].partition(':')
                    if b not in S.FX: P(at, f'演出「{x}」看不懂')
                    elif t and b == 'bigFace' and t not in names and not has_img(t): P(at, f'演出「{x}」：人物或圖片不存在')
                    elif t and b == 'helperIn' and not re.fullmatch(r'\d{1,3}%', t): P(at, f'演出「{x}」：露出比例要寫成 數字%')
                    elif t and b not in ('bigFace', 'helperIn') and t not in S.LV_TGT: P(at, f'演出「{x}」：對象「{t}」看不懂（立繪：左、右；小球：左1～4、右1～4）')
            for p in [p.strip() for p in re.split(r'[,，、]', L.get('eff', '')) if p.strip()]:
                m = re.fullmatch(r'fav\.(\w+)[+-]\d+', p)
                if m:
                    if m.group(1) not in names: P(at, f'效果「{p}」：人物不存在')
                elif p == 'gameOver': pass
                elif p.startswith('open.'):
                    if p[5:] not in S.OPEN: P(at, f'效果「{p}」：地點不存在')
                elif not re.fullmatch(r'(' + '|'.join(S.STAT) + r')[+-]\d+', p): P(at, f'效果「{p}」看不懂')
        # 走不到的行（v0.40.69：L06-01 第 1 行多寫了跳到，中間整段播不到）。規則照 stPlay／stCondJump：
        # 一般行有跳到就跳，沒有就下一行；選項＝一排都可能；判定有條件＝成立跳、不成立下一行，沒條件＝一定跳
        ls = e['lines']; n = len(ls)
        if n:
            tg = lambda g: n if g == 'end' else next((j for j, l in enumerate(ls) if l.get('tag') == g), n)
            seen, q = set(), [0]
            while q:
                i = q.pop()
                if i >= n or i in seen: continue
                seen.add(i); L = ls[i]; w = L.get('who', ''); go = L.get('go')
                if w == 'choice':
                    k = i
                    while k < n and ls[k].get('who') == 'choice':
                        seen.add(k); q.append(tg(ls[k]['go']) if ls[k].get('go') else k + 1); k += 1
                    q.append(k) if any(not ls[j].get('go') for j in range(i, k)) else None
                elif w == 'cond':
                    q.append(tg(go) if go else i + 1)
                    if L.get('text'): q.append(i + 1)
                else:
                    q.append(tg(go) if go else i + 1)
            miss = [i + 1 for i in range(n) if i not in seen]
            if miss: P(eid, '走不到第 ' + '、'.join(map(str, miss)) + ' 行（前面的「跳到」把它跳過了）')
    # 遊戲（JS）和總表工具（Python）的條件轉換要一樣：現有的條件＋幾個固定的例子
    tests = sorted(conds | {'fav0.yanjie>0', 'seen.volunteer>0', 'week==2', 'med<3', 'hp>=15,calm>=0'})
    cn_tests = ['好感:言街>0', '原本好感言街>0', '做過:活動中心義工>0', '健康＞＝15', '健康>=15、安心>=0', '週==2', '好感:不存在>0', '體力>3']
    js = S._node(root, '(()=>{const npc=Object.fromEntries(Object.entries(TEXT.story.npc).map(([k,v])=>[k,v.n])),cmd=TEXT.story.cmd;'
                 'return {cn:' + json.dumps(tests, ensure_ascii=False) + '.map(c=>storyCondCn(c,npc,cmd)),'
                 'id:' + json.dumps(cn_tests, ensure_ascii=False) + '.map(c=>storyCondId(c,npc,cmd))}})()')
    for c, j in zip(tests, js['cn']):
        if S._cond_cn(c) != j: P('條件轉換', f'「{c}」遊戲轉成「{j}」，總表工具轉成「{S._cond_cn(c)}」')
    for c, j in zip(cn_tests, js['id']):
        b = []; py = S._cond_id(c, None, b)
        if py != j['code'] or bool(b) != bool(j['bad']): P('條件轉換', f'「{c}」遊戲轉成「{j["code"]}」{j["bad"]}，總表工具轉成「{py}」{b}')
    print(f'檢查 {len(script)} 段劇情、{len(tests)} 個條件：' + ('沒有問題' if not probs else f'{len(probs)} 個問題'))
    for p in probs: print('  ✗', p)
    return 1 if probs else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else '.'))
