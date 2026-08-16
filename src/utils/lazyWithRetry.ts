import { lazy, type ComponentType } from 'react'
import { recoverFromStaleBuild } from '@/utils/staleBuildRecovery'

type LazyModule<T extends ComponentType<any>> = { default: T }

export function lazyWithRetry<T extends ComponentType<any>>(importer: () => Promise<LazyModule<T>>) {
  return lazy(async () => {
    try {
      const loaded = await importer()
      if (!loaded?.default) throw new TypeError('Loaded module has no default export')
      return loaded
    } catch (error) {
      const isRecovering = await recoverFromStaleBuild(error)
      if (isRecovering) return new Promise<LazyModule<T>>(() => undefined)
      throw error
    }
  })
}
