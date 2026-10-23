import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'

type Option = { value: string; label: string }

export default function SATBankSelect({ label, value, options, onChange }: {
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
}) {
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const search = useRef({ text: '', at: 0 })
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const selected = Math.max(0, options.findIndex(option => option.value === value))
  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])
  useEffect(() => {
    if (open) root.current?.querySelector('[data-active="true"]')?.scrollIntoView?.({ block: 'nearest' })
  }, [open, active])
  const choose = (index: number) => {
    onChange(options[index].value)
    setOpen(false)
    trigger.current?.focus()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const key = event.key
    if (key === 'Escape' || key === 'Tab') {
      setOpen(false)
      if (key === 'Escape') event.preventDefault()
      return
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(key)) {
      event.preventDefault()
      if (open && (key === 'Enter' || key === ' ')) return choose(active)
      setOpen(true)
      setActive(key === 'Home' ? 0 : key === 'End' ? options.length - 1 : !open ? selected :
        (active + (key === 'ArrowUp' ? -1 : 1) + options.length) % options.length)
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now()
      const query = (now - search.current.at < 700 ? search.current.text : '') + key.toLowerCase()
      search.current = { text: query, at: now }
      const match = options.findIndex(option => option.label.toLowerCase().startsWith(query))
      if (match >= 0) { setOpen(true); setActive(match) }
    }
  }
  return <div className="sat-bank-select" ref={root} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false)
  }}>
    <label htmlFor={id}>{label}</label>
    <button ref={trigger} id={id} type="button" role="combobox" aria-label={label}
      aria-expanded={open} aria-haspopup="listbox" aria-controls={`${id}-options`}
      aria-activedescendant={open ? `${id}-option-${active}` : undefined}
      className="sat-bank-select-trigger" onKeyDown={onKeyDown}
      onClick={() => { setActive(selected); setOpen(!open) }}>
      <span>{options[selected]?.label}</span><ChevronDown size={18} aria-hidden="true" />
    </button>
    {open ? <div id={`${id}-options`} role="listbox" aria-label={label} className="sat-bank-select-options">
      {options.map((option, index) => <div key={option.value} id={`${id}-option-${index}`}
        role="option" aria-selected={value === option.value} data-active={index === active}
        onMouseDown={event => event.preventDefault()} onMouseMove={() => setActive(index)}
        onClick={() => choose(index)}>
        <span>{option.label}</span>{value === option.value ? <Check size={18} aria-hidden="true" /> : null}
      </div>)}
    </div> : null}
  </div>
}
