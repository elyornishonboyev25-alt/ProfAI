import { Maximize2, Minimize2 } from 'lucide-react'
import { useFullscreen } from '@/hooks/useFullscreen'

/**
 * Site-wide fullscreen control — fully manual.
 *  - The site NEVER enters fullscreen on its own; it only happens when the user
 *    clicks this floating button.
 *  - Clicking again while in fullscreen exits it. The app never auto-exits.
 */
export default function FullscreenToggle() {
  const { isFullscreen, supported, toggle } = useFullscreen()

  if (!supported) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-[5.25rem] z-[120] print:hidden sm:bottom-6 sm:right-[5.75rem]">
      <button
        type="button"
        onClick={toggle}
        title={isFullscreen ? "To'liq ekrandan chiqish" : "To'liq ekran rejimi"}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        aria-pressed={isFullscreen}
        className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-200/80 bg-white/90 text-red-600 shadow-[0_12px_28px_rgba(220,38,38,0.18)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white hover:text-red-700"
      >
        {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
      </button>
    </div>
  )
}
