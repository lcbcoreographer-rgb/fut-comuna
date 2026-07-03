import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-white/8" style={{ background: 'rgba(13,17,23,0.80)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-4 h-[68px] flex items-center justify-between">
          <Link href="/ranking" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#facc15]/30 shadow-md">
              <Image src="/logo-futcomuna.jpg" alt="FutComuna" width={32} height={32} className="object-cover" />
            </div>
            <span className="font-bold text-white text-sm tracking-wide">FutComuna</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link href="/ranking"
              className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-all">
              Ranking
            </Link>
            <Link href="/historico"
              className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-all">
              Histórico
            </Link>
            {user ? (
              <Link href="/dashboard"
                className="ml-2 px-3 py-1.5 rounded-lg text-sm bg-[#16a34a]/20 text-[#22c55e] hover:bg-[#16a34a]/30 transition-all">
                Painel
              </Link>
            ) : (
              <Link href="/login"
                className="ml-2 px-3 py-1.5 rounded-lg text-sm border border-white/10 text-muted-foreground hover:text-white hover:border-white/20 transition-all">
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
