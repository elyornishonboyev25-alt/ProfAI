import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  AudioLines,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronDown,
  Copy,
  GraduationCap,
  ImagePlus,
  Languages,
  Lock,
  Menu,
  MessageSquare,
  Mic,
  PanelLeftClose,
  Pencil,
  PenLine,
  Search,
  Settings2,
  ShieldCheck,
  Sigma,
  Sparkles,
  SquarePen,
  Square,
  Target,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import AiMessageContent from './AiMessageContent'
import CoachMascot from './CoachMascot'
import CoachConnectionStatus from './CoachConnectionStatus'
import { useAiTutor } from './useAiTutor'
import { useSpeechRecognition } from '@/lib/speech'
import { useAiAssistantStore, type AiAssistantThread } from '@/store/aiAssistantStore'
import { useAccountAccess } from '@/features/billing/useAccountAccess'
import { useBillingStore } from '@/features/billing/store'
import { remainingPercent } from '@/features/billing/studyResources'
import { useAuthStore } from '@/store/authStore'
import { useCopy } from '@/i18n/interface'
import { premiumLanguage, type PremiumLanguage } from '@/i18n/premium'
import { coachCopy } from '@/services/ai/coachPreferences'
import { AI_WORKSPACES, type AiWorkspaceId } from '@/services/ai/workspaces'
import './ai-tutor-workspace.css'

