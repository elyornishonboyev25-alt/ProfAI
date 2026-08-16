import { Link } from 'react-router-dom'
import { Mail, Phone, Send, MapPin, Instagram } from 'lucide-react'
import { Reveal } from '@/components/fx'

const socials = [
  { label: 'Email', href: 'mailto:elyornishonboyev000@gmail.com', icon: Mail },
  { label: 'Telegram', href: 'https://t.me/Prof_AI', icon: Send },
  { label: 'Instagram', href: 'https://instagram.com/proff_ai', icon: Instagram },
  { label: 'Phone', href: 'tel:+998774813060', icon: Phone },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative w-full overflow-hidden border-t border-blue-100/80 bg-white/95">
      {/* gradient top accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />

      <Reveal>
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-900">
              Prof<span className="text-gradient-red">AI</span>
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your all-in-one platform to study abroad — exam prep, English skills and admission guidance that take you to top universities worldwide.
            </p>
            <div className="mt-4 flex items-center gap-2">
              {socials.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target={social.href.startsWith('http') ? '_blank' : undefined}
                    rel={social.href.startsWith('http') ? 'noreferrer' : undefined}
                    aria-label={social.label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-white text-blue-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-[0_8px_18px_rgba(37,99,235,0.18)]"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                )
              })}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-700">Platform</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link to="/tests" className="transition-colors hover:text-blue-700">Practice Tests</Link></li>
              <li><Link to="/mock" className="transition-colors hover:text-blue-700">Mock Arena</Link></li>
              <li><Link to="/speaking-community" className="transition-colors hover:text-blue-700">Speaking Community</Link></li>
              <li><Link to="/shadowing-lab" className="transition-colors hover:text-blue-700">Shadowing Lab</Link></li>
              <li><Link to="/vocabulary" className="transition-colors hover:text-blue-700">Vocabulary Arena</Link></li>
              <li><Link to="/articles" className="transition-colors hover:text-blue-700">Articles</Link></li>
              <li><Link to="/admission" className="transition-colors hover:text-blue-700">Study Abroad</Link></li>
              <li><Link to="/leaderboard" className="transition-colors hover:text-blue-700">Leaderboard</Link></li>
              <li><Link to="/profile" className="transition-colors hover:text-blue-700">Performance</Link></li>
              <li><Link to="/ielts" className="transition-colors hover:text-blue-700">IELTS Modules</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-700">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link to="/about" className="transition-colors hover:text-blue-700">About</Link></li>
              <li><Link to="/login" className="transition-colors hover:text-blue-700">Sign In</Link></li>
              <li><Link to="/sat" className="transition-colors hover:text-blue-700">SAT Track</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-700">Contact</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="inline-flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-blue-500" />
                elyornishonboyev000@gmail.com
              </li>
              <li className="inline-flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-blue-500" />
                +998 77 481 30 60
              </li>
              <li>
                <a
                  href="https://t.me/Prof_AI"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-blue-700"
                >
                  <Send className="h-3.5 w-3.5 text-blue-500" />
                  t.me/Prof_AI
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/proff_ai"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-blue-700"
                >
                  <Instagram className="h-3.5 w-3.5 text-blue-500" />
                  @proff_ai
                </a>
              </li>
              <li className="inline-flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-blue-500" />
                Uzb, Jizzax, Zomin
              </li>
            </ul>
          </div>
        </div>
      </Reveal>

      <div className="border-t border-blue-100 py-4 text-center text-sm text-slate-500">
        &copy; {currentYear} ProfAI. All rights reserved.
      </div>
    </footer>
  )
}
