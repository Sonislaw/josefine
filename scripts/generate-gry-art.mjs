import { chromium } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'

// Code-native vector artwork, rasterized for social crawlers and install icons.
// Run with PLAYWRIGHT_CHANNEL=chrome (or msedge) when using a system browser.
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  })
  const cells = Array.from({ length: 64 }, (_, i) => {
    const x = (i % 8) * 43,
      y = Math.floor(i / 8) * 43
    const dark = (Math.floor(i / 8) + (i % 8)) % 2 === 1
    const piece = dark && (i < 16 || i >= 48)
    return `<rect x="${x}" y="${y}" width="43" height="43" fill="${dark ? '#52644e' : '#b6bca4'}"/>${piece ? `<circle cx="${x + 22}" cy="${y + 24}" r="17" fill="${i < 16 ? '#623621' : '#84916c'}"/><circle cx="${x + 22}" cy="${y + 20}" r="17" fill="${i < 16 ? '#b97b5c' : '#e1e8c1'}" stroke="${i < 16 ? '#d49971' : '#f2f4d5'}" stroke-width="2"/><text x="${x + 22}" y="${y + 27}" text-anchor="middle" fill="${i < 16 ? '#f4d0a1' : '#536442'}" font-size="23">${['ϟ', '↶', '↔', '⌁'][Math.floor(i / 2) % 4]}</text>` : ''}`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#101918"/><circle cx="965" cy="310" r="330" fill="#1d2f25"/><circle cx="965" cy="310" r="270" fill="none" stroke="#40503d"/><g font-family="Arial, sans-serif"><text x="70" y="94" fill="#d5ef89" font-size="22" letter-spacing="5">◈ ZGRANA / GRY</text><text x="70" y="233" fill="#e9ecde" font-size="78" font-weight="bold" letter-spacing="-4">Twój ruch.</text><text x="70" y="328" fill="#d5ef89" font-size="60" font-weight="bold" letter-spacing="-3">Arena Mocy</text><text x="73" y="389" fill="#a4b0a5" font-size="25">Warcaby. Nowe możliwości.</text><rect x="70" y="470" width="263" height="56" rx="10" fill="#d5ef89"/><text x="99" y="506" fill="#17221a" font-size="22" font-weight="bold">Zagraj bez konta ↗</text><text x="74" y="586" fill="#a4b0a5" font-size="19">gry.zgrana.pl · 1–2 graczy · online i offline</text></g><g transform="translate(716 168) rotate(-10 172 172)"><rect x="-15" y="-15" width="374" height="374" rx="12" fill="#26362e"/>${cells}</g><text x="1020" y="100" fill="#d5ef89" font-size="72">✧</text></svg>`
  await page.setContent(`<style>body{margin:0}</style>${svg}`)
  await mkdir('public/og', { recursive: true })
  await page.screenshot({ path: 'public/og/gry.png' })
  const icon = await readFile('public/pwa/gry-icon.svg', 'utf8')
  for (const size of [192, 512]) {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(
      `<style>body{margin:0;background:#101918}svg{width:100%;height:100%}</style>${icon}`,
    )
    await page.screenshot({ path: `public/pwa/gry-${size}.png` })
  }
  console.log('Generated Gry OG 1200×630 and install icons 192/512.')
} finally {
  await browser.close()
}
