import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'

const repositoryRoot = process.cwd()
const sourceRoot = join(repositoryRoot, 'src')
const publicRoot = join(repositoryRoot, 'public')
const supportedSourceExtensions = new Set(['.json', '.ts', '.tsx'])
const assetPattern = /\/sat\/[^'"`\s)\]}]+\.(?:jpe?g|png|svg|webp)/gi

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(absolutePath)
    return supportedSourceExtensions.has(extname(entry.name)) ? [absolutePath] : []
  })
}

function hasExpectedSignature(filePath, asset) {
  const contents = readFileSync(filePath)
  const extension = extname(asset).toLowerCase()

  if (extension === '.svg') {
    return /^(?:<\?xml[^>]*>\s*)?<svg\b/i.test(contents.toString('utf8').trimStart())
  }
  if (extension === '.png') return contents.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
  if (extension === '.jpg' || extension === '.jpeg') return contents.subarray(0, 3).toString('hex') === 'ffd8ff'
  if (extension === '.webp') {
    return contents.subarray(0, 4).toString('ascii') === 'RIFF'
      && contents.subarray(8, 12).toString('ascii') === 'WEBP'
  }
  return false
}

const assets = new Set()
for (const filePath of sourceFiles(sourceRoot)) {
  const source = readFileSync(filePath, 'utf8')
  for (const match of source.matchAll(assetPattern)) assets.add(match[0])
}

// Test 5 keeps an original-paper screenshot for every question. Those paths are
// assembled at runtime, so include them explicitly in the integrity check.
const novemberQuestionSource = readFileSync(
  join(sourceRoot, 'data/sat/november2025IntlQuestions.ts'),
  'utf8',
)
for (const match of novemberQuestionSource.matchAll(/\b(?:mc|sr)\('([^']+)',\s*(\d+)/g)) {
  assets.add(`/sat/november-2025-intl/questions/${match[1]}-${Number(match[2])}.jpg`)
}

const failures = []
for (const asset of [...assets].sort()) {
  const filePath = join(publicRoot, asset.slice(1))
  try {
    if (!statSync(filePath).isFile()) {
      failures.push(`${asset}: not a file`)
    } else if (!hasExpectedSignature(filePath, asset)) {
      failures.push(`${asset}: contents do not match the file extension`)
    }
  } catch {
    failures.push(`${asset}: file is missing`)
  }
}

if (failures.length) {
  console.error(`SAT asset validation failed (${failures.length}):`)
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exitCode = 1
} else {
  console.log(`Validated ${assets.size} SAT image assets.`)
}
