const deletedOwners = new Set<string>()
const writes = new Map<string, Promise<void>>()
const recordings = new Map<string, Blob>()
const storageKey = (owner: string, key: string) => JSON.stringify([owner, key])

// Audio blobs belong to a single account and stay out of JSON/cloud draft sync.
function open(owner: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(`profai-test-audio:${encodeURIComponent(owner)}`, 1)
    let expired = false
    const timer = setTimeout(() => { expired = true; reject(new Error('Audio storage did not open.')) }, 5000)
    request.onupgradeneeded = () => request.result.createObjectStore('audio')
    request.onsuccess = () => {
      clearTimeout(timer)
      if (expired) request.result.close()
      else resolve(request.result)
    }
    request.onerror = () => { clearTimeout(timer); reject(request.error) }
  })
}

async function writeTestAudio(owner: string, key: string, blob: Blob) {
  try {
    if (deletedOwners.has(owner)) return
    const db = await open(owner)
    if (deletedOwners.has(owner)) { db.close(); return }
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('audio', 'readwrite')
      tx.objectStore('audio').put(blob, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    }).finally(() => db.close())
  } catch { /* Recording remains available in memory if storage is unavailable. */ }
}

/** Serialize snapshots: a slower earlier open must never overwrite the final clip. */
export function saveTestAudio(owner: string, key: string, blob: Blob): Promise<void> {
  if (deletedOwners.has(owner)) return Promise.resolve()
  const id = storageKey(owner, key)
  recordings.set(id, blob)
  const previous = writes.get(id) ?? Promise.resolve()
  const write = previous.then(() => {
    if (recordings.get(id) !== blob) return
    return writeTestAudio(owner, key, blob)
  })
  writes.set(id, write)
  void write.finally(() => { if (writes.get(id) === write) writes.delete(id) })
  return write
}

export async function readTestAudio(owner: string, key: string): Promise<Blob | null> {
  try {
    if (deletedOwners.has(owner)) return null
    const cached = recordings.get(storageKey(owner, key))
    if (cached) return cached
    const db = await open(owner)
    return await new Promise<Blob | null>((resolve, reject) => {
      const request = db.transaction('audio').objectStore('audio').get(key)
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null)
      request.onerror = () => reject(request.error)
    }).finally(() => db.close())
  } catch { return null }
}

/** Remove just one discarded attempt, including in-flight recorder checkpoints. */
export async function deleteTestAudioPrefix(owner: string, keyPrefix: string) {
  const matches = (id: string) => {
    const [account, key] = JSON.parse(id) as [string, string]
    return account === owner && key.startsWith(keyPrefix)
  }
  const pending = [...writes].filter(([id]) => matches(id)).map(([, promise]) => promise)
  for (const id of recordings.keys()) if (matches(id)) recordings.delete(id)
  await Promise.allSettled(pending)
  try {
    const db = await open(owner)
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('audio', 'readwrite')
      const cursor = tx.objectStore('audio').openCursor(IDBKeyRange.bound(keyPrefix, `${keyPrefix}\uffff`))
      cursor.onsuccess = () => { const entry = cursor.result; if (entry) { entry.delete(); entry.continue() } }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    }).finally(() => db.close())
  } catch { /* The attempt is also removed from the in-memory recording cache. */ }
}

export function deleteAccountTestAudio(owner: string) {
  deletedOwners.add(owner)
  for (const id of recordings.keys()) if (JSON.parse(id)[0] === owner) recordings.delete(id)
  try { indexedDB.deleteDatabase(`profai-test-audio:${encodeURIComponent(owner)}`) } catch { /* Optional local cache. */ }
}
