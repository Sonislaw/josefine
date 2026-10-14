import type { Kingdom } from './engine'
import { CASTLES } from './castles'
import { UNIT_IDS, WAR, armyCapacity, armySize, type Army } from './military'
import { newCampaign } from './campaign'
import type { LegacyKingdom } from './legacy-campaign-storage'
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const natural = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0
export const validArmy = (v: unknown): v is Army =>
  object(v) &&
  UNIT_IDS.every((u) => natural(v[u])) &&
  armySize(v as Army) <= armySize(WAR.targets[2]!)
/** Called only after complete legacy validation. Preserve old campaigns and deadlines. */
export function migrateCastles(old: LegacyKingdom): Kingdom {
  const f = old.affairs,
    contact = f.settlements.find((c) => c.id === 2)
  const enemies: Kingdom['affairs']['enemies'] = {}
  if (contact && f.enemy)
    enemies[2] = {
      ...newCampaign(old.rank, contact.discoveredTurn),
      ...f.enemy,
      protectedUntil: f.protectedUntil,
      health: CASTLES.health,
      treasury: { ...CASTLES.treasury },
      stockRecovery: 0,
      lastAttackedTurn: null,
      destroyedTurn: null,
    }
  return {
    ...old,
    affairs: {
      army: { ...f.army },
      settlements: f.settlements.map((c) => ({ ...c })),
      raid: f.raid ? { ...f.raid, enemyId: 2, army: { ...f.raid.army } } : null,
      protectedUntil: f.protectedUntil,
      enemies,
    },
  }
}
export function validateCampaign(state: Kingdom): boolean {
  const f = state.affairs,
    raw = f as unknown as Record<string, unknown>
  if (!validArmy(f.army) || !object(raw.enemies) || Object.hasOwn(raw, 'enemy')) return false
  const level = Object.values(state.buildings).find((b) => b.kind === 'barracks')?.level ?? 0
  if (
    armySize(f.army) > armyCapacity(level) ||
    !natural(f.protectedUntil) ||
    f.protectedUntil > state.turn + WAR.peace
  )
    return false
  const contacts = f.settlements.filter((c) => c.id >= 2)
  if (Object.keys(raw.enemies).length !== contacts.length) return false
  if (!contacts.length && (f.raid !== null || f.protectedUntil !== 0)) return false
  for (const c of contacts) {
    const e = raw.enemies[c.id]
    if (
      !object(e) ||
      !validArmy(e.garrison) ||
      !natural(e.recovery) ||
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
      e.expeditionAvailableTurn > state.turn + WAR.expeditionCooldown ||
      !natural(e.protectedUntil) ||
      e.protectedUntil < c.discoveredTurn + WAR.protection ||
      e.protectedUntil > state.turn + WAR.peace ||
      !natural(e.health) ||
      e.health > CASTLES.health ||
      !natural(e.stockRecovery) ||
      e.stockRecovery >= CASTLES.replenishTurns ||
      !object(e.treasury) ||
      !(['wood', 'stone', 'food', 'gold'] as const).every(
        (k) =>
          natural((e.treasury as Record<string, unknown>)[k]) &&
          ((e.treasury as Record<string, number>)[k] ?? Infinity) <= CASTLES.treasury[k],
      )
    )
      return false
    if (
      e.lastAttackedTurn !== null &&
      (!natural(e.lastAttackedTurn) ||
        e.lastAttackedTurn <= c.discoveredTurn ||
        e.lastAttackedTurn > state.turn)
    )
      return false
    if (
      e.lootCampaign !== null &&
      (!natural(e.lootCampaign) || e.lootCampaign > e.campaign || e.lootCampaign < 1)
    )
      return false
    if (
      e.peaceUntil !== null &&
      (!natural(e.peaceUntil) ||
        e.peaceUntil <= state.turn ||
        e.peaceUntil > state.turn + WAR.peace ||
        e.protectedUntil !== e.peaceUntil)
    )
      return false
    if (e.health === 0) {
      if (
        c.relation !== 'ruins' ||
        !natural(e.destroyedTurn) ||
        e.destroyedTurn !== e.lastAttackedTurn ||
        e.destroyedTurn > state.turn ||
        armySize(e.garrison) !== 0 ||
        e.peaceUntil !== null ||
        f.raid?.enemyId === c.id ||
        Object.values(e.treasury).some(Boolean)
      )
        return false
    } else if (
      e.destroyedTurn !== null ||
      c.relation !== (e.peaceUntil === null ? 'hostile' : 'peaceful')
    )
      return false
    const total = armySize(e.garrison) + (f.raid?.enemyId === c.id ? armySize(f.raid.army) : 0)
    if (total > armySize(WAR.targets[Math.max(0, state.rank - 1)]!)) return false
  }
  const raid = raw.raid
  if (raid !== null) {
    if (
      !object(raid) ||
      !natural(raid.enemyId) ||
      !validArmy(raid.army) ||
      !natural(raid.announcedTurn) ||
      !natural(raid.dueTurn) ||
      raid.announcedTurn > state.turn ||
      raid.dueTurn !== raid.announcedTurn + WAR.warning ||
      raid.dueTurn <= state.turn ||
      typeof raid.intercepted !== 'boolean' ||
      !['none', 'guard', 'volley', 'charge'].includes(raid.tactic as string) ||
      armySize(raid.army) > WAR.raidMax
    )
      return false
    const e = f.enemies[raid.enemyId]
    if (
      !e ||
      e.health === 0 ||
      e.peaceUntil !== null ||
      raid.announcedTurn < e.protectedUntil ||
      raid.announcedTurn < f.protectedUntil
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
  return true
}
