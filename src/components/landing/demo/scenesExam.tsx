import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, Check, ChevronDown, Clock3, EyeOff, FileText, Highlighter, Maximize2, Menu, Mic, MoreVertical, Send, Sparkles, Volume2 } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, Num, Ring, type SceneProps, Typed, Wave, focused, reached, useTick } from './primitives'

/** Absolute box on the 960×600 canvas. */
export const box = (left: number, top: number, width: number, height: number): CSSProperties => ({ left, top, width, height })
const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

function ExamBar({ skill, timer, answered, children, hot }: { skill: string; timer?: ReactNode; answered?: number; children?: ReactNode; hot?: 'timer' | 'check' }) {
  return <div className="lxd-exambar">
    <strong className="lxd-exambar-title"><b>IELTS</b> {skill}</strong>
    {timer && <span className={`lxd-timer ${hot === 'timer' ? 'is-hot' : ''}`}><Clock3 size={13} />{timer}</span>}
    <span className="lxd-exambar-tools">
      {children}
      <i><Maximize2 size={13} /></i><i><Menu size={13} /></i><i><FileText size={13} /></i>
      {answered !== undefined && <span className={`lxd-final ${hot === 'check' ? 'is-hot' : ''}`}><small>FINAL CHECK</small><em><Num value={answered} from={Math.max(0, answered - 1)} duration={.5} />/40 answered</em></span>}
      <span className={`lxd-submit ${hot === 'check' ? 'is-hot' : ''}`}>Submit <Send size={11} /></span>
    </span>
  </div>
}

function Navigator({ total, answered, current, parts }: { total: number; answered: number[]; current: number; parts: string[] }) {
  return <div className="lxd-navigator">
    <span className="lxd-nav-part is-current"><b>Part 1</b>{Array.from({ length: total }, (_, index) => <i key={index} className={`${answered.includes(index + 1) ? 'is-done' : ''} ${current === index + 1 ? 'is-current' : ''}`}>{index + 1}</i>)}</span>
    {parts.map(part => <span key={part} className="lxd-nav-part"><b>{part}</b><small>0 of 13 solved</small></span>)}
    <span className="lxd-nav-next">Next ›</span>
  </div>
}

const tfng = ['TRUE', 'FALSE', 'NOT GIVEN']

export function ReadingScene(props: SceneProps) {
  const tick = useTick(props.playing)
  const q1 = reached(props, 2)
  const q2 = props.step > 2 || (props.step === 2 && props.acted)
  const answered = [q1 && 1, q2 && 2, props.step === 3 && props.acted && 3].filter(Boolean) as number[]
  return <div className="lxd-scene lxd-exam">
    <ExamBar skill="Reading" timer={clock(3597 - (tick % 600))} answered={answered.length} hot={focused(props, 0) ? 'timer' : undefined} />
    <div className="lxd-panel lxd-passage" style={box(16, 64, 448, 466)}>
      <h4>READING PASSAGE 1</h4>
      <p className="lxd-note"><em>You should spend about 20 minutes on <b>Questions 1–13</b>, which are based on Reading Passage 1 below.</em></p>
      <div className="lxd-passage-banner"><small>PASSAGE 1</small><strong>The life and work of Marie Curie</strong></div>
      <p>Marie Curie is one of the most celebrated scientists in history. Born in Warsaw in 1867, she became known for her research on radioactivity and was the first woman to win a Nobel Prize.</p>
      <p><span className={`lxd-highlight ${reached(props, 1) ? 'is-on' : ''}`}>As a child she showed a remarkable memory, and at sixteen she won a gold medal</span> when she completed her secondary education.</p>
      <p>Her father lost his savings in a bad investment, so she worked as a teacher and used her earnings to support her sister’s medical studies in Paris.</p>
      <p className="lxd-faded">In 1891 she followed her sister to Paris and enrolled at the Sorbonne, where she studied physics late into the night.</p>
    </div>
    <span className="lxd-split" style={{ left: 472, top: 290 }}>‹›</span>
    <div className={`lxd-panel lxd-questions ${focused(props, 2) ? 'is-focus' : ''}`} style={box(488, 64, 456, 466)}>
      <h4>Questions 1–6</h4>
      <p className="lxd-note">Do the following statements agree with the information given in Reading Passage 1?</p>
      {[
        { n: 1, text: 'Marie Curie won a Nobel Prize before any other woman.', pick: q1 ? 0 : -1 },
        { n: 2, text: 'Marie lost interest in science while she was at school.', pick: q2 ? 1 : -1 },
      ].map(question => <div key={question.n} className="lxd-question">
        <p><b>{question.n}</b>{question.text}</p>
        {tfng.map((option, index) => <span key={option} className={`lxd-option ${question.pick === index ? 'is-picked' : ''}`}><i />{option}</span>)}
      </div>)}
    </div>
    <Navigator total={13} answered={answered} current={answered.length ? answered.length : 1} parts={['Part 2', 'Part 3']} />
  </div>
}

