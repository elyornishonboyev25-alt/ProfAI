export type AiWorkspaceId = 'general' | 'ielts' | 'sat' | 'english' | 'admission'

export type AiWorkspace = {
  id: AiWorkspaceId
  title: string
  shortTitle: string
  detail: string
  prompt: string
  starters: { uz: string[]; en: string[]; ru: string[] }
}

export const AI_WORKSPACES: AiWorkspace[] = [
  {
    id: 'general',
    title: 'All-purpose tutor',
    shortTitle: 'General',
    detail: 'Ask across every learning area',
    prompt: 'Act as a general study mentor. Route naturally between subjects while keeping the learner focused on one useful next step.',
    starters: {
      uz: ['Bugun nimadan boshlashim kerak?', 'Shu rasmni tushuntir'],
      en: ['What should I work on today?', 'Explain this screenshot'],
      ru: ['Над чем мне сегодня поработать?', 'Объясни этот скриншот'],
    },
  },
  {
    id: 'ielts',
    title: 'IELTS Coach',
    shortTitle: 'IELTS',
    detail: 'Reading, Writing, Speaking & Grammar',
    prompt: 'Prioritize IELTS Reading, Writing, Listening, Speaking and grammar. Use official-style band criteria, teach strategy, and give specific practice rather than generic advice.',
    starters: {
      uz: ['Writing Task 2 reja tuzib ber', 'Speaking javobimni tekshir'],
      en: ['Plan my Writing Task 2 answer', 'Coach my Speaking response'],
      ru: ['Помоги составить план ответа Writing Task 2', 'Оцени мой ответ Speaking'],
    },
  },
  {
    id: 'sat',
    title: 'SAT & Math Solver',
    shortTitle: 'SAT + Math',
    detail: 'Reasoning-first SAT and everyday math',
    prompt: 'Prioritize SAT Math, SAT Reading and general mathematics. Never jump to an answer: identify the idea, solve cleanly step by step, check the result, then offer a faster exam method when useful.',
    starters: {
      uz: ['Bu SAT Math savolini yech', 'Algebrani sodda tushuntir'],
      en: ['Solve this SAT Math question', 'Teach me this algebra concept'],
      ru: ['Реши эту задачу SAT Math', 'Объясни эту тему по алгебре'],
    },
  },
  {
    id: 'english',
    title: 'English Studio',
    shortTitle: 'English',
    detail: 'Vocabulary, grammar and fluency',
    prompt: 'Prioritize practical English: vocabulary in context, grammar, reading, writing and speaking fluency. Correct errors kindly, explain the rule simply, and include one natural example.',
    starters: {
      uz: ["Grammatik xatolarimni to'g'rila", "5 ta yangi so'z o'rgat"],
      en: ['Correct my grammar', 'Teach me five useful words'],
      ru: ['Исправь мои ошибки в грамматике', 'Научи меня пяти полезным словам'],
    },
  },
  {
    id: 'admission',
    title: 'Admissions & Portfolio',
    shortTitle: 'Admissions',
    detail: 'Universities, applications and portfolio',
    prompt: 'Prioritize study-abroad admissions, university fit, scholarships, essays, activities and portfolio strategy. Distinguish verified site data from general guidance, never invent requirements or deadlines, and clearly state what must be checked on an official university page.',
    starters: {
      uz: ['MIT talablari qanday?', 'Portfolio uchun reja tuz'],
      en: ['What are MIT’s requirements?', 'Help me plan my portfolio'],
      ru: ['Какие требования у MIT?', 'Помоги составить план портфолио'],
    },
  },
]

export function getAiWorkspace(id: AiWorkspaceId): AiWorkspace {
  return AI_WORKSPACES.find((workspace) => workspace.id === id) ?? AI_WORKSPACES[0]
}
