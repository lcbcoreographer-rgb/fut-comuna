'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { LogOut, User, Bell, Shield } from 'lucide-react'
import type { Profile } from '@/types'

interface NavbarProps {
  profile: Profile
  notificationCount?: number
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/rodadas', label: 'Rodadas' },
  { href: '/ranking', label: 'Ranking' },
  { href: '/historico', label: 'Histórico' },
]

export default function Navbar({ profile, notificationCount = 0 }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/8" style={{ background: 'rgba(13,17,23,0.80)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-4 h-[68px] flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#ffd700]/30 shadow-md">
              <Image src="/logo-futcomuna.jpg" alt="FutComuna" width={32} height={32} className="object-cover" />
            </div>
            <span className="font-bold neon-text text-sm tracking-wide hidden sm:block">FutComuna</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  pathname.startsWith(link.href)
                    ? 'bg-[#00b33c]/10 text-[#00b33c]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {profile.role === 'admin' && (
              <Link
                href="/admin"
                className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1 ${
                  pathname.startsWith('/admin')
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-muted-foreground hover:text-amber-400 hover:bg-amber-500/5'
                }`}
              >
                <Shield className="h-3 w-3" />
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {notificationCount > 0 && (
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00b33c]" />
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent outline-none"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="bg-[#00b33c]/20 text-[#00b33c] text-xs">
                  {profile.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm hidden sm:block max-w-24 truncate">{profile.full_name?.split(' ')[0] ?? 'Jogador'}</span>
              <Badge variant="outline" className="text-xs border-[#00b33c]/30 text-[#00b33c] hidden sm:flex">
                {profile.overall}
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass border-white/10 w-48">
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => router.push(`/perfil/${profile.id}`)}
              >
                <User className="h-4 w-4" /> Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => router.push(`/carta/${profile.id}`)}
              >
                🃏 Minha Carta
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-400 flex items-center gap-2 cursor-pointer"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
