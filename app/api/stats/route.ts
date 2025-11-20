import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get current counts
    const hashtagCount = await prisma.hashtag.count()
    const soundCount = await prisma.sound.count()
    const creatorCount = await prisma.creator.count()

    // Get yesterday counts for growth calculation
    const hashtagCountYesterday = await prisma.hashtag.count({
      where: { firstSeenAt: { lte: yesterday } },
    })
    const soundCountYesterday = await prisma.sound.count({
      where: { firstSeenAt: { lte: yesterday } },
    })
    const creatorCountYesterday = await prisma.creator.count({
      where: { firstSeenAt: { lte: yesterday } },
    })

    // Calculate growth rates
    const hashtagGrowth = hashtagCountYesterday > 0
      ? ((hashtagCount - hashtagCountYesterday) / hashtagCountYesterday) * 100
      : 0

    const soundGrowth = soundCountYesterday > 0
      ? ((soundCount - soundCountYesterday) / soundCountYesterday) * 100
      : 0

    const creatorGrowth = creatorCountYesterday > 0
      ? ((creatorCount - creatorCountYesterday) / creatorCountYesterday) * 100
      : 0

    // Get API calls today
    const apiCalls = await prisma.apiUsage.count({
      where: {
        timestamp: { gte: yesterday },
      },
    })

    const apiCallsYesterday = await prisma.apiUsage.count({
      where: {
        timestamp: { gte: lastWeek, lt: yesterday },
      },
    })

    const apiCallsGrowth = apiCallsYesterday > 0
      ? ((apiCalls - apiCallsYesterday) / apiCallsYesterday) * 100
      : 0

    return NextResponse.json({
      hashtagCount,
      hashtagGrowth: Math.round(hashtagGrowth * 10) / 10,
      soundCount,
      soundGrowth: Math.round(soundGrowth * 10) / 10,
      creatorCount,
      creatorGrowth: Math.round(creatorGrowth * 10) / 10,
      apiCalls,
      apiCallsGrowth: Math.round(apiCallsGrowth * 10) / 10,
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
