# 把 index.html + css + js + 圖片 合併成「單一 HTML」(預覽/分享用)。
# 用法：在專案根目錄執行  python tools/build_single_file.py
import re, base64, glob, os, json
html = open('index.html', encoding='utf-8').read()
css = open('css/style.css', encoding='utf-8').read()
html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + css + '</style>')
assets = {os.path.basename(f)[:-4]: 'data:image/png;base64,' + base64.b64encode(open(f, 'rb').read()).decode()
          for f in glob.glob('assets/larva/*.png')}
def inline(m):
    code = open(m.group(1), encoding='utf-8').read()
    if m.group(1).endswith('assets-inline.js'):
        code = 'const ASSETS=' + json.dumps(assets) + ';\n'
    return '<script>\n' + code + '</script>'
html = re.sub(r'<script src="([^"]+)"></script>', inline, html)
open('game_inline.html', 'w', encoding='utf-8').write(html)
print('OK game_inline.html')
