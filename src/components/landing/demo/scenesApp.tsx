import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Award, BarChart3, BookOpen, Bookmark, Building2, Captions, Clock3, Crown, Flame, GraduationCap, LayoutGrid, Maximize2, Mic, Pause, PenSquare, Play, Search, SkipBack, SkipForward, SlidersHorizontal, Sparkles, Star, Target, Trophy, Volume2 } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { EASE, Num, Ring, type SceneProps, Typed, Wave, focused, reached, useTick } from './primitives'
import { box } from './scenesExam'

const bars = [{ day: 'Sat', h: 58 }, { day: 'Sun', h: 76 }, { day: 'Mon', h: 38 }, { day: 'Tue', h: 84 }, { day: 'Wed', h: 64 }, { day: 'Thu', h: 96 }, { day: 'Fri', h: 54 }]

export function DashboardScene(props: SceneProps) {
  const statsReplay = focused(props, 1)
  const chartOn = props.step !== 2 || props.acted
  return <div className="lxd-scene lxd-dash">
    <aside className="lxd-panel lxd-side" style={box(12, 12, 150, 576)}>
      <BrandLogo height={30} className="lxd-side-logo" />
      {[[LayoutGrid, 'Dashboard'], [BookOpen, 'IELTS'], [PenSquare, 'SAT'], [GraduationCap, 'Classes'], [Building2, 'Universities'], [BarChart3, 'My Results']].map(([Icon, label], index) => {
        const Glyph = Icon as typeof LayoutGrid
        return <span key={label as string} className={`lxd-side-item ${index === 0 ? 'is-active' : ''}`}><Glyph size={13} />{label as string}</span>
      })}
      <span className="lxd-side-plans"><Crown size={12} /> Plans</span>
      <span className="lxd-side-user"><b>MR</b><span><strong>Madina Rahimova</strong><small><Crown size={9} /> PREMIUM</small></span></span>
    </aside>
    <header className="lxd-dash-head" style={box(176, 18, 772, 64)}>
      <span className="lxd-dash-avatar">MR</span>
      <span><small>YOUR LEARNING DASHBOARD</small><strong>Welcome back, Madina</strong><em>Small steps today. Big results tomorrow.</em></span>
      <span className="lxd-streak"><Flame size={13} /> 46</span>
    </header>
    <div className={`lxd-target ${focused(props, 0) ? 'is-focus' : ''}`} style={box(176, 96, 186, 404)}>
      <strong>Your target</strong>
      <span className="lxd-target-chips"><b>IELTS 8.5</b><b>SAT 1500</b></span>
      <div className="lxd-target-ring"><Ring value={93} size={136} stroke={11} track="rgba(255,255,255,.22)" color="#fff" replay={`${props.step === 0 && props.acted}`} /><span><strong><Num value={93} replay={props.step === 0 && props.acted} />%</strong><small>TOWARD TARGET</small></span></div>
      <span className="lxd-target-now"><b><small>IELTS CURRENT</small>7.5</b><b><small>SAT CURRENT</small>1460</b></span>
      <span className="lxd-target-btn">Continue preparing <ArrowRight size={11} /></span>
    </div>
    {[['IELTS', 'Review mistakes and practise the areas that need a final push.'], ['SAT', 'Sharpen reasoning with timed modules and a question bank.']].map(([title, body], index) => <div key={title} className="lxd-panel lxd-exam-mini" style={box(376 + index * 206, 96, 194, 88)}>
      <span className="lxd-icon"><Target size={13} /></span><strong>{title}</strong><small>{body}</small><em>Open {title} practice →</em>
    </div>)}
    <div className={`lxd-stats ${focused(props, 1) ? 'is-focus' : ''}`} style={box(376, 196, 400, 104)}>
      {[{ icon: Clock3, label: 'Study time', value: 13, suffix: 'h 4m', note: 'THIS WEEK' }, { icon: Award, label: 'Practices', value: 194, note: '24 FULL MOCKS' }, { icon: BarChart3, label: 'Average score', value: 83, suffix: '%', note: 'SCORED PRACTICE' }, { icon: Trophy, label: 'Current rank', value: 2, prefix: '#', note: 'GLOBAL BOARD' }].map(stat => <div key={stat.label} className="lxd-panel lxd-stat">
        <span className="lxd-icon"><stat.icon size={12} /></span><small>{stat.label}</small><strong><Num value={stat.value} prefix={stat.prefix} suffix={stat.suffix} replay={statsReplay} /></strong><em>{stat.note}</em>
      </div>)}
    </div>
    <div className={`lxd-panel lxd-chart ${focused(props, 2) ? 'is-focus' : ''}`} style={box(376, 312, 400, 188)}>
      <span className="lxd-chart-head"><small>WEEKLY ACTIVITY</small><strong>Your study rhythm</strong><em>Full performance →</em></span>
      <div className="lxd-bars">{bars.map((bar, index) => <span key={bar.day} className={index === 5 && focused(props, 2) ? 'is-hot' : ''}>
        <motion.i initial={false} animate={{ scaleY: chartOn ? bar.h / 100 : .04 }} transition={{ duration: .9, delay: chartOn ? index * .07 : 0, ease: EASE }} />
        {index === 5 && focused(props, 2) && <motion.em initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .7 }}>2h 41m</motion.em>}
        <small>{bar.day}</small>
      </span>)}</div>
    </div>
    <div className={`lxd-panel lxd-board ${focused(props, 3) ? 'is-focus' : ''}`} style={box(790, 96, 158, 260)}>
      <small className="lxd-kick">LEADERBOARD</small><strong>Top learners</strong>
      <span className="lxd-podium">{[['MR', '2nd'], ['JT', '1st'], ['SK', '3rd']].map(([who, place], index) => <motion.b key={who} className={`is-${index}`} initial={false} animate={{ y: focused(props, 3) ? [0, -6, 0] : 0 }} transition={{ delay: index * .12, duration: .6 }}>{who}<small>{place}</small></motion.b>)}</span>
      {[['JT', 'Javohir T.', 21980], ['MR', 'Madina R.', reached(props, 3) ? 18720 : 18640], ['SK', 'Sardor K.', 17210]].map(([who, name, xp], index) => <span key={who as string} className={`lxd-board-row ${who === 'MR' ? 'is-me' : ''}`}><b>{index + 1}</b><span>{name as string}</span><em><Num value={xp as number} from={who === 'MR' && reached(props, 3) ? 18640 : (xp as number)} duration={1} /> XP</em></span>)}
      <AnimatePresence>{focused(props, 3) && <motion.span className="lxd-xp-pop" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: -6 }} exit={{ opacity: 0 }} transition={{ delay: .3, duration: .5 }}>+80 XP</motion.span>}</AnimatePresence>
    </div>
    <div className="lxd-panel lxd-achieve" style={box(790, 368, 158, 132)}>
      <span className="lxd-icon is-gold"><Award size={13} /></span><strong>Next achievement</strong><small>Complete 50 scored practice sessions</small>
      <span className="lxd-bar"><motion.i initial={false} animate={{ width: reached(props, 3) ? '100%' : '88%' }} transition={{ duration: .8 }} /></span><em>{reached(props, 3) ? '50' : '44'} / 50 complete</em>
    </div>
    <div className="lxd-panel lxd-continue" style={box(176, 514, 772, 74)}>
      <span><small>CONTINUE LEARNING</small><strong>Pick up where you left off</strong></span>
      {[['Reading', 58], ['Full mock', 18], ['Admissions', 80], ['Writing', 77], ['Vocabulary', 88]].map(([label, value]) => <span key={label as string} className="lxd-continue-card"><b>{label as string}</b><i><motion.em initial={false} animate={{ width: `${value}%` }} /></i><small>{value as number}%</small></span>)}
    </div>
  </div>
}

