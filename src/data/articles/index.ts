import type { Article, ArticleCategory, ArticleCoverTheme } from './types'
import { fiveBooksArticle } from './a001-five-books'
import { birthOfTheUniverseArticle } from './a002-birth-of-the-universe'
import { theLostArticle } from './a003-the-lost'

export type { Article, ArticleBlock, ArticleVocabEntry, ArticleCategory, ArticleCover, ArticleCoverTheme } from './types'

// The full library. To add one of the remaining articles, create a new `aNNN-*.ts` file that
// exports an `Article` (same shape as a001) and append it here. The list page, reader, and
// vocabulary arena all pick it up automatically — no other wiring required.
export const articles: Article[] = [
  fiveBooksArticle,
  birthOfTheUniverseArticle,
  theLostArticle,
]

// How many article slots the hub is designed to grow into.
export const ARTICLE_LIBRARY_TARGET = 150

export const articleCategories: ArticleCategory[] = [
  'Mindset',
  'Self-Growth',
  'Psychology',
  'Productivity',
  'Career',
  'Learning',
  'Science',
  'Society',
]

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug)
}

export function getArticleById(id: string): Article | undefined {
  return articles.find((article) => article.id === id)
}

// Gradient + accent palette for each generated cover theme. Kept here so both the list card
// and the reader hero render identical, watermark-free cover art.
export type CoverPalette = {
  gradient: string
  glow: string
  accent: string
  ink: string
  kicker: string
}

export const coverPalettes: Record<ArticleCoverTheme, CoverPalette> = {
  'midnight-gold': {
    gradient: 'linear-gradient(150deg,#0b1220 0%,#161f38 48%,#0c1426 100%)',
    glow: 'radial-gradient(circle at 78% 22%, rgba(250,204,21,0.55), transparent 55%)',
    accent: '#fcd34d',
    ink: '#f8fafc',
    kicker: 'rgba(250,204,21,0.9)',
  },
  'royal-violet': {
    gradient: 'linear-gradient(150deg,#1e1b4b 0%,#3b1f73 50%,#1b1442 100%)',
    glow: 'radial-gradient(circle at 80% 20%, rgba(167,139,250,0.5), transparent 55%)',
    accent: '#c4b5fd',
    ink: '#f5f3ff',
    kicker: 'rgba(196,181,253,0.92)',
  },
  'ocean-teal': {
    gradient: 'linear-gradient(150deg,#082f3a 0%,#0e4a55 50%,#06303a 100%)',
    glow: 'radial-gradient(circle at 80% 22%, rgba(45,212,191,0.5), transparent 55%)',
    accent: '#5eead4',
    ink: '#ecfeff',
    kicker: 'rgba(94,234,212,0.92)',
  },
  'sunrise-rose': {
    gradient: 'linear-gradient(150deg,#7f1d1d 0%,#b1294a 48%,#7a1733 100%)',
    glow: 'radial-gradient(circle at 78% 20%, rgba(253,164,175,0.55), transparent 55%)',
    accent: '#fda4af',
    ink: '#fff1f2',
    kicker: 'rgba(253,164,175,0.95)',
  },
  'forest-emerald': {
    gradient: 'linear-gradient(150deg,#052e1a 0%,#0c4a2e 50%,#06351f 100%)',
    glow: 'radial-gradient(circle at 80% 22%, rgba(110,231,183,0.5), transparent 55%)',
    accent: '#6ee7b7',
    ink: '#ecfdf5',
    kicker: 'rgba(110,231,183,0.92)',
  },
  'crimson-ember': {
    gradient: 'linear-gradient(150deg,#3b0a0a 0%,#7f1d1d 50%,#450a0a 100%)',
    glow: 'radial-gradient(circle at 80% 20%, rgba(251,146,60,0.5), transparent 55%)',
    accent: '#fb923c',
    ink: '#fff7ed',
    kicker: 'rgba(251,146,60,0.92)',
  },
  'slate-azure': {
    gradient: 'linear-gradient(150deg,#0f172a 0%,#1e3a5f 50%,#0c1a30 100%)',
    glow: 'radial-gradient(circle at 80% 22%, rgba(96,165,250,0.5), transparent 55%)',
    accent: '#7dd3fc',
    ink: '#f0f9ff',
    kicker: 'rgba(125,211,252,0.92)',
  },
}

// Plain-text reading estimate / word count helper used by the reader header.
export function articleWordCount(article: Article): number {
  return article.blocks.reduce((sum, block) => sum + block.text.trim().split(/\s+/).length, 0)
}
