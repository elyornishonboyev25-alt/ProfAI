import type { WritingTask } from './writingTestData'

// Transcribed from the supplied screenshots. Bar heights are approximate where
// the original chart does not print values; evaluation must allow estimates.
export const SUPPLIED_TASK_VISUALS: Record<number, {
  kind: string; title: string; lead: string; context: string
  diagram: NonNullable<WritingTask['diagram']>
}> = {
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
}
