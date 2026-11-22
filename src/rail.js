/* ---------- Side rail ---------- */
function showTip(node, kind, title, snippet) {
  tip.querySelector('.k').textContent = kind;
  tip.querySelector('.t').textContent = title;
  tip.querySelector('.s').textContent = snippet || '';
  const r = node.getBoundingClientRect(), rr = rail.getBoundingClientRect(), th = tip.offsetHeight, tw = tip.offsetWidth;
  tip.style.left = Math.max(8, rr.left - tw - 10) + 'px';
  tip.style.top = Math.max(8, Math.min(innerHeight - th - 8, r.top + r.height / 2 - th / 2)) + 'px';
  tip.classList.add('show');
}
const hideTip = () => tip.classList.remove('show');
const snippetOf = (t) => clipWidth((t || '').replace(/```[\s\S]*?```/g, ' ').replace(/[#*_>`]/g, ''), 150);

function addRailNode(cls, pos, kind, getTitle, getSnippet, onClick, menuFor) {
  const n = mk('div', cls);
  n.style.top = pct(pos);
  n.addEventListener('mouseenter', () => showTip(n, kind, getTitle(), getSnippet()));
  n.addEventListener('mouseleave', hideTip);
  n.addEventListener('click', (e) => { e.stopPropagation(); hideTip(); onClick(); });
  if (menuFor) {
    n.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); openMenu(n, menuFor.kind, menuFor.id); });
    S.railNodes.set(menuFor.id, n);
  }
  dots.append(n);
}
function renderRail() {
  const E = T.entries;
  const sig = [convId(), E.length, Math.round((T.totalChars || 0) / 400), S.data.pins.map((p) => p.id + p.title).join(), S.data.marks.map((m) => m.id + m.title + m.frac).join()].join('|');
  clearBtn.hidden = !S.data.pins.length && !S.data.marks.length;
  if (sig === S.railSig) return;
  S.railSig = sig;
  dots.textContent = '';
  S.railNodes = new Map();
  E.forEach((e, i) => {
    if (e.role !== 'u') return;
    addRailNode('cpb-q', e.start, 'Question', () => condense(e.text), () => (norm(e.text).length > 40 ? snippetOf(e.text) : ''), () => seek(i, 0));
  });
  for (const m of S.data.marks) {
    const i = locate(m);
    if (i < 0) continue;
    addRailNode('cpb-mark', E[i].start + m.frac * E[i].w, 'Mark · right-click to rename or remove', () => m.title, () => snippetOf(E[i].text), () => seek(i, m.frac), { kind: 'mark', id: m.id });
  }
  for (const p of S.data.pins) {
    const i = locate(p);
    if (i < 0) continue;
    addRailNode('cpb-pin', E[i].start, 'Pinned · right-click to rename or unpin', () => p.title, () => snippetOf(E[i].text), () => seek(i, 0), { kind: 'pin', id: p.id });
  }
}
function updateThumb() {
  if (!S.sc) return;
  const v = viewport(S.sc);
  let a = null, b = null;
  T.elIndex.forEach((i, el) => {
    if (!el.isConnected) return;
    const r = el.getBoundingClientRect();
    if (r.height <= 0 || r.bottom < v.top || r.top > v.bottom) return;
    const e = T.entries[i];
    const pt = e.start + clamp01((v.top - r.top) / r.height) * e.w, pb = e.start + clamp01((v.bottom - r.top) / r.height) * e.w;
    a = a === null ? pt : Math.min(a, pt);
    b = b === null ? pb : Math.max(b, pb);
  });
  if (a === null) return;
  thumb.style.opacity = 1;
  thumb.style.top = pct(a);
  thumb.style.height = `max(14px, ${((b - a) * 100).toFixed(3)}%)`;
}
/* Push the conversation aside when the panel is docked on the left */
const SHIFT = { el: null, orig: '', timer: null };
function shiftTarget() {
  const sc = S.sc;
  if (!sc || isDocSc(sc)) return null;
  const ed = findEditor();
  if (!ed) return sc;
  let a = sc;
  while (a && !a.contains(ed)) a = a.parentElement;
  if (!a || a === document.body || a === document.documentElement) return sc;
  const ar = a.getBoundingClientRect(), sr = sc.getBoundingClientRect();
  return ar.left >= sr.left - 4 && ar.width <= sr.width + 40 ? a : sc;
}
function applyShift(px) {
  if (!px) {
    if (!SHIFT.el) return;
    const el = SHIFT.el;
    el.style.paddingLeft = SHIFT.orig;
    SHIFT.el = null;
    clearTimeout(SHIFT.timer);
    SHIFT.timer = setTimeout(() => el.classList.remove('cpb-shift'), 320);
    return;
  }
  const t = SHIFT.el && SHIFT.el.isConnected ? SHIFT.el : shiftTarget();
  if (!t) return;
  if (SHIFT.el !== t) {
    if (SHIFT.el) SHIFT.el.style.paddingLeft = SHIFT.orig;
    SHIFT.el = t;
    SHIFT.orig = t.style.paddingLeft;
    clearTimeout(SHIFT.timer);
    t.classList.add('cpb-shift');
  }
  const v = px + 'px';
  if (t.style.paddingLeft !== v) t.style.paddingLeft = v;
}
let noBarEl = null;
function hideNativeScrollbar(sc) {
  const target = sc ? (isDocSc(sc) ? document.documentElement : sc) : null;
  if (noBarEl === target) return;
  if (noBarEl) noBarEl.classList.remove('cpb-noscrollbar');
  noBarEl = target;
  if (target) target.classList.add('cpb-noscrollbar');
}

