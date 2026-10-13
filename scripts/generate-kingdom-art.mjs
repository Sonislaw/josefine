import { chromium } from '@playwright/test'
import { readFile } from 'node:fs/promises'
// Repo-native illustration, rasterized for social crawlers. No external images or fonts.
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  })
  const svg = await readFile('public/games/little-kingdom-cover.svg', 'utf8')
  await page.setContent(
    `<style>*{box-sizing:border-box}body{margin:0;background:#18392f;color:#f4e5bb;font-family:Arial,sans-serif}img{position:absolute;right:-125px;top:82px;width:800px}.copy{position:absolute;left:60px;top:60px}small{font-size:17px;color:#c8d99d;letter-spacing:3px}h1{font-family:Georgia,serif;font-weight:400;font-size:85px;line-height:1.05;letter-spacing:-4px;margin:90px 0 24px}em{color:#c9dca4}p{font-size:21px;color:#c0ccb0;line-height:1.6}.footer{position:absolute;bottom:40px;left:60px;font-size:16px;color:#d7c58b}</style><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" alt=""><div class="copy"><small>ZGRANA / STRATEGIA</small><h1>Małe<br><em>królestwo.</em></h1><p>Buduj. Odkrywaj.<br>Przygotuj się na zimę.</p></div><div class="footer">gry.zgrana.pl · Twoja osada, Twoje tempo.</div>`,
  )
  await page.locator('img').evaluate((img) => img.decode())
  await page.screenshot({ path: 'public/og/little-kingdom.png' })
} finally {
  await browser.close()
}
