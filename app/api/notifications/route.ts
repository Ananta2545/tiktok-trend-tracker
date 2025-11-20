import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmailNotification } from '@/lib/email'
import { sendWebhookNotification } from '@/lib/webhook'

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

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { sentAt: 'desc' },
      take: 50,
    })

    const formatted = notifications.map((n) => {
      const data = n.data as any
      return {
        id: n.id,
        type: data?.type || 'trend',
        title: n.title,
        message: n.message,
        metrics: {
          views: data?.views || 0,
          growth: data?.growth || 0,
          videos: data?.videos,
          followers: data?.followers,
        },
        read: n.read,
        createdAt: n.sentAt.toISOString(),
      }
    })

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { preferences: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { type, title, message, data } = body

    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type,
        title,
        message,
        data,
        read: false,
      },
    })

    // Send email if enabled
    if (user.preferences?.emailNotifications && user.email) {
      try {
        await sendEmailNotification({
          to: user.email,
          subject: title,
          title,
          message,
          type: type,
          metrics: data,
        })
      } catch (emailError) {
        console.error('Email send failed:', emailError)
        // Don't fail the whole request if email fails
      }
    }

    // Send webhook if enabled
    if (user.preferences?.webhookNotifications && user.preferences.webhookUrl) {
      try {
        await sendWebhookNotification(
          user.preferences.webhookUrl,
          { type, title, message, data, timestamp: new Date().toISOString() }
        )
      } catch (webhookError) {
        console.error('Webhook send failed:', webhookError)
        // Don't fail the whole request if webhook fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      notification,
      emailSent: user.preferences?.emailNotifications && user.email,
      webhookSent: user.preferences?.webhookNotifications && !!user.preferences.webhookUrl,
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}
