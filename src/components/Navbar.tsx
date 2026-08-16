import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import {
  ChartBarIcon,
  BookOpenIcon,
  AcademicCapIcon,
  LanguageIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface NavbarProps {
  darkMode: boolean
  setDarkMode: (value: boolean) => void
  toggleLanguage: () => void
  currentLang: string
}

export default function Navbar({ darkMode, setDarkMode, toggleLanguage, currentLang }: NavbarProps) {
  const { t: _t } = useTranslation()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
    { name: 'Tests', href: '/tests', icon: BookOpenIcon },
    { name: 'SAT', href: '/sat', icon: AcademicCapIcon },
    { name: 'IELTS', href: '/ielts', icon: AcademicCapIcon },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard'
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="bg-slate-900/60 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-lg overflow-hidden transform transition-transform duration-300 group-hover:rotate-12 shadow-md">
                <img src="/logo.svg" alt="ProfAI Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent tracking-tight flex items-center">
                Prof<span className="text-blue-400">AI</span>
                <span className="ml-2 inline-block w-1 h-1 rounded-full bg-blue-400 animate-pulse" aria-hidden="true" />
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(item.href)
                    ? 'bg-white/10 text-white shadow-sm border border-white/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors duration-200 border border-transparent hover:border-white/5"
              title="Change Language"
            >
              <div className="flex items-center space-x-1">
                <LanguageIcon className="h-5 w-5" />
                <span className="text-xs font-bold">{currentLang.toUpperCase()}</span>
              </div>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors duration-200 border border-transparent hover:border-white/5"
              title="Toggle Theme"
            >
              {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>

            <Link
              to="/profile"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all duration-200"
            >
              <UserIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Profile</span>
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:bg-white/5"
            >
              {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 ${isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </div>
              </Link>
            ))}

            <div className="border-t border-white/10 pt-4 mt-4 space-y-2">
              <button
                onClick={toggleLanguage}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <LanguageIcon className="h-5 w-5" />
                <span>Language: {currentLang.toUpperCase()}</span>
              </button>

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <UserIcon className="h-5 w-5" />
                <span>Profile</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