function layout() {
  if (!S.sc) return;
  const v = viewport(S.sc);
  const right = Math.max(4, innerWidth - v.right + 6);
  const top = Math.max(v.top + 40, 90);
  const bottomEdge = P.box && P.box.top > top + 200 ? P.box.top - 36 : v.bottom - 60;
  rail.style.right = right + 'px';
  rail.style.top = top + 'px';
  rail.style.bottom = Math.max(60, innerHeight - bottomEdge) + 'px';
  addBtn.style.right = right - 1 + 'px';
  addBtn.style.bottom = Math.max(30, innerHeight - bottomEdge - 32) + 'px';
  clearBtn.style.right = right - 1 + 'px';
  clearBtn.style.bottom = Math.max(4, innerHeight - bottomEdge - 62) + 'px';
  if (panel.classList.contains('left')) {
    const baseEl = SHIFT.el || shiftTarget();
    const b = baseEl ? baseEl.getBoundingClientRect() : v;
    const w = Math.round(Math.min(UI.leftW, Math.max(240, b.width - 440)));
    panel.style.transform = 'none';
    panel.style.left = b.left + 12 + 'px';
    panel.style.top = Math.max(b.top + 12, 60) + 'px';
    let bottom = innerHeight - Math.min(b.bottom, innerHeight) + 12;
    if (P.box && P.box.left < b.left + w + 24) bottom = Math.max(bottom, innerHeight - P.box.top + 12);
    panel.style.bottom = Math.max(12, bottom) + 'px';
    panel.style.width = w + 'px';
    applyShift(w + 24);
  } else {
    applyShift(0);
    panel.style.transform = 'translateX(-50%)';
    panel.style.left = (v.left + v.right) / 2 + 'px';
    panel.style.top = '58px';
    panel.style.bottom = 'auto';
    panel.style.width = `min(1080px, ${Math.max(320, v.right - v.left - 56)}px)`;
  }
}

function ratioAt(y) { const r = rail.getBoundingClientRect(); return clamp01((y - r.top) / r.height); }
function entryAt(ratio) {
  let i = T.entries.findIndex((x) => ratio < x.start + x.w);
  if (i < 0) i = T.entries.length - 1;
  const x = T.entries[i];
  return { i, frac: clamp01((ratio - x.start) / x.w) };
}
function scrubTo(ratio) {
  const sc = S.sc;
  if (!sc) return;
  seekToken++;
  const { i, frac } = entryAt(ratio), e = T.entries[i];
  if (e.el && e.el.isConnected) sc.scrollTop = absTop(e.el, sc) + frac * e.el.offsetHeight - HEADER_OFFSET;
  else sc.scrollTop = ratio * (sc.scrollHeight - sc.clientHeight);
}
rail.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || e.target.closest('.cpb-q,.cpb-pin,.cpb-mark') || !T.entries.length || !S.sc) return;
  e.preventDefault();
  hideTip();
  rail.setPointerCapture(e.pointerId);
  rail.classList.add('drag');
  const y0 = e.clientY;
  let moved = false;
  const move = (ev) => {
    if (!moved && Math.abs(ev.clientY - y0) > 3) moved = true;
    if (moved) scrubTo(ratioAt(ev.clientY));
  };
  const end = (ev) => {
    rail.removeEventListener('pointermove', move);
    rail.removeEventListener('pointerup', end);
    rail.removeEventListener('pointercancel', end);
    rail.classList.remove('drag');
    if (ev.type === 'pointercancel') return;
    const { i, frac } = entryAt(ratioAt(ev.clientY));
    const e2 = T.entries[i];
    if (moved && e2.el && e2.el.isConnected) return;
    seek(i, frac);
  };
  rail.addEventListener('pointermove', move);
  rail.addEventListener('pointerup', end);
  rail.addEventListener('pointercancel', end);
});

addBtn.addEventListener('click', () => {
  if (!S.sc) return;
  const line = viewport(S.sc).top + HEADER_OFFSET;
  let best = -1, frac = 0, minTop = Infinity;
  T.elIndex.forEach((i, el) => {
    const r = el.getBoundingClientRect();
    if (r.top <= line && r.bottom > line) { best = i; frac = (line - r.top) / r.height; }
  });
  if (best < 0) T.elIndex.forEach((i, el) => { const t = el.getBoundingClientRect().top; if (t > line && t < minTop) { minTop = t; best = i; frac = 0; } });
  if (best < 0) return toast('Nothing to mark here yet');
  addMark(best, frac, frac > 0 ? headingAbove(T.entries[best].el, line) : null);
});

