/** Conservative text guard. Proper names and short identification turns are exempt. */
export function needsEnglishReminder(text: string, question: string): boolean {
  if (/\b(?:name|called|spell|identity)\b/i.test(question)) return false
  const words = text.toLowerCase().match(/[\p{L}‘’ʻʼ']+/gu) ?? []
  if (words.length < 4) return false
  const nonLatin = words.filter(word => /[\p{Script=Cyrillic}\p{Script=Arabic}\p{Script=Han}]/u.test(word)).length
  if (nonLatin >= 3 && nonLatin / words.length > .45) return true
  const uzbek = new Set(['men', 'menga', 'mening', 'biz', 'bizning', 'bugun', 'kecha', 'ertaga', 'uchun', 'bilan', 'chunki', 'lekin', 'juda', 'yaxshi', 'yomon', 'emas', 'qildim', 'bordim', 'bo‘ladi', 'boladi', 'qilish', 'kerak', 'haqida', 'shuning', 'o‘ylayman', 'oylayman'])
  const spanish = new Set(['porque', 'estoy', 'tengo', 'quiero', 'también', 'siempre', 'mucho', 'pienso', 'nosotros'])
  const french = new Set(['parce', 'suis', 'aussi', 'beaucoup', 'toujours', 'nous', 'avec', 'pour', 'mais', 'très'])
  return [uzbek, spanish, french].some(dictionary => {
    const matches = words.filter(word => dictionary.has(word)).length
    return matches >= 3 && matches / words.length >= .35
  })
}