const COPY = {
  en: {
    dictate: 'Dictate', stopDictation: 'Stop dictation', listening: 'Listening… tap to stop', dictationUnsupported: 'Dictation needs Chrome, Edge or Safari.',
    micError: 'Microphone is unavailable. Allow microphone access in the address bar and try again.',
    title: 'AI Tutor', newChat: 'New chat', search: 'Search chats', noChats: 'Your conversations will appear here.', noMatch: 'No chats match your search.', loading: 'Loading chats…',
    today: 'Today', yesterday: 'Yesterday', week: 'Previous 7 days', month: 'Previous 30 days', older: 'Older',
    hero: 'What should we work on today?', heroDetail: 'Review your practice tests, get any SAT or IELTS question explained, practise new questions, or study vocabulary.',
    placeholder: 'Ask about your tests, any SAT or IELTS question, or vocabulary', followUp: 'Ask a follow-up…', sensitive: 'Don’t share any sensitive information.',
    left: 'left', unlimited: 'Unlimited', balance: 'AI balance remaining', talk: 'Talk', attach: 'Attach image', voice: 'Voice', send: 'Send', stop: 'Stop response',
    rename: 'Rename chat', remove: 'Delete chat', deleteTitle: 'Delete this chat?', deleteDetail: 'This conversation will be removed from your account. This cannot be undone.', deleteConfirm: 'Delete chat', cancel: 'Cancel',
    settings: 'Tutor settings', memory: 'Memory', memoryHint: 'Say “Remember that…” and Nova will use important goals and preferences in future chats.', noMemory: 'No saved memories yet.', forget: 'Forget memory',
    openChats: 'Open chats', closeChats: 'Close chats', copy: 'Copy', copied: 'Copied', thinking: 'Thinking…', permission: 'Your permission', allow: 'Allow', dismiss: 'Dismiss', stopped: 'Response stopped',
    latest: 'Jump to latest', drop: 'Drop your image here', removeImage: 'Remove image', speak: 'Speak now…', enableMic: 'Enable microphone', messages: 'messages', message: 'message',
    signIn: 'Sign in to chat with your AI tutor', signInDetail: 'Nova explains SAT and IELTS questions step by step and remembers your goals.', signInCta: 'Sign in',
    premium: 'Unlock your AI tutor', premiumDetail: 'Get step-by-step explanations, personal study plans and live voice practice with IvyGoo Pro.', premiumCta: 'See plans',
    chips: [
      { label: 'How am I doing?', prompt: 'How am I doing? Review my recent IELTS and SAT results and tell me the one thing to focus on next.' },
      { label: 'Review my mistakes', prompt: 'Look at my recent mistakes and build a short review plan, starting with the topic I miss most often.' },
      { label: 'Teach me a skill', prompt: 'Teach me one SAT or IELTS skill I am weak at, with a short example and one practice question.' },
      { label: 'Vocabulary check', prompt: 'Give me a quick five-word vocabulary check that fits my level, then explain my answers.' },
    ],
  },
  uz: {
    dictate: 'Ovoz bilan yozish', stopDictation: 'Diktovkani to‘xtatish', listening: 'Tinglayapman… to‘xtatish uchun bosing', dictationUnsupported: 'Ovoz bilan yozish uchun Chrome, Edge yoki Safari kerak.',
    micError: 'Mikrofon ishlamayapti. Manzil satridan mikrofonga ruxsat bering va qayta urinib ko‘ring.',
    title: 'AI Tutor', newChat: 'Yangi chat', search: 'Chatlarni qidirish', noChats: 'Suhbatlaringiz shu yerda paydo bo‘ladi.', noMatch: 'Qidiruvga mos chat yo‘q.', loading: 'Chatlar yuklanmoqda…',
    today: 'Bugun', yesterday: 'Kecha', week: 'Oxirgi 7 kun', month: 'Oxirgi 30 kun', older: 'Avvalroq',
    hero: 'Bugun nima ustida ishlaymiz?', heroDetail: 'Testlaringizni tahlil qiling, istalgan SAT yoki IELTS savolini tushuntirib oling, yangi savollar yeching yoki lug‘at o‘rganing.',
    placeholder: 'Testlaringiz, istalgan SAT yoki IELTS savoli yoki lug‘at haqida so‘rang', followUp: 'Davomini so‘rang…', sensitive: 'Maxfiy ma’lumotlarni yubormang.',
    left: 'qoldi', unlimited: 'Cheksiz', balance: 'Qolgan AI balansi', talk: 'Gaplashish', attach: 'Rasm biriktirish', voice: 'Ovoz', send: 'Yuborish', stop: 'Javobni to‘xtatish',
    rename: 'Nomini o‘zgartirish', remove: 'Chatni o‘chirish', deleteTitle: 'Chat o‘chirilsinmi?', deleteDetail: 'Bu suhbat hisobingizdan butunlay o‘chiriladi. Uni qaytarib bo‘lmaydi.', deleteConfirm: 'Chatni o‘chirish', cancel: 'Bekor qilish',
    settings: 'Tutor sozlamalari', memory: 'Xotira', memoryHint: '“Eslab qol…” deb ayting — Nova muhim maqsad va afzalliklaringizni keyingi chatlarda ham eslaydi.', noMemory: 'Hali saqlangan xotira yo‘q.', forget: 'Xotirani o‘chirish',
    openChats: 'Chatlarni ochish', closeChats: 'Chatlarni yopish', copy: 'Nusxa', copied: 'Nusxalandi', thinking: 'O‘ylayapti…', permission: 'Ruxsatingiz', allow: 'Ruxsat berish', dismiss: 'Bekor qilish', stopped: 'Javob to‘xtatildi',
    latest: 'Oxirgi xabarga', drop: 'Rasmni shu yerga tashlang', removeImage: 'Rasmni olib tashlash', speak: 'Gapiring…', enableMic: 'Mikrofonni yoqish', messages: 'xabar', message: 'xabar',
    signIn: 'AI tutor bilan suhbat uchun kiring', signInDetail: 'Nova SAT va IELTS savollarini bosqichma-bosqich tushuntiradi va maqsadlaringizni eslab qoladi.', signInCta: 'Kirish',
    premium: 'AI tutorni oching', premiumDetail: 'IvyGoo Pro bilan bosqichma-bosqich tushuntirishlar, shaxsiy reja va jonli ovozli mashg‘ulotlar.', premiumCta: 'Tariflarni ko‘rish',
    chips: [
      { label: 'Natijalarim qanday?', prompt: 'Natijalarim qanday? Oxirgi IELTS va SAT natijalarimni tahlil qilib, keyingi qadamda nimaga e’tibor berishimni ayt.' },
      { label: 'Xatolarimni tahlil qil', prompt: 'Oxirgi xatolarimni ko‘rib chiq va eng ko‘p xato qiladigan mavzudan boshlab qisqa takrorlash rejasini tuz.' },
      { label: 'Bitta ko‘nikma o‘rgat', prompt: 'Men zaif bo‘lgan bitta SAT yoki IELTS ko‘nikmasini qisqa misol va bitta mashq savoli bilan o‘rgat.' },
      { label: 'Lug‘at tekshiruvi', prompt: 'Darajamga mos 5 ta so‘zdan iborat qisqa lug‘at tekshiruvini ber, keyin javoblarimni tushuntir.' },
    ],
  },
  ru: {
    dictate: 'Диктовка', stopDictation: 'Остановить диктовку', listening: 'Слушаю… нажмите, чтобы остановить', dictationUnsupported: 'Для диктовки нужен Chrome, Edge или Safari.',
    micError: 'Микрофон недоступен. Разрешите доступ в адресной строке и повторите попытку.',
    title: 'AI Tutor', newChat: 'Новый чат', search: 'Поиск чатов', noChats: 'Здесь появятся ваши разговоры.', noMatch: 'Нет чатов по запросу.', loading: 'Загрузка чатов…',
    today: 'Сегодня', yesterday: 'Вчера', week: 'Последние 7 дней', month: 'Последние 30 дней', older: 'Ранее',
    hero: 'Над чем поработаем сегодня?', heroDetail: 'Разберите свои тесты, получите объяснение любого вопроса SAT или IELTS, решайте новые задания или учите слова.',
    placeholder: 'Спросите о своих тестах, любом вопросе SAT или IELTS или о словах', followUp: 'Задайте уточняющий вопрос…', sensitive: 'Не делитесь конфиденциальной информацией.',
    left: 'осталось', unlimited: 'Безлимит', balance: 'Остаток баланса AI', talk: 'Голос', attach: 'Прикрепить изображение', voice: 'Голос', send: 'Отправить', stop: 'Остановить ответ',
    rename: 'Переименовать чат', remove: 'Удалить чат', deleteTitle: 'Удалить этот чат?', deleteDetail: 'Разговор будет удалён из вашего аккаунта без возможности восстановления.', deleteConfirm: 'Удалить чат', cancel: 'Отмена',
    settings: 'Настройки тьютора', memory: 'Память', memoryHint: 'Скажите «Запомни…», и Нова будет учитывать ваши цели и предпочтения в следующих чатах.', noMemory: 'Пока нет сохранённых записей.', forget: 'Удалить запись',
    openChats: 'Открыть чаты', closeChats: 'Закрыть чаты', copy: 'Копировать', copied: 'Скопировано', thinking: 'Думаю…', permission: 'Ваше разрешение', allow: 'Разрешить', dismiss: 'Отклонить', stopped: 'Ответ остановлен',
    latest: 'К последнему', drop: 'Перетащите изображение сюда', removeImage: 'Удалить изображение', speak: 'Говорите…', enableMic: 'Включить микрофон', messages: 'сообщ.', message: 'сообщ.',
    signIn: 'Войдите, чтобы общаться с AI-тьютором', signInDetail: 'Нова пошагово объясняет вопросы SAT и IELTS и помнит ваши цели.', signInCta: 'Войти',
    premium: 'Откройте AI-тьютора', premiumDetail: 'Пошаговые объяснения, личный план и живая голосовая практика в IvyGoo Pro.', premiumCta: 'Тарифы',
    chips: [
      { label: 'Как мои успехи?', prompt: 'Как мои успехи? Разбери мои последние результаты IELTS и SAT и скажи, на чём сосредоточиться дальше.' },
      { label: 'Разбор ошибок', prompt: 'Посмотри мои последние ошибки и составь короткий план повторения, начиная с самой частой темы.' },
      { label: 'Научи навыку', prompt: 'Научи меня одному навыку SAT или IELTS, где я слаб, с коротким примером и одним заданием.' },
      { label: 'Проверка слов', prompt: 'Дай мне быструю проверку из пяти слов под мой уровень, затем объясни мои ответы.' },
    ],
  },
} as const

