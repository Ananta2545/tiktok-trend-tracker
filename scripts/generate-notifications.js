require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function generateSampleNotifications() {
  console.log('📬 Generating sample notifications...\n')
  
  try {
    // Get test user
    const user = await prisma.user.findFirst({
      where: { email: 'test@example.com' },
    })

    if (!user) {
      console.log('❌ Test user not found. Run npm run create:user first')
      return
    }

    // Get top trending items
    const topHashtags = await prisma.hashtag.findMany({
      take: 3,
      orderBy: { viewCount: 'desc' },
    })

    const topSounds = await prisma.sound.findMany({
      take: 2,
      orderBy: { videoCount: 'desc' },
    })

    const topCreators = await prisma.creator.findMany({
      take: 2,
      orderBy: { followerCount: 'desc' },
    })

    // Create notifications for trending hashtags
    for (const hashtag of topHashtags) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'TREND_ALERT',
          title: `${hashtag.displayName} is trending!`,
          message: `The hashtag ${hashtag.displayName} has reached ${Number(hashtag.viewCount).toLocaleString()} views and is growing rapidly`,
          data: {
            type: 'hashtag',
            views: Number(hashtag.viewCount),
            videos: hashtag.videoCount,
            growth: 45 + Math.floor(Math.random() * 50),
          },
          read: false,
        },
      })
    }

    // Create notifications for trending sounds
    for (const sound of topSounds) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'TREND_ALERT',
          title: `Viral Sound Alert: ${sound.title}`,
          message: `"${sound.title}" is being used in ${sound.videoCount.toLocaleString()}+ videos`,
          data: {
            type: 'sound',
            views: sound.videoCount * 10000,
            videos: sound.videoCount,
            growth: 65 + Math.floor(Math.random() * 40),
          },
          read: Math.random() > 0.5,
        },
      })
    }

    // Create notifications for rising creators
    for (const creator of topCreators) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'TREND_ALERT',
          title: `Rising Creator: ${creator.nickname}`,
          message: `${creator.nickname} (@${creator.username}) gained ${Math.floor(Math.random() * 100000 + 50000).toLocaleString()} followers recently`,
          data: {
            type: 'creator',
            followers: creator.followerCount,
            videos: creator.videoCount,
            growth: 80 + Math.floor(Math.random() * 50),
          },
          read: Math.random() > 0.7,
        },
      })
    }

    // Create sample alerts
    for (const hashtag of topHashtags.slice(0, 2)) {
      await prisma.trendAlert.create({
        data: {
          userId: user.id,
          type: 'HASHTAG',
          name: hashtag.displayName,
          hashtagId: hashtag.id,
          threshold: 1000000,
          condition: 'GREATER_THAN',
          isActive: true,
        },
      })
    }

    for (const sound of topSounds.slice(0, 1)) {
      await prisma.trendAlert.create({
        data: {
          userId: user.id,
          type: 'SOUND',
          name: sound.title,
          soundId: sound.id,
          threshold: 10000,
          condition: 'GREATER_THAN',
          isActive: true,
        },
      })
    }

    const notifCount = await prisma.notification.count({ where: { userId: user.id } })
    const alertCount = await prisma.trendAlert.count({ where: { userId: user.id } })

    console.log(`✅ Generated ${notifCount} notifications and ${alertCount} alerts for ${user.email}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateSampleNotifications()
