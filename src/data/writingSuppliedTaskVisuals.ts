import type { WritingTask } from './writingTestData'

// Transcribed from the supplied screenshots. Bar heights are approximate where
// the original chart does not print values; evaluation must allow estimates.
export const SUPPLIED_TASK_VISUALS: Record<number, {
  kind: string; title: string; lead: string; context: string; instructions?: string
  diagram: NonNullable<WritingTask['diagram']>
}> = {
  6: {
    kind: 'Line graph', title: 'International students at a UK university',
    lead: 'The chart shows the number of international students studying at a UK university between 1995 and 2015.',
    instructions: 'Summarise the information by selecting and reporting the main features and make comparisons where relevant. You should spend about 20 minutes on this task.',
    diagram: 'international-students-1995-2015',
    context: 'International students at a UK university. Students, not percentages. Years 1995, 2000, 2005, 2010, 2015. Approximate point heights: Asia 60, 70, 90, 110, 120 (solid line, diamond markers); Africa 20, 19, 20, 30, 20 (dashed line, square markers); Europe 50, 55, 50, 55, 50 (dotted line, triangle markers); North America 40, 40, 35, 40, 70 (solid line without markers). Vertical scale 0–140 in increments of 20; horizontal axis Year; vertical axis Students. Accept reasonable estimates because individual figures are not printed on the source.',
  },
  8: {
    kind: 'Pie charts', title: 'Comparison of Energy Production',
    lead: 'The pie charts above show a comparison of kinds of energy production in a European country in 1995 and 2005.',
    diagram: 'energy-production-1995-2005',
    context: 'Comparison of Energy Production, 1995 and 2005. Percentages exactly as printed. 1995: Coal 29.80%, Gas 29.63%, Petro 29.27%, Nuclear 6.40%, Other 4.90%. 2005: Coal 30.93%, Gas 30.31%, Petro 19.55%, Nuclear 10.10%, Other 9.10%. Coal black, Gas grey, Petro orange, Nuclear red, Other green. Both pies start with Coal in the upper-right sector, Other at the right, Nuclear at the lower-right, Petro at the bottom and Gas at the left. The printed 2005 percentages total 99.99% due to rounding; preserve all printed values.',
  },
  11: {
    kind: 'Bar chart', title: 'Popular leisure activities in New Zealand',
    lead: 'The graphs illustrate the average amount of time per day spent on popular leisure activities of different age groups in New Zealand.',
    instructions: 'Provide an overview of the information by identifying and describing the key details, and include comparisons where appropriate. Your report should comprise a minimum of 150 words.',
    diagram: 'new-zealand-leisure-time',
    context: 'Two grey bar charts. Average minutes spent on reading for pleasure and Average minutes spent on listening to music. Age groups 15-24, 25-34, 35-44, 45-54, 55+. Approximate reading values in minutes per day: 20, 35, 45, 50, 70. Approximate listening to music values: 80, 60, 45, 60, 75. Both vertical scales 0–90 in increments of 10; vertical axis Minutes per day, horizontal axis Age groups. No individual values printed on the bars; accept reasonable estimates. The original page footer is Hanexenglish.edu.vn, page 1.',
  },
  12: {
    kind: 'Line graph', title: 'Number of patients to four clinics in one hospital',
    lead: 'The line graph shows the average number of weekly patients visiting four clinics of a hospital from 2010 to 2016.',
    diagram: 'hospital-clinics-2010-2016',
    context: 'Number of patients to four clinics in one hospital. Average weekly patients, 2010, 2012, 2014, 2016 respectively, approximate graph heights: Birth control 240, 280, 180, 240 (solid); Eye 125, 150, 250, 350 (dashed); Diabetic 65, 80, 100, 175 (dotted); Dental 100, 60, 125, 130 (dash-dot). Vertical scale 0–400 in increments of 50. Preserve the source series names Birth control, Eye, Diabetic, Dental. Values are not printed at the points; accept reasonable estimates.',
  },
  13: {
    kind: 'Process diagram', title: 'Geothermal power plant',
    lead: 'The diagram below shows how geothermal energy is used to produce electricity.',
    diagram: 'geothermal-power-plant',
    context: 'Geothermal power plant. Five numbered stages: 1 Cold water; 2 The injection well; 3 The production well; 4 Condenser; 5 Generator / Turbine. Cold water pumped down 4.5 km in the injection well, flows through the Geothermal zone (hot rocks), and Hot water pumped up through the production well to the Condenser. Steam flows left from the Condenser to the Turbine (powered by steam), which powers the Generator (powered by turbine and produces electricity). Electricity is transmitted to the pylon on the left. Preserve underground U-shaped pipes, down/up arrows, the steam arrow, machinery, tower, depth marker, all source labels, and the numbered circles.',
  },
  14: {
    kind: 'Line graph', title: 'IELTS Task 1: Tourist Office',
    lead: 'The chart shows requests for information at a tourist office in the United Kingdom from January to June.',
    diagram: 'tourist-office-enquiries',
    context: 'Requests for information at a tourist office in the United Kingdom, January to June. Months Jan, Feb, Mar, Apr, May, Jun. Approximate graph heights: in person 450, 600, 800, 1250, 1550, 1900 (blue diamond markers); by letter/email 750, 700, 700, 550, 350, 350 (red square markers); by telephone 900, 800, 1000, 1000, 1400, 1600 (green triangle markers). All three connecting lines are black and solid. Vertical scale 0–2000 in increments of 200; no individual figures printed on the lines, so accept reasonable estimates. Preserve the legend wording and placement at the right.',
  },
  18: {
    kind: 'Bar chart', title: 'Adults participating in major sports',
    lead: 'The chart below shows the number of adults participating in different major sports in one area, in 1997 and 2017.',
    diagram: 'major-sports-1997-2017',
    context: 'Number of adults in thousands, 1997 and 2017 respectively (approximate bar heights): Tennis 50 and 55; Basketball 9 and 23; Cricket 26 and 7; Golf 32 and 33; Swimming 35 and 35; Football 32 and 48; Rugby 33 and 49. Vertical scale 0–60 in steps of 10. Dark bars 1997, grey bars 2017. Accept reasonable estimates from the chart.',
  },
  19: {
    kind: 'Bar chart', title: 'Travel to and from school: children aged 5-12',
    lead: 'The chart below shows the number of trips made by children in one country in 1990 and 2010 to travel to and from school using different modes of transport.',
    diagram: 'school-travel-1990-2010',
    context: 'Travel to and from school: children aged 5–12. Total number of trips per year in millions, 1990 and 2010 respectively (approximate bar heights): car passenger 4.4 and 11.2; walking 12.5 and 6; cycling 6.2 and 2; walking and bus 5.8 and 3; bus 7 and 5. Vertical scale 0–14 in steps of 2. Black bars 1990; diagonal hatching 2010. Accept reasonable estimates from the chart.',
  },
  20: {
    kind: 'Process diagram', title: 'Brick Manufacturing',
    lead: 'The diagram below shows the process by which bricks are manufactured for the building industry.',
    diagram: 'supplied-brick-manufacturing',
    context: 'Brick Manufacturing: a digger excavates clay; clay passes through a metal grid onto a roller; sand and water are added; the mixture is shaped either by a wire cutter or by a mould into bricks. Both alternatives lead to a drying oven for 24–48 hrs, then a kiln at moderate temperature (200°C–980°C), a kiln at high temperature (870°C–1300°C), and a cooling chamber for 48–72 hrs. The bricks are packaged on a pallet and delivered by truck. Preserve the two alternative shaping paths and the right-to-left heating/cooling sequence.',
  },
  21: {
    kind: 'Maps', title: 'A small local museum in 1957 and 2007',
    lead: 'The diagram below shows a small local museum and its surroundings in 1957 and 2007.',
    diagram: 'museum-1957-2007',
    context: 'Museum 1957: garden surrounding a central building; national history exhibition in the north, local history room in the southwest, museum store-room in the southeast, entrance hall between them, curved approach from the road to the south; trees throughout the garden and a hedge beside the road. Museum 2007: garden remains in the northwest, with two trees; enlarged museum in the east, special exhibitions and education centre in the north, local history room in the middle, museum shop in the southwest, reception in the south centre and cafe in the southeast. Entrance on the south side beside the shop. Car park replaces the southern garden, accessed from the road. The eastern boundary extends north of the site.',
  },
  22: {
    kind: 'Bar chart', title: 'Frequency of eating at fast food restaurants among people in the USA (2003–2013)',
    lead: 'The chart below shows how frequently people in the USA ate in fast food restaurants between 2003 and 2013.',
    diagram: 'usa-fast-food-2003-2013',
    context: 'Percentage of people; 2003, 2006, 2013 respectively, approximate bar heights: Every day 4, 3, 3; Several times a week 17, 20, 16; Once a week 31, 33, 28; Once or twice a month 30, 25, 33; A few times a year 13, 15, 15; Never 5, 4, 4. Scale 0%–40% in steps of 5%. 2003 dark stipple, 2006 light stipple, 2013 diagonal hatching. Values are not printed on the source bars; accept reasonable estimates.',
  },
  23: {
    kind: 'Charts', title: 'Police Budget 2017–2018 (in £m)',
    lead: 'The table and charts below give information on the police budget for 2017 and 2018 in one area of Britain. The table shows where the money came from and the charts show how it was distributed.',
    diagram: 'police-budget-2017-2018',
    context: 'Police Budget 2017–2018 (in £m). Sources, 2017, 2018: National Government 175.5m, 177.8m; Local Taxes 91.2m, 102.3m; Other sources (eg grants) 38m, 38.5m; Total 304.7m, 318.6m. How the money was spent: 2017 Salaries (officers and staff) 75%, Technology 8%, Buildings and transport 17%; 2018 Salaries 69%, Technology 14%, Buildings and transport 17%. Grey salaries, white technology, black buildings and transport.',
  },
  24: {
    kind: 'Bar chart', title: 'Favourite leisure activities of teenagers in Canada',
    lead: 'Alternatively, a bar chart may be static with the data coming from one point in time, as in the example below. For this graphic, we would need to compare the different variables, that is, the different leisure activities favoured by Canadian boys and girls.',
    diagram: 'canada-teenage-leisure',
    context: 'Favourite leisure activities of teenagers in Canada. Sports, Computer Games, Music, Shopping. Boys and Girls respectively, approximate percentages: Sports 28 and 13; Computer Games 19 and 16; Music 21 and 21; Shopping 36 and 8. Green cylindrical bars for Boys; yellow cylindrical bars for Girls. Source vertical labels 0% to 35% in increments of 5%; shopping Boys extends slightly above 35%. No exact values printed; accept reasonable estimates.',
  },
  25: {
    kind: 'Maps', title: 'UNIVERSITY SPORTS CENTRE (present / future plans)',
    lead: 'The plans below show a university sports centre at present and its future plans.',
    diagram: 'university-sports-centre',
    context: 'Present: central 25m Pool with Gym to the north, Changing room to the west, Seating to the east, Reception to the south and entrance from the south; Outdoor courts on both sides. Future plans: central 25m Pool, Changing room, Seating and Reception remain. Expanded building replaces western Outdoor courts with a Leisure pool and eastern Outdoor courts with a Sports hall and two Dance studios along the east wall. Gym expands east. Changing rooms added at southwest and southeast corners, Sports shop beside southwest changing room, Café beside southeast changing room. Entrance remains south. Both compasses point north up, east right, south down and west left.',
  },
  26: {
    kind: 'Bar chart', title: 'Contribution of selected sectors to the UK economy in the twentieth century',
    lead: 'The graph below shows the contribution of three sectors – agriculture, manufacturing, and business and financial services – to the UK economy in the twentieth century.',
    diagram: 'uk-economic-sectors',
    context: 'Contribution of selected sectors to the UK economy in the twentieth century, percent; 1900, 1950, 1975, 2000 respectively. Agriculture approximately 49, 52, 11, 2; Manufacturing 45, 38, 33, 16; Business and Financial 3.5, 10, 21, 35. Vertical scale 0–60 in steps of 10. Light grey agriculture, dark grey manufacturing, white business and financial. Values not printed on bars; accept reasonable estimates.',
  },
  27: {
    kind: 'Line graph', title: 'Average carbon dioxide (CO₂) emissions per person, 1967–2007',
    lead: 'The graph below shows average carbon dioxide (CO₂) emissions per person in the United Kingdom, Sweden, Italy and Portugal between 1967 and 2007.',
    diagram: 'co2-emissions-1967-2007',
    context: 'CO₂ emissions in metric tonnes per person, 1967, 1977, 1987, 1997, 2007 respectively, approximate line heights: United Kingdom 10.8, 10.7, 10, 9.5, 8.7 (dash-dot); Sweden 8.7, 10.2, 7, 6.1, 5.4 (dashed); Italy 4.2, 6.3, 6.7, 7.7, 7.7 (solid); Portugal 1.1, 2.2, 3.2, 5.2, 5.4 (dotted). Scale 0–12 metric tonnes in increments of 2. Accept reasonable estimates; no numerical point labels in the source.',
  },
  28: {
    kind: 'Process diagram', title: 'Aluminium recycle',
    lead: 'The diagram below shows the recycling process of aluminium cans.',
    diagram: 'aluminium-can-recycling',
    context: 'Clockwise aluminium can recycling cycle: used cans deposited in an Aluminium only bin; COLLECTION by truck; CLEANING, SORTING, SHREDDING AND COMPRESSING; HEATING AND MELTING; ROLLING 2.5mm - 6mm thick; RECYCLING into cans; REUSING, 74% recycled (UK); returns to used cans. Central black burst labelled Aluminium recycle, with www.ielts-exam.net underneath. Preserve the six visible arrows and the clockwise cycle, machinery, person, bin, truck, rolled sheet and four reused beverage cans.',
  },
  29: {
    kind: 'Table', title: 'Bicycle riding by age group in 2012',
    lead: 'The table below shows the percentage of the population who rode bicycles in one town by age group in 2012.',
    diagram: 'bicycle-riding-2012',
    context: 'Age Group, Female, Male (percent). 0-9: 52.5, 51.2; 10-19: 43.6, 25.1; 20-39: 18.2, 10.8; 40-59: 13.7, 9.3; 60+: 19.8, 14.6. Grey header and alternating light grey rows. Source instruction says Summarise the important information by selecting and reporting the main features, and make comparisons where relevant.',
    instructions: 'Summarise the important information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
  },
  30: {
    kind: 'Bar chart', title: 'Percentage of Australian men and women doing regular physical activity: 2010',
    lead: 'The bar chart below shows the percentage of Australian men and women in different age groups who did regular physical activity in 2010.',
    diagram: 'australian-physical-activity-2010',
    context: 'Percentage of Australian men and women doing regular physical activity: 2010. Age group, Male, Female: 15 to 24, 52.8, 47.7; 25 to 34, 42.2, 48.9; 35 to 44, 39.5, 52.5; 45 to 54, 43.1, 53.3; 55 to 64, 45.1, 53; 65 and over, 46.7, 47.1. Percentage (%) scale 0–60 in increments of 10. Male bars diagonally hatched; Female bars black; exact figures printed above each bar.',
  },
}
