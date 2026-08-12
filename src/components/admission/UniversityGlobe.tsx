import { useMemo, type CSSProperties } from 'react'
import { MapPin } from 'lucide-react'
import { WORLD_COUNTRIES } from '@/data/countries'
import { useAuthStore } from '@/store/authStore'
import { loadOnboardingProfile } from '@/utils/weeklyPlanner'

type GlobeMarkerStyle = CSSProperties & {
  '--globe-marker-x': string
  '--globe-marker-y': string
}

export default function UniversityGlobe() {
  const userId = useAuthStore((state) => state.user?.id)
  const profileCountry = useMemo(() => loadOnboardingProfile(userId)?.country?.trim(), [userId])
  const resolvedCountry = profileCountry || 'Your country'
  const profileCountryOption = useMemo(
    () => WORLD_COUNTRIES.find((country) => country.name.toLowerCase() === profileCountry?.toLowerCase()),
    [profileCountry],
  )
  const flag = profileCountryOption?.flag ?? '🌍'
  const markerStyle: GlobeMarkerStyle = {
    '--globe-marker-x': '50%',
    '--globe-marker-y': '27%',
  }

  return (
    <figure className="university-globe-card" aria-label={`University globe focused on ${resolvedCountry}`}>
      <div className="university-globe-visual">
        <img
          src="/assets/university-globe-glass-clean.png"
          alt=""
          className="university-globe-reference-image"
          draggable={false}
          decoding="async"
        />

        <span className="university-globe-user-marker" style={markerStyle} aria-hidden="true">
          <span className="university-globe-user-marker-ring" />
          <span className="university-globe-user-marker-pin"><MapPin /></span>
          <span className="university-globe-country-readout">
            <span aria-hidden="true">{flag}</span>
            <span>{resolvedCountry}</span>
          </span>
        </span>
      </div>
    </figure>
  )
}
