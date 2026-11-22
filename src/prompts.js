/* ---------- Saved prompts ---------- */
const savePrompts = () => setJSON('cpb:prompts', P.list);
function findEditor() {
  for (const s of SEL.editor) {
    const el = [...document.querySelectorAll(s)].find((x) => !root.contains(x) && x.offsetParent !== null);
    if (el) return el;
  }
  return null;
}
function composerBox(ed) {
  let n = ed;
  const ew = ed.getBoundingClientRect().width;
  for (let k = 0; k < 10 && n && n !== document.body; k++, n = n.parentElement) {
    const cs = getComputedStyle(n);
    const framed = parseFloat(cs.borderTopWidth) > 0 || cs.boxShadow !== 'none';
    if ((parseFloat(cs.borderTopLeftRadius) || 0) >= 10 && framed && n.getBoundingClientRect().width >= ew) return n;
  }
  return ed.closest('fieldset') || ed.parentElement;
}
function placeComposerUI() {
  const ed = findEditor();
  const b = ed && composerBox(ed).getBoundingClientRect();
  if (!b || b.width < 200 || b.top < 40) { ptab.style.display = 'none'; P.box = null; if (P.open) closeTray(); return; }
  P.box = b;
  ptab.style.display = 'flex';
  ptab.style.left = b.left + 18 + 'px';
  ptab.style.top = b.top - ptab.offsetHeight + 1 + 'px';
  tray.style.left = b.left + 'px';
  tray.style.width = b.width + 'px';
  tray.style.bottom = innerHeight - b.top + 30 + 'px';
  ptab.querySelector('.n').textContent = P.list.length || '';
}
function openTray() { P.open = true; renderTray(); placeComposerUI(); tray.classList.add('open'); ptab.classList.add('open'); }
function closeTray() { P.open = false; P.form = null; tray.classList.remove('open'); ptab.classList.remove('open'); }
ptab.addEventListener('mousedown', (e) => e.preventDefault());
ptab.addEventListener('click', () => (P.open ? closeTray() : openTray()));

