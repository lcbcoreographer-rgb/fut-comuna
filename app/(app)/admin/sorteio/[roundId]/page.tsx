import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DrawClient from './DrawClient'
import type { Profile } from '@/types'

export default async function DrawPage({ params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = await params
  const supabase = await createClient()

  const { data: round } = await supabase
    .from('rounds')
    .select('*, presence(status, player:profiles(*))')
    .eq('id', roundId)
    .single()

  if (!round) notFound()

  const confirmedPlayers: Profile[] = (round.presence ?? [])
    .filter((p: any) => p.status === 'confirmed')
    .map((p: any) => p.player)
    .filter(Boolean)

  const { data: matchCount } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('round_id', roundId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sorteio — Rodada {round.number}</h1>
        <p className="text-muted-foreground text-sm mt-1">{confirmedPlayers.length} jogadores confirmados</p>
      </div>
      <DrawClient
        roundId={roundId}
        roundNumber={round.number}
        players={confirmedPlayers}
        existingMatchCount={matchCount as unknown as number ?? 0}
      />
    </div>
  )
}
