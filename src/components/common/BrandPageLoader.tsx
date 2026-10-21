import { useEffect, useState } from 'react'
import '@/styles/page-loading.css'
/** Fast requests never paint a loading screen. All page loaders share this mark. */
export default function BrandPageLoader({
  label = 'Loading',
  compact = false,
}: {
  label?: string
  compact?: boolean
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 300)
    return () => window.clearTimeout(timer)
  }, [])
  return (
    <div
      className="profai-page-loading"
      style={{ minHeight: compact ? '50vh' : '56vh' }}
      role="status"
      aria-label={label}
      aria-busy="true"
    >
      {visible && <img src="/logo.svg" alt="" width="48" height="48" />}
    </div>
  )
}
