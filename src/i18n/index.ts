import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { russianInterface } from './interface'
import russianUI from './ru-ui.json'
import russianCompletion from './ru-completion.json'
import { russianAdditions } from './ru-additions'
import russianTranslation from './ru.json'
import uzbekUI from './uz-ui.json'
import { uzbekCompletion } from './uz-completion'

const translation = {
  nav: {
    home: 'Home',
    dashboard: 'Dashboard',
    tests: 'Tests',
    sat: 'SAT',
    ielts: 'IELTS',
    profile: 'Profile',
    login: 'Login',
    logout: 'Logout',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
  },
  home: {
    title: 'Ivygoo',
    subtitle: 'Your Path to Top Universities Abroad',
    description: 'One AI-powered platform to study abroad — SAT & IELTS prep, English skills, university research and step-by-step admission guidance, all in one place.',
    getStarted: 'Get Started',
    exploreTests: 'Explore Tests',
    features: {
      adaptive: 'Adaptive Learning',
      ai: 'AI Evaluation',
      progress: 'Progress Tracking',
      gamification: 'Gamification',
    },
  },
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome back',
    recentTests: 'Recent Tests',
    stats: {
      testsTaken: 'Tests Taken',
      averageScore: 'Average Score',
      studyStreak: 'Study Streak',
      rank: 'Global Rank',
    },
    quickActions: {
      continueTest: 'Continue Test',
      newTest: 'New Test',
      viewProgress: 'View Progress',
    },
  },
  tests: {
    title: 'Tests',
    selectGrade: 'Select Grade',
    selectSubject: 'Select Subject',
    difficulty: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
    },
    startTest: 'Start Test',
    duration: 'Duration',
    questions: 'Questions',
  },
  sat: {
    title: 'SAT Preparation',
    readingWriting: 'Reading & Writing',
    math: 'Math',
    fullTest: 'Full Practice Test',
    sections: {
      reading: 'Reading',
      writing: 'Writing & Language',
      mathNoCalc: 'Math - No Calculator',
      mathCalc: 'Math - Calculator',
    },
  },
  ielts: {
    title: 'IELTS Preparation',
    listening: 'Listening',
    reading: 'Reading',
    writing: 'Writing',
    speaking: 'Speaking',
    academic: 'Academic',
    general: 'General Training',
    fullTest: 'Full Practice Test',
  },
  test: {
    title: 'Test',
    question: 'Question',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    timeRemaining: 'Time Remaining',
    markForReview: 'Mark for Review',
    review: 'Review',
  },
  results: {
    title: 'Test Results',
    score: 'Score',
    correct: 'Correct',
    incorrect: 'Incorrect',
    timeSpent: 'Time Spent',
    reviewAnswers: 'Review Answers',
    downloadReport: 'Download Report',
    shareResults: 'Share Results',
    nextSteps: 'Next Steps',
  },
}

const uzbekInterface = { ...uzbekUI, ...uzbekCompletion }

function localizeTree(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
    typeof item === 'string' ? (uzbekInterface as Record<string, string>)[item] || item
      : item && typeof item === 'object' ? localizeTree(item as Record<string, unknown>) : item,
  ]))
}
const resources = {
  en: { translation, interface: {} },
  ru: { translation: russianTranslation, interface: { ...russianUI, ...russianInterface, ...russianCompletion, ...russianAdditions } },
  uz: { translation: localizeTree(translation), interface: uzbekInterface },
}

