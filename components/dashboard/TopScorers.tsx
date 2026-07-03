import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy } from 'lucide-react'
import type { PlayerStats } from '@/types'

interface Props {
  stats: (PlayerStats & { player: any })[] | null
}

export default function TopScorers({ stats }: Props) {
  if (!stats || stats.length === 0) return null

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-4 w-4 text-[#ffd700]" />
        <h3 className="font-semibold text-sm">Artilheiros</h3>
      </div>
      <div className="space-y-3">
        {stats.slice(0, 5).map((s, i) => (
          <Link key={s.player_id} href={`/perfil/${s.player_id}`}>
            <div className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-colors">
              <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'gold-text' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                {i + 1}
              </span>
              <Avatar className="h-7 w-7">
                <AvatarImage src={s.player?.avatar_url} />
                <AvatarFallback className="bg-[#00b33c]/10 text-[#00b33c] text-xs">
                  {s.player?.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.player?.full_name?.split(' ')[0]}</p>
              </div>
              <span className="text-lg font-bold neon-text">{s.goals}</span>
              <span className="text-xs text-muted-foreground">⚽</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
