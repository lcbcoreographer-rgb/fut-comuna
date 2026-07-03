'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import Scoreboard from '@/components/match/Scoreboard'
import MatchTimer from '@/components/match/MatchTimer'
import GoalModal from '@/components/match/GoalModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import type { Profile, Goal, TeamColor, Match } from '@/types'

interface Props {
  match: Match & { teams: any[] }
  roundId: string
  blueTeamId: string
  blackTeamId: string
  bluePlayers: Profile[]
  blackPlayers: Profile[]
  initialGoals: Goal[]
  isAdmin: boolean
  userId: string
}

export default function MatchClient({
  match: initialMatch, roundId, blueTeamId, blackTeamId,
  bluePlayers, blackPlayers, initialGoals, isAdmin, userId,
}: Props) {
  const router = useRouter()
  const [match, setMatch] = useState(initialMatch)
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [goalModal, setGoalModal] = useState<{ open: boolean; team: TeamColor }>({ open: false, team: 'blue' })
  const supabase = createClient()

  // Realtime subscription
  useEffect(() => {
    const matchSub = supabase
      .channel(`match-${match.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${match.id}` },
        (payload) => setMatch((prev) => ({ ...prev, ...(payload.new as any) }))
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'goals', filter: `match_id=eq.${match.id}` },
        (payload) => {
          setGoals((prev) => [...prev, payload.new as Goal])
          toast.success('⚽ GOL!', { duration: 3000 })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(matchSub) }
  }, [match.id])

  async function startMatch() {
    const { error } = await supabase.from('matches').update({
      status: 'active',
      started_at: new Date().toISOString(),
    }).eq('id', match.id)
    if (error) toast.error('Erro ao iniciar partida')
    else toast.success('Partida iniciada!')
  }

  async function endMatch(reason: 'time' | 'goals' | 'manual') {
    const { error } = await supabase.from('matches').update({
      status: 'finished',
      ended_at: new Date().toISOString(),
      end_reason: reason,
    }).eq('id', match.id)

    if (!error) {
      // Recalculate stats for all players
      const allPlayers = [...bluePlayers, ...blackPlayers]
      await fetch('/api/stats/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerIds: allPlayers.map((p) => p.id) }),
      })
      toast.success('Partida encerrada!')
    }
  }

  async function registerGoal(scorerId: string, assistId: string | null) {
    const teamId = goalModal.team === 'blue' ? blueTeamId : blackTeamId
    const elapsedSeconds = match.started_at
      ? Math.floor((Date.now() - new Date(match.started_at).getTime()) / 1000)
      : 0

    const { error } = await supabase.from('goals').insert({
      match_id: match.id,
      team_id: teamId,
      scorer_id: scorerId,
      assist_player_id: assistId,
      scored_at_second: elapsedSeconds,
    })

    if (error) { toast.error('Erro ao registrar gol'); return }

    // Update score
    const isBlue = goalModal.team === 'blue'
    const newBlueScore = isBlue ? match.team_blue_score + 1 : match.team_blue_score
    const newBlackScore = !isBlue ? match.team_black_score + 1 : match.team_black_score

    await supabase.from('matches').update({
      team_blue_score: newBlueScore,
      team_black_score: newBlackScore,
    }).eq('id', match.id)

    // Auto-end if 2 goals reached
    if (newBlueScore >= 2 || newBlackScore >= 2) {
      await endMatch('goals')
    }
  }

  const allGoals = goals

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/rodadas/${roundId}`} className="text-muted-foreground hover:text-foreground text-sm">
            ← Rodada
          </Link>
          <h1 className="text-xl font-bold mt-1">Partida {match.match_number}</h1>
        </div>
        <Badge className={
          match.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
          match.status === 'finished' ? 'bg-white/5 text-muted-foreground' :
          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
        }>
          {match.status === 'active' ? '🔴 Ao vivo' : match.status === 'finished' ? 'Finalizada' : 'Aguardando'}
        </Badge>
      </div>

      <MatchTimer
        matchId={match.id}
        status={match.status}
        startedAt={match.started_at}
        onStart={startMatch}
        onEnd={endMatch}
        isAdmin={isAdmin}
      />

      <Scoreboard
        bluePlayers={bluePlayers}
        blackPlayers={blackPlayers}
        blueScore={match.team_blue_score}
        blackScore={match.team_black_score}
        goals={allGoals}
        matchStatus={match.status}
        isAdmin={isAdmin}
        onGoalBlue={() => setGoalModal({ open: true, team: 'blue' })}
        onGoalBlack={() => setGoalModal({ open: true, team: 'black' })}
      />

      {match.status === 'finished' && isAdmin && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button
            onClick={() => router.push(`/rodadas/${roundId}`)}
            className="w-full bg-[#00b33c] text-[#0a0a0f] hover:bg-[#009930] gap-2"
          >
            Próxima Partida <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      <GoalModal
        open={goalModal.open}
        onClose={() => setGoalModal({ open: false, team: 'blue' })}
        onConfirm={registerGoal}
        players={goalModal.team === 'blue' ? bluePlayers : blackPlayers}
        teamColor={goalModal.team}
      />
    </div>
  )
}
