# 用環境內建的 Chromium（Playwright）截圖檢查版面：python3 tools/screenshot.py <game_inline.html> <輸出資料夾>
# 會截手機（390×780、360×640）與電腦（1280×800）的開場、第 1 日畫面，並印出是否需要捲動（scrollH > 視窗高）。
import sys
from playwright.sync_api import sync_playwright
f='file://'+sys.argv[1];out=sys.argv[2]
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,(w,hh) in {'phone':(390,780),'small':(360,640),'desk':(1280,800)}.items():
        pg=b.new_page(viewport={'width':w,'height':hh});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto(f);pg.wait_for_timeout(500);pg.screenshot(path=f'{out}/{name}_intro.png')
        pg.click('#go');pg.wait_for_timeout(300);pg.click('#bAccept');pg.click('#po button');pg.wait_for_timeout(500)
        pg.screenshot(path=f'{out}/{name}_day1.png')
        print(name,'scrollH',pg.evaluate('document.documentElement.scrollHeight'),'視窗高',hh,'錯誤',errs)
    b.close()
