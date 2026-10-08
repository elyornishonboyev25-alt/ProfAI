import { useAuthStore } from '@/store/authStore'
import { belongsToAccount, forgetAccountStorage } from '@/utils/accountStorage'
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
  'smarttest_reader_bookmarks_v1',
  'smarttest_vocab_matching_rewards_v2',
  'smarttest_vocab_diamond_bank_v1',
  'smarttest_vocab_mastery_v1',
  'profai:sat:attempt-history:v1',
  'profai-guest-diagnostic-token-v1',
  'profai-guest-diagnostic-handoff-v1',
  'profai-guest-diagnostic-destination-v1',
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
export function purgeAccountClientData(userId: string, broadcast = true) {
  if (typeof window === 'undefined') return

  forgetAccountStorage(userId)
  // Each store is independent: unavailable browser storage must not interrupt
  // cleanup or leave the session signed in after server deletion.
  for (const clear of [
    () => useAiAssistantStore.getState().clearMessages(userId),
    () => {
      const currentOwner = useAuthStore.getState().user?.id
      if (!currentOwner || currentOwner === userId) useAiAssistantStore.getState().setReportSnapshot(null)
    },
    () => useSpeakingStore.getState().clearForUser(userId),
    () => useSpeakerSocialStore.getState().clearForUser(userId),
    () => useBadgeStore.getState().clearForUser(userId),
  ]) { try { clear() } catch { /* Continue clearing other storage layers. */ } }
  if (broadcast) { try { deletionChannel?.postMessage({ userId }) } catch { /* A closing tab may lose its channel. */ } }

  for (const type of ['localStorage', 'sessionStorage'] as const) {
    try { purgeStorage(window[type], userId) } catch { /* Storage may be unavailable. */ }
  }
}

function purgeStorage(storage: Storage, userId: string) {
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
    (key): key is string => Boolean(key),
  )

  for (const key of keys) {
    const belongsToDeletedUser = belongsToAccount(key, userId)
    const isPersonalGlobalCache = PERSONAL_EXACT_KEYS.has(key)
    const isPersonalSession = PERSONAL_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
    if (belongsToDeletedUser || isPersonalGlobalCache || isPersonalSession) {
      try { storage.removeItem(key) } catch { /* Continue clearing remaining keys. */ }
    }
  }
}

// A transient message removes data from other open tabs without retaining a
// deleted user's identity in another persistent browser key.
const deletionChannel = (() => {
  try {
    return typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('profai:account-deleted') : null
  } catch { return null }
})()
if (deletionChannel) deletionChannel.onmessage = ({ data }) => {
  if (!data || typeof data.userId !== 'string' || !data.userId) return
  if (useAuthStore.getState().user?.id === data.userId) useAuthStore.getState().clearSession()
  purgeAccountClientData(data.userId, false)
}
