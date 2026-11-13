"""Captura diapositivas concretas después de que terminen sus animaciones.

Uso: python tools/qa_slides.py http://127.0.0.1:8765/ .shots 1440x900 inicio:1.5 portal-ia:9 ...
Cada argumento es <id>:<segundos de espera>. Guarda .shots/<vista>-<id>.png e imprime errores.
"""
import sys

from playwright.sync_api import sync_playwright

base, out, size = sys.argv[1], sys.argv[2], sys.argv[3]
w, h = (int(x) for x in size.split('x'))
targets = [(t.split(':')[0], float(t.split(':')[1])) for t in sys.argv[4:]]
mobile = w < 700

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True)
    ctx = b.new_context(viewport={'width': w, 'height': h}, is_mobile=mobile, has_touch=mobile, device_scale_factor=1)
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.goto(base, wait_until='networkidle')
    for sid, wait in targets:
        page.evaluate(f"document.querySelector('a.rail__node[aria-label$=\"{sid}\"]') ; location.hash")
        page.evaluate(f"""(() => {{ const a = document.createElement('a'); a.href = '#{sid}'; document.body.append(a); a.click(); a.remove(); }})()""")
        page.wait_for_timeout(int(wait * 1000))
        page.screenshot(path=f'{out}/{size}-{sid}.png')
    print('errores:', errors or 'ninguno')
    b.close()
