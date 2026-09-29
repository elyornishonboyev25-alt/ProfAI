import type { WritingFullTest, WritingTask, WritingDataVisual } from './writingTestData'

// Original IELTS-style practice questions using sourced Our World in Data and
// World Bank observations. The visual and evaluation use identical data.
const DATA = [{"id":"SP.POP.TOTL","country":"USA","values":[295.517,309.378,321.815,331.578,336.755],"url":"https://api.worldbank.org/v2/country/USA/indicator/SP.POP.TOTL?format=json"},{"id":"SP.POP.TOTL","country":"GBR","values":[60.401,62.766,65.087,66.74,68.526],"url":"https://api.worldbank.org/v2/country/GBR/indicator/SP.POP.TOTL?format=json"},{"id":"SP.POP.TOTL","country":"JPN","values":[127.773,128.07,127.141,126.261,124.517],"url":"https://api.worldbank.org/v2/country/JPN/indicator/SP.POP.TOTL?format=json"},{"id":"SP.POP.TOTL","country":"IND","values":[1154.676,1243.482,1328.024,1402.618,1438.07],"url":"https://api.worldbank.org/v2/country/IND/indicator/SP.POP.TOTL?format=json"},{"id":"SP.POP.TOTL","country":"CHN","values":[1303.72,1337.705,1379.86,1411.1,1410.71],"url":"https://api.worldbank.org/v2/country/CHN/indicator/SP.POP.TOTL?format=json"},{"id":"NY.GDP.PCAP.CD","country":"USA","values":[44123,48643,56849,64465,82587],"url":"https://api.worldbank.org/v2/country/USA/indicator/NY.GDP.PCAP.CD?format=json"},{"id":"NY.GDP.PCAP.CD","country":"GBR","values":[42240,39778,45256,40815,49920],"url":"https://api.worldbank.org/v2/country/GBR/indicator/NY.GDP.PCAP.CD?format=json"},{"id":"NY.GDP.PCAP.CD","country":"JPN","values":[38159,45378,35665,41099,35215],"url":"https://api.worldbank.org/v2/country/JPN/indicator/NY.GDP.PCAP.CD?format=json"},{"id":"NY.GDP.PCAP.CD","country":"IND","values":[710,1348,1584,1907,2434],"url":"https://api.worldbank.org/v2/country/IND/indicator/NY.GDP.PCAP.CD?format=json"},{"id":"NY.GDP.PCAP.CD","country":"CHN","values":[1778,4629,8175,10627,12951],"url":"https://api.worldbank.org/v2/country/CHN/indicator/NY.GDP.PCAP.CD?format=json"},{"id":"IT.NET.USER.ZS","country":"USA","values":[67.97,71.69,74.55,90.34,93.53],"url":"https://api.worldbank.org/v2/country/USA/indicator/IT.NET.USER.ZS?format=json"},{"id":"IT.NET.USER.ZS","country":"IND","values":[2.39,7.5,14.9,43.41,60.25],"url":"https://api.worldbank.org/v2/country/IND/indicator/IT.NET.USER.ZS?format=json"},{"id":"NY.GDP.MKTP.KD.ZG","country":"USA","values":[3.48,2.7,2.95,-2.08,2.93],"url":"https://api.worldbank.org/v2/country/USA/indicator/NY.GDP.MKTP.KD.ZG?format=json"},{"id":"NY.GDP.MKTP.KD.ZG","country":"GBR","values":[2.79,2.26,2.14,-10.05,0.27],"url":"https://api.worldbank.org/v2/country/GBR/indicator/NY.GDP.MKTP.KD.ZG?format=json"},{"id":"NY.GDP.MKTP.KD.ZG","country":"IND","values":[7.92,8.5,8,-5.78,7.21],"url":"https://api.worldbank.org/v2/country/IND/indicator/NY.GDP.MKTP.KD.ZG?format=json"},{"id":"SP.URB.TOTL.IN.ZS","country":"GBR","values":[80.45,81,81.82,82.9,83.16],"url":"https://api.worldbank.org/v2/country/GBR/indicator/SP.URB.TOTL.IN.ZS?format=json"},{"id":"SP.URB.TOTL.IN.ZS","country":"JPN","values":[85.96,90.62,91.35,91.78,92.08],"url":"https://api.worldbank.org/v2/country/JPN/indicator/SP.URB.TOTL.IN.ZS?format=json"},{"id":"SP.URB.TOTL.IN.ZS","country":"IND","values":[29.09,30.9,32.55,34.13,35.07],"url":"https://api.worldbank.org/v2/country/IND/indicator/SP.URB.TOTL.IN.ZS?format=json"},{"id":"SP.URB.TOTL.IN.ZS","country":"CHN","values":[42.99,49.23,57.33,63.52,65.53],"url":"https://api.worldbank.org/v2/country/CHN/indicator/SP.URB.TOTL.IN.ZS?format=json"}] as const
const COUNTRY: Record<string, string> = {"USA":"the United States","GBR":"the United Kingdom","JPN":"Japan","IND":"India","CHN":"China"}
const METRIC: Record<string, { topic: string; unit: string }> = {"SP.POP.TOTL":{"topic":"population","unit":"million people"},"NY.GDP.PCAP.CD":{"topic":"GDP per person","unit":"current US dollars"},"IT.NET.USER.ZS":{"topic":"internet use","unit":"percent of population"},"NY.GDP.MKTP.KD.ZG":{"topic":"annual GDP growth","unit":"percent"},"SP.URB.TOTL.IN.ZS":{"topic":"urban population","unit":"percent of population"}}
const ESSAYS = [["Local libraries","Some people believe public libraries should focus mainly on books, while others think they should provide digital services and community spaces. Discuss both views and give your opinion."],["Remote work","Working from home has become common in many professions. Do the advantages of remote work for employees and employers outweigh its disadvantages?"],["Public transport","In large cities, governments should make public transport free to reduce traffic and pollution. To what extent do you agree or disagree?"],["School subjects","Some people think schools should devote more time to practical life skills than to traditional academic subjects. Discuss both views and give your opinion."],["Food waste","Large amounts of food are thrown away by households and businesses. What are the main causes of this problem, and what measures could reduce it?"],["Tourism limits","Some popular destinations limit visitor numbers to protect local communities and natural sites. Is this a positive or negative development?"],["University funding","Should governments pay the full cost of university education for all students? Discuss both views and give your opinion."],["Children and screens","Children are spending more time using screens for leisure. What effects might this have, and how can families respond?"],["City green space","Cities should give more land to parks and trees even when housing is in short supply. To what extent do you agree or disagree?"],["International study","Increasing numbers of students choose to study in another country. Do the benefits of this choice outweigh the drawbacks?"],["Advertising to children","Advertising aimed at children should be restricted. To what extent do you agree or disagree?"],["Working age","In some countries, people are encouraged to work beyond the traditional retirement age. What are the advantages and disadvantages for individuals and society?"],["Heritage buildings","When old buildings are costly to maintain, should cities replace them with modern buildings? Discuss both views and give your opinion."],["Health and exercise","Some people say individuals are responsible for staying healthy, while others believe governments should take a larger role. Discuss both views and give your opinion."],["News on social media","More people now get news from social media than from newspapers or television. Is this a positive or negative development?"],["Waste packaging","Manufacturers produce too much disposable packaging. Who should be responsible for reducing it: producers, shops, or consumers? Give reasons for your answer."],["Artificial intelligence at work","As artificial intelligence takes over routine work, what skills should schools and employers help people develop?"],["Sports funding","Some people think public money should support elite athletes, while others prefer funding local sports facilities. Discuss both views and give your opinion."],["Language learning","Learning a foreign language should be compulsory throughout school. To what extent do you agree or disagree?"],["Electric vehicles","Governments should encourage electric vehicles through subsidies and charging infrastructure. Do the advantages of this policy outweigh the costs?"],["Flexible school hours","Some schools are considering later start times for teenagers. What could be the benefits and drawbacks of this change?"],["Online shopping","Online shopping is replacing many physical stores. What effects does this have on towns and consumers?"],["Water use","Households and industry both use large amounts of water. What measures can reduce waste without limiting essential activities?"],["Scientific research","Some argue that scientific research should be directed mainly by governments rather than private companies. Discuss both views and give your opinion."],["Public art","Should cities spend public money on art in shared spaces when they also need to improve basic services? Discuss both views and give your opinion."],["Animal habitats","Protecting wildlife habitats sometimes restricts farming or construction. How should governments balance these interests?"]] as const
const YEARS = [2005, 2010, 2015, 2020, 2023]
const CURATED_VISUALS: WritingDataVisual[] = [
  {
    kind: 'bar',
    title: 'Life expectancy by world region, 2023',
    unit: 'years at birth',
    years: ['Africa', 'Asia', 'Americas', 'Europe', 'Oceania'],
    series: [{ label: 'Life expectancy', values: [63.8, 74.6, 77.3, 79.1, 79.1] }],
    sourceLabel: 'Our World in Data / UN World Population Prospects',
    sourceUrl: 'https://ourworldindata.org/grapher/life-expectancy',
    note: 'Regional values shown for 2023.',
  },
  {
    kind: 'table',
    title: 'Deaths of children under five in selected countries, 2023',
    unit: 'thousand children',
    years: ['Nigeria', 'India', 'Pakistan', 'DR Congo', 'Ethiopia'],
    series: [{ label: 'Deaths', values: [771.6, 642.6, 405.6, 312.1, 181] }],
    sourceLabel: 'Our World in Data / UN World Population Prospects',
    sourceUrl: 'https://ourworldindata.org/grapher/number-of-child-deaths-unwpp',
    note: 'Values rounded to the nearest 100 children.',
  },
  {
    kind: 'bar',
    title: 'Renewable share of final energy use, 2024 or latest available',
    unit: 'percent',
    years: ['USA', 'UK', 'Germany', 'India', 'Japan'],
    series: [{ label: 'Renewables', values: [12.25, 15.23, 21.23, 32.84, 9.68] }],
    sourceLabel: 'Our World in Data / UNSD, IEA and IRENA',
    sourceUrl: 'https://ourworldindata.org/grapher/share-of-final-energy-consumption-from-renewable-sources',
    note: 'A 2023 value is shown where 2024 data was unavailable.',
  },
  {
    kind: 'pie',
    title: 'Population using safely managed sanitation, 2024 or latest available',
    unit: 'percent',
    years: ['USA', 'UK', 'Japan', 'China', 'India'],
    series: [{ label: 'Population', values: [97, 98, 99, 69, 63] }],
    sourceLabel: 'Our World in Data / WHO and UNICEF JMP',
    sourceUrl: 'https://ourworldindata.org/grapher/share-using-safely-managed-sanitation',
    note: 'The closest year between 2014 and 2023 is shown where 2024 data was unavailable.',
  },
  {
    kind: 'bar',
    title: 'Carbon dioxide emissions per person, 2024',
    unit: 'tonnes per person',
    years: ['USA', 'China', 'EU 27', 'UK', 'India'],
    series: [{ label: 'CO₂ per person', values: [14.2, 8.66, 5.39, 4.53, 2.2] }],
    sourceLabel: 'Our World in Data / Global Carbon Budget',
    sourceUrl: 'https://ourworldindata.org/grapher/co-emissions-per-capita',
    note: 'Fossil fuel and industrial emissions; excludes land use change.',
  },
  {
    kind: 'bar', title: 'Exposure to fine particulate air pollution, 2023', unit: 'micrograms per cubic metre',
    years: ['USA', 'Qatar', 'Saudi Arabia', 'Bangladesh', 'India'],
    series: [{ label: 'PM2.5 exposure', values: [6.97, 107.76, 73.52, 69.25, 54.05] }],
    sourceLabel: 'Our World in Data', sourceUrl: 'https://ourworldindata.org/grapher/average-exposure-pm25-pollution',
    note: 'Annual mean population-weighted PM2.5 exposure.',
  },
  {
    kind: 'pie', title: 'Arable land as a share of land area, 2023', unit: 'percent',
    years: ['Bangladesh', 'Denmark', 'Ukraine', 'India', 'Brazil'],
    series: [{ label: 'Arable land', values: [60.63, 59.13, 56.82, 51.75, 6.66] }],
    sourceLabel: 'Our World in Data / FAO', sourceUrl: 'https://ourworldindata.org/grapher/share-of-land-area-used-for-arable-agriculture',
  },
  {
    kind: 'bar', title: 'International tourist arrivals, 2024', unit: 'million trips',
    years: ['Spain', 'USA', 'Italy', 'France', 'UK'],
    series: [{ label: 'Arrivals', values: [93.8, 72.4, 57.7, 48.4, 38.2] }],
    sourceLabel: 'Our World in Data / UN Tourism', sourceUrl: 'https://ourworldindata.org/grapher/international-tourist-trips',
    note: 'International arrivals as displayed in the source chart.',
  },
  {
    kind: 'pie', title: 'Agricultural land as a share of land area by region, 2023', unit: 'percent',
    years: ['South Asia', 'East Asia/Pacific', 'Sub-Saharan Africa', 'Europe/Central Asia', 'North America'],
    series: [{ label: 'Agricultural land', values: [58.34, 46.82, 44.7, 29.09, 26.67] }],
    sourceLabel: 'Our World in Data / FAO', sourceUrl: 'https://ourworldindata.org/grapher/share-of-land-area-used-for-agriculture',
  },
  {
    kind: 'table', title: 'Population with electricity access, 1990 and 2024', unit: 'percent',
    years: ['Bangladesh', 'India', 'Indonesia', 'Guatemala', 'Haiti'],
    series: [{ label: '1990', values: [14.3, 50.9, 48.9, 60.8, 31.3] }, { label: '2024', values: [99.5, 99.9, 99.9, 90.9, 53.9] }],
    sourceLabel: 'Our World in Data / World Bank', sourceUrl: 'https://ourworldindata.org/grapher/share-of-the-population-with-access-to-electricity',
  },
  {
    kind: 'bar', title: 'People who are undernourished, 2023', unit: 'million people',
    years: ['India', 'Nigeria', 'Pakistan', 'Bangladesh', 'Chad'],
    series: [{ label: 'People', values: [172, 45.4, 40.9, 17.9, 6.2] }],
    sourceLabel: 'Our World in Data / FAO', sourceUrl: 'https://ourworldindata.org/grapher/number-undernourished',
    note: 'Values are rounded to the precision displayed.',
  },
  {
    kind: 'table', title: 'Adults living with obesity, 1980 and 2024', unit: 'percent',
    years: ['Afghanistan', 'Albania', 'Argentina', 'Australia', 'Algeria'],
    series: [{ label: '1980', values: [0.8, 8.8, 8.7, 7.5, 6.7] }, { label: '2024', values: [18.8, 27.3, 38.1, 32.4, 24.3] }],
    sourceLabel: 'Our World in Data / WHO', sourceUrl: 'https://ourworldindata.org/grapher/share-of-adults-defined-as-obese',
  },
  {
    kind: 'bar', title: 'Air passengers carried, 2023 or latest available', unit: 'million passengers',
    years: ['USA', 'China', 'India', 'Japan', 'UK'],
    series: [{ label: 'Passengers', values: [942, 619, 180, 120, 119] }],
    sourceLabel: 'Our World in Data / World Bank', sourceUrl: 'https://ourworldindata.org/grapher/air-passengers-carried',
    note: 'Closest available observation is shown where 2023 data is missing.',
  },
  {
    kind: 'table', title: 'Annual hours worked per worker, 2023', unit: 'hours',
    years: ['China', 'USA', 'Australia', 'UK', 'Germany'],
    series: [{ label: 'Hours', values: [2300, 1800, 1600, 1500, 1300] }],
    sourceLabel: 'Our World in Data / Penn World Table', sourceUrl: 'https://ourworldindata.org/grapher/annual-working-hours-per-worker',
    note: 'Values are rounded to the nearest 100 hours as displayed by the source.',
  },
  {
    kind: 'bar', title: 'Share of global greenhouse gas emissions, 2024', unit: 'percent',
    years: ['China', 'USA', 'India', 'EU 27', 'Brazil'],
    series: [{ label: 'Global share', values: [25.92, 11.12, 7.83, 5.58, 5.15] }],
    sourceLabel: 'Our World in Data / Climate Watch', sourceUrl: 'https://ourworldindata.org/grapher/share-global-ghg-emissions',
    note: 'Greenhouse gas emissions, including land-use change.',
  },
  {
    kind: 'pie', title: 'Adult literacy, 2024 or latest available', unit: 'percent',
    years: ['China', 'Brazil', 'India', 'Bangladesh', 'Nigeria'],
    series: [{ label: 'Adults', values: [96.7, 94.7, 78.2, 79, 70.4] }],
    sourceLabel: 'Our World in Data / UNESCO', sourceUrl: 'https://ourworldindata.org/grapher/literacy',
    note: 'Closest available observation is shown where 2024 data is missing.',
  },
  {
    kind: 'bar', title: 'Medical doctors per 1,000 people, 2023 or latest available', unit: 'doctors',
    years: ['Germany', 'USA', 'China', 'UK', 'India'],
    series: [{ label: 'Doctors', values: [4.53, 3.68, 3.11, 3.3, 0.72] }],
    sourceLabel: 'Our World in Data / WHO', sourceUrl: 'https://ourworldindata.org/grapher/physicians-per-1000-people',
    note: 'Closest available observation is shown where 2023 data is missing.',
  },
  {
    kind: 'table', title: 'Scientific and technical journal articles, 2023', unit: 'articles',
    years: ['China', 'USA', 'India', 'Germany', 'UK'],
    series: [{ label: 'Articles', values: [932712, 430843, 228174, 108782, 97536] }],
    sourceLabel: 'Our World in Data / World Bank', sourceUrl: 'https://ourworldindata.org/grapher/scientific-and-technical-journal-articles',
  },
  {
    kind: 'bar', title: 'Hospital beds per 1,000 people, 2023 or latest available', unit: 'beds',
    years: ['Japan', 'South Korea', 'Germany', 'China', 'USA'],
    series: [{ label: 'Beds', values: [12.59, 12.81, 7.55, 5.63, 2.68] }],
    sourceLabel: 'Our World in Data / World Bank', sourceUrl: 'https://ourworldindata.org/grapher/hospital-beds-per-1000-people',
    note: 'Closest available observation is shown where 2023 data is missing.',
  },
]
const CURATED_LEADS = [
  'The bar chart compares life expectancy at birth across five world regions in 2023.',
  'The table shows the number of children under five who died in five countries in 2023.',
  'The bar chart compares the share of final energy use from renewable sources in five countries in 2024 or the latest available year.',
  'The table compares the proportion of people using safely managed sanitation in five countries in 2024 or the latest available year.',
  'The bar chart shows carbon dioxide emissions per person in five countries or regions in 2024.',
  'The bar chart compares exposure to fine particulate air pollution in five countries in 2023.',
  'The table compares the share of land used for arable agriculture in five countries in 2023.',
  'The bar chart shows international tourist arrivals in five countries in 2024.',
  'The table compares the share of land used for agriculture in five world regions in 2023.',
  'The table shows the proportion of people with access to electricity in five countries in 1990 and 2024.',
  'The bar chart shows the number of people who were undernourished in five countries in 2023.',
  'The table compares the proportion of adults living with obesity in five countries in 1980 and 2024.',
  'The bar chart compares air passenger numbers in five countries in 2023 or the latest available year.',
  'The table compares average annual working hours per worker in five countries in 2023.',
  'The bar chart shows five countries or regions and their shares of global greenhouse gas emissions in 2024.',
  'The table compares adult literacy rates in five countries in 2024 or the latest available year.',
  'The bar chart shows the number of medical doctors per 1,000 people in five countries in 2023 or the latest available year.',
  'The table compares the number of scientific and technical journal articles published in five countries in 2023.',
  'The bar chart compares hospital beds per 1,000 people in five countries in 2023 or the latest available year.',
]
const TASK_1_INSTRUCTIONS = 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.'
const TASK_2_INSTRUCTIONS = 'Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.'

