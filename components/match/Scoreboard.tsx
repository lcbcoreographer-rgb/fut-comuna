'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Profile, Goal, TeamColor } from '@/types'

interface TeamProps {
  color: TeamColor
  players: Profile[]
  score: number
  goals: Goal[]
  isAdmin: boolean
  disabled: boolean
  onGoal: () => void
}

function TeamPanel({ color, players, score, goals, isAdmin, disabled, onGoal }: TeamProps) {
  const isBlue = color === 'blue'
  const teamLabel = isBlue ? 'Time Azul' : 'Time Preto'
  const scoreColor = isBlue ? 'text-blue-400' : 'text-gray-200'
  const buttonColor = isBlue
    ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 hover:bg-blue-500/30'
    : 'bg-gray-500/20 border-gray-500/40 text-gray-300 hover:bg-gray-500/30'

  const myGoals = goals.filter((g) => {
    const player = players.find((p) => p.id === g.scorer_id)
    return !!player
  })

  return (
    <div className="glass rounded-2xl p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${isBlue ? 'bg-blue-400' : 'bg-gray-400'}`} />
        <span className="font-semibold text-sm">{teamLabel}</span>
      </div>

      <AnimatePresence>
        <motion.div
          key={score}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-5xl font-bold text-center mb-4 ${scoreColor}`}
        >
          {score}
        </motion.div>
      </AnimatePresence>

      {isAdmin && (
        <Button
          onClick={onGoal}
          disabled={disabled}
          variant="outline"
          className={`w-full mb-4 gap-2 ${buttonColor}`}
        >
          ⚽ Gol {teamLabel.split(' ')[1]}
        </Button>
      )}

      <div className="space-y-1.5 flex-1">
        {players.map((player) => {
          const playerGoals = goals.filter((g) => g.scorer_id === player.id).length
          const playerAssists = goals.filter((g) => g.assist_player_id === player.id).length
          return (
            <div key={player.id} className="flex items-center gap-2 text-sm">
              <Avatar className="h-6 w-6">
                <AvatarImage src={player.avatar_url ?? undefined} />
                <AvatarFallback className="text-[9px] bg-white/5">{player.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-xs">{player.full_name.split(' ')[0]}</span>
              {playerGoals > 0 && <span className="text-xs text-yellow-400">{'⚽'.repeat(Math.min(playerGoals, 3))}</span>}
              {playerAssists > 0 && <span className="text-xs text-blue-300">🎯</span>}
            </div>
          )
        })}
      </div>

      {myGoals.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/8 space-y-1">
          {myGoals.map((goal, i) => (
            <div key={goal.id} className="text-xs text-muted-foreground flex items-center gap-1">
              <span>⚽</span>
              <span>{players.find((p) => p.id === goal.scorer_id)?.full_name.split(' ')[0]}</span>
              {goal.assist_player_id && (
                <span className="text-blue-300">
                  (🎯 {players.find((p) => p.id === goal.assist_player_id)?.full_name.split(' ')[0]})
                </span>
              )}
              <span className="ml-auto">{Math.floor(goal.scored_at_second / 60)}'{goal.scored_at_second % 60 > 0 ? goal.scored_at_second % 60 + '"' : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface ScoreboardProps {
  bluePlayers: Profile[]
  blackPlayers: Profile[]
  blueScore: number
  blackScore: number
  goals: Goal[]
  matchStatus: string
  isAdmin: boolean
  onGoalBlue: () => void
  onGoalBlack: () => void
}

export default function Scoreboard({
  bluePlayers, blackPlayers, blueScore, blackScore, goals, matchStatus, isAdmin, onGoalBlue, onGoalBlack,
}: ScoreboardProps) {
  const disabled = matchStatus !== 'active'

  return (
    <div className="grid grid-cols-2 gap-4">
      <TeamPanel
        color="blue"
        players={bluePlayers}
        score={blueScore}
        goals={goals}
        isAdmin={isAdmin}
        disabled={disabled}
        onGoal={onGoalBlue}
      />
      <TeamPanel
        color="black"
        players={blackPlayers}
        score={blackScore}
        goals={goals}
        isAdmin={isAdmin}
        disabled={disabled}
        onGoal={onGoalBlack}
      />
    </div>
  )
}
