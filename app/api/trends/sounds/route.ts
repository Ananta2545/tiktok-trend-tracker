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

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const trendingSounds = await prisma.sound.findMany({
      take: 20,
      include: {
        trends: {
          where: {
            timestamp: { gte: last24Hours },
          },
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        videoCount: 'desc',
      },
    })

    const formatted = trendingSounds
      .filter((s) => s.trends.length > 0)
      .map((sound) => ({
        id: sound.id,
        title: sound.title,
        author: sound.author,
        videoCount: sound.videoCount,
        latestTrend: {
          trendScore: sound.trends[0].trendScore,
          growthRate: sound.trends[0].growthRate,
          viewCount: sound.trends[0].viewCount.toString(),
        },
      }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Trending sounds API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
