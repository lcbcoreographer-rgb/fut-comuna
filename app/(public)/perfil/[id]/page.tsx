import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import FifaCard from '@/components/player/FifaCard'
import AchievementBadge from '@/components/player/AchievementBadge'
import { POSITIONS, CURRENT_SEASON } from '@/types'
import type { Profile, PlayerStats, PlayerAchievement } from '@/types'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: profile }, { data: stats }, { data: playerAchievements }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('player_stats').select('*').eq('player_id', id).eq('season', CURRENT_SEASON).maybeSingle(),
    supabase
      .from('player_achievements')
      .select('*, achievement:achievements(*)')
      .eq('player_id', id)
      .order('earned_at', { ascending: false }),
  ])

  if (!profile) notFound()

  const winRate = stats && stats.games_played > 0
    ? Math.round((stats.wins / stats.games_played) * 100)
    : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-6 neon-border">
        <div className="flex items-start gap-5">
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-[#00b33c]/30">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-2xl bg-[#00b33c]/10 text-[#00b33c]">
                {profile.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {profile.shirt_number && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0a0a0f] border border-[#00b33c]/30 flex items-center justify-center">
                <span className="text-[10px] font-bold neon-text">{profile.shirt_number}</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.full_name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className="bg-[#00b33c]/10 text-[#00b33c] border-[#00b33c]/20">
                {POSITIONS[profile.primary_position as keyof typeof POSITIONS]}
              </Badge>
              {profile.secondary_position && (
                <Badge variant="outline" className="border-white/10 text-muted-foreground text-xs">
                  {POSITIONS[profile.secondary_position as keyof typeof POSITIONS]}
                </Badge>
              )}
              {profile.role === 'admin' && (
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">Admin</Badge>
              )}
            </div>
            {profile.city && <p className="text-sm text-muted-foreground mt-1">📍 {profile.city}</p>}
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold neon-text">{profile.overall}</div>
            <div className="text-xs text-muted-foreground">OVR</div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Jogos', value: stats.games_played, icon: '🏟️' },
            { label: 'Gols', value: stats.goals, icon: '⚽' },
            { label: 'Assists', value: stats.assists, icon: '🎯' },
            { label: 'MVP', value: stats.mvp_count, icon: '🌟' },
            { label: 'Vitórias', value: stats.wins, icon: '🏆' },
            { label: 'Aprov.', value: `${winRate}%`, icon: '📈' },
            { label: 'Seq. Vit.', value: stats.max_win_streak, icon: '⚡' },
            { label: 'Minutos', value: stats.minutes_played, icon: '⏱️' },
          ].map((item) => (
            <div key={item.label} className="stat-card p-3 text-center">
              <div className="text-lg mb-0.5">{item.icon}</div>
              <div className="text-lg font-bold">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Match record */}
      {stats && stats.games_played > 0 && (
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold mb-3 text-sm">Desempenho</h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-1">
              <div className="h-3 rounded-sm bg-green-500/70" style={{ width: `${winRate}%` }} />
              <div className="h-3 rounded-sm bg-gray-500/50" style={{ width: `${stats.games_played > 0 ? Math.round((stats.draws / stats.games_played) * 100) : 0}%` }} />
              <div className="h-3 rounded-sm bg-red-500/50" style={{ width: `${stats.games_played > 0 ? Math.round((stats.losses / stats.games_played) * 100) : 0}%` }} />
            </div>
          </div>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/70 inline-block" /> {stats.wins} vitórias</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-gray-500/50 inline-block" /> {stats.draws} empates</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/50 inline-block" /> {stats.losses} derrotas</span>
          </div>
        </div>
      )}

      {/* FIFA Card */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold">Carta FIFA</h3>
          <Link href={`/carta/${profile.id}`} className="text-xs text-[#00b33c] hover:underline">
            Ver completa →
          </Link>
        </div>
        <div className="flex justify-center">
          <FifaCard profile={profile as Profile} stats={stats as PlayerStats} showShare />
        </div>
      </div>

      {/* Achievements */}
      {playerAchievements && playerAchievements.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold mb-4">Conquistas ({playerAchievements.length})</h3>
          <div className="flex flex-wrap gap-2">
            {playerAchievements.map((pa: any) => (
              <AchievementBadge
                key={pa.id}
                achievement={pa.achievement}
                earnedAt={pa.earned_at}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
