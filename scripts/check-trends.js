require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTrendData() {
  try {
    const hashtags = await prisma.hashtagTrend.count()
    const sounds = await prisma.soundTrend.count()
    const creators = await prisma.creatorTrend.count()
    
    console.log('Trend Records:')
    console.log('  HashtagTrends:', hashtags)
    console.log('  SoundTrends:', sounds)
    console.log('  CreatorTrends:', creators)
    
    if (hashtags > 0) {
      console.log('\nSample Hashtag Trends:')
      const sample = await prisma.hashtagTrend.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: { hashtag: true }
      })
      sample.forEach(t => {
        console.log(`  ${t.timestamp.toISOString()} - ${t.hashtag.displayName} - Views: ${t.viewCount}`)
      })
    }
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error)
    await prisma.$disconnect()
  }
}

checkTrendData()
