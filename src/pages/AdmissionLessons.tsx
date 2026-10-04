import UiText from '@/components/common/UiText'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, Clock3, GraduationCap } from 'lucide-react'
import { ProgressRing } from '@/components/fx'
import LucideIcon from '@/components/admission/LucideIcon'
import { getLessons, getLessonsByPhase, lessonPhases, LESSON_COUNT, totalLessonMinutes } from '@/data/admission'
import { getCompletedLessons, subscribeLessonProgress } from '@/utils/admissionProgressStore'
import './admission-lessons.css'

export default function AdmissionLessons() {
  const [completed, setCompleted] = useState<Set<string>>(() => getCompletedLessons())
  useEffect(() => subscribeLessonProgress(() => setCompleted(getCompletedLessons())), [])

  const orderedLessons = getLessons()
  const completedCount = orderedLessons.filter((lesson) => completed.has(lesson.slug)).length
  const progress = Math.round((completedCount / LESSON_COUNT) * 100)
  const nextLesson = orderedLessons.find((lesson) => !completed.has(lesson.slug))

  return (
    <main className="workspace-page admission-lessons-page">
      <div className="lessons-shell">
        <Link to="/admission" className="route-back-button lessons-back">
          <ArrowLeft size={16} aria-hidden="true" /><UiText text="Back to Applications" />
        </Link>

        <header className="lessons-hero lessons-glass">
          <div className="lessons-hero-copy">
            <span className="lessons-eyebrow"><GraduationCap size={16} aria-hidden="true" /><UiText text="Study-Abroad Track" /></span>
            <h1><UiText text="Study Abroad" /> <span><UiText text="Lessons" /></span></h1>
            <p>{LESSON_COUNT}<UiText text="-lesson roadmap that walks you through the entire journey — five phases, from your first decision to thriving on campus. Follow it in order, or jump straight to the phase you need next." /></p>
            <div className="lessons-hero-facts">
              <span><BookOpen size={16} aria-hidden="true" /><strong>{LESSON_COUNT}</strong> <UiText text="Lessons" /></span>
              <span><Clock3 size={16} aria-hidden="true" /><strong>≈ {Math.round(totalLessonMinutes / 60)}h</strong> <UiText text="Study time" /></span>
              <span><UiText text="Self-paced" /></span>
            </div>
          </div>
          <div className="lessons-progress-panel" role="status" aria-live="polite">
            <ProgressRing value={progress} size={112} stroke={8} from="#e34b59" to="#b72336" trackColor="rgba(150,165,187,.22)">
              <strong className="lessons-progress-value">{progress}%</strong>
            </ProgressRing>
            <div>
              <span className="lessons-eyebrow"><UiText text="Overall progress" /></span>
              <p className="lessons-progress-count"><strong>{completedCount}</strong><span> / {LESSON_COUNT}</span></p>
              <p className="lessons-progress-label"><UiText text="Lessons completed" /></p>
            </div>
          </div>
        </header>

        <Link to={nextLesson ? `/admission/lessons/${nextLesson.slug}` : '/admission/universities'} className="lessons-resume lessons-glass">
          <span className="lessons-resume-icon" aria-hidden="true">{nextLesson ? <LucideIcon name={nextLesson.icon} className="h-6 w-6" /> : <CheckCircle2 size={24} />}</span>
          <span className="lessons-resume-copy">
            <small><UiText text={nextLesson ? 'Continue learning' : 'Completed'} /></small>
            <strong>{nextLesson ? <><UiText text="Lesson" /> {nextLesson.order}: {nextLesson.title}</> : <><UiText text="Lessons completed" />: {LESSON_COUNT}/{LESSON_COUNT}</>}</strong>
          </span>
          <span className="lessons-resume-action"><UiText text={nextLesson ? 'Continue' : 'Explore universities →'} /><ArrowRight size={18} aria-hidden="true" /></span>
        </Link>

        <nav className="lessons-phase-navigation" aria-label="Study-abroad phases">
          {lessonPhases.map((phase, index) => {
            const phaseLessons = getLessonsByPhase(phase.id)
            const done = phaseLessons.filter((lesson) => completed.has(lesson.slug)).length
            return (
              <a key={phase.id} href={`#phase-${phase.id}`} className="lessons-phase-link lessons-glass">
                <span className="lessons-phase-link-top"><LucideIcon name={phase.icon} className="h-5 w-5" /><span>{String(index + 1).padStart(2, '0')}</span></span>
                <strong>{phase.title}</strong>
                <span className="lessons-phase-link-bottom"><UiText text="Phase" /> {index + 1}<span>{done}/{phaseLessons.length}<ArrowUpRight size={14} aria-hidden="true" /></span></span>
              </a>
            )
          })}
        </nav>

        <div className="lessons-phases">
          {lessonPhases.map((phase, index) => {
            const phaseLessons = getLessonsByPhase(phase.id)
            const done = phaseLessons.filter((lesson) => completed.has(lesson.slug)).length
            return (
              <section key={phase.id} id={`phase-${phase.id}`} className="lessons-phase" aria-labelledby={`phase-title-${phase.id}`}>
                <header className="lessons-phase-header">
                  <span className="lessons-phase-icon lessons-glass" aria-hidden="true"><LucideIcon name={phase.icon} className="h-6 w-6" /></span>
                  <div className="lessons-phase-copy">
                    <p className="lessons-eyebrow"><UiText text="Phase" /> {index + 1} <span>·</span> {phaseLessons.length} <UiText text="lessons" /></p>
                    <h2 id={`phase-title-${phase.id}`}>{phase.title}</h2>
                    <p>{phase.subtitle}</p>
                  </div>
                  <div className="lessons-phase-progress">
                    <span>{done}/{phaseLessons.length} <UiText text="Completed" /></span>
                    <div className="lessons-progress-track" aria-hidden="true"><span style={{ width: `${(done / phaseLessons.length) * 100}%` }} /></div>
                  </div>
                </header>

                <div className="lessons-card-grid">
                  {phaseLessons.map((lesson) => {
                    const isDone = completed.has(lesson.slug)
                    const isNext = lesson.slug === nextLesson?.slug
                    return (
                      <Link key={lesson.id} to={`/admission/lessons/${lesson.slug}`} className={`lessons-card lessons-glass${isDone ? ' is-done' : ''}${isNext ? ' is-next' : ''}`} aria-current={isNext ? 'step' : undefined}>
                        <div className="lessons-card-top">
                          <span className="lessons-card-icon" aria-hidden="true">{isDone ? <CheckCircle2 size={24} /> : <LucideIcon name={lesson.icon} className="h-6 w-6" />}</span>
                          <span className="lessons-card-number" aria-hidden="true">{String(lesson.order).padStart(2, '0')}</span>
                        </div>
                        <p className="lessons-card-kicker"><UiText text="Lesson" /> {String(lesson.order).padStart(2, '0')}{isDone ? <span><CheckCircle2 size={12} aria-hidden="true" /><UiText text="Completed" /></span> : null}</p>
                        <h3>{lesson.title}</h3>
                        <p className="lessons-card-summary">{lesson.summary}</p>
                        <div className="lessons-card-footer">
                          <span><Clock3 size={14} aria-hidden="true" />{lesson.durationMin} <UiText text="min" /></span>
                          <span className="lessons-level">{lesson.level}</span>
                          <ArrowUpRight size={18} className="lessons-card-arrow" aria-hidden="true" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </main>
  )
}
