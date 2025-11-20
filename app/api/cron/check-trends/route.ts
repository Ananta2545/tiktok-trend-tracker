import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmailNotification } from '@/lib/email'
import { sendWebhookNotification } from '@/lib/webhook'

// This endpoint should be called by a cron job (e.g., every hour)
// or triggered manually for testing

export async function POST(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Checking trends for alerts...')

    // Get all active alerts with user preferences
    const alerts = await prisma.trendAlert.findMany({
      where: { isActive: true },
      include: {
        user: {
          include: {
            preferences: true,
          },
        },
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
      try {
        let triggered = false
        let notificationData: any = {}

        // Check hashtag alerts
        if (alert.hashtag && alert.hashtag.trends.length >= 2) {
          const [latest, previous] = alert.hashtag.trends
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
          const [latest, previous] = alert.sound.trends
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
          const [latest, previous] = alert.creator.trends
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

        // Send notifications if triggered
        if (triggered) {
          const title = `🚀 Alert: ${notificationData.name} is trending!`
          const message = `${notificationData.name} has reached ${notificationData.growth.toFixed(1)}% growth, exceeding your ${notificationData.threshold}% threshold!`

          // Create notification in database
          const notification = await prisma.notification.create({
            data: {
              userId: alert.userId,
              alertId: alert.id,
              type: 'TREND_ALERT',
              title,
              message,
              data: notificationData,
              read: false,
            },
          })

          // Send email if enabled
          if (alert.user.preferences?.emailNotifications && alert.user.email) {
            try {
              await sendEmailNotification({
                to: alert.user.email,
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
              console.log(`✉️  Email sent to ${alert.user.email}`)
            } catch (emailError) {
              console.error('Email send failed:', emailError)
            }
          }

          // Send webhook if enabled
          if (alert.user.preferences?.webhookNotifications && alert.user.preferences.webhookUrl) {
            try {
              await sendWebhookNotification(alert.user.preferences.webhookUrl, {
                type: notificationData.type,
                title,
                message,
                data: notificationData,
                timestamp: new Date().toISOString(),
              })
              console.log(`🪝 Webhook sent to ${alert.user.preferences.webhookUrl}`)
            } catch (webhookError) {
              console.error('Webhook send failed:', webhookError)
            }
          }

          // Update alert last triggered time
          await prisma.trendAlert.update({
            where: { id: alert.id },
            data: { lastTriggered: new Date() },
          })

          notificationsSent++
          results.push({
            alertId: alert.id,
            userId: alert.userId,
            triggered: true,
            data: notificationData,
          })
        }
      } catch (alertError) {
        console.error(`Error processing alert ${alert.id}:`, alertError)
        results.push({
          alertId: alert.id,
          error: alertError instanceof Error ? alertError.message : 'Unknown error',
        })
      }
    }

    console.log(`✅ Trend check complete. ${notificationsSent} notifications sent.`)

    return NextResponse.json({
      success: true,
      alertsChecked: alerts.length,
      notificationsSent,
      results,
    })
  } catch (error) {
    console.error('Error checking trends:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check trends' },
      { status: 500 }
    )
  }
}

// Allow manual trigger via GET for testing
export async function GET() {
  return NextResponse.json({
    message: 'Trend checker endpoint',
    usage: 'POST with Authorization: Bearer YOUR_CRON_SECRET',
    note: 'This should be called by a cron job every hour to check trends',
  })
}
