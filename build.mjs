// Builds dist/claude-navigator.user.js from src/. No dependencies: run `node build.mjs`.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Script } from 'node:vm';

// Files share one scope inside the userscript, so order matters: each file may use what earlier files define.
const ORDER = [
  'config.js',       // selectors and defaults: the first place to look when Claude changes its page
  'utils.js',        // icons and small helpers
  'titles.js',       // automatic titles for pins and marks
  'ui.js',           // styles, page elements, shared state, toasts, theme
  'conversation.js', // finding messages on the page and loading the full conversation
  'store.js',        // saved pins and marks
  'panel.js',        // the Pinned panel and the rail's right-click menu
  'rail.js',         // the side rail, layout, clear-all and jumping
  'hover.js',        // pin and mark buttons beside each message
  'prompts.js',      // saved prompts beside the message box
  'main.js',         // refresh loop, diagnostics, start-up
];

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const pkg = JSON.parse(read('./package.json'));
const repo = pkg.homepage.replace(/\/$/, '');
const installUrl = repo.replace('https://github.com/', 'https://raw.githubusercontent.com/') + '/main/dist/claude-navigator.user.js';
const vars = { version: pkg.version, description: pkg.description, author: pkg.author, license: pkg.license, homepage: repo, bugs: pkg.bugs, installUrl };

const meta = read('./src/meta.txt').replace(/\{\{(\w+)\}\}/g, (_, k) => {
  if (!(k in vars)) throw new Error(`meta.txt: unknown placeholder {{${k}}}`);
  return vars[k];
});
const css = read('./src/styles.css').trim();
if (/`|\$\{|\\/.test(css)) throw new Error('styles.css must not contain backticks, ${ or backslashes');
const indent = (code) => code.replace(/^(?=.)/gm, '  ');

const body = [
  `const VERSION = ${JSON.stringify(pkg.version)};`,
  `const CSS = \`\n${css}\n\`;`,
  ...ORDER.map((f) => `// ===== ${f} =====\n` + read('./src/' + f).trim()),
].join('\n\n');

const out = `${meta.trim()}\n\n(function () {\n  'use strict';\n\n${indent(body)}\n})();\n`;
new Script(out, { filename: 'claude-navigator.user.js' }); // throws on syntax errors
mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
writeFileSync(new URL('./dist/claude-navigator.user.js', import.meta.url), out);
console.log(`Built dist/claude-navigator.user.js (v${pkg.version}, ${out.split('\n').length} lines)`);
