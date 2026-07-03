import { createClient } from '@/lib/supabase/server'
import PlayersClient from './PlayersClient'
import { CURRENT_SEASON } from '@/types'

export default async function PlayersAdminPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*, player_stats(*)')
    .order('overall', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Jogadores</h1>
      <PlayersClient profiles={profiles ?? []} />
    </div>
  )
}
