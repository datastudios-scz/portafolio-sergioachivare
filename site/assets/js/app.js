/* Portafolio de Sergio Achivare — motor de diapositivas + efectos.
   Sin dependencias. Arquitectura y reglas: docs/arquitectura.md y la skill motion-slides. */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);

const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
let RM = mqReduce.matches;
mqReduce.addEventListener?.('change', (e) => { RM = e.matches; });
const mqNarrow = matchMedia('(max-width: 760px)');
const hoverNone = () => matchMedia('(hover: none)').matches;

/* ---------- Resortes de forma cerrada (masa-resorte amortiguado) ---------- */
function springEase(t, k = 170, d = 26) {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(k), z = d / (2 * w0);
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t));
  }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
}
function springSettle(k, d) {
  let t = 0, calm = 0;
  while (t < 4) { t += 1 / 120; if (Math.abs(1 - springEase(t, k, d)) < 0.002) { if (++calm > 12) return t; } else calm = 0; }
  return t;
}
const HAS_LINEAR = !!window.CSS?.supports?.('animation-timing-function', 'linear(0, 1)');
function springCSS(k, d) {
  const dur = springSettle(k, d);
  if (!HAS_LINEAR) return { easing: 'cubic-bezier(.2,.9,.25,1.1)', duration: dur * 1000 };
  const pts = [];
  for (let i = 0; i <= 40; i++) pts.push(+springEase((i / 40) * dur, k, d).toFixed(4));
  return { easing: `linear(${pts.join(', ')})`, duration: dur * 1000 };
}
const RAIL_SPRING = springCSS(260, 24);

/* PRNG con semilla (el retrato se arma igual en cada visita) */
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const loadImg = (src) => new Promise((ok, ko) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = ko; i.src = src; });
const fontsReady = () => Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 900))]);
const overlayOpen = () => !!$('dialog[open]');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
/* marca .has-more cuando la diapositiva tiene contenido por debajo del borde */
const updateMore = (sc) => sc && sc.classList.toggle('has-more', sc.scrollHeight - sc.clientHeight - sc.scrollTop > 24);

/* =====================================================================
   DECK
   ===================================================================== */
const deck = {
  slides: [], i: -1, busy: false, pending: null,
  get current() { return this.slides[this.i]; },

  init() {
    this.slides = $$('.deck > .slide');
    this.n = this.slides.length;
    this.slides.forEach((s, k) => {
      s.setAttribute('aria-roledescription', 'diapositiva');
      s.setAttribute('aria-label', `${k + 1} de ${this.n}: ${s.dataset.title}`);
      s.classList.remove('is-active');
      s.inert = true;
    });
    this.wipe = Object.assign(document.createElement('div'), { className: 'wipe' });
    this.wipe.setAttribute('aria-hidden', 'true');
    document.body.append(this.wipe);
    rail.init(this.slides);
    const total = $('.bar__total');
    if (total) total.textContent = ` / ${this.n}`;
    // cada línea de código sabe cuántos caracteres tiene (tipeo por pasos en CSS)
    $$('.code .l').forEach((l) => l.style.setProperty('--n', Math.max(1, l.textContent.length)));
    const ro = new ResizeObserver((entries) => entries.forEach((e) => updateMore(e.target.parentElement)));
    $$('.slide__scroll').forEach((sc) => {
      sc.addEventListener('scroll', () => updateMore(sc), { passive: true });
      if (sc.firstElementChild) ro.observe(sc.firstElementChild);
    });
    addEventListener('resize', () => updateMore($('.slide__scroll', this.current)));
    const start = this.indexOf(location.hash) ?? 0;
    this.show(start, { instant: true, keepUrl: !location.hash });
  },

  indexOf(hash) {
    const id = decodeURIComponent((hash || '').replace(/^#/, ''));
    if (!id) return null;
    const k = this.slides.findIndex((s) => s.id === id);
    return k >= 0 ? k : null;
  },

  go(k, opts = {}) {
    k = clamp(k, 0, this.n - 1);
    // pedir la diapositiva a la que ya se está yendo anula cualquier navegación en cola
    if (k === this.i) { this.pending = null; return false; }
    if (this.busy) { this.pending = [k, opts]; return false; }
    this.show(k, opts);
    return true;
  },
  next(opts) { return this.go(this.i + 1, opts); },
  play(slide, first) {
    slide.classList.add('is-play');
    fx.enter(slide, first);
  },
  prev(opts) { return this.go(this.i - 1, opts); },

  show(k, { instant = false, push = false, focus = false, keepUrl = false } = {}) {
    const from = this.current, to = this.slides[k];
    const prevIndex = this.i;
    const dir = k >= prevIndex ? 1 : -1;
    this.i = k;

    this.slides.forEach((s, j) => s.classList.toggle('is-near', Math.abs(j - k) === 1 && s !== from));
    to.classList.remove('is-near');
    to.classList.add('is-active');
    to.inert = false;

    const sc = $('.slide__scroll', to);
    // en la carga inicial scrollTop se toca en el cuadro siguiente: así no fuerza el layout
    // dentro de la tarea del script, pero la diapositiva igual empieza arriba
    if (sc && !instant) sc.scrollTop = dir < 0 ? sc.scrollHeight : 0;
    if (sc) requestAnimationFrame(() => { if (instant && sc.scrollTop) sc.scrollTop = 0; updateMore(sc); });

    const done = () => {
      if (from && from !== to) { from.classList.remove('is-active', 'is-leaving', 'is-play'); from.inert = true; }
      to.classList.remove('is-entering');
      this.busy = false;
      if (this.pending) { const [pk, po] = this.pending; this.pending = null; this.go(pk, po); }
    };

    if (!from || from === to || instant) {
      document.documentElement.dataset.surface = to.dataset.theme;
      done();
      this.play(to, true);
    } else {
      this.busy = true;
      from.inert = true;
      fx.leave(from);
      transition(from, to, dir).then(done);
      clearTimeout(this.tSurface);
      clearTimeout(this.tEnter);
      this.tSurface = setTimeout(() => { document.documentElement.dataset.surface = to.dataset.theme; }, RM ? 0 : 330);
      // si la pestaña se ocultó en medio de la transición, los efectos arrancan al volver
      this.tEnter = setTimeout(() => {
        if (document.hidden) this.enterOnShow = true; else this.play(to, false);
      }, RM ? 0 : 300);
    }

    rail.update(k, prevIndex, instant);
    bar.update(to, k);
    $('[data-announcer]').textContent = `${k + 1} de ${this.n}: ${to.dataset.title}`;
    if (!keepUrl) history[push ? 'pushState' : 'replaceState'](null, '', `#${to.id}`);
    if (focus) $('[tabindex="-1"]', to)?.focus({ preventScroll: true });
  },
};

function transition(from, to, dir) {
  if (RM) {
    return to.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'linear' }).finished.catch(() => {});
  }
  const D = 760, easing = 'cubic-bezier(.77,0,.18,1)';
  to.classList.add('is-entering');
  from.classList.add('is-leaving');
  const start = dir > 0 ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)';
  const a = to.animate([{ clipPath: start }, { clipPath: 'inset(0 0 0 0)' }], { duration: D, easing });
  from.animate(
    [{ transform: 'translateY(0) scale(1)', opacity: 1 }, { transform: `translateY(${-5 * dir}vh) scale(.975)`, opacity: .3 }],
    { duration: D, easing },
  );
  const H = innerHeight;
  deck.wipe.animate(
    [{ transform: `translateY(${dir > 0 ? H : 0}px)`, opacity: 1 }, { transform: `translateY(${dir > 0 ? 0 : H - 2}px)`, opacity: 1 }],
    { duration: D, easing },
  );
  return a.finished.catch(() => {});
}

