export type PracticeTaskVisual = {
  kind: 'Line graph' | 'Bar chart' | 'Pie charts' | 'Maps' | 'Process diagram'
  chartType: 'line' | 'bar' | 'stacked' | 'pie' | 'map' | 'process'
  title: string
  lead: string
  unit?: string
  categories?: string[]
  series?: { label: string; values: number[] }[]
  context?: string
}

// Original IELTS-style practice material. Every chart value is visible in its SVG.
export const PRACTICE_TASK_VISUALS: Record<number, PracticeTaskVisual> = {
  21: {
    kind: 'Line graph', chartType: 'line', title: 'Rainfall in two cities',
    lead: 'The line graph compares average monthly rainfall in two cities during a year.',
    unit: 'Millimetres', categories: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
    series: [{ label: 'City A', values: [30, 45, 70, 80, 65, 40] }, { label: 'City B', values: [80, 65, 50, 30, 45, 70] }],
  },
  22: {
    kind: 'Maps', chartType: 'map', title: 'Seaside village',
    lead: 'The maps show how a seaside village changed between 1990 and 2020.',
    context: 'The sea and beach form the southern edge in both years, and the main road remains. In 1990 a farm occupied the west, a small row of houses the east, a shop the north and a pier reached the sea. By 2020 the farm became a hotel, more houses were built in the east, the shop became a restaurant and a marina replaced the pier. A coastal footpath was added.',
  },
  23: {
    kind: 'Process diagram', chartType: 'process', title: 'Making olive oil',
    lead: 'The diagram shows the process of producing olive oil from harvested olives.',
    context: 'Six stages: olives are harvested from trees, washed, crushed into a paste, pressed, separated into oil and water, and finally bottled for sale.',
  },
  24: {
    kind: 'Bar chart', chartType: 'stacked', title: 'Employment by sector',
    lead: 'The stacked bar chart compares the shares of employment in four sectors in three cities in 2020.',
    unit: 'Percent of workers', categories: ['City A', 'City B', 'City C'],
    series: [{ label: 'Agriculture', values: [15, 10, 5] }, { label: 'Manufacturing', values: [25, 30, 20] }, { label: 'Services', values: [45, 45, 55] }, { label: 'Other', values: [15, 15, 20] }],
  },
  25: {
    kind: 'Line graph', chartType: 'line', title: 'Cinema tickets by genre',
    lead: 'The line graph compares sales of cinema tickets for three film genres between 2000 and 2020.',
    unit: 'Millions of tickets', categories: ['2000', '2005', '2010', '2015', '2020'],
    series: [{ label: 'Action', values: [20, 25, 32, 39, 45] }, { label: 'Drama', values: [40, 38, 35, 30, 25] }, { label: 'Comedy', values: [30, 33, 31, 34, 32] }],
  },
  26: {
    kind: 'Pie charts', chartType: 'pie', title: 'Journeys to work',
    lead: 'The pie charts compare the methods used by people to travel to work in 2000 and 2020.',
    unit: 'Percent', categories: ['Car', 'Bus', 'Train', 'Bicycle', 'Walk'],
    series: [{ label: '2000', values: [50, 25, 10, 5, 10] }, { label: '2020', values: [40, 20, 20, 10, 10] }],
  },
  27: {
    kind: 'Bar chart', chartType: 'bar', title: 'Library books borrowed',
    lead: 'The bar chart compares the numbers of books borrowed from four library sections in 2010 and 2020.',
    unit: 'Thousands of books', categories: ['Fiction', 'Non-fiction', 'Children’s', 'Reference'],
    series: [{ label: '2010', values: [90, 60, 40, 20] }, { label: '2020', values: [70, 55, 65, 10] }],
  },
  28: {
    kind: 'Maps', chartType: 'map', title: 'Public park',
    lead: 'The maps show how a public park changed between 2000 and 2025.',
    context: 'A north entrance, central path and pond in the east remain. In 2000 there was woodland in the west, an open lawn in the centre and a picnic area in the southeast. By 2025 a sports court replaced the woodland, a playground replaced the lawn, a café replaced the picnic area and a cycle path was added along the northern edge.',
  },
  29: {
    kind: 'Line graph', chartType: 'line', title: 'Household chores',
    lead: 'The line graph compares the average weekly time men and women spent on household chores between 2000 and 2020.',
    unit: 'Hours per week', categories: ['2000', '2005', '2010', '2015', '2020'],
    series: [{ label: 'Women', values: [20, 18, 16, 14, 13] }, { label: 'Men', values: [8, 10, 11, 12, 13] }],
  },
  30: {
    kind: 'Pie charts', chartType: 'pie', title: 'University funding',
    lead: 'The pie charts show the sources of funding for a university in 2005 and 2025.',
    unit: 'Percent', categories: ['Government', 'Student fees', 'Donations', 'Research', 'Other'],
    series: [{ label: '2005', values: [60, 20, 10, 5, 5] }, { label: '2025', values: [40, 30, 15, 10, 5] }],
  },
}
