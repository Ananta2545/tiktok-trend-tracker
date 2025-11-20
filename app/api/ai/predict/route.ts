import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const { type, input } = await request.json()

    let prediction = ''
    let confidence = 0

    // Simple AI prediction based on current trends
    if (type === 'hashtag') {
      const hashtag = input.toLowerCase()
      
      // Check if hashtag exists and get its trend data
      const existingHashtag = await prisma.hashtag.findFirst({
        where: { 
          OR: [
            { name: hashtag },
            { displayName: { contains: hashtag, mode: 'insensitive' } },
          ]
        },
        include: {
          trends: {
            orderBy: { timestamp: 'desc' },
            take: 10,
          },
        },
      })

      if (existingHashtag && existingHashtag.trends.length > 0) {
        const avgGrowth = existingHashtag.trends.reduce((sum, t) => sum + t.growthRate, 0) / existingHashtag.trends.length
        const recentGrowth = existingHashtag.trends[0].growthRate

        if (recentGrowth > 50) {
          prediction = `${existingHashtag.displayName} is experiencing explosive growth (${recentGrowth.toFixed(1)}% growth rate). Predicted to reach viral status within 24-48 hours. Consider creating content immediately to capitalize on this trend.`
          confidence = 85
        } else if (recentGrowth > 20) {
          prediction = `${existingHashtag.displayName} is showing strong upward momentum (${recentGrowth.toFixed(1)}% growth). Expected to become mainstream within 3-5 days. Good opportunity for early adoption.`
          confidence = 70
        } else if (avgGrowth > 10) {
          prediction = `${existingHashtag.displayName} has steady growth (avg ${avgGrowth.toFixed(1)}%). Likely to maintain relevance for 1-2 weeks. Suitable for consistent content strategy.`
          confidence = 60
        } else {
          prediction = `${existingHashtag.displayName} has moderate activity. May not reach viral status but could serve niche audiences. Consider combining with stronger trending hashtags.`
          confidence = 45
        }
      } else {
        // New or unknown hashtag
        prediction = `"${hashtag}" is not currently trending. Consider monitoring similar hashtags or waiting for initial traction before investing heavily in content.`
        confidence = 30
      }
    } else if (type === 'sound') {
      const sound = await prisma.sound.findFirst({
        where: {
          OR: [
            { title: { contains: input, mode: 'insensitive' } },
            { author: { contains: input, mode: 'insensitive' } },
          ],
        },
        include: {
          trends: {
            orderBy: { timestamp: 'desc' },
            take: 10,
          },
        },
      })

      if (sound && sound.trends.length > 0) {
        const avgGrowth = sound.trends.reduce((sum, t) => sum + t.growthRate, 0) / sound.trends.length
        const videoCount = Number(sound.videoCount)

        if (avgGrowth > 40 && videoCount > 10000) {
          prediction = `"${sound.title}" by ${sound.author} is going viral! With ${videoCount.toLocaleString()} videos and ${avgGrowth.toFixed(1)}% growth, this sound will dominate feeds for the next week. Create content now!`
          confidence = 90
        } else if (avgGrowth > 20) {
          prediction = `"${sound.title}" is trending upward with ${videoCount.toLocaleString()} videos. Expected to peak in 2-4 days. Good timing for content creation.`
          confidence = 75
        } else {
          prediction = `"${sound.title}" has steady usage (${videoCount.toLocaleString()} videos). May continue as background trend. Consider for evergreen content.`
          confidence = 55
        }
      } else {
        prediction = `Sound not found in our database. It may be too new or not yet trending. Monitor for initial adoption signals.`
        confidence = 25
      }
    } else if (type === 'creator') {
      const creator = await prisma.creator.findFirst({
        where: {
          OR: [
            { username: { contains: input, mode: 'insensitive' } },
            { nickname: { contains: input, mode: 'insensitive' } },
          ],
        },
        include: {
          trends: {
            orderBy: { timestamp: 'desc' },
            take: 10,
          },
        },
      })

      if (creator && creator.trends.length > 0) {
        const avgGrowth = creator.trends.reduce((sum, t) => sum + t.growthRate, 0) / creator.trends.length
        const followers = Number(creator.followerCount)

        if (avgGrowth > 30) {
          prediction = `${creator.nickname} (@${creator.username}) is rapidly growing with ${followers.toLocaleString()} followers (${avgGrowth.toFixed(1)}% growth). Excellent collaboration opportunity - reach out soon!`
          confidence = 88
        } else if (avgGrowth > 15) {
          prediction = `${creator.nickname} shows consistent growth (${avgGrowth.toFixed(1)}%). With ${followers.toLocaleString()} followers, they're building a strong presence. Consider for partnerships.`
          confidence = 72
        } else {
          prediction = `${creator.nickname} has ${followers.toLocaleString()} followers with stable engagement. Established creator good for reliable collaborations.`
          confidence = 65
        }
      } else {
        prediction = `Creator not found in trending data. May be too small or new to our tracking system.`
        confidence = 20
      }
    }

    return NextResponse.json({ prediction, confidence })
  } catch (error) {
    console.error('AI prediction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
