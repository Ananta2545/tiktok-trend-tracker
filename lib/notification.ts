import nodemailer from 'nodemailer'
import { prisma } from './prisma'
import { emitUserAlert } from './socket'

class NotificationService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        html,
      })
      console.log(`Email sent to ${to}`)
    } catch (error) {
      console.error('Failed to send email:', error)
      throw error
    }
  }

  async createNotification(
    userId: string,
    type: 'TREND_ALERT' | 'DAILY_DIGEST' | 'SYSTEM',
    title: string,
    message: string,
    data?: any,
    alertId?: string
  ) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
        alertId,
      },
    })

    // Emit real-time notification
    await emitUserAlert(userId, notification)

    return notification
  }

  async sendTrendAlert(
    userId: string,
    alertId: string,
    trendData: {
      type: string
      name: string
      metric: string
      currentValue: number
      threshold: number
    }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    })

    if (!user) return

    const title = `🔥 Trend Alert: ${trendData.name}`
    const message = `${trendData.metric} reached ${trendData.currentValue.toLocaleString()} (threshold: ${trendData.threshold.toLocaleString()})`

    // Create notification
    await this.createNotification(
      userId,
      'TREND_ALERT',
      title,
      message,
      trendData,
      alertId
    )

    // Send email if enabled
    if (user.preferences?.emailNotifications && user.email) {
      const emailHtml = this.generateTrendAlertEmail(trendData)
      await this.sendEmail(user.email, title, emailHtml)
    }

    // Send webhook if enabled
    if (user.preferences?.webhookNotifications && user.preferences.webhookUrl) {
      await this.sendWebhook(user.preferences.webhookUrl, {
        event: 'trend.alert',
        userId,
        alertId,
        data: trendData,
      })
    }

    // Update alert last triggered time
    await prisma.trendAlert.update({
      where: { id: alertId },
      data: { lastTriggered: new Date() },
    })
  }

  async sendDailyDigest(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    })

    if (!user?.preferences?.dailyDigest || !user.email) return

    // Get top trends from the last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const topHashtags = await prisma.hashtagTrend.findMany({
      where: {
        timestamp: { gte: last24Hours },
      },
      include: { hashtag: true },
      orderBy: { trendScore: 'desc' },
      take: 10,
      distinct: ['hashtagId'],
    })

    const topSounds = await prisma.soundTrend.findMany({
      where: {
        timestamp: { gte: last24Hours },
      },
      include: { sound: true },
      orderBy: { trendScore: 'desc' },
      take: 10,
      distinct: ['soundId'],
    })

    const topCreators = await prisma.creatorTrend.findMany({
      where: {
        timestamp: { gte: last24Hours },
      },
      include: { creator: true },
      orderBy: { trendScore: 'desc' },
      take: 10,
      distinct: ['creatorId'],
    })

    const digestData = {
      topHashtags,
      topSounds,
      topCreators,
      date: new Date().toLocaleDateString(),
    }

    const title = `📊 Your Daily TikTok Trends Digest`
    const message = `Top trends from the last 24 hours`

    // Create notification
    await this.createNotification(
      userId,
      'DAILY_DIGEST',
      title,
      message,
      digestData
    )

    // Send email
    const emailHtml = this.generateDailyDigestEmail(digestData)
    await this.sendEmail(user.email, title, emailHtml)
  }

  async sendWebhook(url: string, payload: any) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': process.env.WEBHOOK_SECRET || '',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`)
      }

      console.log(`Webhook sent to ${url}`)
    } catch (error) {
      console.error('Failed to send webhook:', error)
    }
  }

  private generateTrendAlertEmail(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .metric { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔥 Trend Alert</h1>
            </div>
            <div class="content">
              <h2>${data.name}</h2>
              <div class="metric">
                <p><strong>${data.metric}:</strong> ${data.currentValue.toLocaleString()}</p>
                <p><strong>Threshold:</strong> ${data.threshold.toLocaleString()}</p>
                <p><strong>Type:</strong> ${data.type}</p>
              </div>
              <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">View Dashboard</a>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private generateDailyDigestEmail(data: any): string {
    const hashtagsHtml = data.topHashtags
      .map(
        (t: any) => `
        <li>
          <strong>#${t.hashtag.displayName}</strong><br/>
          Views: ${Number(t.viewCount).toLocaleString()} | 
          Score: ${t.trendScore}
        </li>
      `
      )
      .join('')

    const soundsHtml = data.topSounds
      .map(
        (t: any) => `
        <li>
          <strong>${t.sound.title}</strong> by ${t.sound.author}<br/>
          Videos: ${t.videoCount.toLocaleString()} | 
          Score: ${t.trendScore}
        </li>
      `
      )
      .join('')

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .section { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; }
            ul { list-style: none; padding: 0; }
            li { padding: 10px 0; border-bottom: 1px solid #eee; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Daily Trends Digest</h1>
              <p>${data.date}</p>
            </div>
            <div class="content">
              <div class="section">
                <h2>🔥 Top Hashtags</h2>
                <ul>${hashtagsHtml}</ul>
              </div>
              <div class="section">
                <h2>🎵 Top Sounds</h2>
                <ul>${soundsHtml}</ul>
              </div>
              <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">View Full Dashboard</a>
            </div>
          </div>
        </body>
      </html>
    `
  }
}

export const notificationService = new NotificationService()
