'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Match, Goal } from '@/types'

export function useRealtimeMatch(matchId: string, initialMatch: Match, initialGoals: Goal[]) {
  const [match, setMatch] = useState(initialMatch)
  const [goals, setGoals] = useState(initialGoals)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`match-rt-${matchId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`,
      }, (payload) => {
        setMatch((prev) => ({ ...prev, ...(payload.new as Partial<Match>) }))
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'goals',
        filter: `match_id=eq.${matchId}`,
      }, (payload) => {
        setGoals((prev) => [...prev, payload.new as Goal])
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'goals',
        filter: `match_id=eq.${matchId}`,
      }, (payload) => {
        setGoals((prev) => prev.filter((g) => g.id !== (payload.old as Goal).id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchId])

  return { match, goals }
}
