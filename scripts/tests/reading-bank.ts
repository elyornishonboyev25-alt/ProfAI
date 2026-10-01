import assert from 'node:assert/strict'
import { listKnownIeltsTests, resolveIeltsTestById } from '../../src/utils/ieltsTestCatalog'
import { buildReadingDayTest, buildReadingFullTest, buildReadingRoadmapFullTest } from '../../src/utils/generatedIeltsTests'
import { evaluateReadingAnswers } from '../../src/utils/ieltsUtils'
import { optionDisplayText, readingQuestionGroups } from '../../src/utils/readingPresentation'
import { formatUserAnswer } from '../../src/utils/readingReview'
import type { IELTSTest, Question, Section } from '../../src/types/ieltsTypes'

export const readingTests: IELTSTest[] = [
  ...listKnownIeltsTests().filter(test => test.module === 'Reading'),
  ...Array.from({ length: 30 }, (_, index) => buildReadingDayTest(index + 1)),
  ...Array.from({ length: 20 }, (_, index) => buildReadingFullTest(index + 1)),
  ...Array.from({ length: 12 }, (_, index) => buildReadingRoadmapFullTest(index + 1)!),
]

export function answerKey(test: IELTSTest) {
  return Object.fromEntries(test.sections.flatMap(section => section.questions.map(question => [
    question.id, Array.isArray(question.correctAnswer) ? question.correctAnswer : question.correctAnswer.split(/\s*[|;/]\s*/)[0],
  ])))
}

export function run() {
  const sections = new Map<string, Section>()
  let slots = 0
  for (const test of readingTests) {
    const keys = answerKey(test)
    const numbers = test.sections.flatMap(section => section.questions.flatMap(question => Array.from(
      { length: Array.isArray(question.correctAnswer) ? question.correctAnswer.length : 1 }, (_, offset) => question.number + offset,
    )))
    assert.equal(numbers.length, test.totalQuestions, `${test.id}: advertised question count`)
    assert.equal(new Set(numbers).size, numbers.length, `${test.id}: unique question numbers`)
    if (test.sections.length === 3) assert.deepEqual(numbers, Array.from({ length: test.totalQuestions }, (_, i) => i + 1), `${test.id}: consecutive full-test numbers`)
    const questions = test.sections.flatMap(section => section.questions)
    assert.equal(new Set(questions.map(q => q.id)).size, questions.length, `${test.id}: unique answer IDs`)
    assert.equal(evaluateReadingAnswers(test.sections, keys).summary.correctAnswers, test.totalQuestions, `${test.id}: entire key scores correctly`)
    assert.equal(evaluateReadingAnswers(test.sections, {}).summary.skippedAnswers, test.totalQuestions, `${test.id}: blank answers stay blank`)
    for (const section of test.sections) {
      sections.set(section.id, section)
      const passage = section.content ?? section.paragraphs?.map(p => p.content).join('\n') ?? ''
      assert.ok(passage.trim().split(/\s+/).length > 300, `${section.id}: full passage`)
      const groups = readingQuestionGroups(section.questions)
      assert.equal(groups.flat().length, section.questions.length)
      for (const group of groups) for (const question of group) {
        assert.ok(question.text.trim(), `${question.id}: nonempty question`)
        assert.ok(!/\[\.\.\.\]|�|Ã|Â|â€|\p{Script=Cyrillic}/u.test(question.text), `${question.id}: no import artifacts`)
        if (question.type === 'summary-completion' || question.type === 'note-completion') {
          assert.equal(question.text.match(/_+/g)?.length, 1, `${question.id}: exactly its own blank`)
          assert.ok(!/^Questions\s+\d/i.test(question.text), `${question.id}: no duplicated instructions`)
        }
        if (typeof question.correctAnswer === 'string') for (const accepted of question.correctAnswer.split(/\s*[|;/]\s*/)) {
          const report = evaluateReadingAnswers(test.sections, { ...keys, [question.id]: accepted })
          assert.equal(report.summary.correctAnswers, test.totalQuestions, `${question.id}: accepted variant ${accepted}`)
        }
        if (question.type.startsWith('matching') || question.type === 'multiple-choice' || question.type === 'five-true-statements') {
          assert.ok(question.options && question.options.length >= 2, `${question.id}: choices are available`)
        }
        for (const option of question.options ?? []) assert.ok(optionDisplayText(option), `${question.id}: option text survives rendering`)
      }
      assert.ok(!/�|Ã|Â|â€|\p{Script=Cyrillic}/u.test(passage), `${section.id}: passage encoding`)
    }
    slots += numbers.length
  }
  for (let volume = 23; volume <= 30; volume++) assert.ok(resolveIeltsTestById(`ielts-reading-full-vol${volume}`), `saved test ${volume} resolves`)
  assert.equal(optionDisplayText('Because the fantasy sequence is difficult to take.'), 'Because the fantasy sequence is difficult to take.')
  assert.equal(formatUserAnswer(0, ['They are longer than those of other birds.']), 'A. They are longer than those of other birds.')
  assert.equal(optionDisplayText('A. A popular theory'), 'A popular theory')
  assert.equal(optionDisplayText('iii. The importance of climate'), 'The importance of climate')
  assert.equal(optionDisplayText('A their ability', ['A their ability', 'B their share']), 'their ability')
  assert.equal(optionDisplayText('A popular theory', ['A popular theory', 'Because of the climate']), 'A popular theory', 'unlabelled article remains intact')

  const q = (extra: Partial<Question>): Question => ({ id: 'q', number: 1, type: 'summary-completion', text: 'A ______.', correctAnswer: 'physical health', instruction: 'Choose NO MORE THAN TWO WORDS.', ...extra })
  const score = (question: Question, answer: string | string[], others: Question[] = []) => evaluateReadingAnswers([{ id: 'reading', title: 'Reading', questions: [...others, question] }], { [question.id]: answer }).questionResults.find(r => r.questionId === question.id)!.score
  assert.equal(score(q({}), 'physical health'), 1)
  assert.equal(score(q({}), 'physical harm'), 0, 'same first word cannot earn a mark')
  assert.equal(score(q({}), 'physical'), 0, 'incomplete phrase cannot earn a mark')
  assert.equal(score(q({ correctAnswer: 'health', instruction: 'Write ONE WORD ONLY.' }), 'good health'), 0)
  assert.equal(score(q({ correctAnswer: 'office / offices' }), 'offices'), 1, 'accepted alternatives work')
  assert.equal(score(q({ id: 'q2', number: 2, instruction: undefined, correctAnswer: 'familiar path', groupTitle: undefined }), 'familiar path', [q({ correctAnswer: 'health', instruction: 'Choose ONE WORD ONLY.' })]), 0, 'word limit is inherited within the group')
  assert.equal(score(q({ type: 'five-true-statements', correctAnswer: ['B', 'D'], options: ['A. One', 'B. Two', 'C. Three', 'D. Four'] }), ['B', 'C']), 1, 'one correct selection earns one mark')
  console.log(`PASS: ${readingTests.length} Reading catalog/generated tests, ${sections.size} unique passages, ${slots} answer slots; prompt, numbering, key, review and grading checks`)
}
