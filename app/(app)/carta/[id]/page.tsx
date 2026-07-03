import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FifaCard from '@/components/player/FifaCard'
import { CURRENT_SEASON } from '@/types'
import type { Profile, PlayerStats } from '@/types'

export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: profile }, { data: stats }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('player_stats').select('*').eq('player_id', id).eq('season', CURRENT_SEASON).maybeSingle(),
  ])

  if (!profile) notFound()

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold neon-text">FutComuna</h1>
        <p className="text-muted-foreground text-sm mt-1">Carta de {profile.full_name}</p>
      </div>

      <FifaCard
        profile={profile as Profile}
        stats={stats as PlayerStats | null}
        showShare
      />

      <div className="text-center text-xs text-muted-foreground">
        Temporada {CURRENT_SEASON} • OVR {profile.overall}
      </div>
    </div>
  )
}
