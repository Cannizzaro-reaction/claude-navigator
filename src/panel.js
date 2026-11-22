/* ---------- Pinned panel ---------- */
function setPanel(open) {
  S.panelOpen = open;
  if (!open) S.editing = null;
  S.panelSig = '';
  renderPanel();
}
function startEdit(id) {
  S.panelOpen = true;
  S.editing = id;
  S.panelSig = '';
  renderPanel();
}
function titleNode(rec, onClick) {
  if (S.editing === rec.id) {
    const inp = mk('input', 'cpb-input');
    inp.value = rec.title;
    stopKeys(inp);
    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      S.editing = null;
      const v = inp.value.trim();
      if (save && v && v !== rec.title) updateRec('pin', rec.id, { title: v });
      else { S.panelSig = ''; renderPanel(); }
    };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); });
    inp.addEventListener('blur', () => finish(true));
    setTimeout(() => { inp.focus(); inp.select(); });
    return inp;
  }
  const t = mk('span', 'cpb-title');
  t.textContent = rec.title;
  t.title = 'Click to expand, double-click to rename';
  t.addEventListener('click', onClick);
  t.addEventListener('dblclick', () => startEdit(rec.id));
  return t;
}
function actBtn(name, title, fn) {
  const b = mk('button', 'cpb-ib'); b.type = 'button'; b.title = title; b.innerHTML = icon(name, 14);
  b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
  return b;
}
function jumpRec(rec, closePanel) {
  const i = locate(rec);
  if (i < 0) return toast('This message is no longer in the conversation');
  if (closePanel) setPanel(false);
  seek(i, rec.frac || 0);
}
function pinRow(p) {
  const open = S.openPins.has(p.id);
  const item = mk('div', 'cpb-item' + (open ? ' open' : '')), row = mk('div', 'cpb-row');
  const toggle = () => { open ? S.openPins.delete(p.id) : S.openPins.add(p.id); S.panelSig = ''; renderPanel(); };
  const tg = mk('button', 'cpb-glyph cpb-tog' + (open ? ' open' : ''));
  tg.type = 'button'; tg.title = open ? 'Collapse' : 'Expand here'; tg.innerHTML = icon('chevron', 15);
  tg.addEventListener('click', toggle);
  const acts = mk('div', 'cpb-acts');
  acts.append(
    actBtn('edit', 'Rename', () => startEdit(p.id)),
    actBtn('jump', 'Go to this message', () => jumpRec(p, UI.dock === 'top')),
    actBtn('x', 'Unpin', () => removeRec('pin', p.id)),
  );
  row.append(tg, titleNode(p, toggle), acts);
  item.append(row);
  if (open) {
    const c = mk('div', 'cpb-content');
    const i = locate(p), e = T.entries[i];
    if (e && e.el && e.el.isConnected) {
      const h = snap(e.el);
      if (h !== p.html) { p.html = h; updateRec('pin', p.id, { html: h }, true); }
      c.innerHTML = h;
    } else if (p.html) c.innerHTML = p.html;
    else { c.classList.add('plain'); c.textContent = (e && e.text) || p.text || ''; }
    item.append(c);
  }
  return item;
}
function applySize() {
  if (panel.classList.contains('left')) { grip.hidden = false; box.style.height = ''; box.style.maxHeight = ''; return; }
  const anyOpen = S.data.pins.some((p) => S.openPins.has(p.id));
  grip.hidden = !anyOpen;
  if (anyOpen && UI.topH) { box.style.height = UI.topH + 'px'; box.style.maxHeight = 'none'; }
  else { box.style.height = ''; box.style.maxHeight = 'min(78vh, 900px)'; }
}
function renderPanel() {
  const pins = S.data.pins;
  if (!pins.length) S.panelOpen = false;
  const sig = [convId(), S.panelOpen, UI.dock, S.editing, [...S.openPins].join(), pins.map((p) => p.id + p.title).join()].join('|');
  if (sig === S.panelSig) return;
  S.panelSig = sig;
  panel.hidden = !pins.length;
  const left = S.panelOpen && UI.dock === 'left';
  panel.classList.toggle('open', S.panelOpen);
  panel.classList.toggle('left', left);
  head.hidden = S.panelOpen;
  box.hidden = !S.panelOpen;
  head.innerHTML = `<span class="g">${icon('pin', 13)}</span>Pinned <b>${pins.length}</b><span class="cpb-chev">${icon('chevron', 14)}</span>`;
  box.querySelectorAll('[data-dock]').forEach((b) => b.classList.toggle('on', b.dataset.dock === UI.dock));
  applySize();
  layout();
  const keep = list.scrollTop;
  list.innerHTML = '';
  if (S.panelOpen) { list.append(...pins.map(pinRow)); list.scrollTop = keep; }
}
head.addEventListener('click', () => setPanel(true));
$('cpb-close').addEventListener('click', () => setPanel(false));
box.querySelectorAll('[data-dock]').forEach((b) => b.addEventListener('click', () => {
  if (UI.dock === b.dataset.dock) return;
  UI.dock = b.dataset.dock;
  saveUI();
  S.panelSig = '';
  renderPanel();
}));

