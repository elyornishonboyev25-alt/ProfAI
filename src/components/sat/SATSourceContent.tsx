import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import './SATSourceContent.css'

/** Source documents are content, never executable markup. */
export default function SATSourceContent({ html, className = '' }: { html: string; className?: string }) {
  const safeHTML = useMemo(() => DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, mathMl: true },
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'iframe', 'a'],
    FORBID_ATTR: ['style', 'id', 'name'],
  }), [html])
  return <div className={`sat-source-content ${className}`} dangerouslySetInnerHTML={{ __html: safeHTML }} />
}
