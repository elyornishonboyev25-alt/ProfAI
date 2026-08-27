import { Test, User, Achievement, LeaderboardEntry } from '../types'

export const mockAchievements: Achievement[] = [
  {
    id: 'first-test',
    title: 'First Steps',
    description: 'Complete your first test',
    icon: 'рџЋЇ',
    unlockedAt: '2024-01-02T10:00:00Z',
    category: 'tests'
  },
  {
    id: 'week-streak',
    title: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    icon: 'рџ”Ґ',
    unlockedAt: '2024-01-08T09:00:00Z',
    category: 'streak'
  },
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Score 100% on any test',
    icon: 'рџ’Ї',
    unlockedAt: '2024-01-15T14:30:00Z',
    category: 'scores'
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete a test in half the time',
    icon: 'вљЎ',
    unlockedAt: '2024-01-20T11:15:00Z',
    category: 'time'
  }
]

export const mockUser: User = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  grade: 10,
  joinedAt: '2024-01-01T00:00:00Z',
  lastLogin: '2024-01-24T10:30:00Z',
  stats: {
    totalTests: 45,
    completedTests: 42,
    averageScore: 85,
    studyStreak: 7,
    totalStudyTime: 3600,
    rank: 42,
    achievements: mockAchievements
  },
  preferences: {
    theme: 'system',
    language: 'en',
    notifications: true,
    soundEffects: true,
    autoSave: true
  }
}

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    user: {
      id: 'user-1',
      name: 'Alice Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face'
    },
    score: 9850,
    testsCompleted: 156,
    averageScore: 94.5
  },
  {
    rank: 2,
    user: {
      id: 'user-2',
      name: 'Bob Smith',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face'
    },
    score: 9720,
    testsCompleted: 142,
    averageScore: 92.8
  },
  {
    rank: 3,
    user: {
      id: 'user-3',
      name: 'Carol Williams',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face'
    },
    score: 9650,
    testsCompleted: 138,
    averageScore: 91.2
  },
  {
    rank: 42,
    user: {
      id: 'user-42',
      name: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'
    },
    score: 7850,
    testsCompleted: 42,
    averageScore: 85.0
  }
]

export const mockSATTests: Test[] = [
  {
    id: 'sat-math-1',
    title: 'SAT Math Practice Test 1',
    type: 'sat',
    category: 'mathematics',
    difficulty: 'Hard',
    duration: 55,
    description: 'Comprehensive SAT Math practice with calculator.',
    questions: [
      {
        id: 1,
        type: 'multiple-choice',
        question: 'If f(x) = 2xВІ - 3x + 1, what is f(3)?',
        options: ['10', '13', '16', '19'],
        correctAnswer: 0,
        explanation: 'f(3) = 2(3)ВІ - 3(3) + 1 = 18 - 9 + 1 = 10.',
        points: 1
      }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

export const mockIELTSTests: Test[] = [
  {
    id: 'ielts-listening-1',
    title: 'IELTS Listening Practice Test 1',
    type: 'ielts',
    category: 'english',
    difficulty: 'Medium',
    duration: 30,
    description: 'IELTS Listening section practice test.',
    questions: [
      {
        id: 1,
        type: 'multiple-choice',
        question: 'What is the main topic of the conversation?',
        options: ['Travel plans', 'University course', 'Job interview', 'Housing arrangement'],
        correctAnswer: 1,
        points: 1
      }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

