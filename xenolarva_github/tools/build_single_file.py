# 把 index.html + css + js + 圖片 合併成「單一 HTML」(預覽/分享用)。
# 用法：在專案根目錄執行  python tools/build_single_file.py
import re, base64, glob, os, json
html = open('index.html', encoding='utf-8').read()
# v0.40.69：開頭讀取畫面的 data-n＝boot.js 後面有幾個 <script>（進度條用），自動更新 index.html
_m = re.search(r'<script src="js/boot\.js[^"]*"></script>', html)
if _m:
    _n = len(re.findall(r'<script src="', html[_m.end():]))
    _new = re.sub(r'(<div id="boot" data-n=")\d+(")', r'\g<1>%d\g<2>' % _n, html)
    if _new != html:
        html = _new; open('index.html', 'w', encoding='utf-8').write(html); print('index.html：讀取畫面 data-n =', _n)
# v0.40.69 續 15：人物圖（assets/npc）的 png 是原圖，這裡自動轉成同名 .webp（GitHub 版讀 webp，11MB → 2.7MB）。
#   png 比 webp 新（換了圖）才重轉；png 刪掉了，webp 也刪掉
def npc_webp():
    from PIL import Image
    n = 0
    for f in glob.glob('assets/npc/*.png'):
        w = f[:-4] + '.webp'
        if not os.path.exists(w) or os.path.getmtime(w) < os.path.getmtime(f):
            Image.open(f).save(w, 'WEBP', quality=90, method=4); n += 1
    for w in glob.glob('assets/npc/*.webp'):
        if not os.path.exists(w[:-5] + '.png'):
            os.remove(w); n += 1
    if n: print('assets/npc：WebP 更新', n, '個')
try:
    npc_webp()
except ImportError:
    print('沒有 PIL：assets/npc 的 WebP 沒有更新')
# css/ 底下每個 <link> 都內嵌（style.css、theme.css…）；CSS 裡的 url(../assets/…)（字體、框圖）轉成 base64
CSS_MIME = {'.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'}
def css_url(m):
    rel = m.group(2)
    f = os.path.normpath(os.path.join('css', rel))
    mime = CSS_MIME.get(os.path.splitext(f)[1].lower())
    if not mime or not os.path.exists(f):
        return m.group(0)
    return 'url(data:' + mime + ';base64,' + base64.b64encode(open(f, 'rb').read()).decode() + ')'
def inline_css(m):
    css = open(m.group(1), encoding='utf-8').read()
    css = re.sub(r"""url\((['"]?)(\.\./assets/[^'")]+)\1\)""", css_url, css)
    return '<style>\n' + css + '</style>'
html = re.sub(r'<link rel="stylesheet" href="(css/[^"?]+)[^"]*">', inline_css, html)
# 手繪的大背景（不透明、不是像素風）：單一 HTML 裡改存成 JPEG，檔案小很多（原始 png 不動，GitHub 版照樣用 png）
JPEG_IN_SINGLE = ('hall_', 'place_', 'letter_', 'home_')
def enc(f):
    n = os.path.basename(f)[:-4]
    if f.endswith('.png') and os.sep + 'npc' + os.sep in f.replace('/', os.sep):   # 人物立繪（v0.40.16）：單檔版改存 WebP（透明保留、小 4 倍），不然超過預覽頁 16MB 的上限
        if os.path.exists(f[:-4] + '.webp'):   # 續 15：用上面 npc_webp() 轉好的
            return 'data:image/webp;base64,' + base64.b64encode(open(f[:-4] + '.webp', 'rb').read()).decode()
        try:
            from PIL import Image
            import io
            b = io.BytesIO(); Image.open(f).save(b, 'WEBP', quality=90, method=4)
            return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
        except Exception:
            pass
    if f.endswith('.png') and n.startswith(JPEG_IN_SINGLE):
        try:
            from PIL import Image
            import io
            b = io.BytesIO(); Image.open(f).convert('RGB').save(b, 'JPEG', quality=88, optimize=True)
            return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
        except ImportError:
            pass
    return ('data:image/jpeg;base64,' if f.endswith('.jpg') else 'data:image/png;base64,') + base64.b64encode(open(f, 'rb').read()).decode()
