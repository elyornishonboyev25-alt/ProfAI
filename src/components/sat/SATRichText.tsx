import { Fragment, type ReactNode } from 'react'

type Props = {
  text: string
  className?: string
}

const MATH_FONT = '"STIX Two Math", "Cambria Math", "Times New Roman", serif'

const mathSymbols: Record<string, string> = {
  times: '×', cdot: '·', div: '÷', le: '≤', leq: '≤', ge: '≥', geq: '≥', neq: '≠',
  pm: '±', approx: '≈', parallel: '∥', Rightarrow: '⇒', rightarrow: '→', implies: '⇒',
  pi: 'π', circ: '°', triangle: '△', angle: '∠', infty: '∞', percent: '%', '%': '%',
}

const mathFunctions = new Set(['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln'])

function matchingClosingIndex(value: string, openingIndex: number, opening = '{', closing = '}') {
  let depth = 0
  for (let index = openingIndex; index < value.length; index += 1) {
    if (value[index] === opening) depth += 1
    if (value[index] === closing) depth -= 1
    if (depth === 0) return index
  }
  return -1
}

function isWrapped(value: string, opening: string, closing: string) {
  return value.startsWith(opening) && matchingClosingIndex(value, 0, opening, closing) === value.length - 1
}

function topLevelOperatorIndexes(value: string, operators: string[]) {
  const matches: Array<{ index: number; operator: string }> = []
  let braces = 0
  let parentheses = 0
  let brackets = 0

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if (character === '{') braces += 1
    else if (character === '}') braces -= 1
    else if (character === '(') parentheses += 1
    else if (character === ')') parentheses -= 1
    else if (character === '[') brackets += 1
    else if (character === ']') brackets -= 1

    if (braces || parentheses || brackets) continue
    const operator = operators.find((candidate) => value.startsWith(candidate, index))
    if (!operator) continue
    matches.push({ index, operator })
    index += operator.length - 1
  }
  return matches
}

let mathKey = 0
function nextMathKey() {
  mathKey += 1
  return `sat-math-${mathKey}`
}

