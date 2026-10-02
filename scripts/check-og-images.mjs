import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const appsDirectory = join(projectRoot, 'src', 'apps')
const publicDirectory = join(projectRoot, 'public')
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const checkedImages = new Map()
let pageCount = 0

// Each module owns its page metadata, while this check enforces one social-image standard.
for (const app of readdirSync(appsDirectory, { withFileTypes: true }).filter((entry) =>
  entry.isDirectory(),
)) {
  const configPath = join(appsDirectory, app.name, 'seo', 'site-config.json')
  if (!existsSync(configPath)) throw new Error(`${app.name}: missing SEO site-config.json`)

  const { pages } = JSON.parse(readFileSync(configPath, 'utf8'))
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error(`${app.name}: no SEO pages configured`)
  }

  for (const page of pages) {
    const image = page.socialImage
    if (typeof image !== 'string' || !/^\/og\/[a-z0-9-]+\.png$/.test(image)) {
      throw new Error(`${app.name}/${page.key}: socialImage must point to a PNG in /og/`)
    }
    if (typeof page.socialImageAlt !== 'string' || !page.socialImageAlt.trim()) {
      throw new Error(`${app.name}/${page.key}: socialImageAlt is missing`)
    }

    const previousAlt = checkedImages.get(image)
    if (previousAlt && previousAlt !== page.socialImageAlt) {
      throw new Error(`${app.name}/${page.key}: one social image has conflicting alt text`)
    }

    if (!previousAlt) {
      const imagePath = join(publicDirectory, image.slice(1))
      if (!existsSync(imagePath)) throw new Error(`${app.name}/${page.key}: missing ${image}`)
      const content = readFileSync(imagePath)
      if (content.length < 24 || !content.subarray(0, 8).equals(pngSignature)) {
        throw new Error(`${app.name}/${page.key}: ${image} is not a valid PNG`)
      }
      if (content.readUInt32BE(16) !== 1200 || content.readUInt32BE(20) !== 630) {
        throw new Error(`${app.name}/${page.key}: ${image} must be 1200 × 630 px`)
      }
      checkedImages.set(image, page.socialImageAlt)
    }
    pageCount += 1
  }
}

console.log(`OG images OK: ${pageCount} pages, ${checkedImages.size} PNG files.`)