/* ---------- Barra superior ---------- */
const bar = {
  chapter: $('[data-chapter]'), current: $('[data-current]'),
  update(slide, k) {
    if (this.current) this.current.textContent = String(k + 1).padStart(2, '0');
    const label = slide.dataset.chapter;
    if (this.chapter && this.chapter.textContent !== label) {
      this.chapter.textContent = label;
      if (!RM) this.chapter.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
  },
};

/* ---------- Riel de linaje ---------- */
const rail = {
  init(slides) {
    const nav = document.createElement('nav');
    nav.className = 'rail';
    nav.setAttribute('aria-label', 'Diapositivas');
    const ol = document.createElement('ol');
    let chapter = null;
    this.nodes = slides.map((s, k) => {
      const li = document.createElement('li');
      if (s.dataset.chapter !== chapter) { li.classList.add('is-chapter'); chapter = s.dataset.chapter; }
      const a = document.createElement('a');
      a.className = 'rail__node';
      a.href = `#${s.id}`;
      a.setAttribute('aria-label', `${k + 1}. ${s.dataset.title}`);
      const label = document.createElement('span');
      label.className = 'rail__label';
      label.textContent = s.dataset.title;
      a.append(label);
      li.append(a);
      ol.append(li);
      return a;
    });
    const prev = this.stepBtn('prev', 'Diapositiva anterior');
    const next = this.stepBtn('next', 'Diapositiva siguiente');
    this.packet = Object.assign(document.createElement('span'), { className: 'rail__packet' });
    this.packet.setAttribute('aria-hidden', 'true');
    nav.append(prev, ol, next, this.packet);
    document.body.append(nav);
    Object.assign(this, { nav, ol, slides });
    // En pantallas angostas los nodos son solo un indicador de progreso (12 px no es un objetivo
    // táctil válido): sin href ni presencia en el árbol de accesibilidad; se navega con ‹ ›.
    const mode = () => {
      const narrow = mqNarrow.matches;
      this.nodes.forEach((a, k) => (narrow ? a.removeAttribute('href') : a.setAttribute('href', `#${slides[k].id}`)));
      if (narrow) ol.setAttribute('aria-hidden', 'true'); else ol.removeAttribute('aria-hidden');
    };
    mode();
    mqNarrow.addEventListener?.('change', mode);
    addEventListener('resize', () => this.place(deck.i, null, true));
  },
  stepBtn(dir, label) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rail__step';
    b.setAttribute('aria-label', label);
    b.innerHTML = `<svg aria-hidden="true"><use href="#i-${dir}"/></svg>`;
    b.addEventListener('click', () => (dir === 'next' ? deck.next() : deck.prev()));
    return b;
  },
  update(k, from, instant) {
    this.nodes.forEach((a, j) => {
      a.classList.toggle('is-done', j < k);
      if (j === k) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
    });
    // medir el riel fuerza layout: en la carga inicial se hace en el cuadro siguiente
    if (instant) requestAnimationFrame(() => this.place(deck.i, null, true));
    else this.place(k, from, instant);
  },
  place(k, from, instant) {
    const node = this.nodes[k];
    if (!node) return;
    const n = node.getBoundingClientRect(), r = this.nav.getBoundingClientRect();
    const to = `translate(${n.left + n.width / 2 - r.left}px, ${n.top + n.height / 2 - r.top}px)`;
    const prevT = this.packet.style.transform;
    this.packet.style.transform = to;
    if (instant || RM || !prevT || from == null || from < 0) return;
    const dist = Math.abs(k - from);
    this.packet.animate([{ transform: prevT }, { transform: to }], {
      duration: Math.min(RAIL_SPRING.duration + dist * 18, 1100), easing: RAIL_SPRING.easing,
    });
  },
};

/* ---------- Entradas: rueda, teclado, táctil, enlaces ---------- */
function scrollable(el) {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    if (n.classList?.contains('slide__scroll')) return n.scrollHeight > n.clientHeight + 2 ? n : null;
  }
  return null;
}
const canScroll = (sc, dir) => (dir > 0 ? sc.scrollTop + sc.clientHeight < sc.scrollHeight - 2 : sc.scrollTop > 2);

