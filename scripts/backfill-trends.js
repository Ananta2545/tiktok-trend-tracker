require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function backfillTrendHistory() {
  console.log('📊 Backfilling 7 days of trend history...\n')
  
  try {
    // Get existing items
    const hashtags = await prisma.hashtag.findMany({ take: 50, orderBy: { viewCount: 'desc' } })
    const sounds = await prisma.sound.findMany({ take: 30, orderBy: { videoCount: 'desc' } })
    const creators = await prisma.creator.findMany({ take: 30, orderBy: { followerCount: 'desc' } })
    
    console.log(`Found: ${hashtags.length} hashtags, ${sounds.length} sounds, ${creators.length} creators`)
    
    // Generate 7 days of data with 4 snapshots per day (every 6 hours)
    const now = new Date()
    const snapshotsPerDay = 4
    const totalDays = 7
    const totalSnapshots = totalDays * snapshotsPerDay
    
    let createdTrends = { hashtags: 0, sounds: 0, creators: 0 }
    
    // Create trend progression for each item
    for (let i = totalSnapshots - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 6 * 60 * 60 * 1000)) // 6 hours apart
      const progressFactor = (totalSnapshots - i) / totalSnapshots // 0 to 1
      
      console.log(`⏱️  Creating snapshots for ${timestamp.toISOString().split('T')[0]} ${timestamp.toTimeString().split(' ')[0]}`)
      
      // Hashtag trends - simulate growth
      for (const hashtag of hashtags) {
        const baseViews = Number(hashtag.viewCount)
        const baseVideos = hashtag.videoCount
        
        // Simulate realistic growth curve
        const growthVariance = 0.7 + (Math.random() * 0.6) // 0.7 to 1.3
        const viewCount = BigInt(Math.floor(baseViews * progressFactor * growthVariance))
        const videoCount = Math.floor(baseVideos * progressFactor * growthVariance)
        
        const trendScore = Math.min(100, Math.floor(40 + (progressFactor * 50) + (Math.random() * 10)))
        const growthRate = parseFloat((10 + (progressFactor * 40) + (Math.random() * 20)).toFixed(2))
        
        await prisma.hashtagTrend.create({
          data: {
            hashtagId: hashtag.id,
            viewCount: viewCount,
            videoCount: videoCount,
            likeCount: BigInt(Math.floor(Number(viewCount) * 0.05)), // ~5% engagement
            shareCount: BigInt(Math.floor(Number(viewCount) * 0.01)), // ~1% shares
            commentCount: BigInt(Math.floor(Number(viewCount) * 0.02)), // ~2% comments
            trendScore: trendScore,
            growthRate: growthRate,
            velocity: parseFloat((growthRate * 1.2).toFixed(2)),
            timestamp: timestamp,
          }
        })
        createdTrends.hashtags++
      }
      
      // Sound trends
      for (const sound of sounds) {
        const baseVideos = sound.videoCount
        const growthVariance = 0.7 + (Math.random() * 0.6)
        const videoCount = Math.floor(baseVideos * progressFactor * growthVariance)
        
        const trendScore = Math.min(100, Math.floor(40 + (progressFactor * 50) + (Math.random() * 10)))
        const growthRate = parseFloat((10 + (progressFactor * 40) + (Math.random() * 20)).toFixed(2))
        
        await prisma.soundTrend.create({
          data: {
            soundId: sound.id,
            videoCount: videoCount,
            viewCount: BigInt(videoCount * 10000), // Estimate views from video count
            trendScore: trendScore,
            growthRate: growthRate,
            velocity: parseFloat((growthRate * 1.2).toFixed(2)),
            timestamp: timestamp,
          }
        })
        createdTrends.sounds++
      }
      
      // Creator trends
      for (const creator of creators) {
        const baseFollowers = creator.followerCount
        const baseVideos = creator.videoCount
        const growthVariance = 0.7 + (Math.random() * 0.6)
        
        const followerCount = Math.floor(baseFollowers * progressFactor * growthVariance)
        const videoCount = Math.floor(baseVideos * progressFactor * growthVariance)
        
        const trendScore = Math.min(100, Math.floor(40 + (progressFactor * 50) + (Math.random() * 10)))
        const growthRate = parseFloat((10 + (progressFactor * 40) + (Math.random() * 20)).toFixed(2))
        const engagementRate = parseFloat((2 + (Math.random() * 8)).toFixed(2))
        
        await prisma.creatorTrend.create({
          data: {
            creatorId: creator.id,
            followerCount: followerCount,
            videoCount: videoCount,
            totalViews: BigInt(videoCount * 50000), // Estimate total views
            totalLikes: BigInt(Math.floor(Number(creator.likeCount) * progressFactor * growthVariance)),
            trendScore: trendScore,
            growthRate: growthRate,
            engagementRate: engagementRate,
            timestamp: timestamp,
          }
        })
        createdTrends.creators++
      }
      
      console.log(`   ✅ Created: ${hashtags.length} hashtag, ${sounds.length} sound, ${creators.length} creator trends`)
    }
    
    console.log(`\n🎉 Backfill complete!`)
    console.log(`   Total created: ${createdTrends.hashtags} hashtag trends, ${createdTrends.sounds} sound trends, ${createdTrends.creators} creator trends`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

backfillTrendHistory()