function insertPrompt(text) {
  const ed = findEditor();
  if (!ed) return toast('Message box not found');
  const sel = getSelection();
  const inside = sel.rangeCount && ed.contains(sel.getRangeAt(0).startContainer);
  ed.focus({ preventScroll: true });
  if (!inside) {
    let r = P.range && ed.contains(P.range.startContainer) ? P.range : null;
    if (!r) { r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); }
    sel.removeAllRanges();
    sel.addRange(r);
  }
  let ok = false;
  if (!text.includes('\n')) { try { ok = document.execCommand('insertText', false, text); } catch { ok = false; } }
  if (!ok) {
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    ed.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }
  closeTray();
}
function addPrompt(text) {
  text = (text || '').trim();
  if (!text) return;
  if (P.list.some((p) => p.text === text)) return toast('Already in your prompts');
  P.list.push({ id: uid(), text });
  savePrompts();
  if (P.open) renderTray();
  placeComposerUI();
  toast('Saved to prompts', { action: 'View', onAction: openTray });
}
function deletePrompt(id) {
  const at = P.list.findIndex((p) => p.id === id);
  if (at < 0) return;
  const [p] = P.list.splice(at, 1);
  savePrompts();
  renderTray();
  placeComposerUI();
  toast('Prompt removed', { action: 'Undo', onAction: () => { P.list.splice(at, 0, p); savePrompts(); renderTray(); placeComposerUI(); } });
}
function renderTray() {
  tray.innerHTML = '';
  const h = mk('div', 'cpb-tray-h');
  h.innerHTML = `<span class="t">Saved prompts</span><span class="hint">${P.list.length ? 'Click one to insert it at the cursor' : ''}</span>`;
  const nb = mk('button', 'cpb-new');
  nb.type = 'button';
  nb.innerHTML = icon('plus', 13) + '<span>New</span>';
  nb.addEventListener('click', () => { P.form = { id: null, text: '' }; renderTray(); });
  h.append(nb);
  tray.append(h);
  if (!P.list.length && !P.form) {
    const e = mk('div', 'cpb-empty');
    e.textContent = 'No saved prompts yet. Add one here, or select text you typed in the message box and save it.';
    tray.append(e);
  }
  const chips = mk('div', 'cpb-chips');
  for (const p of P.list) {
    const c = mk('button', 'cpb-chip');
    c.type = 'button';
    c.title = p.text;
    c.innerHTML = `<span class="txt"></span><span class="ops"><span data-op="edit" title="Edit">${icon('edit', 11)}</span><span data-op="del" title="Remove">${icon('x', 11)}</span></span>`;
    c.querySelector('.txt').textContent = p.text;
    c.addEventListener('mousedown', (e) => e.preventDefault());
    c.addEventListener('click', (e) => {
      const op = e.target.closest('[data-op]');
      if (op) { e.stopPropagation(); if (op.dataset.op === 'edit') { P.form = { id: p.id, text: p.text }; renderTray(); } else deletePrompt(p.id); return; }
      insertPrompt(p.text);
    });
    chips.append(c);
  }
  tray.append(chips);
  if (P.form) {
    const f = mk('div', 'cpb-form'), ta = mk('textarea'), r = mk('div', 'r');
    ta.placeholder = 'Write a prompt you use often';
    ta.value = P.form.text;
    stopKeys(ta);
    const save = () => {
      const v = ta.value.trim();
      if (!v) return;
      if (P.form.id) { const p = P.list.find((x) => x.id === P.form.id); if (p) p.text = v; }
      else P.list.push({ id: uid(), text: v });
      savePrompts();
      P.form = null;
      renderTray();
      placeComposerUI();
    };
    const cancel = () => { P.form = null; renderTray(); };
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save(); }
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    });
    const hint = mk('span', 'hint'); hint.textContent = 'Ctrl + Enter to save';
    const bc = mk('button', 'cpb-btn'); bc.type = 'button'; bc.textContent = 'Cancel'; bc.addEventListener('click', cancel);
    const bs = mk('button', 'cpb-btn primary'); bs.type = 'button'; bs.textContent = P.form.id ? 'Save changes' : 'Save prompt'; bs.addEventListener('click', save);
    r.append(hint, bc, bs);
    f.append(ta, r);
    tray.append(f);
    setTimeout(() => ta.focus());
  }
}

document.addEventListener('selectionchange', () => {
  const ed = findEditor(), sel = getSelection();
  if (!ed || !sel.rangeCount) { selChip.style.display = 'none'; return; }
  const r = sel.getRangeAt(0);
  if (!ed.contains(r.commonAncestorContainer)) { selChip.style.display = 'none'; return; }
  P.range = r.cloneRange();
  const text = sel.toString().trim();
  if (!text) { selChip.style.display = 'none'; return; }
  P.selText = text;
  const rect = r.getBoundingClientRect();
  selChip.style.display = 'flex';
  const w = selChip.offsetWidth, hh = selChip.offsetHeight;
  selChip.style.left = Math.max(8, Math.min(innerWidth - w - 8, rect.left + rect.width / 2 - w / 2)) + 'px';
  selChip.style.top = (rect.top - hh - 8 > 8 ? rect.top - hh - 8 : rect.bottom + 8) + 'px';
});
selChip.addEventListener('mousedown', (e) => e.preventDefault());
selChip.addEventListener('click', () => { selChip.style.display = 'none'; addPrompt(P.selText); });

document.addEventListener('mousedown', (e) => {
  if (P.open && !tray.contains(e.target) && !ptab.contains(e.target) && !toastEl.contains(e.target)) closeTray();
  if (menu.classList.contains('show') && !menu.contains(e.target)) closeMenu();
}, true);
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (menu.classList.contains('show')) { closeMenu(); return; }
  if (P.open) { closeTray(); return; }
  if (S.panelOpen && !S.editing && UI.dock === 'top') setPanel(false);
});
