import { useCallback, useEffect, useRef, useState } from 'react'

export function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const requestId = useRef(0)

  const refetch = useCallback(async () => {
    const currentRequest = ++requestId.current
    setLoading(true)
    setError(null)

    try {
      const next = await fetcher()
      if (currentRequest === requestId.current) setData(next)
    } catch (fetchError) {
      if (currentRequest === requestId.current) setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch data')
    } finally {
      if (currentRequest === requestId.current) setLoading(false)
    }
  }, deps)

  useEffect(() => {
    setData(null)
    void refetch()
    return () => { requestId.current += 1 }
  }, [refetch])

  return {
    data,
    loading,
    error,
    refetch,
  }
}

