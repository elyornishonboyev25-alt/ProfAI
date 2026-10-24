import { useCopy } from '@/i18n/interface'

/** A text-only locale subscriber, safe inside existing semantic HTML. */
export default function UiText({ text, values }: { text: string; values?: Record<string, string | number> }) {
  const { c } = useCopy()
  return <>{c(text, values)}</>
}