const tracks = [
  { title: 'IELTS track', body: 'Every test, passage and topic', words: 2914, progress: 38, chips: ['meticulous', 'scarcity', 'mitigate'] },
  { title: 'SAT track', body: '40 mocks · 20 words per module', words: 1600, progress: 24, chips: ['ubiquitous', 'candid', 'tenuous'] },
  { title: 'Articles', body: 'Words from the Reading Library', words: 514, progress: 61, chips: ['resilient', 'paradigm'] },
]

export function VocabularyScene(props: SceneProps) {
  const flipped = props.step % 2 === 1 && props.acted
  const saved = reached(props, 3)
  return <div className="lxd-scene lxd-vocab">
    <div className="lxd-page-head" style={box(24, 22, 560, 70)}><small>VOCABULARY ARENA</small><strong>Thousands of words, in context</strong><em>Flashcards · matching · quizzes · typing drills</em></div>
    <div className={`lxd-panel lxd-total ${focused(props, 0) ? 'is-focus' : ''}`} style={box(636, 22, 300, 96)}>
      <span className="lxd-icon"><BookOpen size={14} /></span>
      <span><strong><Num value={5028} replay={focused(props, 0)} /></strong><small>IELTS &amp; SAT terms ready</small></span>
    </div>
    {tracks.map((track, index) => {
      const active = focused(props, index === 0 ? 1 : index === 1 ? 2 : -1)
      return <div key={track.title} className={`lxd-panel lxd-track ${active ? 'is-focus' : ''}`} style={box(24 + index * 200, 110, 188, 250)}>
        <span className="lxd-icon">{index === 1 ? <PenSquare size={13} /> : <BookOpen size={13} />}</span>
        <strong>{track.title}</strong><small>{track.body}</small>
        <span className="lxd-track-words"><Num value={track.words} replay={active} /> words</span>
        <span className="lxd-bar"><motion.i initial={false} animate={{ width: `${active ? track.progress + 14 : track.progress}%` }} transition={{ duration: .9, ease: EASE }} /></span>
        <span className="lxd-word-chips">{track.chips.map((chip, chipIndex) => <motion.b key={chip} initial={false} animate={{ opacity: active ? 1 : .55, y: active ? 0 : 4 }} transition={{ delay: active ? .2 + chipIndex * .12 : 0 }}>{chip}</motion.b>)}</span>
      </div>
    })}
    <div className={`lxd-panel lxd-mywords ${focused(props, 3) ? 'is-focus' : ''}`} style={box(24, 374, 588, 210)}>
      <span className="lxd-icon"><Star size={13} /></span><strong>My Words</strong><small>Saved from tests, articles and podcasts</small>
      <span className="lxd-word-list">{['eloquent', 'diligent', 'notion', 'scrutiny', 'feasible', 'inevitable'].concat(saved ? ['ubiquitous'] : []).map(word => <motion.b key={word} layout={false} initial={word === 'ubiquitous' ? { opacity: 0, scale: .6 } : false} animate={{ opacity: 1, scale: 1 }} className={word === 'ubiquitous' ? 'is-new' : ''}>{word}</motion.b>)}</span>
      <em className="lxd-mywords-count">{saved ? 7 : 6} saved</em>
    </div>
    <div className="lxd-flash-wrap" style={box(636, 134, 300, 450)}>
      <motion.div className="lxd-flash" initial={false} animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: .8, ease: EASE }}>
        <div className="lxd-flash-face">
          <small>SAT · Module 3</small><strong>ubiquitous</strong><em>/juːˈbɪk.wɪ.təs/ · adjective</em>
          <span className="lxd-flash-hint">Tap to reveal</span>
        </div>
        <div className="lxd-flash-face is-back">
          <small>Definition</small><strong>present everywhere</strong><em>“Smartphones have become ubiquitous in modern classrooms.”</em>
        </div>
      </motion.div>
      <span className={`lxd-flash-save ${saved ? 'is-saved' : ''}`}><Bookmark size={14} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved to My Words' : 'Save word'}</span>
      <span className="lxd-flash-actions"><b>Again</b><b>Good</b><b className="is-primary">Easy</b></span>
    </div>
  </div>
}

