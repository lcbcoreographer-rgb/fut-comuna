import type { PlayerStats } from '@/types'
import { createClient } from '@/lib/supabase/server'

export async function checkAndAwardAchievements(playerId: string, stats: PlayerStats, goalsInMatch: number = 0) {
  const supabase = await createClient()

  const { data: allAchievements } = await supabase.from('achievements').select('*')
  const { data: playerAchievements } = await supabase
    .from('player_achievements')
    .select('achievement_id')
    .eq('player_id', playerId)

  if (!allAchievements) return

  const earnedIds = new Set(playerAchievements?.map((a) => a.achievement_id) ?? [])
  const toAward: { player_id: string; achievement_id: string }[] = []

  for (const achievement of allAchievements) {
    if (earnedIds.has(achievement.id)) continue

    let earned = false
    switch (achievement.condition_type) {
      case 'goals':
        earned = stats.goals >= achievement.condition_value
        break
      case 'assists':
        earned = stats.assists >= achievement.condition_value
        break
      case 'games':
        earned = stats.games_played >= achievement.condition_value
        break
      case 'win_streak':
        earned = stats.max_win_streak >= achievement.condition_value
        break
      case 'mvp':
        earned = stats.mvp_count >= achievement.condition_value
        break
      case 'hat_trick':
        earned = goalsInMatch >= 3
        break
      case 'lenda':
        earned = stats.games_played >= 100 && stats.goals >= 50
        break
    }

    if (earned) {
      toAward.push({ player_id: playerId, achievement_id: achievement.id })
    }
  }

  if (toAward.length > 0) {
    await supabase.from('player_achievements').insert(toAward)

    for (const award of toAward) {
      const ach = allAchievements.find((a) => a.id === award.achievement_id)
      if (ach) {
        await supabase.from('notifications').insert({
          user_id: playerId,
          type: 'achievement',
          title: `Conquista desbloqueada!`,
          message: `${ach.icon} ${ach.name}: ${ach.description}`,
        })
      }
    }
  }
}
