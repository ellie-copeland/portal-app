import { NextResponse } from 'next/server'
import { calculateUsageAndCost, getActivityLog, getHeartbeatData } from '@/lib/command-center'

export async function GET() {
  try {
    const usage = calculateUsageAndCost()
    const activity = getActivityLog(100)
    const heartbeat = getHeartbeatData()

    const totalCost = usage.reduce((sum, item) => sum + item.totalCost, 0)
    const totalTokens = usage.reduce((sum, item) => sum + item.totalTokens, 0)

    return NextResponse.json({
      usage,
      activity,
      heartbeat,
      summary: {
        totalCost: totalCost.toFixed(2),
        totalTokens,
        modelCount: usage.length,
      },
    })
  } catch (error) {
    console.error('Error fetching usage data:', error)
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 })
  }
}
