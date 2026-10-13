import { chromium } from '@playwright/test'
import { readFile } from 'node:fs/promises'
// Rasterize our code-native illustration; no external fonts, AI assets or CDN.
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  })
  const svg = await readFile('public/games/blocks-cover.svg', 'utf8')
  const image = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  await page.setContent(
    `<style>*{box-sizing:border-box}body{margin:0;background:#101f24;color:#edf2e6;font-family:Arial,sans-serif}.art{position:absolute;right:-115px;top:110px;width:730px;transform:rotate(-5deg)}.copy{position:absolute;left:65px;top:65px}small{color:#c9e993;letter-spacing:4px;font-size:20px}h1{font-size:90px;line-height:1;letter-spacing:-5px;margin:85px 0 16px}h2{color:#c9e993;font-size:42px;letter-spacing:-2px;margin:0 0 32px}p{color:#b4c9cb;font-size:23px}.tag{margin-top:64px;color:#c9e993;font-size:18px}</style><img class="art" src="${image}" alt=""><div class="copy"><small>▦ ZGRANA / GRY LOGICZNE</small><h1>Klocki.</h1><h2>Jeszcze jeden ruch.</h2><p>Ułóż. Połącz. Odetchnij.</p><div class="tag">gry.zgrana.pl · bez pośpiechu · bez konta</div></div>`,
  )
  await page.locator('img').evaluate((img) => img.decode())
  await page.screenshot({ path: 'public/og/blocks.png' })
} finally {
  await browser.close()
}
