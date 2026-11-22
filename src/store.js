/* ---------- Saved pins & marks (per conversation) ---------- */
function loadConv() {
  const id = convId();
  const d = (id && getJSON('cpb:' + id, null)) || {};
  d.pins = d.pins || [];
  d.marks = d.marks || [];
  for (const r of [...d.pins, ...d.marks]) {
    if (r.frac == null) r.frac = 0;
  }
  return d;
}
const saveConv = (d) => { const id = convId(); if (id) setJSON('cpb:' + id, d); };

function locate(rec) {
  const E = T.entries;
  if (rec.uuid) { const k = E.findIndex((e) => e.uuid === rec.uuid); if (k >= 0) return k; }
  if (rec.key) {
    const k = E.findIndex((e) => (!rec.role || e.role === rec.role) && sameKey(e.key, rec.key));
    if (k >= 0) { if (!rec.uuid && E[k].uuid) { rec.uuid = E[k].uuid; rec.role = E[k].role; S.dirty = true; } return k; }
  }
  if (!rec.uuid && rec.idx != null && E[rec.idx] && (!rec.role || E[rec.idx].role === rec.role)) return rec.idx;
  return -1;
}
const recFor = (i) => { const e = T.entries[i]; return { uuid: e.uuid, key: e.key, role: e.role, idx: i }; };

function updateRec(kind, id, patch, silent) {
  const d = loadConv(), k = kind === 'pin' ? 'pins' : 'marks';
  const r = d[k].find((x) => x.id === id);
  if (!r) return;
  Object.assign(r, patch);
  saveConv(d);
  S.data = d;
  if (!silent) { S.panelSig = ''; S.railSig = ''; renderPanel(); renderRail(); }
}
function removeRec(kind, id) {
  const d = loadConv(), k = kind === 'pin' ? 'pins' : 'marks';
  const at = d[k].findIndex((x) => x.id === id);
  if (at < 0) return;
  const [rec] = d[k].splice(at, 1);
  saveConv(d);
  S.openPins.delete(id);
  refresh();
  toast(kind === 'pin' ? 'Unpinned' : 'Mark removed', {
    action: 'Undo',
    onAction: () => { const d2 = loadConv(); d2[k].splice(at, 0, rec); saveConv(d2); refresh(); },
  });
}
function snap(el) {
  const c = el.cloneNode(true);
  c.querySelectorAll('[data-is-streaming],[id]').forEach((n) => { n.removeAttribute('data-is-streaming'); n.removeAttribute('id'); });
  c.querySelectorAll('button').forEach((b) => b.remove());
  return c.innerHTML;
}
function togglePin(i) {
  const d = loadConv();
  const existing = d.pins.find((p) => locate(p) === i);
  if (existing) return removeRec('pin', existing.id);
  const e = T.entries[i], id = uid();
  d.pins.push({ id, ...recFor(i), title: titleFor(i), html: e.el ? snap(e.el) : '', text: e.text.slice(0, 20000), at: Date.now() });
  saveConv(d);
  refresh();
  toast('Pinned', { action: 'Rename', onAction: () => startEdit(id) });
}
function addMark(i, frac, heading) {
  const d = loadConv(), id = uid();
  frac = frac < 0.02 ? 0 : Math.min(frac, 0.995);
  d.marks.push({ id, ...recFor(i), frac, title: titleFor(i, heading), at: Date.now() });
  d.marks.sort((a, b) => { const ia = locate(a), ib = locate(b); return ia - ib || a.frac - b.frac; });
  saveConv(d);
  refresh();
  toast('Marked', { action: 'Rename', onAction: () => renameFromRail('mark', id) });
}
function headingAbove(el, line) {
  let h = null;
  el.querySelectorAll('h1,h2,h3,h4').forEach((x) => { if (x.getBoundingClientRect().top <= line + 4) h = x; });
  return h ? h.innerText.trim() : null;
}
