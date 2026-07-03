import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CURRENT_SEASON } from '@/types'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalPlayers },
    { count: totalRounds },
    { count: totalMatches },
    { data: activeRound },
    { data: topStats },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('rounds').select('id', { count: 'exact', head: true }),
    supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'finished'),
    supabase.from('rounds').select('*, presence(status)').eq('status', 'active').maybeSingle(),
    supabase.from('player_stats').select('goals, assists, player:profiles(full_name)').eq('season', CURRENT_SEASON).order('goals', { ascending: false }).limit(3),
  ])

  const stats = [
    { label: 'Jogadores', value: totalPlayers ?? 0, icon: '👥', href: '/admin/jogadores' },
    { label: 'Rodadas', value: totalRounds ?? 0, icon: '📅', href: '/admin/rodadas' },
    { label: 'Partidas', value: totalMatches ?? 0, icon: '⚽', href: '/historico' },
    { label: 'Temporada', value: CURRENT_SEASON, icon: '🏆', href: '/ranking' },
  ]

  const quickLinks = [
    { href: '/admin/rodadas/nova', label: '+ Nova Rodada', color: 'bg-[#00b33c]/10 border-[#00b33c]/20 text-[#00b33c]' },
    { href: '/admin/jogadores', label: '👥 Jogadores', color: 'glass border-white/10' },
    { href: '/ranking', label: '🏆 Ranking', color: 'glass border-white/10' },
    { href: '/historico', label: '📊 Histórico', color: 'glass border-white/10' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Admin</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <div className="stat-card p-4 text-center hover:border-amber-500/20">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold gold-text">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {activeRound && (
        <div className="glass rounded-2xl p-5 border border-green-500/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-green-400">Rodada ativa agora</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Rodada {activeRound.number}</p>
              <p className="text-sm text-muted-foreground">
                {activeRound.presence?.filter((p: any) => p.status === 'confirmed').length ?? 0} confirmados
              </p>
            </div>
            <Link href={`/rodadas/${activeRound.id}`}>
              <span className="text-sm text-[#00b33c] hover:underline">Gerenciar →</span>
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <div className={`rounded-xl p-4 text-center text-sm font-medium border transition-all hover:scale-105 ${link.color}`}>
              {link.label}
            </div>
          </Link>
        ))}
      </div>

      {topStats && topStats.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold mb-3 text-sm">Top Artilheiros da Temporada</h3>
          <div className="space-y-2">
            {topStats.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{i + 1}. {(s.player as any)?.full_name}</span>
                <span className="font-bold">{s.goals} ⚽ / {s.assists} 🎯</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
