#!/usr/bin/env python3
"""Extrae contenido y medios de un diseño público de Canva (link /view).

Uso:
  python -I canva_extract.py <url_view | archivo.html> <out_dir> [--no-media] [--no-thumbs]

Escribe en out_dir: view.html, bootstrap.json, content.json, content.md,
media/<id>.<ext>, media/index.json, thumbs/page-NN.png, fonts.json
"""
import json
import os
import re
import ssl
import sys
import urllib.request

UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/130.0 Safari/537.36')
BS = chr(92)  # backslash, evita problemas de escape al copiar este archivo
SIMPLE_ESC = {'n': '\n', 't': '\t', 'r': '\r', 'b': '\b', 'f': '\f', 'v': '\v', '0': '\0'}
TYPES = {'K': 'text', 'J': 'shape', 'I': 'image', 'U': 'line', 'H': 'app'}
MEDIA_RE = re.compile(r'\bMA[A-Za-z0-9_-]{9}\b')
EXT = {'image/png': 'png', 'image/jpeg': 'jpg', 'image/svg+xml': 'svg',
       'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4'}


def fetch(url, timeout=90):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=timeout, context=ssl.create_default_context()) as r:
        return r.read()


def js_unescape(t):
    out, p, n = [], 0, len(t)
    while p < n:
        c = t[p]
        if c == BS and p + 1 < n:
            d = t[p + 1]
            if d == 'x':
                out.append(chr(int(t[p + 2:p + 4], 16)))
                p += 4
            elif d == 'u':
                out.append(chr(int(t[p + 2:p + 6], 16)))
                p += 6
            else:
                out.append(SIMPLE_ESC.get(d, d))
                p += 2
            continue
        out.append(c)
        p += 1
    s = ''.join(out)
    return s.encode('utf-16', 'surrogatepass').decode('utf-16')


def load_bootstrap(html):
    marker = "window['bootstrap'] = JSON.parse('"
    i = html.find(marker)
    if i < 0:
        raise SystemExit("No encontré window['bootstrap'] en el HTML (¿link privado o formato nuevo?)")
    i += len(marker)
    j = html.find('</script>', i)
    js = js_unescape(html[i:j])
    data, _ = json.JSONDecoder().raw_decode(js)
    return data


def rnd(v):
    return round(v, 1) if isinstance(v, (int, float)) else v


def text_info(tobj):
    if not isinstance(tobj, dict):
        return '', []
    text = ''.join(x for x in tobj.get('A', []) if isinstance(x, str))
    styles, seen = [], set()
    for s in tobj.get('C', []):
        if isinstance(s, dict) and ('G' in s or 'M' in s):
            st = {k: s.get(src) for k, src in
                  (('font', 'C'), ('size', 'G'), ('weight', 'I'), ('color', 'M'),
                   ('align', 'c'), ('tracking', 'W'), ('leading', 'Y'), ('decoration', 'K'))
                  if s.get(src) is not None}
            key = json.dumps(st, sort_keys=True)
            if key not in seen:
                seen.add(key)
                styles.append(st)
    return text.strip('\n'), styles


def normalize(e, fonts):
    t = e.get('A?')
    out = {'type': TYPES.get(t, t), 'x': rnd(e.get('A')), 'y': rnd(e.get('B')),
           'w': rnd(e.get('D')), 'h': rnd(e.get('C'))}
    if isinstance(e.get('E'), (int, float)) and e.get('E'):
        out['rot'] = rnd(e['E'])
    if e.get('N'):
        out['role'] = e['N']
    texts, styles = [], []
    if t == 'K':
        txt, st = text_info(e.get('a', {}).get('C'))
        texts.append(txt)
        styles += st
    for f in e.get('f', []) if isinstance(e.get('f'), list) else []:
        txt, st = text_info(f.get('A', {}).get('C') if isinstance(f, dict) else None)
        if txt.strip():
            texts.append(txt)
            styles += st
    if any(x.strip() for x in texts):
        out['text'] = '\n'.join(x for x in texts if x.strip())
    if styles:
        for st in styles:
            if st.get('font'):
                st['family'] = fonts.get(st['font'].split(',')[0], st['font'])
        out['styles'] = styles
    if t == 'J':
        fills = [p.get('B', {}).get('C') for p in e.get('b', []) if isinstance(p, dict)]
        fills = [f for f in fills if f]
        if fills:
            out['fills'] = fills
    if t == 'U' and e.get('d'):
        out['color'] = e['d']
    if t == 'H':
        out['app'] = (e.get('z', {}).get('A', {}) or {}).get('A')
    media = sorted(set(MEDIA_RE.findall(json.dumps(e))))
    if media:
        out['media'] = media
    return out


