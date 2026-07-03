'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { POSITIONS } from '@/types'
import type { PresenceStatus } from '@/types'

interface PresenceRow {
  id: string
  player_id: string
  status: PresenceStatus
  player: {
    id: string
    full_name: string
    avatar_url: string | null
    primary_position: string
    overall: number
  }
}

interface Props {
  presence: PresenceRow[]
  userId: string
  roundId: string
  roundStatus: string
}

const STATUS_GROUPS = [
  { key: 'confirmed', label: 'Confirmados', icon: '✅', color: 'text-green-400' },
  { key: 'maybe', label: 'Talvez', icon: '🤔', color: 'text-yellow-400' },
  { key: 'absent', label: 'Ausentes', icon: '❌', color: 'text-red-400' },
] as const

export default function PresenceList({ presence, userId, roundId, roundStatus }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()
  const myPresence = presence?.find((p) => p.player_id === userId)

  async function respond(status: PresenceStatus) {
    setLoading(status)
    await supabase.from('presence').upsert({
      round_id: roundId, player_id: userId, status, updated_at: new Date().toISOString(),
    }, { onConflict: 'round_id,player_id' })
    toast.success(status === 'confirmed' ? '✅ Presença confirmada!' : status === 'absent' ? '❌ Ausência registrada' : '🤔 Marcado como talvez')
    setLoading(null)
  }

  const grouped = STATUS_GROUPS.map((group) => ({
    ...group,
    players: presence?.filter((p) => p.status === group.key) ?? [],
  }))

  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="font-semibold mb-4">Lista de Presença</h2>

      {roundStatus === 'pending' && (
        <div className="flex gap-2 mb-5">
          {[
            { status: 'confirmed' as PresenceStatus, label: 'Vou!', icon: CheckCircle2, active: 'bg-green-500/20 text-green-400 border-green-500/30' },
            { status: 'maybe' as PresenceStatus, label: 'Talvez', icon: HelpCircle, active: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
            { status: 'absent' as PresenceStatus, label: 'Não vou', icon: XCircle, active: 'bg-red-500/20 text-red-400 border-red-500/30' },
          ].map(({ status, label, icon: Icon, active }) => (
            <Button key={status} size="sm" variant="outline" onClick={() => respond(status)} disabled={loading !== null}
              className={`flex-1 gap-1.5 ${myPresence?.status === status ? active : 'border-white/10'}`}>
              <Icon className="h-4 w-4" />{label}
            </Button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {grouped.map((group) => (
          group.players.length > 0 && (
            <div key={group.key}>
              <div className={`text-xs font-medium mb-2 flex items-center gap-1 ${group.color}`}>
                {group.icon} {group.label} ({group.players.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {group.players.map((p) => (
                  <div key={p.player_id} className="flex items-center gap-2 glass p-2 rounded-xl">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={p.player?.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-[#00b33c]/10 text-[#00b33c] text-xs">
                        {p.player?.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{p.player?.full_name?.split(' ')[0]}</p>
                      <p className="text-[10px] text-muted-foreground">{POSITIONS[p.player?.primary_position as keyof typeof POSITIONS] ?? p.player?.primary_position}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  )
}
