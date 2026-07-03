'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Play, Pause, Square } from 'lucide-react'

const MATCH_DURATION = 7 * 60 // 7 minutos em segundos

interface Props {
  matchId: string
  status: string
  startedAt: string | null
  onStart: () => Promise<void>
  onEnd: (reason: 'time' | 'goals' | 'manual') => Promise<void>
  isAdmin: boolean
}

export default function MatchTimer({ matchId, status, startedAt, onStart, onEnd, isAdmin }: Props) {
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const remaining = Math.max(0, MATCH_DURATION - elapsed)
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const progress = (elapsed / MATCH_DURATION) * 100

  const tick = useCallback(() => {
    if (!paused) {
      setElapsed((prev) => {
        if (prev >= MATCH_DURATION) {
          clearInterval(intervalRef.current!)
          onEnd('time')
          return prev
        }
        return prev + 1
      })
    }
  }, [paused, onEnd])

  useEffect(() => {
    if (status === 'active' && startedAt) {
      const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
      setElapsed(Math.min(diff, MATCH_DURATION))
      intervalRef.current = setInterval(tick, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [status, startedAt, tick])

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current)
    } else if (status === 'active') {
      intervalRef.current = setInterval(tick, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [paused, status, tick])

  const isUrgent = remaining <= 60 && remaining > 0

  return (
    <div className="glass rounded-2xl p-6 text-center">
      <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">Tempo restante</div>

      <motion.div
        key={remaining}
        animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
        className={`text-6xl font-bold font-mono mb-4 ${
          remaining === 0 ? 'text-red-400' : isUrgent ? 'text-orange-400' : 'neon-text'
        }`}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </motion.div>

      {/* Progress bar */}
      <div className="relative h-2 bg-white/10 rounded-full mb-5 overflow-hidden">
        <motion.div
          className={`absolute left-0 top-0 h-full rounded-full ${
            isUrgent ? 'bg-orange-400' : 'bg-gradient-to-r from-[#00b33c] to-[#00ff94]'
          }`}
          style={{ width: `${100 - progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {isAdmin && (
        <div className="flex gap-2 justify-center">
          {status === 'pending' && (
            <Button onClick={onStart} className="bg-green-500 hover:bg-green-600 text-white gap-2">
              <Play className="h-4 w-4" /> Iniciar Partida
            </Button>
          )}
          {status === 'active' && (
            <>
              <Button variant="outline" onClick={() => setPaused(!paused)} className="border-white/10 gap-2">
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {paused ? 'Continuar' : 'Pausar'}
              </Button>
              <Button variant="outline" onClick={() => onEnd('manual')} className="border-red-500/30 text-red-400 gap-2">
                <Square className="h-4 w-4" /> Encerrar
              </Button>
            </>
          )}
        </div>
      )}

      {status === 'active' && paused && (
        <div className="mt-3 text-yellow-400 text-sm animate-pulse">⏸ Pausado</div>
      )}
    </div>
  )
}
