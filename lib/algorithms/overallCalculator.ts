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
    goals_conceded,
    games_with_goals,
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
  const concededPerGame = goals_conceded / games_played
  // % de partidas em que o jogador marcou pelo menos 1 gol
  const scoringConsistency = games_with_goals / games_played

  // Inverso dos gols sofridos: 0 gols/jogo = 99, 4+ gols/jogo = 40
  const defScore = clamp(99 - (concededPerGame / 4) * 59, 40, 99)

  let overall: number

  if (position === 'goleiro') {
    // Goleiro: gols sofridos é o principal + vitórias + regularidade
    overall = clamp(
      defScore * 0.50 +
      winRate * 30 +
      normalize(games_played, 100, 50) * 0.15 +
      mvpRate * 10
    )
  } else if (position === 'zagueiro' || position === 'lateral') {
    // Defensor: poucos gols sofridos (40%) + mais jogos (25%) + gols+assists (20%) + vitórias (15%)
    overall = clamp(
      defScore * 0.40 +
      normalize(games_played, 80, 50) * 0.25 +
      normalize(goals + assists, 30, 50) * 0.20 +
      winRate * 15
    )
  } else if (position === 'volante' || position === 'meia') {
    overall = clamp(
      winRate * 20 +
      goalsPerGame * 12 +
      assistsPerGame * 15 +
      participationsPerGame * 13 +
      mvpRate * 10 +
      normalize(games_played, 80, 50) * 0.15 +
      55
    )
  } else {
    // atacante / meia_ofensivo: partidas com gol (40%) + gols totais (35%) + assists (15%) + vitórias (10%)
    overall = clamp(
      scoringConsistency * 40 +
      normalize(goals, 60, 50) * 0.35 +
      normalize(assists, 30, 50) * 0.15 +
      winRate * 10
    )
  }

  // Atributos derivados
  const pac = clamp(normalize(games_played, 80) * 0.5 + winRate * 30 + 40)

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
    ? clamp(defScore * 0.7 + normalize(games_played, 80) * 0.3)
    : clamp(winRate * 20 + normalize(games_played, 80) * 0.2 + 40)

  const phy = clamp(normalize(games_played, 100) * 0.7 + winRate * 15 + 40)

  return { overall, pac, sho, pas, dri, def, phy }
}