export function ListeningScene(props: SceneProps) {
  const tick = useTick(props.playing)
  const typing = reached(props, 2)
  const answers = typing ? 3 : 0
  const answered = props.step === 3 && props.acted ? 6 : typing ? 5 : 2
  const fields: { before: string; value: string; after?: string; width: number }[] = [
    { before: 'Holiday begins on', value: '24 June', width: 120 },
    { before: 'No more than', value: '12', after: 'people in the cycling group.', width: 66 },
    { before: 'Each day, the group cycles', value: '40 km', after: 'on average.', width: 96 },
    { before: 'Some of the hotels have a', value: '', width: 110 },
  ]
  return <div className="lxd-scene lxd-exam">
    <ExamBar skill="Listening" answered={answered} hot={focused(props, 3) ? 'check' : undefined}><span className="lxd-review">Review</span></ExamBar>
    <div className={`lxd-panel lxd-audio ${focused(props, 0) ? 'is-focus' : ''}`} style={box(16, 64, 928, 80)}>
      <span className="lxd-audio-icon"><Volume2 size={18} /></span>
      <span className="lxd-audio-copy"><strong>Listening audio</strong><small>Simulation mode — the recording plays continuously.</small></span>
      <Wave bars={34} live={props.playing} className="lxd-audio-wave" />
      <span className="lxd-chip">{props.playing ? 'PLAYING' : 'PAUSED'}</span>
      <span className="lxd-audio-track"><i style={{ width: `${12 + (tick % 60) * 0.6}%` }} /></span>
      <span className="lxd-audio-time">{clock(192 + tick)} <em>28:34</em></span>
    </div>
    <div className={`lxd-part-banner ${focused(props, 1) ? 'is-shine' : ''}`} style={box(16, 156, 928, 40)}><b>PART 1</b>Listen and answer questions 1–10.<small>1–10 · 40 questions</small></div>
    <div className={`lxd-panel lxd-notes ${focused(props, 2) ? 'is-focus' : ''}`} style={box(16, 208, 928, 330)}>
      <h4>Questions 1–10</h4>
      <p className="lxd-note">Complete the notes below. Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</p>
      <h5>Cycling holiday in Austria</h5>
      <p className="lxd-example"><b>Example:</b> <em>Most suitable holiday lasts <u>10 days</u></em></p>
      {fields.map((field, index) => <p key={field.before} className="lxd-gap-row">{field.before}
        <span className={`lxd-gap ${typing && index < answers ? 'is-filled' : ''}`} style={{ width: field.width }}>{field.value ? <Typed text={field.value} active={typing} done={props.step > 2} delay={index * 650} speed={70} /> : null}{!typing || !field.value ? <small>{index + 1}</small> : null}</span>
        {field.after}</p>)}
    </div>
    <Navigator total={10} answered={typing ? [1, 2, 3] : []} current={typing ? 4 : 1} parts={['Part 2', 'Part 3', 'Part 4']} />
  </div>
}

const essay = 'The diagram illustrates how olive oil is produced, from harvesting the fruit to bottling the finished product. Overall, the process consists of five main stages, beginning with collection in the orchard and ending with storage. '
const essayRest = 'First, ripe olives are picked and transported to the mill, where they are washed to remove leaves and dust. They are then crushed into a paste, which is pressed to separate the oil from the solids. Finally, the oil is filtered and bottled before it is distributed to shops.'

