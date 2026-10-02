import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
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
const iconConfig = JSON.parse(await readFile(resolve('src/config/site-icons.json'), 'utf8'))[moduleId]
if (!iconConfig) throw new Error(`No favicon configured for module "${moduleId}".`)
await Promise.all(
  [iconConfig.favicon, iconConfig.appleTouchIcon].map((path) => access(resolve('public', path.slice(1)))),
)
const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const urls = siteConfig.pages
  .map(({ path }) => `  <url><loc>${escapeXml(new URL(path, siteUrl).href)}</loc></url>`)
  .join('\n')
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`

const outputDirectory = resolve('dist')
await mkdir(outputDirectory, { recursive: true })
await writeFile(resolve(outputDirectory, 'sitemap.xml'), sitemap, 'utf8')
await writeFile(resolve(outputDirectory, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', siteUrl).href}\n`, 'utf8')

// Public 404.html bypasses Vue/SSG, so brand it from the same icon registry as App.vue.
const notFoundPath = resolve(outputDirectory, '404.html')
const defaultIcon = '<link rel="icon" href="/pwa/josefine-icon.svg" type="image/svg+xml" />'
const defaultAppleIcon = '<link rel="apple-touch-icon" href="/pwa/josefine-icon.svg" />'
const notFoundHtml = await readFile(notFoundPath, 'utf8')
if (!notFoundHtml.includes(defaultIcon) || !notFoundHtml.includes(defaultAppleIcon)) {
  throw new Error('The 404.html icon template has changed; update the site icon generation.')
}
await writeFile(
  notFoundPath,
  notFoundHtml
    .replace(defaultIcon, `<link rel="icon" href="${iconConfig.favicon}" type="${iconConfig.type}" />`)
    .replace(defaultAppleIcon, `<link rel="apple-touch-icon" href="${iconConfig.appleTouchIcon}" />`),
  'utf8',
)

try {
  await writeFile(resolve(outputDirectory, 'manifest.webmanifest'), await readFile(pwaConfigPath, 'utf8'), 'utf8')
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
