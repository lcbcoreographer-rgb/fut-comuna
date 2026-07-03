'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Users, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { Round } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  round: (Round & { presence: { status: string; player_id: string }[] }) | null
  userId: string
}

export default function NextRoundCard({ round, userId }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()

  if (!round) {
    return (
      <div className="stat-card p-6 text-center">
        <div className="text-4xl mb-3">📅</div>
        <p className="text-muted-foreground">Nenhuma rodada agendada</p>
      </div>
    )
  }

  const myPresence = round.presence?.find((p) => p.player_id === userId)
  const confirmed = round.presence?.filter((p) => p.status === 'confirmed').length ?? 0

  async function respond(status: 'confirmed' | 'absent' | 'maybe') {
    setLoading(status)
    const { error } = await supabase.from('presence').upsert({
      round_id: round!.id,
      player_id: userId,
      status,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'round_id,player_id' })

    if (error) toast.error('Erro ao confirmar presença')
    else toast.success(status === 'confirmed' ? '✅ Presença confirmada!' : status === 'absent' ? '❌ Ausência registrada' : '🤔 Marcado como talvez')
    setLoading(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 neon-border"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">PRÓXIMA RODADA</span>
            <Badge className="bg-[#00b33c]/10 text-[#00b33c] border-[#00b33c]/20 text-xs">
              Rodada {round.number}
            </Badge>
          </div>
          <h2 className="text-xl font-bold mt-1">
            {format(new Date(round.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h2>
        </div>
        <Link href={`/rodadas/${round.id}`}>
          <Button variant="outline" size="sm" className="border-white/10 hover:border-[#00b33c]/30">
            Ver detalhes
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-5">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {format(new Date(round.date), 'dd/MM/yyyy')}
        </span>
        {round.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {round.location}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {confirmed} confirmados
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Sua presença</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => respond('confirmed')}
            disabled={loading !== null}
            className={`flex-1 gap-1.5 ${myPresence?.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'border-white/10'}`}
            variant="outline"
          >
            <CheckCircle2 className="h-4 w-4" />
            Vou!
          </Button>
          <Button
            size="sm"
            onClick={() => respond('maybe')}
            disabled={loading !== null}
            className={`flex-1 gap-1.5 ${myPresence?.status === 'maybe' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'border-white/10'}`}
            variant="outline"
          >
            <HelpCircle className="h-4 w-4" />
            Talvez
          </Button>
          <Button
            size="sm"
            onClick={() => respond('absent')}
            disabled={loading !== null}
            className={`flex-1 gap-1.5 ${myPresence?.status === 'absent' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'border-white/10'}`}
            variant="outline"
          >
            <XCircle className="h-4 w-4" />
            Não vou
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
