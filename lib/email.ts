import * as nodemailer from 'nodemailer'

interface EmailNotification {
  to: string
  subject: string
  title: string
  message: string
  type: 'hashtag' | 'sound' | 'creator'
  metrics?: {
    views?: number
    growth?: number
    videos?: number
    followers?: number
  }
}

export async function sendEmailNotification(notification: EmailNotification) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert-badge { display: inline-block; padding: 5px 15px; background: #3b82f6; color: white; border-radius: 20px; font-size: 12px; margin-bottom: 10px; }
            .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
            .metric { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .metric-label { font-size: 12px; color: #6b7280; margin-bottom: 5px; }
            .metric-value { font-size: 24px; font-weight: bold; color: #1f2937; }
            .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🔔 TikTok Trend Alert</h1>
            </div>
            <div class="content">
              <span class="alert-badge">${notification.type.toUpperCase()} TRENDING</span>
              <h2>${notification.title}</h2>
              <p>${notification.message}</p>
              ${notification.metrics ? `
                <div class="metrics">
                  ${notification.metrics.views ? `
                    <div class="metric">
                      <div class="metric-label">Views</div>
                      <div class="metric-value">${notification.metrics.views.toLocaleString()}</div>
                    </div>
                  ` : ''}
                  ${notification.metrics.growth ? `
                    <div class="metric">
                      <div class="metric-label">Growth Rate</div>
                      <div class="metric-value">${notification.metrics.growth.toFixed(1)}%</div>
                    </div>
                  ` : ''}
                  ${notification.metrics.videos ? `
                    <div class="metric">
                      <div class="metric-label">Videos</div>
                      <div class="metric-value">${notification.metrics.videos.toLocaleString()}</div>
                    </div>
                  ` : ''}
                  ${notification.metrics.followers ? `
                    <div class="metric">
                      <div class="metric-label">Followers</div>
                      <div class="metric-value">${notification.metrics.followers.toLocaleString()}</div>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="cta-button">
                View Dashboard
              </a>
            </div>
            <div class="footer">
              <p>You're receiving this because you enabled email notifications for TikTok Trend Tracker.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings">Manage Preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `

    await transporter.sendMail({
      from: `"TikTok Trend Tracker" <${process.env.SMTP_USER}>`,
      to: notification.to,
      subject: notification.subject,
      html: htmlContent,
    })

    return { success: true }
  } catch (error) {
    console.error('Email notification error:', error)
    return { success: false, error }
  }
}
