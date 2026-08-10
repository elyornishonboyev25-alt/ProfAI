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
    <div className="pointer-events-none fixed bottom-4 right-20 z-[120] print:hidden sm:bottom-6 sm:right-[5.5rem]">
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-pressed={isFullscreen}
        className="group pointer-events-auto relative inline-flex h-12 w-12 items-center justify-center rounded-[18px] border border-slate-200/80 bg-white/85 text-slate-600 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.55)] ring-1 ring-white/80 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:bg-white hover:text-rose-600 hover:shadow-[0_14px_34px_-14px_rgba(225,29,72,0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 active:translate-y-0 dark:border-white/10 dark:bg-slate-900/85 dark:text-slate-300 dark:ring-white/10 dark:hover:border-rose-400/40 dark:hover:bg-slate-900 dark:hover:text-rose-400 dark:focus-visible:ring-offset-slate-950"
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
