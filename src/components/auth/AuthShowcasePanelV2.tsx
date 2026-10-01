import { motion } from 'framer-motion'
import { BookOpen, ChartNoAxesCombined, GraduationCap } from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandLogo'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { useCopy } from '@/i18n/interface'
import '@/styles/auth-showcase.css'

const trends = [
  { exam: 'SAT', score: '1520', total: '1600', gain: '+320', bars: [38, 43, 54, 62, 69, 77, 88] },
  { exam: 'IELTS', score: '7.5', total: '9.0', gain: '+1.5', bars: [37, 43, 54, 62, 70, 79, 89] },
] as const

const ease = [.22, 1, .36, 1] as const

function ScoreTrend({ trend, minimalMotion, delay }: {
  trend: typeof trends[number]
  minimalMotion: boolean
  delay: number
}) {
  const { c } = useCopy()
  const points = trend.bars.map((bar, index) => ({ x: 23 + index * 47, y: 110 - bar * .78 }))
  const path = `M ${points.map(({ x, y }) => `${x} ${y}`).join(' L ')} L 326 22`

  return (
    <div className="auth-showcase-trend">
      <div className="auth-showcase-trend-heading">
        <div>
          <span className="auth-showcase-exam">{trend.exam}</span>
          <div className="auth-showcase-score"><strong>{trend.score}</strong><span> / {trend.total}</span></div>
        </div>
        <motion.span
          className="auth-showcase-gain"
          initial={minimalMotion ? false : { opacity: 0, y: 12, scale: .86 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: .55, delay: minimalMotion ? 0 : delay + .6, type: 'spring', bounce: .28 }}
        >{trend.gain}</motion.span>
      </div>
      <svg className="auth-showcase-chart" viewBox="0 0 340 122" role="img" aria-label={`${trend.exam}: ${c('Sample score trend across seven practice tests')}`}>
        <defs>
          <linearGradient id={`auth-${trend.exam}-bars`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f27682" stopOpacity=".82" />
            <stop offset="1" stopColor="#f8bfc4" stopOpacity=".22" />
          </linearGradient>
          <linearGradient id={`auth-${trend.exam}-final`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e9213c" />
            <stop offset="1" stopColor="#f8a4ad" stopOpacity=".3" />
          </linearGradient>
        </defs>
        {trend.bars.map((bar, index) => {
          const top = 110 - bar * .78
          return <motion.rect
            key={index}
            x={5 + index * 47}
            y={top}
            width="37"
            height={110 - top}
            rx="8"
            fill={`url(#auth-${trend.exam}-${index === 6 ? 'final' : 'bars'})`}
            initial={minimalMotion ? false : { scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            style={{ transformOrigin: `${23.5 + index * 47}px 110px` }}
            transition={{ duration: .75, delay: minimalMotion ? 0 : delay + .12 + index * .09, ease }}
          />
        })}
        <motion.path
          d={path}
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="auth-showcase-chart-line"
          initial={minimalMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: minimalMotion ? 0 : delay + .35, ease: 'easeInOut' }}
        />
        {points.map(({ x, y }, index) => <motion.circle
          key={index}
          cx={x}
          cy={y}
          r={index === 6 ? 5.2 : 4.2}
          fill={index === 6 ? '#e92340' : '#f18591'}
          stroke="#fff"
          strokeWidth="2.4"
          initial={minimalMotion ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: .3, delay: minimalMotion ? 0 : delay + .55 + index * .12 }}
        />)}
        <motion.path
          d="m 320 23 7 -3 -2 8"
          fill="none"
          stroke="#ec5264"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={minimalMotion ? false : { opacity: 0, scale: .5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: .3, delay: minimalMotion ? 0 : delay + 1.65 }}
        />
      </svg>
      <div className="auth-showcase-tests" aria-hidden="true">
        {trend.bars.map((_, index) => <span key={index}>{c('Test')} {index + 1}</span>)}
      </div>
    </div>
  )
}

export default function AuthShowcasePanelV2({ mode }: { mode: 'login' | 'register' }) {
  const { c } = useCopy()
  const { minimalMotion } = useMotionPreferences()
  const features = [
    { icon: BookOpen, title: 'IELTS + SAT practice' },
    { icon: ChartNoAxesCombined, title: 'Actionable insights' },
    { icon: GraduationCap, title: 'University planning' },
  ]
  const reveal = (delay: number, distance = 28) => ({
    initial: minimalMotion ? false : { opacity: 0, y: distance, filter: 'blur(8px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: minimalMotion ? .01 : .8, delay: minimalMotion ? 0 : delay, ease },
  })

  return (
    <aside id="auth-showcase" className="auth-cinema-showcase auth-showcase-v2" aria-label={mode === 'register' ? 'ProfAI account features' : 'ProfAI sign in features'}>
      <div className="auth-showcase-grid" aria-hidden="true" />
      <div className="auth-showcase-arc auth-showcase-arc-top" aria-hidden="true" />
      <div className="auth-showcase-arc auth-showcase-arc-bottom" aria-hidden="true" />
      <div className="auth-showcase-dots auth-showcase-dots-left" aria-hidden="true" />
      <div className="auth-showcase-dots auth-showcase-dots-right" aria-hidden="true" />

      <div className="auth-showcase-layout" key={mode}>
        <motion.div className="auth-showcase-brand" {...reveal(.08, 18)}>
          <span className="auth-showcase-brand-icon"><BrandMark size={49} /></span>
          <div><strong>Prof<span>AI</span></strong><small>{c('Your next chapter')}</small></div>
        </motion.div>

        <div className="auth-showcase-content">
          <motion.h2 {...reveal(.2)}>{c('Make every')}<br />{' '}{c('step')} <span>{c('count.')}</span></motion.h2>
          <motion.p className="auth-showcase-description" {...reveal(.34)}>
            {c('Practice with purpose. Track your progress.')}<br className="auth-showcase-desktop-break" />{' '}{c('Plan what comes next.')}
          </motion.p>

          <motion.div className="auth-showcase-progress" {...reveal(.47, 42)}>
            <div className="auth-showcase-progress-label">{c('Your progress')} <span>· {c('Sample')}</span></div>
            <div className="auth-showcase-trends">
              {trends.map((trend, index) => <ScoreTrend key={trend.exam} trend={trend} minimalMotion={minimalMotion} delay={.57 + index * .18} />)}
            </div>
          </motion.div>

          <div className="auth-showcase-features">
            {features.map(({ icon: Icon, title }, index) => <motion.div className="auth-showcase-feature" key={title} {...reveal(.8 + index * .11, 20)}>
              <span className="auth-showcase-feature-icon"><Icon size={27} strokeWidth={1.9} /></span>
              <strong>{c(title)}</strong>
            </motion.div>)}
          </div>
        </div>
      </div>
    </aside>
  )
}