function bindInputs() {
  // Rueda / trackpad: un gesto = una diapositiva. La inercia mantiene el gesto "usado"
  // hasta que haya una pausa de 200 ms o un cambio de dirección.
  let lastT = 0, acc = 0, used = false, lastDir = 0;
  addEventListener('wheel', (e) => {
    if (overlayOpen() || e.ctrlKey) return;
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
    const dy = e.deltaY * unit, dx = e.deltaX * unit;
    if (Math.abs(dy) <= Math.abs(dx)) return;
    const dir = Math.sign(dy);
    const now = performance.now(), gap = now - lastT;
    lastT = now;
    if (gap > 200 || dir !== lastDir) { acc = 0; used = false; }
    lastDir = dir;
    const sc = scrollable(e.target);
    if (sc && canScroll(sc, dir)) { used = true; return; }
    e.preventDefault();
    acc += dy;
    if (!used && Math.abs(acc) >= 35) { used = true; dir > 0 ? deck.next() : deck.prev(); }
  }, { passive: false });

  addEventListener('keydown', (e) => {
    if (e.defaultPrevented || overlayOpen() || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t.closest?.('input, textarea, select, [contenteditable="true"], [role="tablist"]')) return;
    if (e.key === 'Home') { e.preventDefault(); deck.go(0, { focus: true }); return; }
    if (e.key === 'End') { e.preventDefault(); deck.go(deck.n - 1, { focus: true }); return; }
    const map = { ArrowDown: 1, PageDown: 1, ArrowRight: 1, ArrowUp: -1, PageUp: -1, ArrowLeft: -1, ' ': e.shiftKey ? -1 : 1 };
    const dir = map[e.key];
    if (!dir) return;
    if (e.key === ' ' && t.closest?.('button, a, summary')) return;
    const vertical = e.key !== 'ArrowLeft' && e.key !== 'ArrowRight';
    const sc = $('.slide__scroll', deck.current);
    if (vertical && sc && sc.scrollHeight > sc.clientHeight + 2 && canScroll(sc, dir)) {
      e.preventDefault();
      const amount = e.key.startsWith('Arrow') ? 90 : sc.clientHeight * .85;
      sc.scrollBy({ top: dir * amount, behavior: RM ? 'auto' : 'smooth' });
      return;
    }
    e.preventDefault();
    deck.go(deck.i + dir, { focus: true });
  });

  // Táctil: el estado del scroll interno se mira al empezar el gesto, así llegar al borde
  // y seguir deslizando no salta de diapositiva: hace falta un gesto nuevo.
  let ts = null;
  addEventListener('touchstart', (e) => {
    if (overlayOpen() || e.touches.length > 1) { ts = null; return; }
    const p = e.touches[0];
    const sc = scrollable(e.target);
    ts = { x: p.clientX, y: p.clientY, t: performance.now(), top: !sc || !canScroll(sc, -1), bottom: !sc || !canScroll(sc, 1) };
  }, { passive: true });
  addEventListener('touchend', (e) => {
    if (!ts) return;
    const p = e.changedTouches[0], s = ts;
    ts = null;
    const dx = p.clientX - s.x, dy = p.clientY - s.y;
    if (Math.abs(dy) < 50 || Math.abs(dy) < Math.abs(dx) * 1.3 || performance.now() - s.t > 900) return;
    if (dy < 0 && s.bottom) deck.next(); else if (dy > 0 && s.top) deck.prev();
  }, { passive: true });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    const k = deck.indexOf(a.getAttribute('href'));
    if (k == null) return;
    e.preventDefault();
    $$('dialog[open]').forEach((d) => d.close());
    deck.go(k, { push: true, focus: e.detail === 0 });
  });
  addEventListener('popstate', () => { const k = deck.indexOf(location.hash); deck.go(k ?? 0); });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { fx.leave(deck.current, true); return; }
    const full = deck.enterOnShow;
    deck.enterOnShow = false;
    if (full) deck.play(deck.current, false); else fx.enter(deck.current, false, true);
  });
}

/* =====================================================================
   EFECTOS (se montan por diapositiva con data-fx)
   ===================================================================== */
const FX = {};
const fx = {
  init() {
    // cada instrucción de agente guarda su texto completo (viene en el HTML para imprimir y sin JS)
    $$('.ide__prompt [data-q]').forEach((q) => { q.dataset.full = q.textContent; });
    $$('[data-fx]').forEach((el) => FX[el.dataset.fx]?.init?.(el));
  },
  enter(slide, first, resume) { if (slide) $$('[data-fx]', slide).forEach((el) => FX[el.dataset.fx]?.enter?.(el, first, resume)); },
  leave(slide, pause) {
    if (!slide) return;
    $$('[data-fx]', slide).forEach((el) => FX[el.dataset.fx]?.leave?.(el, pause));
    // al salir, la instrucción vuelve completa: así se imprime entera aunque se haya cortado a medias
    $$('.ide__prompt [data-q]', slide).forEach((q) => { q.textContent = q.dataset.full; });
  },
};

/* ---------- Portada: retrato que nace de un gráfico de dispersión ---------- */
FX.portrait = {
  init(fig) {
    const st = { fig, wrap: $('.portrait', fig), canvas: $('canvas', fig), hint: $('.portrait__hint', fig), played: false, gen: 0 };
    st.ctx = st.canvas.getContext('2d');
    fig._st = st;
    st.ready = loadImg('assets/img/retrato-puntos.png')
      .then((img) => preparePortrait(st, img))
      .catch(() => { st.failed = true; st.wrap.classList.add('is-revealed'); });
    const { wrap } = st;
    wrap.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = wrap.getBoundingClientRect();
      wrap.style.setProperty('--lx', `${e.clientX - r.left}px`);
      wrap.style.setProperty('--ly', `${e.clientY - r.top}px`);
      wrap.style.setProperty('--lr', `${Math.round(r.width * .17)}px`);
      wrap.classList.add('is-lens');
    });
    wrap.addEventListener('pointerleave', () => wrap.classList.remove('is-lens'));
    wrap.addEventListener('click', () => { if (hoverNone()) wrap.classList.toggle('is-revealed'); });
    new ResizeObserver(() => { if (st.dots && !st.raf) renderPortrait(st, Infinity); }).observe(st.canvas);
  },
  async enter(fig) {
    const st = fig._st;
    // generación: si el usuario sale mientras esperamos imagen/fuente, este enter se descarta
    const gen = ++st.gen;
    await st.ready;
    if (st.failed || gen !== st.gen) return;
    if (RM || st.played) { renderPortrait(st, Infinity); st.hint?.classList.add('is-on'); return; }
    await fontsReady();
    if (gen !== st.gen) return;
    st.played = true;
    const t0 = performance.now();
    const tick = (now) => {
      const t = (now - t0) / 1000;
      if (t >= st.tEnd) { st.raf = 0; renderPortrait(st, Infinity); st.hint?.classList.add('is-on'); return; }
      renderPortrait(st, t);
      st.raf = requestAnimationFrame(tick);
    };
    st.raf = requestAnimationFrame(tick);
  },
  leave(fig) {
    const st = fig._st;
    st.gen++;
    if (st.raf) { cancelAnimationFrame(st.raf); st.raf = 0; if (st.dots) renderPortrait(st, Infinity); st.hint?.classList.add('is-on'); }
    st.wrap.classList.remove('is-lens', 'is-revealed');
  },
};

