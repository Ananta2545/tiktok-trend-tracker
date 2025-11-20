require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUser() {
  const email = 'chatterjeeanata091@gmail.com'
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { preferences: true },
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('✅ User found:')
    console.log('   ID:', user.id)
    console.log('   Email:', user.email)
    console.log('   Name:', user.name)
    console.log('   Created:', user.createdAt)
    console.log('   Has preferences:', !!user.preferences)

    if (!user.preferences) {
      console.log('\n📝 Creating default preferences...')
      const preferences = await prisma.userPreference.create({
        data: {
          userId: user.id,
          emailNotifications: true,
          webhookNotifications: false,
          webhookUrl: '',
          dailyDigest: true,
          digestTime: '09:00',
          minEngagementRate: 5.0,
          minViewCount: 100000,
        },
      })
      console.log('✅ Preferences created')
    } else {
      console.log('\n📋 Current preferences:')
      console.log('   Email notifications:', user.preferences.emailNotifications)
      console.log('   Webhook notifications:', user.preferences.webhookNotifications)
      console.log('   Daily digest:', user.preferences.dailyDigest)
      console.log('   Min engagement rate:', user.preferences.minEngagementRate + '%')
      console.log('   Min view count:', user.preferences.minViewCount.toLocaleString())
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
