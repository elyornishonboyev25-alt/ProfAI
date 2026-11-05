// Curriculum source allocation, version 1. Never regenerate a published version
// in place: saved answers depend on these exact source IDs and positions.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const bank = JSON.parse(readFileSync('src/data/sat/questionBankMocks.json', 'utf8'))
const pool = [...bank.tests.flatMap(test => test.questions), ...bank.test9Math2]
const levels = ['Foundation', 'Medium', 'Advanced']
const skills = ['Words in Context', 'Text Structure and Purpose', 'Cross-Text Connections', 'Central Ideas and Details', 'Command of Evidence', 'Inferences', 'Boundaries', 'Form, Structure, and Sense', 'Transitions', 'Rhetorical Synthesis']
// Each row is an exact easy/medium/hard count for the corresponding skill.
const english = {
  first:  [[2,1,1],[1,1,0],[0,1,0],[1,1,0],[1,2,1],[0,1,1],[1,2,1],[1,1,1],[1,2,0],[0,1,1]],
  lower:  [[3,1,0],[1,1,0],[0,1,0],[1,1,0],[2,2,0],[1,1,0],[2,1,1],[2,0,1],[1,1,1],[1,1,0]],
  higher: [[0,1,3],[0,1,1],[0,0,1],[0,1,1],[1,1,2],[0,0,2],[0,2,2],[1,1,1],[1,1,1],[0,2,0]],
}
const domains = ['Algebra', 'Advanced Math', 'Problem-Solving and Data Analysis', 'Geometry and Trigonometry']
const math = {
  first:  [[3,4,1],[1,4,2],[1,2,1],[1,1,1]],
  lower:  [[4,3,0],[5,2,1],[1,1,1],[2,2,0]],
  higher: [[1,2,4],[0,3,5],[1,1,1],[0,2,2]],
}
// Five student-produced responses per Math module; the other 17 are MCQs.
const responses = {
  first: [[1,1,0],[0,1,1],[0,1,0],[0,0,0]],
  lower: [[1,1,0],[1,1,0],[1,0,0],[0,0,0]],
  higher:[[0,1,1],[0,1,2],[0,0,0],[0,0,0]],
}
const usage = new Map()
const digest = value => createHash('sha256').update(value).digest('hex')
const forms = []
for (let mockId = 1; mockId <= 40; mockId++) {
  const used = new Set()
  function module(section, stage) {
    const selected = [], skillCounts = new Map()
    function pick(filter) {
      const candidates = pool.filter(q => !used.has(q.sourceQuestionId) && filter(q))
      candidates.sort((a, b) =>
        (usage.get(a.sourceQuestionId) ?? 0) - (usage.get(b.sourceQuestionId) ?? 0)
        || (skillCounts.get(a.skill) ?? 0) - (skillCounts.get(b.skill) ?? 0)
        || digest(`${mockId}:${stage}:${a.sourceQuestionId}`).localeCompare(digest(`${mockId}:${stage}:${b.sourceQuestionId}`)))
      const q = candidates[0]
      if (!q) throw new Error(`Insufficient distinct questions for mock ${mockId}, ${section}, ${stage}`)
      used.add(q.sourceQuestionId)
      usage.set(q.sourceQuestionId, (usage.get(q.sourceQuestionId) ?? 0) + 1)
      skillCounts.set(q.skill, (skillCounts.get(q.skill) ?? 0) + 1)
      selected.push(q)
    }
    if (section === 'reading-writing') {
      english[stage].forEach((counts, skill) => counts.forEach((count, level) => {
        for (let i = 0; i < count; i++) pick(q => q.section === section && q.skill === skills[skill] && q.difficulty === levels[level])
      }))
    } else {
      math[stage].forEach((counts, domain) => counts.forEach((count, level) => {
        const sr = responses[stage][domain][level]
        for (let i = 0; i < count; i++) {
          const kind = i < sr ? 'student-response' : 'multiple-choice'
          pick(q => q.section === section && q.domain === domains[domain] && q.difficulty === levels[level] && q.kind === kind)
        }
      }))
    }
    selected.sort((a, b) => (section === 'reading-writing' ? skills.indexOf(a.skill) - skills.indexOf(b.skill) : 0)
      || levels.indexOf(a.difficulty) - levels.indexOf(b.difficulty)
      || a.sourceQuestionId.localeCompare(b.sourceQuestionId))
    return selected.map(q => q.sourceQuestionId)
  }
  forms.push({ mockId, rw1: module('reading-writing', 'first'), rw2Lower: module('reading-writing', 'lower'), rw2Higher: module('reading-writing', 'higher'),
    math1: module('math', 'first'), math2Lower: module('math', 'lower'), math2Higher: module('math', 'higher') })
}
const target = 'src/data/sat/adaptiveForms.v1.json'
if (existsSync(target) && JSON.stringify(JSON.parse(readFileSync(target, 'utf8')).forms) !== JSON.stringify(forms)) throw new Error('Published allocation differs; create a new version instead of replacing it.')
if (process.argv.includes('--write') && !existsSync(target)) writeFileSync(target, JSON.stringify({ version: '2026-11-02-v1', forms }, null, 2) + '\n')
else if (!existsSync(target)) throw new Error('Missing initial allocation; run with --write to author it.')
console.log(`40 balanced adaptive forms, ${usage.size} source questions, ${[...usage.values()].reduce((a,b)=>a+b,0)} placements, maximum source reuse ${Math.max(...usage.values())}.`)
