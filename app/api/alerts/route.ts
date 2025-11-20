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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const alerts = await prisma.trendAlert.findMany({
      where: { userId: user.id },
      include: {
        hashtag: true,
        sound: true,
        creator: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedAlerts = alerts.map((alert) => ({
      id: alert.id,
      type: alert.hashtag ? 'hashtag' : alert.sound ? 'sound' : 'creator',
      name: alert.hashtag?.displayName || alert.sound?.title || alert.creator?.nickname || 'Unknown',
      threshold: alert.threshold,
      active: alert.isActive,
      createdAt: alert.createdAt,
    }))

    return NextResponse.json(formattedAlerts)
  } catch (error) {
    console.error('Get alerts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
