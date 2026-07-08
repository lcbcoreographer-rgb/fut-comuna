'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Search, Edit2, RefreshCw, Plus } from 'lucide-react'
import { POSITIONS, type Profile, type Position } from '@/types'

const POSITIONS_LIST2 = Object.entries(POSITIONS) as [Position, string][]

interface Props {
  profiles: (Profile & { player_stats?: any[] })[]
}

const NEW_PLAYER_DEFAULT = { full_name: '', primary_position: 'atacante' as Position, overall: 60 }

export default function PlayersClient({ profiles }: Props) {
  const [search, setSearch] = useState('')
  const [editingPlayer, setEditingPlayer] = useState<Profile | null>(null)
  const [editForm, setEditForm] = useState({ primary_position: '', overall: 0 })
  const [recalcLoading, setRecalcLoading] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newPlayer, setNewPlayer] = useState(NEW_PLAYER_DEFAULT)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const filtered = profiles.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  )

  function openEdit(player: Profile) {
    setEditingPlayer(player)
    setEditForm({ primary_position: player.primary_position, overall: player.overall })
  }

  async function saveEdit() {
    if (!editingPlayer) return
    const { error } = await supabase.from('profiles').update({
      primary_position: editForm.primary_position || editingPlayer.primary_position,
      overall: editForm.overall,
    }).eq('id', editingPlayer.id)
    if (error) toast.error('Erro ao salvar')
    else {
      toast.success('Jogador atualizado!')
      setEditingPlayer(null)
    }
  }

  async function createPlayer() {
    if (!newPlayer.full_name.trim()) {
      toast.error('Informe o nome do jogador')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('profiles').insert({
      full_name: newPlayer.full_name.trim(),
      primary_position: newPlayer.primary_position,
      overall: newPlayer.overall,
      role: 'player',
    })
    setSaving(false)
    if (error) toast.error('Erro ao criar jogador')
    else {
      toast.success('Jogador criado!')
      setCreating(false)
      setNewPlayer(NEW_PLAYER_DEFAULT)
      router.refresh()
    }
  }

  async function recalculate(playerId: string) {
    setRecalcLoading(playerId)
    await fetch('/api/stats/recalculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerIds: [playerId] }),
    })
    setRecalcLoading(null)
    toast.success('Stats recalculadas!')
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar jogador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>
        <Button onClick={() => setCreating(true)} className="bg-[#00b33c] text-[#0a0a0f] hover:bg-[#009930] shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Novo Jogador
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.map((player) => {
          const stats = player.player_stats?.[0]
          return (
            <div key={player.id} className="stat-card p-4 flex items-center gap-4">
              <Avatar className="h-10 w-10 border border-white/10">
                <AvatarImage src={player.avatar_url ?? undefined} />
                <AvatarFallback className="bg-[#00b33c]/10 text-[#00b33c]">{player.full_name.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{player.full_name}</p>
                  {player.role === 'admin' && <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">Admin</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {POSITIONS[player.primary_position as keyof typeof POSITIONS]} •
                  {stats ? ` ${stats.games_played} jogos • ${stats.goals} gols` : ' sem stats'}
                </p>
              </div>

              <div className="text-center mr-2">
                <div className="text-xl font-bold neon-text">{player.overall}</div>
                <div className="text-[10px] text-muted-foreground">OVR</div>
              </div>

              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(player)} className="h-8 w-8 hover:bg-white/5">
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => recalculate(player.id)}
                  disabled={recalcLoading === player.id}
                  className="h-8 w-8 hover:bg-white/5">
                  <RefreshCw className={`h-3.5 w-3.5 ${recalcLoading === player.id ? 'animate-spin' : ''}`} />
                </Button>
                <Link href={`/perfil/${player.id}`}>
                  <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/5">→</Button>
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={!!editingPlayer} onOpenChange={() => setEditingPlayer(null)}>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle>Editar {editingPlayer?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm">Posição principal</label>
              <Select value={editForm.primary_position} onValueChange={(v) => setEditForm({ ...editForm, primary_position: v ?? '' })}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS_LIST2.map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm">Overall manual (0 = calculado)</label>
              <Input
                type="number"
                min={40}
                max={99}
                value={editForm.overall}
                onChange={(e) => setEditForm({ ...editForm, overall: parseInt(e.target.value) })}
                className="bg-white/5 border-white/10"
              />
            </div>
            <Button onClick={saveEdit} className="w-full bg-[#00b33c] text-[#0a0a0f] hover:bg-[#009930]">
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={creating} onOpenChange={(open) => { if (!open) { setCreating(false); setNewPlayer(NEW_PLAYER_DEFAULT) } }}>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle>Novo Jogador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm">Nome</label>
              <Input
                placeholder="Nome do jogador"
                value={newPlayer.full_name}
                onChange={(e) => setNewPlayer({ ...newPlayer, full_name: e.target.value })}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Posição principal</label>
              <Select value={newPlayer.primary_position} onValueChange={(v) => setNewPlayer({ ...newPlayer, primary_position: (v ?? 'atacante') as Position })}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS_LIST2.map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm">Overall inicial</label>
              <Input
                type="number"
                min={40}
                max={99}
                value={newPlayer.overall}
                onChange={(e) => setNewPlayer({ ...newPlayer, overall: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10"
              />
            </div>
            <Button onClick={createPlayer} disabled={saving} className="w-full bg-[#00b33c] text-[#0a0a0f] hover:bg-[#009930]">
              {saving ? 'Criando...' : 'Criar jogador'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
