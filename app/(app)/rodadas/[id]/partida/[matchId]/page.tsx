import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MatchClient from './MatchClient'
import type { Profile } from '@/types'

export default async function MatchPage({ params }: { params: Promise<{ id: string; matchId: string }> }) {
  const { id: roundId, matchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: match }, { data: profile }, { data: goals }] = await Promise.all([
    supabase
      .from('matches')
      .select('*, teams(id, color, team_players(player:profiles(*)))')
      .eq('id', matchId)
      .single(),
    supabase.from('profiles').select('role, id').eq('id', user!.id).single(),
    supabase
      .from('goals')
      .select('*, scorer:profiles!goals_scorer_id_fkey(*), assist_player:profiles!goals_assist_player_id_fkey(*)')
      .eq('match_id', matchId)
      .order('scored_at_second'),
  ])

  if (!match) notFound()

  const blueTeam = match.teams?.find((t: any) => t.color === 'blue')
  const blackTeam = match.teams?.find((t: any) => t.color === 'black')
  const bluePlayers: Profile[] = blueTeam?.team_players?.map((tp: any) => tp.player) ?? []
  const blackPlayers: Profile[] = blackTeam?.team_players?.map((tp: any) => tp.player) ?? []

  return (
    <MatchClient
      match={match}
      roundId={roundId}
      blueTeamId={blueTeam?.id ?? ''}
      blackTeamId={blackTeam?.id ?? ''}
      bluePlayers={bluePlayers}
      blackPlayers={blackPlayers}
      initialGoals={goals ?? []}
      isAdmin={(profile as any)?.role === 'admin'}
      userId={user!.id}
    />
  )
}
