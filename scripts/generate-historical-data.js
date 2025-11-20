require('dotenv/config')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function generateHistoricalData() {
  console.log('🕐 Generating 7 days of historical trend data...\n')
  
  const now = new Date()
  const DAYS = 7
  const INTERVALS_PER_DAY = 24 // Hourly data points
  
  // Get existing items
  const hashtags = await prisma.hashtag.findMany({ take: 50 })
  const sounds = await prisma.sound.findMany({ take: 20 })
  const creators = await prisma.creator.findMany({ take: 20 })
  
  console.log(`📊 Found ${hashtags.length} hashtags, ${sounds.length} sounds, ${creators.length} creators\n`)
  
  if (hashtags.length === 0 || sounds.length === 0 || creators.length === 0) {
    console.log('❌ No data found. Please run fetch-complete-data first.')
    return
  }
  
  let totalCreated = 0
  
  // Generate trends for each day and interval
  for (let day = DAYS; day >= 0; day--) {
    for (let hour = 0; hour < INTERVALS_PER_DAY; hour++) {
      const timestamp = new Date(now.getTime() - (day * 24 * 60 * 60 * 1000) - (hour * 60 * 60 * 1000))
      
      // Generate hashtag trends
      for (const hashtag of hashtags) {
        const baseViews = Number(hashtag.viewCount)
        const randomVariation = 1 + (Math.random() * 0.4 - 0.2) // ±20% variation
        const growthFactor = 1 + ((DAYS - day) * 0.05) // Gradual growth over time
        
        const viewCount = BigInt(Math.floor(baseViews * randomVariation * growthFactor))
        const videoCount = Math.floor(hashtag.videoCount * randomVariation * growthFactor)
        const likeCount = BigInt(Math.floor(Number(viewCount) * 0.08)) // 8% like rate
        const shareCount = BigInt(Math.floor(Number(viewCount) * 0.02)) // 2% share rate
        const commentCount = BigInt(Math.floor(Number(viewCount) * 0.015)) // 1.5% comment rate
        
        const growthRate = (Math.random() * 15) - 2.5 // -2.5% to 12.5%
        const velocity = Math.random() * 100
        const trendScore = Math.min(Math.floor(50 + velocity + growthRate * 2), 99)
        
        await prisma.hashtagTrend.create({
          data: {
            hashtagId: hashtag.id,
            timestamp,
            videoCount,
            viewCount,
            likeCount,
            shareCount,
            commentCount,
            growthRate,
            velocity,
            trendScore,
          },
        })
        totalCreated++
      }
      
      // Generate sound trends
      for (const sound of sounds) {
        const randomVariation = 1 + (Math.random() * 0.3 - 0.15)
        const growthFactor = 1 + ((DAYS - day) * 0.04)
        
        const videoCount = Math.floor(sound.videoCount * randomVariation * growthFactor)
        const viewCount = BigInt(Math.floor(videoCount * 50000 * randomVariation))
        const growthRate = (Math.random() * 12) - 2
        const velocity = Math.random() * 80
        const trendScore = Math.min(Math.floor(40 + velocity + growthRate * 2), 98)
        
        await prisma.soundTrend.create({
          data: {
            soundId: sound.id,
            timestamp,
            videoCount,
            viewCount,
            growthRate,
            velocity,
            trendScore,
          },
        })
        totalCreated++
      }
      
      // Generate creator trends
      for (const creator of creators) {
        const randomVariation = 1 + (Math.random() * 0.25 - 0.125)
        const growthFactor = 1 + ((DAYS - day) * 0.03)
        
        const followerCount = Math.floor(creator.followerCount * randomVariation * growthFactor)
        const videoCount = Math.floor(creator.videoCount * randomVariation * growthFactor)
        const totalViews = BigInt(Math.floor(videoCount * 100000 * randomVariation))
        const totalLikes = BigInt(Math.floor(Number(totalViews) * 0.07))
        const growthRate = (Math.random() * 10) - 1
        const engagementRate = 4 + (Math.random() * 8) // 4-12%
        const trendScore = Math.min(Math.floor(45 + engagementRate * 3 + growthRate * 2), 97)
        
        await prisma.creatorTrend.create({
          data: {
            creatorId: creator.id,
            timestamp,
            followerCount,
            videoCount,
            totalViews,
            totalLikes,
            growthRate,
            engagementRate,
            trendScore,
          },
        })
        totalCreated++
      }
      
      if (hour % 6 === 0) {
        console.log(`✅ Generated trends for ${timestamp.toLocaleString()}`)
      }
    }
  }
  
  console.log(`\n🎉 Successfully created ${totalCreated} trend data points!`)
  console.log(`   - ${hashtags.length * DAYS * INTERVALS_PER_DAY} hashtag trends`)
  console.log(`   - ${sounds.length * DAYS * INTERVALS_PER_DAY} sound trends`)
  console.log(`   - ${creators.length * DAYS * INTERVALS_PER_DAY} creator trends`)
}

generateHistoricalData()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
