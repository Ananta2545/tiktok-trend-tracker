import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
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

    const data = await request.json()
    const { type, itemId, threshold, condition } = data

    let alertData: any = {
      userId: user.id,
      type: type.toUpperCase(),
      name: data.name || 'Alert',
      threshold: parseFloat(threshold),
      condition: condition || 'GREATER_THAN',
      isActive: true,
    }

    // Link to specific item based on type
    if (type === 'HASHTAG' || type === 'hashtag') {
      alertData.hashtagId = itemId
    } else if (type === 'SOUND' || type === 'sound') {
      alertData.soundId = itemId
    } else if (type === 'CREATOR' || type === 'creator') {
      alertData.creatorId = itemId
    }

    const alert = await prisma.trendAlert.create({
      data: alertData,
    })

    return NextResponse.json(alert)
  } catch (error) {
    console.error('Create alert error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
