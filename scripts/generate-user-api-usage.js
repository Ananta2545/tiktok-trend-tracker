require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function generateUserAPIUsage() {
  try {
    // Get the user's email from command line argument
    const userEmail = process.argv[2]
    
    if (!userEmail) {
      console.log('❌ Please provide a user email as argument')
      console.log('Usage: node scripts/generate-user-api-usage.js user@example.com')
      process.exit(1)
    }

    console.log(`🔍 Looking for user: ${userEmail}`)

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    })

    if (!user) {
      console.log('❌ User not found!')
      console.log('\nAvailable users:')
      const users = await prisma.user.findMany({
        select: { email: true, name: true },
      })
      users.forEach(u => console.log(`   - ${u.email} (${u.name})`))
      process.exit(1)
    }

    console.log(`✓ Found user: ${user.name} (${user.email})`)
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
      '/api/user/preferences',
      '/api/rate-limit',
    ]

    const methods = ['GET', 'GET', 'GET', 'GET', 'POST', 'PUT', 'DELETE']
    const statusCodes = [200, 200, 200, 200, 200, 201, 304, 400, 404, 500]

    // Generate data for last 30 days
    const records = []
    for (let day = 0; day < 30; day++) {
      const dayDate = new Date(now.getTime() - day * 24 * 60 * 60 * 1000)
      
      // Generate 30-80 calls per day (more recent = more calls)
      const callsPerDay = Math.max(30, 80 - day * 2)
      
      for (let i = 0; i < callsPerDay; i++) {
        const randomHour = Math.floor(Math.random() * 24)
        const randomMinute = Math.floor(Math.random() * 60)
        const randomSecond = Math.floor(Math.random() * 60)
        const timestamp = new Date(dayDate)
        timestamp.setHours(randomHour, randomMinute, randomSecond, 0)

        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
        const method = methods[Math.floor(Math.random() * methods.length)]
        const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)]
        
        // Response time varies by endpoint and status
        let responseTime
        if (statusCode >= 500) {
          responseTime = 2000 + Math.floor(Math.random() * 3000) // 2-5s for errors
        } else if (statusCode >= 400) {
          responseTime = 100 + Math.floor(Math.random() * 200) // 100-300ms for client errors
        } else {
          responseTime = 50 + Math.floor(Math.random() * 450) // 50-500ms for success
        }

        records.push({
          endpoint,
          method,
          statusCode,
          responseTime,
          timestamp,
          userId: user.id,
        })
      }
    }

    // Insert in batches
    console.log(`📊 Inserting ${records.length} API usage records for user ${user.name}...`)
    
    for (let i = 0; i < records.length; i += 100) {
      const batch = records.slice(i, i + 100)
      await prisma.apiUsage.createMany({
        data: batch,
      })
      process.stdout.write(`\r✓ Inserted ${Math.min(i + 100, records.length)}/${records.length}`)
    }
    console.log('\n')

    console.log('✅ API usage data generated successfully!')

    // Show summary
    const total = await prisma.apiUsage.count({ where: { userId: user.id } })
    const last24h = await prisma.apiUsage.count({
      where: { 
        userId: user.id,
        timestamp: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    })
    const last7d = await prisma.apiUsage.count({
      where: { 
        userId: user.id,
        timestamp: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    })
    const last30d = await prisma.apiUsage.count({
      where: { 
        userId: user.id,
        timestamp: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
    })

    const successRate = await prisma.apiUsage.count({
      where: { 
        userId: user.id,
        statusCode: { gte: 200, lt: 300 },
      },
    })

    const avgResponse = await prisma.apiUsage.aggregate({
      where: { userId: user.id },
      _avg: { responseTime: true },
    })

    console.log(`\n📈 Summary for ${user.name}:`)
    console.log(`   Total API calls: ${total}`)
    console.log(`   Last 24 hours: ${last24h}`)
    console.log(`   Last 7 days: ${last7d}`)
    console.log(`   Last 30 days: ${last30d}`)
    console.log(`   Success rate: ${((successRate / total) * 100).toFixed(1)}%`)
    console.log(`   Avg response time: ${Math.round(avgResponse._avg.responseTime)}ms`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

generateUserAPIUsage()
