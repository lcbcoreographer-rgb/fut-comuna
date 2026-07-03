import { NextResponse, type NextRequest } from 'next/server'
import { recalculatePlayerStats } from '@/lib/utils/stats'

export async function POST(request: NextRequest) {
  try {
    const { playerIds } = await request.json()
    if (!playerIds || !Array.isArray(playerIds)) {
      return NextResponse.json({ error: 'playerIds array required' }, { status: 400 })
    }

    await Promise.all(playerIds.map((id: string) => recalculatePlayerStats(id)))

    return NextResponse.json({ success: true, recalculated: playerIds.length })
  } catch (error) {
    return NextResponse.json({ error: 'Recalculation failed' }, { status: 500 })
  }
}
