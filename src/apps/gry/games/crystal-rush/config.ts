/** All gameplay balance lives here. Only decorative particles have a cap. */
export const CONFIG = {
  width: 900,
  height: 600,
  step: 1 / 120,
  maxFrameGap: 0.25,
  bounds: { minX: 15, maxX: 885, minY: 65, maxY: 585 },
  player: { radius: 12, speed: 230, hp: 3, hurtProtection: 1.8, upgradeProtection: 1.3 },
  dash: { duration: 0.22, speed: 800, cooldown: 3.2, minimumCooldown: 1.1, score: 15 },
  gems: {
    initial: 12,
    maximum: 18,
    radius: 7,
    collectDistance: 22,
    interval: 0.7,
    magnetRadius: 55,
    magnetSpeed: 210,
    minX: 35,
    maxX: 865,
    minY: 90,
    maxY: 570,
  },
  combo: { duration: 2.8, maximum: 5, points: 10 },
  meteors: {
    radius: 11,
    baseRate: 0.45,
    rateGrowth: 0.025,
    baseSpeed: 65,
    speedGrowth: 1.2,
    maximumSpeedBonus: 105,
    randomSpeed: 22,
    spawnMargin: 25,
  },
  upgrades: {
    speedBonus: 0.12,
    magnetBonus: 35,
    cooldownReduction: 0.45,
    initialXp: 8,
    xpGrowth: 3,
  },
  pointerStopDistance: 8,
  maxParticles: 240,
  hitFlash: 0.25,
} as const
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
export const spawnRate = (seconds: number) =>
  CONFIG.meteors.baseRate + CONFIG.meteors.rateGrowth * seconds
export const expectedBirths = (seconds: number) =>
  Math.floor(
    CONFIG.meteors.baseRate * seconds + (CONFIG.meteors.rateGrowth / 2) * seconds ** 2 + 1e-9,
  )
export const movementSpeed = (n: number) =>
  CONFIG.player.speed * (1 + CONFIG.upgrades.speedBonus * n)
export const magnetRadius = (n: number) =>
  CONFIG.gems.magnetRadius + CONFIG.upgrades.magnetBonus * n
export const dashCooldown = (n: number) =>
  Math.max(
    CONFIG.dash.minimumCooldown,
    CONFIG.dash.cooldown - CONFIG.upgrades.cooldownReduction * n,
  )
export const xpRequired = (level: number) =>
  CONFIG.upgrades.initialXp + (level - 1) * CONFIG.upgrades.xpGrowth
