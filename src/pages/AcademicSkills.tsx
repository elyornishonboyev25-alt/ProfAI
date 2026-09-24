import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import StudyObject, { type StudyObjectKind } from '@/components/visuals/StudyObject'
import { useCopy } from '@/i18n/interface'
const resources: { title: string; description: string; path: string; object: StudyObjectKind }[] = [
  { title: 'Vocabulary', description: 'Review saved words and build lasting recall.', path: '/vocabulary', object: 'book' },
  { title: 'Articles', description: 'Read, discover new words, and understand more.', path: '/articles', object: 'book' },
  { title: 'Podcasts', description: 'Listen with transcripts at your own pace.', path: '/podcast', object: 'headphones' },
  { title: 'Shadowing', description: 'Repeat, record, and refine your pronunciation.', path: '/shadowing-lab', object: 'microphone' },
  { title: 'Writing practice', description: 'Develop clear, structured written answers.', path: '/writing-lab', object: 'notebook' },
  { title: 'Speaking practice', description: 'Practice expressing your ideas with confidence.', path: '/speaking-lab', object: 'microphone' },
]
export default function AcademicSkills() {
  const { c } = useCopy()
  return <div className="workspace-page liquid-page"><header className="liquid-page-heading"><Link to="/ielts" className="liquid-text-link">IELTS</Link><h1>{c('Build your English skills')}</h1><p>{c('Small exercises for the skills behind your score.')}</p></header>
    <div className="liquid-resource-grid">{resources.map(item => <Link key={item.path} to={item.path} className="glass-surface liquid-resource-card"><StudyObject kind={item.object} /><h2>{c(item.title)}</h2><p>{c(item.description)}</p><span className="liquid-text-link">{c('Open practice')}<ArrowRight size={17} /></span></Link>)}</div>
  </div>
}
