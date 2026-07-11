import { createClient } from '@/lib/supabase/server'
import { calculateOverall } from '@/lib/algorithms/overallCalculator'
import { checkAndAwardAchievements } from '@/lib/utils/achievements'
import { CURRENT_SEASON } from '@/types'

export async function recalculatePlayerStats(playerId: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('primary_position')
    .eq('id', playerId)
    .single()

  if (!profile) return

  // Busca todas as partidas do jogador na temporada atual
  const { data: teamPlayerRows } = await supabase
    .from('team_players')
    .select('team_id, match_id, teams(color, match_id), matches(status, team_blue_score, team_black_score, team_red_score, started_at, ended_at, teams(color))')
    .eq('player_id', playerId)

  const matchesPlayed = teamPlayerRows?.filter(
    (tp) => (tp.matches as any)?.status === 'finished'
  ) ?? []

  // Stats base
  let games_played = matchesPlayed.length
  let wins = 0, draws = 0, losses = 0
  let goals_conceded = 0
  let minutes_played = 0
  let win_streak = 0, max_win_streak = 0
  let unbeaten_streak = 0, max_unbeaten_streak = 0

  const getScore = (match: any, color: string) =>
    color === 'blue' ? match.team_blue_score : color === 'black' ? match.team_black_score : (match.team_red_score ?? 0)

  for (const tp of matchesPlayed) {
    const match = tp.matches as any
    const team = tp.teams as any
    if (!match || !team) continue

    const oppTeam = (match.teams as any[])?.find((t) => t.color !== team.color)
    const myScore = getScore(match, team.color)
    const oppScore = oppTeam ? getScore(match, oppTeam.color) : 0
    goals_conceded += oppScore

    const durationMinutes = match.started_at && match.ended_at
      ? Math.round((new Date(match.ended_at).getTime() - new Date(match.started_at).getTime()) / 60000)
      : 7
    minutes_played += durationMinutes

    if (myScore > oppScore) {
      wins++
      win_streak++
      unbeaten_streak++
    } else if (myScore === oppScore) {
      draws++
      win_streak = 0
      unbeaten_streak++
    } else {
      losses++
      win_streak = 0
      unbeaten_streak = 0
    }

    max_win_streak = Math.max(max_win_streak, win_streak)
    max_unbeaten_streak = Math.max(max_unbeaten_streak, unbeaten_streak)
  }

  // Gols e assistências
  const { data: goalRows } = await supabase
    .from('goals')
    .select('id, match_id')
    .eq('scorer_id', playerId)
  const { data: assistRows } = await supabase
    .from('goals')
    .select('id')
    .eq('assist_player_id', playerId)

  const goals = goalRows?.length ?? 0
  const assists = assistRows?.length ?? 0
  const goal_participations = goals + assists
  const games_with_goals = new Set(goalRows?.map((g) => g.match_id)).size

  // MVP
  const currentYear = new Date().getFullYear()
  const { data: mvpRows } = await supabase
    .from('rounds')
    .select('id')
    .eq('mvp_player_id', playerId)
  const mvp_count = mvpRows?.length ?? 0

  const newStats = {
    player_id: playerId,
    season: currentYear,
    games_played,
    wins,
    draws,
    losses,
    goals,
    assists,
    goal_participations,
    goals_conceded,
    games_with_goals,
    win_streak,
    max_win_streak,
    unbeaten_streak,
    max_unbeaten_streak,
    minutes_played,
    mvp_count,
    updated_at: new Date().toISOString(),
  }

  await supabase.from('player_stats').upsert(newStats, { onConflict: 'player_id,season' })

  // Recalcula overall e atributos
  const attrs = calculateOverall(newStats as any, profile.primary_position)
  await supabase.from('profiles').update(attrs).eq('id', playerId)

  // Verifica conquistas
  await checkAndAwardAchievements(playerId, newStats as any)
}

