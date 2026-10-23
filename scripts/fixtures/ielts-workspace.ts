import type { IELTSTest } from '../../src/types/ieltsTypes'

// Synthetic UI fixture only; never included in the live IELTS catalog.
export const workspaceReading: IELTSTest = {
  id: 'workspace-regression', title: 'Workspace regression', type: 'Academic', module: 'Reading', duration: 60, totalQuestions: 9,
  sections: Array.from({ length: 3 }, (_, part) => ({
    id: `workspace-part-${part}`, title: `Reading Passage ${part + 1}: Learning`, premiumQuestionGroups: true,
    content: Array.from({ length: 12 }, () => 'Alpha learning supports careful reading. Beta practice builds confidence.').join('\n\n'),
    questions: [
      ...[1, 2].map(number => ({ id: `p${part}-q${number}`, number: part * 3 + number, text: 'Find the matching information.', type: 'matching-information' as const, options: ['A First paragraph', 'B Second paragraph'], correctAnswer: 'A', groupTitle: `Questions ${part * 3 + 1}-${part * 3 + 2}`, instruction: 'Choose A or B.' })),
      { id: `p${part}-q3`, number: part * 3 + 3, text: 'Careful ______ supports learning.', type: 'summary-completion' as const, correctAnswer: 'reading', instruction: 'ONE WORD ONLY' },
    ],
  })),
}
