import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Trophy, Users } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function HistoricoPage() {
  const supabase = await createClient()

  const { data: rounds } = await supabase
    .from('rounds')
    .select('*, mvp_player:profiles!rounds_mvp_player_id_fkey(full_name, avatar_url), top_scorer:profiles!rounds_top_scorer_id_fkey(full_name, avatar_url), matches(id, team_blue_score, team_black_score, status), presence(status)')
    .eq('status', 'finished')
    .order('date', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Histórico</h1>
        <p className="text-muted-foreground text-sm mt-1">{rounds?.length ?? 0} rodadas finalizadas</p>
      </div>

      <div className="space-y-4">
        {rounds?.map((round) => {
          const confirmed = round.presence?.filter((p: any) => p.status === 'confirmed').length ?? 0
          const finishedMatches = round.matches?.filter((m: any) => m.status === 'finished') ?? []
          const totalGoals = finishedMatches.reduce((sum: number, m: any) => sum + m.team_blue_score + m.team_black_score, 0)

          return (
            <Link key={round.id} href={`/rodadas/${round.id}`}>
              <div className="glass rounded-2xl p-5 hover:border-[#00b33c]/20 transition-colors cursor-pointer border border-white/8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl font-bold neon-text">Rodada {round.number}</span>
                      <Badge variant="outline" className="border-white/10 text-muted-foreground text-xs">Finalizada</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(round.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="glass rounded-xl p-3 text-center">
                    <div className="text-lg font-bold">{finishedMatches.length}</div>
                    <div className="text-xs text-muted-foreground">partidas</div>
                  </div>
                  <div className="glass rounded-xl p-3 text-center">
                    <div className="text-lg font-bold neon-text">{totalGoals}</div>
                    <div className="text-xs text-muted-foreground">gols</div>
                  </div>
                  <div className="glass rounded-xl p-3 text-center">
                    <div className="text-lg font-bold">{confirmed}</div>
                    <div className="text-xs text-muted-foreground">jogadores</div>
                  </div>
                </div>

                {(round.mvp_player || round.top_scorer) && (
                  <div className="flex gap-3">
                    {round.mvp_player && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>🌟 MVP:</span>
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={round.mvp_player.avatar_url} />
                          <AvatarFallback className="text-[8px]">{round.mvp_player.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{round.mvp_player.full_name.split(' ')[0]}</span>
                      </div>
                    )}
                    {round.top_scorer && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>⚽ Artilheiro:</span>
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={round.top_scorer.avatar_url} />
                          <AvatarFallback className="text-[8px]">{round.top_scorer.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{round.top_scorer.full_name.split(' ')[0]}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Link>
          )
        })}

        {(!rounds || rounds.length === 0) && (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhuma rodada finalizada ainda</p>
          </div>
        )}
      </div>
    </div>
  )
}
