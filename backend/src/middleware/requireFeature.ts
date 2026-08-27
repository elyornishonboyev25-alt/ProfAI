import type { RequestHandler } from 'express'
import { isServerFeatureEnabled, type ServerFeatureFlagName } from '../config/featureFlags.js'

/**
 * Returns 404 while a staged feature is disabled so unfinished APIs are not
 * discoverable as partially available production capabilities.
 */
export function requireFeature(feature: ServerFeatureFlagName): RequestHandler {
  return (_req, res, next) => {
    if (!isServerFeatureEnabled(feature)) {
      return res.status(404).json({
        error: {
          code: 'FEATURE_NOT_AVAILABLE',
          message: 'This feature is not available.',
        },
      })
    }

    return next()
  }
}
