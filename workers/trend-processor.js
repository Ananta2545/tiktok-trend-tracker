const Queue = require('bull')
const { PrismaClient } = require('@prisma/client')
const { tiktokApi } = require('../lib/tiktok-api')
const { TrendAnalyzer } = require('../lib/trend-analyzer')
const { notificationService } = require('../lib/notification')

const prisma = new PrismaClient()

// Create queues
const trendUpdateQueue = new Queue('trend-update', process.env.REDIS_URL)
const alertCheckQueue = new Queue('alert-check', process.env.REDIS_URL)
const digestQueue = new Queue('daily-digest', process.env.REDIS_URL)

// Process trend updates
trendUpdateQueue.process(async (job) => {
  const { type, id } = job.data
  console.log(`Processing trend update for ${type}: ${id}`)

  try {
    switch (type) {
      case 'hashtag':
        await updateHashtagTrend(id)
        break
      case 'sound':
        await updateSoundTrend(id)
        break
      case 'creator':
        await updateCreatorTrend(id)
        break
    }
  } catch (error) {
    console.error(`Failed to update ${type} ${id}:`, error)
    throw error
  }
})

// Update hashtag trends
async function updateHashtagTrend(hashtagId) {
  const hashtag = await prisma.hashtag.findUnique({
    where: { id: hashtagId },
  })

  if (!hashtag) return

  // Fetch latest data from TikTok API
  const details = await tiktokApi.getHashtagDetails(hashtag.name)
  if (!details) return

  // Calculate metrics
  const previousTrend = await prisma.hashtagTrend.findFirst({
    where: { hashtagId },
    orderBy: { timestamp: 'desc' },
  })

  const growthRate = previousTrend
    ? TrendAnalyzer.calculateGrowthRate(
        details.stats?.videoCount || 0,
        Number(previousTrend.videoCount)
      )
    : 0

  // Get historical data for velocity calculation
  const historicalData = await prisma.hashtagTrend.findMany({
    where: {
      hashtagId,
      timestamp: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    select: {
      viewCount: true,
      timestamp: true,
    },
    orderBy: { timestamp: 'asc' },
  })

  const velocity = TrendAnalyzer.calculateVelocity(
    historicalData.map((d) => ({
      value: Number(d.viewCount),
      timestamp: d.timestamp,
    }))
  )

  const trendScore = TrendAnalyzer.calculateTrendScore({
    viewCount: BigInt(details.stats?.viewCount || 0),
    growthRate,
    velocity,
  })

  // Create new trend record
  await prisma.hashtagTrend.create({
    data: {
      hashtagId,
      videoCount: details.stats?.videoCount || 0,
      viewCount: BigInt(details.stats?.viewCount || 0),
      likeCount: BigInt(0),
      shareCount: BigInt(0),
      commentCount: BigInt(0),
      growthRate,
      velocity,
      trendScore,
    },
  })

  // Update hashtag
  await prisma.hashtag.update({
    where: { id: hashtagId },
    data: {
      videoCount: details.stats?.videoCount || 0,
      viewCount: BigInt(details.stats?.viewCount || 0),
      lastUpdatedAt: new Date(),
    },
  })

  console.log(`Updated hashtag trend: ${hashtag.name}`)
}

// Update sound trends
async function updateSoundTrend(soundId) {
  const sound = await prisma.sound.findUnique({
    where: { id: soundId },
  })

  if (!sound) return

  const details = await tiktokApi.getSoundDetails(sound.tiktokId)
  if (!details) return

  const previousTrend = await prisma.soundTrend.findFirst({
    where: { soundId },
    orderBy: { timestamp: 'desc' },
  })

  const growthRate = previousTrend
    ? TrendAnalyzer.calculateGrowthRate(
        details.stats?.videoCount || 0,
        Number(previousTrend.videoCount)
      )
    : 0

  const historicalData = await prisma.soundTrend.findMany({
    where: {
      soundId,
      timestamp: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    select: {
      videoCount: true,
      timestamp: true,
    },
    orderBy: { timestamp: 'asc' },
  })

  const velocity = TrendAnalyzer.calculateVelocity(
    historicalData.map((d) => ({
      value: d.videoCount,
      timestamp: d.timestamp,
    }))
  )

  const trendScore = TrendAnalyzer.calculateTrendScore({
    viewCount: BigInt(details.stats?.videoCount || 0),
    growthRate,
    velocity,
  })

  await prisma.soundTrend.create({
    data: {
      soundId,
      videoCount: details.stats?.videoCount || 0,
      viewCount: BigInt(details.stats?.playCount || 0),
      growthRate,
      velocity,
      trendScore,
    },
  })

  await prisma.sound.update({
    where: { id: soundId },
    data: {
      videoCount: details.stats?.videoCount || 0,
      lastUpdatedAt: new Date(),
    },
  })

  console.log(`Updated sound trend: ${sound.title}`)
}

// Update creator trends
async function updateCreatorTrend(creatorId) {
  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
  })

  if (!creator) return

  const userInfo = await tiktokApi.getUserInfo(creator.username)
  if (!userInfo) return

  const previousTrend = await prisma.creatorTrend.findFirst({
    where: { creatorId },
    orderBy: { timestamp: 'desc' },
  })

  const growthRate = previousTrend
    ? TrendAnalyzer.calculateGrowthRate(
        userInfo.stats?.followerCount || 0,
        previousTrend.followerCount
      )
    : 0

  const engagementRate = TrendAnalyzer.calculateEngagementRate(
    BigInt(userInfo.stats?.heartCount || 0),
    BigInt(0),
    BigInt(0),
    BigInt(userInfo.stats?.videoCount || 0)
  )

  const trendScore = TrendAnalyzer.calculateTrendScore({
    viewCount: BigInt(userInfo.stats?.followerCount || 0),
    growthRate,
    velocity: 0,
    engagementRate,
  })

  await prisma.creatorTrend.create({
    data: {
      creatorId,
      followerCount: userInfo.stats?.followerCount || 0,
      videoCount: userInfo.stats?.videoCount || 0,
      totalViews: BigInt(userInfo.stats?.videoCount || 0),
      totalLikes: BigInt(userInfo.stats?.heartCount || 0),
      growthRate,
      engagementRate,
      trendScore,
    },
  })

  await prisma.creator.update({
    where: { id: creatorId },
    data: {
      followerCount: userInfo.stats?.followerCount || 0,
      videoCount: userInfo.stats?.videoCount || 0,
      likeCount: BigInt(userInfo.stats?.heartCount || 0),
      lastUpdatedAt: new Date(),
    },
  })

  console.log(`Updated creator trend: ${creator.username}`)
}

