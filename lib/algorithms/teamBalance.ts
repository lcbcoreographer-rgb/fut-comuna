import type { Profile } from '@/types'

export interface BalancedTeams {
  blue: Profile[]
  black: Profile[]
  overallDiff: number
  blueAvg: number
  blackAvg: number
}

export interface ThreeTeams {
  blue: Profile[]
  black: Profile[]
  red: Profile[]
  blueAvg: number
  blackAvg: number
  redAvg: number
  maxDiff: number
}

export type TeamColor = 'blue' | 'black' | 'red'

export const TEAM_LABEL: Record<TeamColor, string> = { blue: 'Azul', black: 'Preto', red: 'Vermelho' }
export const TEAM_COLOR_CLASS: Record<TeamColor, string> = {
  blue: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  black: 'text-gray-300 border-gray-500/30 bg-gray-500/10',
  red: 'text-red-400 border-red-500/30 bg-red-500/10',
}
export const TEAM_DOT_CLASS: Record<TeamColor, string> = {
  blue: 'bg-blue-400',
  black: 'bg-gray-400',
  red: 'bg-red-400',
}

function avg(players: Profile[]): number {
  if (players.length === 0) return 0
  return players.reduce((sum, p) => sum + p.overall, 0) / players.length
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// lineSize = jogadores de linha por time (não conta GK). teamSize = lineSize + 1.
export function balanceThreeTeams(players: Profile[], lineSize = 5): ThreeTeams {
  const teamSize = lineSize + 1
  const gks = players.filter((p) => p.primary_position === 'goleiro')
  const outfield = players.filter((p) => p.primary_position !== 'goleiro')

  let best: [Profile[], Profile[], Profile[]] = [[], [], []]
  let bestMaxDiff = Infinity
  const ITERATIONS = 400

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const teams: [Profile[], Profile[], Profile[]] = [[], [], []]

    // 1 goleiro por time
    const gkShuffled = shuffleArray(gks)
    gkShuffled.slice(0, 3).forEach((gk, idx) => teams[idx].push(gk))
    // GKs extras viram linha
    gkShuffled.slice(3).forEach((gk) => {
      const weakest = [0, 1, 2].reduce((a, b) => (avg(teams[a]) < avg(teams[b]) ? a : b))
      teams[weakest].push(gk)
    })

    // Outfield: grupos de 3 com shuffle interno, preenche o mais fraco primeiro
    const sorted = [...outfield].sort((a, b) => b.overall - a.overall)
    for (let j = 0; j < sorted.length; j += 3) {
      const group = shuffleArray(sorted.slice(j, j + 3))
      const teamOrder = [0, 1, 2].sort((a, b) => avg(teams[a]) - avg(teams[b]))
      group.forEach((p, k) => { if (k < teamOrder.length) teams[teamOrder[k]].push(p) })
    }

    const t: [Profile[], Profile[], Profile[]] = [
      teams[0].slice(0, teamSize),
      teams[1].slice(0, teamSize),
      teams[2].slice(0, teamSize),
    ]

    const avgs = t.map(avg)
    const maxDiff = Math.max(...avgs) - Math.min(...avgs)
    if (maxDiff < bestMaxDiff) {
      bestMaxDiff = maxDiff
      best = t
    }
    if (bestMaxDiff < 0.5) break
  }

  return {
    blue: best[0],
    black: best[1],
    red: best[2],
    blueAvg: avg(best[0]),
    blackAvg: avg(best[1]),
    redAvg: avg(best[2]),
    maxDiff: bestMaxDiff,
  }
}

// 2 times (legado)
export function balanceTeams(players: Profile[], teamSize = 6): BalancedTeams {
  const goalkeepers = players.filter((p) => p.primary_position === 'goleiro')
  const defenders = players.filter((p) => ['zagueiro', 'lateral', 'volante'].includes(p.primary_position))
  const attackers = players.filter((p) => ['atacante', 'meia_ofensivo', 'meia'].includes(p.primary_position))
  const others = players.filter(
    (p) => !['goleiro', 'zagueiro', 'lateral', 'volante', 'atacante', 'meia_ofensivo', 'meia'].includes(p.primary_position)
  )

  if (players.length < teamSize * 2) {
    const sorted = [...players].sort((a, b) => b.overall - a.overall)
    const blue: Profile[] = []
    const black: Profile[] = []
    sorted.forEach((p, i) => { if (i % 4 === 0 || i % 4 === 3) blue.push(p); else black.push(p) })
    return { blue, black, overallDiff: Math.abs(avg(blue) - avg(black)), blueAvg: avg(blue), blackAvg: avg(black) }
  }

  let bestBlue: Profile[] = []
  let bestBlack: Profile[] = []
  let bestDiff = Infinity

  for (let iter = 0; iter < 200; iter++) {
    const blue: Profile[] = []
    const black: Profile[] = []
    shuffleArray(goalkeepers).forEach((gk, i) => (i % 2 === 0 ? blue : black).push(gk))
    ;[...defenders].sort((a, b) => b.overall - a.overall).forEach((p, i) => (i % 2 === 0 ? blue : black).push(p))
    shuffleArray(attackers).sort((a, b) => b.overall - a.overall).forEach((p, i) => (i % 2 === 0 ? blue : black).push(p))
    shuffleArray(others).forEach((p) => (blue.length <= black.length ? blue : black).push(p))
    const b = blue.slice(0, teamSize)
    const bl = black.slice(0, teamSize)
    const diff = Math.abs(avg(b) - avg(bl))
    if (diff < bestDiff) { bestDiff = diff; bestBlue = b; bestBlack = bl }
    if (bestDiff < 1) break
  }

  return { blue: bestBlue, black: bestBlack, overallDiff: bestDiff, blueAvg: avg(bestBlue), blackAvg: avg(bestBlack) }
}
