import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdmissionUniversity from '../../src/pages/AdmissionUniversity'
import assert from 'node:assert/strict'
import { universities } from '../../src/data/admission/universities'
import { matchesUniversityIeltsFilter, universityIeltsLabel } from '../../src/data/admission/ieltsDirectory'
import { estimateRequirements } from '../../src/data/admission/match'

export function run() {
  const michigan = universities.find((uni) => uni.name === 'University of Michigan-Ann Arbor')!
  assert.ok(michigan.ieltsDirectory)
  assert.equal(michigan.ieltsDirectory.scores.find((entry) => entry.programme === 'Undergraduate Admissions')?.minimum, 7)
  assert.ok(michigan.ieltsDirectory.scores.find((entry) => entry.programme === 'Undergraduate Admissions')?.detail?.includes('6.5'))
  assert.equal(universityIeltsLabel(michigan), '6.0–7.5 · by programme')
  assert.equal(estimateRequirements(michigan).ielts, null, 'Programme directory scores must not become a bachelor admission benchmark')
  assert.equal(matchesUniversityIeltsFilter(michigan, 'up-to-6.5'), true)
  assert.equal(matchesUniversityIeltsFilter(michigan, '7.5-plus'), true)
  assert.equal(matchesUniversityIeltsFilter(michigan, 'no-cutoff'), false)
  assert.equal(matchesUniversityIeltsFilter(michigan, 'unverified'), false)

  const unknown = { ...michigan, ieltsDirectory: undefined, admission: undefined }
  assert.equal(matchesUniversityIeltsFilter(unknown, 'no-cutoff'), false)
  assert.equal(matchesUniversityIeltsFilter(unknown, 'unverified'), true)
  assert.equal(matchesUniversityIeltsFilter(unknown, 'up-to-7.0'), false)
  assert.equal(universityIeltsLabel(unknown), 'Requirement not verified')

  const stanford = universities.find((uni) => uni.id === 'stanford-university')!
  assert.equal(matchesUniversityIeltsFilter(stanford, 'no-cutoff'), true)
  assert.equal(stanford.ieltsDirectory, undefined, 'Hand-verified policies keep priority over indicative directory entries')
  const mit = universities.find((uni) => uni.id === 'mit')!
  assert.equal(estimateRequirements(mit).ielts, 7)

  const detailHtml = renderToStaticMarkup(
    <MemoryRouter initialEntries={[`/admission/universities/${michigan.slug}`]}>
      <Routes><Route path="/admission/universities/:slug" element={<AdmissionUniversity />} /></Routes>
    </MemoryRouter>,
  )
  assert.ok(detailHtml.includes('IELTS · Programme requirements'))
  assert.ok(detailHtml.includes('Undergraduate Admissions'))
  assert.ok(detailHtml.includes('Each component: 6.5 or higher.'))
  assert.ok(detailHtml.includes('IELTS Academic · 7.0'))
  assert.ok(detailHtml.includes('indicative'))
  assert.ok(detailHtml.includes(michigan.ieltsDirectory!.sourceUrl))
  assert.ok(detailHtml.includes('Cost of Living'))
  assert.ok(detailHtml.includes('has not yet been verified'))

  const covered = universities.filter((uni) => uni.ieltsDirectory)
  assert.ok(covered.length > 500, 'Directory coverage extends well beyond top universities')
  for (const uni of covered) {
    assert.ok(uni.ieltsDirectory!.sourceUrl.startsWith('https://ielts.org/receiving-organisations/'))
    assert.ok(uni.sources?.some((source) => source.url === uni.ieltsDirectory!.sourceUrl))
    for (const entry of uni.ieltsDirectory!.scores) {
      assert.ok(entry.programme)
      assert.ok(entry.minimum === null || (entry.minimum > 0 && entry.minimum <= 9 && entry.minimum * 2 % 1 === 0))
    }
    if (uni.website) assert.match(uni.website, /^https?:\/\//)
  }
  const arizona = universities.find((uni) => uni.name === 'The University of Arizona')!
  assert.equal(arizona.costOfLiving?.amount, 23370)
  assert.equal(arizona.costOfLiving?.period, 'academic-year')
  const liverpool = universities.find((uni) => uni.name === 'University of Liverpool')!
  assert.equal(liverpool.costOfLiving?.period, 'month')
  assert.equal(liverpool.costOfLiving?.maxAmount, 1350)
  assert.equal(new Set(universities.map((uni) => uni.slug)).size, universities.length)
  console.log(`University requirements passed: ${covered.length} directory profiles, ${covered.filter((uni) => uni.ieltsDirectory!.scores.some((entry) => entry.minimum !== null)).length} with numeric scores.`)
}
