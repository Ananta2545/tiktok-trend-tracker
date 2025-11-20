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

    const trendingCreators = await prisma.creator.findMany({
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
        followerCount: 'desc',
      },
    })

    const formatted = trendingCreators
      .filter((c) => c.trends.length > 0)
      .map((creator) => ({
        id: creator.id,
        username: creator.username,
        nickname: creator.nickname,
        avatarUrl: creator.avatarUrl,
        followerCount: creator.followerCount,
        videoCount: creator.videoCount,
        verified: creator.verified,
        latestTrend: {
          trendScore: creator.trends[0].trendScore,
          growthRate: creator.trends[0].growthRate,
          engagementRate: creator.trends[0].engagementRate,
        },
      }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Trending creators API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