export function WritingScene(props: SceneProps) {
  const stages = ['Harvest', 'Wash', 'Crush', 'Press', 'Bottle']
  const typing = reached(props, 1)
  const full = reached(props, 2)
  const words = full ? 162 : typing ? 38 : 0
  return <div className="lxd-scene lxd-exam">
    <ExamBar skill="Writing" timer={clock(3521)}>
      <span className="lxd-tabs"><b className="is-active">Task 1</b><b>Task 2</b></span>
      <span className={`lxd-ai-btn ${focused(props, 3) ? 'is-hot' : ''}`}><Sparkles size={12} /> AI feedback</span>
    </ExamBar>
    <div className={`lxd-panel lxd-task ${focused(props, 0) ? 'is-focus' : ''}`} style={box(16, 64, 448, 520)}>
      <h4>WRITING TASK 1</h4>
      <p className="lxd-note">The diagram below shows how olive oil is produced. Summarise the information by selecting and reporting the main features. <b>Write at least 150 words.</b></p>
      <svg className="lxd-process" viewBox="0 0 400 250" aria-hidden="true">
        {stages.map((stage, index) => {
          const x = [30, 160, 290, 225, 95][index]
          const y = [30, 30, 30, 170, 170][index]
          const lit = reached(props, 0)
          return <g key={stage}>
            <motion.rect x={x - 10} y={y} width={100} height={52} rx={12} initial={false} animate={{ fill: lit ? '#fff1f3' : '#ffffff', stroke: lit ? '#df0030' : '#cfd4dc' }} transition={{ delay: lit ? index * .22 : 0, duration: .4 }} strokeWidth={1.6} />
            <text x={x + 40} y={y + 22} textAnchor="middle" className="lxd-process-num">{index + 1}</text>
            <text x={x + 40} y={y + 40} textAnchor="middle" className="lxd-process-label">{stage}</text>
          </g>
        })}
        {['M130 56 L150 56', 'M260 56 L280 56', 'M340 82 L300 168', 'M215 196 L195 196', 'M85 168 L60 82'].map((path, index) => <motion.path key={path} d={path} stroke="#df0030" strokeWidth={2.2} fill="none" markerEnd="url(#lxd-arrow)" initial={false} animate={{ pathLength: reached(props, 0) ? 1 : .001, opacity: reached(props, 0) ? 1 : .35 }} transition={{ delay: reached(props, 0) ? .15 + index * .22 : 0, duration: .45 }} />)}
        <defs><marker id="lxd-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#df0030" /></marker></defs>
      </svg>
      <p className="lxd-caption-small">Olive oil production · 5 stages</p>
    </div>
    <div className={`lxd-panel lxd-editor ${focused(props, 1) ? 'is-focus' : ''}`} style={box(480, 64, 464, 520)}>
      <div className="lxd-editor-text">
        <Typed text={essay} active={typing} done={full} speed={22} />
        {full && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .8 }}>{essayRest}</motion.span>}
        {!typing && <span className="lxd-placeholder">Start writing your response…</span>}
      </div>
      <div className={`lxd-wordbar ${focused(props, 2) ? 'is-hot' : ''}`}>
        <span>Saved <Check size={11} /></span>
        <span className="lxd-wordmeter"><i style={{ width: `${Math.min(100, words / 2)}%` }} /><em style={{ left: '75%' }} /></span>
        <strong><Num value={words} from={full ? 38 : 0} duration={full ? 1.6 : 1} /> words</strong>
      </div>
      <AnimatePresence>{focused(props, 3) && <motion.div className="lxd-feedback" initial={{ opacity: 0, y: 30, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: .55, ease: EASE }}>
        <div className="lxd-feedback-head"><span><Sparkles size={13} /> AI band estimate</span><strong><Num value={7} decimals={1} duration={1} /></strong></div>
        {[['Task Achievement', 7], ['Coherence & Cohesion', 7], ['Lexical Resource', 6.5], ['Grammar', 7]].map(([label, score], index) => <div key={label} className="lxd-criterion"><span>{label}</span><i><motion.b initial={{ width: 0 }} animate={{ width: `${(Number(score) / 9) * 100}%` }} transition={{ delay: .25 + index * .12, duration: .8, ease: EASE }} /></i><em>{Number(score).toFixed(1)}</em></div>)}
      </motion.div>}</AnimatePresence>
    </div>
  </div>
}