const CHIP_ICONS = [TrendingUp, Target, BookOpen, Languages]
const WORKSPACE_ICONS: Record<AiWorkspaceId, typeof BrainCircuit> = {
  general: BrainCircuit, ielts: PenLine, sat: Sigma, english: BookOpen, admission: GraduationCap,
}
const DEFAULT_TITLES = ['New chat', 'Yangi chat', 'Новый чат', 'Previous conversation']

// Group like a professional chat app: newest first, by calendar distance.
function groupThreads(threads: AiAssistantThread[], text: (typeof COPY)[PremiumLanguage]) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const day = 86_400_000
  const groups: Array<{ label: string; threads: AiAssistantThread[] }> = []
  for (const thread of threads) {
    const age = startOfToday.getTime() - new Date(thread.updatedAt).getTime()
    const label = age <= 0 ? text.today : age <= day ? text.yesterday : age <= 7 * day ? text.week : age <= 30 * day ? text.month : text.older
    const group = groups.find((item) => item.label === label)
    if (group) group.threads.push(thread)
    else groups.push({ label, threads: [thread] })
  }
  return groups
}

function CopyAnswer({ text, labels }: { text: string; labels: { copy: string; copied: string } }) {
  const [copied, setCopied] = useState(false)
  return <button type="button" className="tutor-message-action" onClick={() => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    })
  }}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? labels.copied : labels.copy}</button>
}

