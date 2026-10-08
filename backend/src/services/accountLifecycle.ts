type Cleanup = (userId: string) => void | Promise<unknown>
const cleanups: Cleanup[] = []

// Modules with personal in-memory data register cleanup alongside their cache.
export function onAccountDeleted(cleanup: Cleanup) {
  cleanups.push(cleanup)
}

export async function clearDeletedAccountRuntimeData(userId: string) {
  // A disconnected voice provider must not turn a committed database deletion
  // into an error claiming that the account still exists. Run every cleanup.
  const results = await Promise.allSettled(cleanups.map(async (cleanup) => cleanup(userId)))
  for (const result of results) {
    if (result.status === 'rejected') console.error('Account runtime cleanup failed:', result.reason)
  }
}
