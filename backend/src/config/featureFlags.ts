import { env } from './env.js'

export type ServerFeatureFlagName =
  | 'globalJourney'
  | 'guestDiagnostic'
  | 'universityDataPlatform'
  | 'applicationWorkspace'
  | 'automatedBilling'
  | 'growthRelease'

const globalJourney = env.GLOBAL_JOURNEY_ENABLED

/**
 * Server-side release gates. Child features can never be active while the
 * Global University Journey master gate is disabled.
 */
export const serverFeatureFlags: Readonly<Record<ServerFeatureFlagName, boolean>> = Object.freeze({
  globalJourney,
  guestDiagnostic: globalJourney && env.GUEST_DIAGNOSTIC_ENABLED,
  universityDataPlatform: globalJourney && env.UNIVERSITY_DATA_PLATFORM_ENABLED,
  applicationWorkspace: globalJourney && env.APPLICATION_WORKSPACE_ENABLED,
  automatedBilling: globalJourney && env.AUTOMATED_BILLING_ENABLED,
  growthRelease: globalJourney && env.GROWTH_RELEASE_ENABLED,
})

export function isServerFeatureEnabled(feature: ServerFeatureFlagName) {
  return serverFeatureFlags[feature]
}
