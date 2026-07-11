export type Position =
  | 'goleiro'
  | 'zagueiro'
  | 'lateral'
  | 'volante'
  | 'meia'
  | 'meia_ofensivo'
  | 'atacante'

export type DominantFoot = 'direito' | 'esquerdo' | 'ambos'
export type UserRole = 'player' | 'admin'
export type RoundStatus = 'pending' | 'active' | 'finished'
export type MatchStatus = 'pending' | 'active' | 'finished'
export type TeamColor = 'blue' | 'black' | 'red'
export type PresenceStatus = 'confirmed' | 'absent' | 'maybe'
export type MatchEndReason = 'time' | 'goals' | 'manual'

export interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  shirt_number: number | null
  dominant_foot: DominantFoot
  birth_date: string | null
  city: string | null
  primary_position: Position
  secondary_position: Position | null
  role: UserRole
  overall: number
  pac: number
  sho: number
  pas: number
  dri: number
  def: number
  phy: number
  created_at: string
}

export interface Round {
  id: string
  number: number
  date: string
  location: string | null
  status: RoundStatus
  mvp_player_id: string | null
  top_scorer_id: string | null
  team_compositions: Record<TeamColor, string[]> | null
  created_by: string
  created_at: string
  mvp_player?: Profile
  top_scorer?: Profile
}

export interface Presence {
  id: string
  round_id: string
  player_id: string
  status: PresenceStatus
  updated_at: string
  player?: Profile
}

export interface Match {
  id: string
  round_id: string
  match_number: number
  status: MatchStatus
  team_blue_score: number
  team_black_score: number
  team_red_score: number
  started_at: string | null
  ended_at: string | null
  end_reason: MatchEndReason | null
  created_at: string
  teams?: Team[]
}

export interface Team {
  id: string
  match_id: string
  color: TeamColor
  players?: Profile[]
}

export interface TeamPlayer {
  id: string
  team_id: string
  player_id: string
  match_id: string
  player?: Profile
}

export interface Goal {
  id: string
  match_id: string
  team_id: string
  scorer_id: string
  assist_player_id: string | null
  scored_at_second: number
  created_at: string
  scorer?: Profile
  assist_player?: Profile
}

export interface PlayerStats {
  id: string
  player_id: string
  season: number
  games_played: number
  wins: number
  draws: number
  losses: number
  goals: number
  assists: number
  goal_participations: number
  goals_conceded: number
  games_with_goals: number
  win_streak: number
  max_win_streak: number
  unbeaten_streak: number
  max_unbeaten_streak: number
  minutes_played: number
  mvp_count: number
  updated_at: string
  player?: Profile
}

export interface Achievement {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  condition_type: string
  condition_value: number
}

export interface PlayerAchievement {
  id: string
  player_id: string
  achievement_id: string
  earned_at: string
  achievement?: Achievement
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
}

export interface RankingEntry {
  player: Profile
  stats: PlayerStats
  rank: number
}

export type RankingCategory =
  | 'goals'
  | 'assists'
  | 'participations'
  | 'wins'
  | 'win_rate'
  | 'mvp'
  | 'games'
  | 'win_streak'

export const POSITIONS: Record<Position, string> = {
  goleiro: 'Goleiro',
  zagueiro: 'Zagueiro',
  lateral: 'Lateral',
  volante: 'Volante',
  meia: 'Meio-campo',
  meia_ofensivo: 'Meia Ofensivo',
  atacante: 'Atacante',
}

export const POSITION_ABBR: Record<Position, string> = {
  goleiro: 'GOL',
  zagueiro: 'ZAG',
  lateral: 'LAT',
  volante: 'VOL',
  meia: 'MEI',
  meia_ofensivo: 'MOF',
  atacante: 'ATA',
}

export const CURRENT_SEASON = new Date().getFullYear()
