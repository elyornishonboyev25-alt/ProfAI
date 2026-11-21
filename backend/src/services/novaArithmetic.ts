/** Bounded numeric arithmetic only. No eval, identifiers, units or symbolic claims. */
export function verifyArithmetic(expression: string): { expression: string; result: number; source: 'local_arithmetic' } | null {
  if (!expression.trim() || expression.length > 160 || !/^[\d\s.eE+*/^()−–×÷-]+$/.test(expression)) return null
  const input = expression.replace(/[−–]/g, '-').replace(/×/g, '*').replace(/÷/g, '/')
  let at = 0
  const skip = () => { while (/\s/.test(input[at] ?? '') && at < input.length) at++ }
  const bounded = (value: number) => { if (!Number.isFinite(value) || Math.abs(value) > 1e15) throw new Error('OUT_OF_RANGE'); return value }
  const parse = (minimum: number, depth: number): number => {
    if (depth > 12) throw new Error('TOO_DEEP')
    skip(); let left: number
    const char = input[at]
    if (char === '+' || char === '-') { at++; left = (char === '-' ? -1 : 1) * parse(25, depth + 1) }
    else if (char === '(') { at++; left = parse(0, depth + 1); skip(); if (input[at++] !== ')') throw new Error('PARENTHESIS') }
    else {
      const number = input.slice(at).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d{1,2})?/)
      if (!number) throw new Error('NUMBER')
      at += number[0].length; left = bounded(Number(number[0]))
    }
    while (true) {
      skip(); const op = input[at], strength = op === '+' || op === '-' ? 10 : op === '*' || op === '/' ? 20 : op === '^' ? 30 : -1
      if (strength < minimum) break
      at++; const right = parse(strength + (op === '^' ? 0 : 1), depth + 1)
      if (op === '/' && right === 0) throw new Error('DIVISION_BY_ZERO')
      if (op === '^' && Math.abs(right) > 20) throw new Error('EXPONENT')
      left = bounded(op === '+' ? left + right : op === '-' ? left - right : op === '*' ? left * right : op === '/' ? left / right : left ** right)
    }
    return left
  }
  try { const result = parse(0, 0); skip(); return at === input.length ? { expression: expression.trim(), result, source: 'local_arithmetic' } : null } catch { return null }
}

export function arithmeticFacts(message: string) {
  const candidates = message.match(/[-(]*\d[\d\s.eE+*/^()−–×÷-]*[\d)]/g) ?? []
  return candidates.filter(value => /[+*/^×÷]|\d\s*[−–-]\s*\d/.test(value)).slice(0, 3)
    .flatMap(value => { const verified = verifyArithmetic(value); return verified ? [verified] : [] })
}
