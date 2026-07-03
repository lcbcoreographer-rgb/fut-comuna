import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Users, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Profile } from '@/types'

export default async function RoundsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: rounds }, { data: profile }] = await Promise.all([
    supabase
      .from('rounds')
      .select('*, presence(status), matches(id, status)')
      .order('date', { ascending: false }),
    supabase.from('profiles').select('role').eq('id', user!.id).single(),
  ])

  const statusLabel: Record<string, { label: string; color: string }> = {
    pending: { label: 'Agendada', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    active: { label: 'Ao vivo', color: 'bg-green-500/10 text-green-400 border-green-500/20 pulse-neon' },
    finished: { label: 'Finalizada', color: 'bg-white/5 text-muted-foreground border-white/10' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rodadas</h1>
          <p className="text-muted-foreground text-sm mt-1">{rounds?.length ?? 0} rodadas registradas</p>
        </div>
        {(profile as any)?.role === 'admin' && (
          <Link href="/admin/rodadas/nova">
            <Button className="bg-[#00b33c] text-[#0a0a0f] hover:bg-[#009930] gap-2">
              <Plus className="h-4 w-4" /> Nova Rodada
            </Button>
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {rounds?.map((round) => {
          const confirmed = round.presence?.filter((p: any) => p.status === 'confirmed').length ?? 0
          const st = statusLabel[round.status] ?? statusLabel.pending
          return (
            <Link key={round.id} href={`/rodadas/${round.id}`}>
              <div className="stat-card p-5 flex items-center justify-between hover:border-[#00b33c]/20 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="text-center glass rounded-xl p-2 min-w-[48px]">
                    <div className="text-xl font-bold neon-text">{round.number}</div>
                    <div className="text-[10px] text-muted-foreground">ROD.</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">
                        {format(new Date(round.date), "dd 'de' MMMM", { locale: ptBR })}
                      </h3>
                      <Badge className={`text-xs ${st.color}`}>{st.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {round.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{round.location}</span>}
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{confirmed} confirmados</span>
                      <span>{round.matches?.length ?? 0} partidas</span>
                    </div>
                  </div>
                </div>
                <div className="text-muted-foreground text-sm">→</div>
              </div>
            </Link>
          )
        })}

        {(!rounds || rounds.length === 0) && (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhuma rodada ainda</p>
          </div>
        )}
      </div>
    </div>
  )
}
