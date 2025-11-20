import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { category, keywords } = await request.json()

    const ideas: any[] = []

    if (category === 'hashtag' || category === 'all') {
      // Get top trending hashtags
      const trendingHashtags = await prisma.hashtag.findMany({
        take: 5,
        orderBy: { viewCount: 'desc' },
        include: {
          trends: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      })

      trendingHashtags.forEach((hashtag, index) => {
        const growth = hashtag.trends[0]?.growthRate || 0
        ideas.push({
          id: `hashtag-${index}`,
          type: 'hashtag',
          title: `Create content around ${hashtag.displayName}`,
          description: `This hashtag has ${Number(hashtag.viewCount).toLocaleString()} views and is growing at ${growth.toFixed(1)}%. Create a video that puts a unique spin on this trend.`,
          hashtags: [hashtag.displayName],
          difficulty: growth > 50 ? 'High Competition' : growth > 20 ? 'Medium Competition' : 'Low Competition',
          potentialViews: Number(hashtag.viewCount),
          trendScore: hashtag.trends[0]?.trendScore || 0,
        })
      })
    }

    if (category === 'sound' || category === 'all') {
      // Get top trending sounds
      const trendingSounds = await prisma.sound.findMany({
        take: 5,
        orderBy: { videoCount: 'desc' },
        include: {
          trends: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      })

      trendingSounds.forEach((sound, index) => {
        const growth = sound.trends[0]?.growthRate || 0
        ideas.push({
          id: `sound-${index}`,
          type: 'sound',
          title: `Use "${sound.title}" by ${sound.author}`,
          description: `This sound is used in ${Number(sound.videoCount).toLocaleString()} videos. Create original content with this trending audio to increase discoverability.`,
          soundName: sound.title,
          soundAuthor: sound.author,
          difficulty: Number(sound.videoCount) > 50000 ? 'High Competition' : 'Medium Competition',
          potentialViews: Number(sound.videoCount) * 100,
          trendScore: sound.trends[0]?.trendScore || 0,
        })
      })
    }

    if (category === 'creator' || category === 'all') {
      // Get rising creators for collaboration ideas
      const risingCreators = await prisma.creator.findMany({
        take: 5,
        include: {
          trends: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
        orderBy: { followerCount: 'desc' },
      })

      risingCreators.forEach((creator, index) => {
        const growth = creator.trends[0]?.growthRate || 0
        ideas.push({
          id: `creator-${index}`,
          type: 'collaboration',
          title: `Collaborate with ${creator.nickname}`,
          description: `${creator.nickname} (@${creator.username}) has ${Number(creator.followerCount).toLocaleString()} followers and ${growth.toFixed(1)}% growth. Reach out for a duet or collaboration.`,
          creatorName: creator.nickname,
          creatorUsername: creator.username,
          followers: Number(creator.followerCount),
          difficulty: Number(creator.followerCount) > 1000000 ? 'Hard to Reach' : 'Reachable',
          potentialViews: Number(creator.followerCount) * 0.1,
          trendScore: creator.trends[0]?.trendScore || 0,
        })
      })
    }

    // Sort by trend score
    ideas.sort((a, b) => b.trendScore - a.trendScore)

    return NextResponse.json({ ideas: ideas.slice(0, 10) })
  } catch (error) {
    console.error('Content ideas error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
