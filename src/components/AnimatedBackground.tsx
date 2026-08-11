import { memo } from 'react'

export const AnimatedBackground = memo(function AnimatedBackground() {
  return (
    <div
      className="workspace-background fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div className="ambient-mesh" />
      <div className="ambient-noise" />
      <div className="ambient-sheen absolute inset-y-0 left-1/2 hidden w-[28rem] -translate-x-1/2 bg-[linear-gradient(120deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.52)_44%,rgba(255,255,255,0)_100%)] md:block" />

      <div className="ambient-orb ambient-orb-left" />
      <div className="ambient-orb ambient-orb-right" />

      <div className="glossy-orb ambient-glossy-one left-[3%] top-[24%] h-16 w-16 md:h-20 md:w-20" />
      <div className="glossy-orb glossy-orb-soft ambient-glossy-two right-[2%] top-[30%] h-24 w-24 md:h-32 md:w-32" />
      <div className="glossy-orb ambient-glossy-three bottom-[10%] left-[15%] h-10 w-10 md:h-12 md:w-12" />
      <div className="glossy-orb glossy-orb-soft ambient-glossy-four bottom-[12%] right-[18%] h-14 w-14 md:h-16 md:w-16" />
      <div className="glossy-orb ambient-glossy-five left-[38%] top-[62%] hidden h-9 w-9 opacity-45 md:block" />
      <div className="glossy-orb ambient-glossy-six right-[34%] top-[16%] hidden h-10 w-10 opacity-35 lg:block" />
      <div className="ambient-orbit ambient-orbit-one hidden md:block" />
      <div className="ambient-orbit ambient-orbit-two hidden lg:block" />

      <div className="ambient-grid" />
    </div>
  )
})
