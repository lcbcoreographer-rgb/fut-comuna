import { NextResponse } from 'next/server'
import { recalculateAllOverallsFromStats } from '@/lib/utils/stats'

export async function POST() {
  try {
    await recalculateAllOverallsFromStats()
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to recalculate overalls' }, { status: 500 })
  }
}
