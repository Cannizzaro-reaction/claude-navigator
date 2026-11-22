// ==UserScript==
// @name             Claude Navigator
// @namespace        https://claude.ai/
// @version          2.5.0
// @description      Pin answers, mark positions on a side rail, and keep reusable prompts beside the message box on claude.ai
// @author           Cannizzaro-reaction
// @license          MIT
// @homepageURL      https://github.com/Cannizzaro-reaction/claude-navigator
// @supportURL       https://github.com/Cannizzaro-reaction/claude-navigator/issues
// @updateURL        https://raw.githubusercontent.com/Cannizzaro-reaction/claude-navigator/main/dist/claude-navigator.user.js
// @downloadURL      https://raw.githubusercontent.com/Cannizzaro-reaction/claude-navigator/main/dist/claude-navigator.user.js
// @match            https://claude.ai/*
// @icon             https://claude.ai/favicon.ico
// @grant            GM_getValue
// @grant            GM_setValue
// @grant            GM_registerMenuCommand
// @grant            GM_setClipboard
// @run-at           document-idle
// ==/UserScript==

(function () {
  'use strict';

  const VERSION = "2.5.0";

  const CSS = `
  #cpb-root{--page:#faf9f5;--surface:#ffffff;--surface-2:#f3f2ec;--text:#1f1e1d;--text-2:#5e5d59;--text-3:#8f8d86;
    --line:rgba(31,30,29,.11);--line-2:rgba(31,30,29,.22);--accent:#c96442;--accent-soft:rgba(201,100,66,.12);
    --track:rgba(31,30,29,.09);--thumb:rgba(31,30,29,.15);--thumb-2:rgba(31,30,29,.28);--toast-act:#f0b39b;
    --shadow:0 1px 2px rgba(31,30,29,.05),0 8px 28px rgba(31,30,29,.09);--ease:cubic-bezier(.2,.7,.2,1);
    font-family:inherit;color:var(--text);-webkit-font-smoothing:antialiased}
  #cpb-root.dark{--page:#262624;--surface:#30302e;--surface-2:#393937;--text:#f5f4ef;--text-2:#c3c2b7;--text-3:#8f8d86;
    --line:rgba(245,244,239,.1);--line-2:rgba(245,244,239,.2);--accent:#d97757;--accent-soft:rgba(217,119,87,.16);
    --track:rgba(245,244,239,.09);--thumb:rgba(245,244,239,.16);--thumb-2:rgba(245,244,239,.3);--toast-act:#b5543a;
    --shadow:0 1px 2px rgba(0,0,0,.25),0 10px 32px rgba(0,0,0,.42)}
  #cpb-root *{box-sizing:border-box}
  :where(#cpb-root) button{font:inherit;color:inherit;background:none;border:0;margin:0;padding:0;cursor:pointer;line-height:1}
  :where(#cpb-root) button:focus-visible,:where(#cpb-root) [tabindex]:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
  #cpb-root.off .cpb-conv{display:none!important}

  .cpb-ib{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;color:var(--text-3);transition:background .15s,color .15s}
  .cpb-ib:hover{background:var(--surface-2);color:var(--text)}

  /* Pinned panel */
  #cpb-panel{position:fixed;top:58px;left:50%;transform:translateX(-50%);z-index:2147483000;width:min(1080px,calc(100vw - 120px));
    display:flex;flex-direction:column;align-items:center;pointer-events:none}
  #cpb-panel[hidden],#cpb-head[hidden],#cpb-box[hidden]{display:none!important}
  #cpb-head{pointer-events:auto;display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 10px 0 12px;border-radius:999px;
    background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow);font-size:12.5px;color:var(--text-2);transition:border-color .15s,color .15s}
  #cpb-head:hover{border-color:var(--line-2);color:var(--text)}
  #cpb-head .g{display:inline-flex;color:var(--accent)}
  #cpb-head b{font-weight:500;color:var(--text);font-variant-numeric:tabular-nums}
  #cpb-head .cpb-chev{display:inline-flex;color:var(--text-3)}
  #cpb-box{pointer-events:auto;position:relative;width:100%;display:flex;flex-direction:column;background:var(--surface);
    border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);overflow:hidden;animation:cpbIn .22s var(--ease)}
  @keyframes cpbIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
  #cpb-panel.left{align-items:stretch}
  #cpb-panel.left #cpb-box{flex:1;min-height:0;animation-name:cpbInL}
  @keyframes cpbInL{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}
  .cpb-box-h{display:flex;align-items:center;gap:6px;padding:6px 6px 6px 14px;border-bottom:1px solid var(--line);flex:none}
  .cpb-box-h .t{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;color:var(--text-2);flex:1}
  .cpb-box-h .t .g{display:inline-flex;color:var(--accent)}
  .cpb-seg{display:inline-flex;padding:2px;gap:2px;border-radius:8px;background:var(--surface-2)}
  .cpb-seg button{width:26px;height:22px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;color:var(--text-3);transition:background .15s,color .15s}
  .cpb-seg button:hover{color:var(--text)}
  .cpb-seg button.on{background:var(--surface);color:var(--text);box-shadow:0 1px 2px rgba(0,0,0,.08)}
  #cpb-list{flex:1;min-height:0;overflow:auto;padding:4px 6px 10px}
  .cpb-row{display:flex;align-items:center;gap:2px;min-height:38px;padding:0 4px 0 2px;border-radius:9px;transition:background .12s}
  .cpb-row:hover{background:var(--surface-2)}
  .cpb-item.open>.cpb-row{position:sticky;top:-4px;z-index:1;background:var(--surface);border-radius:0;
    box-shadow:0 1px 0 var(--line),0 -4px 0 var(--surface);margin-bottom:6px}
  .cpb-item.open>.cpb-row:hover{background:var(--surface-2);box-shadow:0 1px 0 var(--line),0 -4px 0 var(--surface-2)}
  .cpb-item.open>.cpb-row .cpb-title{font-weight:500}
  .cpb-item.open>.cpb-row .cpb-acts{opacity:1}
  .cpb-glyph{width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;color:var(--text-3);flex:none;border-radius:8px}
  .cpb-tog svg{transition:transform .2s var(--ease)}
  .cpb-tog.open svg{transform:rotate(180deg)}
  .cpb-tog:hover{color:var(--text)}
  .cpb-title{flex:1;min-width:0;font-size:14px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;padding:8px 4px}
  .cpb-input{flex:1;min-width:0;font:inherit;font-size:14px;color:var(--text);background:var(--surface);border:1px solid var(--accent);
    border-radius:7px;padding:5px 8px;margin:4px 2px;outline:none;box-shadow:0 0 0 3px var(--accent-soft)}
  .cpb-acts{display:flex;gap:1px;opacity:0;transition:opacity .15s}
  .cpb-row:hover .cpb-acts,.cpb-row:focus-within .cpb-acts{opacity:1}
  @media (hover:none){.cpb-acts{opacity:1}}
  .cpb-content{margin:2px 10px 12px 30px;padding:4px 14px 6px 16px;border-left:2px solid var(--accent-soft);
    font-size:14.5px;line-height:1.65;color:var(--text);overflow-wrap:anywhere}
  .cpb-content.plain{white-space:pre-wrap}
  .cpb-content pre{overflow:auto;max-width:100%}
  .cpb-content>:first-child{margin-top:0}
  .cpb-grip{position:absolute;z-index:2;touch-action:none}
  .cpb-grip[hidden]{display:none}
  #cpb-panel:not(.left) .cpb-grip{left:0;right:0;bottom:0;height:14px;cursor:ns-resize}
  #cpb-panel.left .cpb-grip{top:0;bottom:0;right:0;width:10px;cursor:ew-resize}
  #cpb-panel.left #cpb-list{margin-right:10px;padding-right:4px}
  #cpb-panel:not(.left) #cpb-list{margin-bottom:14px}
  #cpb-list{scrollbar-width:thin;scrollbar-color:var(--line-2) transparent}
  #cpb-list::-webkit-scrollbar{width:8px}
  #cpb-list::-webkit-scrollbar-thumb{background:var(--line-2);border-radius:4px}
  #cpb-list::-webkit-scrollbar-thumb:hover{background:var(--text-3)}
  #cpb-list::-webkit-scrollbar-track{background:transparent}
  .cpb-grip::after{content:'';position:absolute;border-radius:2px;background:var(--line-2);opacity:0;transition:opacity .15s}
  #cpb-panel:not(.left) .cpb-grip::after{left:50%;bottom:5px;width:96px;height:4px;margin-left:-48px}
  #cpb-panel.left .cpb-grip::after{top:50%;right:3px;width:4px;height:96px;margin-top:-48px}
  #cpb-box:hover .cpb-grip::after,.cpb-grip.drag::after{opacity:1}
  .cpb-grip.drag::after{background:var(--accent)}
  #cpb-root.resizing,#cpb-root.resizing *{user-select:none}

  /* Rail context menu */
  #cpb-menu{position:fixed;left:0;top:0;z-index:2147483650;min-width:176px;padding:4px;background:var(--surface);border:1px solid var(--line);
    border-radius:10px;box-shadow:var(--shadow);display:none}
  #cpb-menu.show{display:block;animation:cpbIn .14s var(--ease)}
  #cpb-menu .mi{display:flex;align-items:center;gap:9px;width:100%;padding:8px 10px;border-radius:7px;font-size:13px;color:var(--text);text-align:left;transition:background .12s,color .12s}
  #cpb-menu .mi:hover{background:var(--surface-2)}
  #cpb-menu .mi svg{color:var(--text-3)}
  #cpb-menu .mi.danger:hover,#cpb-menu .mi.danger:hover svg{color:var(--accent)}
  #cpb-menu .cpb-input{display:block;width:260px;margin:2px}

  /* Side rail */
  #cpb-rail{position:fixed;right:6px;top:96px;bottom:168px;width:20px;z-index:2147482000;cursor:pointer}
  #cpb-rail .track{position:absolute;left:50%;top:0;bottom:0;width:2px;margin-left:-1px;border-radius:2px;background:var(--track);transition:width .2s var(--ease),margin .2s var(--ease)}
  #cpb-rail:hover .track{width:4px;margin-left:-2px}
  #cpb-dots{position:absolute;inset:0}
  #cpb-rail.drag{cursor:grabbing}
  #cpb-rail:hover #cpb-thumb,#cpb-rail.drag #cpb-thumb{background:var(--thumb-2)}
  #cpb-rail.drag .track{width:4px;margin-left:-2px}
  #cpb-thumb{position:absolute;left:50%;width:8px;margin-left:-4px;border-radius:4px;background:var(--thumb);pointer-events:none;opacity:0;
    transition:top .12s linear,height .12s linear,opacity .2s}
  .cpb-q{position:absolute;left:50%;width:8px;height:1.5px;margin:-.75px 0 0 -4px;border-radius:1px;background:var(--text-3);opacity:.5;
    transition:opacity .15s,width .15s var(--ease),margin .15s var(--ease),background .15s}
  .cpb-q::after{content:'';position:absolute;left:-6px;right:-6px;top:-4px;bottom:-4px}
  #cpb-rail:hover .cpb-q{opacity:.85}
  .cpb-q:hover{opacity:1!important;width:14px;margin-left:-7px;background:var(--text)}
  .cpb-pin{position:absolute;left:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:2px;background:var(--accent);
    transform:rotate(45deg);box-shadow:0 0 0 2px var(--page);transition:transform .15s var(--ease)}
  .cpb-pin:hover{transform:rotate(45deg) scale(1.35)}
  .cpb-mark{position:absolute;left:50%;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:var(--page);
    border:2px solid var(--accent);transition:transform .15s var(--ease)}
  .cpb-mark:hover{transform:scale(1.35)}
  #cpb-add{position:fixed;right:5px;bottom:132px;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    background:var(--surface);border:1px solid var(--line);color:var(--text-3);box-shadow:var(--shadow);z-index:2147482000;
    transition:color .15s,border-color .15s,transform .15s var(--ease)}
  #cpb-add:hover{color:var(--accent);border-color:var(--accent);transform:scale(1.08)}
  #cpb-clear{position:fixed;right:5px;bottom:100px;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    color:var(--text-3);opacity:.55;z-index:2147482000;transition:opacity .15s,color .15s,background .15s}
  #cpb-clear:hover{opacity:1;color:var(--accent);background:var(--accent-soft)}
  #cpb-clear[hidden]{display:none}
  #cpb-modal{position:fixed;inset:0;z-index:2147483640;display:none;align-items:center;justify-content:center;background:rgba(20,20,19,.32);
    backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}
  #cpb-modal.show{display:flex;animation:cpbFade .16s ease}
  @keyframes cpbFade{from{opacity:0}to{opacity:1}}
  .cpb-dlg{width:min(400px,calc(100vw - 32px));background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);
    padding:22px 22px 18px;animation:cpbPop .2s var(--ease)}
  @keyframes cpbPop{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:none}}
  .cpb-dlg .ic{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:var(--accent-soft);color:var(--accent);margin-bottom:14px}
  .cpb-dlg h3{margin:0 0 6px;font-size:16px;font-weight:600;color:var(--text);letter-spacing:-.005em}
  .cpb-dlg p{margin:0;font-size:13.5px;line-height:1.55;color:var(--text-2)}
  .cpb-dlg .r{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}
  .cpb-dlg .cpb-btn{padding:8px 14px;font-size:13px}
  .cpb-btn.danger{background:var(--accent);color:#fff}
  .cpb-btn.danger:hover{background:var(--accent);color:#fff;opacity:.88}

  #cpb-tip{position:fixed;left:0;top:0;z-index:2147483600;width:max-content;max-width:300px;padding:9px 12px 10px;background:var(--surface);
    border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow);pointer-events:none;opacity:0;transform:translateX(4px);
    transition:opacity .12s,transform .12s var(--ease)}
  #cpb-tip.show{opacity:1;transform:none}
  #cpb-tip .k{font-size:11px;color:var(--text-3);margin-bottom:3px}
  #cpb-tip .t{font-size:13.5px;font-weight:500;color:var(--text);line-height:1.4}
  #cpb-tip .s{font-size:12.5px;color:var(--text-2);line-height:1.5;margin-top:4px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  #cpb-tip .s:empty,#cpb-tip .k:empty{display:none}

  /* Hover actions on messages */
  #cpb-bar{position:fixed;left:0;top:0;display:flex;flex-direction:column;gap:1px;padding:3px;z-index:2147482500;background:var(--surface);
    border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow);opacity:0;visibility:hidden;transition:opacity .15s,visibility 0s .15s}
  #cpb-bar.show{opacity:1;visibility:visible;transition:opacity .15s}
  #cpb-bar .on{color:var(--accent);background:var(--accent-soft)}
  #cpb-bar .on:hover{color:var(--accent);background:var(--accent-soft)}
  #cpb-bar .on svg{fill:currentColor}

  #cpb-beam{position:fixed;height:2px;border-radius:2px;background:var(--accent);box-shadow:0 0 0 4px var(--accent-soft);pointer-events:none;
    z-index:2147482000;opacity:0;transition:opacity .6s}
  #cpb-beam.show{opacity:1;transition:opacity .15s}

  /* Prompts */
  #cpb-ptab{position:fixed;left:0;top:0;z-index:2147482500;display:none;align-items:center;gap:6px;height:25px;padding:0 11px;font-size:12px;
    color:var(--text-3);background:var(--surface);border:1px solid var(--line);border-bottom:0;border-radius:9px 9px 0 0;transition:color .15s}
  #cpb-ptab:hover,#cpb-ptab.open{color:var(--text)}
  #cpb-ptab .n{font-variant-numeric:tabular-nums;color:var(--text-3)}
  #cpb-tray{position:fixed;left:0;bottom:0;z-index:2147482600;background:var(--surface);border:1px solid var(--line);border-radius:14px;
    box-shadow:var(--shadow);padding:10px 12px 12px;max-height:46vh;overflow:auto;opacity:0;visibility:hidden;transform:translateY(6px);
    transition:opacity .18s var(--ease),transform .18s var(--ease),visibility 0s .18s}
  #cpb-tray.open{opacity:1;visibility:visible;transform:none;transition:opacity .18s var(--ease),transform .18s var(--ease)}
  .cpb-tray-h{display:flex;align-items:center;gap:10px;padding:0 0 10px}
  .cpb-tray-h .t{font-size:13px;font-weight:500;color:var(--text)}
  .cpb-tray-h .hint{font-size:12px;color:var(--text-3);flex:1}
  .cpb-new{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;color:var(--text-2);padding:6px 9px;border-radius:7px;transition:background .12s,color .12s}
  .cpb-new:hover{background:var(--surface-2);color:var(--text)}
  .cpb-chips{display:flex;flex-wrap:wrap;gap:7px}
  .cpb-chip{position:relative;max-width:100%;text-align:left;font-size:13px;color:var(--text);background:var(--page);border:1px solid var(--line);
    border-radius:9px;padding:7px 11px;transition:border-color .15s,background .15s}
  .cpb-chip:hover{border-color:var(--line-2);background:var(--surface-2)}
  .cpb-chip .txt{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-width:320px;line-height:1.45;word-break:break-word}
  .cpb-chip .ops{position:absolute;top:-9px;right:-7px;display:flex;gap:3px;opacity:0;transition:opacity .12s}
  .cpb-chip:hover .ops{opacity:1}
  @media (hover:none){.cpb-chip .ops{opacity:1}}
  .cpb-chip .ops span{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:var(--surface);
    border:1px solid var(--line);color:var(--text-3)}
  .cpb-chip .ops span:hover{color:var(--text);border-color:var(--line-2)}
  .cpb-empty{font-size:13px;color:var(--text-3);line-height:1.55;padding:0 0 4px}
  .cpb-form{margin-top:10px;display:flex;flex-direction:column;gap:8px}
  .cpb-form textarea{font:inherit;font-size:13.5px;line-height:1.5;color:var(--text);background:var(--page);border:1px solid var(--line-2);border-radius:9px;
    padding:8px 10px;min-height:70px;resize:vertical;outline:none;transition:border-color .15s,box-shadow .15s}
  .cpb-form textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
  .cpb-form .r{display:flex;align-items:center;justify-content:flex-end;gap:6px}
  .cpb-form .r .hint{font-size:11.5px;color:var(--text-3);margin-right:auto}
  .cpb-btn{font-size:12.5px;padding:7px 12px;border-radius:7px;color:var(--text-2);transition:background .12s,color .12s}
  .cpb-btn:hover{background:var(--surface-2);color:var(--text)}
  .cpb-btn.primary{background:var(--text);color:var(--surface)}
  .cpb-btn.primary:hover{background:var(--text);color:var(--surface);opacity:.86}
  #cpb-sel{position:fixed;left:0;top:0;display:none;z-index:2147483300;align-items:center;gap:5px;height:28px;padding:0 11px;font-size:12.5px;
    color:var(--surface);background:var(--text);border-radius:8px;box-shadow:var(--shadow)}

  #cpb-toast{position:fixed;left:50%;bottom:120px;transform:translate(-50%,8px);z-index:2147483600;display:flex;align-items:center;gap:14px;
    padding:9px 12px 9px 14px;font-size:13px;color:var(--surface);background:var(--text);border-radius:10px;box-shadow:var(--shadow);
    opacity:0;pointer-events:none;transition:opacity .18s,transform .18s var(--ease)}
  #cpb-toast.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}
  #cpb-toast button{font-size:12.5px;font-weight:500;color:var(--toast-act)}

  .cpb-flash{animation:cpbFlash 1.8s cubic-bezier(.2,.7,.2,1);border-radius:12px}
  @keyframes cpbFlash{0%{box-shadow:0 0 0 0 rgba(201,100,66,0)}18%{box-shadow:0 0 0 6px rgba(201,100,66,.2)}100%{box-shadow:0 0 0 14px rgba(201,100,66,0)}}
  .cpb-noscrollbar{scrollbar-width:none!important}
  .cpb-noscrollbar::-webkit-scrollbar{display:none!important;width:0!important}
  .cpb-shift{transition:padding-left .28s cubic-bezier(.2,.7,.2,1)!important}
  @media (prefers-reduced-motion:reduce){#cpb-root *,.cpb-flash{transition:none!important;animation:none!important}}
  `;

  // ===== config.js =====
  /* ---------- Selectors: if Claude changes its page, these are usually the only lines to update ---------- */
  const SEL = {
    assistant: ['[data-is-streaming]', '.font-claude-response', '.font-claude-message'],
    user: ['[data-testid="user-message"]'],
    editor: ['div.ProseMirror[contenteditable="true"]', '[contenteditable="true"][role="textbox"]', 'fieldset [contenteditable="true"]'],
  };
  const HEADER_OFFSET = 72;
  const SEED_PROMPTS = [
    "Don't change any code I didn't ask you to change.",
    'Please answer in English.',
    'For technical terms, add the original English term in parentheses.',
  ];

  // ===== utils.js =====
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

  // ===== titles.js =====
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

  // ===== ui.js =====
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

  // ===== conversation.js =====
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

  // ===== store.js =====
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

  // ===== panel.js =====
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

  // ===== rail.js =====
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

  // ===== hover.js =====
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

  // ===== prompts.js =====
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

  // ===== main.js =====
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
})();
