import { chromium } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  })
  const svg = await readFile('public/games/night-express-cover.svg', 'utf8')
  await page.setContent(
    `<style>body{margin:0;background:#0b1a2b;color:#f3e6cc;font-family:Arial,sans-serif}img{position:absolute;right:-120px;top:0;width:930px;height:670px;object-fit:cover}.shade{position:absolute;inset:0;background:linear-gradient(90deg,#0b1a2b 17%,#0b1a2bd9 40%,transparent 74%)}.copy{position:absolute;left:58px;top:60px}small{color:#d6b482;letter-spacing:4px;font-size:17px}h1{font-size:94px;line-height:.98;letter-spacing:-6px;margin:87px 0 28px}em{font-family:Georgia,serif;font-weight:400;color:#eac087}p{font-size:22px;line-height:1.6;color:#b8cbd5}.footer{position:absolute;left:58px;bottom:42px;font-size:16px;color:#c6b591;letter-spacing:1px}</style><img alt="" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"><div class="shade"></div><div class="copy"><small>ZGRANA / STRATEGIA KOLEJOWA</small><h1>Nocny<br><em>ekspres.</em></h1><p>Miasto nie zasypia.<br>Ty wybierasz kierunek.</p></div><div class="footer">gry.zgrana.pl · telefon i komputer · bez konta</div>`,
  )
  await page.locator('img').evaluate((img) => img.decode())
  await page.screenshot({ path: 'public/og/night-express.png' })
} finally {
  await browser.close()
}
