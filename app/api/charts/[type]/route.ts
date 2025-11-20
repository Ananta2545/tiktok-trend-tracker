import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type } = params
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    let data: any[] = []

    switch (type) {
      case 'hashtags':
        // Get top 10 trending hashtags by current viewCount
        const topHashtags = await prisma.hashtag.findMany({
          take: 10,
          orderBy: { viewCount: 'desc' },
          select: { id: true, displayName: true },
        })
        
        const topHashtagIds = topHashtags.map(h => h.id)
        
        // Get all trend data for these top hashtags over last 7 days
        const hashtagTrends = await prisma.hashtagTrend.findMany({
          where: {
            timestamp: { gte: last7Days },
            hashtagId: { in: topHashtagIds },
          },
          include: {
            hashtag: true,
          },
          orderBy: [
            { timestamp: 'asc' },
          ],
        })

        data = hashtagTrends.map((t) => ({
          timestamp: t.timestamp.toISOString(),
          value: Number(t.viewCount),
          name: t.hashtag.displayName,
        }))
        break

      case 'sounds':
        // Get top 10 trending sounds by current videoCount
        const topSounds = await prisma.sound.findMany({
          take: 10,
          orderBy: { videoCount: 'desc' },
          select: { id: true, title: true },
        })
        
        const topSoundIds = topSounds.map(s => s.id)
        
        // Get all trend data for these top sounds over last 7 days
        const soundTrends = await prisma.soundTrend.findMany({
          where: {
            timestamp: { gte: last7Days },
            soundId: { in: topSoundIds },
          },
          include: {
            sound: true,
          },
          orderBy: [
            { timestamp: 'asc' },
          ],
        })

        data = soundTrends.map((t) => ({
          timestamp: t.timestamp.toISOString(),
          value: t.videoCount,
          name: t.sound.title,
        }))
        break

      case 'creators':
        // Get top 10 trending creators by current followerCount
        const topCreators = await prisma.creator.findMany({
          take: 10,
          orderBy: { followerCount: 'desc' },
          select: { id: true, nickname: true },
        })
        
        const topCreatorIds = topCreators.map(c => c.id)
        
        // Get all trend data for these top creators over last 7 days
        const creatorTrends = await prisma.creatorTrend.findMany({
          where: {
            timestamp: { gte: last7Days },
            creatorId: { in: topCreatorIds },
          },
          include: {
            creator: true,
          },
          orderBy: [
            { timestamp: 'asc' },
          ],
        })

        data = creatorTrends.map((t) => ({
          timestamp: t.timestamp.toISOString(),
          value: t.followerCount,
          name: t.creator.nickname,
        }))
        break

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Chart data API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
