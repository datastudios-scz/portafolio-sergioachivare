"""Servidor estático local y silencioso para probar site/ (sin logs que llenen pipes).

Uso: python tools/serve.py [puerto=8765] [carpeta=site]
"""
import functools
import http.server
import sys

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
root = sys.argv[2] if len(sys.argv) > 2 else 'site'


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      '.avif': 'image/avif', '.webp': 'image/webp', '.woff2': 'font/woff2',
                      '.svg': 'image/svg+xml', '.js': 'text/javascript', '.mjs': 'text/javascript'}

    def log_message(self, *args):  # noqa: D401 — sin ruido en stdout/stderr
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


handler = functools.partial(QuietHandler, directory=root)
with http.server.ThreadingHTTPServer(('127.0.0.1', port), handler) as httpd:
    print(f'Sirviendo {root}/ en http://127.0.0.1:{port}/', flush=True)
    httpd.serve_forever()
