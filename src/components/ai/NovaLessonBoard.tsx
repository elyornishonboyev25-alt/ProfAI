import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { readNovaLesson, graphSamples, type NovaLesson, type LessonProgress } from '@/lib/novaLesson'
import { speakCoachAudio, cancelCoachAudio } from '@/lib/coachAudio'
import { defaultNovaPerformance } from '@/lib/novaPersona'
import './nova-lesson.css'
import './nova-glass.css'

type Block = NovaLesson['blocks'][number]
const Formula = memo(function Formula({ value }: { value: string }) {
  let html: string
  try { html = katex.renderToString(value, { throwOnError: false, trust: false, strict: 'error', maxExpand: 100, maxSize: 10, displayMode: true }) }
  catch { return <code className="nova-formula-error">{value}</code> }
  return <div className="nova-formula" role="math" aria-label={value} dangerouslySetInnerHTML={{ __html: html }} />
})
function Graph({ block }: { block: Extract<Block, { type: 'graph' }> }) {
  const points = graphSamples(block)
  if (!points.length) return null
  const [minX, maxX] = block.domain, ys = [...points.map(p => p.y), 0], minY = Math.min(...ys), maxY = Math.max(...ys), spanY = maxY - minY || 2
  const x = (value: number) => 45 + (value - minX) / (maxX - minX) * 450
  const y = (value: number) => 265 - (value - minY) / spanY * 225
  return <figure><svg viewBox="0 0 540 310" role="img" aria-label={block.caption} className="nova-graph">
    {[0, 1, 2, 3, 4].map(i => <g key={i}><line x1="45" y1={40 + i * 56.25} x2="495" y2={40 + i * 56.25} stroke="#e2e8f0"/><text x="38" y={44 + i * 56.25} textAnchor="end">{(maxY - i * spanY / 4).toFixed(1)}</text></g>)}
    <line x1="45" y1={y(0)} x2="500" y2={y(0)} stroke="#64748b"/><line x1={x(Math.max(minX, Math.min(maxX, 0)))} y1="30" x2={x(Math.max(minX, Math.min(maxX, 0)))} y2="270" stroke="#64748b"/>
    <polyline points={points.map(p => `${x(p.x)},${y(p.y)}`).join(' ')} fill="none" stroke="#c51b40" strokeWidth="3"/>
    {block.points.map((p, i) => <g key={i}><circle cx={x(p.x)} cy={y(p.y)} r="4" fill="#c51b40"/><text x={x(p.x) + 7} y={y(p.y) - 8}>{p.label ?? `(${p.x}, ${p.y})`}</text></g>)}
    <text x="45" y="285">{minX}</text><text x="490" y="285" textAnchor="end">{maxX}</text><text x="270" y="306" textAnchor="middle">{block.xLabel}{block.xUnit ? ` (${block.xUnit})` : ''}</text><text x="46" y="18">{block.yLabel}{block.yUnit ? ` (${block.yUnit})` : ''}</text>
  </svg><figcaption>{block.caption}</figcaption></figure>
}
function Diagram({ block }: { block: Extract<Block, { type: 'diagram' }> }) {
  return <figure><svg viewBox="-5 -8 110 116" role="img" aria-label={block.caption} className="nova-diagram">{block.shapes.map((shape, i) => shape.kind === 'line' ? <line key={i} x1={shape.x} y1={shape.y} x2={shape.x2} y2={shape.y2} stroke="#334155" strokeWidth=".7"/> : shape.kind === 'circle' ? <circle key={i} cx={shape.x} cy={shape.y} r={shape.radius} fill="#fff1f2" stroke="#c51b40" strokeWidth=".7"/> : <text key={i} x={shape.x} y={shape.y} textAnchor="middle" fontSize="3.3" fill="#334155">{shape.text}</text>)}</svg><figcaption>{block.caption}</figcaption></figure>
}
function narration(block: Block) { return block.narration || ('explanation' in block ? block.explanation : 'text' in block ? block.text : 'prompt' in block ? block.prompt : 'caption' in block ? block.caption : block.type === 'worked_example' ? [block.problem, ...block.steps.map(step => step.text)].join(' ') : block.title) }
export default function NovaLessonBoard({ lesson: raw, progress: saved, onProgress, onNarrating, onPlayback, onLevel, controlId, onAttempt }: { lesson: NovaLesson; progress?: LessonProgress; onProgress: (progress: LessonProgress) => void; onNarrating?: (playing: boolean) => void; onPlayback?: (state: 'loading' | 'speaking' | 'idle', blockId: string) => void; onLevel?: (level: number) => void; controlId?: string; onAttempt?: (text: string) => void }) {
  const reduced = useReducedMotion()
  const lesson = useMemo(() => readNovaLesson(raw), [raw])
  const [progress, setProgress] = useState<LessonProgress>(saved ?? { revealedSteps: {}, answers: {} })
  const [playing, setPlaying] = useState(false), [error, setError] = useState(false), [hints, setHints] = useState<Record<string, boolean>>({})
  const [spokenStep, setSpokenStep] = useState(''), [spokenBlock, setSpokenBlock] = useState('')
  const run = useRef(0), progressRef = useRef(progress); progressRef.current = progress
  const control = useRef((action: string) => {})
  const notify = useRef({ onProgress, onNarrating, onPlayback, onLevel }); notify.current = { onProgress, onNarrating, onPlayback, onLevel }
  const t = (uz: string, en: string, ru: string) => lesson?.language === 'uz' ? uz : lesson?.language === 'ru' ? ru : en
  const save = (value: LessonProgress) => { progressRef.current = value; setProgress(value); notify.current.onProgress(value) }
  const stop = () => { run.current++; cancelCoachAudio(); setPlaying(false); setSpokenStep(''); setSpokenBlock(''); notify.current.onPlayback?.('idle', ''); notify.current.onLevel?.(0); notify.current.onNarrating?.(false) }
  useEffect(() => { const interrupt = () => stop(); window.addEventListener('nova:interrupt', interrupt); return () => { window.removeEventListener('nova:interrupt', interrupt); stop() } }, [lesson?.id])
  useEffect(() => { const listener = (event: Event) => { const detail = (event as CustomEvent).detail; if (controlId && detail?.target === controlId) control.current(detail.action) }; window.addEventListener('nova:lesson-control', listener); return () => window.removeEventListener('nova:lesson-control', listener) }, [controlId])
  if (!lesson) return null
  const active = Math.max(0, lesson.blocks.findIndex(block => block.id === progress.activeBlockId))
  const play = (from: number) => {
    stop(); const version = ++run.current; setError(false); setPlaying(true); notify.current.onNarrating?.(true)
    const clips = lesson.blocks.slice(from).flatMap<{ block: Block; text: string; step: number | undefined }>(block => block.type === 'worked_example' ? [{ block, text: block.problem, step: undefined }, ...block.steps.map((step, index) => ({ block, text: step.text, step: index }))] : [{ block, text: narration(block), step: undefined }])
    const speak = (index: number) => {
      if (version !== run.current || index >= clips.length) { if (version === run.current) stop(); return }
      const { block, text, step } = clips[index]
      speakCoachAudio(text, lesson.language, {
        loading: value => { if (value && version === run.current) { setSpokenStep(''); setSpokenBlock(''); notify.current.onPlayback?.('loading', block.id) } },
        level: level => { if (version === run.current) notify.current.onLevel?.(level) },
        started: () => { if (version === run.current) { notify.current.onPlayback?.('speaking', block.id); setSpokenBlock(block.id); setSpokenStep(block.type === 'worked_example' && step !== undefined ? block.steps[step].id : ''); save({ ...progressRef.current, activeBlockId: block.id, revealedSteps: { ...progressRef.current.revealedSteps, ...(step !== undefined ? { [block.id]: Math.max(step + 1, progressRef.current.revealedSteps[block.id] ?? 1) } : {}) } }) } },
        ended: () => { if (version === run.current) speak(index + 1) }, failed: () => { if (version === run.current) { setError(true); stop() } },
      }, defaultNovaPerformance('focused'))
    }
    speak(0)
  }
  control.current = action => { if (action === 'pause') stop(); else if (action === 'continue') play(active); else if (action === 'restart') { save({ ...progressRef.current, activeBlockId: lesson.blocks[0].id, revealedSteps: {} }); play(0) } }
  return <motion.section initial={reduced ? false : { opacity: 0, y: 12, scale: .99 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .3 }} className="nova-lesson" aria-label={t('Dars maydoni', 'Lesson board', 'Учебная доска')}>
    <header className="nova-lesson-header"><div><p>{t('Birga o‘rganamiz', 'Let’s work through it', 'Разберём вместе')}</p><h2>{lesson.title}</h2></div><span>{String(active + 1).padStart(2, '0')} / {String(lesson.blocks.length).padStart(2, '0')}</span></header>
    <nav className="nova-lesson-controls" aria-label={t('Dars boshqaruvi', 'Lesson controls', 'Управление уроком')}><button onClick={() => playing ? stop() : play(active)}>{playing ? t('To‘xtatish', 'Pause', 'Пауза') : t('Davom et', 'Continue', 'Продолжить')}</button><button onClick={() => { stop(); save({ ...progressRef.current, activeBlockId: lesson.blocks[0].id, revealedSteps: {} }); play(0) }}>{t('Boshidan', 'Restart', 'Сначала')}</button><small>{t('Ovoz bo‘laklari bo‘yicha', 'Audio by section', 'Озвучка по разделам')}</small></nav>
    {error && <p role="alert">{t('Ovoz ijro etilmadi. Qayta urining yoki matndan davom eting.', 'Audio could not play. Retry or continue reading.', 'Не удалось воспроизвести звук. Повторите или читайте дальше.')}</p>}
    <motion.div className="nova-lesson-blocks" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: reduced ? 0 : .055 } } }}>{lesson.blocks.map((block, index) => <motion.article variants={{ hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 10 }, visible: { opacity: 1, y: 0, transition: { duration: .24 } } }} key={block.id} data-block-id={block.id} data-speaking={spokenBlock === block.id} data-active={index === active} className={`nova-lesson-block nova-lesson-block--${block.type}`}>
      <button className="nova-block-title" aria-current={index === active ? 'step' : undefined} onClick={() => { stop(); save({ ...progressRef.current, activeBlockId: block.id }) }}><span>{String(index + 1).padStart(2, '0')}</span><h3>{block.title}</h3></button>
      {block.type === 'explanation' && <p>{block.text.split(new RegExp(`(${block.highlights.map(value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') || '(?!)'})`, 'g')).map((part, i) => block.highlights.includes(part) ? <motion.mark key={i} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduced ? 0 : Math.min(i * .035, .25) }}>{part}</motion.mark> : part)}</p>}
      {block.type === 'formula' && <><Formula value={block.latex}/><p>{block.explanation}</p><dl>{block.symbols.map((symbol, i) => <div key={i}><dt>{symbol.symbol}</dt><dd>{symbol.meaning}</dd></div>)}</dl></>}
      {block.type === 'worked_example' && <><p>{block.problem}</p><ol>{block.steps.slice(0, progress.revealedSteps[block.id] ?? 1).map(step => <motion.li key={step.id} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .24 }} data-active-step={spokenStep === step.id}><p>{step.text}</p>{step.latex && <Formula value={step.latex}/>}</motion.li>)}</ol>{(progress.revealedSteps[block.id] ?? 1) < block.steps.length && <button onClick={() => save({ ...progressRef.current, activeBlockId: block.id, revealedSteps: { ...progress.revealedSteps, [block.id]: (progress.revealedSteps[block.id] ?? 1) + 1 } })}>{t('Keyingi qadam', 'Next step', 'Следующий шаг')}</button>}</>}
      {block.type === 'graph' && <Graph block={block}/>}{block.type === 'diagram' && <Diagram block={block}/>}
      {block.type === 'comparison' && <div className="nova-table-scroll"><table><thead><tr>{block.columns.map((name, i) => <th key={i}>{name}</th>)}</tr></thead><tbody>{block.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}
      {block.type === 'summary' && <p>{block.text}</p>}
      {block.type === 'exercise' && <><p>{block.prompt}</p><label>{t('Sizning urinishingiz', 'Your attempt', 'Ваша попытка')}<textarea maxLength={2000} value={progress.answers[block.id] ?? ''} onChange={event => save({ ...progressRef.current, answers: { ...progressRef.current.answers, [block.id]: event.target.value } })}/></label>{onAttempt && <button disabled={!progress.answers[block.id]?.trim()} onClick={() => { stop(); onAttempt(block.prompt + "\n" + t("Mening javobim: ", "My answer: ", "\u041c\u043e\u0439 \u043e\u0442\u0432\u0435\u0442: ") + progress.answers[block.id]) }}>{t("Nova tekshirsin", "Ask Nova to check", "\u041f\u0440\u043e\u0432\u0435\u0440\u0438\u0442\u044c \u0441 Nova")}</button>}{block.hint && <button onClick={() => setHints(value => ({ ...value, [block.id]: !value[block.id] }))}>{t('Ishora', 'Hint', 'Подсказка')}</button>}{hints[block.id] && <p>{block.hint}</p>}</>}
    </motion.article>)}</motion.div>
  </motion.section>
}
