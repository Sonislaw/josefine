import { CONFIG, PASSIVES, WEAPONS, xpRequired } from './config'
import type { Choice, Game, Passive, Random, Weapon } from './model'
export function legalChoices(g: Game): Choice[] {
  const choices: Choice[] = []
  for (const id of Object.keys(WEAPONS) as Weapon[]) {
    const level = g.weapons[id] ?? 0
    if (level < 4 && (level > 0 || Object.keys(g.weapons).length < 3))
      choices.push({ type: 'weapon', id })
    if (level === 4 && (g.passives[WEAPONS[id].passive] ?? 0) >= 2 && !g.evolved.includes(id))
      choices.push({ type: 'evolve', id })
  }
  for (const id of Object.keys(PASSIVES) as Passive[]) {
    const level = g.passives[id] ?? 0
    if (level < 3 && (level > 0 || Object.keys(g.passives).length < 3))
      choices.push({ type: 'passive', id })
  }
  return choices.length ? choices : [{ type: 'heal' }]
}
export function dealChoices(g: Game, rng: Random) {
  const all = legalChoices(g)
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[all[i], all[j]] = [all[j]!, all[i]!]
  }
  g.choices = all.slice(0, 3)
}
export function checkLevel(g: Game, rng: Random) {
  if (g.mode === 'playing' && g.xp >= xpRequired(g.level)) {
    g.xp -= xpRequired(g.level)
    g.level++
    g.mode = 'upgrade'
    dealChoices(g, rng)
    g.events.push('upgrade')
  }
}
const choiceKey = (c: Choice) => (c.type === 'heal' ? 'heal' : `${c.type}:${c.id}`)
export function chooseUpgrade(g: Game, choice: Choice, rng: Random): boolean {
  if (
    g.mode !== 'upgrade' ||
    !g.choices.some((c) => choiceKey(c) === choiceKey(choice)) ||
    !legalChoices(g).some((c) => choiceKey(c) === choiceKey(choice))
  )
    return false
  if (choice.type === 'weapon') g.weapons[choice.id] = (g.weapons[choice.id] ?? 0) + 1
  if (choice.type === 'passive') g.passives[choice.id] = (g.passives[choice.id] ?? 0) + 1
  if (choice.type === 'evolve') g.evolved.push(choice.id)
  if (choice.type === 'heal') g.player.hp = Math.min(g.player.maxHp, g.player.hp + CONFIG.heal)
  g.mode = 'playing'
  g.choices = []
  checkLevel(g, rng)
  return true
}
export function choiceText(g: Pick<Game, 'weapons' | 'passives'>, c: Choice) {
  if (c.type === 'heal')
    return {
      title: 'Oddech przy latarni',
      detail: 'Rozwój ukończony. Odzyskaj do 25 zdrowia (nie ponad maksimum).',
    }
  if (c.type === 'evolve')
    return {
      title: WEAPONS[c.id].evolution,
      detail: {
        fire: 'Pociski wybuchają w promieniu 95 jednostek. Główny cel otrzymuje obrażenia raz.',
        lightning: 'Każdy atak wyzwala dwa niezależne łańcuchy błyskawic.',
        frost: 'Puls lodu sięga dwukrotnie dalej i zadaje 50% więcej obrażeń.',
        blades: 'Drugi pierścień ostrzy razi wrogów dalej od bohatera.',
      }[c.id],
    }
  if (c.type === 'passive')
    return {
      title: `${PASSIVES[c.id].name} · poziom ${(g.passives[c.id] ?? 0) + 1}`,
      detail: PASSIVES[c.id].description,
    }
  const w = WEAPONS[c.id],
    level = g.weapons[c.id] ?? 0
  const base = level
    ? `Obrażenia bazowe: ${w.baseDamage + (level - 1) * w.damageStep} → ${w.baseDamage + level * w.damageStep}.`
    : `Nowa broń. ${w.baseDamage} obrażeń bazowych co ${w.interval.toLocaleString('pl-PL')} s.`
  const behavior = {
    fire: 'Automatyczny strzał w najbliższego wroga.',
    lightning: `${Math.min(5, level + 2)} cele w łańcuchu.`,
    frost: 'Puls obrażeń i spowolnienie o 45% przez 1,5 s.',
    blades: `${level + 2} ostrza krążące wokół bohatera.`,
  }[c.id]
  return { title: `${w.name} · poziom ${level + 1}`, detail: `${base} ${behavior}` }
}
