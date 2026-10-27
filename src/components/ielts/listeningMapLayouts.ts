import type { SourceMap } from './SourceListeningMap'

type Pin = [string, number, number, number?]
const layout = (id: string, src: string, width: number, height: number, numbers: number[], pins: Pin[], kind: SourceMap['kind'] = 'locations'): SourceMap => ({
  id, src, width, height, minWidth: 800, numbers, kind,
  points: pins.map(([label, x, y, size = 28]) => ({ label, x, y, width: size })),
})

// Positions are measured against each unchanged drawing's viewBox/image bounds.
// These are candidate locations, never positions inferred from correct answers.
export const listeningMapLayouts: SourceMap[] = [
  layout('cityscope', '/images/ielts-listening/test4-cityscope-sports-and-leisure.png', 460, 405, [15,16,17,18,19,20], [
    ['A',340,118,26],['B',130,218,26],['C',243,181,26],['D',343,199,26],['E',74,245,26],['F',225,230,26],['G',53,332,26],['H',197,305,30],
  ]),
  layout('selmore', '/images/ielts-listening/test5-selmore-public-library.jpg', 763, 460, [11,12,13,14,15], [
    ['11',112,333,68],['12',79,235,64],['13',81,170,65],['14',365,76,72],['15',628,120,67],
  ], 'words'),
  layout('albany', '/images/ielts-listening/test8-albany-fishing-map.png', 1420, 1108, [15,16,17,18,19,20], [
    ['A',466,157,58],['B',859,235,58],['C',1305,345,58],['D',219,696,58],['E',422,498,58],['F',996,696,58],['G',1333,600,58],['H',165,969,58],['I',477,773,58],
  ]),
  layout('clifton', '/images/ielts-listening/test9-clifton-bird-park-map.png', 949, 565, [16,17,18,19,20], [
    ['A',480,42,36],['B',408,101,36],['C',317,185,36],['D',493,166,36],['E',548,240,36],['F',292,374,36],['G',437,421,36],['H',406,496,36],
  ]),
  layout('race-village', '/images/ielts-listening-test15-race-village.png', 411, 315, [15,16,17,18,19,20], [
    ['A',75,164,20],['B',110,62,20],['C',208,40,20],['D',208,82,20],['E',343,37,20],['F',358,222,20],['G',270,220,18],['H',234,165,18],['I',134,235,18],
  ]),
  layout('college', '/images/ielts-listening-test17-college-plan.svg', 415, 450, [16,17,18,19,20], [
    ['A',126,84,25],['B',262,84,25],['C',126,171,25],['D',172,171,25],['E',354,198,25],['F',30,298,25],['G',229,280,20],['H',281,251,25],['I',354,251,25],['J',354,411,25],
  ]),
  layout('pennyfield', '/images/ielts-listening-test18-pennyfield-plan.svg', 520, 280, [18,19,20], [
    ['A',181,190,23],['B',121,135,23],['C',94,83,23],['D',197,76,23],['E',384,79,18],['F',467,125,23],['G',434,158,26],
  ]),
  layout('rivermead', '/images/ielts-listening-test20-rivermead-campus.svg', 540, 540, [15,16,17,18,19,20], [
    ['A',114,301,28],['B',179,230,28],['C',239,273,28],['D',326,221,28],['E',318,79,28],['F',355,137,28],['G',343,283,28],['H',432,305,28],['I',249,367,28],['J',197,332,28],
  ]),
  layout('brightwater', '/images/ielts-listening-test21-brightwater-park.svg', 800, 480, [11,12,13,14], [
    ['A',697,343,32],['B',687,112,32],['C',525,217,32],['D',481,175,32],['E',481,107,32],['F',204,120,32],['G',204,201,32],['H',175,407,30],['I',104,407,24],
  ]),
]

export function listeningMapLayoutFor(src: string, alt = '') {
  if (src.startsWith('data:')) return /Map of Race Village/i.test(alt) ? listeningMapLayouts.find(map => map.id === 'race-village') : undefined
  try { return listeningMapLayouts.find(map => map.src === new URL(src, 'https://ivygoo.com').pathname) }
  catch { return undefined }
}