type DataRow = typeof DATA[number]
function comparison(first: DataRow, second: DataRow): WritingDataVisual {
  const metric = METRIC[first.id]
  return {
    kind: 'line',
    title: `${metric.topic[0].toUpperCase() + metric.topic.slice(1)}: ${COUNTRY[first.country]} and ${COUNTRY[second.country]}`,
    unit: metric.unit,
    years: YEARS,
    series: [first, second].map((row) => ({ label: COUNTRY[row.country], values: [...row.values] })),
    sourceLabel: 'World Bank Open Data',
    sourceUrl: `https://data.worldbank.org/indicator/${first.id}`,
    note: `Source series: ${first.url} and ${second.url}`,
  }
}
function task(index: number, taskType: 'task1' | 'task2', lead: string, visual?: WritingDataVisual, question?: string, diagram?: WritingTask['diagram']): WritingTask {
  const number = taskType === 'task1' ? 1 : 2
  const instructions = taskType === 'task1' ? TASK_1_INSTRUCTIONS : TASK_2_INSTRUCTIONS
  const prompt = `${lead}${question ? `\n\n${question}` : ''}\n\n${instructions}`
  return {
    id: `writing-full-${index}-task-${number}`, day: null, fullTestIndex: index, taskType,
    title: `Full Writing Test ${index}`,
    subtitle: taskType === 'task1' ? `Task 1 · ${visual?.kind === 'line' ? 'Line graph' : visual?.kind === 'bar' ? 'Bar chart' : visual?.kind === 'table' ? 'Table' : visual?.kind === 'pie' ? 'Pie charts' : diagram === 'riverside-park' ? 'Maps' : 'Process diagram'} · ${visual?.title ?? (diagram === 'riverside-park' ? 'Riverside Park' : 'Brick manufacturing')}` : `Task 2 · Essay · ${ESSAYS[index - 5][0]}`,
    prompt, promptLead: lead, promptQuestion: question, instructions,
    suggestedWordCount: taskType === 'task1' ? { min: 150, max: 180 } : { min: 250, max: 280 },
    maxWordCount: taskType === 'task1' ? 500 : 800,
    durationMinutes: taskType === 'task1' ? 20 : 40,
    visual, diagram,
    visualContext: visual ? `${visual.title}; unit: ${visual.unit}. ${visual.years.map((year, yearIndex) => `${year}: ${visual.series.map((series) => `${series.label} ${series.values[yearIndex]}`).join(', ')}`).join('; ')}. ${visual.note ?? ''}` : diagram === 'brick-making' ? 'Brick manufacturing: clay is dug out, passes through a metal grid and roller, mixed with sand and water, shaped by wire cutter or mould, dried for 24–48 hours, heated in kilns at 200–980°C and 870–1300°C, cooled for 48–72 hours, then packaged and delivered.' : diagram === 'riverside-park' ? 'Riverside Park in 2000 and 2025. The river and north entrance remain. In 2000 the west side has a woodland and a small footpath; the centre has an open lawn; the east side has a pond and a picnic area. By 2025 a cycle path runs along the north edge, the woodland becomes a sports court, the lawn becomes a playground, the pond remains, a cafe replaces the picnic area, and a bridge crosses the river from the south entrance.' : undefined,
    available: true,
  }
}

