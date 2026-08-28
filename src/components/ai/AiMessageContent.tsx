import { Fragment, type ReactNode } from 'react'
import { normalizeAssistantReply } from '@/services/ai/assistantResponse'

type AiMessageContentProps = {
  content: string
}

function renderInline(text: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)

  return tokens.filter(Boolean).map((token, index) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={index} className="font-extrabold text-slate-950">{token.slice(2, -2)}</strong>
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return <code key={index} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.88em] font-semibold text-blue-700">{token.slice(1, -1)}</code>
    }
    return <Fragment key={index}>{token}</Fragment>
  })
}

export function AiMessageContent({ content }: AiMessageContentProps) {
  const normalized = normalizeAssistantReply(content).replace(/\r\n?/g, '\n')
  const lines = normalized.split('\n')
  const blocks: ReactNode[] = []

  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim()
    if (!line) {
      index += 1
      continue
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line)
    if (heading) {
      blocks.push(
        <h3 key={`heading-${index}`} className="mt-5 text-[0.95rem] font-black leading-6 text-slate-950 first:mt-0">
          {renderInline(heading[2])}
        </h3>,
      )
      index += 1
      continue
    }

    const unordered = /^[-*]\s+(.+)$/.exec(line)
    const ordered = /^\d+[.)]\s+(.+)$/.exec(line)
    if (unordered || ordered) {
      const isOrdered = Boolean(ordered)
      const items: ReactNode[] = []
      while (index < lines.length) {
        const candidate = lines[index].trim()
        const match = isOrdered ? /^\d+[.)]\s+(.+)$/.exec(candidate) : /^[-*]\s+(.+)$/.exec(candidate)
        if (!match) break
        items.push(<li key={`item-${index}`} className="pl-1 marker:font-bold marker:text-blue-600">{renderInline(match[1])}</li>)
        index += 1
      }
      const className = 'my-3 space-y-1.5 pl-5 text-[0.9rem] leading-6 text-slate-700'
      blocks.push(isOrdered
        ? <ol key={`list-${index}`} className={`${className} list-decimal`}>{items}</ol>
        : <ul key={`list-${index}`} className={`${className} list-disc`}>{items}</ul>)
      continue
    }

    if (line.startsWith('> ')) {
      blocks.push(
        <blockquote key={`quote-${index}`} className="my-3 rounded-r-xl border-l-2 border-blue-500 bg-blue-50/70 px-3 py-2 text-[0.88rem] font-medium leading-6 text-slate-700">
          {renderInline(line.slice(2))}
        </blockquote>,
      )
      index += 1
      continue
    }

    const paragraph: string[] = [line]
    index += 1
    while (index < lines.length) {
      const candidate = lines[index].trim()
      if (!candidate || /^(#{1,3})\s+|^[-*]\s+|^\d+[.)]\s+|^>\s+/.test(candidate)) break
      paragraph.push(candidate)
      index += 1
    }
    blocks.push(
      <p key={`paragraph-${index}`} className="my-2 text-[0.9rem] leading-6 text-slate-700 first:mt-0 last:mb-0">
        {renderInline(paragraph.join(' '))}
      </p>,
    )
  }

  return <div className="min-w-0 break-words">{blocks}</div>
}

export default AiMessageContent
