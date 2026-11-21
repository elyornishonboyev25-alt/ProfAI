import {isBanterBoundary} from '../../../backend/src/services/novaBanter'
import { useCallback } from 'react'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { novaLanguageChoiceSchema, novaLanguageSchema, resolveNovaLanguage, type NovaLanguageChoice, type NovaLanguage } from '@/lib/novaLanguage'

export function useNovaLanguage(owner: string, scope: string, initial: NovaLanguage, restoredSelection?: NovaLanguageChoice) {
  const key = `${owner}:${scope}`
  const saved = useAiAssistantStore(state => state.conversationLanguages[key])
  const selection = novaLanguageChoiceSchema.parse(saved?.selection ?? restoredSelection ?? 'auto')
  const lastReliable = novaLanguageSchema.parse(saved?.lastReliable ?? initial)
  const choose = useCallback((value: NovaLanguageChoice) => {
    const parsed = novaLanguageChoiceSchema.parse(value)
    useAiAssistantStore.setState(state => ({ conversationLanguages: { ...state.conversationLanguages, [key]: { selection: parsed, lastReliable: parsed === 'auto' ? state.conversationLanguages[key]?.lastReliable ?? initial : parsed } } }))
  }, [key, owner, initial, restoredSelection])
  const observe = useCallback((text: string) => {
    if (isBanterBoundary(text)) useAiAssistantStore.getState().setCoachPreferences(owner, {banter:'off',playfulLanguage:false})
    const current = useAiAssistantStore.getState().conversationLanguages[key]
    const result = resolveNovaLanguage(text, novaLanguageChoiceSchema.parse(current?.selection ?? restoredSelection ?? 'auto'), novaLanguageSchema.parse(current?.lastReliable ?? initial))
    if (result.observation.status === 'supported') useAiAssistantStore.setState(state => ({ conversationLanguages: { ...state.conversationLanguages, [key]: { selection: result.selection, lastReliable: result.language } } }))
    return result
  }, [key, owner, initial, restoredSelection])
  return { selection, lastReliable, language: selection === 'auto' ? lastReliable : selection, choose, observe }
}
