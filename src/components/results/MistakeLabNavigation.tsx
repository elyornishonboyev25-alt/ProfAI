import { BookOpen, NotebookPen } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import '@/styles/mistake-labs.css'

export default function MistakeLabNavigation() {
  return (
    <nav aria-label="Mistake labs" className="mlab-segment">
      {[
        { label: 'IELTS', path: '/analyze-mistakes', icon: BookOpen },
        { label: 'SAT', path: '/sat/mistakes', icon: NotebookPen },
      ].map(({ label, path, icon: Icon }) => (
        <NavLink key={path} to={path}>
          <Icon aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
