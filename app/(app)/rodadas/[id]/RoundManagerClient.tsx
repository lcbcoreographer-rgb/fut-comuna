'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { balanceThreeTeams, TEAM_LABEL, TEAM_COLOR_CLASS, TEAM_DOT_CLASS } from '@/lib/algorithms/teamBalance'
import type { ThreeTeams, TeamColor } from '@/lib/algorithms/teamBalance'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import FifaCard from '@/components/player/FifaCard'
import { toast } from 'sonner'
import { Users, Shuffle, Play, Square, CheckCircle2, Calendar, MapPin, ChevronDown, ChevronUp, Plus, Pencil, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { POSITION_ABBR } from '@/types'
import type { Profile, Goal } from '@/types'

const MATCH_DURATION = 420

interface Props {
  round: any
  allPlayers: Profile[]
  initialPresence: any[]
  initialMatches: any[]
  initialGoals: Goal[]
  isAdmin: boolean
  userId: string
}

type Tab = 'jogadores' | 'sorteio' | 'partidas'

interface GoalModalState {
  open: boolean
  matchId: string
  team: TeamColor
  players: Profile[]
}

type Compositions = Record<TeamColor, string[]>

// ─── Timer ────────────────────────────────────────────────────
function InlineTimer({ startedAt, status }: { startedAt: string | null; status: string }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (status !== 'active' || !startedAt) return
    const base = new Date(startedAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - base) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [status, startedAt])

  const remaining = Math.max(0, MATCH_DURATION - elapsed)
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const urgent = remaining <= 60 && status === 'active'

  if (status === 'finished') return <span className="text-sm text-muted-foreground">Encerrada</span>
  if (status === 'pending') return <span className="text-sm text-yellow-400">Aguardando</span>
  return (
    <motion.span
      animate={urgent ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.6, repeat: urgent ? Infinity : 0 }}
      className={`font-mono text-2xl font-bold ${remaining === 0 ? 'text-red-400' : urgent ? 'text-orange-400' : 'neon-text'}`}
    >
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </motion.span>
  )
}

