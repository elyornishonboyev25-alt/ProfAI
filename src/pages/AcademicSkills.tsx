import { Link } from 'react-router-dom'
import { ArrowUpRight, Check } from 'lucide-react'
import StudyObject, { type StudyObjectKind } from '@/components/visuals/StudyObject'
import { useCopy } from '@/i18n/interface'
import './academic-skills.css'

const resources: {
  title: string
  category: string
  description: string
  path: string
  object: StudyObjectKind
  tone: string
  detail: string
  caption?: string
}[] = [
  { title: 'Vocabulary', category: 'Words & recall', description: 'Review saved words and build lasting recall.', path: '/vocabulary', object: 'book', tone: 'rose', caption: 'Word collection', detail: 'Recall' },
  { title: 'Articles', category: 'Read & discover', description: 'Read, discover new words, and understand more.', path: '/articles', object: 'notebook', tone: 'blue', caption: 'Read & discover', detail: 'New perspectives' },
  { title: 'Podcasts', category: 'Listen & learn', description: 'Listen with transcripts at your own pace.', path: '/podcast', object: 'headphones', tone: 'violet', detail: 'Audio + transcript' },
  { title: 'Shadowing', category: 'Speak & refine', description: 'Repeat, record, and refine your pronunciation.', path: '/shadowing-lab', object: 'microphone', tone: 'teal', detail: 'Listen · repeat' },
]

export default function AcademicSkills() {
  const { c } = useCopy()
  return (
    <div className="workspace-page liquid-page">
      <header className="liquid-page-heading">
        <p className="liquid-eyebrow">{c('Study tools')}</p>
        <h1>{c('Build your English skills')}</h1>
        <p>{c('Small exercises for the skills behind your score.')}</p>
      </header>
      <div className="liquid-resource-grid academic-skills-grid">
        {resources.map((item, index) => (
          <Link key={item.path} to={item.path} className={`glass-surface academic-glass-card academic-glass-card--${item.tone}`}>
            <div className="academic-glass-art" aria-hidden="true">
              <div className="academic-glass-art-heading">
                <span className="academic-glass-tag"><span />{c('Academic Skills')}</span>
                <span className="academic-glass-index">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <span className="academic-glass-orbit" />
              <StudyObject kind={item.object} className="academic-glass-object" />
              <span className="academic-glass-float">
                {item.caption ? <>{item.object === 'book' && <b>Aa</b>}{c(item.caption)}</> : (
                  <span className="academic-glass-wave">
                    {[7, 13, 19, 11, 22, 15, 9, 17, 11].map((height, waveIndex) => <i key={waveIndex} style={{ height }} />)}
                  </span>
                )}
              </span>
              <span className="academic-glass-float academic-glass-float-right">
                {c(item.detail)}{item.object !== 'headphones' && <Check size={12} />}
              </span>
            </div>
            <div className="academic-glass-body">
              <span className="academic-glass-category">{c(item.category)}</span>
              <h2>{c(item.title)}</h2>
              <p>{c(item.description)}</p>
              <span className="academic-glass-action">{c('Open practice')}<span><ArrowUpRight size={18} aria-hidden="true" /></span></span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
