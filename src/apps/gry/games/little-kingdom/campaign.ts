import type { Kingdom, Resources } from './engine'
import { BALANCE } from './balance'
import { CASTLES } from './castles'
import {
  WAR,
  UNIT_IDS,
  emptyArmy,
  armySize,
  addArmy,
  subtractArmy,
  type Army,
  type EnemyTactic,
  type Tactic,
  type Unit,
} from './military'

export interface Raid {
  enemyId: number
  announcedTurn: number
  dueTurn: number
  army: Army
  tactic: EnemyTactic
  intercepted: boolean
}
export interface EnemyCampaign {
  health: number
  treasury: Resources
  stockRecovery: number
  lastAttackedTurn: number | null
  destroyedTurn: number | null
  protectedUntil: number
  garrison: Army
  recovery: number
  recruitmentCursor: number
  warTurns: number
  campaign: number
  advantage: number
  peaceUntil: number | null
  expeditionAvailableTurn: number
  lootCampaign: number | null
}
export const enemyTarget = (rank: number): Army => ({
  ...WAR.targets[Math.max(0, Math.min(2, rank - 1))]!,
})
export const enemyDefence = (rank: number) =>
  BALANCE.combat.garrisonSupport[Math.max(0, Math.min(2, rank - 1))]!
export function newCampaign(rank: number, discoveredTurn = 0): EnemyCampaign {
  return {
    health: CASTLES.health,
    treasury: { ...CASTLES.treasury },
    stockRecovery: 0,
    lastAttackedTurn: null,
    destroyedTurn: null,
    protectedUntil: discoveredTurn + WAR.protection,
    garrison: enemyTarget(rank),
    recovery: 0,
    recruitmentCursor: 0,
    warTurns: 0,
    campaign: 1,
    advantage: 0,
    peaceUntil: null,
    expeditionAvailableTurn: 0,
    lootCampaign: null,
  }
}
export const enemyTactic = (e: EnemyCampaign): Tactic =>
  (['guard', 'volley', 'charge'] as const)[Math.floor(e.warTurns / WAR.stanceTurns) % 3]!
export function cloneAffairs(s: Kingdom) {
  const f = s.affairs
  return {
    ...f,
    army: { ...f.army },
    settlements: f.settlements.map((c) => ({ ...c })),
    raid: f.raid ? { ...f.raid, army: { ...f.raid.army } } : null,
    enemies: Object.fromEntries(
      Object.entries(f.enemies).map(([id, e]) => [
        id,
        {
          ...e,
          garrison: { ...e.garrison },
          treasury: { ...e.treasury },
        },
      ]),
    ),
  }
}
export function returnRaid(s: Kingdom) {
  const f = s.affairs
  if (f.raid) {
    const e = f.enemies[f.raid.enemyId]
    if (e && e.health > 0) e.garrison = addArmy(e.garrison, f.raid.army)
  }
  f.raid = null
}
export function makePeace(s: Kingdom, enemyId: number, turn: number) {
  if (s.affairs.raid?.enemyId === enemyId) {
    returnRaid(s)
    s.affairs.protectedUntil = turn + WAR.protection
  }
  const e = s.affairs.enemies[enemyId]!
  e.peaceUntil = turn + WAR.peace
  e.protectedUntil = e.peaceUntil
  s.affairs.settlements.find((c) => c.id === enemyId)!.relation = 'peaceful'
}
/** Round-robin selection is deterministic and moves troops, never copies them. */
export function raidingParty(army: Army): Army {
  const party = emptyArmy(),
    reserve = { ...army },
    size = Math.min(WAR.raidMax, Math.ceil((armySize(army) * 2) / 3))
  let index = 0
  while (armySize(party) < size) {
    const u = UNIT_IDS[index++ % UNIT_IDS.length]!
    if (reserve[u] > 0) {
      reserve[u]--
      party[u]++
    }
  }
  return party
}
export interface CampaignUpdate {
  recruited: Unit | null
  recruits: { enemyId: number; unit: Unit }[]
  castleRepairs: { enemyId: number; amount: number }[]
  peaceEnded: boolean
  raidAnnounced: boolean
}
/** Runs once at END of a legal turn, after this turn's combat and economy. */
export function advanceCampaign(s: Kingdom): CampaignUpdate {
  const result: CampaignUpdate = {
    recruited: null,
    recruits: [],
    castleRepairs: [],
    peaceEnded: false,
    raidAnnounced: false,
  }
  const f = s.affairs
  if (s.status !== 'playing') return result
  // Every enemy evolves independently, even offscreen. Dead castles never recover.
  for (const c of f.settlements) {
    const e = f.enemies[c.id]
    if (!e || e.health === 0) continue
    const peaceful = e.peaceUntil !== null
    if (!peaceful) e.warTurns++
    e.recovery++
    if (e.recovery >= WAR.recovery) {
      e.recovery = 0
      const total = addArmy(e.garrison, f.raid?.enemyId === c.id ? f.raid.army : emptyArmy()),
        target = enemyTarget(s.rank)
      // Per-type quotas prevent free soldiers on rank-up and guarantee eventual recovery.
      // A migrated old garrison can temporarily exceed one quota; the total cap still wins.
      if (armySize(total) < armySize(target))
        for (let i = 0; i < UNIT_IDS.length; i++) {
          const index = (e.recruitmentCursor + i) % UNIT_IDS.length,
            u = UNIT_IDS[index]!
          if (total[u] < target[u]) {
            e.garrison[u]++
            e.recruitmentCursor = (index + 1) % UNIT_IDS.length
            result.recruited = u
            result.recruits.push({ enemyId: c.id, unit: u })
            break
          }
        }
    }
    if (peaceful && s.turn >= e.peaceUntil!) {
      e.peaceUntil = null
      e.campaign++
      e.advantage = 0
      e.warTurns = 0
      c.relation = 'hostile'
      result.peaceEnded = true
    }
    if (e.lastAttackedTurn !== s.turn) {
      const amount = Math.min(CASTLES.repair, CASTLES.health - e.health)
      e.health += amount
      if (amount) result.castleRepairs.push({ enemyId: c.id, amount })
      if (++e.stockRecovery >= CASTLES.replenishTurns) {
        e.stockRecovery = 0
        for (const k of ['wood', 'stone', 'food', 'gold'] as const)
          e.treasury[k] = Math.min(CASTLES.treasury[k], e.treasury[k] + CASTLES.replenish[k])
      }
    }
  }
  // One shared incoming raid and recovery window. Earliest eligible deadline wins,
  // so an older castle cannot monopolise all raids while new ones stay invisible.
  const candidate = f.settlements
    .filter((c) => {
      const e = f.enemies[c.id]
      return (
        e &&
        e.health > 0 &&
        e.peaceUntil === null &&
        s.turn >= e.protectedUntil &&
        armySize(e.garrison) >= WAR.raidMin
      )
    })
    .sort(
      (a, b) => f.enemies[a.id]!.protectedUntil - f.enemies[b.id]!.protectedUntil || a.id - b.id,
    )[0]
  if (!f.raid && s.turn >= f.protectedUntil && candidate) {
    const e = f.enemies[candidate.id]!
    const army = raidingParty(e.garrison)
    e.garrison = subtractArmy(e.garrison, army)
    f.raid = {
      enemyId: candidate.id,
      announcedTurn: s.turn,
      dueTurn: s.turn + WAR.warning,
      army,
      tactic: enemyTactic(e),
      intercepted: false,
    }
    result.raidAnnounced = true
  }
  return result
}
