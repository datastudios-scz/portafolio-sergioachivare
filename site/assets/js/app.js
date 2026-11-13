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
    if (k === this.i) return false;
    if (this.busy) { this.pending = [k, opts]; return false; }
    this.show(k, opts);
    return true;
  },
  next(opts) { return this.go(this.i + 1, opts); },
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
    // en la carga inicial no se toca scrollTop: forzaría el layout dentro de la tarea del script
    if (sc && !instant) sc.scrollTop = dir < 0 ? sc.scrollHeight : 0;
    if (sc) requestAnimationFrame(() => updateMore(sc));

    const done = () => {
      if (from && from !== to) { from.classList.remove('is-active', 'is-leaving'); from.inert = true; }
      to.classList.remove('is-entering');
      this.busy = false;
      if (this.pending) { const [pk, po] = this.pending; this.pending = null; this.go(pk, po); }
    };

    if (!from || from === to || instant) {
      document.documentElement.dataset.surface = to.dataset.theme;
      done();
      fx.enter(to, true);
    } else {
      this.busy = true;
      from.inert = true;
      fx.leave(from);
      transition(from, to, dir).then(done);
      setTimeout(() => { document.documentElement.dataset.surface = to.dataset.theme; }, RM ? 0 : 330);
      setTimeout(() => fx.enter(to, false), RM ? 0 : 300);
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
      a.innerHTML = `<span class="rail__label">${s.dataset.title}</span>`;
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
    if (document.hidden) fx.leave(deck.current, true); else fx.enter(deck.current, false, true);
  });
}

/* =====================================================================
   EFECTOS (se montan por diapositiva con data-fx)
   ===================================================================== */
const FX = {};
const fx = {
  init() { $$('[data-fx]').forEach((el) => FX[el.dataset.fx]?.init?.(el)); },
  enter(slide, first, resume) { if (slide) $$('[data-fx]', slide).forEach((el) => FX[el.dataset.fx]?.enter?.(el, first, resume)); },
  leave(slide, pause) { if (slide) $$('[data-fx]', slide).forEach((el) => FX[el.dataset.fx]?.leave?.(el, pause)); },
};

/* ---------- Portada: retrato que nace de un gráfico de dispersión ---------- */
FX.portrait = {
  init(fig) {
    const st = { fig, wrap: $('.portrait', fig), canvas: $('canvas', fig), hint: $('.portrait__hint', fig), played: false };
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
    await st.ready;
    if (st.failed) return;
    if (RM || st.played) { renderPortrait(st, Infinity); st.hint?.classList.add('is-on'); return; }
    st.played = true;
    await fontsReady();
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

/* ---------- Arquitectura: cables y paquetes de datos ---------- */
FX.flow = {
  init(el) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = $('svg', el), grid = $('.flow__grid', el);
    const edges = el.dataset.edges.split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
      const [pair, wide, narrow] = s.split(':');
      const [a, b] = pair.split('>');
      return { a, b, wide, narrow };
    });
    edges.forEach((e, k) => {
      e.path = document.createElementNS(NS, 'path');
      e.path.setAttribute('class', `wire${e.b === 'portal' || e.a === 'portal' ? ' wire--hot' : ''}`);
      e.path.id = `wire-${k}`;
      svg.append(e.path);
    });
    edges.forEach((e, k) => {
      for (let j = 0; j < 2; j++) {
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'packets');
        g.innerHTML = `<circle class="packet-glow" r="7"></circle><circle class="packet" r="3.2"></circle>`
          + `<animateMotion dur="2.8s" repeatCount="indefinite" begin="${-(j * 1.4 + k * .37).toFixed(2)}s"><mpath href="#wire-${k}"></mpath></animateMotion>`;
        svg.append(g);
      }
    });
    svg.pauseAnimations?.();
    const st = { el, svg, grid, edges };
    el._st = st;
    new ResizeObserver(() => flowLayout(st)).observe(el);
  },
  enter(el, first, resume) {
    const st = el._st;
    flowLayout(st);
    if (!RM) st.svg.unpauseAnimations?.();
    if (resume) return;
    clearTimeout(st.live);
    if (RM) { el.classList.add('is-live'); return; }
    el.classList.remove('is-live');
    st.edges.forEach((e, k) => {
      e.path.style.strokeDasharray = `${e.len}`;
      e.path.animate([{ strokeDashoffset: e.len }, { strokeDashoffset: 0 }], {
        duration: 620, delay: 150 + k * 110, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'backwards',
      }).finished.then(() => { e.path.style.strokeDasharray = ''; }).catch(() => {});
    });
    st.live = setTimeout(() => el.classList.add('is-live'), 150 + st.edges.length * 110 + 450);
  },
  leave(el) { el._st.svg.pauseAnimations?.(); clearTimeout(el._st.live); },
};

