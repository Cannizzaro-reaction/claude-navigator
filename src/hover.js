/* ---------- Hover actions on each message ---------- */
let hoverEl = null, hideTimer = null;
function placeBar() {
  if (!hoverEl || !hoverEl.isConnected || root.classList.contains('off')) { bar.classList.remove('show'); return; }
  const r = hoverEl.getBoundingClientRect();
  if (r.bottom < 90 || r.top > innerHeight - 40) { bar.classList.remove('show'); return; }
  const i = T.elIndex.get(hoverEl);
  const pinned = i != null && S.data.pins.some((p) => locate(p) === i);
  const pb = bar.querySelector('[data-act=pin]');
  pb.classList.toggle('on', pinned);
  pb.title = pinned ? 'Unpin' : 'Pin to top';
  const marked = i != null && S.data.marks.some((m) => !m.frac && locate(m) === i);
  const mb = bar.querySelector('[data-act=mark]');
  mb.classList.toggle('on', marked);
  mb.title = marked ? 'Remove mark' : 'Add mark';
  const w = bar.offsetWidth, h = bar.offsetHeight, limit = rail.getBoundingClientRect().left - 8;
  bar.style.left = Math.max(8, r.right + 10 + w < limit ? r.right + 10 : r.right - w - 4) + 'px';
  bar.style.top = Math.max(Math.min(Math.max(r.top, 70), r.bottom - h), 8) + 'px';
  bar.classList.add('show');
}
document.addEventListener('mouseover', (e) => {
  if (root.classList.contains('off')) return;
  if (bar.contains(e.target)) { clearTimeout(hideTimer); return; }
  let found = null;
  T.elIndex.forEach((i, el) => { if (!found && el.contains(e.target)) found = el; });
  clearTimeout(hideTimer);
  if (found) { hoverEl = found; placeBar(); }
  else if (hoverEl) hideTimer = setTimeout(() => { bar.classList.remove('show'); hoverEl = null; }, 450);
}, true);
bar.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || !hoverEl) return;
  const i = T.elIndex.get(hoverEl);
  if (i == null) return;
  if (b.dataset.act === 'pin') togglePin(i);
  else {
    const m = S.data.marks.find((x) => !x.frac && locate(x) === i);
    if (m) removeRec('mark', m.id);
    else addMark(i, 0, null);
  }
  setTimeout(placeBar, 50);
});