// A styled listbox in place of the native select, so the subject picker
// matches the composer instead of the operating system menu.
function FocusMenu({ value, label, options, onChange, openUp }: {
  value: AiWorkspaceId
  label: string
  options: Array<{ id: AiWorkspaceId; title: string; detail: string }>
  onChange: (id: AiWorkspaceId) => void
  openUp: boolean
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement | null>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const list = useRef<HTMLUListElement | null>(null)
  const current = options.find((option) => option.id === value) ?? options[0]
  const Icon = WORKSPACE_ICONS[current.id]
  useEffect(() => {
    if (!open) return
    list.current?.focus()
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])
  const show = () => {
    setActive(Math.max(0, options.findIndex((option) => option.id === value)))
    setOpen(true)
  }
  const choose = (id: AiWorkspaceId) => {
    onChange(id)
    setOpen(false)
    trigger.current?.focus()
  }
  return <div ref={root} className={`tutor-focus ${open ? 'is-open' : ''}`}>
    <button ref={trigger} type="button" className="tutor-focus-trigger" aria-label={`${label}: ${current.title}`} aria-haspopup="listbox" aria-expanded={open}
      onClick={() => open ? setOpen(false) : show()}
      onKeyDown={(event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show() } }}>
      <Icon size={15} aria-hidden="true" /><span>{current.title}</span><ChevronDown size={14} aria-hidden="true" />
    </button>
    {open ? <ul ref={list} role="listbox" tabIndex={-1} aria-label={label} aria-activedescendant={`tutor-focus-${options[active].id}`}
      className={`tutor-focus-menu ${openUp ? 'is-up' : ''}`}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') { event.preventDefault(); setActive((index) => (index + 1) % options.length) }
        else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((index) => (index + options.length - 1) % options.length) }
        else if (event.key === 'Home') { event.preventDefault(); setActive(0) }
        else if (event.key === 'End') { event.preventDefault(); setActive(options.length - 1) }
        else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(options[active].id) }
        else if (event.key === 'Escape' || event.key === 'Tab') { event.stopPropagation(); setOpen(false); if (event.key === 'Escape') trigger.current?.focus() }
      }}>
      <li className="tutor-focus-heading" role="presentation">{label}</li>
      {options.map((option, index) => {
        const OptionIcon = WORKSPACE_ICONS[option.id]
        return <li key={option.id} id={`tutor-focus-${option.id}`} role="option" aria-selected={option.id === value}
          data-active={index === active} onPointerEnter={() => setActive(index)} onClick={() => choose(option.id)}>
          <span className="tutor-focus-icon"><OptionIcon size={16} /></span>
          <span className="tutor-focus-copy"><b>{option.title}</b><small>{option.detail}</small></span>
          {option.id === value ? <Check size={16} className="tutor-focus-check" /> : null}
        </li>
      })}
    </ul> : null}
  </div>
}

function TutorBalance({ text }: { text: (typeof COPY)[PremiumLanguage] }) {
  const user = useAuthStore((state) => state.user)
  const access = useAccountAccess()
  const { wallet, userId } = useBillingStore()
  const usage = userId === user?.id ? wallet?.usage?.ai : undefined
  const unlimited = access?.active && access.kind === 'UNLIMITED'
  const percent = unlimited ? 100 : usage ? remainingPercent(usage.used, usage.limit) : null
  if (percent === null) return null
  return <div className="tutor-balance" role="progressbar" aria-label={text.balance} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
    <span className="tutor-balance-meter"><i className={percent <= 15 ? 'is-low' : ''} style={{ width: `${percent}%` }} /></span>
    <span>{unlimited ? text.unlimited : `${percent}% ${text.left}`}</span>
  </div>
}