function renderMathExpression(rawValue: string): ReactNode {
  let value = rawValue.trim()
  if (!value) return <mrow />
  if (isWrapped(value, '{', '}')) value = value.slice(1, -1).trim()

  const relations = topLevelOperatorIndexes(value, ['\\Rightarrow', '\\rightarrow', '\\implies', '\\leq', '\\geq', '\\neq', '\\approx', '<=', '>=', '≠', '≤', '≥', '=', '<', '>'])
  if (relations.length) {
    const children: ReactNode[] = []
    let start = 0
    relations.forEach(({ index, operator }) => {
      children.push(<Fragment key={nextMathKey()}>{renderMathExpression(value.slice(start, index))}</Fragment>)
      children.push(<Fragment key={nextMathKey()}><mo>{mathSymbols[operator.slice(1)] ?? ({ '<=': '≤', '>=': '≥' }[operator] ?? operator)}</mo></Fragment>)
      start = index + operator.length
    })
    children.push(<Fragment key={nextMathKey()}>{renderMathExpression(value.slice(start))}</Fragment>)
    return <mrow>{children}</mrow>
  }

  const additions = topLevelOperatorIndexes(value, ['+', '-'])
    .filter(({ index }) => index > 0 && !/[=<>+\-×·*/^(,]\s*$/.test(value.slice(0, index)))
  if (additions.length) {
    const children: ReactNode[] = []
    let start = 0
    additions.forEach(({ index, operator }) => {
      children.push(<Fragment key={nextMathKey()}>{renderMathExpression(value.slice(start, index))}</Fragment>)
      children.push(<Fragment key={nextMathKey()}><mo>{operator}</mo></Fragment>)
      start = index + operator.length
    })
    children.push(<Fragment key={nextMathKey()}>{renderMathExpression(value.slice(start))}</Fragment>)
    return <mrow>{children}</mrow>
  }

  const divisions = topLevelOperatorIndexes(value, ['/'])
  if (divisions.length) {
    const division = divisions[divisions.length - 1]
    return <mfrac>{renderMathExpression(value.slice(0, division.index))}{renderMathExpression(value.slice(division.index + 1))}</mfrac>
  }

  return renderMathSequence(value)
}

function renderMathSequence(value: string): ReactNode {
  const nodes: ReactNode[] = []
  let index = 0

  const readGroup = (opening = '{', closing = '}') => {
    if (value[index] !== opening) return ''
    const end = matchingClosingIndex(value, index, opening, closing)
    if (end === -1) return ''
    const content = value.slice(index + 1, end)
    index = end + 1
    return content
  }

  const readAtom = (): ReactNode => {
    while (/\s/.test(value[index] ?? '')) index += 1
    if (index >= value.length) return <mrow />

    const character = value[index]
    if (character === '{') return <mrow>{renderMathExpression(readGroup())}</mrow>
    if (character === '(' || character === '[') {
      const closing = character === '(' ? ')' : ']'
      const end = matchingClosingIndex(value, index, character, closing)
      if (end !== -1) {
        const content = value.slice(index + 1, end)
        index = end + 1
        return <mrow><mo>{character}</mo>{renderMathExpression(content)}<mo>{closing}</mo></mrow>
      }
    }
    if (character === '\\') {
      index += 1
      const commandMatch = value.slice(index).match(/^[A-Za-z]+|^./)
      const command = commandMatch?.[0] ?? ''
      index += command.length

      if (command === 'left' || command === 'right') return readAtom()
      if (command === 'frac') {
        while (/\s/.test(value[index] ?? '')) index += 1
        const numerator = readGroup()
        while (/\s/.test(value[index] ?? '')) index += 1
        const denominator = readGroup()
        return <mfrac>{renderMathExpression(numerator)}{renderMathExpression(denominator)}</mfrac>
      }
      if (command === 'sqrt') {
        while (/\s/.test(value[index] ?? '')) index += 1
        const rootIndex = value[index] === '[' ? readGroup('[', ']') : ''
        while (/\s/.test(value[index] ?? '')) index += 1
        const radicand = readGroup()
        return rootIndex
          ? <mroot>{renderMathExpression(radicand)}{renderMathExpression(rootIndex)}</mroot>
          : <msqrt>{renderMathExpression(radicand)}</msqrt>
      }
      if (command === 'text') {
        while (/\s/.test(value[index] ?? '')) index += 1
        return <mtext>{readGroup()}</mtext>
      }
      if (command === 'overline' || command === 'hat') {
        while (/\s/.test(value[index] ?? '')) index += 1
        const content = readGroup()
        return <mover accent="true">{renderMathExpression(content)}<mo>{command === 'hat' ? '^' : '¯'}</mo></mover>
      }
      if (mathFunctions.has(command)) return <mi mathvariant="normal">{command}</mi>
      if (mathSymbols[command]) return <mo>{mathSymbols[command]}</mo>
      return <mi>{command}</mi>
    }
    if (/\d/.test(character) || (character === '.' && /\d/.test(value[index + 1] ?? ''))) {
      // A comma belongs to a number only when it is a thousands separator;
      // coordinate commas such as (-7, 3) need their own operator spacing.
      const number = value.slice(index).match(/^(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+)/)?.[0] ?? character
      index += number.length
      return <mn>{number}</mn>
    }
    if (/[A-Za-z]/.test(character)) {
      index += 1
      return <mi>{character}</mi>
    }

    index += 1
    return <mo>{character}</mo>
  }

  while (index < value.length) {
    let base = readAtom()
    let subscript: ReactNode | undefined
    let superscript: ReactNode | undefined
    while (value[index] === '^' || value[index] === '_') {
      const marker = value[index]
      index += 1
      while (/\s/.test(value[index] ?? '')) index += 1
      let script: ReactNode
      if (value[index] === '{') script = renderMathExpression(readGroup())
      else script = readAtom()
      if (marker === '^') superscript = script
      else subscript = script
    }

    if (subscript && superscript) base = <msubsup>{base}{subscript}{superscript}</msubsup>
    else if (subscript) base = <msub>{base}{subscript}</msub>
    else if (superscript) base = <msup>{base}{superscript}</msup>
    nodes.push(<Fragment key={nextMathKey()}>{base}</Fragment>)
  }

  return <mrow>{nodes}</mrow>
}

function MathFormula({ value, display = false }: { value: string; display?: boolean }) {
  return (
    <math
      display={display ? 'block' : 'inline'}
      className={display ? 'mx-auto min-w-max text-[1.12em]' : 'mx-[0.08em] inline-block text-[1.04em]'}
      style={{ fontFamily: MATH_FONT }}
    >
      {renderMathExpression(value)}
    </math>
  )
}

function looksLikeMath(value: string) {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 180) return false
  // Compact $...$ spans are always mathematical in SAT content. This covers
  // variable pairs such as $xy$ and polynomials such as $x^2+ax+c=0$.
  if (!/\s/.test(trimmed)) return true
  const proseWords = trimmed.match(/[A-Za-z]{2,}/g) ?? []
  const hasMathSyntax = /\\|[=<>^_+*/]/.test(trimmed)
  // Do not mistake paired currency amounts such as "$27 ... $3" for math.
  if (!hasMathSyntax && proseWords.length) return false
  if (hasMathSyntax) return true
  if (!proseWords.length) return true
  return /^[A-Za-z]$/.test(trimmed)
}