export const WRITING_TESTS_5_TO_30: WritingFullTest[] = Array.from({ length: 26 }, (_, offset) => {
  const index = offset + 5
  const visual = index === 5 || index === 23 ? undefined : index <= 24
    ? CURATED_VISUALS[offset - 1]
    : (() => {
      const pairs = [
        ['SP.POP.TOTL', 'USA', 'JPN'],
        ['SP.POP.TOTL', 'IND', 'CHN'],
        ['NY.GDP.PCAP.CD', 'USA', 'GBR'],
        ['NY.GDP.PCAP.CD', 'GBR', 'JPN'],
        ['NY.GDP.MKTP.KD.ZG', 'USA', 'GBR'],
        ['SP.URB.TOTL.IN.ZS', 'IND', 'CHN'],
      ] as const
      const [indicator, first, second] = pairs[index - 25]
      return comparison(DATA.find((row) => row.id === indicator && row.country === first)!, DATA.find((row) => row.id === indicator && row.country === second)!)
    })()
  const task1Lead = index === 5
    ? 'The diagram shows the process by which bricks are manufactured for the building industry.'
    : index === 23
      ? 'The maps show how Riverside Park changed between 2000 and 2025.'
    : index <= 24
      ? visual?.kind === 'pie'
        ? CURATED_LEADS[offset - 1].replace(/^The table compares/, 'The pie charts compare').replace(/^The table shows/, 'The pie charts show')
        : CURATED_LEADS[offset - 1]
    : `The ${visual!.kind === 'table' ? 'table' : visual!.kind === 'bar' ? 'bar chart' : 'line graph'} shows ${visual!.title.toLowerCase()}.`
  const essayQuestion = ESSAYS[offset][1]
  return {
    id: `writing-full-${index}`, index, title: `Full Writing Test ${index}`, available: true,
    tasks: [
      task(index, 'task1', task1Lead, visual, undefined, index === 5 ? 'brick-making' : index === 23 ? 'riverside-park' : undefined),
      task(index, 'task2', essayQuestion, undefined),
    ],
  }
})
