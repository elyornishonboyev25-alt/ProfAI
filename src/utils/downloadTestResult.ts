import type { TestResult } from '@/types/ieltsTypes'

export function downloadTestResult(result: TestResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${result.testId.replace(/[^a-z0-9_-]/gi, '_')}-${result.date.replace(/[^0-9T]/g, '-')}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
