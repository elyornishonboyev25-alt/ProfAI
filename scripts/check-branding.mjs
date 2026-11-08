import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

// Persisted keys, CSS classes, API identifiers and redirect domains keep their
// original names. Standalone brand names in copy must use IvyGoo.
const legacyBrand = /(?<![\w./:@-])(?:prof\s?ai|smart[ -]?test[ -]?pro)(?![\w./:@-])/i
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(directory, entry.name)
  return entry.isDirectory() ? walk(file) : [file]
})
const files = [
  ...walk('src'), ...walk('backend/src'), ...walk('public'),
  'index.html', 'vite.config.ts',
].filter(file => /\.(?:[cm]?js|tsx?|json|html|svg|webmanifest|xml|txt)$/.test(file))
const failures = []

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8')
  if (!legacyBrand.test(content)) continue
  const report = (value, position) => {
    if (!legacyBrand.test(value)) return
    const line = content.slice(0, position).split('\n').length
    failures.push(`${file}:${line}: ${value.trim().slice(0, 180)}`)
  }
  if (/\.(?:[cm]?js|tsx?|json)$/.test(file)) {
    const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true)
    const visit = node => {
      if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node) || ts.isJsxText(node)) {
        report(node.text, node.getStart(source))
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  } else {
    // Ignore comments while retaining line numbers for static metadata/assets.
    const visible = content.replace(/<!--[\s\S]*?-->/g, comment => comment.replace(/[^\n]/g, ' '))
    let position = 0
    for (const line of visible.split('\n')) {
      report(line, position)
      position += line.length + 1
    }
  }
}

if (failures.length) {
  console.error(`Use IvyGoo in public copy and sharing metadata:\n${failures.join('\n')}`)
  process.exitCode = 1
} else {
  console.log(`Branding checked: ${files.length} source and public files contain no retired brand names in copy.`)
}
