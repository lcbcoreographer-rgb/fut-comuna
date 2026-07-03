'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Presence } from '@/types'

export function usePresence(roundId: string, initialPresence: Presence[]) {
  const [presence, setPresence] = useState(initialPresence)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`presence-${roundId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'presence',
        filter: `round_id=eq.${roundId}`,
      }, async () => {
        const { data } = await supabase
          .from('presence')
          .select('*, player:profiles(*)')
          .eq('round_id', roundId)
        if (data) setPresence(data as Presence[])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roundId])

  return presence
}
