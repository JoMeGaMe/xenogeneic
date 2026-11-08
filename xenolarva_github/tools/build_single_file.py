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
def inline(m):
    path = m.group(1).split('?')[0]
    code = open(path, encoding='utf-8').read()
    if path.endswith('assets-inline.js'):
        code = 'const ASSETS=' + json.dumps(assets) + ';\n'
    return '<script>\n' + code + '</script>'
html = re.sub(r'<script src="([^"]+)"></script>', inline, html)
# v0.40.40：index.html 的 CSP（只准 'self' 的程式）擋得掉內嵌程式；單一 HTML 全部是內嵌，拿掉（artifact 由外層的沙盒管）
html = re.sub(r'<!-- 資安（v0\.40\.40）[\s\S]*?-->\n?', '', html)
html = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>\n?', '', html)
open('game_inline.html', 'w', encoding='utf-8').write(html)
print('OK game_inline.html')
# v0.40.31：順便檢查劇情（條件、標籤、圖片、演出、效果）；有問題只提醒，不擋
import subprocess, sys
subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'storycheck.py'), '.'])
