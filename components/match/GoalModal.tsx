'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'
import type { Profile, TeamColor } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (scorerId: string, assistId: string | null) => Promise<void>
  players: Profile[]
  teamColor: TeamColor
}

export default function GoalModal({ open, onClose, onConfirm, players, teamColor }: Props) {
  const [step, setStep] = useState<'scorer' | 'assist'>('scorer')
  const [scorer, setScorer] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleAssist(assistPlayer: Profile | null) {
    if (!scorer) return
    setLoading(true)
    await onConfirm(scorer.id, assistPlayer?.id ?? null)
    setLoading(false)
    handleClose()
  }

  function handleClose() {
    setStep('scorer')
    setScorer(null)
    onClose()
  }

  const teamLabel = teamColor === 'blue' ? 'Azul 🔵' : 'Preto ⚫'
  const teamBg = teamColor === 'blue' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-gray-500/10 border-gray-500/30'
  const teamColor2 = teamColor === 'blue' ? 'text-blue-400' : 'text-gray-300'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass border-white/10 max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>⚽ Gol do Time</span>
            <span className={`text-sm font-normal ${teamColor2}`}>{teamLabel}</span>
          </DialogTitle>
        </DialogHeader>

        {step === 'scorer' ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Quem fez o gol?</p>
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => { setScorer(player); setStep('assist') }}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all hover:border-[#00b33c]/30 ${teamBg}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={player.avatar_url ?? undefined} />
                    <AvatarFallback className={`text-xs ${teamColor2} bg-white/5`}>
                      {player.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate">{player.full_name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Gol de</span>
              <span className="font-semibold">{scorer?.full_name.split(' ')[0]}</span>
            </div>
            <p className="text-sm text-muted-foreground">Quem deu a assistência?</p>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              <button
                onClick={() => handleAssist(null)}
                disabled={loading}
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/10 text-sm text-muted-foreground hover:border-white/20 transition-all"
              >
                Sem assistência
              </button>
              {players.filter((p) => p.id !== scorer?.id).map((player) => (
                <button
                  key={player.id}
                  onClick={() => handleAssist(player)}
                  disabled={loading}
                  className="flex items-center gap-2 p-3 rounded-xl border border-white/10 hover:border-[#00b33c]/30 transition-all"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={player.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-white/5">{player.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate">{player.full_name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setStep('scorer')} className="w-full border-white/10">
              ← Voltar
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-[#00b33c]" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
