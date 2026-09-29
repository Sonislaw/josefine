import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { loadEnv } from 'vite'

const mode = process.argv[2]
if (!mode) throw new Error('Provide the deployment mode, e.g. karawaning.')

const env = loadEnv(mode, process.cwd(), '')
const moduleId = env.VITE_SEO_MODULE
const siteUrl = env.VITE_PUBLIC_SITE_URL
if (!moduleId || !siteUrl) throw new Error('VITE_SEO_MODULE and VITE_PUBLIC_SITE_URL are required.')

const configPath = resolve(`src/apps/${moduleId}/seo/site-config.json`)
const siteConfig = JSON.parse(await readFile(configPath, 'utf8'))
const pwaConfigPath = resolve(`src/apps/${moduleId}/pwa/manifest.json`)
const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const urls = siteConfig.pages
  .map(({ path }) => `  <url><loc>${escapeXml(new URL(path, siteUrl).href)}</loc></url>`)
  .join('\n')
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`

const outputDirectory = resolve('dist')
await mkdir(outputDirectory, { recursive: true })
await writeFile(resolve(outputDirectory, 'sitemap.xml'), sitemap, 'utf8')
await writeFile(resolve(outputDirectory, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', siteUrl).href}\n`, 'utf8')
try {
  await writeFile(resolve(outputDirectory, 'manifest.webmanifest'), await readFile(pwaConfigPath, 'utf8'), 'utf8')
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