# v0.33.5 起 assets/ 分資料夾：遊戲現在用到的這幾個打包進來（bg_hd 大圖、font 不放；字體走 CSS）
ASSET_DIRS = ['larva', 'bg', 'npc', 'letter', 'item', 'wear', 'ui']
assets = {os.path.basename(f)[:-4]: enc(f) for d in ASSET_DIRS for f in glob.glob(f'assets/{d}/*.png') + glob.glob(f'assets/{d}/*.jpg')}
# v0.35：紙娃娃部件（檔名和小球的圖可能撞名，所以鍵是 doll/檔名；js/doll.js 的 dollSrc 會找這個）
assets.update({'doll/' + os.path.basename(f)[:-4]: enc(f) for f in glob.glob('assets/doll/*.png')})
def build(assets_map):
    def inline(m):
        path = m.group(1).split('?')[0]
        code = open(path, encoding='utf-8').read()
        if path.endswith('assets-inline.js'):
            code = 'const ASSETS=' + json.dumps(assets_map) + ';\n'
        return '<script>\n' + code + '</script>'
    h = re.sub(r'<script src="([^"]+)"></script>', inline, html)
    # v0.40.40：index.html 的 CSP（只准 'self' 的程式）擋得掉內嵌程式；單一 HTML 全部是內嵌，拿掉（artifact 由外層的沙盒管）
    h = re.sub(r'<!-- 資安（v0\.40\.40）[\s\S]*?-->\n?', '', h)
    h = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>\n?', '', h)
    return h
open('game_inline.html', 'w', encoding='utf-8').write(build(assets))
print('OK game_inline.html')
# v0.41.0：遊戲頁（artifact）版：圖片不內嵌，改成附加檔案 a/資料夾/檔名（用到才讀，開頭只下載程式）。
#   ASSETS 裡放相對網址（?h＝內容雜湊，換圖時瀏覽器才不會用舊的）。人物立繪的白邊：js/events.js 的 chrOlRun 先 fetch 成 blob 再畫（畫布才能輸出）。
#   輸出 game_artifact.html＋dist_artifact/a/…；
#   dist_artifact/files.json＝發布時 files 要帶的對照表；changed.txt＝和上次比有變的檔案（只重傳這些）。
import hashlib, shutil
EXTERNAL = ASSET_DIRS + ['doll']
DIST = 'dist_artifact'
old_hash = {}
if os.path.exists(os.path.join(DIST, 'hash.json')):
    old_hash = json.load(open(os.path.join(DIST, 'hash.json'), encoding='utf-8'))
shutil.rmtree(os.path.join(DIST, 'a'), ignore_errors=True)
art, files, new_hash = {}, {}, {}
for k, uri in assets.items():
    d = 'doll' if k.startswith('doll/') else next((x for x in ASSET_DIRS if glob.glob(f'assets/{x}/{k}.*')), '')
    if d not in EXTERNAL:
        art[k] = uri; continue
    mime, b64 = uri[5:].split(';base64,')
    data = base64.b64decode(b64)
    ext = {'image/jpeg': 'jpg', 'image/webp': 'webp'}.get(mime, 'png')
    rel = f'a/{d}/{k.split("/")[-1]}.{ext}'
    os.makedirs(os.path.join(DIST, os.path.dirname(rel)), exist_ok=True)
    open(os.path.join(DIST, rel), 'wb').write(data)
    h8 = hashlib.md5(data).hexdigest()[:8]
    art[k] = rel + '?h=' + h8
    files[rel] = os.path.join(DIST, rel)
    new_hash[rel] = h8
open('game_artifact.html', 'w', encoding='utf-8').write(build(art))
json.dump(files, open(os.path.join(DIST, 'files.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
json.dump(new_hash, open(os.path.join(DIST, 'hash.json'), 'w', encoding='utf-8'), indent=0)
changed = [r for r in new_hash if old_hash.get(r) != new_hash[r]]
open(os.path.join(DIST, 'changed.txt'), 'w').write('\n'.join(changed))
print('OK game_artifact.html（%.1fMB）＋附加圖 %d 個（這次有變：%d 個，見 %s/changed.txt）' % (os.path.getsize('game_artifact.html') / 1e6, len(files), len(changed), DIST))
# v0.40.31：順便檢查劇情（條件、標籤、圖片、演出、效果）；有問題只提醒，不擋
import subprocess, sys
subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'storycheck.py'), '.'])
