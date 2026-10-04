// Shared types for the Articles knowledge hub. Every article the user adds
// follows this exact shape so the list page, the reader, and the vocabulary arena can all
// consume the data without any per-article special casing.

export type ArticleBlock =
  | { type: 'lead'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'quote'; text: string }

// A vocabulary entry shaped exactly like the Vocabulary Arena entries so an article's hard
// words can be studied with the same flashcards / matching / quiz / typing activities.
export type ArticleVocabEntry = {
  id: string
  term: string
  definition: string
  example: string
  synonym: string
}

// Cover art is generated (no external image, no channel watermark) from a theme + icon so it
// stays professional as the library grows. `image` is optional — drop a file in
// /public/articles and set it here to use a real photo instead of the generated cover.
export type ArticleCover = {
  theme: ArticleCoverTheme
  icon: string // lucide-react icon name
  motif?: string // short kicker shown on the cover, e.g. "5 BOOKS"
  image?: string
}

export type ArticleCoverTheme =
  | 'midnight-gold'
  | 'royal-violet'
  | 'ocean-teal'
  | 'sunrise-rose'
  | 'forest-emerald'
  | 'crimson-ember'
  | 'slate-azure'

export type ArticleCategory =
  | 'Mindset'
  | 'Self-Growth'
  | 'Productivity'
  | 'Psychology'
  | 'Career'
  | 'Learning'
  | 'Science'
  | 'Society'

export type Article = {
  id: string
  slug: string
  title: string
  // One or two sentences — the hook that tells a reader what the piece is about and whether
  // it is worth their time. Shown on the article card.
  teaser: string
  category: ArticleCategory
  tags: string[]
  readMinutes: number
  publishedLabel: string // human label, e.g. "New" or "Editor's pick"
  cover: ArticleCover
  blocks: ArticleBlock[]
  vocabulary: ArticleVocabEntry[]
  source?: {
    publisher: string
    url: string
    authors: string[]
    citation: string
    copyright: string
    license: string
    licenseUrl: string
    adaptationNote: string
  }
}
