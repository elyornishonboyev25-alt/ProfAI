import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { useActiveTest } from '@/hooks/useActiveTest'
import { useEffect, useMemo, useRef, useState } from 'react'
import PracticeProgressSummary from '@/components/sat/PracticeProgressSummary'
import PracticeQuestion from '@/components/sat/PracticeQuestion'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, Bookmark, Calculator, Check, CheckCircle2, Flame, Flag, Lightbulb, RotateCcw, Search, X } from 'lucide-react'
import SATSectionTabs from '@/components/sat/SATSectionTabs'
import { HARD_QUESTIONS, PRACTICE_QUESTIONS, practiceLevel, hardProgressKey, loadHardProgress, type HardProgress, type PracticeLevel } from '@/features/sat/hardQuestions'
import { isSATAnswerCorrect, type SATSection } from '@/features/sat/practiceTest4'
import { accountStorageFor } from '@/utils/accountStorage'
import { useAuthStore } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import './SATHardQuestions.css'
import '@/components/sat/PracticeQuestion.css'
import './SATHardQuestionsSilver.css'

type Filter = 'all' | 'unanswered' | 'incorrect' | 'bookmarked' | 'flagged'
export default function SATHardQuestions() {
  const userId = useAuthStore(state => state.user?.id) ?? 'guest'
  return <HardWorkspace key={userId} userId={userId} />
}
function HardWorkspace({ userId }: { userId: string }) {
  const { c: uiCopy } = useCopy()
  const [params, setParams] = useSearchParams()
  const section: SATSection = params.get('section') === 'math' ? 'math' : 'reading-writing'
  const requestedLevel = params.get('level')
  const level: PracticeLevel | 'all' = requestedLevel === 'easy' || requestedLevel === 'medium' || requestedLevel === 'all' ? requestedLevel : 'hard'
  const rows = useMemo(() => level === 'hard' ? HARD_QUESTIONS[section] : PRACTICE_QUESTIONS[section].filter(row => level === 'all' || practiceLevel(row.question.difficulty) === level), [section, level])
  const active = rows.find(row => row.key === params.get('q'))
  useActiveTest(Boolean(active))
  const [progress, setProgress] = useState<HardProgress>(() => loadHardProgress(userId))
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [topic, setTopic] = useState('')
  const [error, setError] = useState('')
  const [jumpOpen, setJumpOpen] = useState(false)
  const [jumpNumber, setJumpNumber] = useState('')
  const jumpInput = useRef<HTMLInputElement>(null)
  const jumpTrigger = useRef<HTMLElement | null>(null)
  const subjectHeading = useRef<HTMLHeadingElement>(null)
  const math = section === 'math'
  const practicing = Boolean(active)
  useEffect(() => {
    if (!practicing) return
    const previous = useAiAssistantStore.getState().isExamModeActive
    const overflow = document.body.style.overflow
    useAiAssistantStore.getState().setExamModeActive(true)
    document.body.style.overflow = 'hidden'
    return () => {
      useAiAssistantStore.getState().setExamModeActive(previous)
      document.body.style.overflow = overflow
    }
  }, [practicing])
  const checkedCount = rows.filter(row => progress[row.key]?.checked).length
  const correctCount = rows.filter(row => progress[row.key]?.checked && isSATAnswerCorrect(row.question, progress[row.key].answer)).length
  const visible = rows.filter(row => {
    const state = progress[row.key]
    return (!topic || row.question.skill === topic) && (!search.trim() || `${row.question.domain} ${row.question.skill} ${rows.indexOf(row) + 1}`.toLowerCase().includes(search.trim().toLowerCase())) &&
      (filter === 'all' || filter === 'unanswered' && !state?.checked || filter === 'incorrect' && state?.checked && !isSATAnswerCorrect(row.question, state.answer) || filter === 'bookmarked' && state?.bookmarked || filter === 'flagged' && state?.flagged)
  })
  const groups = useMemo(() => [...new Set(visible.map(row => row.question.skill))].map(skill => ({
    skill, rows: visible.filter(row => row.question.skill === skill),
  })), [visible])
  useEffect(() => {
    if (!active) subjectHeading.current?.focus()
  }, [active?.key, section, level])
  useEffect(() => {
    const jump = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault(); jumpTrigger.current = document.activeElement as HTMLElement; setJumpOpen(true)
      }
      if (event.key === 'Escape') setJumpOpen(false)
    }
    window.addEventListener('keydown', jump)
    return () => window.removeEventListener('keydown', jump)
  }, [])
  useEffect(() => {
    if (!jumpOpen) return
    jumpInput.current?.focus()
    return () => jumpTrigger.current?.focus()
  }, [jumpOpen])
  // Write through a ref so a timer checkpoint and an answer in the same event
  // cannot overwrite each other, including during unmount and hard reload.
  const progressRef = useRef(progress)
  const update = (key: string, patch: Partial<HardProgress[string]>) => {
    const previous = progressRef.current
    const next = { ...previous, [key]: { ...(previous[key] ?? { answer: '', checked: false, bookmarked: false }), ...patch } }
    progressRef.current = next
    setProgress(next)
    try { accountStorageFor(userId).setItem(hardProgressKey, JSON.stringify(next)); setError('') }
    catch { setError('Progress could not be saved. Keep this page open and free up browser storage before leaving.') }
  }
  const openQuestion = (key?: string) => setParams({ section, ...(level !== 'hard' ? { level } : {}), ...(key ? { q: key } : {}) })
  const index = active ? rows.indexOf(active) : -1
  const sameSkill = active ? rows.filter(row => row.key !== active.key && row.question.skill === active.question.skill) : []
  const similar = sameSkill.find(row => !progress[row.key]?.checked) ?? sameSkill[0]

  return <main className={`workspace-page hard-page ${active ? 'hard-page-active' : ''}`} aria-label={active ? 'SAT Hard Questions practice' : undefined}>
    <div className="hard-shell">
      {!active && <><SATSectionTabs section="hard-questions" />
      <header className="hard-hero">
        <div className="hard-hero-copy"><span className="hard-eyebrow"><Flame size={16} /> <UiText text={"SAT CHALLENGE COLLECTION"} /></span>
          <h1>{level === 'hard' ? <UiText text={"Hard Questions"} /> : <UiText text={"Practice Questions"} />}</h1>
          <p><UiText text={"Go deeper, one question at a time. Advanced questions from the Ivygoo test catalog, grouped by topic. Check your answer, then explore the solution when you are ready."} /></p>
          <div className="hard-hero-tags"><span><CheckCircle2 size={15} /> <UiText text={"Check at your own pace"} /></span><span><UiText text={"Untimed practice"} /></span><span><UiText text={"Progress autosaves"} /></span></div>
        </div>
        <div className="hard-subjects" aria-label={uiCopy("Choose question subject")}>
          {(['reading-writing', 'math'] as const).map(subject => {
            const done = (level === 'hard' ? HARD_QUESTIONS[subject] : PRACTICE_QUESTIONS[subject].filter(row => level === 'all' || practiceLevel(row.question.difficulty) === level)).filter(row => progress[row.key]?.checked).length
            const count = level === 'hard' ? HARD_QUESTIONS[subject].length : PRACTICE_QUESTIONS[subject].filter(row => level === 'all' || practiceLevel(row.question.difficulty) === level).length
            return <button key={subject} type="button" aria-pressed={section === subject} className={`hard-subject ${section === subject ? 'active' : ''}`} onClick={() => {
              setParams({ section: subject, ...(level !== 'hard' ? { level } : {}) }); setSearch(''); setFilter('all'); setTopic('')
            }}><span className="hard-subject-top">{subject === 'math' ? <Calculator size={22} /> : <Lightbulb size={22} />}<span>{count} <UiText text={"questions"} /></span></span>
              <strong>{subject === 'math' ? <UiText text={"Math"} /> : <UiText text={"English"} />}</strong><small>{subject === 'math' ? <UiText text={"Algebra, data, geometry & more"} /> : <UiText text={"Reading & Writing"} />}</small>
              <span className="hard-subject-meter"><span style={{ width: `${count ? done / count * 100 : 0}%` }} /></span><span className="hard-subject-bottom">{done} / {count} <UiText text={"completed"} />{section === subject ? <Check size={16} /> : <ArrowRight size={16} />}</span>
            </button>
          })}
        </div>
      </header></>}
      {error && <p className="hard-error" role="alert">{error}</p>}
      <section id="sat-test-panel" aria-labelledby={active ? undefined : 'sat-tab-hard-questions'} role={active ? undefined : 'tabpanel'} className="hard-workspace">
        {!active && <div className="hard-section-heading"><div><span className="hard-eyebrow">{math ? 'MATH' : <UiText text={"ENGLISH"} />} · {level === 'all' ? <UiText text={"ALL LEVELS"} /> : level.toUpperCase()}</span><h2 ref={subjectHeading} tabIndex={-1}>{math ? <UiText text={"Math"} /> : <UiText text={"English"} />} <UiText text={"challenge map"} /></h2></div>
          <div className="hard-stats"><span><strong>{checkedCount}</strong> <UiText text={"completed"} /></span><span><strong>{correctCount}</strong> <UiText text={"correct"} /></span><span><strong>{checkedCount ? Math.round(correctCount / checkedCount * 100) : 0}%</strong> <UiText text={"accuracy"} /></span></div>
        </div>}
        {active ? <PracticeQuestion key={active.key} row={active} index={index} total={rows.length} state={progress[active.key]} onUpdate={patch => update(active.key, patch)}
          onBack={() => openQuestion()}
          onNext={index < rows.length - 1 ? () => openQuestion(rows[index + 1].key) : undefined}
          onSimilar={similar ? () => openQuestion(similar.key) : undefined} /> : <>

          <PracticeProgressSummary rows={PRACTICE_QUESTIONS[section]} progress={progress} />
          <div className="practice-level-tools"><div className="practice-level-filters" role="group" aria-label={uiCopy("Question difficulty")}>{(['all','easy','medium','hard'] as const).map(value => <button type="button" key={value} className={`practice-level is-${value}`} aria-pressed={level === value} onClick={() => { setParams({ section, level: value }); setFilter('all'); setSearch(''); setTopic('') }}>{value === 'all' ? <UiText text={"All levels"} /> : value}</button>)}</div><button type="button" className="practice-jump" onClick={event => { jumpTrigger.current = event.currentTarget; setJumpOpen(true) }}><Search size={15} /><UiText text={"Jump to question"} /> <kbd>Ctrl Shift F</kbd></button></div>
          <div className="hard-map-tools"><div className="hard-filters" aria-label={uiCopy("Filter questions")}>{(['all', 'unanswered', 'incorrect', 'bookmarked', 'flagged'] as const).map(value => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{({ all: 'All questions', unanswered: 'To solve', incorrect: 'To review', bookmarked: 'Bookmarked', flagged: 'Marked for review' })[value]}</button>)}</div><label className="practice-topic-select"><span><UiText text={"Topic"} /></span><select aria-label={uiCopy("Filter by topic")} value={topic} onChange={event => setTopic(event.target.value)}><option value=""><UiText text={"All topics"} /></option>{[...new Set(rows.map(row => row.question.skill))].sort().map(skill => <option key={skill} value={skill}><UiText text={skill} /></option>)}</select></label><label className="hard-search"><Search size={17} /><input type="search" placeholder={uiCopy("Find a topic or question…")} aria-label={uiCopy("Search hard questions")} value={search} onChange={event => setSearch(event.target.value)} /></label></div>
          <div className="hard-legend"><span><i /> <UiText text={"To solve"} /></span><span><i className="correct" /> <UiText text={"Correct"} /></span><span><i className="incorrect" /> <UiText text={"To review"} /></span><span><Bookmark size={13} /> <UiText text={"Bookmarked"} /></span></div>
          {groups.length ? groups.map(group => <section className="hard-topic" key={group.skill}><header><div><small>{group.rows[0].question.domain}</small><h3><UiText text={group.skill} /></h3></div><span>{group.rows.filter(row => progress[row.key]?.checked).length} / {group.rows.length} <UiText text={"completed"} />{filter !== 'all' || search ? ' in view' : ''}</span></header>
            <div className="hard-question-grid">{group.rows.map(row => {
              const saved = progress[row.key]
              const status = saved?.checked ? isSATAnswerCorrect(row.question, saved.answer) ? 'correct' : 'incorrect' : 'unanswered'
              const number = rows.indexOf(row) + 1
              return <button key={row.key} type="button" className={`hard-tile is-${practiceLevel(row.question.difficulty)} ${status}`} title={`${practiceLevel(row.question.difficulty)} - ${row.question.skill}`} aria-label={uiCopy("Question {{value1}}, {{value2}}, {{value3}}, {{value4}}{{value5}}", { value1: String(number), value2: String(row.question.skill), value3: String(practiceLevel(row.question.difficulty)), value4: String(status), value5: String(saved?.bookmarked ? ', bookmarked' : '') })} onClick={() => openQuestion(row.key)}><span>{String(number).padStart(2, '0')}</span>{saved?.flagged && <Flag className="practice-tile-flag" size={11} />}{saved?.bookmarked && <Bookmark className="hard-tile-bookmark" size={12} fill="currentColor" />}{saved?.checked && <span className="hard-tile-status">{status === 'correct' ? <Check size={12} /> : <RotateCcw size={12} />}</span>}</button>
            })}</div>
          </section>) : <div className="hard-empty"><Search size={28} /><h3><UiText text={"No matching questions"} /></h3><p><UiText text={"Try another topic or filter."} /></p><button type="button" onClick={() => { setFilter('all'); setSearch(''); setTopic('') }}><UiText text={"Show all questions"} /></button></div>}
          {checkedCount === rows.length && rows.length > 0 && <div className="hard-complete"><CheckCircle2 size={24} /><div><strong><UiText text={"All"} /> {rows.length} {math ? <UiText text={"Math"} /> : <UiText text={"English"} />} <UiText text={"questions completed!"} /></strong><p><UiText text={"Review your mistakes or switch subjects to keep improving."} /></p></div></div>}
        </>}
      </section>
    </div>
    {jumpOpen && <div className="flow-dialog-backdrop" onClick={() => setJumpOpen(false)}><section className="flow-dialog" role="dialog" aria-modal="true" aria-labelledby="practice-jump-title" onClick={event => event.stopPropagation()} onKeyDown={event => {
      if (event.key !== 'Tab') return
      const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input'))
      const first = focusable[0]; const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }}><button className="flow-dialog-close" type="button" aria-label={uiCopy("Close question search")} onClick={() => setJumpOpen(false)}><X size={17} /></button><h2 id="practice-jump-title"><UiText text={"Jump to a question"} /></h2><p><UiText text={"Enter a number from 1 to"} /> {rows.length} <UiText text={"in this collection."} /></p><form onSubmit={event => { event.preventDefault(); const number = Number(jumpNumber); if (Number.isInteger(number) && number >= 1 && number <= rows.length) { openQuestion(rows[number - 1].key); setJumpOpen(false); setJumpNumber('') } }}><input ref={jumpInput} className="practice-jump-input" aria-label={uiCopy("Question number")} type="number" required min={1} max={rows.length} value={jumpNumber} onChange={event => setJumpNumber(event.target.value)} /><div className="flow-dialog-actions"><button type="submit" className="flow-button is-primary"><UiText text={"Open question"} /> <ArrowRight size={16} /></button></div></form></section></div>}

  </main>
}
