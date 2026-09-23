import { useEffect, useState } from 'react'
import { fetchAccount } from '@/lib/profileApi'
import { useAuthStore } from '@/store/authStore'

export type AdmissionScores = {
  satTotal: number | null
  ieltsOverall: number | null
}

const EMPTY_SCORES: AdmissionScores = { satTotal: null, ieltsOverall: null }

export function useAdmissionScores() {
  const userId = useAuthStore(state => state.user?.id)
  const [scores, setScores] = useState<AdmissionScores>(EMPTY_SCORES)
  const [country, setCountry] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setScores(EMPTY_SCORES)
    setCountry(null)
    if (!userId) { setLoading(false); return }
    setLoading(true)
    fetchAccount()
      .then(({ profile }) => {
        if (!active) return
        setScores({
          satTotal: typeof profile.currentSatScore === 'number' && Number.isFinite(profile.currentSatScore) ? profile.currentSatScore : null,
          ieltsOverall: typeof profile.currentIeltsScore === 'number' && Number.isFinite(profile.currentIeltsScore) ? profile.currentIeltsScore : null,
        })
        setCountry(profile.country?.trim() || null)
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [userId])

  return { scores, country, loading }
}
