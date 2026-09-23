import { Link } from 'react-router-dom'
import { useState } from 'react'
import UniversityMatcher from '@/components/admission/UniversityMatcher'
import { ArrowRight, Bookmark, BookOpen, Search } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
export default function Admission() {
  const { c } = useCopy()
  const [matcherOpen, setMatcherOpen] = useState(false)
  return <div className="workspace-page liquid-page">
    <UniversityMatcher open={matcherOpen} onClose={() => setMatcherOpen(false)} />
    <header className="liquid-page-heading"><p className="liquid-eyebrow">{c('University Applications')}</p><h1>{c('Find a place for your ambitions.')}</h1><p>{c('Research your options and keep your next steps together.')}</p></header>
    <section className="glass-surface liquid-admission-hero"><div><p className="liquid-eyebrow">{c('Your university journey')}</p><h2>{c('Find your university')}</h2><p>{c('Explore universities, save your shortlist, and understand the application process.')}</p><Link to="/admission/universities" className="liquid-button primary">{c('Search universities')}<ArrowRight size={18} /></Link></div><img src="/assets/admission/campus-hero.webp" alt="" /></section>
    <button className="liquid-button secondary mt-5" onClick={() => setMatcherOpen(true)}>{c('Find my university')}</button>
    <div className="liquid-resource-grid">{[
      { title: 'Universities', description: 'Compare destinations and discover university profiles.', path: '/admission/universities', icon: Search },
      { title: 'My shortlist', description: 'Return to the universities you have saved.', path: '/admission/shortlist', icon: Bookmark },
      { title: 'Learn the application process', description: 'Follow the existing lessons, from research to preparation.', path: '/admission/lessons', icon: BookOpen },
    ].map(item => <Link key={item.path} to={item.path} className="glass-surface liquid-resource-card"><span className="liquid-feature-icon"><item.icon size={24} /></span><h2>{c(item.title)}</h2><p>{c(item.description)}</p><span className="liquid-text-link">{c('Explore')}<ArrowRight size={17} /></span></Link>)}</div>
  </div>
}