function preparePortrait(st, img) {
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const cx = c.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0);
  const px = cx.getImageData(0, 0, W, H).data;
  const step = innerWidth < 700 || (navigator.hardwareConcurrency || 8) <= 4 ? 2 : 1;
  const dots = [];
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const p = (y * W + x) * 4, a = px[p + 3] / 255;
      if (a < .35) continue;
      dots.push({ x: x + step / 2, y: y + step / 2, lum: px[p] / 255, a });
    }
  }
  // Dispersión: el orden en x del retrato define la posición en el gráfico (así los puntos
  // suben casi en vertical); en y, una tendencia positiva con ruido gaussiano.
  const rnd = mulberry32(20261113);
  const order = dots.map((_, i) => i).sort((i, j) => dots[i].x - dots[j].x || dots[i].y - dots[j].y);
  order.forEach((idx, rank) => {
    const d = dots[idx], u = rank / Math.max(1, order.length - 1);
    d.u = clamp(u + (rnd() - .5) * .04, 0, 1);
    d.v = clamp(.12 + .72 * u + gauss(rnd) * .11, .02, .98);
    d.pop = rnd();
    d.delay = rnd();
  });
  Object.assign(st, { dots, W, H, step, tEnd: 1.25 + .5 + .3 + springSettle(140, 18) });
}

