import { useLayoutEffect } from 'react'

const activeTests = new Set<symbol>()

export function hasActiveTest() {
  return activeTests.size > 0
}

/** Deploy recovery must never replace a document containing an active attempt. */
export function useActiveTest(active: boolean) {
  useLayoutEffect(() => {
    if (!active) return
    const token = Symbol('active-test')
    activeTests.add(token)
    return () => { activeTests.delete(token) }
  }, [active])
}
