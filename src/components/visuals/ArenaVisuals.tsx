import { cn } from '@/components/ui/utils'
import StudyObject, { type StudyObjectKind } from './StudyObject'
export type StudyIllustrationVariant = 'sat-math' | 'sat-reading' | 'ielts-listening' | 'ielts-reading' | 'ielts-writing' | 'ielts-speaking' | 'vocabulary' | 'academic-reading' | 'listening' | 'shadowing' | 'writing' | 'speaking'
export const ARENA_GLASS_SURFACE = 'glass-surface relative isolate overflow-hidden'
export const PILLAR_GLASS_SURFACE = 'glass-surface relative isolate overflow-hidden'
const objects: Record<StudyIllustrationVariant, StudyObjectKind> = {
  'sat-math':'calculator','sat-reading':'book','ielts-listening':'headphones','ielts-reading':'book','ielts-writing':'notebook','ielts-speaking':'microphone',
  vocabulary:'book','academic-reading':'book',listening:'headphones',shadowing:'microphone',writing:'notebook',speaking:'microphone',
}
export function StudyIllustration({variant,className,compact=false}:{variant:StudyIllustrationVariant;className?:string;compact?:boolean}) {
  return <div aria-hidden="true" className={cn('liquid-study-illustration', compact && 'is-compact', className)}><StudyObject kind={objects[variant]} /></div>
}
export function ArenaBackdrop({compact=false,fixed=false}:{compact?:boolean;fixed?:boolean}) {
  return <div aria-hidden="true" className={cn('liquid-arena-backdrop',fixed && 'is-fixed',compact && 'is-compact')} />
}
