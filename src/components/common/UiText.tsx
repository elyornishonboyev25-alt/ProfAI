import { useCopy } from '@/i18n/interface'
import type { ReactNode } from 'react'

/** A text-only locale subscriber, safe inside existing semantic HTML. */
export default function UiText({ text, values }: { text: ReactNode; values?: Record<string, string | number> }) {
  const { c } = useCopy()
  return <>{typeof text === 'string' ? c(text, values) : text}</>
}
