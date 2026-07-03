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
    .select('team_id, match_id, teams(color, match_id), matches(status, team_blue_score, team_black_score, started_at, ended_at)')
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

  for (const tp of matchesPlayed) {
    const match = tp.matches as any
    const team = tp.teams as any
    if (!match || !team) continue

    const isBlue = team.color === 'blue'
    const myScore = isBlue ? match.team_blue_score : match.team_black_score
    const oppScore = isBlue ? match.team_black_score : match.team_blue_score
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
