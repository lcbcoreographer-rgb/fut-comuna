'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'

interface Props {
  nextNumber: number
}

export default function NewRoundForm({ nextNumber }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    location: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from('rounds').insert({
      number: nextNumber,
      date: form.date,
      location: form.location || null,
      status: 'pending',
      created_by: user.id,
    }).select().single()

    if (error) {
      toast.error('Erro ao criar rodada')
      setLoading(false)
      return
    }

    // Notify all players
    const { data: players } = await supabase.from('profiles').select('id').in('role', ['player', 'admin'])
    if (players && players.length > 0) {
      await supabase.from('notifications').insert(
        players.map((p) => ({
          user_id: p.id,
          type: 'new_round',
          title: `Rodada ${nextNumber} agendada! 📅`,
          message: `A Rodada ${nextNumber} foi marcada para ${form.date}. Confirme sua presença!`,
        }))
      )
    }

    toast.success(`Rodada ${nextNumber} criada com sucesso!`)
    router.push(`/rodadas/${data.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
      <div className="space-y-2">
        <Label>Data *</Label>
        <Input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
          className="bg-white/5 border-white/10"
        />
      </div>
      <div className="space-y-2">
        <Label>Local</Label>
        <Input
          placeholder="Nome da quadra / campo"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="bg-white/5 border-white/10"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-[#00b33c] text-[#0a0a0f] hover:bg-[#009930] font-bold gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" />Criar Rodada {nextNumber}</>}
      </Button>
    </form>
  )
}
