import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const languages = [{ code: 'en', label: 'English', detail: 'English' }, { code: 'ru', label: 'Русский', detail: 'Russian' }, { code: 'uz', label: 'O‘zbekcha', detail: 'Uzbek' }]
export default function LanguageSelector() {
  const { i18n } = useTranslation()
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const id = useId()
  const active = languages.find(item => item.code === i18n.language) || languages[0]
  const title = active.code === 'uz' ? 'Interfeys tili' : active.code === 'ru' ? 'Язык интерфейса' : 'Interface language'
  function close(restoreFocus = false) { setPosition(null); if (restoreFocus) trigger.current?.focus() }
  function open() {
    const rect = trigger.current!.getBoundingClientRect()
    setPosition({ left: Math.max(12, Math.min(rect.left, innerWidth - 236)), top: rect.bottom + 220 > innerHeight ? Math.max(12, rect.top - 220) : rect.bottom + 8 })
  }
  useEffect(() => {
    if (!position) return
    menu.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus()
    const outside = (event: PointerEvent) => { if (!menu.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) close() }
    const reposition = () => close()
    document.addEventListener('pointerdown', outside)
    window.addEventListener('resize', reposition)
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', reposition) }
  }, [position])
  return <div className="liquid-language">
    <button ref={trigger} className="language-trigger" type="button" aria-label={`${title}: ${active.label}`} aria-haspopup="menu" aria-expanded={Boolean(position)} aria-controls={position ? id : undefined} onClick={() => position ? close() : open()} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open() } }}>
      <Languages size={17} aria-hidden="true" /><span>{active.label}</span><ChevronDown size={14} aria-hidden="true" />
    </button>
    {position && createPortal(<div ref={menu} id={id} role="menu" aria-label={title} className="language-menu" style={position} onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); close(true) }
      if (event.key === 'Tab') close()
      if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
        event.preventDefault()
        const options = [...menu.current!.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')]
        const index = options.indexOf(document.activeElement as HTMLButtonElement)
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
        options[next]?.focus()
      }
    }}><p>{title}</p>{languages.map(item => <button type="button" role="menuitemradio" aria-checked={active.code === item.code} key={item.code} onClick={() => { void i18n.changeLanguage(item.code); close(true) }}><span><strong>{item.label}</strong><small>{item.detail}</small></span>{active.code === item.code && <Check size={17} />}</button>)}</div>, document.body)}
  </div>
}
