/* ---------- Titles: generated automatically, in the language of the conversation ---------- */
const FILLER_HEAD = /^(?:请问|请你|请|麻烦你?|帮我|帮忙|你好|您好|嗨|那么?|所以|然后|另外|还有|我想问一下|我想问|我想知道|想问一下|想问|我在想|我想|hi|hello|hey|okay|ok|so|also|and|please|can you|could you|would you|i want to|i'd like to|i wonder if|i wonder|help me to|help me)(?=[\s,，、:：]|[^\x00-\x7f]|$)[\s,，、:：]*/i;
const FILLER_TAIL = /[\s,，。.!！?？~～…]*(?:吗|呢|吧|啊|呀|嘛|么|哈)?[\s,，。.!！?？~～…]*$/;

function condense(text) {
  let s = (text || '').replace(/```[\s\S]*?```/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = s.split(/(?<=[。！？!?；;])|(?<=\.)\s/).map((x) => x.trim()).filter(Boolean);
  s = parts.find((p) => norm(p).length >= 4) || parts[0] || s;
  s = s.replace(/（[^）]*）|\([^)]*\)/g, '').trim();
  const QW = /能不能|能否|可不可以|可以|怎么|怎样|如何|为什么|为何|是否|是不是|有没有|哪|什么|多少|\b(?:how|why|what|which|when|where|can|could|should|is|are|does|do)\b/i;
  const clauses = s.split(/[,，、]/).map((x) => x.trim()).filter(Boolean);
  if (clauses.length > 1 && !QW.test(clauses[0])) {
    const k = clauses.findIndex((c) => QW.test(c));
    if (k > 0) s = clauses.slice(k).join('，');
  }
  const cl = s.split(/[,，]/).map((x) => x.trim()).filter(Boolean);
  if (cl.length > 1 && norm(cl[0]).length >= 6 && QW.test(cl[0])) s = cl[0];
  for (let k = 0; k < 4; k++) { const t = s.replace(FILLER_HEAD, ''); if (t === s) break; s = t; }
  s = s.replace(FILLER_TAIL, '');
  return clipWidth(s, 38) || clipWidth(text, 38) || 'Untitled';
}

// A question is "vague" when it carries no topic of its own: "继续", "为什么", "那第二点呢", "why?", "go on"…
const VAGUE = /^(?:继续|接着说?|然后呢?|还有呢?|为什么|为啥|怎么说|什么意思|详细(?:一点|点|说说)?|再详细(?:一点|点)?|展开(?:说说|讲讲)?|举个例子|再来|好的?|可以|行|嗯+|是的|对|谢谢|多谢|ok|okay|yes|no|thanks?|thank you|continue|go on|more|why|how|explain|elaborate|next|and)$/i;
const DEICTIC = /^(?:那|这|那么|所以|and|so|what about|how about)|第[一二三四五六七八九十\d]+[点步个条部分项]|上面|刚才|前面|这个|那个|这里|那里|\b(?:it|this|that|the above|the last one)\b/i;
const widthOf = (str) => [...norm(str)].reduce((a, ch) => a + (isWide(ch) ? 2 : 1), 0);
function isVague(raw, title) {
  const bare = (raw || '').trim().replace(/[\s,，。.!！?？~～…]+$/, '');
  if (!norm(bare) || VAGUE.test(bare)) return true;
  const w = widthOf(title);
  if (w < 8) return true;
  return w < 24 && DEICTIC.test(bare);
}

// Title taken from the answer itself: a real heading, else the first sentence with substance, else a bold phrase.
const GENERIC_H = /^(?:概述|总结|小结|简介|介绍|说明|背景|结论|结果|注意事项|补充|示例|例子|代码|步骤|overview|summary|introduction|intro|background|conclusion|result|results|notes?|example|examples|code|steps|tl;?dr)$/i;
const ACK = /^(?:好的|好|当然可以|当然|没问题|可以的?|明白了?|了解|收到|对的?|是的|嗯|sure|of course|absolutely|certainly|great question|good question|got it|okay|ok|yes|here(?:'s| is| are)\b[^.。:：]*)[\s,，!！.。]*/i;
const PREAMBLE = /^(?:我来|让我|下面|以下|接下来|我们来|我们先|首先我|let me|i'll|i will|i can|below|here's how|here is how)/i;
function answerTitle(e) {
  const el = e.el && e.el.isConnected ? e.el : null;
  const heads = el
    ? [...el.querySelectorAll('h1,h2,h3,h4')].map((h) => h.innerText.trim())
    : [...e.text.matchAll(/^#{1,4}\s+(.+)$/gm)].map((m) => m[1].replace(/[*_`]/g, '').trim());
  const h = heads.find((x) => norm(x).length >= 2 && !GENERIC_H.test(x.replace(/[\s:：.。]+$/, '')));
  if (h) return clipWidth(h.replace(/^[\d一二三四五六七八九十]+[.、)）]\s*/, ''), 40);
  const lines = stripMd(e.text).replace(/```[\s\S]*?```/g, '\n').split('\n')
    .map((l) => l.replace(/^\s*(?:[-*+]|\d+[.)、])\s+/, '').replace(/[#*_>`|]/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  const sents = lines.flatMap((l) => l.split(/(?<=[。！？!?；;])|(?<=\.)\s|(?<=[:：])/)).map((x) => x.trim()).filter(Boolean);
  for (let t of sents.slice(0, 8)) {
    if (/[:：]$/.test(t)) continue;
    t = t.replace(ACK, '').trim();
    if (widthOf(t) < 10) continue;
    if (widthOf(t) < 30 && PREAMBLE.test(t)) continue;
    return clipWidth(t.replace(FILLER_TAIL, ''), 40);
  }
  const bolds = el
    ? [...el.querySelectorAll('strong,b')].map((b) => b.innerText.trim())
    : [...e.text.matchAll(/\*\*([^*\n]{2,80})\*\*/g)].map((m) => m[1].trim());
  const b = bolds.find((x) => widthOf(x) >= 6);
  return b ? clipWidth(b, 40) : null;
}

function titleFor(i, heading) {
  const E = T.entries, e = E[i];
  if (!e) return 'Untitled';
  if (heading) return clipWidth(heading, 40);
  let q = null, a = null;
  if (e.role === 'u') { q = e; if (E[i + 1] && E[i + 1].role === 'a') a = E[i + 1]; }
  else { a = e; for (let j = i - 1; j >= 0; j--) if (E[j].role === 'u') { q = E[j]; break; } }
  const qt = q ? condense(q.text) : null;
  if (q && !isVague(q.text, qt)) return qt;
  const at = a ? answerTitle(a) : null;
  return at || qt || clipWidth(condense(e.text), 40);
}
