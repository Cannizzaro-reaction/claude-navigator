# Claude Navigator

A userscript for [claude.ai](https://claude.ai) that makes long conversations easy to find your way around.

[中文说明](README.zh-CN.md)

<!-- Add a screenshot: docs/screenshot.png -->

## Features

- **Pin answers.** Hover over a message and pin it. Pinned answers collect in a panel at the top of the page (or docked on the left), where you can read them in place without scrolling back.
- **Side rail with marks.** A slim rail on the right shows every question you asked, your pins and your marks across the whole conversation. Click to jump, drag to scroll, right-click a mark to rename or remove it. The **+** button marks the exact spot you are reading.
- **Automatic titles.** Pins and marks are titled from your question, or from the answer when the question is vague ("continue", "why?"). Titles follow the language of the conversation and can be renamed.
- **Saved prompts.** Keep phrases you type often beside the message box and insert them at the cursor with one click. Select text you typed and save it as a new prompt.
- **Works on long chats.** Claude only renders the messages near you; the script loads the full conversation so the rail and jumps cover all of it.
- Light and dark themes that follow Claude, and a one-click clear with undo.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. In Chrome or Edge, open `chrome://extensions`, open Tampermonkey's **Details** and turn on **Allow User Scripts**.
3. Open the install link: **[claude-navigator.user.js](https://raw.githubusercontent.com/YOUR_GITHUB_NAME/claude-navigator/main/dist/claude-navigator.user.js)**. Tampermonkey shows an install page; click **Install**.
4. Open a conversation on claude.ai and reload.

Tampermonkey checks the same link for updates.

## Privacy

Everything stays in your browser. Pins, marks and prompts are saved in Tampermonkey's storage. To read the full conversation, the script makes the same read-only request the Claude page makes, using your existing sign-in. Nothing is sent anywhere else.

## Troubleshooting

If something stops working after Claude updates its page, open the Tampermonkey menu, choose **Copy diagnostics** and paste the result into an issue. Most fixes only need the selectors in `src/config.js`.

## Development

No dependencies. You need Node.js 18 or newer.

```
src/
  meta.txt          userscript header (version and links are filled in from package.json)
  styles.css        all styles
  config.js         selectors and defaults: update these when Claude changes its page
  utils.js          icons and small helpers
  titles.js         automatic titles
  ui.js             page elements, shared state, toasts, theme
  conversation.js   finding messages and loading the full conversation
  store.js          saved pins and marks
  panel.js          the Pinned panel and the rail menu
  rail.js           the side rail, layout, clear-all and jumping
  hover.js          pin and mark buttons beside each message
  prompts.js        saved prompts
  main.js           refresh loop, diagnostics, start-up
dist/
  claude-navigator.user.js   built file, committed so the install link works
```

```sh
node build.mjs
```

The source files share one scope and are joined in the order listed in `build.mjs`. To try a change, build and paste `dist/claude-navigator.user.js` into Tampermonkey.

To release: bump `version` in `package.json`, run the build, commit `dist/` and tag the commit.

## Disclaimer

Not affiliated with or endorsed by Anthropic. Claude is a trademark of Anthropic.

## License

[MIT](LICENSE)
