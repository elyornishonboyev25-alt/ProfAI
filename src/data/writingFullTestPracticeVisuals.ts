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
  5: {
    kind: 'Process diagram', chartType: 'process', title: 'Recycling glass bottles',
    lead: 'The diagram shows how used glass bottles are recycled and made into new bottles.',
    context: 'Six stages: used bottles are collected in a recycling bin, transported by truck, sorted by colour, washed and crushed into small pieces, melted in a furnace, and shaped into new bottles ready for use.',
  },
  6: {
    kind: 'Bar chart', chartType: 'bar', title: 'Travel to school',
    lead: 'The bar chart compares how children travelled to school in 2005 and 2025.',
    unit: 'Percent of children', categories: ['Walk', 'Bus', 'Car', 'Bicycle', 'Other'],
    series: [{ label: '2005', values: [35, 30, 20, 10, 5] }, { label: '2025', values: [25, 35, 25, 10, 5] }],
  },
  7: {
    kind: 'Line graph', chartType: 'line', title: 'Visitors to three museums',
    lead: 'The line graph shows the number of visitors to three museums between 2010 and 2022.',
    unit: 'Thousands of visitors', categories: ['2010', '2013', '2016', '2019', '2022'],
    series: [{ label: 'Museum A', values: [25, 30, 35, 40, 45] }, { label: 'Museum B', values: [40, 38, 32, 28, 25] }, { label: 'Museum C', values: [15, 20, 25, 30, 35] }],
  },
  8: {
    kind: 'Pie charts', chartType: 'pie', title: 'Household energy use',
    lead: 'The pie charts compare the uses of energy in an average household in 2000 and 2020.',
    unit: 'Percent', categories: ['Heating', 'Hot water', 'Appliances', 'Lighting', 'Other'],
    series: [{ label: '2000', values: [40, 20, 15, 15, 10] }, { label: '2020', values: [30, 25, 20, 15, 10] }],
  },
  9: {
    kind: 'Maps', chartType: 'map', title: 'Town centre',
    lead: 'The maps show changes to a small town centre between 2000 and 2025.',
    context: 'In 2000 a market stood in the northwest, a post office in the northeast, a car park in the southwest and open land in the southeast, with a central square and an east-west road. In 2025 the market is replaced by a shopping centre, the post office by a library, the open land by a café and the car park by a bus station. The central square and road remain; a new pedestrian path links the square to the south.',
  },
  10: {
    kind: 'Bar chart', chartType: 'stacked', title: 'Land use in four districts',
    lead: 'The stacked bar chart shows how land was used in four districts in 2020.',
    unit: 'Percent of land', categories: ['North', 'South', 'East', 'West'],
    series: [{ label: 'Housing', values: [45, 55, 35, 50] }, { label: 'Farming', values: [20, 10, 35, 15] }, { label: 'Industry', values: [15, 20, 10, 15] }, { label: 'Green space', values: [20, 15, 20, 20] }],
  },
  11: {
    kind: 'Process diagram', chartType: 'process', title: 'Producing canned fruit',
    lead: 'The diagram illustrates the stages involved in producing canned fruit.',
    context: 'Six stages: fruit is picked from trees, checked and sorted, washed, peeled and cut, placed in cans with syrup, sealed and heated, then packed for delivery.',
  },
  12: {
    kind: 'Bar chart', chartType: 'bar', title: 'Evening course enrolment',
    lead: 'The bar chart compares the numbers of men and women taking evening courses in a college in four years.',
    unit: 'Thousands of students', categories: ['2005', '2010', '2015', '2020'],
    series: [{ label: 'Men', values: [80, 90, 105, 115] }, { label: 'Women', values: [100, 110, 130, 140] }],
  },
  13: {
    kind: 'Line graph', chartType: 'line', title: 'Temperatures in two cities',
    lead: 'The line graph compares average temperatures in two cities at six points during a year.',
    unit: 'Degrees Celsius', categories: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
    series: [{ label: 'City A', values: [15, 18, 24, 30, 25, 18] }, { label: 'City B', values: [26, 24, 19, 15, 20, 25] }],
  },
  14: {
    kind: 'Pie charts', chartType: 'pie', title: 'Household spending',
    lead: 'The pie charts show how an average household divided its spending in 2000 and 2020.',
    unit: 'Percent', categories: ['Housing', 'Food', 'Transport', 'Leisure', 'Other'],
    series: [{ label: '2000', values: [30, 25, 15, 20, 10] }, { label: '2020', values: [40, 20, 20, 15, 5] }],
  },
  15: {
    kind: 'Maps', chartType: 'map', title: 'College campus',
    lead: 'The maps compare a college campus in 2005 and 2025.',
    context: 'In 2005 the campus had a library in the northwest, classrooms in the northeast, a sports field in the southwest and a car park in the southeast. A central path ran north-south. By 2025 the library and classrooms remained, the sports field was replaced by a science building, the car park moved to the west edge, a student centre occupied the southeast, and a new east-west path crossed the central path.',
  },
  16: {
    kind: 'Bar chart', chartType: 'bar', title: 'Weekly exercise',
    lead: 'The bar chart compares the average weekly exercise hours of men and women in four age groups.',
    unit: 'Hours per week', categories: ['18–29', '30–44', '45–59', '60+'],
    series: [{ label: 'Men', values: [5, 6, 4, 3] }, { label: 'Women', values: [4, 5, 5, 4] }],
  },
  17: {
    kind: 'Line graph', chartType: 'line', title: 'Water use by sector',
    lead: 'The line graph shows water use by three sectors in a city from 1990 to 2020.',
    unit: 'Million litres per day', categories: ['1990', '2000', '2010', '2020'],
    series: [{ label: 'Agriculture', values: [120, 130, 135, 140] }, { label: 'Industry', values: [90, 85, 80, 75] }, { label: 'Households', values: [50, 60, 70, 80] }],
  },
  18: {
    kind: 'Process diagram', chartType: 'process', title: 'Recycling used paper',
    lead: 'The diagram shows how used paper is recycled into new paper.',
    context: 'Six stages: used paper is collected, sorted, mixed with water to make pulp, cleaned through a screen, pressed and dried, and rolled into new paper.',
  },
  19: {
    kind: 'Pie charts', chartType: 'pie', title: 'Land use in a village',
    lead: 'The pie charts compare land use in a village in 1990 and 2020.',
    unit: 'Percent', categories: ['Farmland', 'Housing', 'Woodland', 'Recreation'],
    series: [{ label: '1990', values: [50, 20, 20, 10] }, { label: '2020', values: [25, 40, 15, 20] }],
  },
  20: {
    kind: 'Bar chart', chartType: 'bar', title: 'Recycling rates',
    lead: 'The bar chart compares the proportions of four materials that were recycled in 2010 and 2020.',
    unit: 'Percent recycled', categories: ['Paper', 'Glass', 'Metal', 'Plastic'],
    series: [{ label: '2010', values: [60, 40, 50, 15] }, { label: '2020', values: [75, 65, 70, 30] }],
  },
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
