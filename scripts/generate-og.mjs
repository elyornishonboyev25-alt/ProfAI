// Rebuild the social preview and app icons from the approved brand assets.
// Requires the optional development tool @resvg/resvg-js.
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
const { Resvg } = createRequire(import.meta.url)('@resvg/resvg-js')
const publicUrl = new URL('../public/', import.meta.url)
const source = readFileSync(new URL('og-image-source.svg', publicUrl), 'utf8')
// Embed both assets so the exported SVG also works as a standalone image.
const svg = source.replace(/href="(brand\/ivygoo-horizontal\.png|logo\.svg)"/g, (_, file) => {
  const mime = file.endsWith('.svg') ? 'image/svg+xml' : 'image/png'
  return `href="data:${mime};base64,${readFileSync(new URL(file, publicUrl)).toString('base64')}"`
})
writeFileSync(new URL('og-image.svg', publicUrl), svg)
const renderer = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: true } })
writeFileSync(new URL('og-image.png', publicUrl), renderer.render().asPng())
const icon = readFileSync(new URL('favicon.svg', publicUrl), 'utf8')
for (const [file, size] of [['apple-touch-icon.png', 180], ['ivygoo-icon-192.png', 192], ['ivygoo-icon-512.png', 512]]) {
  writeFileSync(new URL(file, publicUrl), new Resvg(icon, { fitTo: { mode: 'width', value: size } }).render().asPng())
}
console.log('Updated ivyGoo social preview and app icons')
