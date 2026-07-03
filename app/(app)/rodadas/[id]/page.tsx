import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RoundManagerClient from './RoundManagerClient'

export default async function RoundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const [
    { data: round },
    { data: profile },
    { data: allPlayers },
    { data: matches },
    { data: presence },
  ] = await Promise.all([
    supabase.from('rounds').select('*').eq('id', id).single(),
    supabase.from('profiles').select('role, id').eq('id', user.id).single(),
    supabase.from('profiles').select('*').in('role', ['player', 'admin']).order('overall', { ascending: false }),
    supabase
      .from('matches')
      .select('*, teams(id, color, team_players(id, player_id, player:profiles(*)))')
      .eq('round_id', id)
      .order('match_number'),
    supabase.from('presence').select('*, player:profiles(*)').eq('round_id', id),
  ])

  if (!round) notFound()

  const matchIds = matches?.map((m: any) => m.id) ?? []
  const { data: goals } = matchIds.length > 0
    ? await supabase.from('goals').select('*').in('match_id', matchIds)
    : { data: [] }

  return (
    <RoundManagerClient
      round={round as any}
      allPlayers={(allPlayers ?? []) as any}
      initialPresence={(presence ?? []) as any}
      initialMatches={(matches ?? []) as any}
      initialGoals={(goals ?? []) as any}
      isAdmin={(profile as any)?.role === 'admin'}
      userId={user.id}
    />
  )
}