// Soma o resultado de UMA partida encerrada aos totais já acumulados do jogador
// (em vez de recalcular tudo do zero a partir do histórico de partidas). Preserva
// qualquer total inserido manualmente (ex: temporadas anteriores ao app).
export async function applyFinishedMatchStats(matchId: string) {
  const supabase = await createClient()

  const { data: match } = await supabase
    .from('matches')
    .select('id, status, team_blue_score, team_black_score, team_red_score, started_at, ended_at, teams(id, color, team_players(player_id))')
    .eq('id', matchId)
    .single()

  if (!match || match.status !== 'finished') return

  const teams = (match.teams as any[]) ?? []
  if (teams.length < 2) return

  const getScore = (color: string) =>
    color === 'blue' ? match.team_blue_score : color === 'black' ? match.team_black_score : (match.team_red_score ?? 0)

  const { data: goalRows } = await supabase
    .from('goals')
    .select('scorer_id, assist_player_id')
    .eq('match_id', matchId)

  const durationMinutes = match.started_at && match.ended_at
    ? Math.round((new Date(match.ended_at).getTime() - new Date(match.started_at).getTime()) / 60000)
    : 7

  const currentYear = new Date().getFullYear()

  for (const team of teams) {
    const oppTeam = teams.find((t) => t.id !== team.id)
    const myScore = getScore(team.color)
    const oppScore = oppTeam ? getScore(oppTeam.color) : 0
    const playerIds: string[] = ((team.team_players as any[]) ?? []).map((tp) => tp.player_id)

    for (const playerId of playerIds) {
      const goalsScored = goalRows?.filter((g) => g.scorer_id === playerId).length ?? 0
      const assistsMade = goalRows?.filter((g) => g.assist_player_id === playerId).length ?? 0

      const { data: profile } = await supabase.from('profiles').select('primary_position').eq('id', playerId).single()
      const { data: current } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', playerId)
        .eq('season', currentYear)
        .single()
      if (!profile || !current) continue

      const isWin = myScore > oppScore
      const isDraw = myScore === oppScore
      const newWinStreak = isWin ? current.win_streak + 1 : 0
      const newUnbeatenStreak = isDraw || isWin ? current.unbeaten_streak + 1 : 0

      const updated = {
        games_played: current.games_played + 1,
        wins: current.wins + (isWin ? 1 : 0),
        draws: current.draws + (isDraw ? 1 : 0),
        losses: current.losses + (!isWin && !isDraw ? 1 : 0),
        goals: current.goals + goalsScored,
        assists: current.assists + assistsMade,
        goal_participations: current.goal_participations + goalsScored + assistsMade,
        goals_conceded: current.goals_conceded + oppScore,
        games_with_goals: current.games_with_goals + (goalsScored > 0 ? 1 : 0),
        win_streak: newWinStreak,
        max_win_streak: Math.max(current.max_win_streak, newWinStreak),
        unbeaten_streak: newUnbeatenStreak,
        max_unbeaten_streak: Math.max(current.max_unbeaten_streak, newUnbeatenStreak),
        minutes_played: current.minutes_played + durationMinutes,
        updated_at: new Date().toISOString(),
      }

      await supabase.from('player_stats').update(updated).eq('player_id', playerId).eq('season', currentYear)

      const merged = { ...current, ...updated }
      const attrs = calculateOverall(merged as any, profile.primary_position)
      await supabase.from('profiles').update(attrs).eq('id', playerId)

      await checkAndAwardAchievements(playerId, merged as any, goalsScored)
    }
  }
}

// Encerra a rodada: define o artilheiro (maior nº de gols nas partidas da rodada),
// grava o MVP escolhido pelo admin e soma o mvp_count ao jogador eleito.
export async function finishRound(roundId: string, mvpPlayerId: string | null) {
  const supabase = await createClient()

  const { data: round } = await supabase
    .from('rounds')
    .select('id, status, matches(id)')
    .eq('id', roundId)
    .single()

  if (!round || round.status === 'finished') return

  const matchIds: string[] = ((round.matches as any[]) ?? []).map((m) => m.id)

  const { data: goalRows } = matchIds.length > 0
    ? await supabase.from('goals').select('scorer_id').in('match_id', matchIds)
    : { data: [] as { scorer_id: string }[] }

  const goalCounts = new Map<string, number>()
  for (const g of goalRows ?? []) {
    goalCounts.set(g.scorer_id, (goalCounts.get(g.scorer_id) ?? 0) + 1)
  }
  let topScorerId: string | null = null
  let topGoals = 0
  for (const [playerId, count] of goalCounts) {
    if (count > topGoals) { topScorerId = playerId; topGoals = count }
  }

  await supabase.from('rounds').update({
    status: 'finished',
    mvp_player_id: mvpPlayerId,
    top_scorer_id: topScorerId,
  }).eq('id', roundId)

  if (!mvpPlayerId) return

  const currentYear = new Date().getFullYear()
  const { data: profile } = await supabase.from('profiles').select('primary_position').eq('id', mvpPlayerId).single()
  const { data: current } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', mvpPlayerId)
    .eq('season', currentYear)
    .single()
  if (!profile || !current) return

  const updated = { mvp_count: current.mvp_count + 1, updated_at: new Date().toISOString() }
  await supabase.from('player_stats').update(updated).eq('player_id', mvpPlayerId).eq('season', currentYear)

  const merged = { ...current, ...updated }
  const attrs = calculateOverall(merged as any, profile.primary_position)
  await supabase.from('profiles').update(attrs).eq('id', mvpPlayerId)

  await checkAndAwardAchievements(mvpPlayerId, merged as any)
}
