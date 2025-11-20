require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function generateNotificationsForUser() {
  const email = 'chatterjeeanata091@gmail.com'
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('✅ User found:', email)

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

    console.log('\n📬 Creating notifications...')

    // Create hashtag notifications
    for (const hashtag of topHashtags) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'TREND_ALERT',
          title: `${hashtag.displayName} is trending!`,
          message: `This hashtag has reached ${(Number(hashtag.viewCount) / 1000000).toFixed(1)}M views and is growing fast!`,
          data: {
            type: 'hashtag',
            id: hashtag.id,
            name: hashtag.displayName,
            views: Number(hashtag.viewCount),
            growth: 45.3,
          },
          read: false,
          sentAt: new Date(Date.now() - Math.random() * 3600000 * 24), // Random time in last 24h
        },
      })
    }

    // Create sound notifications
    for (const sound of topSounds) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'TREND_ALERT',
          title: `Viral Sound Alert: ${sound.title}`,
          message: `This sound is being used in ${Number(sound.videoCount).toLocaleString()} videos and trending!`,
          data: {
            type: 'sound',
            id: sound.id,
            name: sound.title,
            videos: Number(sound.videoCount),
            growth: 38.7,
          },
          read: false,
          sentAt: new Date(Date.now() - Math.random() * 3600000 * 48), // Random time in last 48h
        },
      })
    }

    // Create creator notifications
    for (const creator of topCreators) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'TREND_ALERT',
          title: `Rising Creator: ${creator.nickname}`,
          message: `${creator.nickname} has gained ${(Number(creator.followerCount) / 1000000).toFixed(1)}M followers and is trending!`,
          data: {
            type: 'creator',
            id: creator.id,
            name: creator.nickname,
            followers: Number(creator.followerCount),
            growth: 52.1,
          },
          read: false,
          sentAt: new Date(Date.now() - Math.random() * 3600000 * 72), // Random time in last 72h
        },
      })
    }

    console.log(`✅ Created ${topHashtags.length + topSounds.length + topCreators.length} notifications`)

    // Create some trend alerts
    console.log('\n🔔 Creating trend alerts...')

    await prisma.trendAlert.create({
      data: {
        userId: user.id,
        type: 'HASHTAG',
        name: topHashtags[0].displayName,
        threshold: 100000,
        condition: 'views > threshold',
        hashtagId: topHashtags[0].id,
        isActive: true,
      },
    })

    await prisma.trendAlert.create({
      data: {
        userId: user.id,
        type: 'SOUND',
        name: topSounds[0].title,
        threshold: 50000,
        condition: 'videos > threshold',
        soundId: topSounds[0].id,
        isActive: true,
      },
    })

    await prisma.trendAlert.create({
      data: {
        userId: user.id,
        type: 'HASHTAG',
        name: topHashtags[1].displayName,
        threshold: 500000,
        condition: 'views > threshold',
        hashtagId: topHashtags[1].id,
        isActive: true,
      },
    })

    console.log('✅ Created 3 trend alerts')

    console.log('\n🎉 All notifications and alerts generated successfully!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

generateNotificationsForUser()
