import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FutComuna Stats',
  description: 'Estatísticas do futebol semanal do grupo FutComuna',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'FutComuna' },
  openGraph: {
    title: 'FutComuna Stats',
    description: 'Ranking, histórico e estatísticas do FutComuna',
    images: [{ url: '/logo-futcomuna.jpg', width: 512, height: 512, alt: 'FutComuna' }],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'FutComuna Stats',
    description: 'Ranking, histórico e estatísticas do FutComuna',
    images: ['/logo-futcomuna.jpg'],
  },
}

export const viewport: Viewport = {
  themeColor: '#0b0f14',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  )
}
