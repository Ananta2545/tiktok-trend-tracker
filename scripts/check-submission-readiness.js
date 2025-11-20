require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDataCoverage() {
  try {
    console.log('📊 Checking 7-Day Data Coverage for Submission...\n')

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Check Hashtag Trends
    const hashtagTrends = await prisma.hashtagTrend.findMany({
      where: { timestamp: { gte: sevenDaysAgo } },
      include: { hashtag: true },
      orderBy: { timestamp: 'desc' },
      take: 10,
    })

    // Check Sound Trends
    const soundTrends = await prisma.soundTrend.findMany({
      where: { timestamp: { gte: sevenDaysAgo } },
      include: { sound: true },
      orderBy: { timestamp: 'desc' },
      take: 10,
    })

    // Check Creator Trends
    const creatorTrends = await prisma.creatorTrend.findMany({
      where: { timestamp: { gte: sevenDaysAgo } },
      include: { creator: true },
      orderBy: { timestamp: 'desc' },
      take: 10,
    })

    // Total counts
    const totalHashtagTrends = await prisma.hashtagTrend.count({
      where: { timestamp: { gte: sevenDaysAgo } },
    })
    const totalSoundTrends = await prisma.soundTrend.count({
      where: { timestamp: { gte: sevenDaysAgo } },
    })
    const totalCreatorTrends = await prisma.creatorTrend.count({
      where: { timestamp: { gte: sevenDaysAgo } },
    })

    // Get date range
    const oldestHashtag = await prisma.hashtagTrend.findFirst({
      orderBy: { timestamp: 'asc' },
    })
    const newestHashtag = await prisma.hashtagTrend.findFirst({
      orderBy: { timestamp: 'desc' },
    })

    // Check API usage
    const apiUsage = await prisma.apiUsage.count({
      where: { timestamp: { gte: sevenDaysAgo } },
    })

    // Check alerts
    const alerts = await prisma.trendAlert.findMany({
      include: { user: { select: { email: true } } },
    })

    // Check notifications
    const notifications = await prisma.notification.count({
      where: { sentAt: { gte: sevenDaysAgo } },
    })

    // Summary
    console.log('✅ DATA COVERAGE REPORT\n')
    console.log('📅 Date Range:')
    console.log(`   Oldest Data: ${oldestHashtag?.timestamp || 'N/A'}`)
    console.log(`   Newest Data: ${newestHashtag?.timestamp || 'N/A'}`)
    
    const daysCovered = oldestHashtag && newestHashtag 
      ? Math.ceil((newestHashtag.timestamp.getTime() - oldestHashtag.timestamp.getTime()) / (24 * 60 * 60 * 1000))
      : 0

    console.log(`   Days Covered: ${daysCovered} days`)
    
    if (daysCovered >= 7) {
      console.log('   ✅ MEETS 7-DAY REQUIREMENT')
    } else {
      console.log(`   ⚠️  ONLY ${daysCovered} DAYS - NEED ${7 - daysCovered} MORE DAYS`)
    }

    console.log('\n📈 Trend Data (Last 7 Days):')
    console.log(`   Hashtag Trends: ${totalHashtagTrends}`)
    console.log(`   Sound Trends: ${totalSoundTrends}`)
    console.log(`   Creator Trends: ${totalCreatorTrends}`)
    console.log(`   Total Trend Records: ${totalHashtagTrends + totalSoundTrends + totalCreatorTrends}`)

    console.log('\n🔔 Alert System:')
    console.log(`   Active Alerts: ${alerts.length}`)
    console.log(`   Notifications (7d): ${notifications}`)

    console.log('\n🌐 API Usage (7d):')
    console.log(`   Total API Calls: ${apiUsage}`)

    console.log('\n📝 Sample Hashtag Trends:')
    hashtagTrends.slice(0, 5).forEach(trend => {
      console.log(`   ${trend.timestamp.toISOString()} - #${trend.hashtag.name}`)
      console.log(`      Views: ${trend.viewCount}, Growth: ${trend.growthRate.toFixed(2)}%, Velocity: ${trend.velocity.toFixed(2)}`)
    })

    console.log('\n🎵 Sample Sound Trends:')
    soundTrends.slice(0, 5).forEach(trend => {
      console.log(`   ${trend.timestamp.toISOString()} - ${trend.sound.title}`)
      console.log(`      Videos: ${trend.videoCount}, Growth: ${trend.growthRate.toFixed(2)}%`)
    })

    console.log('\n👥 Sample Creator Trends:')
    creatorTrends.slice(0, 5).forEach(trend => {
      console.log(`   ${trend.timestamp.toISOString()} - @${trend.creator.username}`)
      console.log(`      Followers: ${trend.followerCount}, Growth: ${trend.growthRate.toFixed(2)}%`)
    })

    // Submission readiness
    console.log('\n\n🎯 SUBMISSION READINESS CHECK:')
    const checks = [
      { name: 'Has 7+ days of data', pass: daysCovered >= 7 },
      { name: 'Hashtag trends exist', pass: totalHashtagTrends > 0 },
      { name: 'Sound trends exist', pass: totalSoundTrends > 0 },
      { name: 'Creator trends exist', pass: totalCreatorTrends > 0 },
      { name: 'Alert system configured', pass: alerts.length > 0 },
      { name: 'API usage tracked', pass: apiUsage > 0 },
    ]

    checks.forEach(check => {
      console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`)
    })

    const allPassed = checks.every(c => c.pass)
    console.log('\n' + '='.repeat(60))
    if (allPassed) {
      console.log('✅ READY FOR SUBMISSION!')
    } else {
      console.log('⚠️  NEEDS ATTENTION BEFORE SUBMISSION')
    }
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkDataCoverage()
