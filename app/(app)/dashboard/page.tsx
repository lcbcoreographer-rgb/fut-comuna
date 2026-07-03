import { createClient } from '@/lib/supabase/server'
import NextRoundCard from '@/components/dashboard/NextRoundCard'
import RankingPreview from '@/components/dashboard/RankingPreview'
import RecentMatches from '@/components/dashboard/RecentMatches'
import TopScorers from '@/components/dashboard/TopScorers'
import type { Profile, Round, PlayerStats, Match } from '@/types'
import { CURRENT_SEASON } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: nextRound },
    { data: recentMatches },
    { data: topStats },
    { data: myStats },
    { data: myProfile },
  ] = await Promise.all([
    supabase
      .from('rounds')
      .select('*, mvp_player:profiles!rounds_mvp_player_id_fkey(*), presence(status, player_id)')
      .in('status', ['pending', 'active'])
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('matches')
      .select('*, round:rounds(number, date)')
      .eq('status', 'finished')
      .order('ended_at', { ascending: false })
      .limit(5),
    supabase
      .from('player_stats')
      .select('*, player:profiles(*)')
      .eq('season', CURRENT_SEASON)
      .order('goals', { ascending: false })
      .limit(5),
    supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', user!.id)
      .eq('season', CURRENT_SEASON)
      .maybeSingle(),
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Olá, {myProfile?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Temporada {CURRENT_SEASON}</p>
        </div>
        <div className="glass rounded-xl px-4 py-2 text-center">
          <div className="text-2xl font-bold neon-text">{myProfile?.overall ?? 60}</div>
          <div className="text-xs text-muted-foreground">Overall</div>
        </div>
      </div>

      {/* Quick stats */}
      {myStats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Jogos', value: myStats.games_played },
            { label: 'Gols', value: myStats.goals },
            { label: 'Assist.', value: myStats.assists },
            { label: 'MVP', value: myStats.mvp_count },
          ].map((stat) => (
            <div key={stat.label} className="stat-card p-3 text-center">
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <NextRoundCard round={nextRound as any} userId={user!.id} />
          <RecentMatches matches={recentMatches as any} />
        </div>
        <div className="space-y-6">
          <TopScorers stats={topStats as any} />
          <RankingPreview stats={topStats as any} />
        </div>
      </div>
    </div>
  )
}
