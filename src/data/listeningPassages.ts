import { IELTSTest } from '../types/ieltsTypes'
import { listeningFullTest2 } from './listeningFullTest2'
import { listeningFullTest3 } from './listeningFullTest3'
import { listeningFullTest4 } from './listeningFullTest4'
import { listeningFullTest5 } from './listeningFullTest5'
import { listeningFullTest6 } from './listeningFullTest6'
import { listeningFullTest7 } from './listeningFullTest7'
import { listeningFullTest8 } from './listeningFullTest8'
import { listeningFullTest9 } from './listeningFullTest9'
import { listeningFullTest10 } from './listeningFullTest10'
import { listeningFullTest11 } from './listeningFullTest11'
import { listeningFullTest12 } from './listeningFullTest12'
import { listeningFullTest13 } from './listeningFullTest13'
import { listeningFullTest14 } from './listeningFullTest14'
import { listeningFullTest15 } from './listeningFullTest15'
import { listeningFullTest16 } from './listeningFullTest16'
import { listeningFullTest17 } from './listeningFullTest17'
import { listeningFullTest18 } from './listeningFullTest18'
import { listeningFullTest19 } from './listeningFullTest19'
import { listeningFullTest20 } from './listeningFullTest20'
import { listeningFullTest21 } from './listeningFullTest21'
import { listeningFullTest22 } from './listeningFullTest22'
import { listeningFullTests23to30 } from './listeningFullTests23to30'

// Test 1 originally shipped with four copies of Test 3's complete recording
// and placeholder questions/keys. Keep its public IDs for saved attempts while
// using the paper that actually belongs to that recording.
const listeningFullTest1: IELTSTest = {
  ...listeningFullTest3,
  id: 'ielts-listening-1',
  title: 'IELTS Listening Full Test 1',
  sections: listeningFullTest3.sections.map((section, index) => ({
    ...section,
    id: `ielts-listening-test1-part${index + 1}`,
    questions: section.questions.map(question => ({ ...question, id: `ls1-q${question.number}` })),
  })),
}
export const mockListeningTests: IELTSTest[] = [
  listeningFullTest1,
  listeningFullTest2,
  listeningFullTest3,
  listeningFullTest4,
  listeningFullTest5,
  listeningFullTest6,
  listeningFullTest7,
  listeningFullTest8,
  listeningFullTest9,
  listeningFullTest10,
  listeningFullTest11,
  listeningFullTest12,
  listeningFullTest13,
  listeningFullTest14,
  listeningFullTest15,
  listeningFullTest16,
  listeningFullTest17,
  listeningFullTest18,
  listeningFullTest19,
  listeningFullTest20,
  listeningFullTest21,
  listeningFullTest22,
  ...listeningFullTests23to30,
]
