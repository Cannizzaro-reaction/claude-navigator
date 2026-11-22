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
