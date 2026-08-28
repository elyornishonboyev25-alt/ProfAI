import PillarHub, { type PillarHubCard } from '@/components/journey/PillarHub'

const EXAM_ARENAS: PillarHubCard[] = [
  {
    title: 'IELTS Arena',
    description:
      'Build your English proficiency through one focused workspace for Academic and General Training preparation.',
    eyebrow: 'English proficiency',
    action: 'Enter IELTS Arena',
    path: '/ielts',
    visual: 'ielts-listening',
    details: ['Listening & Reading', 'Writing & Speaking', 'Full mock exams', 'Band progress'],
  },
  {
    title: 'Digital SAT Arena',
    description:
      'Strengthen the Math and Reading & Writing skills required for competitive undergraduate applications.',
    eyebrow: 'Undergraduate admissions',
    action: 'Enter SAT Arena',
    path: '/sat',
    visual: 'sat-math',
    details: ['Math domains', 'Reading & Writing', 'Full practice tests', 'Score progress'],
  },
]

export default function TestPreparation() {
  return (
    <PillarHub
      eyebrow="Test preparation command center"
      title={
        <>
          Choose your exam <span className="text-red-600">arena.</span>
        </>
      }
      description="Choose the exam your application requires. Practice, full mocks, feedback and progress live inside each arena."
      highlights={['IELTS Academic & General Training', 'Digital SAT', 'Practice to progress']}
      cards={EXAM_ARENAS}
      layout="tracks"
      showBack={false}
      note="Test scores support your application strategy, but admission requirements vary. Always confirm the accepted exam and minimum score on the university's official programme page."
    />
  )
}
