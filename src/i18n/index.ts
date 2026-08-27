import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

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
  en: { translation },
  uz: { translation },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
