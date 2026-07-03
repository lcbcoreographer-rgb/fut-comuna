'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, UserPlus } from 'lucide-react'
import { POSITIONS, type Position, type DominantFoot } from '@/types'

const POSITIONS_LIST = Object.entries(POSITIONS) as [Position, string][]

export default function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    primary_position: '' as Position | '',
    secondary_position: '' as Position | '',
    dominant_foot: 'direito' as DominantFoot,
    shirt_number: '',
    birth_date: '',
    city: '',
  })

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.primary_position) { toast.error('Selecione sua posição principal'); return }
    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          primary_position: form.primary_position,
        },
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').update({
        full_name: form.full_name,
        primary_position: form.primary_position,
        secondary_position: form.secondary_position || null,
        dominant_foot: form.dominant_foot,
        shirt_number: form.shirt_number ? parseInt(form.shirt_number) : null,
        birth_date: form.birth_date || null,
        city: form.city || null,
      }).eq('id', data.user.id)
    }

    toast.success('Conta criada! Bem-vindo ao FutComuna!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg"
    >
      <div className="glass rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl mb-4">⚽</div>
          <h1 className="text-3xl font-bold neon-text">FutComuna</h1>
          <p className="text-muted-foreground text-sm">Crie sua conta de jogador</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-2">
              <Label>Nome completo *</Label>
              <Input placeholder="Seu nome" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required className="bg-white/5 border-white/10" />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Email *</Label>
              <Input type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} required className="bg-white/5 border-white/10" />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Senha *</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={6} className="bg-white/5 border-white/10" />
            </div>

            <div className="space-y-2">
              <Label>Posição principal *</Label>
              <Select value={form.primary_position} onValueChange={(v) => set('primary_position', v ?? '')}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS_LIST.map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Posição secundária</Label>
              <Select value={form.secondary_position} onValueChange={(v) => set('secondary_position', v ?? '')}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS_LIST.map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pé dominante</Label>
              <Select value={form.dominant_foot} onValueChange={(v) => set('dominant_foot', v ?? 'direito')}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direito">Direito</SelectItem>
                  <SelectItem value="esquerdo">Esquerdo</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Número da camisa</Label>
              <Input type="number" placeholder="10" value={form.shirt_number} onChange={(e) => set('shirt_number', e.target.value)} className="bg-white/5 border-white/10" min={1} max={99} />
            </div>

            <div className="space-y-2">
              <Label>Data de nascimento</Label>
              <Input type="date" value={form.birth_date} onChange={(e) => set('birth_date', e.target.value)} className="bg-white/5 border-white/10" />
            </div>

            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input placeholder="São Paulo" value={form.city} onChange={(e) => set('city', e.target.value)} className="bg-white/5 border-white/10" />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-[#00b33c] text-[#0a0a0f] hover:bg-[#009930] font-bold">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4 mr-2" />Criar conta</>}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link href="/login" className="text-[#00b33c] hover:underline">Entrar</Link>
        </p>
      </div>
    </motion.div>
  )
}
