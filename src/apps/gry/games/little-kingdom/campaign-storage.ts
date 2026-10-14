import type { Kingdom } from './engine'
import { UNIT_IDS, WAR, armyCapacity, armySize, subtractArmy, type Army } from './military'
import { newCampaign } from './campaign'
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const natural = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0
export const validArmy = (v: unknown): v is Army =>
  object(v) &&
  UNIT_IDS.every((u) => natural(v[u])) &&
  armySize(v as Army) <= armySize(WAR.targets[2]!)
/** Called after old-format validation. Never advances a turn or awards resources. */
export function migrateWarfare(state: Kingdom): Kingdom {
  const f = state.affairs,
    c = f.settlements.find((c) => c.id === 2)
  f.army = { ...f.army, shieldbearer: 0 }
  f.enemy = null
  if (c) {
    const e = newCampaign(state.rank)
    f.enemy = e
    if (f.raid) {
      f.raid = { ...f.raid, army: { ...WAR.raiders }, tactic: 'none', intercepted: false }
      e.garrison = subtractArmy(WAR.garrison, f.raid.army)
    }
    if ((c.relation as string) === 'subdued') {
      c.relation = 'peaceful'
      e.peaceUntil = state.turn + WAR.peace
      f.protectedUntil = e.peaceUntil
      // Old one-time loot must not be claimable again in the same migrated campaign.
      e.lootCampaign = e.campaign
    }
  }
  return state
}
export function validateCampaign(state: Kingdom): boolean {
  const f = state.affairs,
    raw = f as unknown as Record<string, unknown>,
    c = f.settlements.find((c) => c.id === 2)
  if (!validArmy(f.army)) return false
  const level = Object.values(state.buildings).find((b) => b.kind === 'barracks')?.level ?? 0
  if (armySize(f.army) > armyCapacity(level)) return false
  if (!c) return raw.enemy === null && f.raid === null && f.protectedUntil === 0
  if (!object(raw.enemy)) return false
  const e = raw.enemy
  if (
    !validArmy(e.garrison) ||
    !natural(e.recovery) ||
    // Earlier v6 saves can contain the previous third-turn recovery counter.
    e.recovery >= Math.max(3, WAR.recovery) ||
    !natural(e.recruitmentCursor) ||
    e.recruitmentCursor >= 3 ||
    !natural(e.warTurns) ||
    e.warTurns > state.turn ||
    !natural(e.campaign) ||
    e.campaign < 1 ||
    !natural(e.advantage) ||
    e.advantage > 2 ||
    !natural(e.expeditionAvailableTurn) ||
    e.expeditionAvailableTurn > state.turn + WAR.expeditionCooldown
  )
    return false
  if (
    e.lootCampaign !== null &&
    (!natural(e.lootCampaign) || e.lootCampaign > e.campaign || e.lootCampaign < 1)
  )
    return false
  if (
    e.peaceUntil !== null &&
    (!natural(e.peaceUntil) || e.peaceUntil <= state.turn || e.peaceUntil > state.turn + WAR.peace)
  )
    return false
  if (c.relation !== (e.peaceUntil === null ? 'hostile' : 'peaceful')) return false
  if (
    !natural(f.protectedUntil) ||
    f.protectedUntil < c.discoveredTurn + WAR.protection ||
    f.protectedUntil > state.turn + WAR.peace
  )
    return false
  if (e.peaceUntil !== null && (f.raid !== null || f.protectedUntil !== e.peaceUntil)) return false
  const raid = raw.raid
  if (raid !== null) {
    if (
      !object(raid) ||
      !validArmy(raid.army) ||
      !natural(raid.announcedTurn) ||
      !natural(raid.dueTurn) ||
      raid.announcedTurn < f.protectedUntil ||
      raid.announcedTurn > state.turn ||
      raid.dueTurn !== raid.announcedTurn + WAR.warning ||
      raid.dueTurn <= state.turn ||
      typeof raid.intercepted !== 'boolean' ||
      !['none', 'guard', 'volley', 'charge'].includes(raid.tactic as string) ||
      armySize(raid.army) > WAR.raidMax
    )
      return false
    const army = raid.army as Army
    if (
      raid.tactic === 'none' &&
      (raid.intercepted
        ? army.shieldbearer !== 0 ||
          army.spearman > WAR.raiders.spearman ||
          army.archer > WAR.raiders.archer
        : UNIT_IDS.some((u) => army[u] !== WAR.raiders[u]))
    )
      return false
  }
  const total = armySize(e.garrison) + (f.raid ? armySize(f.raid.army) : 0)
  return total <= armySize(WAR.targets[Math.max(0, state.rank - 1)]!)
}
