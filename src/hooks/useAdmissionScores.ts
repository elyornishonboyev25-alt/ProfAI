import { useEffect, useState } from 'react'
import { fetchAccount } from '@/lib/profileApi'

export type AdmissionScores = {
  satTotal: number | null
  ieltsOverall: number | null
}

const EMPTY_SCORES: AdmissionScores = { satTotal: null, ieltsOverall: null }

export function useAdmissionScores() {
  const [scores, setScores] = useState<AdmissionScores>(EMPTY_SCORES)
  const [country, setCountry] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchAccount()
      .then(({ profile }) => {
        if (!active) return
        setScores({ satTotal: profile.currentSatScore, ieltsOverall: profile.currentIeltsScore })
        setCountry(profile.country?.trim() || null)
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  return { scores, country, loading }
}
