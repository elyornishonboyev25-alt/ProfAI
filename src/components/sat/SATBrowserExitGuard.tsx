import ConfirmDialog from '@/components/common/ConfirmDialog'
import { useState, type ReactNode } from 'react'
import { hasActiveTest } from '@/hooks/useActiveTest'
import { useTestExitGuard } from '@/hooks/useTestExitGuard'
import { useFullscreen } from '@/hooks/useFullscreen'

export default function SATBrowserExitGuard({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { cancelExit, confirmExit } = useTestExitGuard(hasActiveTest, () => setOpen(true))
  const { exit } = useFullscreen()
  return <>{children}<ConfirmDialog open={open} title="Save and exit?"
    description="Your answers and notes will be saved. Continue later from SAT / In process."
    confirmLabel="Save & exit" cancelLabel="Continue test"
    onClose={() => { cancelExit(); setOpen(false) }}
    onConfirm={() => confirmExit(() => { setOpen(false); void exit() }, () => {})} /></>
}