export default function AITutorWorkspace() {
  const { language } = useCopy()
  const locale = premiumLanguage(language)
  const text = COPY[locale]
  const coachText = coachCopy(language)
  const reducedMotion = useReducedMotion()
  const openTalk = useAiAssistantStore((state) => state.openTalk)
  const setWorkspace = useAiAssistantStore((state) => state.setActiveWorkspace)
  const {
    user, hasPremium, messages, isSending, error,
    draft, setDraft, images, addImages, removeImage,
    send, cancelSend, preferredName,
    workspace, pendingActions, approveAction, dismissAction,
    voiceState, voiceLevel, voiceSupported, isListening, interimTranscript, startVoice, voiceError,
    chatThreads, activeThread, activeThreadId, threadsLoading, memories,
    createNewChat, selectChat, renameChat, deleteChat, forgetMemory,
  } = useAiTutor()

  const [railOpen, setRailOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null)
  const [creating, setCreating] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [showJump, setShowJump] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const followLatest = useRef(true)

  const titleOf = (title: string) => DEFAULT_TITLES.includes(title) ? text.newChat : title
  const savedChats = chatThreads.filter((thread) => thread.messages.length > 0)
  const visibleChats = query.trim()
    ? savedChats.filter((thread) => titleOf(thread.title).toLowerCase().includes(query.trim().toLowerCase()))
    : savedChats
  const groups = useMemo(() => groupThreads(visibleChats, text), [visibleChats, text])
  const empty = messages.length === 0

  useEffect(() => {
    followLatest.current = true
    setShowJump(false)
  }, [activeThreadId])
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !followLatest.current) return
    const frame = window.requestAnimationFrame(() => viewport.scrollTo({ top: viewport.scrollHeight }))
    return () => window.cancelAnimationFrame(frame)
  }, [messages, isSending])
  useEffect(() => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 220)}px`
  }, [draft])
  useEffect(() => {
    if (!railOpen && !settingsOpen) return
    const close = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setRailOpen(false)
      setSettingsOpen(false)
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [railOpen, settingsOpen])

  // Dictation writes speech into the draft live; nothing is sent until the learner sends it.
  const dictation = useSpeechRecognition(locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US')
  const dictationBase = useRef<string | null>(null)
  const [dictationError, setDictationError] = useState('')
  const joinDraft = (base: string, spoken: string) => [base.trimEnd(), spoken].filter(Boolean).join(base.trim() && spoken ? ' ' : '')
  useEffect(() => {
    if (dictationBase.current === null || !dictation.listening) return
    setDraft(joinDraft(dictationBase.current, `${dictation.finalTranscript} ${dictation.interimTranscript}`.trim()))
  }, [dictation.finalTranscript, dictation.interimTranscript, dictation.listening, setDraft])
  useEffect(() => {
    if (dictation.error) setDictationError(text.micError)
  }, [dictation.error, text.micError])
  // Leaving the page releases the microphone.
  const stopDictation = dictation.stop
  useEffect(() => () => { if (dictationBase.current !== null) void stopDictation() }, [stopDictation])
  const finishDictation = async () => {
    const base = dictationBase.current ?? ''
    dictationBase.current = null
    const spoken = (await dictation.stop()).trim()
    const next = joinDraft(base, spoken)
    setDraft(next)
    return next
  }
  const toggleDictation = async () => {
    setDictationError('')
    if (dictation.listening) {
      await finishDictation()
      textareaRef.current?.focus()
      return
    }
    if (!dictation.supported) {
      setDictationError(text.dictationUnsupported)
      return
    }
    dictation.reset()
    dictationBase.current = draft
    dictation.start()
  }

  const submit = async (value?: string) => {
    followLatest.current = true
    setShowJump(false)
    if (!value && dictation.listening) {
      const text = await finishDictation()
      if (text.trim()) void send({ text })
      return
    }
    void send(value ? { text: value } : undefined)
  }
  const startNewChat = async () => {
    if (creating || threadsLoading) return
    setCreating(true)
    try {
      await createNewChat()
      setRailOpen(false)
      window.requestAnimationFrame(() => textareaRef.current?.focus())
    } finally {
      setCreating(false)
    }
  }
  const finishRename = () => {
    if (editing?.title.trim()) void renameChat(editing.id, editing.title)
    setEditing(null)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter adds a new line.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }
  const onPaste = (event: ClipboardEvent) => {
    const files = Array.from(event.clipboardData?.items ?? [])
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null)
    if (!files.length) return
    event.preventDefault()
    void addImages(files)
  }
  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    if (event.dataTransfer?.files?.length) void addImages(event.dataTransfer.files)
  }

  if (!user || !hasPremium) {
    return <main className="workspace-page tutor-page tutor-page--locked">
      <section className="tutor-locked">
        <span className="tutor-locked-mascot"><CoachMascot state="idle" level={0} size={96} /></span>
        <span className="tutor-kicker"><Lock size={13} /> {text.title}</span>
        <h1>{user ? text.premium : text.signIn}</h1>
        <p>{user ? text.premiumDetail : text.signInDetail}</p>
        <Link className="tutor-primary" to={user ? '/premium' : '/login'}>{user ? text.premiumCta : text.signInCta}<ArrowRight size={16} /></Link>
      </section>
    </main>
  }

  const composer = <div className={`tutor-composer ${empty ? 'is-hero' : ''}`}>
    {images.length ? <div className="tutor-attachments">
      {images.map((src, index) => <span key={index}>
        <img src={src} alt="" />
        <button type="button" aria-label={text.removeImage} onClick={() => removeImage(index)}><X size={12} /></button>
      </span>)}
    </div> : null}
    {isListening ? <p className="tutor-listening">{interimTranscript || text.speak}</p> : null}
    <textarea
      ref={textareaRef}
      rows={1}
      value={draft}
      aria-label={text.placeholder}
      placeholder={empty ? text.placeholder : text.followUp}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      disabled={threadsLoading}
    />
    <div className="tutor-composer-bar">
      <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={(event) => {
        if (event.target.files?.length) void addImages(event.target.files)
        event.target.value = ''
      }} />
      <button type="button" className="tutor-icon-button" aria-label={text.attach} title={text.attach} disabled={isSending} onClick={() => fileInputRef.current?.click()}><ImagePlus size={18} /></button>
      <button type="button" className={`tutor-icon-button tutor-dictate ${dictation.listening ? 'is-listening' : ''}`}
        aria-pressed={dictation.listening} aria-label={dictation.listening ? text.stopDictation : text.dictate} title={dictation.listening ? text.stopDictation : text.dictate}
        disabled={isSending} onClick={() => void toggleDictation()}>{dictation.listening ? <Square size={14} /> : <Mic size={18} />}</button>
      {dictation.listening ? <span className="tutor-dictating" role="status"><i /><i /><i />{text.listening}</span> : null}
      <FocusMenu value={workspace.id} label={coachText.focus} onChange={setWorkspace} openUp={!empty}
        options={AI_WORKSPACES.map(({ id }) => ({ id, title: coachText[id], detail: coachText[`${id}Detail`] }))} />
      <button
        type="button"
        className={`tutor-send ${isSending ? 'is-stop' : ''}`}
        aria-label={isSending ? text.stop : text.send}
        disabled={!isSending && (threadsLoading || (!draft.trim() && images.length === 0))}
        onClick={() => isSending ? cancelSend() : submit()}
      >{isSending ? <Square size={15} /> : <ArrowUp size={19} />}</button>
    </div>
    {dictationError ? <p className="tutor-dictation-error" role="status">{dictationError}</p> : null}
  </div>

  return <main className="workspace-page tutor-page" onDragOver={(event) => { event.preventDefault(); if (!dragging) setDragging(true) }} onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false) }} onDrop={onDrop}>
    <ConfirmDialog open={Boolean(deleting)} title={text.deleteTitle} description={text.deleteDetail} confirmLabel={text.deleteConfirm} cancelLabel={text.cancel} destructive
      onClose={() => setDeleting(null)} onConfirm={() => { if (deleting) void deleteChat(deleting.id); setDeleting(null) }} />
    {dragging ? <div className="tutor-drop" aria-hidden="true"><ImagePlus size={30} />{text.drop}</div> : null}
    {railOpen ? <button type="button" className="tutor-scrim" aria-label={text.closeChats} onClick={() => setRailOpen(false)} /> : null}

    <aside className={`tutor-rail ${railOpen ? 'is-open' : ''}`} aria-label={text.title}>
      <div className="tutor-rail-head">
        <button type="button" className="tutor-rail-brand" onClick={openTalk} aria-label={coachText.voice}>
          <CoachMascot state={voiceState} level={voiceLevel} size={40} />
          <span><strong>{text.title}</strong><small>Nova · IvyGoo</small></span>
        </button>
        <button type="button" className="tutor-icon-button tutor-rail-close" aria-label={text.closeChats} onClick={() => setRailOpen(false)}><PanelLeftClose size={18} /></button>
      </div>
      <button type="button" className="tutor-new-chat" onClick={() => void startNewChat()} disabled={creating || threadsLoading}><SquarePen size={17} />{text.newChat}</button>
      <label className="tutor-search"><Search size={15} /><input type="search" value={query} placeholder={text.search} aria-label={text.search} onChange={(event) => setQuery(event.target.value)} /></label>
      <nav className="tutor-threads" aria-label={text.title}>
        {threadsLoading ? <p className="tutor-rail-note">{text.loading}</p> : null}
        {!threadsLoading && !visibleChats.length ? <p className="tutor-rail-note">{query ? text.noMatch : text.noChats}</p> : null}
        {groups.map((group) => <section key={group.label}>
          <h2>{group.label}</h2>
          {group.threads.map((thread) => {
            const title = titleOf(thread.title)
            return <div key={thread.id} className={`tutor-thread ${thread.id === activeThreadId ? 'is-active' : ''}`}>
              {editing?.id === thread.id ? <input autoFocus aria-label={text.rename} value={editing.title}
                onChange={(event) => setEditing({ id: thread.id, title: event.target.value })}
                onBlur={finishRename}
                onKeyDown={(event) => { if (event.key === 'Enter') finishRename(); if (event.key === 'Escape') setEditing(null) }} />
                : <>
                  <button type="button" className="tutor-thread-open" aria-current={thread.id === activeThreadId ? 'page' : undefined} onClick={() => { selectChat(thread.id); setRailOpen(false) }} title={title}>
                    <MessageSquare size={14} /><span>{title}</span>
                  </button>
                  <span className="tutor-thread-actions">
                    <button type="button" aria-label={`${text.rename}: ${title}`} onClick={() => setEditing({ id: thread.id, title })}><Pencil size={13} /></button>
                    <button type="button" aria-label={`${text.remove}: ${title}`} onClick={() => setDeleting({ id: thread.id, title })}><Trash2 size={13} /></button>
                  </span>
                </>}
            </div>
          })}
        </section>)}
      </nav>
      <div className="tutor-rail-foot">
        <button type="button" onClick={() => { setSettingsOpen(true); setRailOpen(false) }}><Settings2 size={16} /><span>{text.settings}</span>{memories.length ? <b>{memories.length}</b> : null}</button>
      </div>
    </aside>

    <section className="tutor-main">
      <header className="tutor-topbar">
        <button type="button" className="tutor-icon-button tutor-menu" aria-label={text.openChats} aria-expanded={railOpen} onClick={() => setRailOpen(true)}><Menu size={19} /></button>
        <h1>{empty ? text.newChat : titleOf(activeThread?.title ?? text.newChat)}</h1>
        <div className="tutor-topbar-actions">
          <TutorBalance text={text} />
          <button type="button" className="tutor-talk" onClick={openTalk}><AudioLines size={16} /><span>{text.talk}</span></button>
          <button type="button" className="tutor-icon-button tutor-new-mobile" aria-label={text.newChat} onClick={() => void startNewChat()} disabled={creating || threadsLoading}><SquarePen size={18} /></button>
        </div>
      </header>
      <CoachConnectionStatus />

      <div ref={viewportRef} className={`tutor-viewport ${empty ? 'is-empty' : ''}`} onScroll={() => {
        const viewport = viewportRef.current
        if (!viewport) return
        const following = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 72
        followLatest.current = following
        setShowJump(!following)
      }}>
        {empty ? <div className="tutor-hero">
          <span className="tutor-hero-badge"><Sparkles size={13} /> Nova · {coachText[workspace.id]}</span>
          <h2>{preferredName ? <><span>{preferredName},</span> </> : null}{text.hero}</h2>
          <p>{text.heroDetail}</p>
          {composer}
          <p className="tutor-sensitive"><ShieldCheck size={13} />{text.sensitive}</p>
          <div className="tutor-chips">
            {text.chips.map((chip, index) => {
              const Icon = CHIP_ICONS[index]
              return <button key={chip.label} type="button" disabled={isSending || threadsLoading} onClick={() => submit(chip.prompt)}><Icon size={16} />{chip.label}</button>
            })}
          </div>
          {error ? <p className="tutor-error" role="status">{error}</p> : null}
        </div> : <div className="tutor-thread-view">
          {messages.map((message) => <motion.article
            key={message.id}
            className={`tutor-message is-${message.role}`}
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .2, ease: [0.22, 1, 0.36, 1] }}
          >
            {message.role === 'assistant' ? <span className="tutor-avatar" aria-hidden="true"><Sparkles size={15} /></span> : null}
            <div className="tutor-message-body">
              {message.images?.length ? <div className="tutor-message-images">{message.images.map((src, index) => <img key={index} src={src} alt="" />)}</div> : null}
              {message.role === 'assistant' ? <AiMessageContent content={message.content} /> : <p>{message.content}</p>}
              {message.status === 'interrupted' ? <small className="tutor-stopped">{text.stopped}</small> : null}
              {message.role === 'assistant' && message.content && message.status !== 'streaming' ? <div className="tutor-message-actions"><CopyAnswer text={message.content} labels={text} /></div> : null}
            </div>
          </motion.article>)}
          {isSending && !messages.some((message) => message.status === 'streaming' && message.content) ? <div className="tutor-message is-assistant">
            <span className="tutor-avatar" aria-hidden="true"><Sparkles size={15} /></span>
            <div className="tutor-typing" role="status"><span /><span /><span />{text.thinking}</div>
          </div> : null}
          <AnimatePresence>
            {pendingActions.map((pending) => <motion.div key={pending.id} className="tutor-permission" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ShieldCheck size={18} />
              <div>
                <strong>{text.permission}</strong>
                <p>{pending.label}</p>
                <span>
                  <button type="button" className="tutor-primary is-small" onClick={() => approveAction(pending.id)}>{text.allow}<ArrowRight size={14} /></button>
                  <button type="button" className="tutor-secondary is-small" onClick={() => dismissAction(pending.id)}>{text.dismiss}</button>
                </span>
              </div>
            </motion.div>)}
          </AnimatePresence>
        </div>}
      </div>
      {!empty && showJump ? <button type="button" className="tutor-jump" onClick={() => {
        followLatest.current = true
        setShowJump(false)
        viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: reducedMotion ? 'auto' : 'smooth' })
      }}><ArrowDown size={15} />{text.latest}</button> : null}

      {!empty ? <div className="tutor-dock">
        {voiceError ? <div className="tutor-voice-error" role="status"><Mic size={14} /><span>{voiceError}</span>{voiceSupported ? <button type="button" onClick={() => void startVoice()}>{text.enableMic}</button> : null}</div> : null}
        {composer}
        {error ? <p className="tutor-error" role="status">{error}</p> : null}
        <p className="tutor-sensitive"><ShieldCheck size={13} />{text.sensitive}</p>
      </div> : voiceError ? <div className="tutor-dock"><div className="tutor-voice-error" role="status"><Mic size={14} /><span>{voiceError}</span>{voiceSupported ? <button type="button" onClick={() => void startVoice()}>{text.enableMic}</button> : null}</div></div> : null}
    </section>

    {settingsOpen ? <div className="tutor-sheet-backdrop" onClick={() => setSettingsOpen(false)}>
      <section className="tutor-sheet" role="dialog" aria-modal="true" aria-label={text.settings} onClick={(event) => event.stopPropagation()}>
        <header><h2><Settings2 size={18} />{text.settings}</h2><button type="button" className="tutor-icon-button" aria-label={text.cancel} autoFocus onClick={() => setSettingsOpen(false)}><X size={18} /></button></header>
        <div className="tutor-sheet-body">
          <h3>{coachText.focus}</h3>
          <div className="tutor-focus-list">{AI_WORKSPACES.map(({ id }) => {
            const Icon = WORKSPACE_ICONS[id]
            return <button key={id} type="button" aria-pressed={workspace.id === id} onClick={() => setWorkspace(id)}>
              <span><Icon size={16} /></span><span><b>{coachText[id]}</b><small>{coachText[`${id}Detail`]}</small></span>{workspace.id === id ? <Check size={15} /> : null}
            </button>
          })}</div>
          <h3><BrainCircuit size={16} />{text.memory}</h3>
          <p className="tutor-sheet-note">{text.memoryHint}</p>
          {memories.length ? <ul className="tutor-memories">{memories.map((memory) => <li key={memory.id}>
            <span><small>{memory.key.replace(/_/g, ' ')}</small>{memory.value}</span>
            <button type="button" className="tutor-icon-button" aria-label={text.forget} onClick={() => void forgetMemory(memory.id)}><Trash2 size={14} /></button>
          </li>)}</ul> : <p className="tutor-rail-note">{text.noMemory}</p>}
        </div>
      </section>
    </div> : null}
  </main>
}
