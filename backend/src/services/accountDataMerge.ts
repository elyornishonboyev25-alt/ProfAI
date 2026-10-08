// Apply only the changes made on this device, preserving independent changes
// from another device. History arrays are matched by their stable attempt IDs.
export function mergeAccountData(current: string | null, base: string | null, value: string | null): string | null {
  if (current === base || value === null) return value
  if (value === base) return current
  try {
    const parse = (raw: string | null) => raw === null ? undefined : JSON.parse(raw)
    return JSON.stringify(merge(parse(current), parse(base), parse(value)))
  } catch { return value }
}
function identity(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return undefined
  const item = value as Record<string, unknown>
  const key = item.attemptKey ?? item.id ?? (typeof item.key === 'string' && typeof item.at === 'string' ? `${item.key}:${item.at}` : undefined)
  return typeof key === 'string' ? key : undefined
}
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
function merge(current: unknown, base: unknown, value: unknown): unknown {
  if (JSON.stringify(value) === JSON.stringify(base)) return current
  if (Array.isArray(value) && value.every((item) => identity(item) !== undefined) &&
      (base === undefined || Array.isArray(base)) && (current === undefined || Array.isArray(current))) {
    const previous = new Map((base ?? []).map((item: unknown) => [identity(item), item]))
    const next = new Map(value.map((item) => [identity(item), item]))
    const result = new Map((current ?? []).map((item: unknown) => [identity(item), item]))
    for (const key of previous.keys()) if (!next.has(key)) result.delete(key)
    for (const [key, item] of next) {
      if (!previous.has(key) || JSON.stringify(previous.get(key)) !== JSON.stringify(item)) result.set(key, item)
    }
    return [...result.values()]
  }
  if (object(value) && (base === undefined || object(base)) && (current === undefined || object(current))) {
    const result = { ...(current as Record<string, unknown> | undefined) }
    const previous = (base ?? {}) as Record<string, unknown>
    for (const key of Object.keys(previous)) if (!Object.hasOwn(value, key)) delete result[key]
    for (const key of Object.keys(value)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
      result[key] = merge(result[key], previous[key], value[key])
    }
    return result
  }
  return value
}
