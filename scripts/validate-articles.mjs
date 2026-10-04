import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'

const bundle = await build({ entryPoints: ['src/data/articles/index.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const { articles, articleCategories, coverPalettes, getArticleBySlug, getArticleById, articleWordCount, ARTICLE_LIBRARY_TARGET } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const curated = articles.filter(article => article.source?.publisher === 'Frontiers for Young Minds')
assert.equal(curated.length, 200, 'The curated addition contains exactly 200 articles')
assert.ok(ARTICLE_LIBRARY_TARGET >= articles.length)
const normalize = text => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const unique = (values, label) => assert.equal(new Set(values).size, values.length, `Duplicate ${label}`)
unique(articles.map(a => a.id), 'IDs')
unique(articles.map(a => a.slug), 'slugs')
unique(articles.map(a => normalize(a.title)), 'titles')
unique(articles.map(a => createHash('sha256').update(normalize(a.blocks.map(b => b.text).join(' '))).digest('hex')), 'bodies')
unique(curated.map(a => a.source.url), 'source URLs')
unique(articles.flatMap(a => a.vocabulary.map(v => v.id)), 'vocabulary IDs')
for (const article of articles) {
  assert.equal(getArticleBySlug(article.slug), article)
  assert.equal(getArticleById(article.id), article)
  assert.match(article.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  assert.ok(articleCategories.includes(article.category), article.title)
  assert.ok(coverPalettes[article.cover.theme], article.title)
  assert.ok(article.teaser.trim() && article.tags.length > 0)
  for (const block of article.blocks) {
    assert.ok(['lead', 'paragraph', 'heading', 'quote'].includes(block.type))
    assert.ok(block.text.trim(), `${article.title}: empty block`)
    assert.doesNotMatch(block.text, /<\/?(?:p|script|div|iframe)\b/i)
  }
}
const adultTopics = /\b(sexual|suicide|sperm|menstrual|cocaine|cannabis|opioid|murder|terrorism|warfare|racial|racism|abuse)\b/i
for (const article of curated) {
  const body = article.blocks.map(b => b.text).join(' ')
  assert.ok(articleWordCount(article) >= 400 && articleWordCount(article) <= 1850, article.title)
  assert.equal(article.readMinutes, Math.ceil(articleWordCount(article) / 180), article.title)
  assert.equal(article.blocks[0].type, 'lead', article.title)
  assert.doesNotMatch(body, adultTopics, article.title)
  assert.doesNotMatch(body, /\b(?:figure|table)\s*\d/i, `${article.title}: missing illustration reference`)
  assert.ok(article.vocabulary.length >= 3, `${article.title}: useful vocabulary set`)
  unique(article.vocabulary.map(v => normalize(v.term)), `${article.title} vocabulary terms`)
  for (const entry of article.vocabulary) {
    assert.ok(entry.term.trim() && entry.definition.trim() && entry.example.trim())
    assert.ok(body.includes(entry.example), `${article.title}: example comes from the article`)
    assert.ok(entry.example.toLowerCase().includes(entry.term.toLowerCase()), `${article.title}: example illustrates ${entry.term}`)
  }
  assert.match(article.source.url, /^https:\/\/kids\.frontiersin\.org\/articles\/10\.3389\/frym\./)
  assert.ok(article.source.authors.length > 0 && article.source.authors.every(a => a.trim()))
  assert.ok(normalize(article.source.citation).includes(normalize(article.title)), `${article.title}: original citation`)
  assert.match(article.source.copyright, /Copyright ©/)
  assert.equal(article.source.license, 'CC BY 4.0')
  assert.equal(article.source.licenseUrl, 'https://creativecommons.org/licenses/by/4.0/')
  assert.ok(article.source.adaptationNote.trim())
}
console.log(`PASS: ${articles.length} unique articles; 200 licensed additions, complete text, source credits, vocabulary and existing cover themes.`)