export function NovaScene(props: SceneProps) {
  const asked = reached(props, 0)
  const subject = reached(props, 1) ? 1 : 0
  const listening = focused(props, 2)
  const voice = focused(props, 3)
  return <div className="lxd-scene lxd-nova">
    <aside className="lxd-panel lxd-nova-side" style={box(12, 12, 200, 576)}>
      <span className="lxd-nova-new"><Sparkles size={12} /> New chat</span>
      <small>RECENT</small>
      {['IELTS: True / False / Not Given', 'SAT: systems of equations', 'Grammar: articles', 'Writing Task 2 ideas'].map((item, index) => <span key={item} className={`lxd-nova-history ${index === 0 ? 'is-active' : ''}`}>{item}</span>)}
    </aside>
    <header className="lxd-nova-head" style={box(228, 18, 720, 56)}>
      <span className="lxd-orb" /><span><strong>Nova</strong><small>AI coach · online</small></span>
      <span className={`lxd-talk ${voice ? 'is-hot' : ''}`}><Volume2 size={12} /> Talk with Nova</span>
    </header>
    <div className={`lxd-panel lxd-chat ${focused(props, 0) ? 'is-focus' : ''}`} style={box(228, 86, 720, 366)}>
      <AnimatePresence>{asked && <motion.p key="q" className="lxd-msg is-user" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>How should I approach True / False / Not Given questions?</motion.p>}</AnimatePresence>
      <AnimatePresence>{asked && <motion.div key="a" className="lxd-msg is-nova" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .5, duration: .4 }}>
        <span className="lxd-orb is-small" />
        <p><Typed text="Great question! Read the statement first and find the matching part of the passage. If the passage agrees, choose TRUE. If it says the opposite, choose FALSE. If the passage simply doesn’t mention it, the answer is NOT GIVEN — don’t use your own knowledge." active={asked} done={props.step > 0} delay={900} speed={18} /></p>
      </motion.div>}</AnimatePresence>
      {!asked && <span className="lxd-chat-empty"><span className="lxd-orb" />Ask Nova anything about IELTS, SAT or English.</span>}
    </div>
    <div className={`lxd-subjects ${focused(props, 1) ? 'is-focus' : ''}`} style={box(228, 464, 720, 40)}>{['IELTS', 'SAT & Math', 'English', 'Admissions'].map((item, index) => <b key={item} className={index === subject ? 'is-active' : ''}>{item}</b>)}</div>
    <div className={`lxd-panel lxd-input ${focused(props, 2) ? 'is-focus' : ''}`} style={box(228, 516, 720, 64)}>
      <span>{listening ? <><Wave bars={22} live={props.playing} /> Listening…</> : 'Ask Nova a question…'}</span>
      <b className={`lxd-input-mic ${listening ? 'is-live' : ''}`}><Mic size={15} /></b>
      <b className="lxd-input-send"><ArrowRight size={15} /></b>
    </div>
    <AnimatePresence>{voice && <motion.div className="lxd-voice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: .2, duration: .5 }}>
      <motion.span className="lxd-orb is-huge" initial={{ scale: .6 }} animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} />
      <strong>Nova is listening</strong><small>Speak naturally — Nova answers out loud.</small>
      <Wave bars={28} live={props.playing} />
    </motion.div>}</AnimatePresence>
  </div>
}

