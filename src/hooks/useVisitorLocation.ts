import { useCallback, useEffect, useState } from 'react'

export type LocationPrecision = 'network' | 'device'

export interface VisitorLocation {
  country: string
  countryCode: string
  city?: string
  latitude: number
  longitude: number
  precision: LocationPrecision
}

interface IpWhoResponse {
  success?: boolean
  country?: string
  country_code?: string
  city?: string
  latitude?: number
  longitude?: number
}

interface ReverseGeocodeResponse {
  countryName?: string
  countryCode?: string
  city?: string
  locality?: string
}

function isCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

function countryFlag(countryCode: string) {
  if (!/^[A-Z]{2}$/.test(countryCode)) return '🌍'
  return String.fromCodePoint(...countryCode.split('').map((letter) => 127397 + letter.charCodeAt(0)))
}

export function getCountryFlag(countryCode: string) {
  return countryFlag(countryCode.toUpperCase())
}

export function useVisitorLocation() {
  const [location, setLocation] = useState<VisitorLocation | null>(null)
  const [isLocating, setIsLocating] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 6500)

    async function locateByNetwork() {
      try {
        const response = await fetch(
          'https://ipwho.is/?fields=success,country,country_code,city,latitude,longitude',
          { signal: controller.signal },
        )
        if (!response.ok) throw new Error('Location request failed')

        const data = (await response.json()) as IpWhoResponse
        if (
          data.success !== true ||
          !data.country ||
          !data.country_code ||
          !isCoordinate(data.latitude, -90, 90) ||
          !isCoordinate(data.longitude, -180, 180)
        ) {
          throw new Error('Location response was incomplete')
        }

        if (!active) return
        setLocation({
          country: data.country,
          countryCode: data.country_code.toUpperCase(),
          city: data.city || undefined,
          latitude: data.latitude,
          longitude: data.longitude,
          precision: 'network',
        })
      } catch {
        if (!active) return
        setLocationError('Automatic location was unavailable. Use the target button for precise location.')
      } finally {
        window.clearTimeout(timer)
        if (active) setIsLocating(false)
      }
    }

    void locateByNetwork()
    return () => {
      active = false
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [])

  const requestPreciseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Precise location is not supported by this browser.')
      return
    }

    setIsLocating(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        let country = location?.country ?? 'Your location'
        let countryCode = location?.countryCode ?? ''
        let city = location?.city

        try {
          const params = new URLSearchParams({
            latitude: String(coords.latitude),
            longitude: String(coords.longitude),
            localityLanguage: 'en',
          })
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`)
          if (response.ok) {
            const data = (await response.json()) as ReverseGeocodeResponse
            country = data.countryName || country
            countryCode = data.countryCode?.toUpperCase() || countryCode
            city = data.city || data.locality || city
          }
        } catch {
          // The GPS coordinate is still useful even if reverse geocoding is unavailable.
        }

        setLocation({
          country,
          countryCode,
          city,
          latitude: coords.latitude,
          longitude: coords.longitude,
          precision: 'device',
        })
        setIsLocating(false)
      },
      (error) => {
        setLocationError(error.code === error.PERMISSION_DENIED ? 'Location permission was not granted.' : 'Precise location could not be read.')
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 300_000 },
    )
  }, [location])

  return { location, isLocating, locationError, requestPreciseLocation }
}
