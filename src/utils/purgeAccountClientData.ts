import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useBadgeStore } from '@/store/badgeStore'
import { useSpeakerSocialStore } from '@/store/speakerSocialStore'
import { useSpeakingStore } from '@/store/speakingStore'

const PERSONAL_EXACT_KEYS = new Set([
  'profai:sat:practice-test-4:attempt:v1',
  'smarttest:full-mock-progress:v1',
  'smarttest:ielts-track-dashboard:v2',
  'smarttest_my_vocabulary_v1',
  'profai-article-progress-v1',
  'profai-admission-lessons-v1',
  'smarttest_reader_highlights_v1',
  'smarttest_reader_notes_v1',
  'smarttest_vocab_matching_rewards_v2',
  'smarttest_vocab_diamond_bank_v1',
  'smarttest_vocab_mastery_v1',
])

const PERSONAL_KEY_PREFIXES = [
  'ielts_test_session_',
  'ielts-note-',
  'smarttest-podcast:',
  'smarttest-shadowing:',
]

/**
 * Removes data that exists only in the current browser after the server has
 * permanently deleted an account. Device preferences (theme, sound and reader
 * layout) are intentionally preserved because they are not account records.
 */
export function purgeAccountClientData(userId: string) {
  if (typeof window === 'undefined') return

  useAiAssistantStore.getState().clearMessages(userId)
  useSpeakingStore.getState().clearForUser(userId)
  useSpeakerSocialStore.getState().clearForUser(userId)
  useBadgeStore.getState().clearForUser(userId)

  const keys = Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index)).filter(
    (key): key is string => Boolean(key),
  )

  for (const key of keys) {
    const belongsToDeletedUser = key.includes(userId)
    const isPersonalGlobalCache = PERSONAL_EXACT_KEYS.has(key)
    const isPersonalSession = PERSONAL_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
    if (belongsToDeletedUser || isPersonalGlobalCache || isPersonalSession) {
      window.localStorage.removeItem(key)
    }
  }
}
