// Rebuild the source-controlled social preview from its SVG.
// Requires the optional development tool @resvg/resvg-js.
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'node:fs'
const svg = readFileSync(new URL('../public/og-image.svg', import.meta.url), 'utf8')
const renderer = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: true } })
writeFileSync(new URL('../public/og-image.png', import.meta.url), renderer.render().asPng())
console.log('Updated Ivygoo social preview')
