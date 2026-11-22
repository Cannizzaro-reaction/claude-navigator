/* ---------- Messages on the page ---------- */
function pick(sels) {
  for (const s of sels) {
    const found = [...document.querySelectorAll(s)].filter((el) => !root.contains(el));
    if (found.length) return found.filter((el) => !found.some((o) => o !== el && o.contains(el)));
  }
  return [];
}
function getMessages() {
  const all = [...pick(SEL.assistant).map((el) => ({ el, role: 'a' })), ...pick(SEL.user).map((el) => ({ el, role: 'u' }))];
  all.sort((x, y) => (x.el.compareDocumentPosition(y.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  return all;
}
function findScroller(dom) {
  let n = dom[0] && dom[0].el.parentElement;
  while (n && n !== document.body && n !== document.documentElement) {
    const oy = getComputedStyle(n).overflowY;
    if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && n.scrollHeight > n.clientHeight + 4) return n;
    n = n.parentElement;
  }
  return document.scrollingElement || document.documentElement;
}
const isDocSc = (sc) => sc === document.scrollingElement || sc === document.documentElement;
function viewport(sc) {
  if (isDocSc(sc)) return { top: 0, bottom: innerHeight, left: 0, right: innerWidth };
  const r = sc.getBoundingClientRect();
  return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
}
const absTop = (el, sc) => el.getBoundingClientRect().top - viewport(sc).top + sc.scrollTop;

/* ---------- Full conversation (so long, partly-rendered chats still work) ---------- */
async function getOrg() {
  const c = document.cookie.match(/(?:^|;\s*)lastActiveOrg=([^;]+)/);
  if (c) return decodeURIComponent(c[1]);
  if (T.org) return T.org;
  const r = await fetch('/api/organizations', { credentials: 'include' });
  const j = await r.json();
  T.org = (j[0] || {}).uuid;
  return T.org;
}
function msgText(m) {
  if (Array.isArray(m.content)) {
    const t = m.content.filter((b) => b && b.type === 'text').map((b) => b.text || '').join('\n');
    if (t) return t;
  }
  return m.text || '';
}
async function fetchTimeline() {
  const id = convId();
  if (!id || T.fetching) return;
  T.fetching = true;
  T.lastFetch = Date.now();
  try {
    const org = await getOrg();
    const r = await fetch(`/api/organizations/${org}/chat_conversations/${id}?tree=True&rendering_mode=messages&render_all_tools=true`, { credentials: 'include' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    if (convId() !== id) return;
    const all = j.chat_messages || [];
    const byId = new Map(all.map((m) => [m.uuid, m]));
    const chain = [], seen = new Set();
    let cur = byId.get(j.current_leaf_message_uuid);
    while (cur && !seen.has(cur.uuid)) { seen.add(cur.uuid); chain.push(cur); cur = byId.get(cur.parent_message_uuid); }
    chain.reverse();
    const list = chain.length ? chain : all.slice().sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    const prevLen = T.api ? T.api.length : -1;
    T.api = list.map((m) => ({ uuid: m.uuid, role: m.sender === 'human' ? 'u' : 'a', text: msgText(m) }));
    T.apiErr = null;
    T.backoff = T.api.length === prevLen ? Math.min(T.backoff * 2, 60000) : 4000;
  } catch (e) {
    T.apiErr = String((e && e.message) || e);
    T.backoff = Math.min(T.backoff * 2, 60000);
  } finally {
    T.fetching = false;
  }
}

function alignDom(entries, dom) {
  if (!dom.length) return;
  const dkeys = dom.map((d) => keyOf(d.el.innerText || ''));
  const votes = new Map();
  dom.forEach((d, di) => {
    const k = dkeys[di];
    if (k.length < 6) return;
    entries.forEach((e, ei) => {
      if (e.role === d.role && sameKey(e.key, k)) votes.set(ei - di, (votes.get(ei - di) || 0) + (d.role === 'u' ? 3 : 1));
    });
  });
  let off = null, best = 0;
  votes.forEach((v, o) => { if (v > best) { best = v; off = o; } });
  if (off === null) off = entries.length - dom.length;
  let last = -1;
  dom.forEach((d, di) => {
    const base = di + off, cands = [base, base + 1, base - 1, base + 2, base - 2];
    let hit = cands.find((c) => entries[c] && c > last && !entries[c].el && entries[c].role === d.role && sameKey(entries[c].key, dkeys[di]));
    if (hit === undefined) hit = cands.find((c) => entries[c] && c > last && !entries[c].el && entries[c].role === d.role);
    if (hit !== undefined) { entries[hit].el = d.el; last = hit; }
  });
}

function rebuild(dom) {
  let entries;
  if (T.api && T.api.length) {
    entries = T.api.map((x) => ({ uuid: x.uuid, role: x.role, text: x.text, key: keyOf(stripMd(x.text)), el: null }));
    alignDom(entries, dom);
  } else {
    entries = dom.map((d) => { const t = d.el.innerText || ''; return { uuid: null, role: d.role, text: t, key: keyOf(t), el: d.el }; });
  }
  let acc = 0;
  for (const e of entries) { e.w = 160 + Math.min(e.text.length, 20000); e.start = acc; acc += e.w; }
  for (const e of entries) { e.start /= acc || 1; e.w /= acc || 1; }
  T.entries = entries;
  T.elIndex = new Map();
  entries.forEach((e, i) => { if (e.el) T.elIndex.set(e.el, i); });
  T.totalChars = acc;
}
