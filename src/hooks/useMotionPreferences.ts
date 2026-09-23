import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

type NavigatorWithDeviceMemory = Navigator & {
  deviceMemory?: number
}

function detectDeviceMotionCapabilities() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isLowPowerDevice: false, isCoarsePointer: false }
  }

  const nav = navigator as NavigatorWithDeviceMemory
  const deviceMemory = nav.deviceMemory ?? 8
  const cpuCores = navigator.hardwareConcurrency ?? 8
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches
  const compactViewport = window.matchMedia('(max-width: 900px)').matches

  return {
    isCoarsePointer,
    isLowPowerDevice: deviceMemory <= 4 || cpuCores <= 4 || (isCoarsePointer && compactViewport),
  }
}

export function useMotionPreferences() {
  const prefersReducedMotion = useReducedMotion()
  const [reducedEffects, setReducedEffects] = useState(() => typeof document !== 'undefined' && document.documentElement.dataset.effects === 'reduced')
  useEffect(() => {
    const update = () => setReducedEffects(document.documentElement.dataset.effects === 'reduced')
    window.addEventListener('profai:effects-changed', update)
    return () => window.removeEventListener('profai:effects-changed', update)
  }, [])
  const [{ isLowPowerDevice, isCoarsePointer }] = useState(detectDeviceMotionCapabilities)

  const reducedMotion = Boolean(prefersReducedMotion) || reducedEffects
  const minimalMotion = reducedMotion || isLowPowerDevice
  const allowHoverMotion = !minimalMotion && !isCoarsePointer

  return {
    reducedMotion,
    isLowPowerDevice,
    minimalMotion,
    allowHoverMotion,
  }
}
