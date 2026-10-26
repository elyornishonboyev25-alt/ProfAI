import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const repository = 'elyornishonboyev25-alt/ProfAI'
const workflowPath = '.github/workflows/ci.yml'
const fullBuild = reason => ({ script: 'build', reason })

/** Only reuse a completed push workflow for the exact Railway source commit.
 * Missing metadata, private/API-limited access and unfinished CI all retain the
 * original validators and TypeScript build. No GitHub token is required. */
export async function selectReleaseBuild(env = process.env, request = fetch) {
  const sha = env.RAILWAY_GIT_COMMIT_SHA
  const branch = env.RAILWAY_GIT_BRANCH
  const source = `${env.RAILWAY_GIT_REPO_OWNER}/${env.RAILWAY_GIT_REPO_NAME}`
  if (!/^[a-f0-9]{40}$/i.test(sha ?? '') || !branch || source.toLowerCase() !== repository.toLowerCase()) {
    return fullBuild('Railway source metadata is unavailable or does not match this repository.')
  }
  const url = new URL(`https://api.github.com/repos/${repository}/actions/workflows/ci.yml/runs`)
  url.search = new URLSearchParams({ head_sha: sha, branch, event: 'push', per_page: '20' }).toString()
  try {
    const response = await request(url, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'ivygoo-release-build', 'X-GitHub-Api-Version': '2022-11-28' },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return fullBuild(`CI verification returned HTTP ${response.status}.`)
    const { workflow_runs: runs } = await response.json()
    if (!Array.isArray(runs) || !runs.length || runs.some(run => !Number.isSafeInteger(run?.id) || run.id <= 0)) {
      return fullBuild('No verifiable CI run was found.')
    }
    // An older successful run must not override a newer queued/failed run.
    const run = [...runs].sort((left, right) => right.id - left.id)[0]
    if (run.head_sha !== sha || run.head_branch !== branch || run.event !== 'push' || run.path !== workflowPath ||
      run.repository?.full_name?.toLowerCase() !== repository.toLowerCase() ||
      run.head_repository?.full_name?.toLowerCase() !== repository.toLowerCase() ||
      run.status !== 'completed' || run.conclusion !== 'success') {
      return fullBuild('The latest CI run has not successfully validated this exact source commit.')
    }
    return { script: 'build:bundle', reason: `CI run ${run.id} validated ${sha.slice(0, 12)}; reusing its content and TypeScript checks.` }
  } catch {
    return fullBuild('CI verification is temporarily unavailable.')
  }
}

export async function buildWebRelease(env = process.env, request = fetch, execute = spawnSync) {
  const plan = await selectReleaseBuild(env, request)
  console.log(`[release] ${plan.reason}`)
  console.log(`[release] Running npm run ${plan.script}`)
  // npm supplies its JS entrypoint. Running it with Node avoids platform shell
  // differences and keeps the selected command a fixed argument on Windows.
  if (!env.npm_execpath) throw new Error('Run this entrypoint with npm run build:release.')
  const result = execute(process.execPath, [env.npm_execpath, 'run', plan.script], { stdio: 'inherit', env })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${plan.script} failed${result.signal ? ` (${result.signal})` : ` with exit code ${result.status}`}.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  buildWebRelease().catch(error => { console.error(`[release] ${error.message}`); process.exitCode = 1 })
}
