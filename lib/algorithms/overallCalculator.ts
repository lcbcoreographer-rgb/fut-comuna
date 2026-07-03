import type { PlayerStats, Profile } from '@/types'

interface OverallResult {
  overall: number
  pac: number
  sho: number
  pas: number
  dri: number
  def: number
  phy: number
}

function clamp(value: number, min = 40, max = 99): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

function normalize(raw: number, cap: number, base = 60): number {
  return base + (raw / cap) * (99 - base)
}

export function calculateOverall(stats: PlayerStats, position: string): OverallResult {
  const {
    games_played,
    wins,
    goals,
    assists,
    goal_participations,
    mvp_count,
    max_win_streak,
  } = stats

  if (games_played === 0) {
    return { overall: 60, pac: 60, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 }
  }

  const winRate = wins / games_played
  const goalsPerGame = goals / games_played
  const assistsPerGame = assists / games_played
  const participationsPerGame = goal_participations / games_played
  const mvpRate = mvp_count / games_played

  // Overall ponderado por posição
  let overall: number
  if (position === 'goleiro') {
    overall = (
      winRate * 40 +
      mvpRate * 15 +
      normalize(games_played, 100) * 0.3 +
      max_win_streak * 0.5
    )
    overall = clamp(normalize(overall, 100))
  } else if (position === 'zagueiro' || position === 'lateral') {
    overall = clamp(
      winRate * 35 +
      goalsPerGame * 8 +
      assistsPerGame * 12 +
      participationsPerGame * 10 +
      mvpRate * 15 +
      normalize(games_played, 100, 50) * 0.2 +
      max_win_streak * 0.4 +
      55
    )
  } else if (position === 'volante' || position === 'meia') {
    overall = clamp(
      winRate * 25 +
      goalsPerGame * 12 +
      assistsPerGame * 15 +
      participationsPerGame * 13 +
      mvpRate * 15 +
      normalize(games_played, 100, 50) * 0.2 +
      max_win_streak * 0.3 +
      55
    )
  } else {
    // atacante / meia_ofensivo
    overall = clamp(
      winRate * 20 +
      goalsPerGame * 18 +
      assistsPerGame * 12 +
      participationsPerGame * 12 +
      mvpRate * 12 +
      normalize(games_played, 100, 50) * 0.2 +
      max_win_streak * 0.3 +
      55
    )
  }

  // Atributos derivados
  const pac = clamp(
    normalize(games_played, 80) * 0.5 +
    (winRate * 30) +
    40
  )

  const sho = clamp(
    normalize(goalsPerGame, 1.5) * 0.7 +
    (goals > 0 ? normalize(goals, 60) * 0.3 : 0) +
    40
  )

  const pas = clamp(
    normalize(assistsPerGame, 1.0) * 0.6 +
    normalize(assists, 50) * 0.3 +
    40
  )

  const dri = clamp(
    normalize(participationsPerGame, 2.0) * 0.6 +
    winRate * 20 +
    40
  )

  const def = position === 'goleiro' || position === 'zagueiro' || position === 'lateral'
    ? clamp(winRate * 40 + normalize(games_played, 80) * 0.3 + 45)
    : clamp(winRate * 20 + normalize(games_played, 80) * 0.2 + 40)

  const phy = clamp(normalize(games_played, 100) * 0.7 + winRate * 15 + 40)

  return { overall, pac, sho, pas, dri, def, phy }
}
