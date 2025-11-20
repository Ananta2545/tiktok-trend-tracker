import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    // Find the competitor
    const competitor = await prisma.creator.findFirst({
      where: {
        OR: [
          { username: { contains: username, mode: 'insensitive' } },
          { nickname: { contains: username, mode: 'insensitive' } },
        ],
      },
      include: {
        trends: {
          orderBy: { timestamp: 'desc' },
          take: 30,
        },
      },
    })

    if (!competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })
    }

    // Calculate analytics
    const recentTrends = competitor.trends.slice(0, 7)
    const olderTrends = competitor.trends.slice(7, 14)

    const avgRecentGrowth = recentTrends.length > 0
      ? recentTrends.reduce((sum, t) => sum + t.growthRate, 0) / recentTrends.length
      : 0

    const avgOlderGrowth = olderTrends.length > 0
      ? olderTrends.reduce((sum, t) => sum + t.growthRate, 0) / olderTrends.length
      : 0

    const growthTrend = avgRecentGrowth > avgOlderGrowth ? 'increasing' : 'decreasing'
    const growthChange = Math.abs(avgRecentGrowth - avgOlderGrowth)

    const avgEngagement = recentTrends.length > 0
      ? recentTrends.reduce((sum, t) => sum + t.engagementRate, 0) / recentTrends.length
      : 0

    // Get their peak performance
    const peakTrend = competitor.trends.reduce((max, trend) => 
      trend.totalViews > max.totalViews ? trend : max
    , competitor.trends[0] || { totalViews: 0 })

    return NextResponse.json({
      competitor: {
        id: competitor.id,
        username: competitor.username,
        nickname: competitor.nickname,
        avatarUrl: competitor.avatarUrl,
        followers: Number(competitor.followerCount),
        following: Number(competitor.followingCount),
        videos: Number(competitor.videoCount),
        totalLikes: Number(competitor.likeCount),
        verified: competitor.verified,
        bio: competitor.bio,
      },
      analytics: {
        avgRecentGrowth: Math.round(avgRecentGrowth * 100) / 100,
        growthTrend,
        growthChange: Math.round(growthChange * 100) / 100,
        avgEngagement: Math.round(avgEngagement * 100) / 100,
        peakViews: Number(peakTrend.totalViews),
        peakDate: peakTrend.timestamp,
      },
      trends: competitor.trends.map(t => ({
        date: t.timestamp,
        followers: Number(t.followerCount),
        videos: Number(t.videoCount),
        views: Number(t.totalViews),
        likes: Number(t.totalLikes),
        growth: t.growthRate,
        engagement: t.engagementRate,
      })),
      insights: [
        {
          type: growthTrend === 'increasing' ? 'positive' : 'warning',
          message: `Growth is ${growthTrend} by ${growthChange.toFixed(1)}% compared to last week`,
        },
        {
          type: avgEngagement > 5 ? 'positive' : 'neutral',
          message: `Average engagement rate: ${avgEngagement.toFixed(2)}%`,
        },
        {
          type: 'info',
          message: `Peak performance: ${Number(peakTrend.totalViews).toLocaleString()} views`,
        },
      ],
    })
  } catch (error) {
    console.error('Competitor tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email.split('@')[0],
          emailVerified: new Date(),
        },
      })
    }

    const { creatorId } = await request.json()

    // Create an alert for this competitor
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
    })

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const alert = await prisma.trendAlert.create({
      data: {
        userId: user.id,
        type: 'CREATOR',
        name: `${creator.nickname} (@${creator.username})`,
        threshold: Number(creator.followerCount),
        condition: 'follower_growth > 5%',
        creatorId: creator.id,
        isActive: true,
      },
    })

    return NextResponse.json(alert)
  } catch (error) {
    console.error('Add competitor error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
