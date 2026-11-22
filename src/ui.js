/* ---------- Styles (src/styles.css, inlined by the build) ---------- */
const style = document.createElement('style');
style.textContent = CSS;
document.head.appendChild(style);

/* ---------- DOM skeleton ---------- */
const root = document.createElement('div');
root.id = 'cpb-root';
root.className = 'off';
root.innerHTML = `
  <div class="cpb-conv" id="cpb-panel" hidden>
    <button type="button" id="cpb-head"></button>
    <div id="cpb-box" hidden>
      <div class="cpb-box-h">
        <span class="t"><span class="g">${icon('pin', 13)}</span><span>Pinned</span></span>
        <div class="cpb-seg">
          <button type="button" data-dock="top" title="Show at the top">${icon('dockTop', 14)}</button>
          <button type="button" data-dock="left" title="Show on the left">${icon('dockLeft', 14)}</button>
        </div>
        <button type="button" class="cpb-ib" id="cpb-close" title="Close">${icon('x', 14)}</button>
      </div>
      <div id="cpb-list"></div>
      <div class="cpb-grip" title="Drag to resize, double-click to reset"></div>
    </div>
  </div>
  <div class="cpb-conv" id="cpb-menu"></div>
  <div class="cpb-conv" id="cpb-rail"><div class="track"></div><div id="cpb-thumb"></div><div id="cpb-dots"></div></div>
  <button type="button" class="cpb-conv" id="cpb-add" title="Mark where you are reading">${icon('plus', 13)}</button>
  <button type="button" class="cpb-conv" id="cpb-clear" title="Clear all pins and marks" hidden>${icon('trash', 13)}</button>
  <div id="cpb-modal"><div class="cpb-dlg" role="dialog" aria-modal="true" aria-labelledby="cpb-dlg-t">
    <div class="ic">${icon('trash', 18)}</div>
    <h3 id="cpb-dlg-t">Clear this conversation?</h3>
    <p></p>
    <div class="r"><button type="button" class="cpb-btn" data-dlg="cancel">Cancel</button><button type="button" class="cpb-btn danger" data-dlg="ok">Clear all</button></div>
  </div></div>
  <div class="cpb-conv" id="cpb-bar">
    <button type="button" class="cpb-ib" data-act="pin" title="Pin to top">${icon('pin', 15)}</button>
    <button type="button" class="cpb-ib" data-act="mark" title="Add mark">${icon('mark', 15)}</button>
  </div>
  <div id="cpb-tip"><div class="k"></div><div class="t"></div><div class="s"></div></div>
  <div id="cpb-beam"></div>
  <button type="button" id="cpb-ptab">${icon('text', 13)}<span>Prompts</span><span class="n"></span></button>
  <div id="cpb-tray"></div>
  <button type="button" id="cpb-sel">${icon('plus', 13)}<span>Save as prompt</span></button>
  <div id="cpb-toast"></div>`;
document.body.appendChild(root);

const $ = (id) => root.querySelector('#' + id);
const panel = $('cpb-panel'), head = $('cpb-head'), box = $('cpb-box'), list = $('cpb-list'), grip = root.querySelector('.cpb-grip'), menu = $('cpb-menu');
const rail = $('cpb-rail'), dots = $('cpb-dots'), thumb = $('cpb-thumb'), addBtn = $('cpb-add'), clearBtn = $('cpb-clear'), modal = $('cpb-modal');
const bar = $('cpb-bar'), tip = $('cpb-tip'), beam = $('cpb-beam');
const ptab = $('cpb-ptab'), tray = $('cpb-tray'), selChip = $('cpb-sel'), toastEl = $('cpb-toast');

/* ---------- State ---------- */
const T = { convId: null, api: null, apiErr: null, org: null, lastFetch: 0, backoff: 4000, fetching: false, entries: [], elIndex: new Map() };
const S = { sc: null, data: { pins: [], marks: [] }, panelOpen: false, openPins: new Set(), editing: null, panelSig: '', railSig: '', dirty: false, railNodes: new Map() };
const P = { list: getJSON('cpb:prompts', null), open: false, form: null, range: null, selText: '', box: null };
if (!Array.isArray(P.list)) P.list = SEED_PROMPTS.map((text) => ({ id: uid(), text }));
const UI = Object.assign({ dock: 'top', topH: null, leftW: 380 }, getJSON('cpb:ui', {}));
const saveUI = () => setJSON('cpb:ui', UI);

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg, opt = {}) {
  toastEl.textContent = '';
  const s = mk('span'); s.textContent = msg; toastEl.append(s);
  if (opt.action) {
    const b = mk('button'); b.type = 'button'; b.textContent = opt.action;
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', () => { hideToast(); opt.onAction(); });
    toastEl.append(b);
  }
  toastEl.style.bottom = (P.box ? Math.max(24, innerHeight - P.box.top + 40) : 120) + 'px';
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  if (!opt.sticky) toastTimer = setTimeout(hideToast, opt.action ? 4200 : 1800);
}
const hideToast = () => toastEl.classList.remove('show');

/* ---------- Theme ---------- */
function isDark() {
  const h = document.documentElement;
  if (h.dataset.mode === 'dark' || h.dataset.theme === 'dark' || h.classList.contains('dark')) return true;
  if (h.dataset.mode === 'light' || h.dataset.theme === 'light') return false;
  for (const el of [document.body, S.sc, document.querySelector('main')]) {
    if (!el || el === h) continue;
    const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
    if (m && !(m[3] !== undefined && +m[3] === 0)) return (m[0] * 299 + m[1] * 587 + m[2] * 114) / 1000 < 128;
  }
  return matchMedia('(prefers-color-scheme: dark)').matches;
}
