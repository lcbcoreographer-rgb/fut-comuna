'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { balanceTeams } from '@/lib/algorithms/teamBalance'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Shuffle, Play, Trophy } from 'lucide-react'
import { POSITION_ABBR, type Profile } from '@/types'

interface Props {
  roundId: string
  roundNumber: number
  players: Profile[]
  existingMatchCount: number
}

export default function DrawClient({ roundId, roundNumber, players, existingMatchCount }: Props) {
  const router = useRouter()
  const [blue, setBlue] = useState<Profile[]>([])
  const [black, setBlack] = useState<Profile[]>([])
  const [drawn, setDrawn] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  function draw() {
    const result = balanceTeams(players, 6)
    setBlue(result.blue)
    setBlack(result.black)
    setDrawn(true)
    toast.success(`Times equilibrados! Diff: ${result.overallDiff.toFixed(1)} OVR`)
  }

  async function createMatch() {
    if (!drawn || blue.length === 0 || black.length === 0) return
    setSaving(true)

    const matchNumber = existingMatchCount + 1
    const { data: match, error } = await supabase.from('matches').insert({
      round_id: roundId,
      match_number: matchNumber,
    }).select().single()

    if (error || !match) { toast.error('Erro ao criar partida'); setSaving(false); return }

    const { data: blueTeam } = await supabase.from('teams').insert({ match_id: match.id, color: 'blue' }).select().single()
    const { data: blackTeam } = await supabase.from('teams').insert({ match_id: match.id, color: 'black' }).select().single()

    if (!blueTeam || !blackTeam) { toast.error('Erro ao criar times'); setSaving(false); return }

    await supabase.from('team_players').insert([
      ...blue.map((p) => ({ team_id: blueTeam.id, player_id: p.id, match_id: match.id })),
      ...black.map((p) => ({ team_id: blackTeam.id, player_id: p.id, match_id: match.id })),
    ])

    // Update round status to active if needed
    await supabase.from('rounds').update({ status: 'active' }).eq('id', roundId)

    toast.success(`Partida ${matchNumber} criada!`)
    router.push(`/rodadas/${roundId}/partida/${match.id}`)
  }

  function TeamCard({ players: teamPlayers, color }: { players: Profile[]; color: 'blue' | 'black' }) {
    const avg = teamPlayers.length > 0
      ? Math.round(teamPlayers.reduce((s, p) => s + p.overall, 0) / teamPlayers.length)
      : 0
    const isBlue = color === 'blue'
    return (
      <div className={`glass rounded-2xl p-4 border ${isBlue ? 'border-blue-500/20' : 'border-gray-500/20'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isBlue ? 'bg-blue-400' : 'bg-gray-400'}`} />
            <span className="font-semibold">Time {isBlue ? 'Azul' : 'Preto'}</span>
          </div>
          <Badge className={`text-xs ${isBlue ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' : 'bg-gray-500/10 text-gray-300 border-gray-500/20'}`}>
            OVR {avg}
          </Badge>
        </div>
        <div className="space-y-2">
          <AnimatePresence>
            {teamPlayers.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: isBlue ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2"
              >
                <Avatar className="h-7 w-7 border border-white/10">
                  <AvatarImage src={player.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[9px] bg-white/5">{player.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="text-sm truncate">{player.full_name.split(' ')[0]}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {POSITION_ABBR[player.primary_position as keyof typeof POSITION_ABBR]}
                </span>
                <span className="text-xs font-bold neon-text">{player.overall}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-4">
        <p className="text-sm text-muted-foreground mb-3">Jogadores disponíveis: {players.length}</p>
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-1.5 glass px-2 py-1 rounded-lg text-xs">
              <Avatar className="h-5 w-5">
                <AvatarImage src={p.avatar_url ?? undefined} />
                <AvatarFallback className="text-[8px]">{p.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
              {p.full_name.split(' ')[0]}
              <span className="text-muted-foreground">({p.overall})</span>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={draw} className="w-full bg-[#00b33c] text-[#0a0a0f] hover:bg-[#009930] gap-2 font-bold" size="lg">
        <Shuffle className="h-5 w-5" />
        {drawn ? 'Refazer Sorteio' : 'Sortear Times'}
      </Button>

      {drawn && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TeamCard players={blue} color="blue" />
            <TeamCard players={black} color="black" />
          </div>

          <Button
            onClick={createMatch}
            disabled={saving}
            className="w-full bg-green-500 hover:bg-green-600 text-white gap-2 font-bold"
            size="lg"
          >
            <Play className="h-5 w-5" />
            Criar Partida e Iniciar
          </Button>
        </motion.div>
      )}
    </div>
  )
}