const captions = ['Most of us think of a city as roads and buildings.', 'But researchers now say the places we live', 'quietly shape the way we think and decide.', 'A busy street can make us walk faster,', 'while a park slows our breathing and our pace.', 'Planners are using these ideas to design calmer cities.']

export function PodcastScene(props: SceneProps) {
  const tick = useTick(props.playing, 1400)
  const line = reached(props, 1) ? tick % captions.length : 0
  const cinema = focused(props, 3)
  return <div className="lxd-scene lxd-podcast">
    <div className="lxd-page-head" style={box(24, 18, 560, 56)}><small>ENGLISH PODCASTS</small><strong>Train your ear</strong></div>
    <span className="lxd-levels" style={box(600, 30, 336, 32)}>{['All', 'A2', 'B1', 'B2', 'C1'].map((level, index) => <b key={level} className={index === 3 ? 'is-active' : ''}>{level}</b>)}</span>
    <div className={`lxd-feature-ep ${focused(props, 0) ? 'is-focus' : ''}`} style={box(24, 84, 560, 250)}>
      <span className="lxd-cover"><Wave bars={26} live={props.playing} /></span>
      <span className="lxd-ep-copy"><small>FEATURED · B2 · 18 min</small><strong>How cities shape the way we think</strong><em>Urban design, attention and everyday decisions.</em><b><Play size={13} fill="currentColor" /> Play episode</b></span>
    </div>
    <div className={`lxd-panel lxd-captions ${focused(props, 1) ? 'is-focus' : ''}`} style={box(600, 84, 336, 250)}>
      <span className="lxd-captions-head"><Captions size={13} /> English captions</span>
      <div className="lxd-caption-lines" style={{ transform: `translateY(${-line * 34}px)` }}>{captions.map((text, index) => <p key={text} className={index === line ? 'is-active' : index < line ? 'is-past' : ''}>{text}</p>)}</div>
    </div>
    <div className="lxd-episodes" style={box(24, 348, 912, 136)}>
      {[['The science of sleep', 'B1 · 14 min', 0], ['Why we procrastinate', 'B2 · 21 min', 64], ['Ocean cities of the future', 'C1 · 26 min', 0], ['Learning languages fast', 'A2 · 9 min', 100]].map(([title, meta, progress], index) => {
        const hot = index === 1 && focused(props, 2)
        return <motion.div key={title as string} className={`lxd-panel lxd-episode ${hot ? 'is-focus' : ''}`} initial={false} animate={{ y: hot ? -6 : 0 }}>
          <span className={`lxd-ep-art is-${index}`} /><strong>{title as string}</strong><small>{meta as string}</small>
          <span className="lxd-bar"><i style={{ width: `${progress}%` }} /></span>
          {index === 1 && <em>{reached(props, 2) ? 'Continue · 12:40' : '64% listened'}</em>}
        </motion.div>
      })}
    </div>
    <div className={`lxd-player ${focused(props, 3) ? 'is-focus' : ''}`} style={box(24, 498, 912, 86)}>
      <span className="lxd-player-btns"><SkipBack size={14} /><b>{props.playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}</b><SkipForward size={14} /></span>
      <span className="lxd-player-track"><small>How cities shape the way we think</small><i><em style={{ width: `${18 + (tick % 40) * 1.6}%` }} /></i></span>
      <span className="lxd-player-tools"><b>1.0×</b><Captions size={14} /><Volume2 size={14} /><Maximize2 size={14} /></span>
    </div>
    <AnimatePresence>{cinema && <motion.div className="lxd-cinema" initial={{ opacity: 0, scale: .92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .96 }} transition={{ delay: .15, duration: .6, ease: EASE }}>
      <Wave bars={40} live={props.playing} className="lxd-cinema-wave" />
      <p>{captions[2 + (tick % 3)]}</p>
      <span className="lxd-cinema-bar"><i style={{ width: `${30 + (tick % 20) * 2}%` }} /></span>
    </motion.div>}</AnimatePresence>
  </div>
}

