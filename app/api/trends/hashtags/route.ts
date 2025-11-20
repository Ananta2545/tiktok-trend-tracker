import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const trendingHashtags = await prisma.hashtag.findMany({
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
        viewCount: 'desc',
      },
    })

    const formatted = trendingHashtags
      .filter((h) => h.trends.length > 0)
      .map((hashtag) => ({
        id: hashtag.id,
        name: hashtag.name,
        displayName: hashtag.displayName,
        videoCount: hashtag.videoCount,
        viewCount: hashtag.viewCount.toString(),
        latestTrend: {
          trendScore: hashtag.trends[0].trendScore,
          growthRate: hashtag.trends[0].growthRate,
          velocity: hashtag.trends[0].velocity,
        },
      }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Trending hashtags API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
