import { listKnownIeltsTests, resolveIeltsTestById } from '../../src/utils/ieltsTestCatalog'
import { getIeltsFullTestCatalog, getIeltsPassageCatalog, isAvailableIeltsTrackTest } from '../../src/utils/ieltsTrackCatalog'
import { getIeltsSpeakingDayCatalog, getIeltsSpeakingFullMockCatalog } from '../../src/utils/ieltsSpeakingCatalog'
import { getWritingDayCatalog, getWritingFullTestCatalog } from '../../src/data/writingTestData'
import { getSATReviewTests, satSourceModules } from '../../src/features/sat/catalog'
import type { StudyTest, StudyQuestion } from '../../backend/src/services/novaStudy'
import type { Section } from '../../src/types/ieltsTypes'

function listeningPresentation(section: Section, number: number) {
  const group = section.groups?.find(group => { const range = group.range.match(/(\d+)\D+(\d+)/); return range && number >= Number(range[1]) && number <= Number(range[2]) })
  const block = group?.blocks.find(block => block.kind === 'image' || block.kind === 'diagram')
  return { instruction: group?.instruction, visual: block?.kind === 'image' ? { asset: block.src, alt: block.alt, listening: true } : block?.kind === 'diagram' ? { diagram: block.diagram } : undefined }
}

function sourceRange(location?: string): StudyQuestion['sourceRange'] {
  const match = location?.match(/(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})/)
  if (!match) return
  const start = Number(match[1]) * 60 + Number(match[2]), end = Number(match[3]) * 60 + Number(match[4])
  if (start >= end || end - start > 180 || Number(match[2]) > 59 || Number(match[4]) > 59) return
  return { start, end, provenance: 'catalog_cue', reference: location! }
}

export function buildNovaCatalog(): StudyTest[] {
  const tests: StudyTest[] = [], seen = new Set<string>()
  const add = (test: StudyTest) => { const key = `${test.skill}:${test.id}`; if (!seen.has(key)) { seen.add(key); tests.push(test) } }
  const papers = [...listKnownIeltsTests()]
  for (const skill of ['reading', 'listening'] as const) for (const entry of [...getIeltsFullTestCatalog(skill), ...getIeltsPassageCatalog(skill)]) {
    if (!isAvailableIeltsTrackTest(skill, entry.testId)) continue
    const paper = resolveIeltsTestById(entry.testId); if (paper) papers.push(paper)
  }
  for (const paper of papers) {
    if (paper.module !== 'Reading' && paper.module !== 'Listening') continue
    const skill = paper.module === 'Reading' ? 'reading' : 'listening'
    add({ id: paper.id, title: paper.title, skill, route: `/test/${skill}/${encodeURIComponent(paper.id)}`, questions: paper.sections.flatMap(section => section.questions.map(q => ({
      ...listeningPresentation(section, q.number),
      id: q.id, number: q.number, text: q.text, type: q.type, sectionId: section.id, options: q.options,
      answer: q.correctAnswer, explanation: q.explanation, evidence: q.answerEvidence,
      passage: section.content ?? section.paragraphs?.map(p => `${p.label}\n${p.content}`).join('\n\n'),
      audioUrl: paper.continuousAudioUrl ?? section.audioUrl, transcript: section.audioTranscript,
      // A continuous track's duration cannot be inferred from one part.
      duration: paper.continuousAudioUrl ? undefined : section.duration,
      sourceRange: paper.continuousAudioUrl ? sourceRange(q.location) : undefined,
    }))) })
  }
  for (const day of getIeltsSpeakingDayCatalog().filter(d => d.available)) {
    const c = day.content
    const prompts = c.kind === 'part1' ? c.topic.questions.map(q => q.q) : c.kind === 'part3' ? c.theme.questions.map(q => q.q) : [`${c.card.title}\n${c.card.bullets.join('\n')}`]
    add({ id: day.id, title: day.title, skill: 'speaking', route: `/ielts/speaking/test/${encodeURIComponent(day.id)}`, questions: prompts.map((text, i) => ({ id: `${day.id}-${i + 1}`, number: i + 1, text, type: `part${day.part}`, sectionId: `part${day.part}`, answer: null })) })
  }
  for (const mock of getIeltsSpeakingFullMockCatalog().filter(d => d.available)) {
    const prompts = [...mock.parts.part1.questions.map(q => ({text: q.q, part: 1})), {text: `${mock.parts.part2.title}\n${mock.parts.part2.bullets.join('\n')}`, part: 2}, ...mock.parts.part3.questions.map(q => ({text: q.q, part: 3}))]
    add({ id: mock.id, title: mock.title, skill: 'speaking', route: `/ielts/speaking/test/${encodeURIComponent(mock.id)}`, questions: prompts.map((q, i) => ({ id: `${mock.id}-${i + 1}`, number: i + 1, text: q.text, type: `part${q.part}`, sectionId: `part${q.part}`, answer: null })) })
  }
  for (const task of [...getWritingDayCatalog(), ...getWritingFullTestCatalog().flatMap(test => test.tasks)]) add({ id: task.id, title: task.title, skill: 'writing', route: `/ielts/writing/test/${encodeURIComponent(task.id)}`, questions: [{ id: task.id, number: 1, text: task.prompt, type: task.taskType, sectionId: task.taskType, answer: null, visual: task.visual ?? task.chart ?? task.diagram }] })
  for (const test of getSATReviewTests()) for (const skill of ['sat-math', 'sat-rw'] as const) {
    const questions = satSourceModules(test).flatMap(module => module.questions).filter(q => q.section === (skill === 'sat-math' ? 'math' : 'reading-writing'))
    const unique = new Map<string, StudyQuestion>()
    for (const q of questions) unique.set(q.id, { id: q.id, number: q.number, text: q.prompt, type: q.kind, sectionId: q.moduleId, options: q.choices, answer: q.acceptedAnswers ?? q.correctAnswer, explanation: q.explanation, passage: q.sourceContent?.context, visual: q.visual ?? (q.asset ? { asset: q.asset, alt: `Source question ${q.number}` } : undefined) })
    if (unique.size) add({ id: test.id, title: test.title, skill, route: `/mock/sat/${test.mockId}?section=${skill === 'sat-math' ? 'math' : 'reading-writing'}`, questions: [...unique.values()] })
  }
  return tests
}