export function SpeakingScene(props: SceneProps) {
  const tick = useTick(props.playing)
  const part = reached(props, 1) ? 2 : 1
  const recording = reached(props, 2)
  const speaking = props.step === 0 || (props.step === 1 && props.acted)
  const question = part === 1 ? 'Let’s talk about your hometown. What do you like most about living there?' : 'Describe a book that changed the way you think. You should say what it was, when you read it, and why it mattered.'
  return <div className="lxd-scene lxd-exam">
    <ExamBar skill="Speaking" timer={clock(41 + (tick % 120))}>
      <span className="lxd-tabs">{['Part 1', 'Part 2', 'Part 3'].map((label, index) => <b key={label} className={index + 1 === part ? 'is-active' : index + 1 < part ? 'is-done' : ''}>{label}</b>)}</span>
    </ExamBar>
    <div className={`lxd-panel lxd-examiner ${focused(props, 0) ? 'is-focus' : ''}`} style={box(16, 64, 448, 520)}>
      <div className={`lxd-avatar ${speaking ? 'is-speaking' : ''}`}><i /><i /><span>A</span></div>
      <strong className="lxd-examiner-name">Alex <small>AI examiner</small></strong>
      <AnimatePresence mode="wait"><motion.p key={part} className="lxd-bubble" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .4, ease: EASE }}><Typed text={question} active={reached(props, part === 1 ? 0 : 1)} done={part === 1 ? props.step > 0 : props.step > 1} speed={24} /></motion.p></AnimatePresence>
      <div className={`lxd-mic ${recording ? 'is-recording' : ''} ${focused(props, 2) ? 'is-hot' : ''}`}>
        <span className="lxd-mic-btn"><Mic size={20} /></span>
        <span className="lxd-mic-copy"><strong>{recording ? 'Recording' : 'Microphone ready'}</strong><small>{recording ? clock(tick % 60) : 'Starts after the examiner'}</small></span>
        <Wave bars={18} live={recording && props.playing} />
      </div>
    </div>
    <div className={`lxd-panel lxd-parts ${focused(props, 1) ? 'is-focus' : ''}`} style={box(480, 64, 464, 260)}>
      <h4>Your speaking test</h4>
      {[['Part 1', 'Interview', '4–5 min'], ['Part 2', 'Long turn · cue card', '3–4 min'], ['Part 3', 'Discussion', '4–5 min']].map(([label, title, time], index) => <div key={label} className={`lxd-part-row ${index + 1 === part ? 'is-active' : index + 1 < part ? 'is-done' : ''}`}>
        <b>{index + 1 < part ? <Check size={12} /> : index + 1}</b><span><strong>{label} · {title}</strong><small>{time}</small></span>
      </div>)}
    </div>
    <div className={`lxd-panel lxd-band ${focused(props, 3) ? 'is-focus' : ''}`} style={box(480, 336, 464, 248)}>
      <div className="lxd-band-ring"><Ring value={reached(props, 3) ? 78 : 0} size={112} stroke={10} replay={reached(props, 3)} /><span><strong>{reached(props, 3) ? <Num value={7} decimals={1} duration={1.2} /> : '–'}</strong><small>Estimated band</small></span></div>
      <div className="lxd-band-criteria">
        {[['Fluency & Coherence', 7], ['Lexical Resource', 7], ['Grammar', 6.5], ['Pronunciation', 7.5]].map(([label, score], index) => <div key={label} className="lxd-criterion"><span>{label}</span><i><motion.b initial={false} animate={{ width: reached(props, 3) ? `${(Number(score) / 9) * 100}%` : '0%' }} transition={{ delay: .2 + index * .1, duration: .8, ease: EASE }} /></i><em>{reached(props, 3) ? Number(score).toFixed(1) : '–'}</em></div>)}
      </div>
    </div>
  </div>
}

const mocks = [
  { n: '01', status: 'Completed', progress: 100, band: '7.5' },
  { n: '02', status: 'In progress', progress: 46 },
  { n: '03', status: 'Ready', progress: 0 },
  { n: '04', status: 'Ready', progress: 0 },
  { n: '05', status: 'Ready', progress: 0 },
  { n: '06', status: 'Ready', progress: 0 },
]

