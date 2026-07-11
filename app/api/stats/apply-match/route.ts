import { NextResponse, type NextRequest } from 'next/server'
import { applyFinishedMatchStats } from '@/lib/utils/stats'

export async function POST(request: NextRequest) {
  try {
    const { matchId } = await request.json()
    if (!matchId) {
      return NextResponse.json({ error: 'matchId required' }, { status: 400 })
    }

    await applyFinishedMatchStats(matchId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to apply match stats' }, { status: 500 })
  }
}
