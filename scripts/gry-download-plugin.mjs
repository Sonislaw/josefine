import { build } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

/** Build the SAME component and engine into a self-contained file. No second game
 * implementation to drift out of sync; Vue and the inline AI worker are included. */
export async function buildWarcabyDownload() {
  const result = await build({
    configFile: false,
    publicDir: false,
    plugins: [vue()],
    logLevel: 'warn',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: {
      write: false,
      cssCodeSplit: false,
      lib: {
        entry: resolve('src/apps/gry/games/warcaby/standalone.ts'),
        name: 'WarcabyArena',
        formats: ['iife'],
      },
    },
  })
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((result) => result.output)
  const js = outputs
    .filter((output) => output.type === 'chunk')
    .map((output) => output.code)
    .join('\n')
  const css = outputs
    .filter((output) => output.type === 'asset' && output.fileName.endsWith('.css'))
    .map((output) => output.source)
    .join('\n')
  if (!js || !css) throw new Error('Standalone game must contain both JS and CSS.')
  const unexpectedAssets = outputs.filter(
    (output) => output.type === 'asset' && !output.fileName.endsWith('.css'),
  )
  if (unexpectedAssets.length)
    throw new Error('Standalone game contains external assets; inline them before exporting.')
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#101918"><title>Warcaby — Arena Mocy · offline</title><style>body{margin:0;background:#101918}button,select{font:inherit}${css}</style></head><body><div id="app"></div><script>${js.replaceAll('</script', '<\\/script')}</script></body></html>`
}

export function gryDownloadPlugin() {
  let enabled = false
  let cached
  const html = () =>
    (cached ??= buildWarcabyDownload().catch((error) => {
      cached = undefined
      throw error
    }))
  return {
    name: 'gry-standalone-download',
    configResolved(config) {
      enabled =
        !config.build.ssr && (!config.env.VITE_SEO_MODULE || config.env.VITE_SEO_MODULE === 'gry')
    },
    configureServer(server) {
      server.watcher.on('change', (path) => {
        if (path.replaceAll('\\', '/').includes('/apps/gry/')) cached = undefined
      })
      server.middlewares.use('/games/warcaby-arena-mocy.html', async (_req, res, next) => {
        try {
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end(await html())
        } catch (error) {
          next(error)
        }
      })
    },
    async generateBundle() {
      if (enabled)
        this.emitFile({
          type: 'asset',
          fileName: 'games/warcaby-arena-mocy.html',
          source: await html(),
        })
    },
  }
}
