import { NextResponse, type NextRequest } from 'next/server'
import { finishRound } from '@/lib/utils/stats'

export async function POST(request: NextRequest) {
  try {
    const { roundId, mvpPlayerId } = await request.json()
    if (!roundId) {
      return NextResponse.json({ error: 'roundId required' }, { status: 400 })
    }

    await finishRound(roundId, mvpPlayerId ?? null)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to finish round' }, { status: 500 })
  }
}
