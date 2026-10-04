import UiText from '@/components/common/UiText'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, Lightbulb, Target } from 'lucide-react'
import { getCompletedLessons, subscribeLessonProgress, toggleLessonCompleted } from '@/utils/admissionProgressStore'
import LucideIcon from '@/components/admission/LucideIcon'
import { getAdjacentLessons, getLessonBySlug, getLessonsByPhase, getPhaseById } from '@/data/admission'
import type { LessonBlock } from '@/data/admission'
import './admission-lessons.css'

function Block({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case 'lead':
      return <p className="lesson-lead">{block.text}</p>
    case 'heading':
      return <h2>{block.text}</h2>
    case 'paragraph':
      return <p>{block.text}</p>
    case 'list':
      return <ul className="lesson-checklist">{block.items.map((item, index) => <li key={index}><CheckCircle2 size={17} aria-hidden="true" /><span>{item}</span></li>)}</ul>
    case 'tip':
      return <aside className="lesson-callout lesson-tip"><Lightbulb size={21} aria-hidden="true" /><p>{block.text}</p></aside>
    case 'callout':
      return <aside className="lesson-callout"><div><h3>{block.title}</h3><p>{block.text}</p></div></aside>
    default:
      return null
  }
}

export default function AdmissionLesson() {
  const { slug } = useParams<{ slug: string }>()
  const lesson = slug ? getLessonBySlug(slug) : undefined
  const phase = lesson ? getPhaseById(lesson.phaseId) : undefined
  const { prev, next } = slug ? getAdjacentLessons(slug) : {}
  const [completedSlugs, setCompletedSlugs] = useState(() => getCompletedLessons())

  useEffect(() => subscribeLessonProgress(() => setCompletedSlugs(getCompletedLessons())), [])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }) }, [slug])

  const handleToggleComplete = () => {
    if (!slug) return
    const nowCompleted = toggleLessonCompleted(slug)
    setCompletedSlugs((previous) => {
      const updated = new Set(previous)
      if (nowCompleted) updated.add(slug)
      else updated.delete(slug)
      return updated
    })
  }

  if (!lesson || !phase) {
    return (
      <main className="workspace-page admission-lessons-page">
        <div className="lesson-not-found lessons-glass">
          <BookOpen size={32} aria-hidden="true" />
          <h1><UiText text="Lesson not found" /></h1>
          <p><UiText text="This lesson doesn’t exist or hasn’t been added yet." /></p>
          <Link to="/admission/lessons" className="route-back-button"><ArrowLeft size={16} aria-hidden="true" /><UiText text="Back to lessons" /></Link>
        </div>
      </main>
    )
  }

  const completed = completedSlugs.has(lesson.slug)
  const phaseLessons = getLessonsByPhase(phase.id)
  const phaseDone = phaseLessons.filter((item) => completedSlugs.has(item.slug)).length

  return (
    <main className="workspace-page admission-lessons-page lesson-reader-page">
      <div className="lessons-shell">
        <Link to="/admission/lessons" className="route-back-button lessons-back"><ArrowLeft size={16} aria-hidden="true" /><UiText text="All lessons" /></Link>

        <header className="lesson-reader-hero lessons-glass">
          <div className="lesson-reader-hero-copy">
            <span className="lessons-eyebrow"><LucideIcon name={phase.icon} className="h-4 w-4" /><UiText text="Phase" /> {phase.order} <span>·</span> {phase.title}</span>
            <h1>{lesson.title}</h1>
            <p>{lesson.summary}</p>
            <div className="lesson-reader-meta">
              <span><Clock3 size={15} aria-hidden="true" />{lesson.durationMin} <UiText text="min read" /></span>
              <span className="lessons-level">{lesson.level}</span>
              {completed ? <span className="lesson-completed-label"><CheckCircle2 size={15} aria-hidden="true" /><UiText text="Completed" /></span> : null}
            </div>
          </div>
          <div className="lesson-reader-emblem" aria-hidden="true"><LucideIcon name={lesson.icon} className="h-10 w-10" /><span>{String(lesson.order).padStart(2, '0')}</span></div>
        </header>

        <div className="lesson-reader-layout">
          <div className="lesson-reader-main">
            <article className="lesson-article">
              {lesson.blocks.map((block, index) => <Block key={index} block={block} />)}

              <section className="lesson-takeaways">
                <h2><CheckCircle2 size={21} aria-hidden="true" /><UiText text="Key takeaways" /></h2>
                <ul>{lesson.keyTakeaways.map((point, index) => <li key={index}>{point}</li>)}</ul>
              </section>

              <section className="lesson-callout lesson-action">
                <Target size={23} aria-hidden="true" />
                <div><h2><UiText text="Your action step" /></h2><p>{lesson.actionStep}</p></div>
              </section>
            </article>

            <section className={`lesson-completion lessons-glass${completed ? ' is-done' : ''}`} aria-labelledby="lesson-completion-title">
              <span className="lessons-card-icon" aria-hidden="true"><CheckCircle2 size={23} /></span>
              <div className="lesson-completion-copy" aria-live="polite">
                <h2 id="lesson-completion-title">{completed ? 'Lesson completed' : 'Finished this lesson?'}</h2>
                <p>{completed ? 'It now counts toward your roadmap progress.' : 'Mark it to track your roadmap progress.'}</p>
              </div>
              <button type="button" onClick={handleToggleComplete} aria-pressed={completed} className="lesson-completion-button">
                {completed ? <CheckCircle2 size={16} aria-hidden="true" /> : null}{completed ? 'Completed ✓' : 'Mark as complete'}
              </button>
            </section>

            <nav className="lesson-adjacent-navigation" aria-label="Lesson navigation">
              {prev ? <Link to={`/admission/lessons/${prev.slug}`} className="lesson-adjacent-link lessons-glass"><ArrowLeft size={19} aria-hidden="true" /><span><small><UiText text="Previous" /></small><strong>{prev.title}</strong></span></Link> : <span className="lesson-nav-spacer" />}
              {next ? <Link to={`/admission/lessons/${next.slug}`} className="lesson-adjacent-link lessons-glass is-next"><span><small><UiText text="Next" /></small><strong>{next.title}</strong></span><ArrowRight size={19} aria-hidden="true" /></Link> : <Link to="/admission/universities" className="lesson-adjacent-link lessons-glass is-next"><span><small><UiText text="Finished!" /></small><strong><UiText text="Explore universities →" /></strong></span><ArrowRight size={19} aria-hidden="true" /></Link>}
            </nav>
          </div>

          <aside className="lesson-reader-sidebar lessons-glass">
            <div className="lesson-sidebar-heading">
              <span className="lessons-eyebrow"><UiText text="Phase" /> {phase.order}</span>
              <h2>{phase.title}</h2>
              <p>{phaseDone}/{phaseLessons.length} <UiText text="Lessons completed" /></p>
              <div className="lessons-progress-track" aria-hidden="true"><span style={{ width: `${(phaseDone / phaseLessons.length) * 100}%` }} /></div>
            </div>
            <nav aria-label={phase.title} className="lesson-sidebar-links">
              {phaseLessons.map((item) => <Link key={item.id} to={`/admission/lessons/${item.slug}`} aria-current={item.slug === slug ? 'page' : undefined}>
                <span className="lesson-sidebar-number">{completedSlugs.has(item.slug) ? <CheckCircle2 size={16} aria-hidden="true" /> : String(item.order).padStart(2, '0')}</span>
                <span>{item.title}</span>
              </Link>)}
            </nav>
            <Link to="/admission/lessons" className="lesson-sidebar-back"><BookOpen size={16} aria-hidden="true" /><UiText text="All lessons" /><ArrowRight size={15} aria-hidden="true" /></Link>
          </aside>
        </div>
      </div>
    </main>
  )
}
