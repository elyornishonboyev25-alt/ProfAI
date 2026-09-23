import { useCopy } from '@/i18n/interface'

/** A text-only locale subscriber, safe inside existing semantic HTML. */
export default function UiText({ text }: { text: string }) {
  const { c } = useCopy()
  return <>{c(text)}</>
}