def best_file(m):
    files = [f for f in m.get('files', []) if f.get('url')]
    if not files:
        return None
    non_thumb = [f for f in files if f.get('quality') != 'THUMBNAIL'] or files
    svg = [f for f in non_thumb if f.get('mimeType') == 'image/svg+xml']
    if svg:
        return svg[0]
    return max(non_thumb, key=lambda f: (f.get('width', 0) * f.get('height', 0), f.get('fileSizeBytes', 0)))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    flags = {a for a in sys.argv[1:] if a.startswith('--')}
    if len(args) != 2:
        print(__doc__)
        sys.exit(2)
    src, out_dir = args
    os.makedirs(out_dir, exist_ok=True)

    if src.startswith('http'):
        html = fetch(src).decode('utf-8')
        open(os.path.join(out_dir, 'view.html'), 'w', encoding='utf-8').write(html)
    else:
        html = open(src, encoding='utf-8').read()

    boot = load_bootstrap(html)
    json.dump(boot, open(os.path.join(out_dir, 'bootstrap.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

    root = boot['page']['Bj']['A']
    doc = root['D']['A']
    fonts = {f.get('A'): f.get('C') for f in root.get('H', []) if isinstance(f, dict)}
    font_info = [{'id': f.get('A'), 'family': f.get('C'),
                  'styles': sorted({f"{s.get('weight')} {s.get('style')}" for s in f.get('D', [])})}
                 for f in root.get('H', []) if isinstance(f, dict)]
    json.dump(font_info, open(os.path.join(out_dir, 'fonts.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

    media_by_id = {m['id']: m for m in root.get('I', []) if isinstance(m, dict) and m.get('id')}
    thumbs = {im.get('page'): im.get('url') for im in root.get('G', {}).get('images', [])}

    pages = []
    usage = {}
    for idx, p in enumerate(doc.get('A', []), start=1):
        els = [normalize(e, fonts) for e in p.get('E', []) if isinstance(e, dict)]
        for el in els:
            for mid in el.get('media', []):
                usage.setdefault(mid, []).append(idx)
        pages.append({'page': idx, 'background': (p.get('D') or {}).get('C'),
                      'thumb': f'thumbs/page-{idx:02d}.png' if idx in thumbs else None,
                      'elements': els})

    content = {'title': doc.get('D'), 'locale': doc.get('P'), 'dimensions': doc.get('B'),
               'pages': pages}
    json.dump(content, open(os.path.join(out_dir, 'content.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

    # medios
    media_index = {}
    mdir = os.path.join(out_dir, 'media')
    os.makedirs(mdir, exist_ok=True)
    for mid, m in media_by_id.items():
        f = best_file(m)
        if not f:
            continue
        ext = EXT.get(f.get('mimeType'), 'bin')
        name = f'{mid}.{ext}'
        media_index[mid] = {'file': name, 'type': m.get('type'), 'title': (m.get('title') or '').strip(),
                            'width': f.get('width'), 'height': f.get('height'),
                            'quality': f.get('quality'), 'pages': sorted(set(usage.get(mid, [])))}
        path = os.path.join(mdir, name)
        if '--no-media' not in flags and not os.path.exists(path):
            try:
                open(path, 'wb').write(fetch(f['url']))
            except Exception as ex:  # noqa: BLE001 — seguimos con el resto
                media_index[mid]['error'] = str(ex)
    missing = sorted(set(usage) - set(media_index))
    json.dump({'media': media_index, 'referenced_but_missing': missing},
              open(os.path.join(mdir, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    # miniaturas
    if '--no-thumbs' not in flags:
        tdir = os.path.join(out_dir, 'thumbs')
        os.makedirs(tdir, exist_ok=True)
        for pg, url in thumbs.items():
            try:
                open(os.path.join(tdir, f'page-{pg:02d}.png'), 'wb').write(fetch(url))
            except Exception as ex:  # noqa: BLE001
                print(f'miniatura {pg}: {ex}')

    # markdown legible
    lines = [f"# {content['title']}", '',
             f"Páginas: {len(pages)} · Dimensiones: {content['dimensions']} · Idioma: {content['locale']}", '']
    for pg in pages:
        lines.append(f"## Página {pg['page']}" + (f" · fondo {pg['background']}" if pg['background'] else '')
                     + (f" · miniatura `{pg['thumb']}`" if pg['thumb'] else ''))
        for el in pg['elements']:
            box = f"({el['x']},{el['y']} {el['w']}×{el['h']})"
            bits = [f"- **{el['type']}**{'·' + el['role'] if el.get('role') else ''} {box}"]
            if el.get('text'):
                bits.append('“' + el['text'].replace('\n', ' ⏎ ') + '”')
            if el.get('styles'):
                s = el['styles'][0]
                bits.append(f"[{s.get('family', '')} {s.get('weight', '')} {s.get('size', '')} {s.get('color', '')}]")
            if el.get('fills'):
                bits.append('relleno ' + ', '.join(el['fills']))
            if el.get('color'):
                bits.append('color ' + el['color'])
            for mid in el.get('media', []):
                mi = media_index.get(mid)
                bits.append(f"`media/{mi['file']}` {mi['width']}×{mi['height']} {mi['title']}" if mi
                            else f'`{mid}` (sin archivo)')
            lines.append(' '.join(bits))
        lines.append('')
    open(os.path.join(out_dir, 'content.md'), 'w', encoding='utf-8').write('\n'.join(lines))

    print(f"OK: {len(pages)} páginas, {len(media_index)} medios, {len(thumbs)} miniaturas, "
          f"{len(fonts)} fuentes → {out_dir}")
    if missing:
        print('Referenciados sin archivo descargable:', ', '.join(missing))


if __name__ == '__main__':
    main()
