/* ---------- Refresh loop ---------- */
function refresh() {
  if (!root.isConnected) document.body.appendChild(root);
  const id = convId();
  if (id !== T.convId) {
    T.convId = id; T.api = null; T.apiErr = null; T.backoff = 4000;
    S.panelSig = ''; S.railSig = ''; S.openPins.clear(); S.editing = null; S.panelOpen = false;
    thumb.style.opacity = 0;
    if (id) fetchTimeline().then(() => { S.railSig = ''; refresh(); });
  }
  root.classList.toggle('dark', isDark());
  const dom = id ? getMessages() : [];
  const has = !!id && (dom.length > 0 || !!(T.api && T.api.length));
  root.classList.toggle('off', !has);
  if (!has) { applyShift(0); hideNativeScrollbar(null); return; }
  if (dom.length) S.sc = findScroller(dom);
  hideNativeScrollbar(S.sc);
  rebuild(dom);
  const unmapped = dom.some((d) => !T.elIndex.has(d.el));
  const streaming = !!document.querySelector('[data-is-streaming="true"]');
  if (unmapped && !streaming && !T.fetching && Date.now() - T.lastFetch > T.backoff) fetchTimeline().then(() => { S.railSig = ''; refresh(); });
  S.data = loadConv();
  renderPanel();
  renderRail();
  layout();
  updateThumb();
  if (S.dirty) { S.dirty = false; saveConv(S.data); }
}

let raf = false;
const onScroll = () => {
  if (raf) return;
  raf = true;
  requestAnimationFrame(() => { raf = false; updateThumb(); placeBar(); hideTip(); });
};
document.addEventListener('scroll', onScroll, { capture: true, passive: true });
addEventListener('resize', () => { layout(); placeComposerUI(); onScroll(); });

let mutTimer = null;
new MutationObserver((muts) => {
  if (muts.every((m) => root.contains(m.target))) return;
  if (mutTimer) return;
  mutTimer = setTimeout(() => { mutTimer = null; refresh(); }, 700);
}).observe(document.body, { childList: true, subtree: true });

let lastHref = location.href;
setInterval(() => {
  placeComposerUI();
  layout();
  if (location.href !== lastHref) { lastHref = location.href; hoverEl = null; bar.classList.remove('show'); closeTray(); refresh(); }
}, 400);

/* ---------- Diagnostics (Tampermonkey menu) ---------- */
const describe = (el) => el ? el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 4).join('.') : '') : null;
if (typeof GM_registerMenuCommand === 'function') {
  GM_registerMenuCommand('Copy diagnostics', () => {
    const dom = getMessages();
    const info = {
      version: VERSION, path: location.pathname, conversation: convId(),
      domMessages: dom.length, domQuestions: dom.filter((d) => d.role === 'u').length,
      fullConversation: T.api ? T.api.length : null, fetchError: T.apiErr, matchedOnPage: T.elIndex.size,
      scroller: describe(S.sc), scrollHeight: S.sc ? S.sc.scrollHeight : null, messageBox: !!findEditor(),
      selectors: Object.fromEntries([...SEL.assistant, ...SEL.user, ...SEL.editor].map((s) => [s, document.querySelectorAll(s).length])),
    };
    if (typeof GM_setClipboard === 'function') GM_setClipboard(JSON.stringify(info, null, 2));
    toast('Diagnostics copied');
  });
}

setTimeout(refresh, 800);