grip.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const left = panel.classList.contains('left');
  const start = left ? e.clientX : e.clientY;
  const r = box.getBoundingClientRect(), size0 = left ? r.width : r.height;
  grip.setPointerCapture(e.pointerId);
  grip.classList.add('drag');
  root.classList.add('resizing');
  const move = (ev) => {
    const d = (left ? ev.clientX : ev.clientY) - start;
    if (left) { UI.leftW = Math.round(Math.max(260, Math.min(Math.min(900, innerWidth * 0.75), size0 + d))); layout(); }
    else { UI.topH = Math.round(Math.max(140, Math.min(innerHeight - 120, size0 + d))); box.style.height = UI.topH + 'px'; box.style.maxHeight = 'none'; }
  };
  const up = () => {
    grip.removeEventListener('pointermove', move);
    grip.classList.remove('drag');
    root.classList.remove('resizing');
    saveUI();
  };
  grip.addEventListener('pointermove', move);
  grip.addEventListener('pointerup', up, { once: true });
  grip.addEventListener('pointercancel', up, { once: true });
});
grip.addEventListener('dblclick', () => {
  if (panel.classList.contains('left')) UI.leftW = 380; else UI.topH = null;
  saveUI();
  applySize();
  layout();
});

/* ---------- Rail menu: rename / remove ---------- */
function placeMenu(node) {
  menu.classList.add('show');
  const r = node.getBoundingClientRect(), rr = rail.getBoundingClientRect(), w = menu.offsetWidth, h = menu.offsetHeight;
  menu.style.left = Math.max(8, rr.left - w - 10) + 'px';
  menu.style.top = Math.max(8, Math.min(innerHeight - h - 8, r.top + r.height / 2 - 18)) + 'px';
}
const closeMenu = () => menu.classList.remove('show');
function menuItem(name, label, fn, danger) {
  const b = mk('button', 'mi' + (danger ? ' danger' : ''));
  b.type = 'button';
  b.innerHTML = icon(name, 14) + '<span></span>';
  b.querySelector('span').textContent = label;
  b.addEventListener('click', fn);
  return b;
}
function openMenu(node, kind, id) {
  hideTip();
  menu.innerHTML = '';
  menu.append(
    menuItem('edit', 'Rename', () => openRename(node, kind, id)),
    menuItem('x', kind === 'pin' ? 'Unpin' : 'Remove mark', () => { closeMenu(); removeRec(kind, id); }, true),
  );
  placeMenu(node);
}
function openRename(node, kind, id) {
  const rec = S.data[kind === 'pin' ? 'pins' : 'marks'].find((x) => x.id === id);
  if (!rec) return;
  menu.innerHTML = '';
  const inp = mk('input', 'cpb-input');
  inp.value = rec.title;
  stopKeys(inp);
  let done = false;
  const finish = (save) => {
    if (done) return;
    done = true;
    closeMenu();
    const v = inp.value.trim();
    if (save && v && v !== rec.title) updateRec(kind, id, { title: v });
  };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); });
  inp.addEventListener('blur', () => finish(true));
  menu.append(inp);
  placeMenu(node);
  setTimeout(() => { inp.focus(); inp.select(); });
}
function renameFromRail(kind, id) {
  const node = S.railNodes && S.railNodes.get(id);
  if (node && node.isConnected) openRename(node, kind, id);
}