function flowLayout(st) {
  const { el, svg, grid, edges } = st;
  const box = el.getBoundingClientRect();
  if (!box.width) return;
  const narrow = getComputedStyle(grid).gridTemplateColumns.split(' ').length <= 2;
  svg.setAttribute('viewBox', `0 0 ${box.width.toFixed(1)} ${box.height.toFixed(1)}`);
  const rect = (name) => {
    const r = $(`[data-node="${name}"]`, el).getBoundingClientRect();
    const l = r.left - box.left, t = r.top - box.top;
    return { l, t, r: l + r.width, b: t + r.height, cx: l + r.width / 2, cy: t + r.height / 2 };
  };
  const f = (n) => n.toFixed(1);
  const rounded = (pts, rad) => {
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      const r1 = Math.min(rad, Math.hypot(x1 - x0, y1 - y0) / 2, Math.hypot(x2 - x1, y2 - y1) / 2);
      const ax = x1 - Math.sign(x1 - x0) * r1, ay = y1 - Math.sign(y1 - y0) * r1;
      const bx = x1 + Math.sign(x2 - x1) * r1, by = y1 + Math.sign(y2 - y1) * r1;
      d += ` L${f(ax)},${f(ay)} Q${f(x1)},${f(y1)} ${f(bx)},${f(by)}`;
    }
    const last = pts.at(-1);
    return `${d} L${f(last[0])},${f(last[1])}`;
  };
  for (const e of edges) {
    const A = rect(e.a), B = rect(e.b);
    const route = narrow ? e.narrow : e.wide;
    let d;
    if (route === 'under') {
      const y0 = Math.max(A.b, B.b) + 24;
      d = rounded([[A.cx, A.b], [A.cx, y0], [B.cx, y0], [B.cx, B.b]], 14);
    } else if (route === 'side') {
      const x0 = Math.max(A.r, B.r) + 12;
      d = rounded([[A.r, A.cy], [x0, A.cy], [x0, B.cy], [B.r, B.cy]], 10);
    } else if (!narrow) {
      const mx = (A.r + B.l) / 2;
      d = `M${f(A.r)},${f(A.cy)} C${f(mx)},${f(A.cy)} ${f(mx)},${f(B.cy)} ${f(B.l)},${f(B.cy)}`;
    } else {
      const my = (A.b + B.t) / 2;
      d = `M${f(A.cx)},${f(A.b)} C${f(A.cx)},${f(my)} ${f(B.cx)},${f(my)} ${f(B.cx)},${f(B.t)}`;
    }
    e.path.setAttribute('d', d);
    e.len = e.path.getTotalLength();
  }
}

/* ---------- Portal: pasos sincronizados con la pantalla ---------- */
FX.steps = {
  init(el) {
    const st = { el, steps: $$('.step', el), screens: $$('.screen', el), k: 0, timer: 0, auto: true, active: false };
    el._st = st;
    st.steps.forEach((b) => b.addEventListener('click', () => { st.auto = false; clearInterval(st.timer); setStep(st, +b.dataset.step); }));
    el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') clearInterval(st.timer); });
    el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && st.auto && st.active) autoStep(st); });
    el.addEventListener('focusin', () => clearInterval(st.timer));
  },
  enter(el, first, resume) {
    const st = el._st;
    st.active = true;
    if (!resume) { st.auto = true; setStep(st, 0); }
    if (!RM && st.auto) autoStep(st);
  },
  leave(el) { const st = el._st; st.active = false; clearInterval(st.timer); },
};
function setStep(st, k) {
  st.k = k;
  st.steps.forEach((b) => { const on = +b.dataset.step === k; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
  st.screens.forEach((s) => s.classList.toggle('is-on', +s.dataset.step === k));
}
function autoStep(st) { clearInterval(st.timer); st.timer = setInterval(() => setStep(st, (st.k + 1) % st.steps.length), 3400); }

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
    const select = (i, focus) => {
      tabs.forEach((t, j) => {
        const on = j === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        const k = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
        if (k === undefined) return;
        e.preventDefault();
        select(k, true);
      });
    });
    select(Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true')));
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
        html += `<div class="index__group"><h3>${chapter}</h3><ol>`;
      }
      html += `<li><a href="#${s.id}" data-k="${k}"><span>${String(k + 1).padStart(2, '0')}</span>${s.dataset.title}</a></li>`;
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
