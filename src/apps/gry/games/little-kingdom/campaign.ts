import type { Kingdom } from './engine'
import { BALANCE } from './balance'
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
  announcedTurn: number
  dueTurn: number
  army: Army
  tactic: EnemyTactic
  intercepted: boolean
}
export interface EnemyCampaign {
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
export function newCampaign(rank: number): EnemyCampaign {
  return {
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
    enemy: f.enemy ? { ...f.enemy, garrison: { ...f.enemy.garrison } } : null,
  }
}
export function returnRaid(s: Kingdom) {
  const f = s.affairs
  if (f.raid && f.enemy) f.enemy.garrison = addArmy(f.enemy.garrison, f.raid.army)
  f.raid = null
}
export function makePeace(s: Kingdom, turn: number) {
  returnRaid(s)
  const e = s.affairs.enemy!
  e.peaceUntil = turn + WAR.peace
  s.affairs.protectedUntil = e.peaceUntil
  s.affairs.settlements.find((c) => c.id === 2)!.relation = 'peaceful'
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
  peaceEnded: boolean
  raidAnnounced: boolean
}
/** Runs once at END of a legal turn, after this turn's combat and economy. */
export function advanceCampaign(s: Kingdom): CampaignUpdate {
  const result: CampaignUpdate = { recruited: null, peaceEnded: false, raidAnnounced: false }
  const f = s.affairs,
    e = f.enemy
  if (!e || s.status !== 'playing') return result
  const peaceful = e.peaceUntil !== null
  if (!peaceful) e.warTurns++
  e.recovery++
  if (e.recovery >= WAR.recovery) {
    e.recovery = 0
    const total = addArmy(e.garrison, f.raid?.army ?? emptyArmy()),
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
          break
        }
      }
  }
  if (peaceful && s.turn >= e.peaceUntil!) {
    e.peaceUntil = null
    e.campaign++
    e.advantage = 0
    e.warTurns = 0
    s.affairs.settlements.find((c) => c.id === 2)!.relation = 'hostile'
    result.peaceEnded = true
  }
  if (
    e.peaceUntil === null &&
    !f.raid &&
    s.turn >= f.protectedUntil &&
    armySize(e.garrison) >= WAR.raidMin
  ) {
    const army = raidingParty(e.garrison)
    e.garrison = subtractArmy(e.garrison, army)
    f.raid = {
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
