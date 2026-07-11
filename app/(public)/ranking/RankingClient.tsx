'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { POSITIONS, type PlayerStats, CURRENT_SEASON } from '@/types'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'

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
  const [howOpen, setHowOpen] = useState(false)
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
    <>
      <div className="glass rounded-2xl mb-4 overflow-hidden border border-white/8">
        <button
          onClick={() => setHowOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-2">
            <Info className="h-4 w-4" /> Como o Overall (OVR) é calculado
          </span>
          {howOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <AnimatePresence>
          {howOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 text-sm text-muted-foreground space-y-3">
                <p>
                  O overall combina dois fatores: <strong className="text-foreground">quantos jogos</strong> o jogador tem, e a{' '}
                  <strong className="text-foreground">média real</strong> de desempenho nesses jogos.
                </p>
                <div>
                  <p className="text-foreground font-medium mb-1">1. Jogos disputados (regularidade)</p>
                  <p>
                    Com menos de 10 jogos, o overall fica preso perto de um valor baixo, mesmo que a média esteja ótima —
                    é preciso confirmar a média em jogos de verdade, não só ter sorte em 1 ou 2 partidas. A partir de 10
                    jogos, a nota passa a valer 100% do que a média indica.
                  </p>
                </div>
                <div>
                  <p className="text-foreground font-medium mb-1">2. Média por jogo (o que define a nota)</p>
                  <p>
                    <strong className="text-foreground">Goleiro e zagueiro</strong> → média de gols sofridos por jogo (quanto menos, melhor):
                    menos de 1/jogo → até 95 · menos de 1,5 → até 90 · menos de 2 → até 85 · acima disso, cai gradualmente.
                  </p>
                  <p className="mt-1">
                    <strong className="text-foreground">Lateral, volante, meia, meia ofensivo e atacante</strong> → média de gols feitos por jogo:
                    mais de 5/jogo → 95 · mais de 4 → 90 · mais de 3 → 85 · abaixo de 3, escala proporcionalmente entre 40 e 85.
                  </p>
                </div>
                <p>
                  Os dois fatores se multiplicam: um jogador com média excelente mas poucos jogos ainda fica com overall
                  baixo, e só sobe conforme confirma aquela média com mais partidas.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
    </>
  )
}
