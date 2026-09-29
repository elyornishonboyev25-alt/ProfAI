import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/data/writingFullTestPracticeVisuals.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
const exports = {}
runInNewContext(compiled, { exports })
const specs = exports.PRACTICE_TASK_VISUALS
const output = new URL('../public/images/ielts-writing/', import.meta.url)
mkdirSync(output, { recursive: true })

const ink = '#273342'
const muted = '#617082'
const grid = '#ced6de'
const blue = '#486782'
const blueLight = '#839aaf'
const palette = ['#364b61', '#7890a5', '#b5c3cf', '#dbe3e9', '#9eacb7']
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const line = (x1, y1, x2, y2, stroke = ink, width = 2, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`
const rect = (x, y, width, height, fill = 'white', stroke = ink, radius = 0, extra = '') => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2" ${extra}/>`
const label = (value, x, y, size = 20, anchor = 'middle', weight = 400, color = ink) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${color}">${escape(value)}</text>`
const circle = (x, y, radius, fill = 'white', stroke = ink, width = 2) => `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`
const path = (d, stroke = ink, width = 2, fill = 'none') => `<path d="${d}" stroke="${stroke}" stroke-width="${width}" fill="${fill}" stroke-linejoin="round" stroke-linecap="round"/>`
const arrow = (x1, y1, x2, y2) => line(x1, y1, x2, y2, muted, 3, 'marker-end="url(#arrow)"')

function wrap(spec, content, desc = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" role="img" aria-labelledby="title desc">
<title id="title">${escape(spec.title)}</title><desc id="desc">${escape(desc || spec.lead)}</desc>
<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0 0 L9 3 L0 6 Z" fill="${muted}"/></marker></defs>
<rect width="1200" height="720" fill="white"/>
<g font-family="Arial, Helvetica, sans-serif">
${label(spec.title, 600, 67, 34, 'middle', 700)}
${line(80, 92, 1120, 92, '#d9dfe5', 1)}
${content}
</g></svg>`
}

function axes(spec, max, categories) {
  const left = 142, top = 160, width = 908, height = 380
  const topValue = Math.ceil(max / 5) * 5
  let marks = ''
  for (let step = 0; step <= 5; step++) {
    const y = top + height - (height * step / 5)
    marks += line(left, y, left + width, y, step === 0 ? ink : grid, step === 0 ? 2 : 1, step ? 'stroke-dasharray="5 5"' : '')
    marks += label(Math.round(topValue * step / 5), left - 18, y + 7, 17, 'end', 400, muted)
  }
  marks += line(left, top, left, top + height)
  marks += label(spec.unit, left, 131, 18, 'start', 600, muted)
  return { left, top, width, height, topValue, marks }
}

function legend(series, y = 641) {
  const itemWidth = Math.min(255, 910 / series.length)
  const start = 600 - (itemWidth * series.length) / 2
  return series.map((row, index) => {
    const x = start + index * itemWidth
    return rect(x, y - 13, 24, 17, palette[index], 'none', 0) + label(row.label, x + 34, y + 1, 19, 'start')
  }).join('')
}

function barChart(spec) {
  const categories = spec.categories
  const series = spec.series
  const max = Math.max(...series.flatMap((row) => row.values)) * 1.16
  const axis = axes(spec, max, categories)
  const group = axis.width / categories.length
  const barWidth = Math.min(62, group / (series.length + 0.8))
  let content = axis.marks
  categories.forEach((category, index) => {
    const middle = axis.left + group * (index + 0.5)
    content += label(category, middle, 576, 20)
    series.forEach((row, rowIndex) => {
      const value = row.values[index]
      const h = axis.height * value / axis.topValue
      const x = middle + (rowIndex - (series.length - 1) / 2) * (barWidth + 9) - barWidth / 2
      const y = axis.top + axis.height - h
      content += rect(x, y, barWidth, h, palette[rowIndex], 'none')
      content += label(value, x + barWidth / 2, y - 9, 16, 'middle', 600)
    })
  })
  return wrap(spec, content + legend(series))
}

function stackedChart(spec) {
  const categories = spec.categories
  const series = spec.series
  const axis = axes(spec, 100, categories)
  const group = axis.width / categories.length
  const barWidth = Math.min(145, group * 0.53)
  let content = axis.marks
  categories.forEach((category, index) => {
    const middle = axis.left + group * (index + 0.5)
    let previous = 0
    for (const [rowIndex, row] of series.entries()) {
      const value = row.values[index]
      const h = axis.height * value / 100
      const y = axis.top + axis.height - axis.height * (previous + value) / 100
      content += rect(middle - barWidth / 2, y, barWidth, h, palette[rowIndex], 'white')
      if (value >= 10) content += label(`${value}%`, middle, y + h / 2 + 7, 18, 'middle', 700, rowIndex < 2 ? 'white' : ink)
      previous += value
    }
    content += label(category, middle, 576, 20)
  })
  return wrap(spec, content + legend(series))
}

function lineChart(spec) {
  const categories = spec.categories
  const series = spec.series
  const max = Math.max(...series.flatMap((row) => row.values)) * 1.12
  const axis = axes(spec, max, categories)
  const xFor = (index) => axis.left + index * axis.width / (categories.length - 1)
  const yFor = (value) => axis.top + axis.height - value * axis.height / axis.topValue
  let content = axis.marks
  categories.forEach((category, index) => { content += label(category, xFor(index), 576, 19) })
  series.forEach((row, index) => {
    const colour = palette[index]
    const d = row.values.map((value, pointIndex) => `${pointIndex ? 'L' : 'M'}${xFor(pointIndex)} ${yFor(value)}`).join(' ')
    content += path(d, colour, 4)
    row.values.forEach((value, pointIndex) => { content += circle(xFor(pointIndex), yFor(value), 5, 'white', colour, 3) })
  })
  return wrap(spec, content + legend(series))
}

function pieSector(cx, cy, radius, start, end, colour) {
  const sx = cx + radius * Math.cos(start), sy = cy + radius * Math.sin(start)
  const ex = cx + radius * Math.cos(end), ey = cy + radius * Math.sin(end)
  const large = end - start > Math.PI ? 1 : 0
  return `<path d="M${cx} ${cy} L${sx} ${sy} A${radius} ${radius} 0 ${large} 1 ${ex} ${ey} Z" fill="${colour}" stroke="white" stroke-width="3"/>`
}

function pieChart(spec) {
  let content = ''
  const centres = [343, 857]
  spec.series.forEach((row, rowIndex) => {
    const cx = centres[rowIndex], cy = 360, radius = 160
    let angle = -Math.PI / 2
    content += label(row.label, cx, 145, 26, 'middle', 700)
    row.values.forEach((value, valueIndex) => {
      const sweep = 2 * Math.PI * value / 100
      content += pieSector(cx, cy, radius, angle, angle + sweep, palette[valueIndex])
      const middle = angle + sweep / 2
      const distance = value <= 7 ? 117 : 91
      const x = cx + Math.cos(middle) * distance
      const y = cy + Math.sin(middle) * distance + 7
      content += label(`${value}%`, x, y, value <= 7 ? 16 : 19, 'middle', 700, valueIndex < 2 ? 'white' : ink)
      angle += sweep
    })
  })
  const itemWidth = spec.categories.length === 4 ? 255 : 208
  const start = 600 - spec.categories.length * itemWidth / 2
  spec.categories.forEach((category, index) => {
    const x = start + index * itemWidth
    content += rect(x, 590, 23, 19, palette[index], 'none')
    content += label(category, x + 32, 607, 18, 'start')
  })
  return wrap(spec, content)
}

function building(x, y, w, h, name, fill = '#e6edf2') {
  return rect(x, y, w, h, fill, ink, 3) + label(name, x + w / 2, y + h / 2 + 7, name.length > 13 ? 16 : 19, 'middle', 600)
}
function area(x, y, w, h, name, fill = '#f1f5ec') {
  return rect(x, y, w, h, fill, '#97a493', 2) + label(name, x + w / 2, y + h / 2 + 7, 19, 'middle', 600)
}
function water(x, y, w, h, name = 'Pond') {
  return `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="#e2eff4" stroke="#6f9aa9" stroke-width="2"/>` + label(name, x + w / 2, y + h / 2 + 6, 18, 'middle', 600)
}
function tree(x, y) {
  return circle(x, y, 15, '#dce7d9', '#819c80') + path(`M${x} ${y + 10}v17`, '#70856b', 2)
}
function mapPanel(year, drawing, offset) {
  const x = offset
  return `<g transform="translate(${x},0)">${label(year, 255, 143, 27, 'middle', 700)}${rect(0, 170, 510, 450, 'white', '#9ba8b4', 0)}${drawing}${label('N', 478, 208, 17, 'middle', 700)}${path('M478 245v-29 m-7 7 7-9 7 9', ink, 2)}</g>`
}

function map9(after) {
  let s = rect(12, 354, 486, 38, '#e6e8e8', 'none') + label('Main road', 255, 380, 17, 'middle', 500, muted)
  s += area(210, 270, 90, 70, 'Square', '#f2f1e8')
  s += after
    ? building(45, 222, 145, 80, 'Shopping centre') + building(330, 222, 140, 80, 'Library') + building(45, 445, 145, 85, 'Bus station') + building(330, 445, 140, 85, 'Café') + path('M255 392v177', '#9b968a', 10) + label('Path', 287, 552, 16, 'start')
    : building(45, 222, 145, 80, 'Market') + building(330, 222, 140, 80, 'Post office') + area(45, 445, 145, 85, 'Car park', '#eaeded') + area(330, 445, 140, 85, 'Open land')
  return s
}
function map15(after) {
  let s = path('M250 185v418', '#d4d6d2', 30) + label('Main path', 306, after ? 430 : 400, 16, 'start', 400, muted)
  s += building(48, 224, 155, 94, 'Library') + building(312, 224, 155, 94, 'Classrooms')
  if (after) {
    s += building(48, 460, 155, 95, 'Science block') + building(312, 460, 155, 95, 'Student centre')
    s += path('M25 389h460', '#d4d6d2', 22) + area(16, 356, 100, 63, 'Parking', '#eaeded')
  } else {
    s += area(48, 460, 155, 95, 'Sports field') + area(312, 460, 155, 95, 'Car park', '#eaeded')
  }
  return s
}
function map22(after) {
  let s = rect(0, 503, 510, 117, '#dcecf3', 'none') + label('Sea', 444, 572, 21, 'middle', 700)
  s += rect(0, 465, 510, 38, '#f1e9d4', 'none') + label('Beach', 255, 491, 18)
  s += rect(12, 352, 486, 30, '#e4e6e4', 'none') + label('Main road', 255, 374, 16, 'middle', 500, muted)
  s += after
    ? building(47, 235, 160, 90, 'Hotel') + building(300, 235, 160, 90, 'Restaurant') + building(325, 396, 145, 52, 'New houses') + path('M30 452h450', '#a2aa9e', 6) + label('Footpath', 100, 447, 15, 'middle') + rect(220, 503, 78, 55, '#e3d3b4', '#9d8a67') + label('Marina', 259, 597, 16)
    : area(47, 235, 160, 90, 'Farm') + building(300, 235, 160, 90, 'Shop') + building(325, 396, 145, 52, 'Houses') + rect(241, 503, 35, 52, '#e3d3b4', '#9d8a67') + label('Pier', 259, 597, 16)
  return s
}
function map28(after) {
  let s = area(15, 190, 480, 407, '', '#f2f6ee')
  s += path('M250 194v394', '#d8d8cf', 23) + label('Path', 284, 394, 16, 'start')
  s += water(337, 256, 118, 75)
  s += label('North entrance', 250, 215, 16, 'middle', 600)
  if (after) {
    s += building(42, 288, 150, 105, 'Sports court', '#e7ebec') + area(274, 422, 140, 85, 'Playground', '#f6ecd7')
    s += building(350, 526, 105, 55, 'Café') + path('M30 230h443', '#9eb3a3', 9) + label('Cycle path', 92, 250, 16)
  } else {
    s += area(42, 288, 150, 105, 'Woodland') + tree(65, 303) + tree(166, 313)
    s += area(274, 422, 140, 85, 'Open lawn') + area(350, 526, 105, 55, 'Picnic area')
  }
  return s
}
function maps(spec, index) {
  const years = { 9: ['2000', '2025'], 15: ['2005', '2025'], 22: ['1990', '2020'], 28: ['2000', '2025'] }[index]
  const draw = { 9: map9, 15: map15, 22: map22, 28: map28 }[index]
  return wrap(spec, mapPanel(years[0], draw(false), 60) + mapPanel(years[1], draw(true), 630), spec.context)
}

function icon(name) {
  switch (name) {
    case 'bin': return rect(55, 32, 80, 92, '#e7ecee', ink, 5) + rect(49, 22, 92, 12, '#d3dde2') + path('M74 52v56 M96 52v56 M117 52v56', muted, 2)
    case 'truck': return rect(20, 56, 105, 59, '#e8edf0') + path('M125 74h43l22 23v18h-65z', ink, 2, '#dce5eb') + circle(55, 119, 13) + circle(151, 119, 13)
    case 'sort': return rect(20, 107, 175, 10, '#d8e0e5') + bottle(55, 47, 35) + bottle(106, 47, 35) + bottle(158, 47, 35)
    case 'sort-fruit': return rect(20, 107, 175, 10, '#d8e0e5') + circle(58, 90, 18, '#e1e8dc') + circle(105, 90, 18, '#e1e8dc') + circle(152, 90, 18, '#e1e8dc') + path('M58 70l6-10 M105 70l6-10 M152 70l6-10', '#6e856a', 2)
    case 'sort-paper': return rect(20, 111, 175, 9, '#d8e0e5') + rect(40, 64, 42, 45, '#f5f5f1') + rect(88, 54, 42, 55, '#f5f5f1') + rect(136, 70, 42, 39, '#f5f5f1')
    case 'crush': return rect(26, 70, 150, 65, '#e2e9ed') + path('M65 38l38 45 36-45', ink, 3) + circle(63, 110, 5, muted) + circle(97, 107, 5, muted) + circle(130, 114, 5, muted)
    case 'furnace': return rect(37, 55, 130, 80, '#e8e7e3') + path('M80 114q-19-22 2-40 0 21 14 19 3-20 21-30-4 22 12 31 6 15-2 25z', '#a77457', 2, '#deb595') + rect(40, 135, 124, 9, '#bdc7ca')
    case 'bottles': return bottle(45, 38, 45) + bottle(110, 38, 45)
    case 'tree': return path('M96 72v75 M65 145h62', ink, 4) + circle(73, 54, 34, '#e4ebde', '#849783') + circle(118, 51, 32, '#e4ebde', '#849783') + circle(95, 32, 34, '#e4ebde', '#849783') + circle(69, 56, 5, '#8d9b79') + circle(120, 52, 5, '#8d9b79')
    case 'wash': return rect(27, 76, 152, 58, '#e8f0f3') + path('M30 96q20-10 40 0t40 0t40 0t29 0', '#7f9eae', 3) + circle(63, 55, 8, 'white', blueLight) + circle(101, 44, 5, 'white', blueLight)
    case 'cut': return path('M40 113h136 M55 72l50 42 M106 114l43-48', ink, 3) + circle(62, 116, 16, '#e1e9df') + circle(137, 116, 16, '#e1e9df')
    case 'can': return rect(36, 65, 50, 71, '#e0e6e9') + rect(105, 65, 50, 71, '#e0e6e9') + `<ellipse cx="61" cy="65" rx="25" ry="7" fill="#f5f7f7" stroke="${ink}" stroke-width="2"/><ellipse cx="130" cy="65" rx="25" ry="7" fill="#f5f7f7" stroke="${ink}" stroke-width="2"/>` + path('M60 53q-9-9 0-18 M130 53q-9-9 0-18', muted, 2)
    case 'box': return rect(37, 75, 130, 65, '#e7e0d1') + path('M37 75l25-25h130l-25 25 M167 75l25-25v65l-25 25', ink, 2) + line(100, 77, 100, 136, '#a59a86', 2)
    case 'stack': return [0, 1, 2, 3].map((n) => rect(33 + n * 12, 58 + n * 13, 120, 65, '#f5f5f1')).join('')
    case 'vat': return rect(26, 70, 152, 65, '#e8eff2') + path('M30 94q25-12 48 0t48 0t48 0', blueLight, 3) + line(98, 37, 98, 92) + path('M76 88q23 24 45 0', ink, 2)
    case 'screen': return rect(30, 60, 150, 75, '#e6ecee') + [1, 2, 3, 4].map((n) => line(30 + n * 30, 60, 30 + n * 30, 135, '#9baab2', 1)).join('') + [1, 2, 3].map((n) => line(30, 60 + n * 19, 180, 60 + n * 19, '#9baab2', 1)).join('')
    case 'press': return rect(35, 116, 138, 15, '#c2cbd0') + rect(47, 96, 114, 16, '#e7ecee') + rect(82, 31, 43, 57, '#d5dee3') + line(104, 88, 104, 98, ink, 4)
    case 'roll': return circle(100, 98, 49, '#e9eef0') + circle(100, 98, 17, 'white') + path('M148 98h55v52h-85', ink, 2, '#e9eef0')
    case 'separator': return rect(41, 38, 120, 67, '#e5ecef') + line(100, 105, 100, 117) + path('M100 117H54v19 M100 117h46v19', ink, 2) + rect(35, 120, 38, 22, '#e3e9eb') + rect(127, 120, 38, 22, '#e3e9eb')
    default: return rect(30, 50, 140, 85, '#e8edf0')
  }
}

function bottle(x, y, width) {
  const neck = width * 0.3
  return path(`M${x + width * 0.35} ${y}h${neck}v20l${width * 0.25} 18v62q0 6-6 6h-${width - 12}q-6 0-6-6V${y + 38}l${width * 0.25-6}-${18}z`, ink, 2, '#e5ecee')
}

function processDiagram(spec, index) {
  const steps = {
    5: [['Collection', 'bin'], ['Transport', 'truck'], ['Sorting by colour', 'sort'], ['Washing & crushing', 'crush'], ['Melting', 'furnace'], ['New bottles', 'bottles']],
    11: [['Picking fruit', 'tree'], ['Checking & sorting', 'sort-fruit'], ['Washing', 'wash'], ['Peeling & cutting', 'cut'], ['Canning & heating', 'can'], ['Packing', 'box']],
    18: [['Collection', 'stack'], ['Sorting', 'sort-paper'], ['Making pulp', 'vat'], ['Screening', 'screen'], ['Pressing & drying', 'press'], ['New paper rolls', 'roll']],
    23: [['Harvesting', 'tree'], ['Washing', 'wash'], ['Crushing', 'crush'], ['Pressing', 'press'], ['Separating oil', 'separator'], ['Bottling', 'bottles']],
  }[index]
  const positions = [[70, 173], [500, 173], [930, 173], [930, 426], [500, 426], [70, 426]]
  let content = ''
  for (const [stepIndex, [caption, iconName]] of steps.entries()) {
    const [x, y] = positions[stepIndex]
    content += `<g transform="translate(${x},${y})">${rect(0, 0, 200, 161, '#fafbfc', '#d3dce3', 13)}${icon(iconName)}</g>`
    content += circle(x + 20, y + 20, 17, blue, 'none') + label(stepIndex + 1, x + 20, y + 27, 18, 'middle', 700, 'white')
    content += label(caption, x + 100, y + 193, 20, 'middle', 600)
  }
  content += arrow(292, 253, 470, 253) + arrow(722, 253, 900, 253) + arrow(1030, 370, 1030, 412)
  content += arrow(906, 506, 730, 506) + arrow(476, 506, 300, 506)
  return wrap(spec, content, spec.context)
}

for (const [index, spec] of Object.entries(specs)) {
  const svg = spec.chartType === 'bar' ? barChart(spec)
    : spec.chartType === 'stacked' ? stackedChart(spec)
    : spec.chartType === 'line' ? lineChart(spec)
    : spec.chartType === 'pie' ? pieChart(spec)
    : spec.chartType === 'map' ? maps(spec, Number(index))
    : processDiagram(spec, Number(index))
  const target = new URL(`full-writing-test-${index}-practice.svg`, output)
  if (process.argv.includes('--check')) assert.equal(readFileSync(target, 'utf8'), svg, `Outdated Writing Task 1 image: test ${index}`)
  else writeFileSync(target, svg)
}
console.log(`${process.argv.includes('--check') ? 'Verified' : 'Generated'} ${Object.keys(specs).length} IELTS-style Writing Task 1 SVG images.`)
