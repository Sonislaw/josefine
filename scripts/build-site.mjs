import { access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'

const site = process.argv[2]
if (!site || !/^[a-z0-9-]+$/.test(site)) {
  throw new Error('Provide a site key, e.g. npm run build:site -- karawaning.')
}

const run = (file, args) => new Promise((resolveProcess, reject) => {
  const child = spawn(file, args, { stdio: 'inherit' })
  child.once('error', reject)
  child.once('exit', (code) => {
    if (code === 0) resolveProcess()
    else reject(new Error(`${file} exited with code ${code}.`))
  })
})

const envFile = resolve(`.env.${site}`)
await access(envFile)

// One cross-platform pipeline: static HTML first, then host-specific metadata and assets.
await run(process.execPath, [resolve('node_modules/vite-ssg/dist/node/cli.mjs'), 'build', '--mode', site])
await run(process.execPath, [resolve('scripts/generate-sitemap.mjs'), site])
