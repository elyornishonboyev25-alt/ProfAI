import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { russianInterface } from './interface'
import russianUI from './ru-ui.json'
import russianTranslation from './ru.json'

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
    title: 'ProfAI',
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

const resources = {
  en: { translation, interface: {} },
  ru: { translation: russianTranslation, interface: { ...russianUI, ...russianInterface } },
}

function savedLanguage() {
  try { return localStorage.getItem('profai-language') === 'ru' ? 'ru' : 'en' } catch { return 'en' }
}
function applyLanguage(language: string) {
  document.documentElement.lang = language === 'ru' ? 'ru' : 'en'
  try { localStorage.setItem('profai-language', document.documentElement.lang) } catch { /* Optional preference. */ }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage(),
    supportedLngs: ['en', 'ru'],
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

applyLanguage(i18n.language)
i18n.on('languageChanged', applyLanguage)
export default i18n
