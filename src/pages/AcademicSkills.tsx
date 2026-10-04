import { Link } from 'react-router-dom'
import { ArrowUpRight, BookOpen, FileText, Headphones, Mic, type LucideIcon } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import './academic-skills.css'

const resources: { title: string; category: string; description: string; path: string; tone: string; icon: LucideIcon }[] = [
  { title: 'Vocabulary', category: 'Words & recall', description: 'Review saved words and build lasting recall.', path: '/vocabulary', tone: 'rose', icon: BookOpen },
  { title: 'Articles', category: 'Read & discover', description: 'Read, discover new words, and understand more.', path: '/articles', tone: 'blue', icon: FileText },
  { title: 'Podcasts', category: 'Listen & learn', description: 'Listen with transcripts at your own pace.', path: '/podcast', tone: 'violet', icon: Headphones },
  { title: 'Shadowing', category: 'Speak & refine', description: 'Repeat, record, and refine your pronunciation.', path: '/shadowing-lab', tone: 'teal', icon: Mic },
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
        {resources.map((item, index) => {
          const Icon = item.icon
          return (
            <Link key={item.path} to={item.path} className={`glass-surface academic-focus-card academic-focus-card--${item.tone}`}>
              <div className="academic-focus-card-top" aria-hidden="true">
                <span className="academic-focus-icon"><Icon size={25} strokeWidth={1.6} /></span>
                <span className="academic-focus-index">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <span className="academic-focus-category">{c(item.category)}</span>
              <h2>{c(item.title)}</h2>
              <p>{c(item.description)}</p>
              <span className="academic-focus-action">{c('Open practice')}<ArrowUpRight size={18} aria-hidden="true" /></span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
