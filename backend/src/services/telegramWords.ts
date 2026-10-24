export type DailyWord = { word: string; type: string; uz: string; example: string }

// Common IELTS / SAT academic words. The bot walks this list one word per day.
export const DAILY_WORDS: DailyWord[] = [
  { word: 'mitigate', type: 'verb', uz: 'yengillashtirmoq, kamaytirmoq', example: 'Governments must act to mitigate the effects of climate change.' },
  { word: 'substantial', type: 'adj', uz: 'sezilarli, katta', example: 'There was a substantial increase in online learning.' },
  { word: 'inevitable', type: 'adj', uz: 'muqarrar, oldini bo\'lmaydigan', example: 'Change is inevitable in any growing economy.' },
  { word: 'consequently', type: 'adv', uz: 'natijada, shu sababli', example: 'He studied hard; consequently, he passed the exam.' },
  { word: 'implement', type: 'verb', uz: 'amalga oshirmoq', example: 'The school will implement a new reading program.' },
  { word: 'controversial', type: 'adj', uz: 'bahsli, munozarali', example: 'Homework bans are a controversial idea.' },
  { word: 'enhance', type: 'verb', uz: 'yaxshilamoq, kuchaytirmoq', example: 'Reading daily can enhance your vocabulary.' },
  { word: 'fluctuate', type: 'verb', uz: 'o\'zgarib turmoq, tebranmoq', example: 'Prices fluctuate throughout the year.' },
  { word: 'perspective', type: 'noun', uz: 'nuqtai nazar', example: 'Travel gives you a new perspective on life.' },
  { word: 'sustainable', type: 'adj', uz: 'barqaror, uzoq muddat saqlanadigan', example: 'We need sustainable sources of energy.' },
  { word: 'demonstrate', type: 'verb', uz: 'ko\'rsatmoq, isbotlamoq', example: 'The study demonstrates a clear link between sleep and memory.' },
  { word: 'adequate', type: 'adj', uz: 'yetarli, munosib', example: 'Many students do not get adequate sleep.' },
  { word: 'obtain', type: 'verb', uz: 'qo\'lga kiritmoq, olmoq', example: 'She obtained a scholarship to study abroad.' },
  { word: 'preliminary', type: 'adj', uz: 'dastlabki, boshlang\'ich', example: 'The preliminary results look promising.' },
  { word: 'phenomenon', type: 'noun', uz: 'hodisa', example: 'Urbanisation is a global phenomenon.' },
  { word: 'rigorous', type: 'adj', uz: 'qat\'iy, puxta', example: 'The university has a rigorous admission process.' },
  { word: 'advocate', type: 'verb', uz: 'targ\'ib qilmoq, yoqlamoq', example: 'Many experts advocate shorter working weeks.' },
  { word: 'deteriorate', type: 'verb', uz: 'yomonlashmoq', example: 'Air quality has deteriorated in big cities.' },
  { word: 'contemporary', type: 'adj', uz: 'zamonaviy, hozirgi', example: 'Contemporary art attracts young visitors.' },
  { word: 'exploit', type: 'verb', uz: 'foydalanmoq; ekspluatatsiya qilmoq', example: 'Companies exploit new technology to cut costs.' },
  { word: 'comprehensive', type: 'adj', uz: 'har tomonlama, to\'liq', example: 'The report gives a comprehensive overview of the market.' },
  { word: 'alleviate', type: 'verb', uz: 'yengillatmoq (og\'riq, muammo)', example: 'New roads will alleviate traffic congestion.' },
  { word: 'intricate', type: 'adj', uz: 'murakkab, nozik', example: 'The intricate design took months to finish.' },
  { word: 'undermine', type: 'verb', uz: 'zaiflashtirmoq, buzmoq', example: 'Constant criticism can undermine confidence.' },
  { word: 'proficiency', type: 'noun', uz: 'mahorat, malaka', example: 'Proficiency in English opens many doors.' },
  { word: 'ambiguous', type: 'adj', uz: 'noaniq, ikki ma\'noli', example: 'The question was ambiguous, so I asked for help.' },
  { word: 'diminish', type: 'verb', uz: 'kamaymoq, kamaytirmoq', example: 'Interest in the topic has diminished over time.' },
  { word: 'coherent', type: 'adj', uz: 'izchil, mantiqiy bog\'langan', example: 'A good essay has a coherent structure.' },
  { word: 'reluctant', type: 'adj', uz: 'istamaydigan, ikkilanayotgan', example: 'He was reluctant to speak in public.' },
  { word: 'prevalent', type: 'adj', uz: 'keng tarqalgan', example: 'Online shopping is increasingly prevalent.' },
  { word: 'justify', type: 'verb', uz: 'oqlamoq, asoslab bermoq', example: 'Can you justify your answer with evidence?' },
  { word: 'crucial', type: 'adj', uz: 'hal qiluvchi, juda muhim', example: 'Practice is crucial for speaking fluency.' },
  { word: 'foster', type: 'verb', uz: 'rivojlantirmoq, qo\'llab-quvvatlamoq', example: 'Teachers should foster curiosity in children.' },
  { word: 'scarce', type: 'adj', uz: 'kam uchraydigan, tanqis', example: 'Fresh water is scarce in some regions.' },
  { word: 'accumulate', type: 'verb', uz: 'to\'plamoq, yig\'ilmoq', example: 'Small savings accumulate over the years.' },
  { word: 'subsequent', type: 'adj', uz: 'keyingi', example: 'Subsequent studies confirmed the findings.' },
  { word: 'conform', type: 'verb', uz: 'mos kelmoq, rioya qilmoq', example: 'All buildings must conform to safety rules.' },
  { word: 'tangible', type: 'adj', uz: 'aniq, sezilarli (ko\'zga ko\'rinadigan)', example: 'Students want tangible results from their effort.' },
  { word: 'resilient', type: 'adj', uz: 'chidamli, tez tiklanadigan', example: 'Resilient learners keep trying after failure.' },
]

export function wordOfDay(date = new Date()): DailyWord {
  const dayNumber = Math.floor(date.getTime() / 86_400_000)
  return DAILY_WORDS[dayNumber % DAILY_WORDS.length]
}
