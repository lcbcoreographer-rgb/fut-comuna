import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BarChart2 } from 'lucide-react'
import type { PlayerStats } from '@/types'

interface Props {
  stats: (PlayerStats & { player: any })[] | null
}

export default function RankingPreview({ stats }: Props) {
  if (!stats || stats.length === 0) return null

  const sorted = [...stats].sort((a, b) => {
    const winRateA = a.games_played > 0 ? a.wins / a.games_played : 0
    const winRateB = b.games_played > 0 ? b.wins / b.games_played : 0
    return winRateB - winRateA
  })

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-[#00b33c]" />
          <h3 className="font-semibold text-sm">Aproveitamento</h3>
        </div>
        <Link href="/ranking" className="text-xs text-[#00b33c] hover:underline">Ver ranking</Link>
      </div>
      <div className="space-y-3">
        {sorted.slice(0, 5).map((s, i) => {
          const winRate = s.games_played > 0 ? Math.round((s.wins / s.games_played) * 100) : 0
          return (
            <Link key={s.player_id} href={`/perfil/${s.player_id}`}>
              <div className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-colors">
                <span className="text-xs text-muted-foreground w-5 text-center">{i + 1}</span>
                <Avatar className="h-7 w-7">
                  <AvatarImage src={s.player?.avatar_url} />
                  <AvatarFallback className="bg-[#00b33c]/10 text-[#00b33c] text-xs">
                    {s.player?.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.player?.full_name?.split(' ')[0]}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex-1 bg-white/10 rounded-full h-1">
                      <div
                        className="h-1 rounded-full bg-gradient-to-r from-[#00b33c] to-[#00ff94]"
                        style={{ width: `${winRate}%` }}
                      />
                    </div>
                  </div>
                </div>
                <span className="text-sm font-bold">{winRate}%</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
