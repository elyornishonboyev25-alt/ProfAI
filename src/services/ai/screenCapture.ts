// "AI sees what you see." Captures the real on-screen content (the reading passage,
// the current question, an article, a lesson) plus anything the learner has selected /
// highlighted, so that when they ask "explain this", "what does it say here",
// "bu yerda nima deyilgan?", the tutor answers from the exact context on their screen.
//
// We read the rendered TEXT from the DOM (not screenshots): it is precise, cheap, and
// works on every page instantly. The floating assistant lives OUTSIDE <main>, so the
// captured text never includes the chat UI itself.

const MAX_VISIBLE_CHARS = 6000
const MAX_SELECTION_CHARS = 2000

// Words that signal the learner is pointing at something on the screen ("this", "here",
// "explain", "bu", "shu yer", "tushuntir", "это", "здесь", "объясни"…). When any of these
// appear — or when there is a text selection — we attach the full visible page text.
const SCREEN_REFERENCE = new RegExp(
  [
    // English
    'this|that|these|those|here|above|below|explain|mean|meaning|translate|paragraph|sentence|word|phrase|question|passage|answer|highlight',
    // Uzbek
    "bu|shu|mana|ushbu|tushuntir|nima de|ma'no|tarjim|yuqorida|pastda|gap|so'z|jumla|savol|paragraf|matn|javob|belgila",
    // Russian
    'это|этот|эта|здесь|выше|ниже|объясн|значит|перевед|предложени|слово|фраза|вопрос|абзац|текст|ответ',
  ].join('|'),
  'i',
)

// Content-heavy routes where the learner is almost always reading something they may
// want explained — attach the page text even without an explicit "this".
const CONTENT_ROUTE = /^\/(test|articles|admission\/lessons|vocabulary|podcast|shadowing-lab)/

export type ScreenContext = {
  pageTitle: string
  selection: string
  visibleText: string
  truncated: boolean
}

function tidy(text: string): string {
  return text
    .replace(/\r/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function captureScreenContext(): ScreenContext {
  if (typeof document === 'undefined') {
    return { pageTitle: '', selection: '', visibleText: '', truncated: false }
  }

  let selection = ''
  try {
    selection = (window.getSelection?.()?.toString() ?? '').trim()
  } catch {
    selection = ''
  }
  if (selection.length > MAX_SELECTION_CHARS) {
    selection = `${selection.slice(0, MAX_SELECTION_CHARS)}…`
  }

  const main = document.querySelector('main') ?? document.body
  const pageTitle =
    main?.querySelector('h1, h2')?.textContent?.trim() || document.title?.trim() || ''

  // innerText reflects what is actually rendered (honours display:none, line breaks),
  // which is exactly "what the learner sees".
  let visibleText = main instanceof HTMLElement ? tidy(main.innerText ?? '') : ''
  let truncated = false
  if (visibleText.length > MAX_VISIBLE_CHARS) {
    visibleText = visibleText.slice(0, MAX_VISIBLE_CHARS)
    truncated = true
  }

  return { pageTitle, selection, visibleText, truncated }
}

// Decide how much screen context to send for a given message, then format it for the
// prompt. We always include the page title + any selection (cheap + high-signal), and
// attach the full visible text when the learner is clearly referring to the screen or is
// on a content-heavy page. Returns '' when there is nothing useful to send.
export function composeScreenContext(message: string, pathname: string): string {
  const ctx = captureScreenContext()
  const referencesScreen =
    ctx.selection.length > 0 || SCREEN_REFERENCE.test(message) || CONTENT_ROUTE.test(pathname)

  const parts: string[] = []
  if (ctx.pageTitle) parts.push(`Current page: ${ctx.pageTitle}`)

  if (ctx.selection) {
    parts.push(
      `The learner has SELECTED / HIGHLIGHTED this text — they almost certainly want THIS explained:\n"""\n${ctx.selection}\n"""`,
    )
  }

  if (referencesScreen && ctx.visibleText) {
    parts.push(
      `This is the content currently on the learner's screen${ctx.truncated ? ' (truncated)' : ''}. When they say "this", "here", "bu yerda", "это" etc., they mean something from here — read it and explain from it:\n"""\n${ctx.visibleText}\n"""`,
    )
  }

  return parts.join('\n\n')
}
