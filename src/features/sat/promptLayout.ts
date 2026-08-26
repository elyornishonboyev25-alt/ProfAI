const TASK_LEADS = [
  'Which choice',
  'Which equation',
  'Which table',
  'Which expression',
  'Which of the following',
  'Which finding',
  'Which quotation',
  'Which statement',
  'Which claim',
  'Which detail',
  'Which conclusion',
  'Which transition',
  'Which revision',
  'According to the text',
  'As used in the text',
  'What is',
  'What was',
  'What does',
  'What percentage',
  'How many',
  'How far',
  'How does',
  'For what value',
  'Based on',
]

function isStandaloneMath(line: string) {
  const trimmed = line.trim()
  return /^\${1,2}[^$]+\${1,2}$/.test(trimmed)
    || /^\\\[[\s\S]+\\\]$/.test(trimmed)
    || /^(?=.*(?:\d|[=+\-*/^<>]))(?:[A-Za-z0-9()[\]{}.+\-*/^_=<>]|\\(?:frac|sqrt|left|right|angle|triangle|sin|cos|tan|pi|text))+\s*$/.test(trimmed)
}

function normalizeSection(value: string) {
  return value
    .replace(/\r\n?/g, '\n')
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => {
      const lines = paragraph.split('\n').map((line) => line.trim()).filter(Boolean)
      if (!lines.length) return ''
      if (lines.every((line) => /^(?:--|[-*•])\s+/.test(line))) {
        return lines.map((line) => line.replace(/^(?:--|[-*•])\s+/, '• ')).join('\n')
      }
      if (lines.some(isStandaloneMath)) return lines.join('\n')
      return lines.join(' ')
    })
    .filter(Boolean)
    .join('\n\n')
}

function formatContext(value: string) {
  const lines = normalizeSection(value).split('\n')
  const introduction: string[] = []
  const notes: string[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      if (introduction.length && introduction[introduction.length - 1] !== '') introduction.push('')
      continue
    }
    const note = line.match(/^•\s+(.+)$/)
    if (note) notes.push(note[1].trim())
    else if (notes.length) notes[notes.length - 1] = `${notes[notes.length - 1]} ${line}`
    else introduction.push(line)
  }

  return [introduction.join('\n').trim(), notes.map((note) => `• ${note}`).join('\n')]
    .filter(Boolean)
    .join('\n\n')
}

export function splitSATPrompt(prompt: string) {
  const normalized = prompt.replace(/\r\n?/g, '\n').trim()

  // Rhetorical-synthesis questions place the student's goal with the question,
  // while the research notes remain in the source panel.
  const goalSeparators = [...normalized.matchAll(/\n\s*\n(?=(?:The|A) student wants\b)/gi)]
  const goalSeparator = goalSeparators[goalSeparators.length - 1]
  const taskIndex = goalSeparator
    ? goalSeparator.index + goalSeparator[0].length
    : Math.max(...TASK_LEADS.map((lead) => normalized.lastIndexOf(lead)))

  if (taskIndex <= 0) {
    return { context: '', task: normalizeSection(normalized) }
  }

  return {
    context: formatContext(normalized.slice(0, taskIndex)),
    task: normalizeSection(normalized.slice(taskIndex)),
  }
}
