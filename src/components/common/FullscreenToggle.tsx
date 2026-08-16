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
  const label = isFullscreen ? "To'liq ekrandan chiqish" : "To'liq ekran"

  if (!supported) return null

  return (
    <div className="pointer-events-none fixed bottom-24 right-[4.5rem] z-[120] print:hidden lg:bottom-6 lg:right-[5.25rem]">
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-pressed={isFullscreen}
        className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-200 bg-white text-blue-700 shadow-[0_10px_24px_rgba(37,99,235,0.16)] transition-colors hover:border-blue-300 hover:bg-blue-50"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200/80 bg-slate-950/95 px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-white opacity-0 shadow-lg transition-all duration-150 group-hover:-translate-y-0.5 group-hover:opacity-100 group-focus-visible:-translate-y-0.5 group-focus-visible:opacity-100 dark:border-white/10"
        >
          {label}
        </span>
        <span className="absolute inset-[5px] rounded-[14px] bg-gradient-to-br from-white/80 to-slate-50/35 opacity-80 dark:from-white/10 dark:to-transparent" />
        {isFullscreen ? (
          <Minimize2 className="relative h-[19px] w-[19px]" strokeWidth={1.9} />
        ) : (
          <Maximize2 className="relative h-[19px] w-[19px]" strokeWidth={1.9} />
        )}
      </button>
    </div>
  )
}
