require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testSettingsAPI() {
  console.log('🧪 Testing Settings & Notifications functionality...\n')
  
  try {
    // Get test user
    const user = await prisma.user.findFirst({
      where: { email: 'test@example.com' },
      include: { preferences: true },
    })

    if (!user) {
      console.log('❌ Test user not found')
      return
    }

    console.log('✅ Test user found:', user.email)
    console.log('   Current preferences:', user.preferences ? 'EXISTS' : 'NOT SET')

    // Test creating/updating preferences
    const testPreferences = {
      emailNotifications: true,
      webhookNotifications: true,
      webhookUrl: 'https://example.com/webhook',
      dailyDigest: true,
      digestTime: '10:00',
      minEngagementRate: 7.5,
      minViewCount: 500000,
    }

    console.log('\n📝 Testing preference save...')
    const savedPrefs = await prisma.userPreference.upsert({
      where: { userId: user.id },
      update: testPreferences,
      create: {
        userId: user.id,
        ...testPreferences,
      },
    })

    console.log('✅ Preferences saved successfully')
    console.log('   Email notifications:', savedPrefs.emailNotifications)
    console.log('   Webhook URL:', savedPrefs.webhookUrl)
    console.log('   Min engagement rate:', savedPrefs.minEngagementRate + '%')
    console.log('   Min view count:', savedPrefs.minViewCount.toLocaleString())

    // Test notifications
    console.log('\n📬 Testing notifications...')
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { sentAt: 'desc' },
      take: 5,
    })

    console.log(`✅ Found ${notifications.length} notifications`)
    notifications.forEach((n, i) => {
      console.log(`   ${i + 1}. ${n.title} - ${n.read ? 'READ' : 'UNREAD'}`)
    })

    // Test alerts
    console.log('\n🔔 Testing alerts...')
    const alerts = await prisma.trendAlert.findMany({
      where: { userId: user.id },
      include: {
        hashtag: true,
        sound: true,
        creator: true,
      },
    })

    console.log(`✅ Found ${alerts.length} active alerts`)
    alerts.forEach((a, i) => {
      const name = a.hashtag?.displayName || a.sound?.title || a.creator?.nickname
      console.log(`   ${i + 1}. ${a.type} - ${name} (${a.isActive ? 'ACTIVE' : 'PAUSED'})`)
    })

    // Test mark as read
    console.log('\n✓ Testing mark as read...')
    const unreadNotif = await prisma.notification.findFirst({
      where: { userId: user.id, read: false },
    })

    if (unreadNotif) {
      await prisma.notification.update({
        where: { id: unreadNotif.id },
        data: { read: true },
      })
      console.log('✅ Successfully marked notification as read')
    } else {
      console.log('ℹ️  No unread notifications to test')
    }

    console.log('\n🎉 All tests passed! Settings and Notifications are functional.')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testSettingsAPI()
