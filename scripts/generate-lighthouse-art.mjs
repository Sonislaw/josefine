import { chromium } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  })
  const svg = await readFile('public/games/last-lighthouse-cover.svg', 'utf8')
  await page.setContent(
    `<style>body{margin:0;background:#0a1c29;color:#e7ede6;font-family:Arial,sans-serif}img{position:absolute;right:-175px;top:25px;width:970px}.shade{position:absolute;inset:0;background:linear-gradient(90deg,#0a1c29 22%,#0a1c2900 70%)}.copy{position:absolute;left:60px;top:60px}small{color:#d1bc8e;letter-spacing:4px;font-size:17px}h1{font-family:Georgia,serif;font-weight:400;font-size:89px;line-height:1.05;letter-spacing:-4px;margin:90px 0 25px}em{color:#ffe0a5}p{font-size:22px;line-height:1.6;color:#b9cdd1}.footer{position:absolute;left:60px;bottom:43px;font-size:17px;color:#dec996}</style><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" alt=""><div class="shade"></div><div class="copy"><small>ZGRANA / SURVIVAL</small><h1>Ostatnia<br><em>latarnia.</em></h1><p>Zbieraj moce. Przetrwaj noc.<br>Nie oddaj światła.</p></div><div class="footer">gry.zgrana.pl · telefon i komputer · bez konta</div>`,
  )
  await page.locator('img').evaluate((img) => img.decode())
  await page.screenshot({ path: 'public/og/last-lighthouse.png' })
} finally {
  await browser.close()
}
