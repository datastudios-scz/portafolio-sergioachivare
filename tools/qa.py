"""QA visual y funcional del portafolio con Playwright (Chrome del sistema).

Uso (con el helper de la skill webapp-testing):
  python .claude/skills/webapp-testing/scripts/with_server.py \
    --server "python -m http.server 8080 --directory site" --port 8080 \
    -- python tools/qa.py http://localhost:8080/ .shots [desktop,laptop,mobile]

Genera .shots/<vista>-NN-<id>.png por diapositiva y .shots/report.json con:
errores de consola, diapositivas que desbordan la pantalla, peso de la carga inicial
y resultado de las pruebas de interacción (rueda, teclado, pestañas, lightbox).
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080/'
OUT = sys.argv[2] if len(sys.argv) > 2 else '.shots'
ONLY = set(sys.argv[3].split(',')) if len(sys.argv) > 3 else None
VIEWS = [
    ('desktop', 1440, 900, False),
    ('laptop', 1280, 720, False),
    ('mobile', 390, 844, True),
]
os.makedirs(OUT, exist_ok=True)
report = {}

STATE_JS = """() => {
  const s = [...document.querySelectorAll('.deck > .slide')];
  const k = s.findIndex(x => x.classList.contains('is-active') && !x.classList.contains('is-leaving'));
  const sc = s[k] && s[k].querySelector('.slide__scroll');
  return { k, id: s[k] && s[k].id, n: s.length,
           overflow: sc ? Math.max(0, sc.scrollHeight - sc.clientHeight) : 0,
           hash: location.hash };
}"""

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    for name, w, h, mobile in VIEWS:
        if ONLY and name not in ONLY:
            continue
        ctx = browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1,
                                  is_mobile=mobile, has_touch=mobile, locale='es-BO')
        page = ctx.new_page()
        logs = []
        page.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
        page.on('pageerror', lambda e: logs.append(f'pageerror: {e}'))
        page.on('requestfailed', lambda r: logs.append(f'requestfailed: {r.url}'))
        page.goto(BASE, wait_until='networkidle')
        initial = page.evaluate("""() => {
          const r = performance.getEntriesByType('resource');
          const nav = performance.getEntriesByType('navigation')[0];
          const kb = (n) => Math.round(n / 1024);
          return { requests: r.length + 1, transferKB: kb(r.reduce((a, e) => a + (e.transferSize || 0), 0) + (nav ? nav.transferSize : 0)),
                   decodedKB: kb(r.reduce((a, e) => a + (e.decodedBodySize || 0), 0) + (nav ? nav.decodedBodySize : 0)) };
        }""")
        page.wait_for_timeout(4200)  # el retrato termina de armarse
        st = page.evaluate(STATE_JS)
        slides = []
        for i in range(st['n']):
            if i > 0:
                page.keyboard.press('ArrowRight')
                page.wait_for_timeout(1500)
            st = page.evaluate(STATE_JS)
            page.screenshot(path=f"{OUT}/{name}-{i + 1:02d}-{st['id']}.png")
            slides.append({'i': i + 1, 'id': st['id'], 'overflowPx': st['overflow'], 'hash': st['hash']})
        info = {'initial': initial, 'slides': slides, 'logs': logs}

        if name == 'desktop':
            tests = {}
            page.keyboard.press('Home')
            page.wait_for_timeout(1300)
            # rueda: un gesto (varios eventos seguidos) debe avanzar exactamente 1
            for _ in range(8):
                page.mouse.wheel(0, 120)
                page.wait_for_timeout(30)
            page.wait_for_timeout(1300)
            tests['wheel_one_gesture'] = page.evaluate(STATE_JS)['k']
            # enlace del índice
            page.click('[data-open-index]')
            page.wait_for_timeout(500)
            page.screenshot(path=f'{OUT}/desktop-indice.png')
            page.click('#indice a[href="#marketing"]')
            page.wait_for_timeout(1400)
            tests['index_link'] = page.evaluate(STATE_JS)['id']
            # pestañas
            page.click('#t-mkt-3')
            page.wait_for_timeout(700)
            tests['tab_selected'] = page.get_attribute('#t-mkt-3', 'aria-selected')
            tests['panel_visible'] = page.is_visible('#p-mkt-3')
            # lightbox
            page.click('#p-mkt-3 a.zoom')
            page.wait_for_timeout(900)
            tests['lightbox_open'] = page.evaluate("document.querySelector('#lightbox').open")
            page.screenshot(path=f'{OUT}/desktop-lightbox.png')
            page.keyboard.press('Escape')
            page.wait_for_timeout(400)
            tests['lightbox_closed'] = not page.evaluate("document.querySelector('#lightbox').open")
            # foco tras navegar con teclado
            page.keyboard.press('ArrowRight')
            page.wait_for_timeout(1300)
            tests['focus_after_key'] = page.evaluate("document.activeElement && document.activeElement.tagName + '.' + (document.activeElement.closest('.slide')||{}).id")
            info['tests'] = tests
        report[name] = info
        ctx.close()
    browser.close()

with open(f'{OUT}/report.json', 'w', encoding='utf-8') as f:
    json.dump(report, f, ensure_ascii=False, indent=1)
for view, info in report.items():
    over = [f"{s['id']}(+{s['overflowPx']}px)" for s in info['slides'] if s['overflowPx'] > 0]
    print(f"[{view}] carga inicial: {info['initial']} | desbordan: {', '.join(over) or 'ninguna'}")
    for line in info['logs']:
        print('   ', line)
    if 'tests' in info:
        print('    pruebas:', info['tests'])
