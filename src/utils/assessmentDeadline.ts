/** Bound the entire assessment, including audio preparation and auth refresh. */
export async function withAssessmentDeadline<T>(
  run: (signal: AbortSignal) => Promise<T>,
  timeoutMs = 90_000,
): Promise<T> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      Promise.resolve().then(() => run(controller.signal)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error('Assessment took too long. Your answers are saved. Please retry.'))
          controller.abort()
        }, timeoutMs)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
