'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Trophy, BarChart2, Shield } from 'lucide-react'
import type { Profile } from '@/types'

interface BottomNavProps {
  profile: Profile
}

export default function BottomNav({ profile }: BottomNavProps) {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'Início', icon: Home },
    { href: '/rodadas', label: 'Rodadas', icon: Calendar },
    { href: '/ranking', label: 'Ranking', icon: Trophy },
    { href: '/historico', label: 'Stats', icon: BarChart2 },
    ...(profile.role === 'admin' ? [{ href: '/admin', label: 'Admin', icon: Shield }] : []),
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-strong border-t border-white/8 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {links.map((link) => {
          const Icon = link.icon
          const active = pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                active
                  ? 'text-[#00b33c]'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'drop-shadow-[0_0_8px_rgba(0,179,60,0.8)]' : ''}`} />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
