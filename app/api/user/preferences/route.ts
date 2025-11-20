import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { preferences: true },
    })

    if (!user) {
      // Create user if doesn't exist (for OAuth users)
      const newUser = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email.split('@')[0],
          emailVerified: new Date(),
        },
      })
      
      // Fetch user with preferences
      user = await prisma.user.findUnique({
        where: { id: newUser.id },
        include: { preferences: true },
      })
    }

    // Return preferences or defaults
    const preferences = user?.preferences || {
      emailNotifications: true,
      webhookNotifications: false,
      webhookUrl: '',
      dailyDigest: true,
      digestTime: '09:00',
      minEngagementRate: 5.0,
      minViewCount: 100000,
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Get preferences error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user?.email)
    
    if (!session?.user?.email) {
      console.error('No session or email')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      console.error('User not found for email:', session.user.email)
      console.error('Creating user automatically...')
      // Create user if doesn't exist (for OAuth users)
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email.split('@')[0],
          emailVerified: new Date(),
        },
      })
      console.log('User created:', user.id)
    }

    const data = await request.json()
    console.log('Saving preferences:', data)

    const preferences = await prisma.userPreference.upsert({
      where: { userId: user.id },
      update: {
        emailNotifications: data.emailNotifications,
        webhookNotifications: data.webhookNotifications,
        webhookUrl: data.webhookUrl || '',
        dailyDigest: data.dailyDigest,
        digestTime: data.digestTime,
        minEngagementRate: data.minEngagementRate,
        minViewCount: data.minViewCount,
      },
      create: {
        userId: user.id,
        emailNotifications: data.emailNotifications,
        webhookNotifications: data.webhookNotifications,
        webhookUrl: data.webhookUrl || '',
        dailyDigest: data.dailyDigest,
        digestTime: data.digestTime,
        minEngagementRate: data.minEngagementRate,
        minViewCount: data.minViewCount,
      },
    })

    console.log('Preferences saved successfully')
    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Save preferences error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
