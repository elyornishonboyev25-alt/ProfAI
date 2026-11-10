import UiText from '@/components/common/UiText'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import SATSectionTabs from '@/components/sat/SATSectionTabs'
import InProcessPanel from '@/components/tests/InProcessPanel'

export default function InProcessTests() {
  return <main className="workspace-page px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1480px]">
    <Link to="/sat" className="exam-catalog-back mb-3"><ArrowLeft size={16} aria-hidden="true" /><UiText text="SAT Prep" /></Link>
    <SATSectionTabs section="in-process" />
    <div className="mt-6"><InProcessPanel exam="SAT" showEmpty /></div>
  </div></main>
}
