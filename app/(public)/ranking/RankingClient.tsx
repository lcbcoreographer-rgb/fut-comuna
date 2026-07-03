'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { POSITIONS, type PlayerStats, CURRENT_SEASON } from '@/types'

type StatsWithPlayer = PlayerStats & { player: any }

const CATEGORIES = [
  { key: 'goals', label: '⚽ Gols', getValue: (s: StatsWithPlayer) => s.goals },
  { key: 'assists', label: '🎯 Assist.', getValue: (s: StatsWithPlayer) => s.assists },
  { key: 'participations', label: '🔥 Partic.', getValue: (s: StatsWithPlayer) => s.goal_participations },
  { key: 'games', label: '📊 Jogos', getValue: (s: StatsWithPlayer) => s.games_played },
] as const

interface Props {
  initialStats: StatsWithPlayer[]
}

export default function RankingClient({ initialStats }: Props) {
  const [stats, setStats] = useState(initialStats)
  const supabase = createClient()

  useEffect(() => {
    const sub = supabase
      .channel('ranking-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_stats' }, async () => {
        const { data } = await supabase
          .from('player_stats')
          .select('*, player:profiles(*)')
          .eq('season', CURRENT_SEASON)
          .gt('games_played', 0)
        if (data) setStats(data)
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [])

  return (
    <Tabs defaultValue="goals">
      <TabsList className="glass border-white/8 p-1 h-auto flex flex-wrap gap-1 mb-4">
        {CATEGORIES.map((cat) => (
          <TabsTrigger key={cat.key} value={cat.key} className="text-xs data-[state=active]:bg-[#00b33c]/20 data-[state=active]:text-[#00b33c]">
            {cat.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {CATEGORIES.map((cat) => {
        const sorted = [...stats].sort((a, b) => (cat.getValue(b) as number) - (cat.getValue(a) as number))
        return (
          <TabsContent key={cat.key} value={cat.key} className="space-y-2">
            {sorted.map((s, i) => {
              const value = cat.getValue(s)
              return (
                <motion.div
                  key={s.player_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link href={`/perfil/${s.player_id}`}>
                    <div className="stat-card p-4 flex items-center gap-4">
                      <div className={`w-8 text-center font-bold text-sm ${
                        i === 0 ? 'gold-text' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'
                      }`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}°`}
                      </div>
                      <Avatar className="h-10 w-10 avatar-premium">
                        <AvatarImage src={s.player?.avatar_url} />
                        <AvatarFallback className="bg-[#16a34a]/15 text-[#22c55e] font-semibold">
                          {s.player?.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{s.player?.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {POSITIONS[s.player?.primary_position as keyof typeof POSITIONS]} • <span className="text-[#facc15]/80">OVR {s.player?.overall}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold neon-text">{String(value)}</div>
                        <div className="text-xs text-muted-foreground">{s.games_played} jogos</div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
