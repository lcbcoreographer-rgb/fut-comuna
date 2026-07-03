import type { Achievement } from '@/types'

const ICON_MAP: Record<string, string> = {
  gol: '⚽', chapeu: '🎩', fogo: '🔥', explosao: '💥', coroa: '👑',
  alvo: '🎯', magia: '🪄', medalha: '🏅', ouro: '🥇', trofeu: '🏆',
  raio: '⚡', estrela: '🌟', leao: '🦁', fantasma: '👻', estadio: '🏟️',
}

interface Props {
  achievement: Achievement
  earnedAt?: string
}

export default function AchievementBadge({ achievement, earnedAt }: Props) {
  const icon = ICON_MAP[achievement.icon] ?? achievement.icon

  return (
    <div
      title={`${achievement.name}: ${achievement.description}`}
      className="flex flex-col items-center gap-1 glass rounded-xl p-3 text-center hover:border-[#00b33c]/20 transition-colors cursor-default w-20"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-[10px] text-muted-foreground leading-tight">{achievement.name}</span>
      {earnedAt && (
        <span className="text-[9px] text-muted-foreground/60">
          {new Date(earnedAt).getFullYear()}
        </span>
      )}
    </div>
  )
}
