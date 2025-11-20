require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addUser() {
  const email = 'chatterjeeanata091@gmail.com'
  
  try {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (user) {
      console.log('✅ User already exists:', email)
      return
    }

    // Create user
    user = await prisma.user.create({
      data: {
        email,
        name: 'Anata Chatterjee',
        emailVerified: new Date(),
      },
    })

    console.log('✅ User created successfully:', email)
    console.log('   User ID:', user.id)

    // Create default preferences
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

    console.log('✅ Default preferences created')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

addUser()
