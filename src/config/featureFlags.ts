type PublicFeatureFlagName =
  | 'globalJourney'
  | 'guestDiagnostic'
  | 'universityDataPlatform'
  | 'applicationWorkspace'
  | 'automatedBilling'
  | 'growthRelease'

function enabled(value: string | undefined) {
  return value?.trim().toLowerCase() === 'true'
}

const globalJourney = enabled(import.meta.env.VITE_GLOBAL_JOURNEY_ENABLED)

/**
 * Public release gates for the Global University Journey rollout.
 *
 * Every child feature also depends on the master flag. This prevents an
 * accidentally enabled child variable from exposing unfinished work in
 * production while still allowing staging to turn phases on independently.
 */
export const publicFeatureFlags: Readonly<Record<PublicFeatureFlagName, boolean>> = Object.freeze({
  globalJourney,
  guestDiagnostic: globalJourney && enabled(import.meta.env.VITE_GUEST_DIAGNOSTIC_ENABLED),
  universityDataPlatform: globalJourney && enabled(import.meta.env.VITE_UNIVERSITY_DATA_PLATFORM_ENABLED),
  applicationWorkspace: globalJourney && enabled(import.meta.env.VITE_APPLICATION_WORKSPACE_ENABLED),
  automatedBilling: globalJourney && enabled(import.meta.env.VITE_AUTOMATED_BILLING_ENABLED),
  growthRelease: globalJourney && enabled(import.meta.env.VITE_GROWTH_RELEASE_ENABLED),
})

export function isPublicFeatureEnabled(feature: PublicFeatureFlagName) {
  return publicFeatureFlags[feature]
}

export type { PublicFeatureFlagName }
