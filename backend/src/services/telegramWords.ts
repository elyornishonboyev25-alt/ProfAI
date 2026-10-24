export type DailyWord = { word: string; type: string; uz: string; ru: string; en: string; example: string }

// Common IELTS / SAT academic words. The bot walks this list one word per day.
// `en` is a short learner's definition shown to English-language users.
export const DAILY_WORDS: DailyWord[] = [
  { word: 'mitigate', type: 'verb', uz: 'yengillashtirmoq, kamaytirmoq', ru: 'смягчать, уменьшать', en: 'to make something bad less serious', example: 'Governments must act to mitigate the effects of climate change.' },
  { word: 'substantial', type: 'adj', uz: 'sezilarli, katta', ru: 'значительный, существенный', en: 'large in amount or importance', example: 'There was a substantial increase in online learning.' },
  { word: 'inevitable', type: 'adj', uz: 'muqarrar, oldini olib bo\'lmaydigan', ru: 'неизбежный', en: 'certain to happen and impossible to avoid', example: 'Change is inevitable in any growing economy.' },
  { word: 'consequently', type: 'adv', uz: 'natijada, shu sababli', ru: 'следовательно, в результате', en: 'as a result', example: 'He studied hard; consequently, he passed the exam.' },
  { word: 'implement', type: 'verb', uz: 'amalga oshirmoq', ru: 'внедрять, осуществлять', en: 'to put a plan or decision into action', example: 'The school will implement a new reading program.' },
  { word: 'controversial', type: 'adj', uz: 'bahsli, munozarali', ru: 'спорный, противоречивый', en: 'causing a lot of public disagreement', example: 'Homework bans are a controversial idea.' },
  { word: 'enhance', type: 'verb', uz: 'yaxshilamoq, kuchaytirmoq', ru: 'улучшать, усиливать', en: 'to improve the quality or value of something', example: 'Reading daily can enhance your vocabulary.' },
  { word: 'fluctuate', type: 'verb', uz: 'o\'zgarib turmoq, tebranmoq', ru: 'колебаться, меняться', en: 'to change often between higher and lower levels', example: 'Prices fluctuate throughout the year.' },
  { word: 'perspective', type: 'noun', uz: 'nuqtai nazar', ru: 'точка зрения, взгляд', en: 'a particular way of thinking about something', example: 'Travel gives you a new perspective on life.' },
  { word: 'sustainable', type: 'adj', uz: 'barqaror, uzoq muddat saqlanadigan', ru: 'устойчивый, долговечный', en: 'able to continue without harming the environment', example: 'We need sustainable sources of energy.' },
  { word: 'demonstrate', type: 'verb', uz: 'ko\'rsatmoq, isbotlamoq', ru: 'показывать, доказывать', en: 'to show clearly that something is true', example: 'The study demonstrates a clear link between sleep and memory.' },
  { word: 'adequate', type: 'adj', uz: 'yetarli, munosib', ru: 'достаточный, адекватный', en: 'enough or good enough for a purpose', example: 'Many students do not get adequate sleep.' },
  { word: 'obtain', type: 'verb', uz: 'qo\'lga kiritmoq, olmoq', ru: 'получать, добывать', en: 'to get something, especially with effort', example: 'She obtained a scholarship to study abroad.' },
  { word: 'preliminary', type: 'adj', uz: 'dastlabki, boshlang\'ich', ru: 'предварительный', en: 'coming before the main part; early', example: 'The preliminary results look promising.' },
  { word: 'phenomenon', type: 'noun', uz: 'hodisa', ru: 'явление, феномен', en: 'something that happens and can be observed', example: 'Urbanisation is a global phenomenon.' },
  { word: 'rigorous', type: 'adj', uz: 'qat\'iy, puxta', ru: 'строгий, тщательный', en: 'very careful, thorough and strict', example: 'The university has a rigorous admission process.' },
  { word: 'advocate', type: 'verb', uz: 'targ\'ib qilmoq, yoqlamoq', ru: 'выступать за, отстаивать', en: 'to publicly support an idea or plan', example: 'Many experts advocate shorter working weeks.' },
  { word: 'deteriorate', type: 'verb', uz: 'yomonlashmoq', ru: 'ухудшаться', en: 'to become worse', example: 'Air quality has deteriorated in big cities.' },
  { word: 'contemporary', type: 'adj', uz: 'zamonaviy, hozirgi', ru: 'современный', en: 'belonging to the present time', example: 'Contemporary art attracts young visitors.' },
  { word: 'exploit', type: 'verb', uz: 'foydalanmoq; ekspluatatsiya qilmoq', ru: 'использовать, эксплуатировать', en: 'to use something fully, sometimes unfairly', example: 'Companies exploit new technology to cut costs.' },
  { word: 'comprehensive', type: 'adj', uz: 'har tomonlama, to\'liq', ru: 'всесторонний, полный', en: 'including everything that is needed', example: 'The report gives a comprehensive overview of the market.' },
  { word: 'alleviate', type: 'verb', uz: 'yengillatmoq (og\'riq, muammo)', ru: 'облегчать, ослаблять', en: 'to make pain or a problem less severe', example: 'New roads will alleviate traffic congestion.' },
  { word: 'intricate', type: 'adj', uz: 'murakkab, nozik', ru: 'сложный, замысловатый', en: 'having many small, detailed parts', example: 'The intricate design took months to finish.' },
  { word: 'undermine', type: 'verb', uz: 'zaiflashtirmoq, buzmoq', ru: 'подрывать, ослаблять', en: 'to gradually make something weaker', example: 'Constant criticism can undermine confidence.' },
  { word: 'proficiency', type: 'noun', uz: 'mahorat, malaka', ru: 'владение, мастерство', en: 'a high level of skill or ability', example: 'Proficiency in English opens many doors.' },
  { word: 'ambiguous', type: 'adj', uz: 'noaniq, ikki ma\'noli', ru: 'двусмысленный, неоднозначный', en: 'having more than one possible meaning', example: 'The question was ambiguous, so I asked for help.' },
  { word: 'diminish', type: 'verb', uz: 'kamaymoq, kamaytirmoq', ru: 'уменьшаться, снижаться', en: 'to become or make smaller or less', example: 'Interest in the topic has diminished over time.' },
  { word: 'coherent', type: 'adj', uz: 'izchil, mantiqiy bog\'langan', ru: 'связный, последовательный', en: 'clear, logical and well organised', example: 'A good essay has a coherent structure.' },
  { word: 'reluctant', type: 'adj', uz: 'istamaydigan, ikkilanayotgan', ru: 'неохотный, сопротивляющийся', en: 'not willing to do something', example: 'He was reluctant to speak in public.' },
  { word: 'prevalent', type: 'adj', uz: 'keng tarqalgan', ru: 'распространённый', en: 'common or widespread', example: 'Online shopping is increasingly prevalent.' },
  { word: 'justify', type: 'verb', uz: 'oqlamoq, asoslab bermoq', ru: 'обосновывать, оправдывать', en: 'to give good reasons for something', example: 'Can you justify your answer with evidence?' },
  { word: 'crucial', type: 'adj', uz: 'hal qiluvchi, juda muhim', ru: 'решающий, крайне важный', en: 'extremely important', example: 'Practice is crucial for speaking fluency.' },
  { word: 'foster', type: 'verb', uz: 'rivojlantirmoq, qo\'llab-quvvatlamoq', ru: 'развивать, поощрять', en: 'to encourage something to develop', example: 'Teachers should foster curiosity in children.' },
  { word: 'scarce', type: 'adj', uz: 'kam uchraydigan, tanqis', ru: 'дефицитный, скудный', en: 'not available in large amounts', example: 'Fresh water is scarce in some regions.' },
  { word: 'accumulate', type: 'verb', uz: 'to\'plamoq, yig\'ilmoq', ru: 'накапливать, накапливаться', en: 'to gradually collect more of something', example: 'Small savings accumulate over the years.' },
  { word: 'subsequent', type: 'adj', uz: 'keyingi', ru: 'последующий', en: 'happening after something else', example: 'Subsequent studies confirmed the findings.' },
  { word: 'conform', type: 'verb', uz: 'mos kelmoq, rioya qilmoq', ru: 'соответствовать, подчиняться', en: 'to follow a rule or standard', example: 'All buildings must conform to safety rules.' },
  { word: 'tangible', type: 'adj', uz: 'aniq, sezilarli (ko\'zga ko\'rinadigan)', ru: 'ощутимый, осязаемый', en: 'real and able to be seen or measured', example: 'Students want tangible results from their effort.' },
  { word: 'resilient', type: 'adj', uz: 'chidamli, tez tiklanadigan', ru: 'стойкий, жизнестойкий', en: 'able to recover quickly from difficulties', example: 'Resilient learners keep trying after failure.' },
]

export function wordOfDay(date = new Date()): DailyWord {
  const dayNumber = Math.floor(date.getTime() / 86_400_000)
  return DAILY_WORDS[dayNumber % DAILY_WORDS.length]
}
