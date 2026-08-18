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

function formatContext(value: string) {
  const lines = value.replace(/\r\n?/g, '\n').trim().split('\n')
  const introduction: string[] = []
  const notes: string[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    const note = line.match(/^(?:--|[-*•])\s+(.+)$/)
    if (note) {
      notes.push(note[1].trim())
    } else if (notes.length) {
      notes[notes.length - 1] = `${notes[notes.length - 1]} ${line}`
    } else {
      introduction.push(line)
    }
  }

  if (!notes.length) return introduction.join(' ')

  return [introduction.join(' '), notes.map((note) => `• ${note}`).join('\n')]
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
    return { context: '', task: normalized.replace(/\s+/g, ' ') }
  }

  return {
    context: formatContext(normalized.slice(0, taskIndex)),
    task: normalized.slice(taskIndex).replace(/\s+/g, ' ').trim(),
  }
}