type Language = 'en' | 'ru' | 'uz'
const LANGUAGE_KEY = 'profai-language'
// 'user' once the visitor picks a language; until then it follows their country.
const LANGUAGE_SOURCE_KEY = 'profai-language-source'
const UZBEK_TIME_ZONES = new Set(['Asia/Tashkent', 'Asia/Samarkand'])
// Countries where Russian is an official or everyday shared language: Russia, Belarus, Kazakhstan, Kyrgyzstan,
// Tajikistan, Turkmenistan, Azerbaijan and Armenia. Ukraine, Georgia, Moldova and the Baltic states stay English.
const RUSSIAN_COUNTRIES = new Set(['RU', 'BY', 'KZ', 'KG', 'TJ', 'TM', 'AZ', 'AM'])
const RUSSIAN_TIME_ZONES = new Set([
  'Europe/Moscow', 'Europe/Kaliningrad', 'Europe/Samara', 'Europe/Volgograd', 'Europe/Saratov', 'Europe/Ulyanovsk',
  'Europe/Astrakhan', 'Europe/Kirov', 'Asia/Yekaterinburg', 'Asia/Omsk', 'Asia/Novosibirsk', 'Asia/Barnaul',
  'Asia/Tomsk', 'Asia/Novokuznetsk', 'Asia/Krasnoyarsk', 'Asia/Irkutsk', 'Asia/Chita', 'Asia/Yakutsk', 'Asia/Khandyga',
  'Asia/Vladivostok', 'Asia/Ust-Nera', 'Asia/Magadan', 'Asia/Sakhalin', 'Asia/Srednekolymsk', 'Asia/Kamchatka', 'Asia/Anadyr',
  'Europe/Minsk', 'Asia/Almaty', 'Asia/Qostanay', 'Asia/Qyzylorda', 'Asia/Aqtobe', 'Asia/Aqtau', 'Asia/Atyrau', 'Asia/Oral',
  'Asia/Bishkek', 'Asia/Dushanbe', 'Asia/Ashgabat', 'Asia/Baku', 'Asia/Yerevan',
])

function readStorage(key: string) {
  try { return localStorage.getItem(key) } catch { return null }
}
function countryLanguage(country: string): Language {
  return country === 'UZ' ? 'uz' : RUSSIAN_COUNTRIES.has(country) ? 'ru' : 'en'
}
/** Instant first guess from the device time zone, so the first paint is already in the likely language. */
function timeZoneLanguage(): Language {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return UZBEK_TIME_ZONES.has(zone) ? 'uz' : RUSSIAN_TIME_ZONES.has(zone) ? 'ru' : 'en'
  } catch { return 'en' }
}
function userLanguage(): Language | null {
  const saved = readStorage(LANGUAGE_KEY)
  if (saved !== 'en' && saved !== 'ru' && saved !== 'uz') return null
  const source = readStorage(LANGUAGE_SOURCE_KEY)
  // Before the source flag existed 'en' was written for everyone by default, but 'ru'/'uz' could only be picked.
  return source === 'user' || (source === null && saved !== 'en') ? saved : null
}

let automatic = true
function applyLanguage(language: string) {
  document.documentElement.lang = language === 'ru' || language === 'uz' ? language : 'en'
  try {
    localStorage.setItem(LANGUAGE_KEY, document.documentElement.lang)
    localStorage.setItem(LANGUAGE_SOURCE_KEY, automatic ? 'auto' : 'user')
  } catch { /* Optional preference. */ }
}

const chosen = userLanguage()
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: chosen ?? timeZoneLanguage(),
    supportedLngs: ['en', 'ru', 'uz'],
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

automatic = !chosen
applyLanguage(i18n.language)
automatic = false
i18n.on('languageChanged', applyLanguage)

// Cloudflare answers /cdn-cgi/trace on the site's own domain with the visitor's country (loc=UZ).
async function followVisitorCountry() {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 4000)
  try {
    const response = await fetch('/cdn-cgi/trace', { cache: 'no-store', signal: controller.signal })
    const country = response.ok ? /^loc=([A-Z]{2})$/m.exec(await response.text())?.[1] : undefined
    if (!country || userLanguage()) return
    const language = countryLanguage(country)
    if (language === i18n.language) return
    automatic = true
    await i18n.changeLanguage(language)
  } catch { /* Keep the time zone guess. */ } finally {
    automatic = false
    window.clearTimeout(timer)
  }
}
if (!chosen && typeof window !== 'undefined') void followVisitorCountry()

export default i18n
