import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmailNotification } from '@/lib/email'

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

    // Get active alerts for this user
    const alerts = await prisma.trendAlert.findMany({
      where: { 
        userId: user.id,
        isActive: true 
      },
      include: {
        hashtag: {
          include: {
            trends: {
              orderBy: { timestamp: 'desc' },
              take: 2,
            },
          },
        },
        sound: {
          include: {
            trends: {
              orderBy: { timestamp: 'desc' },
              take: 2,
            },
          },
        },
        creator: {
          include: {
            trends: {
              orderBy: { timestamp: 'desc' },
              take: 2,
            },
          },
        },
      },
    })

    let notificationsSent = 0
    const results = []

    for (const alert of alerts) {
      let triggered = false
      let notificationData: any = {}

      // Check hashtag alerts
      if (alert.hashtag && alert.hashtag.trends.length >= 2) {
        const [latest] = alert.hashtag.trends
        const growthRate = latest.growthRate || 0

        if (growthRate >= alert.threshold) {
          triggered = true
          notificationData = {
            type: 'hashtag',
            name: alert.hashtag.displayName,
            views: latest.viewCount,
            growth: growthRate,
            videos: latest.videoCount,
            threshold: alert.threshold,
          }
        }
      }

      // Check sound alerts
      if (alert.sound && alert.sound.trends.length >= 2) {
        const [latest] = alert.sound.trends
        const growthRate = latest.growthRate || 0

        if (growthRate >= alert.threshold) {
          triggered = true
          notificationData = {
            type: 'sound',
            name: alert.sound.title,
            views: latest.viewCount,
            growth: growthRate,
            videos: latest.videoCount,
            threshold: alert.threshold,
          }
        }
      }

      // Check creator alerts
      if (alert.creator && alert.creator.trends.length >= 2) {
        const [latest] = alert.creator.trends
        const growthRate = latest.growthRate || 0

        if (growthRate >= alert.threshold) {
          triggered = true
          notificationData = {
            type: 'creator',
            name: alert.creator.nickname,
            followers: latest.followerCount,
            growth: growthRate,
            videos: latest.videoCount,
            threshold: alert.threshold,
          }
        }
      }

      if (triggered) {
        const title = `🚀 Alert: ${notificationData.name} is trending!`
        const message = `${notificationData.name} has ${notificationData.growth.toFixed(1)}% growth, exceeding your ${notificationData.threshold}% threshold!`

        // Create notification
        const notification = await prisma.notification.create({
          data: {
            userId: user.id,
            alertId: alert.id,
            type: 'TREND_ALERT',
            title,
            message,
            data: notificationData,
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
              type: notificationData.type,
              metrics: {
                views: notificationData.views,
                growth: notificationData.growth,
                videos: notificationData.videos,
                followers: notificationData.followers,
              },
            })
            console.log(`✉️ Email sent to ${user.email}`)
          } catch (emailError) {
            console.error('Email send failed:', emailError)
          }
        }

        // Update alert
        await prisma.trendAlert.update({
          where: { id: alert.id },
          data: { lastTriggered: new Date() },
        })

        notificationsSent++
        results.push({
          alertId: alert.id,
          triggered: true,
          data: notificationData,
        })
      }
    }

    return NextResponse.json({
      success: true,
      alertsChecked: alerts.length,
      notificationsSent,
      results,
      message: notificationsSent > 0 
        ? `${notificationsSent} notification(s) sent!` 
        : 'No alerts triggered. Your trends are being monitored.'
    })
  } catch (error) {
    console.error('Error checking alerts:', error)
    return NextResponse.json(
      { error: 'Failed to check alerts' },
      { status: 500 }
    )
  }
}