function renderPortrait(st, t) {
  const { canvas, ctx } = st;
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const cw = Math.max(1, Math.round(r.width * dpr)), ch = Math.max(1, Math.round(r.height * dpr));
  if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
  ctx.clearRect(0, 0, cw, ch);
  const s = Math.min(cw / st.W, ch / st.H), ox = (cw - st.W * s) / 2, oy = (ch - st.H * s) / 2;
  const cell = s * st.step;
  const final = t === Infinity;
  const pl = cw * .1, pr = cw * .97, pt = ch * .07, pb = ch * .86;

  if (!final) {
    const grow = easeOutCubic(clamp(t / .45, 0, 1));
    const alpha = clamp(t / .3, 0, 1) * (1 - clamp((t - 1.2) / .45, 0, 1));
    if (alpha > 0) {
      ctx.strokeStyle = `rgba(171,164,219,${alpha})`;
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(pl, pb - grow * (pb - pt)); ctx.lineTo(pl, pb); ctx.lineTo(pl + grow * (pr - pl), pb);
      for (let i = 1; i <= 4; i++) {
        const x = pl + (i / 5) * (pr - pl) * grow, y = pb - (i / 5) * (pb - pt) * grow;
        ctx.moveTo(x, pb); ctx.lineTo(x, pb + 5 * dpr);
        ctx.moveTo(pl, y); ctx.lineTo(pl - 5 * dpr, y);
      }
      ctx.stroke();
      ctx.fillStyle = `rgba(171,164,219,${alpha})`;
      ctx.font = `600 ${13 * dpr}px Archivo, system-ui, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('Datos', pr, pb + 9 * dpr);
      ctx.save();
      ctx.translate(pl - 10 * dpr, pt);
      ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = 'bottom';
      ctx.fillText('Decisiones', 0, 0);
      ctx.restore();
      const lp = clamp((t - .75) / .4, 0, 1);
      if (lp > 0) {
        ctx.strokeStyle = `rgba(255,194,51,${alpha})`;
        ctx.lineWidth = 2.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(pl, pb - .12 * (pb - pt));
        ctx.lineTo(pl + lp * (pr - pl), pb - (.12 + .72 * lp) * (pb - pt));
        ctx.stroke();
      }
    }
  }

  const buckets = Array.from({ length: 12 }, () => []);
  const r0 = 1.7 * dpr;
  for (const d of st.dots) {
    const tx = ox + d.x * s, ty = oy + d.y * s;
    const rF = cell * (.15 + .35 * d.lum), aF = (.26 + .74 * d.lum) * d.a;
    let x = tx, y = ty, rad = rF, a = aF;
    if (!final) {
      const sx = pl + d.u * (pr - pl), sy = pb - d.v * (pb - pt);
      const pop = clamp(springEase(t - (.12 + d.pop * .6), 320, 30), 0, 1.15);
      const m = springEase(t - (1.25 + (d.y / st.H) * .5 + d.delay * .3), 140, 18);
      const mc = clamp(m, 0, 1);
      x = sx + (tx - sx) * m;
      y = sy + (ty - sy) * m;
      rad = (r0 + (rF - r0) * mc) * pop;
      a = .9 + (aF - .9) * mc;
    }
    if (rad < .25) continue;
    buckets[clamp(Math.round(a * 11), 0, 11)].push(x, y, rad);
  }
  for (let b = 1; b < 12; b++) {
    const arr = buckets[b];
    if (!arr.length) continue;
    ctx.fillStyle = `rgba(233,229,255,${(b / 11).toFixed(3)})`;
    ctx.beginPath();
    for (let i = 0; i < arr.length; i += 3) { ctx.moveTo(arr[i] + arr[i + 2], arr[i + 1]); ctx.arc(arr[i], arr[i + 1], arr[i + 2], 0, 6.2832); }
    ctx.fill();
  }
}

/* ---------- Cifras que cuentan ---------- */
FX.count = {
  enter(el, first, resume) {
    if (resume) return;
    $$('[data-count]', el).forEach((n) => {
      const to = +n.dataset.count, pre = n.dataset.prefix || '';
      cancelAnimationFrame(n._raf);
      if (RM) { n.textContent = pre + to; return; }
      const t0 = performance.now(), D = 1100;
      const tick = (now) => {
        const p = clamp((now - t0) / D, 0, 1);
        n.textContent = pre + Math.round(to * easeOutCubic(p));
        if (p < 1) n._raf = requestAnimationFrame(tick);
      };
      n.textContent = `${pre}0`;
      n._raf = requestAnimationFrame(tick);
    });
  },
  leave(el) {
    $$('[data-count]', el).forEach((n) => { cancelAnimationFrame(n._raf); n.textContent = (n.dataset.prefix || '') + n.dataset.count; });
  },
};

/* ---------- Secuencias cancelables para las maquetas animadas ---------- */
// seq(el) devuelve at(ms, fn): programa pasos relativos a "ahora" y los guarda en el
// elemento para poder cancelarlos todos al salir de la diapositiva.
function seq(el) {
  stopSeq(el);
  return (ms, fn) => { el._seq.push(setTimeout(fn, ms)); };
}
function stopSeq(el) {
  (el._seq || []).forEach(clearTimeout);
  (el._raf || []).forEach(cancelAnimationFrame);
  el._seq = [];
  el._raf = [];
}
// escribe un texto carácter a carácter; devuelve el instante en que termina
function typeInto(at, node, text, t0, ms = 36) {
  node.textContent = '';
  for (let i = 1; i <= text.length; i++) at(t0 + i * ms, () => { node.textContent = text.slice(0, i); });
  return t0 + text.length * ms;
}
// tipea una línea de código (clip-path por pasos) con una duración proporcional a su largo
function typeLine(line, msPerChar) {
  const dur = Math.max(1, line.textContent.length) * msPerChar;
  line.style.animationDuration = `${dur}ms`;
  line.classList.add('is-typed');
  return dur;
}
const numFmt = (dec) => new Intl.NumberFormat('es-BO', { minimumFractionDigits: dec, maximumFractionDigits: dec });
function numText(node, v) {
  const dec = +(node.dataset.dec || 0);
  return `${node.dataset.pre || ''}${numFmt(dec).format(v)}${node.dataset.suf || ''}`;
}
function countUp(el, node, D = 1000) {
  const to = +node.dataset.to, t0 = performance.now();
  const tick = (now) => {
    const p = clamp((now - t0) / D, 0, 1);
    node.textContent = numText(node, to * easeOutCubic(p));
    if (p < 1) el._raf.push(requestAnimationFrame(tick));
  };
  el._raf.push(requestAnimationFrame(tick));
}

/* ---------- Portal BI: login real (usuario, contraseña, Ingresar) → tableros, y cambio de marca ---------- */
const BRANDS = [
  { name: 'ACME Analytics', brand: '#1F7A5C', brand2: '#0E4A36', acc: '#F5B400' },
  { name: 'Nordex Datos', brand: '#1B2C66', brand2: '#0C1638', acc: '#F2A93B' },
  { name: 'Andina Retail', brand: '#6A2DB8', brand2: '#3E1679', acc: '#5FD3B0' },
];
function setBrand(m, b) {
  m.style.setProperty('--brand', b.brand);
  m.style.setProperty('--brand-2', b.brand2);
  m.style.setProperty('--brand-acc', b.acc);
  $$('[data-brand-name]', m).forEach((n) => { n.textContent = b.name; });
}
FX.portal = {
  enter(el) {
    const m = $('.pmock', el), user = $('[data-user]', m), pass = $('[data-pass]', m);
    const inputs = $$('.plogin__input', m), btn = $('.plogin__btn', m);
    const at = seq(el);
    if (RM) { setBrand(m, BRANDS[0]); m.classList.add('is-app'); return; }
    let k = 0;
    const cycle = () => {
      el._seq = []; // los temporizadores anteriores ya se ejecutaron
      setBrand(m, BRANDS[k % BRANDS.length]);
      m.classList.remove('is-app');
      btn.classList.remove('is-busy', 'is-press');
      inputs.forEach((i) => i.classList.remove('is-focus'));
      at(450, () => inputs[0].classList.add('is-focus'));
      let t = typeInto(at, user, 'mariana.s', 550, 75);
      pass.textContent = '';
      at(t + 200, () => { inputs[0].classList.remove('is-focus'); inputs[1].classList.add('is-focus'); });
      t = typeInto(at, pass, '••••••••', t + 300, 65);
      at(t + 250, () => { inputs[1].classList.remove('is-focus'); btn.classList.add('is-press'); });
      at(t + 400, () => { btn.classList.remove('is-press'); btn.classList.add('is-busy'); });
      at(t + 1250, () => { btn.classList.remove('is-busy'); m.classList.add('is-app'); });
      at(t + 1250 + 3600, () => { k += 1; cycle(); });
    };
    cycle();
  },
  leave(el) { stopSeq(el); },
};

/* ---------- Portal BI con IA: el chat al costado del tablero, como se usa en el portal ---------- */
FX.aichat = {
  enter(el) {
    const m = $('.vmock', el), app = $('.vmock__app', m), cur = $('.vmock__cursor', m), tab = $('.vmock__tab', m);
    const thread = $('.vchat__thread', m), hello = $('.vchat__hello', m), q = $('.vchat__q', m), steps = $$('.vchat__steps li', m);
    const dax = $('.vchat__dax', m), lines = $$('.code .l', dax), ans = $('.vchat__ans', m), graf = $('.vchat__graf', m);
    const chart = $('.vchat__chart', m), field = $('.vchat__field', m), typed = $('[data-q]', m);
    const send = $('.vchat__send', m), close = $('.vchat__x', m);
    const text = '¿Qué sucursal creció más este año?';
    const parts = [q, dax, ans, graf, chart, ...steps];
    const show = (n, on = true) => n.classList.toggle('is-shown', on);
    const at = seq(el);
    if (RM) {
      m.classList.add('is-open');
      hello.classList.add('is-gone');
      q.textContent = text;
      parts.forEach((n) => show(n));
      steps.forEach((s) => s.classList.add('is-done'));
      lines.forEach((l) => l.classList.add('is-typed'));
      chart.classList.add('is-drawn');
      return;
    }
    // el cursor va al centro (o a un punto relativo) del elemento indicado
    const moveTo = (node, fx = .5, fy = .5) => {
      const a = app.getBoundingClientRect(), r = node.getBoundingClientRect();
      cur.style.transform = `translate(${(r.left - a.left + r.width * fx).toFixed(1)}px, ${(r.top - a.top + r.height * fy).toFixed(1)}px)`;
    };
    const click = (node) => {
      cur.classList.add('is-click');
      node?.classList.add('is-press');
      at(170, () => { cur.classList.remove('is-click'); node?.classList.remove('is-press'); });
    };
    const toBottom = () => { thread.scrollTop = thread.scrollHeight; };
    const run = () => {
      el._seq = [];
      m.classList.remove('is-open');
      hello.classList.remove('is-gone');
      parts.forEach((n) => show(n, false));
      steps.forEach((s) => s.classList.remove('is-done'));
      lines.forEach((l) => l.classList.remove('is-typed'));
      chart.classList.remove('is-drawn');
      field.classList.remove('is-focus', 'has-text');
      thread.scrollTop = 0;
      cur.classList.remove('is-on');
      cur.style.transition = 'none';
      moveTo(app, .3, .85);
      void cur.offsetWidth; // aplica la posición inicial sin animarla
      cur.style.transition = '';
      at(450, () => cur.classList.add('is-on'));
      at(650, () => moveTo(tab, .45, .5));
      at(1500, () => { click(tab); m.classList.add('is-open'); });
      at(2350, () => moveTo(field, .25, .5));
      at(3150, () => { click(); field.classList.add('is-focus', 'has-text'); });
      let t = typeInto(at, typed, text, 3250, 42) + 250;
      at(t, () => moveTo(send));
      at(t + 800, () => {
        click(send);
        field.classList.remove('is-focus', 'has-text');
        hello.classList.add('is-gone');
        q.textContent = text;
        show(q);
      });
      t += 1050;
      steps.forEach((s, i) => {
        at(t + i * 650, () => { show(s); toBottom(); });
        at(t + i * 650 + 560, () => s.classList.add('is-done'));
      });
      t += steps.length * 650 + 200;
      at(t, () => { show(dax); toBottom(); });
      lines.forEach((l, i) => at(t + 100 + i * 300, () => typeLine(l, 14)));
      t += 100 + lines.length * 300 + 350;
      at(t, () => { show(ans); show(graf); toBottom(); });
      at(t + 900, () => moveTo(graf));
      at(t + 1750, () => {
        click(graf);
        show(chart);
        toBottom();
        at(80, () => { chart.classList.add('is-drawn'); toBottom(); });
      });
      t += 1750 + 4300;
      at(t, () => moveTo(close));
      at(t + 850, () => { click(close); m.classList.remove('is-open'); });
      at(t + 1450, () => cur.classList.remove('is-on'));
      at(t + 2700, run);
    };
    run();
  },
  leave(el) { stopSeq(el); },
};

/* ---------- Escenas de código: el agente escribe y lo construido aparece a la derecha ---------- */
// data-show en una línea indica qué se revela al terminar de tipearla.
function codeScene(el, { text, msPerChar, onShow, reset, finish, hold }) {
  const q = $('[data-q]', el), prompt = $('.ide__prompt', el), status = $('.ide__status', el);
  const lines = $$('.code .l', el), done = $('.ide__done', el);
  const at = seq(el);
  const showAll = () => {
    q.textContent = text;
    prompt.classList.add('is-sent');
    status?.classList.add('is-shown');
    lines.forEach((l) => l.classList.add('is-typed'));
    lines.forEach((l) => l.dataset.show && onShow(l.dataset.show, true));
    done.classList.add('is-shown');
  };
  if (RM) { showAll(); return; }
  const run = () => {
    el._seq = [];
    reset();
    prompt.classList.remove('is-sent');
    status?.classList.remove('is-shown');
    done.classList.remove('is-shown');
    lines.forEach((l) => l.classList.remove('is-typed'));
    let t = typeInto(at, q, text, 400, 24) + 200;
    at(t, () => prompt.classList.add('is-sent'));
    if (status) { at(t + 250, () => status.classList.add('is-shown')); t += 300; }
    t += 350;
    lines.forEach((l) => {
      const dur = Math.max(1, l.textContent.length) * msPerChar;
      at(t, () => typeLine(l, msPerChar));
      if (l.dataset.show) at(t + dur, () => onShow(l.dataset.show, false));
      t += dur + 110;
    });
    at(t + 250, () => { done.classList.add('is-shown'); finish?.(); });
    at(t + hold, run);
  };
  run();
}

FX.mcp = {
  enter(el) {
    const nums = $$('[data-to]', el);
    codeScene(el, {
      text: 'Crea un tablero de ventas por sucursal, con KPIs y tendencia mensual',
      msPerChar: 11,
      hold: 6500,
      reset: () => {
        el.classList.remove('is-kpi', 'is-bars', 'is-line');
        nums.forEach((n) => { n.textContent = numText(n, 0); });
      },
      onShow: (what, instant) => {
        el.classList.add(`is-${what}`);
        if (what === 'kpi') nums.forEach((n) => (instant ? (n.textContent = numText(n, +n.dataset.to)) : countUp(el, n)));
      },
    });
  },
  leave(el) {
    stopSeq(el);
    // en reposo (e impresión) los KPI muestran su valor final
    $$('[data-to]', el).forEach((n) => { n.textContent = numText(n, +n.dataset.to); });
  },
};

FX.iac = {
  enter(el) {
    const nodes = $$('[data-node]', el);
    codeScene(el, {
      text: 'Crea la plataforma de datos de ventas en Fabric y publica su API',
      msPerChar: 8,
      hold: 7000,
      reset: () => nodes.forEach((n) => n.classList.remove('is-on')),
      onShow: (what) => nodes.filter((n) => n.dataset.node === what).forEach((n) => n.classList.add('is-on')),
    });
  },
  leave(el) { stopSeq(el); },
};

/* ---------- Pestañas: recorrido guiado ----------
   Mientras nadie las toca, avanzan solas cada TAB_MS con una barra de progreso bajo la
   pestaña activa; las que faltan ver laten. El primer clic (o el teclado) le da el
   control a la persona y el avance automático se detiene para ese grupo. */
const TAB_MS = 5000;
function tabsStart(st) {
  clearTimeout(st.timer);
  st.paused = false;
  st.box.classList.add('is-auto');
  st.box.classList.remove('is-paused');
  st.t0 = performance.now();
  st.timer = setTimeout(() => {
    const { tabs, select } = st.box._tabs;
    const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    select((i + 1) % tabs.length, false);
    st.left = TAB_MS;
    tabsStart(st);
  }, st.left);
}
function tabsStop(st) {
  clearTimeout(st.timer);
  st.paused = false;
  st.box.classList.remove('is-auto', 'is-paused');
}
FX.tabs = {
  init(box) {
    const st = { box, timer: 0, left: TAB_MS, t0: 0, paused: false, user: false };
    box._auto = st;
    box.style.setProperty('--tab-dur', `${TAB_MS}ms`);
    const takeOver = () => { st.user = true; tabsStop(st); };
    box.addEventListener('tabs:user', takeOver);
    // tocar el contenido (p. ej. para desplazarse y leer en el celular) también le da el control
    box.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') takeOver(); });
    // con teclado o al abrir una captura, el panel no debe cambiar debajo de la persona
    box.addEventListener('focusin', takeOver);
    box.addEventListener('click', (e) => { if (e.target.closest('a.zoom')) takeOver(); });
    box.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || !box.classList.contains('is-auto') || st.paused) return;
      clearTimeout(st.timer);
      st.left = Math.max(400, st.left - (performance.now() - st.t0));
      st.paused = true;
      box.classList.add('is-paused');
    });
    box.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse' && st.paused && !st.user) tabsStart(st);
    });
  },
  enter(box) {
    const st = box._auto;
    if (RM || st.user) return;
    st.left = TAB_MS;
    tabsStart(st);
  },
  leave(box) { tabsStop(box._auto); },
};

/* ---------- IA: mapa de integración ----------
   Dos escenarios alternados; cada línea de código, al terminar de escribirse, ilumina
   el tramo del mapa que usa (data-show → nodos y cables). */
const AIMAP = [
  {
    text: 'Resume las ventas de hoy con IA local y mándaselas al gerente por WhatsApp',
    done: 'Resumen enviado por WhatsApp en 3,2 s, sin que los datos salgan de la empresa',
    show: { db: ['db'], local: ['local'], msg: ['msg'] },
  },
  {
    text: 'Crea un asistente que responda preguntas sobre los contratos en PDF',
    done: 'Asistente publicado en el portal: responde citando cada contrato',
    show: { docs: ['docs', 'vec'], cloud: ['cloud'], dash: ['dash'] },
  },
];
FX.aimap = {
  init(el) { $('svg', el)?.pauseAnimations?.(); },
  enter(el) {
    const svg = $('svg', el), q = $('[data-q]', el), prompt = $('.ide__prompt', el), done = $('.ide__done', el);
    const scenes = $$('.code[data-scene]', el);
    const hot = (keys) => keys.forEach((k) => $$(`[data-l="${k}"], [data-n="${k}"]`, el).forEach((n) => n.classList.add('is-hot')));
    const at = seq(el);
    if (RM) {
      scenes.forEach((p, i) => p.classList.toggle('is-on', i === 0));
      q.textContent = AIMAP[0].text;
      prompt.classList.add('is-sent');
      $$('.l', scenes[0]).forEach((l) => l.classList.add('is-typed'));
      Object.values(AIMAP[0].show).forEach(hot);
      done.textContent = AIMAP[0].done;
      done.classList.add('is-shown');
      return;
    }
    svg?.unpauseAnimations?.();
    let k = 0;
    const run = () => {
      el._seq = [];
      const s = AIMAP[k % AIMAP.length], pre = scenes[k % AIMAP.length];
      $$('.is-hot', el).forEach((n) => n.classList.remove('is-hot'));
      done.classList.remove('is-shown');
      done.textContent = s.done; // oculto, pero ya ocupa su lugar: el mapa no se mueve al aparecer
      prompt.classList.remove('is-sent');
      scenes.forEach((p) => {
        p.classList.toggle('is-on', p === pre);
        $$('.l', p).forEach((l) => l.classList.remove('is-typed'));
      });
      let t = typeInto(at, q, s.text, 500, 26) + 200;
      at(t, () => prompt.classList.add('is-sent'));
      t += 400;
      $$('.l', pre).forEach((l) => {
        const dur = Math.max(1, l.textContent.length) * 16;
        at(t, () => typeLine(l, 16));
        if (l.dataset.show) at(t + dur, () => hot(s.show[l.dataset.show]));
        t += dur + 220;
      });
      at(t + 200, () => done.classList.add('is-shown'));
      at(t + 6200, () => { k += 1; run(); });
    };
    run();
  },
  leave(el) {
    stopSeq(el);
    $('svg', el)?.pauseAnimations?.();
    $('.ide__done', el).textContent = AIMAP[0].done; // en reposo (e impresión) queda el primer escenario
  },
};

/* ---------- Banca: mensajes del bot ---------- */
FX.chat = {
  enter(el, first, resume) {
    if (resume) return;
    const msgs = $$('.msg', el);
    (el._timers || []).forEach(clearTimeout);
    el._timers = [];
    if (RM) { msgs.forEach((m) => m.classList.add('is-shown')); return; }
    msgs.forEach((m) => m.classList.remove('is-shown'));
    msgs.forEach((m, i) => el._timers.push(setTimeout(() => m.classList.add('is-shown'), 450 + i * 950)));
  },
  leave(el, pause) {
    if (pause) return;
    (el._timers || []).forEach(clearTimeout);
    $$('.msg', el).forEach((m) => m.classList.add('is-shown'));
  },
};

/* =====================================================================
   COMPONENTES GLOBALES
   ===================================================================== */
function initTabs() {
  $$('[data-tabs]').forEach((box) => {
    const tabs = $$('[role="tab"]', box);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    let ready = false; // al arrancar no se mide nada (evita forzar el layout)
    const select = (i, focus) => {
      tabs.forEach((t, j) => {
        const on = j === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      tabs[i].classList.remove('is-new');
      if (focus) tabs[i].focus();
      // si quedó fuera de vista en la tira de pestañas (móvil), se acerca
      const list = tabs[i].parentElement;
      if (ready && list.scrollWidth > list.clientWidth) list.scrollTo({ left: tabs[i].offsetLeft - (list.clientWidth - tabs[i].offsetWidth) / 2, behavior: RM ? 'auto' : 'smooth' });
    };
    box._tabs = { tabs, select };
    const user = () => box.dispatchEvent(new CustomEvent('tabs:user'));
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { user(); select(i); });
      t.addEventListener('keydown', (e) => {
        const k = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
        if (k === undefined) return;
        e.preventDefault();
        user();
        select(k, true);
      });
    });
    tabs.forEach((t) => t.classList.add('is-new'));
    select(Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true')));
    ready = true;
  });
}

const lightbox = {
  init() {
    const dlg = $('#lightbox');
    Object.assign(this, { dlg, stage: $('[data-lb-stage]', dlg), cap: $('[data-lb-caption]', dlg), count: $('[data-lb-count]', dlg), real: $('[data-lb="real"]', dlg) });
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a.zoom');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      this.open(a);
    });
    dlg.addEventListener('click', (e) => {
      const b = e.target.closest('[data-lb]');
      if (b) {
        ({ close: () => dlg.close(), prev: () => this.step(-1), next: () => this.step(1), real: () => this.toggleReal() })[b.dataset.lb]?.();
        return;
      }
      if (e.target.tagName === 'IMG') this.toggleReal();
      else if (e.target === this.stage || e.target === dlg) dlg.close();
    });
    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); this.step(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.step(-1); }
    });
    let sx = null;
    this.stage.addEventListener('touchstart', (e) => { sx = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
    this.stage.addEventListener('touchend', (e) => {
      if (sx == null || this.stage.classList.contains('is-real')) return;
      const dx = e.changedTouches[0].clientX - sx;
      sx = null;
      if (Math.abs(dx) > 60) this.step(dx < 0 ? 1 : -1);
    }, { passive: true });
    dlg.addEventListener('close', () => { this.stage.replaceChildren(); this.opener?.focus({ preventScroll: true }); });
  },
  open(a) {
    const scope = a.closest('[role="tabpanel"]') || a.closest('.slide') || document;
    this.group = $$('a.zoom', scope).filter((x) => !x.closest('[hidden]'));
    this.k = Math.max(0, this.group.indexOf(a));
    this.opener = a;
    this.render();
    this.dlg.showModal();
  },
  render() {
    const a = this.group[this.k];
    const pic = a.querySelector('picture').cloneNode(true);
    pic.removeAttribute('class');
    pic.querySelectorAll('source').forEach((s) => s.setAttribute('sizes', '100vw'));
    const img = pic.querySelector('img');
    img.removeAttribute('loading');
    img.setAttribute('fetchpriority', 'high');
    this.stage.classList.remove('is-real');
    this.real.setAttribute('aria-pressed', 'false');
    this.stage.replaceChildren(pic);
    this.cap.textContent = a.dataset.caption || '';
    const many = this.group.length > 1;
    this.count.textContent = many ? `${this.k + 1} de ${this.group.length}` : '';
    $$('[data-lb="prev"], [data-lb="next"]', this.dlg).forEach((b) => { b.hidden = !many; });
  },
  step(d) {
    if (this.group.length < 2) return;
    this.k = (this.k + d + this.group.length) % this.group.length;
    this.render();
  },
  toggleReal() {
    const on = !this.stage.classList.contains('is-real');
    this.stage.classList.toggle('is-real', on);
    this.real.setAttribute('aria-pressed', String(on));
  },
};

const indexPanel = {
  init() {
    this.dlg = $('#indice');
    let html = '', chapter = null;
    deck.slides.forEach((s, k) => {
      if (s.dataset.chapter !== chapter) {
        if (chapter !== null) html += '</ol></div>';
        chapter = s.dataset.chapter;
        html += `<div class="index__group"><h3>${esc(chapter)}</h3><ol>`;
      }
      html += `<li><a href="#${esc(s.id)}" data-k="${k}"><span>${String(k + 1).padStart(2, '0')}</span>${esc(s.dataset.title)}</a></li>`;
    });
    $('[data-index-list]', this.dlg).innerHTML = `${html}</ol></div>`;
    $$('[data-open-index]').forEach((b) => b.addEventListener('click', () => this.open()));
    this.dlg.addEventListener('click', (e) => { if (e.target === this.dlg || e.target.closest('[data-close]')) this.dlg.close(); });
    $('[data-print]', this.dlg)?.addEventListener('click', () => { this.dlg.close(); printDeck(); });
  },
  open() {
    $$('a[data-k]', this.dlg).forEach((a) => a.setAttribute('aria-current', String(+a.dataset.k === deck.i)));
    this.dlg.showModal();
    $(`a[data-k="${deck.i}"]`, this.dlg)?.focus();
  },
};

async function printDeck() {
  const imgs = $$('.deck img');
  imgs.forEach((i) => { i.loading = 'eager'; });
  await Promise.race([Promise.all(imgs.map((i) => i.decode().catch(() => {}))), new Promise((r) => setTimeout(r, 8000))]);
  print();
}

/* ---------- Arranque ---------- */
initTabs();
fx.init();
deck.init();
lightbox.init();
indexPanel.init();
bindInputs();
