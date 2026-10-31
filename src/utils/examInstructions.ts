export const answerLimit = /\b((?:NO MORE THAN|AT MOST|UP TO)\s+(?:ONE|TWO|THREE|FOUR|FIVE|\d+)\s+WORDS?(?:\s+(?:AND\/OR|OR|AND)\s+(?:A\s+)?(?:NUMBER|NUMBERS))?|(?:ONLY\s+)?(?:ONE|TWO|THREE|FOUR|FIVE|\d+)\s+WORDS?(?:\s+ONLY)?(?:\s+(?:AND\/OR|OR|AND)\s+(?:A\s+)?(?:NUMBER|NUMBERS))?|CHOOSE\s+(?:ONE|TWO|THREE|FOUR|FIVE|\d+)(?:\s+(?:LETTERS|ANSWERS))?|SELECT\s+(?:ONE|TWO|THREE|FOUR|FIVE|\d+)(?:\s+ANSWERS)?|YOU MAY USE ANY LETTER MORE THAN ONCE)\b/gi

/** Emphasize text leaves without changing wording, controls or annotation offsets. */
export function emphasizeAnswerLimits(root: DocumentFragment | HTMLElement) {
  const walker = document.createTreeWalker(root, window.NodeFilter.SHOW_TEXT)
  const leaves: Text[] = []
  let node = walker.nextNode()
  while (node) {
    if (!(node.parentElement?.closest('strong,b,math,script,style,option,textarea'))) leaves.push(node as Text)
    node = walker.nextNode()
  }
  for (const leaf of leaves) {
    const parts = leaf.data.split(answerLimit)
    if (parts.length < 2) continue
    const fragment = document.createDocumentFragment()
    parts.forEach((part,index) => {
      if (index % 2) { const strong = document.createElement('strong'); strong.className = 'exam-answer-limit'; strong.textContent = part; fragment.append(strong) }
      else fragment.append(document.createTextNode(part))
    })
    leaf.replaceWith(fragment)
  }
}
