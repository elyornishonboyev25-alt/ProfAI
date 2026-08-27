import { Navigate, useLocation, useParams } from 'react-router-dom'
import { IeltsSectionView, type IeltsSectionKey } from '@/components/tracks/IeltsSectionView'

const validSections: IeltsSectionKey[] = ['reading', 'listening', 'writing', 'speaking']

export default function IELTSSection() {
  const location = useLocation()
  const { section } = useParams<{ section: string }>()
  const navigationState = (location.state as { entry?: string; from?: string } | null)
  const fromMock = navigationState?.entry === 'mock-ielts'
  const mockFrom = navigationState?.from ?? 'tests'

  if (!section || !validSections.includes(section as IeltsSectionKey)) {
    return <Navigate to="/ielts" replace />
  }

  if (section === 'reading' || section === 'listening' || section === 'speaking') {
    return (
      <Navigate
        to={`/ielts/${section}/tests`}
        replace
        state={{
          entry: navigationState?.entry,
          from: navigationState?.from,
        }}
      />
    )
  }

  return (
    <IeltsSectionView
      section={section as IeltsSectionKey}
      backPath={fromMock ? '/mock/ielts' : '/ielts'}
      backLabel={fromMock ? 'Back to Mock IELTS' : 'Back to IELTS Arena'}
      backState={fromMock ? { from: mockFrom } : null}
    />
  )
}
