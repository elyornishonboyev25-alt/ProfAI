export interface Qs2027Ranking {
  rank: number
  rankTied?: boolean
  overallScore?: number
}

// Official QS World University Rankings 2027 results, published 18 June 2026.
// IDs match the local university profile catalog so ranking data stays separate
// from admissions content and can be replaced cleanly for the next edition.
export const QS_2027_RANKINGS: Record<string, Qs2027Ranking> = {
  mit: { rank: 1, overallScore: 100 },
  'imperial-college-london': { rank: 2, rankTied: true, overallScore: 99.2 },
  'stanford-university': { rank: 2, rankTied: true, overallScore: 99.2 },
  'university-of-oxford': { rank: 4, overallScore: 98.6 },
  'harvard-university': { rank: 5, overallScore: 97.4 },
  'university-of-cambridge': { rank: 6, overallScore: 97.1 },
  caltech: { rank: 7, overallScore: 96.6 },
  'eth-zurich': { rank: 8, rankTied: true, overallScore: 96.3 },
  ucl: { rank: 8, rankTied: true, overallScore: 96.3 },
  'national-university-of-singapore': { rank: 10, overallScore: 96.2 },
  'university-of-hong-kong': { rank: 11, overallScore: 95.9 },
  'nanyang-technological-university': { rank: 12, overallScore: 93.6 },
  'peking-university': { rank: 13, overallScore: 92.6 },
  'tsinghua-university': { rank: 14, overallScore: 92.1 },
  'university-of-pennsylvania': { rank: 15, overallScore: 91.7 },
  'cornell-university': { rank: 16, rankTied: true, overallScore: 91.5 },
  'yale-university': { rank: 16, rankTied: true, overallScore: 91.5 },
  'chinese-university-of-hong-kong': { rank: 18, overallScore: 89.9 },
  'unsw-sydney': { rank: 19, overallScore: 89.8 },
  'johns-hopkins-university': { rank: 20, rankTied: true, overallScore: 89.7 },
  'uc-berkeley': { rank: 20, rankTied: true, overallScore: 89.7 },
  epfl: { rank: 22, rankTied: true, overallScore: 89.6 },
  'university-of-melbourne': { rank: 22, rankTied: true, overallScore: 89.6 },
  'university-of-chicago': { rank: 24, overallScore: 89.2 },
  'technical-university-of-munich': { rank: 25, overallScore: 89.1 },
  'fudan-university': { rank: 26, overallScore: 89 },
  'princeton-university': { rank: 27, overallScore: 88.9 },
  'university-of-sydney': { rank: 28, overallScore: 88.4 },
  'australian-national-university': { rank: 29, overallScore: 87.6 },
  'mcgill-university': { rank: 30, overallScore: 87.5 },
  'monash-university': { rank: 31, overallScore: 87 },
  'university-of-toronto': { rank: 32, overallScore: 86.8 },
  hkust: { rank: 33, overallScore: 86.4 },
  'universite-psl': { rank: 34, overallScore: 86 },
  'university-of-edinburgh': { rank: 35, overallScore: 85.9 },
  'shanghai-jiao-tong-university': { rank: 36, overallScore: 85.8 },
  'kings-college-london': { rank: 37, overallScore: 85.7 },
  'seoul-national-university': { rank: 38, overallScore: 85.4 },
  'university-of-tokyo': { rank: 39, overallScore: 84.8 },
  'university-of-manchester': { rank: 40, rankTied: true, overallScore: 84.6 },
  'university-of-queensland': { rank: 40, rankTied: true, overallScore: 84.6 },
  'yonsei-university': { rank: 42, overallScore: 84.2 },
  'columbia-university': { rank: 43, rankTied: true, overallScore: 84 },
  'institut-polytechnique-de-paris': { rank: 43, rankTied: true, overallScore: 84 },
  'northwestern-university': { rank: 45, rankTied: true, overallScore: 83.8 },
  'university-of-british-columbia': { rank: 45, rankTied: true, overallScore: 83.9 },
  'zhejiang-university': { rank: 47, overallScore: 83.5 },
  'delft-university-of-technology': { rank: 48, overallScore: 83.1 },
  ucla: { rank: 49, overallScore: 82.7 },
  'hong-kong-polytechnic-university': { rank: 50, overallScore: 82.3 },
  'brown-university': { rank: 66, overallScore: 77.4 },
  'dartmouth-college': { rank: 270, rankTied: true },
}

export const QS_2027_TOP_50_IDS = new Set(
  Object.entries(QS_2027_RANKINGS)
    .filter(([, ranking]) => ranking.rank <= 50)
    .map(([id]) => id),
)
