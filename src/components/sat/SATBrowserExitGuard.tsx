import { useCopy } from '@/i18n/interface'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { useState, type ReactNode } from 'react'
import { hasActiveTest } from '@/hooks/useActiveTest'
import { useTestExitGuard } from '@/hooks/useTestExitGuard'
import { useFullscreen } from '@/hooks/useFullscreen'

export default function SATBrowserExitGuard({ children }: { children: ReactNode }) {
  const { c: uiCopy } = useCopy()
  const [open, setOpen] = useState(false)
  const { cancelExit, confirmExit } = useTestExitGuard(hasActiveTest, () => setOpen(true))
  const { exit } = useFullscreen()
  return <>{children}<ConfirmDialog open={open} title={uiCopy("Save and exit?")}
    description={uiCopy("Your answers and notes will be saved. Continue later from SAT / In process.")}
    confirmLabel={uiCopy("Save & exit")} cancelLabel={uiCopy("Continue test")}
    onClose={() => { cancelExit(); setOpen(false) }}
    onConfirm={() => confirmExit(() => { setOpen(false); void exit() }, () => {})} /></>
}
