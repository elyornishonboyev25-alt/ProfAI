const deletedOwners = new Set<string>()

// Audio blobs belong to a single account and stay out of JSON/cloud draft sync.
function open(owner: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(`profai-test-audio:${encodeURIComponent(owner)}`, 1)
    request.onupgradeneeded = () => request.result.createObjectStore('audio')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveTestAudio(owner: string, key: string, blob: Blob) {
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

export async function readTestAudio(owner: string, key: string): Promise<Blob | null> {
  try {
    if (deletedOwners.has(owner)) return null
    const db = await open(owner)
    return await new Promise<Blob | null>((resolve, reject) => {
      const request = db.transaction('audio').objectStore('audio').get(key)
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null)
      request.onerror = () => reject(request.error)
    }).finally(() => db.close())
  } catch { return null }
}

export function deleteAccountTestAudio(owner: string) {
  deletedOwners.add(owner)
  try { indexedDB.deleteDatabase(`profai-test-audio:${encodeURIComponent(owner)}`) } catch { /* Optional local cache. */ }
}
