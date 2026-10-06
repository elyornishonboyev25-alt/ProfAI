import { NavLink } from 'react-router-dom'

export default function MistakeLabNavigation() {
  return (
    <nav aria-label="Mistake labs" className="flex gap-2 rounded-2xl border border-white/90 bg-white/75 p-2 backdrop-blur">
      {[
        { label: 'IELTS', path: '/analyze-mistakes' },
        { label: 'SAT', path: '/sat/mistakes' },
      ].map(({ label, path }) => (
        <NavLink key={path} to={path} className={({ isActive }) => `flex-1 rounded-xl px-4 py-3 text-center text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 ${isActive ? 'bg-red-600 text-white shadow-lg shadow-red-200/50' : 'text-slate-600 hover:bg-red-50 hover:text-red-700'}`}>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
