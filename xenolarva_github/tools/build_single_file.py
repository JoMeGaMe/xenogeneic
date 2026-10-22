# 把 index.html + css + js + 圖片 合併成「單一 HTML」(預覽/分享用)。
# 用法：在專案根目錄執行  python tools/build_single_file.py
import re, base64, glob, os, json
html = open('index.html', encoding='utf-8').read()
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
open('game_inline.html', 'w', encoding='utf-8').write(html)
print('OK game_inline.html')
