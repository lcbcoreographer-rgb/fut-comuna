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
    mvp_count,
  } = stats

  if (games_played === 0) {
    return { overall: 60, pac: 60, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 }
  }

  const winRate = wins / games_played
  const mvpRate = mvp_count / games_played
  const concededPerGame = goals_conceded / games_played

  // "Jogos virtuais" de regularização: sem isso, 1 gol em 1 jogo já é 100% de
  // aproveitamento e satura a nota. Ao somar K jogos vazios no denominador, a
  // média só se aproxima do valor real conforme mais jogos são disputados —
  // ou seja, sustentar uma média alta fica mais difícil (e mais valioso)
  // quanto mais jogos o jogador tiver.
  const K = 8
  const goalsPerGame = goals / (games_played + K)
  const assistsPerGame = assists / (games_played + K)
  const participationsPerGame = goal_participations / (games_played + K)

  // Inverso dos gols sofridos: 0 gols/jogo = 99, 4+ gols/jogo = 40
  const defScore = clamp(99 - (concededPerGame / 4) * 59, 40, 99)

  // Multiplicador de regularidade: com poucos jogos o overall fica preso perto
  // da base (40), mesmo que a média seja ótima. Só aos 10 jogos o desempenho
  // real passa a valer 100% — precisa sustentar a média, não só ter sorte
  // em 1-2 partidas.
  const gamesMultiplier = Math.min(1, games_played / 10)

  // Goleiro e zagueiro são avaliados pela média de gols sofridos (menos = melhor);
  // as demais posições, pela média real de gols feitos por jogo.
  const isDefensive = position === 'goleiro' || position === 'zagueiro'
  const realGoalsPerGame = goals / games_played

  let tierScore: number
  if (isDefensive) {
    if (concededPerGame < 1) tierScore = 95
    else if (concededPerGame < 1.5) tierScore = 90
    else if (concededPerGame < 2) tierScore = 85
    else tierScore = clamp(85 - (concededPerGame - 2) * 15, 40, 85)
  } else {
    if (realGoalsPerGame > 5) tierScore = 95
    else if (realGoalsPerGame > 4) tierScore = 90
    else if (realGoalsPerGame > 3) tierScore = 85
    else tierScore = 40 + (realGoalsPerGame / 3) * 45
  }

  const overall = clamp(40 + (tierScore - 40) * gamesMultiplier)

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
