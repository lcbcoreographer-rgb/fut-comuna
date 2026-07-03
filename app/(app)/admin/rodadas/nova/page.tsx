import NewRoundForm from './NewRoundForm'
import { createClient } from '@/lib/supabase/server'

export default async function NewRoundPage() {
  const supabase = await createClient()
  const { data: lastRound } = await supabase.from('rounds').select('number').order('number', { ascending: false }).limit(1).maybeSingle()
  const nextNumber = (lastRound?.number ?? 0) + 1
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nova Rodada</h1>
        <p className="text-muted-foreground text-sm mt-1">Rodada {nextNumber}</p>
      </div>
      <NewRoundForm nextNumber={nextNumber} />
    </div>
  )
}
