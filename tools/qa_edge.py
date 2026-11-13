"""Casos borde: enlace directo, movimiento reducido, sin JavaScript y PDF.

Uso: python tools/qa_edge.py http://127.0.0.1:8765/ .shots
"""
import sys

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8765/'
OUT = sys.argv[2] if len(sys.argv) > 2 else '.shots'
res = {}

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True)

    # 1) enlace directo a una sección
    pg = b.new_page(viewport={'width': 1440, 'height': 900})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE + '#seguridad', wait_until='networkidle')
    pg.wait_for_timeout(800)
    res['deep_link'] = pg.evaluate("document.querySelector('.slide.is-active').id")
    res['deep_link_counter'] = pg.inner_text('[data-current]')
    pg.go_back() if False else None
    pg.screenshot(path=f'{OUT}/edge-deeplink.png')
    res['deep_link_errors'] = errs
    pg.close()

    # 2) movimiento reducido: el retrato aparece completo y las transiciones son fundidos
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
    pg = ctx.new_page()
    pg.goto(BASE, wait_until='networkidle')
    pg.wait_for_timeout(600)
    pg.screenshot(path=f'{OUT}/edge-reduced.png')
    pg.keyboard.press('ArrowRight')
    pg.wait_for_timeout(400)
    res['reduced_nav'] = pg.evaluate("document.querySelector('.slide.is-active:not(.is-leaving)').id")
    ctx.close()

    # 3) sin JavaScript: página larga normal, con contenido y enlaces de imágenes
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}, java_script_enabled=False)
    pg = ctx.new_page()
    pg.goto(BASE, wait_until='load')
    res['nojs_height'] = pg.evaluate('document.documentElement.scrollHeight')
    res['nojs_visible_h2'] = pg.evaluate("[...document.querySelectorAll('h2')].filter(h => h.getBoundingClientRect().height > 0).length")
    pg.screenshot(path=f'{OUT}/edge-nojs.png')
    ctx.close()

    # 4) PDF (lo que hace "Descargar en PDF")
    pg = b.new_page(viewport={'width': 1440, 'height': 900})
    pg.goto(BASE, wait_until='networkidle')
    pg.evaluate("Promise.all([...document.querySelectorAll('.deck img')].map(i => { i.loading = 'eager'; return i.decode().catch(() => {}); }))")
    pg.wait_for_timeout(1500)
    pg.emulate_media(media='print')
    pdf = pg.pdf(path=f'{OUT}/portafolio.pdf', format='A4', landscape=True, print_background=True)
    res['pdf_kb'] = round(len(pdf) / 1024)
    pg.close()
    b.close()

for k, v in res.items():
    print(f'{k}: {v}')