export function MocksScene(props: SceneProps) {
  const tabs = ['Listening', 'Reading', 'Writing', 'Speaking', 'Full mocks']
  const activeTab = reached(props, 0) ? 4 : 1
  return <div className="lxd-scene lxd-mocks">
    <div className="lxd-mocks-head" style={box(24, 22, 912, 60)}>
      <span><small>IELTS FULL MOCK EXAMS</small><strong>Thirty full mocks</strong></span>
      <span className={`lxd-switch ${focused(props, 0) ? 'is-focus' : ''}`}>{tabs.map((tab, index) => <b key={tab} className={index === activeTab ? 'is-active' : ''}>{tab}</b>)}</span>
    </div>
    <div className={`lxd-panel lxd-mock-summary ${focused(props, 1) ? 'is-focus' : ''}`} style={box(24, 98, 912, 96)}>
      <Ring value={reached(props, 1) ? 13 : 10} size={70} stroke={8} replay={reached(props, 1)} />
      {[['Completed', 4, 3], ['In progress', 1, 1], ['Ready', 25, 26], ['Average band', 7.5, 7]].map(([label, value, before]) => <span key={label as string} className="lxd-mock-stat"><strong>{reached(props, 1) ? <Num value={value as number} from={before as number} decimals={label === 'Average band' ? 1 : 0} replay={props.step} /> : (before as number).toFixed(label === 'Average band' ? 1 : 0)}</strong><small>{label}</small></span>)}
    </div>
    {mocks.map((mock, index) => {
      const left = 24 + (index % 3) * 308
      const top = 210 + Math.floor(index / 3) * 190
      const resumed = index === 1 && reached(props, 3)
      return <motion.div key={mock.n} className={`lxd-panel lxd-mock ${index === 0 && focused(props, 2) ? 'is-focus' : ''} ${index === 1 && focused(props, 3) ? 'is-focus' : ''}`} style={box(left, top, 296, 176)} initial={false} animate={{ y: resumed ? -6 : 0 }}>
        <span className="lxd-mock-top"><strong>Full Mock {mock.n}</strong><em className={`is-${mock.status.split(' ')[0].toLowerCase()}`}>{resumed ? 'Resuming' : mock.status}</em></span>
        <span className="lxd-chain">{['L', 'R', 'W', 'S'].map((skill, skillIndex) => <b key={skill} className={(index === 0 && reached(props, 2)) || skillIndex < (mock.progress === 100 ? 4 : mock.progress ? 1 : 0) ? 'is-lit' : ''} style={{ transitionDelay: index === 0 && focused(props, 2) ? `${skillIndex * 220}ms` : '0ms' }}>{skill}</b>)}</span>
        <span className="lxd-bar"><motion.i initial={false} animate={{ width: `${resumed ? 58 : mock.progress}%` }} transition={{ duration: .9, ease: EASE }} /></span>
        <span className="lxd-mock-foot"><small>{mock.band ? `Overall band ${mock.band}` : mock.progress ? 'Reading · Question 14' : 'Listening → Speaking · 2h 45m'}</small><b className={index === 1 ? 'is-primary' : ''}>{mock.progress === 100 ? 'Review' : mock.progress ? 'Resume' : 'Start'}</b></span>
      </motion.div>
    })}
  </div>
}

export function SatScene(props: SceneProps) {
  const tick = useTick(props.playing)
  const hidden = focused(props, 0)
  const marked = reached(props, 1)
  const picked = reached(props, 2) ? 1 : -1
  return <div className="lxd-scene lxd-sat">
    <div className="lxd-sat-head">
      <span><strong>Section 1, Module 1: Reading and Writing</strong><small>Directions <ChevronDown size={11} /></small></span>
      <span className={`lxd-sat-timer ${focused(props, 0) ? 'is-focus' : ''}`}>{hidden ? <b className="lxd-sat-show">Show</b> : <strong>{clock(1902 - (tick % 900))}</strong>}<EyeOff size={14} /></span>
      <span className="lxd-sat-tools"><i className={focused(props, 3) ? 'is-hot' : ''}><Highlighter size={14} /> Highlights &amp; Notes</i><i><MoreVertical size={14} /> More</i></span>
    </div>
    <span className="lxd-sat-rule" />
    <div className="lxd-sat-passage" style={box(36, 104, 400, 380)}>
      The spacecraft OSIRIS-REx briefly made contact with the asteroid Bennu in 2020. Despite the unexpected obstacle of a surface mostly covered in boulders, <span className={`lxd-sat-mark ${reached(props, 3) ? 'is-on' : ''}`}>OSIRIS-REx successfully</span> ________ a sample of the surface, gathering pieces of it to bring back to Earth.
      <AnimatePresence>{focused(props, 3) && <motion.span className="lxd-sat-note" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: .25, duration: .4 }}>Note · the verb must fit “a sample of the surface”.</motion.span>}</AnimatePresence>
    </div>
    <span className="lxd-sat-divider" />
    <div className="lxd-sat-question" style={box(476, 96, 452, 420)}>
      <div className={`lxd-sat-qhead ${focused(props, 1) ? 'is-focus' : ''}`}><b>1</b><span className={marked ? 'is-marked' : ''}><Bookmark size={14} fill={marked ? 'currentColor' : 'none'} /> {marked ? 'Marked for Review' : 'Mark for Review'}</span></div>
      <p>Which choice completes the text with the most logical and precise word or phrase?</p>
      {['attached', 'collected', 'followed', 'replaced'].map((choice, index) => <span key={choice} className={`lxd-sat-choice ${picked === index ? 'is-picked' : ''}`}><b>{String.fromCharCode(65 + index)}</b>{choice}</span>)}
    </div>
    <div className="lxd-sat-foot"><strong>Aziza Karimova</strong><span className="lxd-sat-qnav">Question 1 of 27 <ChevronDown size={12} /></span><span className="lxd-sat-btns"><b>Back</b><b>Next</b></span></div>
  </div>
}
