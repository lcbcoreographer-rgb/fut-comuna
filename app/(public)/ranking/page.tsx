import { createClient } from '@/lib/supabase/server'
import RankingClient from './RankingClient'
import { CURRENT_SEASON } from '@/types'

export default async function RankingPage() {
  const supabase = await createClient()

  const { data: stats } = await supabase
    .from('player_stats')
    .select('*, player:profiles(*)')
    .eq('season', CURRENT_SEASON)
    .gt('games_played', 0)
    .order('goals', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ranking</h1>
        <p className="text-muted-foreground text-sm mt-1">Temporada {CURRENT_SEASON}</p>
      </div>
      <RankingClient initialStats={stats ?? []} />
    </div>
  )
}
