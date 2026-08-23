import { Fragment, type ReactNode } from 'react'

type Props = {
  text: string
  className?: string
}

const superscriptCharacters: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
}

function superscript(value: string) {
  return [...value].map((character) => superscriptCharacters[character] ?? character).join('')
}

function normalizeMath(value: string) {
  let result = value
    .replace(/\\left|\\right/g, '')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\div/g, '÷')
    .replace(/\\leq?/g, '≤')
    .replace(/\\geq?/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\pm/g, '±')
    .replace(/\\approx/g, '≈')
    .replace(/\\parallel/g, '∥')
    .replace(/\\(?:Rightarrow|rightarrow|implies)/g, '→')
    .replace(/\\pi/g, 'π')
    .replace(/\\circ/g, '°')
    .replace(/\\sin/g, 'sin')
    .replace(/\\cos/g, 'cos')
    .replace(/\\tan/g, 'tan')
    .replace(/\\cot/g, 'cot')
    .replace(/\\%/g, '%')
    .replace(/\\overline\{([^{}]+)\}/g, '$1')
    .replace(/\\hat\{([^{}]+)\}/g, '$1̂')
    .replace(/\\text\{([^{}]+)\}/g, '$1')
    .replace(/\\triangle/g, '△')
    .replace(/\\angle/g, '∠')
    .replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, (_match, index: string, radicand: string) => `${superscript(index)}√(${radicand})`)

  for (let index = 0; index < 4; index += 1) {
    result = result
      .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
      .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
  }

  return result.trim()
}

function closingBraceIndex(value: string, openingIndex: number) {
  let depth = 0
  for (let index = openingIndex; index < value.length; index += 1) {
    if (value[index] === '{') depth += 1
    if (value[index] === '}') depth -= 1
    if (depth === 0) return index
  }
  return -1
}

function mathNodes(value: string, keyPrefix = 'math'): ReactNode[] {
  const nodes: ReactNode[] = []
  let plainText = ''
  let nodeIndex = 0

  const flushPlainText = () => {
    if (!plainText) return
    nodes.push(<Fragment key={`${keyPrefix}-text-${nodeIndex}`}>{plainText}</Fragment>)
    plainText = ''
    nodeIndex += 1
  }

  for (let index = 0; index < value.length; index += 1) {
    const marker = value[index]
    if (marker !== '^' && marker !== '_') {
      // Unconsumed braces are LaTeX grouping characters, not visible math.
      if (marker !== '{' && marker !== '}') plainText += marker
      continue
    }

    let content = ''
    let contentEnd = index + 1
    if (value[index + 1] === '{') {
      const closingIndex = closingBraceIndex(value, index + 1)
      if (closingIndex !== -1) {
        content = value.slice(index + 2, closingIndex)
        contentEnd = closingIndex
      }
    } else if (value[index + 1]) {
      content = value[index + 1]
      contentEnd = index + 1
    }

    if (!content) {
      plainText += marker
      continue
    }

    flushPlainText()
    const Tag = marker === '^' ? 'sup' : 'sub'
    nodes.push(
      <Tag key={`${keyPrefix}-${Tag}-${nodeIndex}`} className="not-italic">
        {mathNodes(content, `${keyPrefix}-${Tag}-${nodeIndex}`)}
      </Tag>,
    )
    nodeIndex += 1
    index = contentEnd
  }

  flushPlainText()
  return nodes
}

function inlineNodes(text: string): ReactNode[] {
  const tokens = text.split(/(<u>.*?<\/u>|\*\*.*?\*\*|\*[^*]+\*|\$[^$]+\$)/g)
  return tokens.filter(Boolean).map((token, index) => {
    if (token.startsWith('<u>') && token.endsWith('</u>')) {
      return <u key={index}>{token.slice(3, -4)}</u>
    }
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={index}>{token.slice(2, -2)}</strong>
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={index}>{token.slice(1, -1)}</em>
    }
    if (token.startsWith('$') && token.endsWith('$')) {
      const math = normalizeMath(token.slice(1, -1))
      return <span key={index} className="whitespace-nowrap font-serif font-semibold italic text-slate-950">{mathNodes(math, `inline-${index}`)}</span>
    }
    return <Fragment key={index}>{token}</Fragment>
  })
}

export default function SATRichText({ text, className = '' }: Props) {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\$\$([\s\S]*?)\$\$/g, (_match, value: string) => `\n$${value}$\n`)
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const blocks = normalized.split(/\n\s*\n/).filter(Boolean)

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        const lines = block.split('\n').filter((line) => line.trim())
        const isList = lines.every((line) => /^\s*[-*•]\s+/.test(line))
        if (isList) {
          return (
            <ul key={index} className="my-3 list-disc space-y-2 pl-5">
              {lines.map((line, lineIndex) => <li key={lineIndex}>{inlineNodes(line.replace(/^\s*[-*•]\s+/, ''))}</li>)}
            </ul>
          )
        }
        return <p key={index} className={index ? 'mt-3' : undefined}>{inlineNodes(lines.join(' '))}</p>
      })}
    </div>
  )
}
