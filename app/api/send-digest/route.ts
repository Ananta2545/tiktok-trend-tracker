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

    if (!user || !user.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.preferences?.emailNotifications) {
      return NextResponse.json({ 
        error: 'Email notifications are disabled in your settings' 
      }, { status: 400 })
    }

    // Get minimum thresholds from user preferences
    const minEngagementRate = user.preferences?.minEngagementRate || 0
    const minViewCount = user.preferences?.minViewCount || 0

    // Get top trending items that meet minimum thresholds
    const topHashtags = await prisma.hashtag.findMany({
      where: {
        viewCount: { gte: minViewCount },
      },
      take: 20,
      orderBy: { viewCount: 'desc' },
      include: {
        trends: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    })

    // Filter by growth rate
    const filteredHashtags = topHashtags
      .filter(h => (h.trends[0]?.growthRate || 0) >= minEngagementRate)
      .slice(0, 5)

    const topSounds = await prisma.sound.findMany({
      take: 20,
      orderBy: { videoCount: 'desc' },
      include: {
        trends: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    })

    const filteredSounds = topSounds
      .filter(s => (s.trends[0]?.growthRate || 0) >= minEngagementRate)
      .slice(0, 5)

    const topCreators = await prisma.creator.findMany({
      take: 20,
      orderBy: { followerCount: 'desc' },
      include: {
        trends: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    })

    const filteredCreators = topCreators
      .filter(c => (c.trends[0]?.growthRate || 0) >= minEngagementRate)
      .slice(0, 5)

    // Check if we have enough trends to send
    if (filteredHashtags.length === 0 && filteredSounds.length === 0 && filteredCreators.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No trends found meeting your criteria (${minEngagementRate}% growth, ${minViewCount.toLocaleString()} views)`,
      }, { status: 400 })
    }

    // Build digest content with filtered items
    const digestContent = {
      hashtags: filteredHashtags.map(h => ({
        name: h.displayName,
        views: h.viewCount,
        videos: h.videoCount,
        growth: h.trends[0]?.growthRate || 0,
      })),
      sounds: filteredSounds.map(s => ({
        name: s.title,
        author: s.author,
        videos: s.videoCount,
        growth: s.trends[0]?.growthRate || 0,
      })),
      creators: filteredCreators.map(c => ({
        name: c.nickname,
        followers: c.followerCount,
        videos: c.videoCount,
        growth: c.trends[0]?.growthRate || 0,
      })),
    }

    // Create HTML digest
    const digestHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 20px; font-weight: bold; color: #667eea; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 5px; }
            .trend-item { background: #f9fafb; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #667eea; }
            .trend-name { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
            .trend-stats { display: flex; gap: 15px; font-size: 14px; color: #666; }
            .stat { display: flex; align-items: center; gap: 5px; }
            .growth-positive { color: #10b981; font-weight: bold; }
            .cta-button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; background: #f9fafb; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Daily Trend Digest</h1>
              <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div class="content">
              <p>Here's your daily summary of the hottest TikTok trends meeting your criteria (≥${minEngagementRate}% growth)!</p>
              
              ${digestContent.hashtags.length > 0 ? `
              <div class="section">
                <div class="section-title">🔥 Top Hashtags</div>
                ${digestContent.hashtags.map(h => `
                  <div class="trend-item">
                    <div class="trend-name">${h.name}</div>
                    <div class="trend-stats">
                      <span class="stat">👁️ ${(Number(h.views) / 1000000).toFixed(1)}M views</span>
                      <span class="stat">📹 ${h.videos.toLocaleString()} videos</span>
                      <span class="stat growth-positive">📈 ${h.growth.toFixed(1)}%</span>
                    </div>
                  </div>
                `).join('')}
              </div>
              ` : ''}

              ${digestContent.sounds.length > 0 ? `
              <div class="section">
                <div class="section-title">🎵 Top Sounds</div>
                ${digestContent.sounds.map(s => `
                  <div class="trend-item">
                    <div class="trend-name">${s.name}</div>
                    <div class="trend-stats">
                      <span class="stat">🎤 ${s.author}</span>
                      <span class="stat">📹 ${s.videos.toLocaleString()} videos</span>
                      <span class="stat growth-positive">📈 ${s.growth.toFixed(1)}%</span>
                    </div>
                  </div>
                `).join('')}
              </div>
              ` : ''}

              ${digestContent.creators.length > 0 ? `
              <div class="section">
                <div class="section-title">⭐ Top Creators</div>
                ${digestContent.creators.map(c => `
                  <div class="trend-item">
                    <div class="trend-name">${c.name}</div>
                    <div class="trend-stats">
                      <span class="stat">👥 ${(Number(c.followers) / 1000000).toFixed(1)}M followers</span>
                      <span class="stat">📹 ${c.videos.toLocaleString()} videos</span>
                      <span class="stat growth-positive">📈 ${c.growth.toFixed(1)}%</span>
                    </div>
                  </div>
                `).join('')}
              </div>
              ` : ''}

              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="cta-button">
                  View Full Dashboard
                </a>
              </center>
            </div>
            <div class="footer">
              <p>You're receiving this daily digest because it's enabled in your settings.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings">Manage Preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send digest email
    await sendEmailNotification({
      to: user.email,
      subject: `📊 Your Daily TikTok Trend Digest - ${new Date().toLocaleDateString()}`,
      title: '📊 Daily Trend Digest',
      message: `Your daily summary of trends with ≥${minEngagementRate}% growth`,
      type: 'hashtag',
      metrics: {
        views: Number(filteredHashtags[0]?.viewCount || 0),
        growth: filteredHashtags[0]?.trends[0]?.growthRate || 0,
      },
    })

    // Create notification record
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'DAILY_DIGEST',
        title: '📊 Daily Trend Digest Sent',
        message: 'Your daily summary has been sent to your email',
        data: { date: new Date().toISOString() },
        read: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Daily digest sent successfully!',
      emailTo: user.email,
      trendsIncluded: {
        hashtags: filteredHashtags.length,
        sounds: filteredSounds.length,
        creators: filteredCreators.length,
      },
      criteria: {
        minGrowthRate: minEngagementRate,
        minViewCount: minViewCount,
      },
    })
  } catch (error) {
    console.error('Error sending daily digest:', error)
    return NextResponse.json(
      { error: 'Failed to send daily digest' },
      { status: 500 }
    )
  }
}