function markdownNodes(text: string, keyPrefix: string): ReactNode[] {
  const tokens = text.split(/(<u>.*?<\/u>|\*\*.*?\*\*|\*[^*]+\*)/g)
  return tokens.filter(Boolean).map((token, index) => {
    const key = `${keyPrefix}-${index}`
    if (token.startsWith('<u>') && token.endsWith('</u>')) return <u key={key}>{token.slice(3, -4)}</u>
    if (token.startsWith('**') && token.endsWith('**')) return <strong key={key}>{inlineNodes(token.slice(2, -2))}</strong>
    if (token.startsWith('*') && token.endsWith('*')) return <em key={key}>{inlineNodes(token.slice(1, -1))}</em>
    return <Fragment key={key}>{token}</Fragment>
  })
}

function inlineNodes(text: string): ReactNode[] {
  // Find valid math pairs before parsing emphasis. Scanning instead of simply
  // pairing every two dollar signs prevents a currency amount such as $900
  // from swallowing the next real formula delimiter.
  const nodes: ReactNode[] = []
  let plainStart = 0
  let cursor = 0
  let segment = 0

  while (cursor < text.length) {
    const opening = text.indexOf('$', cursor)
    if (opening === -1) break
    const closing = text.indexOf('$', opening + 1)
    if (closing === -1) break
    const value = text.slice(opening + 1, closing)

    if (looksLikeMath(value)) {
      if (opening > plainStart) nodes.push(...markdownNodes(text.slice(plainStart, opening), `text-${segment}`))
      nodes.push(<MathFormula key={`math-${segment}`} value={value} />)
      segment += 1
      plainStart = closing + 1
      cursor = closing + 1
    } else {
      cursor = opening + 1
    }
  }

  if (plainStart < text.length) nodes.push(...markdownNodes(text.slice(plainStart), `text-${segment}`))
  return nodes
}

function normalizeRichText(text: string) {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/```/g, '')
    .replace(/\\\[([\s\S]*?)\\\]/g, (_match, value: string) => `\n\n$$${value}$$\n\n`)
    .replace(/\$\$\s*\$\$/g, () => '$$\n\n$$')
    .replace(/(^|\n)\$\$([^$]+)\$\$(?=\S)/g, (_match, prefix: string, value: string) => `${prefix}$$${value}$$\n\n`)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export default function SATRichText({ text, className = '' }: Props) {
  const blocks = normalizeRichText(text).split(/\n\s*\n/).filter((block) => block.trim())

  return (
    <div className={className}>
      {blocks.map((rawBlock, index) => {
        const block = rawBlock.trim()
        const spacing = index ? 'mt-4' : ''
        const displayMath = block.match(/^\$\$([\s\S]+)\$\$$/) ?? block.match(/^\$([^$\n]+)\$$/)
        if (displayMath && looksLikeMath(displayMath[1])) {
          return <div key={index} className={`${spacing} overflow-x-auto py-1.5 text-center`}><MathFormula value={displayMath[1]} display /></div>
        }

        const heading = block.match(/^#{1,6}\s+(.+)$/s)
        if (heading) return <p key={index} className={`${spacing} font-bold text-slate-950`}>{inlineNodes(heading[1])}</p>
        if (/^(?:-{3,}|\*{3,})$/.test(block)) return <hr key={index} className={`${spacing} border-slate-200`} />

        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
        const unordered = lines.every((line) => /^(?:[-*•])\s+/.test(line))
        if (unordered) {
          return <ul key={index} className={`${spacing} list-disc space-y-2.5 pl-6`}>{lines.map((line, lineIndex) => <li key={lineIndex}>{inlineNodes(line.replace(/^(?:[-*•])\s+/, ''))}</li>)}</ul>
        }
        const ordered = lines.every((line) => /^\d+[.)]\s+/.test(line))
        if (ordered) {
          return <ol key={index} className={`${spacing} list-decimal space-y-2.5 pl-7`}>{lines.map((line, lineIndex) => <li key={lineIndex}>{inlineNodes(line.replace(/^\d+[.)]\s+/, ''))}</li>)}</ol>
        }
        return (
          <p key={index} className={`${spacing} whitespace-pre-line`}>
            {lines.map((line, lineIndex) => <Fragment key={lineIndex}>{lineIndex > 0 && <br />}{inlineNodes(line)}</Fragment>)}
          </p>
        )
      })}
    </div>
  )
}
