// Rebuild the social preview and app icons from the approved brand assets.
// Requires the optional development tool @resvg/resvg-js.
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
const { Resvg } = createRequire(import.meta.url)('@resvg/resvg-js')
const publicUrl = new URL('../public/', import.meta.url)
const source = readFileSync(new URL('og-image-source.svg', publicUrl), 'utf8')
// Inline SVG markup so embedded original artwork survives standalone exports.
// Namespace clip IDs because both brand assets share the same SVG document.
function inlineSvg(file, placement, prefix) {
  return readFileSync(new URL(file, publicUrl), 'utf8')
    .replace(/<svg\b[^>]*>/, (root) => root.replace(/\s(?:width|height)="[^"]*"/g, '').replace('<svg', `<svg ${placement}`))
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${prefix}-${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${prefix}-${id})`)
}
const svg = source.replace(/<image href="(brand\/ivygoo-horizontal\.svg|logo\.svg)"\s+([^>]+)\/>/g, (_, file, placement) => {
  return inlineSvg(file, placement, file.startsWith('brand/') ? 'wordmark' : 'emblem')
})
writeFileSync(new URL('og-image.svg', publicUrl), svg)
const renderer = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: true } })
writeFileSync(new URL('og-image.png', publicUrl), renderer.render().asPng())
// Keep the PNG used by printable reports in sync with the vector wordmark.
const wordmark = readFileSync(new URL('brand/ivygoo-horizontal.svg', publicUrl), 'utf8')
writeFileSync(new URL('brand/ivygoo-horizontal.png', publicUrl), new Resvg(wordmark, { fitTo: { mode: 'width', value: 1672 } }).render().asPng())
// An opaque square provides a legible stem and safe margins on any app launcher.
const mark = inlineSvg('logo.svg', 'x="56" y="56" width="400" height="400"', 'icon')
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#fff"/>${mark}</svg>`
for (const [file, size] of [['apple-touch-icon.png', 180], ['ivygoo-icon-192.png', 192], ['ivygoo-icon-512.png', 512]]) {
  writeFileSync(new URL(file, publicUrl), new Resvg(icon, { fitTo: { mode: 'width', value: size } }).render().asPng())
}
console.log('Updated ivyGoo social preview and app icons')
