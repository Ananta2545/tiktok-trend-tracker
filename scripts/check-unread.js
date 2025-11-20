require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUnread() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'chatterjeeanata091@gmail.com' }
    })
    
    if (!user) {
      console.log('User not found')
      return
    }

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false }
    })

    console.log(`✅ Unread notifications: ${unreadCount}`)
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUnread()
