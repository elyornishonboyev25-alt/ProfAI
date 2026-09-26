import { clearBuildBypassParam } from './staleBuildRecovery'

/** Deployments take effect on the next navigation/reload. Do not interrupt an
 * open page just because its entry bundle differs from the latest deployment.
 * Missing lazy chunks still use the bounded stale-build recovery in main.tsx.
 */
export function startBuildFreshnessMonitor() {
  clearBuildBypassParam()
}
