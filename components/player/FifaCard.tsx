'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import Image from 'next/image'
import type { Profile, PlayerStats } from '@/types'
import { POSITION_ABBR } from '@/types'

interface Props {
  profile: Profile
  stats?: PlayerStats | null
  showShare?: boolean
}

// Gradientes por posição — inspirados nas cores do escudo FutComuna
const CARD_GRADIENTS: Record<string, string> = {
  goleiro:      'from-amber-900 via-yellow-800 to-amber-950',
  zagueiro:     'from-[#003087] via-[#0a3fa0] to-[#001a5c]',
  lateral:      'from-[#004d1a] via-[#006622] to-[#001f0a]',
  volante:      'from-[#003087] via-[#1a4fa0] to-[#001a5c]',
  meia:         'from-[#006622] via-[#009930] to-[#003311]',
  meia_ofensivo:'from-[#7a5c00] via-[#a07800] to-[#3d2e00]',
  atacante:     'from-[#004d1a] via-[#00b33c] to-[#001f0a]',
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold opacity-60 tracking-wider">{label}</span>
      <span className="text-sm font-black">{value}</span>
    </div>
  )
}

export default function FifaCard({ profile, stats, showShare = false }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const pos = profile.primary_position
  const gradient = CARD_GRADIENTS[pos] ?? CARD_GRADIENTS.atacante

  async function downloadCard() {
    if (!cardRef.current) return
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 })
      const link = document.createElement('a')
      link.download = `futcomuna-${profile.full_name.toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = dataUrl
      link.click()
    } catch {
      // silently fails
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        ref={cardRef}
        whileHover={{ rotateY: 5, rotateX: -3, scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
        className={`relative w-52 rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} p-4 select-none cursor-pointer shadow-2xl`}
      >
        {/* Shine */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-white/0 to-white/8 pointer-events-none" />

        {/* Borda dourada */}
        <div className="absolute inset-0 rounded-2xl border border-[#ffd700]/25 pointer-events-none" />

        {/* Reflexo dourado no topo */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#ffd700]/8 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between mb-3 relative">
          <div>
            <div className="text-4xl font-black leading-none text-white drop-shadow">{profile.overall}</div>
            <div className="text-xs font-bold text-[#ffd700] tracking-widest mt-0.5">
              {POSITION_ABBR[pos as keyof typeof POSITION_ABBR] ?? pos.toUpperCase()}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#ffd700]/40">
              <Image src="/logo-futcomuna.jpg" alt="FutComuna" width={32} height={32} className="object-cover" />
            </div>
            <div className="text-[9px] text-white/40 tracking-wider">{new Date().getFullYear()}</div>
          </div>
        </div>

        {/* Foto do jogador */}
        <div className="flex justify-center mb-3">
          <div className="relative">
            <Avatar className="h-28 w-28 border-2 border-[#ffd700]/30 shadow-xl">
              <AvatarImage src={profile.avatar_url ?? undefined} className="object-cover" />
              <AvatarFallback className="text-4xl bg-white/10 text-white">
                {profile.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        </div>

        {/* Nome */}
        <div className="text-center mb-3">
          <div className="font-black text-white text-sm tracking-wide truncate drop-shadow">
            {profile.full_name.split(' ')[0].toUpperCase()}
          </div>
          <div className="h-px bg-[#ffd700]/20 mx-4 mt-1.5" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-white px-1">
          <StatRow label="PAC" value={profile.pac} />
          <StatRow label="DRI" value={profile.dri} />
          <StatRow label="SHO" value={profile.sho} />
          <StatRow label="DEF" value={profile.def} />
          <StatRow label="PAS" value={profile.pas} />
          <StatRow label="PHY" value={profile.phy} />
        </div>

        {/* Mini stats */}
        {stats && (
          <div className="mt-3 pt-2 border-t border-[#ffd700]/15">
            <div className="flex justify-between text-[9px] text-white/50 font-bold tracking-widest">
              <span>{stats.games_played} JG</span>
              <span>{stats.goals} GL</span>
              <span>{stats.assists} AS</span>
              <span>{stats.wins} VT</span>
            </div>
          </div>
        )}
      </motion.div>

      {showShare && (
        <Button
          onClick={downloadCard}
          variant="outline"
          size="sm"
          className="border-[#00b33c]/30 text-[#00b33c] hover:bg-[#00b33c]/10 gap-2"
        >
          <Download className="h-4 w-4" /> Baixar Carta
        </Button>
      )}
    </div>
  )
}
