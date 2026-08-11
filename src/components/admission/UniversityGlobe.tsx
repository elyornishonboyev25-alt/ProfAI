import { useMemo, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { WORLD_COUNTRIES } from '@/data/countries'
import { useVisitorLocation, getCountryFlag } from '@/hooks/useVisitorLocation'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { useAuthStore } from '@/store/authStore'
import { loadOnboardingProfile } from '@/utils/weeklyPlanner'

type GlobeMarkerStyle = CSSProperties & {
  '--globe-marker-x': string
  '--globe-marker-y': string
}

function projectToGlobe(latitude?: number, longitude?: number) {
  if (latitude === undefined || longitude === undefined) return { x: 64, y: 44 }

  // The reference artwork is centred on Europe/Africa. Keep edge cases inside
  // the visible glass sphere while preserving the user's rough world position.
  return {
    x: Math.max(17, Math.min(85, 51 + longitude * 0.27)),
    y: Math.max(24, Math.min(70, 54 - latitude * 0.24)),
  }
}

export default function UniversityGlobe() {
  const userId = useAuthStore((state) => state.user?.id)
  const { location, isLocating } = useVisitorLocation()
  const { minimalMotion } = useMotionPreferences()

  const profileCountry = useMemo(() => loadOnboardingProfile(userId)?.country?.trim(), [userId])
  const resolvedCountry = location?.country || profileCountry || 'Your country'
  const profileCountryOption = useMemo(
    () => WORLD_COUNTRIES.find((country) => country.name.toLowerCase() === profileCountry?.toLowerCase()),
    [profileCountry],
  )
  const flag = location?.countryCode
    ? getCountryFlag(location.countryCode)
    : profileCountryOption?.flag ?? '🌍'
  const marker = projectToGlobe(location?.latitude, location?.longitude)
  const markerStyle: GlobeMarkerStyle = {
    '--globe-marker-x': `${marker.x}%`,
    '--globe-marker-y': `${marker.y}%`,
  }

  return (
    <motion.figure
      className="university-globe-card"
      initial={{ opacity: 0, scale: 0.92, x: minimalMotion ? 0 : -28 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: minimalMotion ? 0.01 : 0.72, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`Interactive university globe focused on ${resolvedCountry}`}
    >
      <motion.div
        className="university-globe-spin-stage"
        initial={minimalMotion ? false : { rotateY: -360, scale: 0.84 }}
        animate={{ rotateY: 0, scale: 1 }}
        transition={{
          rotateY: { duration: minimalMotion ? 0.01 : 1.75, delay: 0.08, ease: [0.45, 0, 0.16, 1] },
          scale: { duration: minimalMotion ? 0.01 : 1.15, delay: 0.08, ease: [0.16, 1, 0.3, 1] },
        }}
      >
        <img
          src="/assets/university-globe-glass.png"
          alt=""
          className="university-globe-reference-image"
          draggable={false}
          decoding="async"
        />

        <motion.span
          className="university-globe-user-marker"
          style={markerStyle}
          initial={{ opacity: 0, scale: 0.3, y: -16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: minimalMotion ? 0.01 : 0.45, delay: minimalMotion ? 0 : 1.48, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
        >
          <span className="university-globe-user-marker-ring" />
          <span className="university-globe-user-marker-pin">
            <MapPin />
          </span>
        </motion.span>

        <motion.div
          className="university-globe-country-readout"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: minimalMotion ? 0.01 : 0.5, delay: minimalMotion ? 0 : 1.35 }}
        >
          <span aria-hidden="true">{flag}</span>
          <span>{isLocating && !profileCountry ? 'Locating you…' : resolvedCountry}</span>
        </motion.div>
      </motion.div>
    </motion.figure>
  )
}
