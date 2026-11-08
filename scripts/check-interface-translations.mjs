import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = path.resolve('src')
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(directory, entry.name)
  return entry.isDirectory() ? walk(file) : [file]
})

function objectKeys(file, variable) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
  const keys = new Set()
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === variable) {
      const initializer = ts.isAsExpression(node.initializer) ? node.initializer.expression : node.initializer
      if (initializer && ts.isObjectLiteralExpression(initializer)) {
        for (const property of initializer.properties) {
          if (ts.isPropertyAssignment(property)) keys.add(ts.isStringLiteral(property.name) ? property.name.text : property.name.getText(source))
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return keys
}

const russian = new Set([
  ...Object.keys(JSON.parse(fs.readFileSync(path.join(root, 'i18n/interface-completion.json'), 'utf8'))),
  ...Object.keys(JSON.parse(fs.readFileSync(path.join(root, 'i18n/ru-ui.json'), 'utf8'))),
  ...Object.keys(JSON.parse(fs.readFileSync(path.join(root, 'i18n/ru-completion.json'), 'utf8'))),
  ...objectKeys(path.join(root, 'i18n/interface.ts'), 'russianInterface'),
  ...objectKeys(path.join(root, 'i18n/ru-additions.ts'), 'russianAdditions'),
])
const uzbek = new Set([
  ...Object.keys(JSON.parse(fs.readFileSync(path.join(root, 'i18n/interface-completion.json'), 'utf8'))),
  ...Object.keys(JSON.parse(fs.readFileSync(path.join(root, 'i18n/uz-ui.json'), 'utf8'))),
  ...objectKeys(path.join(root, 'i18n/uz-completion.ts'), 'uzbekCompletion'),
])

const used = new Set()
// Inspect literal branches too: a button often changes its label after an action.
function literalChoices(node) {
  if (!node) return []
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [node.text]
  if (ts.isConditionalExpression(node)) return [...literalChoices(node.whenTrue), ...literalChoices(node.whenFalse)]
  return []
}
for (const file of walk(root).filter(file => /\.tsx?$/.test(file) && !file.includes(`${path.sep}i18n${path.sep}`))) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ['c', 'uiCopy'].includes(node.expression.text)) {
      for (const key of literalChoices(node.arguments[0])) used.add(key)
    }
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(source) === 'UiText') {
      const attribute = node.attributes.properties.find(property => ts.isJsxAttribute(property) && property.name.text === 'text')
      const value = attribute?.initializer
      if (value && ts.isStringLiteral(value)) used.add(value.text)
      if (value && ts.isJsxExpression(value)) for (const key of literalChoices(value.expression)) used.add(key)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
}

const keys = [...used].filter(key => !/^[a-z]+\.[a-zA-Z]+$/.test(key))
const missingRussian = keys.filter(key => !russian.has(key))
const missingUzbek = keys.filter(key => !uzbek.has(key))
const ownerKeys = objectKeys(path.join(root, 'i18n/owner.ts'), 'labels')
const ownerFile = path.join(root, 'pages/OwnerDashboard.tsx')
const ownerSource = ts.createSourceFile(ownerFile, fs.readFileSync(ownerFile, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const missingOwner = new Set()
function visitOwner(node) {
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't' && ts.isStringLiteral(node.arguments[0]) && !ownerKeys.has(node.arguments[0].text)) missingOwner.add(node.arguments[0].text)
  ts.forEachChild(node, visitOwner)
}
visitOwner(ownerSource)
const completion = JSON.parse(fs.readFileSync(path.join(root, 'i18n/interface-completion.json'), 'utf8'))
const invalidEntries = []
const placeholders = text => [...text.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)].map(match => match[1]).sort().join('|')
for (const [key, translations] of Object.entries(completion)) {
  for (const language of ['en', 'uz', 'ru']) {
    const value = language === 'en' ? key : translations[language]
    if (typeof value !== 'string' || !value.trim()) invalidEntries.push(`${key}: empty ${language} translation`)
    else if (placeholders(value) !== placeholders(key)) invalidEntries.push(`${key}: mismatched ${language} interpolation parameters`)
    else if (/\uFFFD/.test(value)) invalidEntries.push(`${key}: invalid ${language} text encoding`)
  }
}
if (missingRussian.length || missingUzbek.length || missingOwner.size || invalidEntries.length) {
  if (missingRussian.length) console.error(`Russian translations missing:\n${missingRussian.join('\n')}`)
  if (missingUzbek.length) console.error(`Uzbek translations missing:\n${missingUzbek.join('\n')}`)
  if (missingOwner.size) console.error(`Owner dashboard translations missing:\n${[...missingOwner].join('\n')}`)
  if (invalidEntries.length) console.error(`Invalid translations:\n${invalidEntries.join('\n')}`)
  process.exitCode = 1
} else {
  console.log(`Interface translations checked: ${keys.length} English source strings have Russian and Uzbek entries; ${Object.keys(completion).length} reviewed entries have valid interpolation parameters.`)
}
