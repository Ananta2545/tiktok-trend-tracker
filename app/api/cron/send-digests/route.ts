import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmailNotification } from '@/lib/email'

// This API route should be called every minute by a cron job or external scheduler
// It checks if any users need their daily digest sent based on their digest time

export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    console.log(`🕐 Checking for scheduled digests at ${currentTime}`)

    // Find users with daily digest enabled at current time
    const usersToSendDigest = await prisma.userPreference.findMany({
      where: {
        dailyDigest: true,
        digestTime: currentTime,
      },
      include: {
        user: true,
      },
    })

    console.log(`📧 Found ${usersToSendDigest.length} users scheduled for digest at ${currentTime}`)

    let digestsSent = 0
    const results = []

    for (const pref of usersToSendDigest) {
      try {
        const user = pref.user

        if (!user.email) {
          console.log(`⚠️  User ${user.id} has no email, skipping`)
          continue
        }

        // Get minimum thresholds
        const minEngagementRate = pref.minEngagementRate || 0
        const minViewCount = pref.minViewCount || 0

        // Get top trending items
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

        // Skip if no trends meet criteria
        if (filteredHashtags.length === 0 && filteredSounds.length === 0 && filteredCreators.length === 0) {
          console.log(`⚠️  No trends for ${user.email} meeting criteria (${minEngagementRate}% growth)`)
          results.push({
            userId: user.id,
            email: user.email,
            sent: false,
            reason: 'No trends meeting criteria',
          })
          continue
        }

        // Build digest content
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

        // Create HTML email (simplified for scheduler)
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
                .trend-stats { display: flex; gap: 15px; font-size: 14px; color: #666; flex-wrap: wrap; }
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
                  <p>Here's your scheduled daily summary of trends meeting your criteria (≥${minEngagementRate}% growth)!</p>
                  
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
                  <p>You're receiving this at ${currentTime} because it's your scheduled digest time.</p>
                  <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings">Manage Preferences</a></p>
                </div>
              </div>
            </body>
          </html>
        `

        // Send email
        await sendEmailNotification({
          to: user.email,
          subject: `📊 Your Daily TikTok Trend Digest - ${new Date().toLocaleDateString()}`,
          title: '📊 Daily Trend Digest',
          message: `Your scheduled daily summary of trends with ≥${minEngagementRate}% growth`,
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
            title: `📊 Daily Digest Sent (${currentTime})`,
            message: `Your scheduled daily summary with ${filteredHashtags.length + filteredSounds.length + filteredCreators.length} trends`,
            data: { 
              scheduledTime: currentTime,
              trendsIncluded: {
                hashtags: filteredHashtags.length,
                sounds: filteredSounds.length,
                creators: filteredCreators.length,
              }
            },
            read: false,
          },
        })

        digestsSent++
        results.push({
          userId: user.id,
          email: user.email,
          sent: true,
          trendsCount: filteredHashtags.length + filteredSounds.length + filteredCreators.length,
        })

        console.log(`✅ Digest sent to ${user.email}`)

      } catch (userError) {
        console.error(`❌ Failed to send digest to user ${pref.userId}:`, userError)
        results.push({
          userId: pref.userId,
          email: pref.user.email,
          sent: false,
          error: userError instanceof Error ? userError.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      time: currentTime,
      usersChecked: usersToSendDigest.length,
      digestsSent,
      results,
    })

  } catch (error) {
    console.error('❌ Digest scheduler error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process scheduled digests' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Daily digest scheduler endpoint',
    usage: 'POST with Authorization: Bearer YOUR_CRON_SECRET',
    note: 'This should be called every minute to check for scheduled digests',
  })
}
