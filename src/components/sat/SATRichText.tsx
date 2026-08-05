import { Fragment, type ReactNode } from 'react'

type Props = {
  text: string
  className?: string
}

function formatMath(value: string) {
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

  for (let index = 0; index < 4; index += 1) {
    result = result
      .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
      .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
  }

  return result
    .replace(/\^\{([^{}]+)\}/g, '^$1')
    .replace(/_\{([^{}]+)\}/g, '_$1')
    .replace(/[{}]/g, '')
    .trim()
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
      return <span key={index} className="whitespace-nowrap font-serif font-semibold italic text-slate-950">{formatMath(token.slice(1, -1))}</span>
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
