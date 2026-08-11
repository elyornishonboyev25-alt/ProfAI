/**
 * Page-local glossy sphere field. Static layers retain the branded depth
 * without keeping the compositor busy while the page is idle.
 */
export default function PremiumSphereField() {
  return (
    <div className="premium-sphere-field pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <span className="glossy-orb absolute -left-5 top-[18%] h-16 w-16 sm:left-3 sm:h-20 sm:w-20" />
      <span className="glossy-orb glossy-orb-soft absolute -right-8 top-[12%] h-28 w-28 sm:right-2 sm:h-36 sm:w-36" />
      <span className="glossy-orb absolute left-[7%] top-[64%] h-10 w-10 sm:h-12 sm:w-12" />
      <span className="glossy-orb glossy-orb-soft absolute bottom-[8%] right-[10%] h-14 w-14" />
    </div>
  )
}
