import { chromium } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  })
  const cover = await readFile('public/games/crystal-rush-cover.svg', 'utf8')
  const image = `data:image/svg+xml;base64,${Buffer.from(cover).toString('base64')}`
  await page.setContent(
    `<style>*{box-sizing:border-box}body{margin:0;background:#0b1018;color:#edf3ff;font-family:Arial,sans-serif}.art{position:absolute;right:35px;top:115px;width:450px;height:390px;transform:rotate(-8deg)}.copy{position:absolute;left:65px;top:70px}small{color:#a9f477;letter-spacing:5px;font-size:21px}h1{font-size:72px;line-height:1.02;letter-spacing:-4px;margin:70px 0 30px}h1 span{color:#a9f477}p{color:#a9b7cc;font-size:23px}.tag{margin-top:45px;color:#a9f477;font-size:18px}</style><img class="art" src="${image}" alt=""><div class="copy"><small>◈ ZGRANA / ARCADE</small><h1>Jeszcze jeden<br><span>kryształ.</span></h1><p>Zbieraj. Rób uniki. Pobij rekord.</p><div class="tag">gry.zgrana.pl · bez konta · Twój rekord</div></div>`,
  )
  await page.locator('img').evaluate((image) => image.decode())
  await page.screenshot({ path: 'public/og/crystal-rush.png' })
} finally {
  await browser.close()
}
