/* ---------- Icons ---------- */
const ICONS = {
  pin: '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
  mark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  jump: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  edit: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
  dockTop: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>',
  dockLeft: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  text: '<path d="M17 6H3"/><path d="M21 12H8"/><path d="M21 18H8"/><path d="M3 12v6"/>',
};
const icon = (n, s = 16) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

/* ---------- Small helpers ---------- */
const getJSON = (k, d) => { try { const v = JSON.parse(GM_getValue(k, '')); return v == null ? d : v; } catch { return d; } };
const setJSON = (k, v) => GM_setValue(k, JSON.stringify(v));
const convId = () => (location.pathname.match(/\/chat\/([^/?#]+)/) || [])[1] || null;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const pct = (v) => (clamp01(v) * 100).toFixed(3) + '%';
const norm = (s) => (s || '').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
const keyOf = (s) => norm(s).slice(0, 40);
const sameKey = (a, b) => !!a && !!b && (a === b || (a.length >= 16 && b.length >= 16 && a.slice(0, 16) === b.slice(0, 16)));
const stripMd = (s) => (s || '').replace(/```[^\n]*\n?/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\]\([^)]*\)/g, ']').replace(/<[^>]+>/g, '');
const mk = (tag, cls) => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };
const isWide = (ch) => /[\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/.test(ch);
const stopKeys = (el) => ['keydown', 'keyup', 'keypress', 'input'].forEach((t) => el.addEventListener(t, (e) => e.stopPropagation()));

function clipWidth(s, max) {
  s = (s || '').replace(/\s+/g, ' ').trim();
  let w = 0, out = '';
  for (const ch of s) {
    w += isWide(ch) ? 2 : 1;
    if (w > max) {
      if (!isWide(ch) && /\s\S+$/.test(out)) out = out.replace(/\s+\S*$/, '');
      return out.replace(/[\s,，、:：;；.。]+$/, '') + '…';
    }
    out += ch;
  }
  return out;
}