// Process alert checks
alertCheckQueue.process(async (job) => {
  console.log('Checking trend alerts...')

  try {
    const activeAlerts = await prisma.trendAlert.findMany({
      where: { isActive: true },
      include: {
        user: {
          include: { preferences: true },
        },
        hashtag: true,
        sound: true,
        creator: true,
      },
    })

    for (const alert of activeAlerts) {
      await checkAlert(alert)
    }

    console.log(`Checked ${activeAlerts.length} alerts`)
  } catch (error) {
    console.error('Failed to check alerts:', error)
    throw error
  }
})

// Check individual alert
async function checkAlert(alert) {
  let shouldTrigger = false
  let trendData = null

  switch (alert.type) {
    case 'HASHTAG':
      if (alert.hashtagId) {
        const trend = await prisma.hashtagTrend.findFirst({
          where: { hashtagId: alert.hashtagId },
          orderBy: { timestamp: 'desc' },
          include: { hashtag: true },
        })
        if (trend && Number(trend.viewCount) >= alert.threshold) {
          shouldTrigger = true
          trendData = {
            type: 'Hashtag',
            name: trend.hashtag.displayName,
            metric: 'View Count',
            currentValue: Number(trend.viewCount),
            threshold: alert.threshold,
          }
        }
      }
      break

    case 'SOUND':
      if (alert.soundId) {
        const trend = await prisma.soundTrend.findFirst({
          where: { soundId: alert.soundId },
          orderBy: { timestamp: 'desc' },
          include: { sound: true },
        })
        if (trend && trend.videoCount >= alert.threshold) {
          shouldTrigger = true
          trendData = {
            type: 'Sound',
            name: trend.sound.title,
            metric: 'Video Count',
            currentValue: trend.videoCount,
            threshold: alert.threshold,
          }
        }
      }
      break

    case 'CREATOR':
      if (alert.creatorId) {
        const trend = await prisma.creatorTrend.findFirst({
          where: { creatorId: alert.creatorId },
          orderBy: { timestamp: 'desc' },
          include: { creator: true },
        })
        if (trend && trend.followerCount >= alert.threshold) {
          shouldTrigger = true
          trendData = {
            type: 'Creator',
            name: trend.creator.username,
            metric: 'Follower Count',
            currentValue: trend.followerCount,
            threshold: alert.threshold,
          }
        }
      }
      break
  }

  if (shouldTrigger && trendData) {
    await notificationService.sendTrendAlert(alert.userId, alert.id, trendData)
  }
}

// Process daily digests
digestQueue.process(async (job) => {
  console.log('Sending daily digests...')

  try {
    const users = await prisma.user.findMany({
      where: {
        preferences: {
          dailyDigest: true,
        },
      },
      include: { preferences: true },
    })

    for (const user of users) {
      await notificationService.sendDailyDigest(user.id)
    }

    console.log(`Sent digests to ${users.length} users`)
  } catch (error) {
    console.error('Failed to send digests:', error)
    throw error
  }
})

// Schedule recurring jobs
async function scheduleJobs() {
  // Update trends every 5 minutes
  await trendUpdateQueue.add(
    'update-all-trends',
    {},
    {
      repeat: { cron: '*/5 * * * *' },
    }
  )

  // Check alerts every minute
  await alertCheckQueue.add(
    'check-alerts',
    {},
    {
      repeat: { cron: '* * * * *' },
    }
  )

  // Send daily digest at 9 AM
  await digestQueue.add(
    'daily-digest',
    {},
    {
      repeat: { cron: '0 9 * * *' },
    }
  )

  console.log('Scheduled all jobs')
}

// Start worker
if (require.main === module) {
  scheduleJobs()
    .then(() => {
      console.log('Worker started successfully')
    })
    .catch((error) => {
      console.error('Failed to start worker:', error)
      process.exit(1)
    })
}

module.exports = {
  trendUpdateQueue,
  alertCheckQueue,
  digestQueue,
}
