import DOMPurify from 'dompurify'
import type { SATQuestion } from './practiceTest4'

export type ExplanationPart = { content: string; html: boolean }
export type SATExplanationModel = {
  steps: ExplanationPart[]
  alternatives: ExplanationPart[]
}

// Keep notation and inline formatting intact while dividing prose into readable
// steps. In particular, never sentence-split a decimal, MathML tree, or formula.
function protect(value: string, fragments: string[]) {
  const token = `\uE000${fragments.length}\uE001`
  fragments.push(value)
  return token
}

function htmlProse(html: string, fragments: string[]) {
  const template = document.createElement('template')
  template.innerHTML = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, mathMl: true },
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'iframe', 'a'],
    FORBID_ATTR: ['style', 'id', 'name'],
  })
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.textContent?.trim()) return ' '
      const span = document.createElement('span')
      span.textContent = node.textContent
      return span.innerHTML
    }
    if (!(node instanceof Element)) return Array.from(node.childNodes).map(walk).join('')
    if (['math', 'img', 'table', 'ul', 'ol', 'sup', 'sub', 'strong', 'em', 'u'].includes(node.localName)) {
      return protect(node.outerHTML, fragments)
    }
    if (node.localName === 'br') return '\n'
    const content = Array.from(node.childNodes).map(walk).join('')
    return ['p', 'div', 'li', 'blockquote'].includes(node.localName) ? `\n${content}\n` : content
  }
  return walk(template.content)
}

const genericStep = /^(?:Identify (?:exactly what the stem asks|the quantities, evidence, or (?:grammar|language) relationship)|Read the notation in the question and identify the relationship)/i

function sentences(value: string) {
  return value.split(/(?<=[.!?][”"')\]]?)\s+(?=[A-Z\d\uE000])/u)
    .map((part) => part.trim()).filter(Boolean)
}

function readableChunks(value: string) {
  const chunks: string[] = []
  let chunk = ''
  for (const sentence of sentences(value)) {
    if (chunk && chunk.length + sentence.length > 320) {
      chunks.push(chunk)
      chunk = ''
    }
    chunk += `${chunk ? ' ' : ''}${sentence}`
  }
  if (chunk) chunks.push(chunk)
  return chunks
}

export function buildSATExplanation(question: SATQuestion): SATExplanationModel {
  const fragments: string[] = []
  const html = Boolean(question.sourceContent?.explanation.trim())
  let prose = html
    ? htmlProse(question.sourceContent!.explanation, fragments)
    : question.explanation.replace(/\r\n?/g, '\n').replace(/\s*Source correction:[\s\S]*$/, '')
      .replace(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g, (formula) => protect(formula, fragments))

  prose = prose
    .replace(/&nbsp;/gi, ' ')
    .replace(/\*\*Correct Answer Identification:[^\n]*|\*\*Correct answer:[^\n]*/gi, '')
    .replace(/\*\*(?:Justification|Distractor Analysis):?\*\*:?/gi, '\n')
    .replace(/^\s*#{1,6}\s+(?:Justification|Distractor Analysis|Explanation)\s*:?\s*$/gmi, '\n')
    .replace(/\*\*Step\s+\d+:?\*\*:?\s*/gi, '\n')
    .replace(/\bChoice [A-D] is (?:correct|the best answer)\.?\s*/g, '')
    .replace(/^\s*because\s+/i, 'This works because ')

  // Delimit distractors before sentence splitting; several sources put every
  // distractor in one paragraph, including grouped choices such as A, B, and C.
  const wrong = /\bChoices?\s+[A-D](?:(?:,\s*(?:and\s+)?|\s+and\s+)[A-D])*\s+(?:is|are)\s+incorrect\b/g
  prose = prose.replace(wrong, (match) => `\n\uE002${match}`)
    .replace(/^\s*[*-]\s+\*\*\([A-D]\)/gm, (match) => `\n\uE002${match.trim()}`)

  const restore = (value: string): ExplanationPart => ({
    content: value.replace(/\uE000(\d+)\uE001/g, (_match, index: string) => fragments[Number(index)]), html,
  })
  const steps: ExplanationPart[] = []
  const alternatives: ExplanationPart[] = []
  let alternative = ''
  const flushAlternative = () => {
    const genericError = /^Choices? [A-D](?:,? (?:and )?[A-D])* (?:is|are) incorrect and may result from (?:conceptual|calculation|conceptual or calculation) errors?\.?$/
    if (alternative && !genericError.test(alternative.trim())) alternatives.push(restore(alternative.trim()))
    alternative = ''
  }
  for (const rawLine of prose.split(/\n+/)) {
    let line = rawLine.trim()
    if (!line) continue
    if (/^(?:-{3,}|\*{3,})$/.test(line)) continue
    if (line.startsWith('\uE002')) {
      flushAlternative()
      alternative = line.slice(1)
      continue
    }
    if (alternative) { alternative += ` ${line}`; continue }
    line = line.replace(/^\d+[.)]\s+/, '')
    if (genericStep.test(line)) continue
    if (/^The correct answer is\s+\*?\*?\(?[A-D]\)?\*?\*?\.?$/i.test(line)) continue
    // The answer is already shown above the steps. Keep conclusions that add
    // reasoning, units, or an evaluated expression, rather than a repeated key.
    if (/^Therefore (?:the correct answer is|\*\*[A-D]\*\* is correct)/i.test(line)) continue
    for (const chunk of readableChunks(line)) {
      const part = restore(chunk)
      const previous = steps[steps.length - 1]
      // A displayed calculation belongs with the instruction introducing it,
      // rather than appearing as an unexplained step of its own.
      if (previous?.content.endsWith(':')) previous.content += `${html ? ' ' : '\n\n'}${part.content}`
      else steps.push(part)
    }
  }
  flushAlternative()
  return { steps, alternatives }
}
