"""Genera site/assets/og.jpg (1200×630) capturando la portada real ya armada.

Uso: python tools/og_image.py http://127.0.0.1:8765/ site/assets/og.png
     (luego node convierte a JPG; ver docs/performance.md)
"""
import sys

from playwright.sync_api import sync_playwright

url = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8765/'
out = sys.argv[2] if len(sys.argv) > 2 else 'site/assets/og.png'

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width': 1200, 'height': 630}, device_scale_factor=1)
    page.goto(url, wait_until='networkidle')
    page.add_style_tag(content="""
      .bar__actions, .rail, .portrait__hint, .hero__scroll, .hero__cta { display: none !important; }
      .slide__scroll { padding-top: 40px !important; padding-bottom: 30px !important; }
    """)
    page.wait_for_timeout(4500)
    page.screenshot(path=out)
    browser.close()
print('ok', out)