/* ---------- Clear all ---------- */
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
function openClear() {
  const { pins, marks } = S.data;
  if (!pins.length && !marks.length) return;
  const parts = [pins.length && plural(pins.length, 'pin'), marks.length && plural(marks.length, 'mark')].filter(Boolean).join(' and ');
  modal.querySelector('p').textContent = `This removes ${parts} from this conversation. Your messages are not affected.`;
  hideTip();
  closeMenu();
  modal.classList.add('show');
  setTimeout(() => modal.querySelector('[data-dlg=cancel]').focus());
}
const closeClear = () => modal.classList.remove('show');
function doClear() {
  closeClear();
  const before = loadConv();
  const n = before.pins.length + before.marks.length;
  saveConv({ ...before, pins: [], marks: [] });
  S.openPins.clear();
  S.panelOpen = false;
  S.editing = null;
  S.panelSig = '';
  S.railSig = '';
  refresh();
  toast(`Cleared ${plural(n, 'item')}`, { action: 'Undo', onAction: () => { saveConv(before); S.panelSig = ''; S.railSig = ''; refresh(); } });
}
clearBtn.addEventListener('click', openClear);
modal.addEventListener('mousedown', (e) => { if (e.target === modal) closeClear(); });
modal.querySelector('[data-dlg=cancel]').addEventListener('click', closeClear);
modal.querySelector('[data-dlg=ok]').addEventListener('click', doClear);
modal.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key === 'Escape') closeClear();
  if (e.key === 'Tab') {
    const bs = [...modal.querySelectorAll('button')], k = bs.indexOf(document.activeElement);
    e.preventDefault();
    bs[(k + (e.shiftKey ? -1 : 1) + bs.length) % bs.length].focus();
  }
});

/* ---------- Jumping (works even when Claude hasn't rendered the target yet) ---------- */
let seekToken = 0;
function highlight(el, frac) {
  setTimeout(() => {
    if (!el.isConnected) return;
    if (frac < 0.01) {
      el.classList.remove('cpb-flash'); void el.offsetWidth; el.classList.add('cpb-flash');
      setTimeout(() => el.classList.remove('cpb-flash'), 1900);
      return;
    }
    const r = el.getBoundingClientRect();
    beam.style.left = r.left - 8 + 'px';
    beam.style.width = r.width + 16 + 'px';
    beam.style.top = r.top + frac * r.height + 'px';
    beam.classList.add('show');
    setTimeout(() => beam.classList.remove('show'), 1200);
  }, 480);
}
async function seek(i, frac = 0) {
  const token = ++seekToken, sc = S.sc;
  if (!sc || !T.entries[i]) return;
  let step = 0, dir = 0, noticed = false;
  for (let n = 0; n < 50; n++) {
    if (token !== seekToken) return;
    if (n) refresh();
    const e = T.entries[i];
    if (!e) break;
    if (e.el && e.el.isConnected) {
      const go = (smooth) => sc.scrollTo({ top: absTop(e.el, sc) + frac * e.el.offsetHeight - HEADER_OFFSET, behavior: smooth ? 'smooth' : 'auto' });
      if (n === 0) go(true);
      else { go(false); await sleep(150); if (token === seekToken && e.el.isConnected) go(false); }
      if (noticed) hideToast();
      highlight(e.el, frac);
      return;
    }
    if (n === 1) { noticed = true; toast('Locating…', { sticky: true }); }
    const mounted = [];
    T.elIndex.forEach((k, el) => { if (el.isConnected) mounted.push(k); });
    mounted.sort((x, y) => x - y);
    const max = sc.scrollHeight - sc.clientHeight;
    if (n === 0 || !mounted.length) {
      sc.scrollTop = e.start * max;
    } else {
      const lo = mounted[0], hi = mounted[mounted.length - 1];
      if (i > lo && i < hi) {
        const pe = T.entries[mounted.filter((k) => k < i).pop()].el;
        sc.scrollTop = absTop(pe, sc) + pe.offsetHeight - HEADER_OFFSET;
        await sleep(220);
        continue;
      }
      const nd = i < lo ? -1 : 1, ref = T.entries[nd < 0 ? lo : hi];
      if (!step) step = Math.max(sc.clientHeight * 1.2, Math.abs(e.start - ref.start) * sc.scrollHeight);
      else if (dir && nd !== dir) step = Math.max(sc.clientHeight * 0.6, step / 2);
      dir = nd;
      const before = sc.scrollTop;
      sc.scrollTop = Math.max(0, Math.min(max, before + dir * step));
      if (Math.abs(sc.scrollTop - before) < 2) await sleep(500);
    }
    await sleep(n === 0 ? 280 : 200);
  }
  if (token === seekToken) toast('Could not reach that message. Scroll a little closer and try again.');
}