// QS 2027 positions come from src/data/admission/qs2027UniversityCatalog.ts.
const universities = [
  { name: 'University of Toronto', place: 'Toronto · Canada', rank: 32, ielts: '6.5', fit: 92 },
  { name: 'McGill University', place: 'Montreal · Canada', rank: 30, ielts: '6.5', fit: 88 },
  { name: 'University of British Columbia', place: 'Vancouver · Canada', rank: 45, ielts: '6.5', fit: 90 },
  { name: 'The University of Edinburgh', place: 'Edinburgh · United Kingdom', rank: 35, ielts: '6.5', fit: 84 },
]

export function AdmissionsScene(props: SceneProps) {
  const searched = reached(props, 0)
  const filtered = reached(props, 1)
  return <div className="lxd-scene lxd-admit">
    <div className="lxd-page-head" style={box(24, 18, 440, 64)}><small>UNIVERSITY ADMISSIONS</small><strong>Find your university</strong><em>1,506 universities · QS 2027 context</em></div>
    <div className={`lxd-search ${focused(props, 0) ? 'is-focus' : ''}`} style={box(500, 28, 436, 46)}><Search size={15} /><span>{searched ? <Typed text="Canada" active={searched} done={props.step > 0} speed={90} /> : <em>Search universities…</em>}</span></div>
    <div className={`lxd-filters ${focused(props, 1) ? 'is-focus' : ''}`} style={box(500, 86, 436, 34)}><SlidersHorizontal size={13} />{['Country', 'Budget ≤ $30k', 'IELTS 6.5+', 'QS Top 50'].map((chip, index) => <b key={chip} className={filtered && index > 0 ? 'is-on' : ''} style={{ transitionDelay: filtered ? `${index * 120}ms` : '0ms' }}>{chip}</b>)}</div>
    <div className="lxd-panel lxd-profile" style={box(24, 98, 280, 486)}>
      <small className="lxd-kick">YOUR PROFILE</small>
      <span className="lxd-profile-ring"><Ring value={reached(props, 3) ? 92 : 70} size={120} stroke={10} replay={reached(props, 3)} /><span><strong>{reached(props, 3) ? <Num value={92} from={70} /> : 70}%</strong><small>best fit</small></span></span>
      {[['IELTS', '7.5'], ['SAT', '1460'], ['Budget', '$30k / year'], ['Field', 'Computer Science']].map(([label, value]) => <span key={label} className="lxd-profile-row"><small>{label}</small><b>{value}</b></span>)}
      <span className="lxd-results-count">{filtered ? <><Num value={3} from={30} duration={1} /> top matches</> : searched ? '30 in Canada' : '1,506 universities'}</span>
    </div>
    {universities.map((university, index) => {
      const top = 136 + index * 112
      return <motion.div key={university.name} className={`lxd-panel lxd-uni ${index === 0 && (focused(props, 2) || focused(props, 3)) ? 'is-focus' : ''}`} style={box(320, top, 616, 100)} initial={false} animate={{ opacity: searched && index === 3 ? .35 : 1 }}>
        <span className="lxd-uni-crest">{university.name.replace(/^The /, '').split(' ').filter(word => /^[A-Z]/.test(word)).slice(0, 2).map(word => word[0]).join('')}</span>
        <span className="lxd-uni-copy"><strong>{university.name}</strong><small>{university.place}</small><em>IELTS {university.ielts} · Tuition & living shown</em></span>
        <span className={`lxd-qs ${index === 0 && focused(props, 2) ? 'is-shine' : ''}`}><small>QS 2027</small>#{university.rank}</span>
        <span className="lxd-fit"><small>Your fit</small><i><motion.b initial={false} animate={{ width: reached(props, 3) ? `${university.fit}%` : '0%' }} transition={{ delay: index * .12, duration: .9, ease: EASE }} /></i><em>{reached(props, 3) ? `${university.fit}%` : '–'}</em></span>
      </motion.div>
    })}
  </div>
}
