require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkChartData() {
  try {
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    const hashtagTrends = await prisma.hashtagTrend.findMany({
      where: {
        timestamp: { gte: last7Days },
      },
      include: {
        hashtag: true,
      },
      orderBy: [
        { timestamp: 'asc' },
      ],
      take: 100,
    })
    
    console.log('Sample Chart Data (first 10):')
    hashtagTrends.slice(0, 10).forEach(t => {
      console.log(`${t.timestamp.toISOString()} | ${t.hashtag.displayName} | Views: ${t.viewCount}`)
    })
    
    // Group by hashtag
    const grouped = {}
    hashtagTrends.forEach(t => {
      if (!grouped[t.hashtag.displayName]) {
        grouped[t.hashtag.displayName] = []
      }
      grouped[t.hashtag.displayName].push({
        timestamp: t.timestamp.toISOString(),
        views: t.viewCount.toString()
      })
    })
    
    console.log('\nGrouped by hashtag:')
    Object.keys(grouped).slice(0, 3).forEach(name => {
      console.log(`\n${name}: ${grouped[name].length} data points`)
      grouped[name].slice(0, 3).forEach(d => {
        console.log(`  ${d.timestamp} - ${d.views}`)
      })
    })
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error)
    await prisma.$disconnect()
  }
}

checkChartData()
