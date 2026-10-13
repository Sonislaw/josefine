import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
const config = JSON.parse(await readFile('src/apps/gry/seo/site-config.json', 'utf8'))
const sitemap = await readFile('dist/sitemap.xml', 'utf8')
for (const page of config.pages) {
  const file = page.path === '/' ? 'index' : page.path.slice(1)
  const html = await readFile(`dist/${file}.html`, 'utf8')
  assert.ok(html.includes(`<title>${page.title}</title>`), `Title: ${file}`)
  assert.ok(html.includes(`href="https://gry.zgrana.pl${page.path}"`), `Canonical: ${file}`)
  assert.ok(html.includes(`https://gry.zgrana.pl${page.socialImage}`), `OG: ${file}`)
  assert.ok(html.includes('<h1'), `SSG content: ${file}`)
  assert.ok(!html.includes('<div id="app"></div>'), `Empty SPA shell: ${file}`)
  assert.ok(sitemap.includes(`https://gry.zgrana.pl${page.path}</loc>`), `Sitemap: ${file}`)
}
const home = await readFile('dist/index.html', 'utf8')
assert.ok(home.includes('href="/klocki"'))
assert.ok(!home.includes('BlocksPage-'), 'Catalog must not preload the blocks game bundle')
assert.ok(home.includes('href="/warcaby-arena-mocy"'))
assert.ok(!home.includes('WarcabyPage-'), 'Catalog must not preload the game bundle')
assert.ok(home.includes('href="/jeszcze-jeden-krysztal"'))
assert.ok(!home.includes('CrystalRushPage-'), 'Catalog must not preload the arcade bundle')
const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'))
assert.equal(manifest.short_name, 'Gry')
for (const icon of manifest.icons) await access(`dist${icon.src}`)
const notFound = await readFile('dist/404.html', 'utf8')
assert.ok(notFound.includes('/pwa/gry-icon.svg'))
const offline = await readFile('dist/games/warcaby-arena-mocy.html', 'utf8')
assert.ok(offline.includes('Warcaby — Arena Mocy'))
assert.ok(!/<script[^>]+src=/.test(offline), 'Export must have no external scripts')
assert.ok(!offline.includes('googletagmanager.com'), 'Export must not include analytics')
console.log(
  `Gry build OK: ${config.pages.length} prerendered pages, clean canonical URLs, lazy games, sitemap, icons, 404 and standalone HTML.`,
)