// ─── Modal de Gol ─────────────────────────────────────────────
function GoalModal({ state, onClose, onConfirm }: {
  state: GoalModalState
  onClose: () => void
  onConfirm: (scorerId: string, assistId: string | null) => Promise<void>
}) {
  const [step, setStep] = useState<'scorer' | 'assist'>('scorer')
  const [scorer, setScorer] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)

  function reset() { setStep('scorer'); setScorer(null); onClose() }

  async function handleAssist(assist: Profile | null) {
    if (!scorer) return
    setLoading(true)
    await onConfirm(scorer.id, assist?.id ?? null)
    setLoading(false)
    reset()
  }

  if (!state.open) return null

  const cc = TEAM_COLOR_CLASS[state.team]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={reset} />
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="relative w-full max-w-sm glass-strong border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 z-10 mx-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⚽</span>
          <span className="font-semibold">Gol do Time</span>
          <span className={`text-sm font-medium ${cc.split(' ')[0]}`}>{TEAM_LABEL[state.team]}</span>
        </div>
        {step === 'scorer' ? (
          <>
            <p className="text-sm text-muted-foreground mb-3">Quem fez o gol?</p>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {state.players.map((p) => (
                <button key={p.id} onClick={() => { setScorer(p); setStep('assist') }}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all hover:opacity-90 ${cc}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={p.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-white/5">{p.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate">{p.full_name?.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-1">Gol de <strong>{scorer?.full_name?.split(' ')[0]}</strong></p>
            <p className="text-sm text-muted-foreground mb-3">Quem assistiu?</p>
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
              <button onClick={() => handleAssist(null)} disabled={loading}
                className="col-span-2 p-3 rounded-xl border border-white/10 text-sm text-muted-foreground hover:border-white/20 transition-all">
                Sem assistência
              </button>
              {state.players.filter((p) => p.id !== scorer?.id).map((p) => (
                <button key={p.id} onClick={() => handleAssist(p)} disabled={loading}
                  className="flex items-center gap-2 p-3 rounded-xl border border-white/10 hover:border-[#16a34a]/30 transition-all">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={p.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-white/5">{p.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate">{p.full_name?.split(' ')[0]}</span>
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setStep('scorer')} className="w-full mt-3 border-white/10 text-sm">
              ← Voltar
            </Button>
          </>
        )}
      </motion.div>
    </div>
  )
}

// ─── Modal de Carta ───────────────────────────────────────────
function PlayerCardModal({ player, onClose }: { player: Profile | null; onClose: () => void }) {
  if (!player) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative glass rounded-2xl p-5"
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <FifaCard profile={player} showShare />
      </motion.div>
    </div>
  )
}

// ─── Time card no sorteio ─────────────────────────────────────
function TeamCard({ color, players, ovr, onPlayerClick }: { color: TeamColor; players: Profile[]; ovr: number; onPlayerClick: (p: Profile) => void }) {
  const cc = TEAM_COLOR_CLASS[color]
  const dot = TEAM_DOT_CLASS[color]
  return (
    <div className={`glass rounded-2xl p-3 border ${cc}`}>
      <div className="flex items-center gap-1.5 mb-3">
        <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
        <span className={`font-semibold text-xs ${cc.split(' ')[0]}`}>Time {TEAM_LABEL[color]}</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{Math.round(ovr)}</span>
      </div>
      <div className="space-y-1.5">
        {players.map((p) => (
          <button key={p.id} onClick={() => onPlayerClick(p)} className="flex items-center gap-1.5 w-full text-left hover:opacity-80 transition-opacity">
            <Avatar className="h-6 w-6">
              <AvatarImage src={p.avatar_url ?? undefined} />
              <AvatarFallback className={`text-[10px] ${cc.split(' ')[0]} bg-white/5`}>{p.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{p.full_name?.split(' ')[0]}</p>
              <p className="text-[10px] text-muted-foreground">
                {p.primary_position === 'goleiro' ? '🧤' : POSITION_ABBR[p.primary_position as keyof typeof POSITION_ABBR]}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Card de partida ──────────────────────────────────────────
function MatchCard({ match, isAdmin, allPlayers, onStart, onEnd, onGoal, goals, onPlayerClick }: {
  match: any
  isAdmin: boolean
  allPlayers: Profile[]
  onStart: (id: string) => Promise<void>
  onEnd: (id: string) => Promise<void>
  onGoal: (matchId: string, team: TeamColor) => void
  goals: Goal[]
  onPlayerClick: (p: Profile) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const teamsInMatch: TeamColor[] = match.teams?.map((t: any) => t.color as TeamColor) ?? []
  const colorA: TeamColor = teamsInMatch[0] ?? 'blue'
  const colorB: TeamColor = teamsInMatch[1] ?? 'black'

  function getPlayers(color: TeamColor): Profile[] {
    const team = match.teams?.find((t: any) => t.color === color)
    return team?.team_players?.map((tp: any) => tp.player).filter(Boolean) ?? []
  }

  function getScore(color: TeamColor): number {
    if (color === 'blue') return match.team_blue_score
    if (color === 'black') return match.team_black_score
    return match.team_red_score ?? 0
  }

  const playersA = getPlayers(colorA)
  const playersB = getPlayers(colorB)
  const matchGoals = goals.filter((g) => g.match_id === match.id)

  return (
    <div className={`glass rounded-2xl overflow-hidden border transition-colors ${
      match.status === 'active' ? 'border-[#16a34a]/30' :
      match.status === 'finished' ? 'border-white/5' : 'border-white/8'
    }`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground font-medium">Partida {match.match_number}</span>
          {match.status === 'active' && <span className="text-xs text-green-400">🔴 Ao vivo</span>}
          {match.status === 'finished' && <span className="text-xs text-muted-foreground">Encerrada</span>}
          {match.status === 'pending' && <span className="text-xs text-yellow-400">Aguardando</span>}
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Time A */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${TEAM_DOT_CLASS[colorA]}`} />
              <span className={`text-sm font-semibold ${TEAM_COLOR_CLASS[colorA].split(' ')[0]}`}>{TEAM_LABEL[colorA]}</span>
            </div>
            <motion.div key={getScore(colorA)} animate={{ scale: [1.2, 1] }} className={`text-4xl font-black ${TEAM_COLOR_CLASS[colorA].split(' ')[0]}`}>
              {getScore(colorA)}
            </motion.div>
            {isAdmin && match.status === 'active' && (
              <Button size="sm" onClick={() => onGoal(match.id, colorA)}
                className={`mt-2 text-xs h-7 px-3 border ${TEAM_COLOR_CLASS[colorA]}`}>
                ⚽ Gol
              </Button>
            )}
          </div>

          {/* Timer central */}
          <div className="flex flex-col items-center gap-2">
            <InlineTimer startedAt={match.started_at} status={match.status} />
            {isAdmin && match.status === 'pending' && (
              <Button size="sm" onClick={() => onStart(match.id)}
                className="bg-[#16a34a] text-white hover:bg-[#22c55e] h-7 px-3 text-xs gap-1">
                <Play className="h-3 w-3" /> Iniciar
              </Button>
            )}
            {isAdmin && match.status === 'active' && (
              <Button size="sm" variant="outline" onClick={() => onEnd(match.id)}
                className="border-red-500/30 text-red-400 h-7 px-3 text-xs gap-1">
                <Square className="h-3 w-3" /> Encerrar
              </Button>
            )}
          </div>

          {/* Time B */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className={`text-sm font-semibold ${TEAM_COLOR_CLASS[colorB].split(' ')[0]}`}>{TEAM_LABEL[colorB]}</span>
              <div className={`w-2.5 h-2.5 rounded-full ${TEAM_DOT_CLASS[colorB]}`} />
            </div>
            <motion.div key={getScore(colorB)} animate={{ scale: [1.2, 1] }} className={`text-4xl font-black ${TEAM_COLOR_CLASS[colorB].split(' ')[0]}`}>
              {getScore(colorB)}
            </motion.div>
            {isAdmin && match.status === 'active' && (
              <Button size="sm" onClick={() => onGoal(match.id, colorB)}
                className={`mt-2 text-xs h-7 px-3 border ${TEAM_COLOR_CLASS[colorB]}`}>
                ⚽ Gol
              </Button>
            )}
          </div>
        </div>

        {matchGoals.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-1">
            {matchGoals.map((g: any, i: number) => {
              const scorer = allPlayers.find((p) => p.id === g.scorer_id)
              return (
                <span key={i} className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                  ⚽ {scorer?.full_name?.split(' ')[0] ?? '?'}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {(playersA.length > 0 || playersB.length > 0) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-2 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>Ver jogadores</span>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      )}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 grid grid-cols-2 gap-3">
              {([colorA, colorB] as TeamColor[]).map((color) => {
                const ps = color === colorA ? playersA : playersB
                return (
                  <div key={color}>
                    <div className={`text-xs font-medium mb-2 ${TEAM_COLOR_CLASS[color].split(' ')[0]}`}>Time {TEAM_LABEL[color]}</div>
                    <div className="space-y-1.5">
                      {ps.map((p) => (
                        <button key={p.id} onClick={() => onPlayerClick(p)} className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={p.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[10px] bg-white/5">{p.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <p className="text-xs">{p.full_name?.split(' ')[0]}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────
export default function RoundManagerClient({ round, allPlayers, initialPresence, initialMatches, initialGoals, isAdmin, userId }: Props) {
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>(() => {
    if (initialMatches.length > 0 || round.team_compositions) return 'partidas'
    return 'jogadores'
  })
  const [presence, setPresence] = useState<any[]>(initialPresence)
  const [matches, setMatches] = useState<any[]>(initialMatches)
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [drawResult, setDrawResult] = useState<ThreeTeams | null>(null)
  const [loadingPresence, setLoadingPresence] = useState<string | null>(null)
  const [loadingDraw, setLoadingDraw] = useState(false)
  const [goalModal, setGoalModal] = useState<GoalModalState>({ open: false, matchId: '', team: 'blue', players: [] })
  const [pickingMatch, setPickingMatch] = useState(false)
  const [selectedTeams, setSelectedTeams] = useState<TeamColor[]>([])
  const [lineSize, setLineSize] = useState<4 | 5 | 6>(5)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ date: round.date as string, location: (round.location ?? '') as string })
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [cardPlayer, setCardPlayer] = useState<Profile | null>(null)
  const router = useRouter()

  const confirmed = presence.filter((p: any) => p.status === 'confirmed')
  const confirmedPlayers: Profile[] = confirmed.map((p: any) => p.player).filter(Boolean)

  const compositions: Compositions | null = round.team_compositions ?? null
  const allColors: TeamColor[] = ['blue', 'black', 'red']

  function getTeamProfiles(color: TeamColor): Profile[] {
    if (!compositions) return []
    return (compositions[color] ?? []).map((id: string) => allPlayers.find((p) => p.id === id)).filter(Boolean) as Profile[]
  }

  const lastMatch = [...matches].reverse().find(() => true)
  const lastColors: TeamColor[] = lastMatch?.teams?.map((t: any) => t.color as TeamColor) ?? []
  const waitingColor: TeamColor | null = compositions ? allColors.find((c) => !lastColors.includes(c)) ?? null : null

  function getLastWinnerColor(): TeamColor | null {
    if (!lastMatch || lastMatch.status !== 'finished') return null
    const teamsInMatch: TeamColor[] = lastMatch.teams?.map((t: any) => t.color as TeamColor) ?? []
    if (teamsInMatch.length < 2) return null
    const [c1, c2] = teamsInMatch
    const getScore = (c: TeamColor) => c === 'blue' ? lastMatch.team_blue_score : c === 'black' ? lastMatch.team_black_score : lastMatch.team_red_score ?? 0
    const s1 = getScore(c1)
    const s2 = getScore(c2)
    if (s1 > s2) return c1
    if (s2 > s1) return c2
    return null
  }
  const lastWinner = getLastWinnerColor()
  const suggestedNext: [TeamColor, TeamColor] | null = lastWinner && waitingColor ? [lastWinner, waitingColor] : null

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel(`round-${round.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `round_id=eq.${round.id}` },
        async () => {
          const { data } = await supabase
            .from('matches')
            .select('*, teams(id, color, team_players(id, player_id, player:profiles(*)))')
            .eq('round_id', round.id)
            .order('match_number')
          if (data) setMatches(data)
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presence', filter: `round_id=eq.${round.id}` },
        async () => {
          const { data } = await supabase.from('presence').select('*, player:profiles(*)').eq('round_id', round.id)
          if (data) setPresence(data)
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'goals' },
        (payload) => setGoals((prev) => [...prev, payload.new as Goal]))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [round.id])

  // Auto-encerrar com 2 gols
  useEffect(() => {
    matches.forEach(async (match) => {
      if (match.status !== 'active') return
      if (match.team_blue_score >= 2 || match.team_black_score >= 2 || (match.team_red_score ?? 0) >= 2) {
        await handleEndMatch(match.id)
      }
    })
  }, [matches])

  async function togglePlayer(playerId: string) {
    const current = presence.find((p: any) => p.player_id === playerId)
    const newStatus = current?.status === 'confirmed' ? 'absent' : 'confirmed'
    setLoadingPresence(playerId)
    await supabase.from('presence').upsert({
      round_id: round.id, player_id: playerId, status: newStatus, updated_at: new Date().toISOString(),
    }, { onConflict: 'round_id,player_id' })
    setLoadingPresence(null)
  }

  async function handleEditRound() {
    setLoadingEdit(true)
    const { error } = await supabase.from('rounds').update({
      date: editForm.date,
      location: editForm.location || null,
    }).eq('id', round.id)
    if (error) { toast.error('Erro ao salvar'); setLoadingEdit(false); return }
    round.date = editForm.date
    round.location = editForm.location
    setEditOpen(false)
    toast.success('Rodada atualizada!')
    setLoadingEdit(false)
    router.refresh()
  }

  async function handleDeleteRound() {
    setLoadingDelete(true)
    const { error } = await supabase.from('rounds').delete().eq('id', round.id)
    if (error) { toast.error('Erro ao excluir'); setLoadingDelete(false); return }
    toast.success('Rodada excluída')
    router.push('/rodadas')
  }

  function runDraw() {
    const minPlayers = (lineSize + 1) * 3
    if (confirmedPlayers.length < minPlayers) {
      toast.error(`Selecione pelo menos ${minPlayers} jogadores (${lineSize + 1} por time)`)
      return
    }
    setDrawResult(balanceThreeTeams(confirmedPlayers, lineSize))
  }

  async function confirmDraw() {
    if (!drawResult) return
    setLoadingDraw(true)
    const comps: Compositions = {
      blue: drawResult.blue.map((p) => p.id),
      black: drawResult.black.map((p) => p.id),
      red: drawResult.red.map((p) => p.id),
    }
    const { error } = await supabase.from('rounds').update({ team_compositions: comps, status: 'active' }).eq('id', round.id)
    if (error) { toast.error('Erro ao salvar times'); setLoadingDraw(false); return }
    round.team_compositions = comps
    setDrawResult(null)
    setSelectedTeams(['blue', 'black'])
    setPickingMatch(true)
    setTab('partidas')
    toast.success('Times salvos! Crie a primeira partida.')
    setLoadingDraw(false)
  }

  async function createMatch(teamA: TeamColor, teamB: TeamColor) {
    if (!compositions) return
    setLoadingDraw(true)
    const matchNum = matches.length + 1

    const { data: match, error } = await supabase
      .from('matches')
      .insert({ round_id: round.id, match_number: matchNum, status: 'pending' })
      .select().single()
    if (error || !match) { toast.error('Erro ao criar partida'); setLoadingDraw(false); return }

    for (const color of [teamA, teamB]) {
      const { data: team } = await supabase.from('teams').insert({ match_id: match.id, color }).select().single()
      if (team) {
        const playerIds = compositions[color] ?? []
        if (playerIds.length > 0) {
          await supabase.from('team_players').insert(
            playerIds.map((pid: string) => ({ team_id: team.id, player_id: pid, match_id: match.id }))
          )
        }
      }
    }

    setPickingMatch(false)
    setSelectedTeams([])
    toast.success(`Partida ${matchNum}: ${TEAM_LABEL[teamA]} × ${TEAM_LABEL[teamB]}`)
    setLoadingDraw(false)
  }

  async function handleStartMatch(matchId: string) {
    await supabase.from('matches').update({ status: 'active', started_at: new Date().toISOString() }).eq('id', matchId)
  }

  async function handleEndMatch(matchId: string) {
    await supabase.from('matches').update({
      status: 'finished', ended_at: new Date().toISOString(), end_reason: 'manual',
    }).eq('id', matchId)
  }

  function openGoalModal(matchId: string, team: TeamColor) {
    const match = matches.find((m) => m.id === matchId)
    const teamData = match?.teams?.find((t: any) => t.color === team)
    const players: Profile[] = teamData?.team_players?.map((tp: any) => tp.player).filter(Boolean) ?? []
    setGoalModal({ open: true, matchId, team, players })
  }

  async function registerGoal(scorerId: string, assistId: string | null) {
    const match = matches.find((m) => m.id === goalModal.matchId)
    if (!match) return
    const team = match.teams?.find((t: any) => t.color === goalModal.team)
    const elapsed = match.started_at ? Math.floor((Date.now() - new Date(match.started_at).getTime()) / 1000) : 0

    const { error } = await supabase.from('goals').insert({
      match_id: goalModal.matchId, team_id: team?.id,
      scorer_id: scorerId, assist_player_id: assistId, scored_at_second: elapsed,
    })
    if (error) { toast.error('Erro ao registrar gol'); return }

    const updates: any = {
      team_blue_score: match.team_blue_score,
      team_black_score: match.team_black_score,
    }
    if (goalModal.team === 'blue') updates.team_blue_score++
    else if (goalModal.team === 'black') updates.team_black_score++
    else updates.team_red_score = (match.team_red_score ?? 0) + 1

    await supabase.from('matches').update(updates).eq('id', goalModal.matchId)
    toast.success('⚽ Gol registrado!')
  }

  function toggleTeamPick(color: TeamColor) {
    setSelectedTeams((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : prev.length < 2 ? [...prev, color] : prev
    )
  }

  const TABS = [
    { key: 'jogadores' as Tab, label: 'Jogadores', count: confirmed.length },
    { key: 'sorteio' as Tab, label: 'Sorteio' },
    { key: 'partidas' as Tab, label: 'Partidas', count: matches.length },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
          <Link href="/rodadas" className="hover:text-foreground">Rodadas</Link>
          <span>/</span>
          <span>Rodada {round.number}</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Rodada {round.number}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(round.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              {round.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{round.location}</span>}
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              <Button size="sm" variant="outline"
                onClick={() => { setEditForm({ date: round.date, location: round.location ?? '' }); setEditOpen(true) }}
                className="border-white/10 text-muted-foreground hover:text-white h-8 px-2.5 gap-1.5">
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
              {!deleteConfirm ? (
                <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(true)}
                  className="border-red-500/20 text-red-400 hover:border-red-500/40 h-8 px-2.5 gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </Button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-red-400">Tem certeza?</span>
                  <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(false)}
                    className="border-white/10 h-7 px-2 text-xs">Não</Button>
                  <Button size="sm" onClick={handleDeleteRound} disabled={loadingDelete}
                    className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 h-7 px-2 text-xs">
                    {loadingDelete ? '...' : 'Sim'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Editar Rodada */}
      <AnimatePresence>
        {editOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative glass-strong border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 z-10"
            >
              <h2 className="font-semibold text-white mb-4">Editar Rodada {round.number}</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Data</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#16a34a]/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Local</label>
                  <input
                    type="text"
                    placeholder="Ex: Quadra do Parque"
                    value={editForm.location}
                    onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-[#16a34a]/50"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1 border-white/10 text-sm">Cancelar</Button>
                <Button onClick={handleEditRound} disabled={loadingEdit} className="flex-1 bg-[#16a34a] text-white hover:bg-[#22c55e]">
                  {loadingEdit ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 glass rounded-xl p-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-[#16a34a]/20 text-[#22c55e]' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="text-[10px] bg-[#16a34a]/20 text-[#22c55e] px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Jogadores ─────────────────────────────────────────── */}
      {tab === 'jogadores' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              {isAdmin ? 'Toque para confirmar —' : 'Confirmados —'}{' '}
              <span className="text-[#22c55e] font-medium">{confirmed.length} jogadores</span>
            </p>
            {confirmed.length >= 9 && (
              <Button size="sm" onClick={() => setTab('sorteio')} className="bg-[#16a34a] text-white hover:bg-[#22c55e] text-xs h-7">
                Sortear →
              </Button>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {allPlayers.map((player) => {
              const pres = presence.find((p: any) => p.player_id === player.id)
              const isConfirmed = pres?.status === 'confirmed'
              const isLoading = loadingPresence === player.id
              return (
                <motion.button key={player.id} onClick={() => isAdmin ? togglePlayer(player.id) : setCardPlayer(player)}
                  whileTap={{ scale: 0.95 }} disabled={isLoading}
                  className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 ${
                    isConfirmed
                      ? 'border-[#16a34a]/50 bg-[#16a34a]/10'
                      : 'border-white/8 bg-white/3 opacity-50'
                  }`}>
                  {isConfirmed && (
                    <div className="absolute top-1.5 right-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e]" />
                    </div>
                  )}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={player.avatar_url ?? undefined} />
                    <AvatarFallback className={`text-sm ${isConfirmed ? 'bg-[#16a34a]/20 text-[#22c55e]' : 'bg-white/5'}`}>
                      {player.full_name?.charAt(0) ?? '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-center leading-tight text-white">{player.full_name?.split(' ')[0] ?? 'Jogador'}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {player.primary_position === 'goleiro' ? '🧤' : POSITION_ABBR[player.primary_position as keyof typeof POSITION_ABBR] ?? '-'} · {player.overall}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Sorteio ────────────────────────────────────────────── */}
      {tab === 'sorteio' && (
        <div className="space-y-4">
          {confirmedPlayers.length < 9 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="text-muted-foreground">Confirme pelo menos 9 jogadores (3 por time)</p>
              <Button variant="outline" onClick={() => setTab('jogadores')} className="mt-4 border-white/10">← Jogadores</Button>
            </div>
          ) : !drawResult ? (
            <div className="glass rounded-2xl p-6 space-y-5">
              <div className="text-center">
                <div className="text-4xl mb-2">🎲</div>
                <p className="font-semibold text-white">{confirmedPlayers.length} jogadores confirmados</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {confirmedPlayers.filter(p => p.primary_position === 'goleiro').length} goleiros detectados
                </p>
              </div>

              {/* Seletor de jogadores de linha */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 text-center">Jogadores de linha por time</p>
                <div className="grid grid-cols-3 gap-2">
                  {([4, 5, 6] as const).map((n) => {
                    const total = (n + 1) * 3
                    const active = lineSize === n
                    return (
                      <button key={n} onClick={() => setLineSize(n)}
                        className={`p-3 rounded-xl border text-center transition-all duration-200 ${
                          active
                            ? 'border-[#16a34a]/50 bg-[#16a34a]/15 text-[#22c55e]'
                            : 'border-white/8 bg-white/3 text-muted-foreground hover:border-white/20'
                        }`}>
                        <div className="text-xl font-bold">{n}</div>
                        <div className="text-[10px] mt-0.5">{n + 1}v{n + 1}</div>
                        <div className="text-[10px] text-muted-foreground">{total} jog.</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Button onClick={runDraw} className="w-full bg-[#16a34a] text-white hover:bg-[#22c55e] gap-2">
                <Shuffle className="h-4 w-4" /> Fazer Sorteio
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <TeamCard color="blue" players={drawResult.blue} ovr={drawResult.blueAvg} onPlayerClick={setCardPlayer} />
                <TeamCard color="black" players={drawResult.black} ovr={drawResult.blackAvg} onPlayerClick={setCardPlayer} />
                <TeamCard color="red" players={drawResult.red} ovr={drawResult.redAvg} onPlayerClick={setCardPlayer} />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Desequilíbrio máx: <span className="text-[#22c55e]">{drawResult.maxDiff.toFixed(1)} OVR</span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={runDraw} className="flex-1 border-white/10 gap-2">
                  <Shuffle className="h-4 w-4" /> Refazer
                </Button>
                <Button onClick={confirmDraw} disabled={loadingDraw} className="flex-1 bg-[#16a34a] text-white hover:bg-[#22c55e]">
                  {loadingDraw ? 'Salvando...' : '✓ Confirmar Times'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Partidas ───────────────────────────────────────────── */}
      {tab === 'partidas' && (
        <div className="space-y-3">

          {/* Visão dos 3 times */}
          {compositions && (
            <div className="glass rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Times da Rodada</p>
              <div className="grid grid-cols-3 gap-2">
                {allColors.map((color) => {
                  const ps = getTeamProfiles(color)
                  const isWaiting = waitingColor === color && matches.length > 0
                  const isPlaying = lastColors.includes(color) && lastMatch?.status === 'active'
                  const isWinner = lastWinner === color && lastMatch?.status === 'finished'
                  return (
                    <div key={color} className={`rounded-xl p-3 border text-center transition-all ${TEAM_COLOR_CLASS[color]}`}>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <div className={`w-2 h-2 rounded-full ${TEAM_DOT_CLASS[color]}`} />
                        <span className={`text-xs font-semibold ${TEAM_COLOR_CLASS[color].split(' ')[0]}`}>{TEAM_LABEL[color]}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{ps.length} jog.</p>
                      {isWaiting && <span className="text-[10px] text-yellow-400 block mt-1">⏳ Esperando</span>}
                      {isPlaying && <span className="text-[10px] text-green-400 block mt-1">🟢 Em campo</span>}
                      {isWinner && <span className="text-[10px] text-[#facc15] block mt-1">🏆 Vencedor</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Cards das partidas */}
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              isAdmin={isAdmin}
              allPlayers={allPlayers}
              onStart={handleStartMatch}
              onEnd={handleEndMatch}
              onGoal={openGoalModal}
              goals={goals}
              onPlayerClick={setCardPlayer}
            />
          ))}

          {/* Criar nova partida */}
          {isAdmin && compositions && !matches.some((m) => m.status === 'active') && (
            <div className="glass rounded-2xl p-4">
              {!pickingMatch ? (
                <Button
                  onClick={() => {
                    setPickingMatch(true)
                    setSelectedTeams(suggestedNext ? [...suggestedNext] : [])
                  }}
                  className="w-full bg-[#16a34a]/10 border border-[#16a34a]/20 text-[#22c55e] hover:bg-[#16a34a]/20 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {matches.length === 0 ? 'Criar Primeira Partida' : 'Nova Partida'}
                  {suggestedNext && matches.length > 0 && (
                    <span className="text-xs opacity-70">
                      ({TEAM_LABEL[suggestedNext[0]]} × {TEAM_LABEL[suggestedNext[1]]})
                    </span>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white">Selecione 2 times que vão jogar:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {allColors.map((color) => {
                      const selected = selectedTeams.includes(color)
                      const isSuggested = suggestedNext?.includes(color) && matches.length > 0
                      return (
                        <button key={color} onClick={() => toggleTeamPick(color)}
                          className={`p-3 rounded-xl border text-center transition-all duration-200 ${
                            selected ? TEAM_COLOR_CLASS[color] : 'border-white/10 bg-white/3 opacity-50'
                          }`}>
                          <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${TEAM_DOT_CLASS[color]}`} />
                          <span className={`text-xs font-medium ${TEAM_COLOR_CLASS[color].split(' ')[0]}`}>{TEAM_LABEL[color]}</span>
                          {isSuggested && <span className="block text-[10px] text-yellow-400 mt-0.5">sugerido</span>}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setPickingMatch(false); setSelectedTeams([]) }} className="flex-1 border-white/10 text-sm">
                      Cancelar
                    </Button>
                    <Button
                      disabled={selectedTeams.length !== 2 || loadingDraw}
                      onClick={() => createMatch(selectedTeams[0], selectedTeams[1])}
                      className="flex-1 bg-[#16a34a] text-white hover:bg-[#22c55e]"
                    >
                      {loadingDraw ? 'Criando...' : selectedTeams.length === 2
                        ? `${TEAM_LABEL[selectedTeams[0]]} × ${TEAM_LABEL[selectedTeams[1]]}`
                        : 'Selecione 2 times'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sem sorteio ainda */}
          {!compositions && matches.length === 0 && (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="text-muted-foreground">Nenhum sorteio realizado</p>
              <Button variant="outline" onClick={() => setTab('jogadores')} className="mt-4 border-white/10">
                Começar → Jogadores
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Gol */}
      <GoalModal
        state={goalModal}
        onClose={() => setGoalModal((s) => ({ ...s, open: false }))}
        onConfirm={registerGoal}
      />

      {/* Modal de Carta */}
      <PlayerCardModal player={cardPlayer} onClose={() => setCardPlayer(null)} />
    </div>
  )
}
