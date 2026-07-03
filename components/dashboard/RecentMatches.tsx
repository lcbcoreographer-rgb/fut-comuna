import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import type { Match } from '@/types'

interface Props {
  matches: (Match & { round: { number: number; date: string } })[] | null
}

export default function RecentMatches({ matches }: Props) {
  if (!matches || matches.length === 0) return null

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Últimas Partidas</h3>
      </div>
      <div className="space-y-3">
        {matches.map((match) => (
          <Link key={match.id} href={`/rodadas/${match.round_id}/partida/${match.id}`}>
            <div className="flex items-center gap-4 hover:bg-white/5 p-3 rounded-xl transition-colors">
              <div className="text-xs text-muted-foreground w-16">
                Rodada {match.round?.number}
              </div>

              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-sm font-medium">Azul</span>
                </div>

                <div className="flex items-center gap-2 glass rounded-lg px-3 py-1">
                  <span className={`text-lg font-bold ${match.team_blue_score > match.team_black_score ? 'neon-text' : 'text-muted-foreground'}`}>
                    {match.team_blue_score}
                  </span>
                  <span className="text-muted-foreground text-sm">×</span>
                  <span className={`text-lg font-bold ${match.team_black_score > match.team_blue_score ? 'neon-text' : 'text-muted-foreground'}`}>
                    {match.team_black_score}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Preto</span>
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                </div>
              </div>

              <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground">
                {match.end_reason === 'time' ? '⏱️' : match.end_reason === 'goals' ? '⚽' : '🔚'}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
