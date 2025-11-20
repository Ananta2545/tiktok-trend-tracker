require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function generateAPIUsageData() {
  try {
    console.log('🔄 Generating API usage data...')

    const now = new Date()
    const endpoints = [
      '/api/trends/hashtags',
      '/api/trends/sounds',
      '/api/trends/creators',
      '/api/charts/hashtags',
      '/api/charts/sounds',
      '/api/charts/creators',
      '/api/stats',
      '/api/notifications',
      '/api/alerts',
      '/api/user/preferences'
    ]

    const statusCodes = [200, 200, 200, 200, 200, 201, 304, 400, 500]

    // Generate data for last 7 days
    const records = []
    for (let day = 0; day < 7; day++) {
      const dayDate = new Date(now.getTime() - day * 24 * 60 * 60 * 1000)
      
      // Generate 20-50 calls per day
      const callsPerDay = 20 + Math.floor(Math.random() * 30)
      
      for (let i = 0; i < callsPerDay; i++) {
        const randomHour = Math.floor(Math.random() * 24)
        const randomMinute = Math.floor(Math.random() * 60)
        const timestamp = new Date(dayDate)
        timestamp.setHours(randomHour, randomMinute, 0, 0)

        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
        const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)]
        const responseTime = 50 + Math.floor(Math.random() * 450) // 50-500ms

        records.push({
          endpoint,
          method: 'GET',
          statusCode,
          responseTime,
          timestamp,
          userId: null,
        })
      }
    }

    // Insert in batches
    console.log(`📊 Inserting ${records.length} API usage records...`)
    
    for (let i = 0; i < records.length; i += 100) {
      const batch = records.slice(i, i + 100)
      await prisma.apiUsage.createMany({
        data: batch,
      })
      console.log(`✓ Inserted ${Math.min(i + 100, records.length)}/${records.length}`)
    }

    console.log('✅ API usage data generated successfully!')

    // Show summary
    const total = await prisma.apiUsage.count()
    const last24h = await prisma.apiUsage.count({
      where: { timestamp: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
    })

    console.log(`\n📈 Summary:`)
    console.log(`   Total API calls: ${total}`)
    console.log(`   Last 24 hours: ${last24h}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

generateAPIUsageData()
