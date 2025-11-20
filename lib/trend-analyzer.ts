import { prisma } from './prisma'

export class TrendAnalyzer {
  /**
   * Calculate trend score based on multiple metrics
   * Score ranges from 0-100
   */
  static calculateTrendScore(metrics: {
    viewCount: bigint
    growthRate: number
    velocity: number
    engagementRate?: number
    timeDecay?: number
  }): number {
    const {
      viewCount,
      growthRate,
      velocity,
      engagementRate = 0,
      timeDecay = 1,
    } = metrics

    // Normalize view count (log scale)
    const viewScore = Math.min(Math.log10(Number(viewCount) + 1) / 10, 1) * 20

    // Growth rate score (0-30)
    const growthScore = Math.min(growthRate / 10, 1) * 30

    // Velocity score (0-25)
    const velocityScore = Math.min(velocity / 5, 1) * 25

    // Engagement score (0-15)
    const engagementScore = Math.min(engagementRate / 20, 1) * 15

    // Time decay (0-10)
    const decayScore = timeDecay * 10

    const totalScore =
      viewScore + growthScore + velocityScore + engagementScore + decayScore

    return Math.min(Math.round(totalScore), 100)
  }

  /**
   * Calculate growth rate between two time periods
   */
  static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  /**
   * Calculate velocity (rate of change over time)
   */
  static calculateVelocity(
    dataPoints: Array<{ value: number; timestamp: Date }>
  ): number {
    if (dataPoints.length < 2) return 0

    const sortedData = dataPoints.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    )

    let totalVelocity = 0
    for (let i = 1; i < sortedData.length; i++) {
      const timeDiff =
        (sortedData[i].timestamp.getTime() -
          sortedData[i - 1].timestamp.getTime()) /
        (1000 * 60 * 60) // hours
      const valueDiff = sortedData[i].value - sortedData[i - 1].value
      totalVelocity += valueDiff / timeDiff
    }

    return totalVelocity / (sortedData.length - 1)
  }

  /**
   * Calculate engagement rate
   */
  static calculateEngagementRate(
    likes: bigint,
    comments: bigint,
    shares: bigint,
    views: bigint
  ): number {
    if (views === BigInt(0)) return 0
    const totalEngagement = Number(likes + comments + shares)
    return (totalEngagement / Number(views)) * 100
  }

  /**
   * Calculate viral score for a video
   */
  static calculateViralScore(video: {
    viewCount: bigint
    likeCount: bigint
    shareCount: bigint
    commentCount: bigint
    createTime: Date
  }): number {
    const now = new Date()
    const ageInHours =
      (now.getTime() - video.createTime.getTime()) / (1000 * 60 * 60)

    // Views per hour
    const viewsPerHour = Number(video.viewCount) / Math.max(ageInHours, 1)

    // Engagement rate
    const engagementRate = this.calculateEngagementRate(
      video.likeCount,
      video.commentCount,
      video.shareCount,
      video.viewCount
    )

    // Share rate (shares are more valuable for virality)
    const shareRate = (Number(video.shareCount) / Number(video.viewCount)) * 100

    // Time decay (newer content is more relevant)
    const timeDecay = Math.exp(-ageInHours / 48) // Decay over 48 hours

    const viralScore =
      Math.min(Math.log10(viewsPerHour + 1) / 6, 1) * 40 + // Views velocity (0-40)
      Math.min(engagementRate / 10, 1) * 30 + // Engagement (0-30)
      Math.min(shareRate / 5, 1) * 20 + // Share rate (0-20)
      timeDecay * 10 // Recency (0-10)

    return Math.min(Math.round(viralScore), 100)
  }

  /**
   * Detect trending patterns
   */
  static async detectTrendingHashtags(
    minGrowthRate: number = 50,
    minViewCount: bigint = BigInt(1000000)
  ): Promise<any[]> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const last48Hours = new Date(Date.now() - 48 * 60 * 60 * 1000)

    // Get hashtags with recent activity
    const recentTrends = await prisma.hashtagTrend.findMany({
      where: {
        timestamp: {
          gte: last24Hours,
        },
        viewCount: {
          gte: minViewCount,
        },
      },
      include: {
        hashtag: true,
      },
      orderBy: {
        trendScore: 'desc',
      },
      take: 100,
    })

    // Calculate growth rates
    const trendingHashtags = []

    for (const trend of recentTrends) {
      const previousTrend = await prisma.hashtagTrend.findFirst({
        where: {
          hashtagId: trend.hashtagId,
          timestamp: {
            gte: last48Hours,
            lt: last24Hours,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      })

      const growthRate = previousTrend
        ? this.calculateGrowthRate(
            Number(trend.viewCount),
            Number(previousTrend.viewCount)
          )
        : 100

      if (growthRate >= minGrowthRate) {
        trendingHashtags.push({
          ...trend,
          hashtag: trend.hashtag,
          growthRate,
          isTrending: true,
        })
      }
    }

    return trendingHashtags
  }

  /**
   * Detect emerging trends (early stage trends)
   */
  static async detectEmergingTrends(): Promise<any[]> {
    const last6Hours = new Date(Date.now() - 6 * 60 * 60 * 1000)
    const last12Hours = new Date(Date.now() - 12 * 60 * 60 * 1000)

    // Find hashtags with rapid growth in the last 6 hours
    const emergingHashtags = await prisma.hashtagTrend.findMany({
      where: {
        timestamp: {
          gte: last6Hours,
        },
        velocity: {
          gt: 2, // High velocity
        },
      },
      include: {
        hashtag: true,
      },
      orderBy: {
        velocity: 'desc',
      },
      take: 50,
    })

    // Filter for true emerging trends
    const emerging = []

    for (const trend of emergingHashtags) {
      const olderTrend = await prisma.hashtagTrend.findFirst({
        where: {
          hashtagId: trend.hashtagId,
          timestamp: {
            gte: last12Hours,
            lt: last6Hours,
          },
        },
      })

      // Emerging if it's new or had low activity before
      const isEmerging =
        !olderTrend || Number(olderTrend.viewCount) < 500000

      if (isEmerging) {
        emerging.push({
          ...trend,
          hashtag: trend.hashtag,
          isEmerging: true,
        })
      }
    }

    return emerging
  }

  /**
   * Predict trend lifecycle stage
   */
  static predictLifecycleStage(trendData: Array<{
    timestamp: Date
    trendScore: number
  }>): 'emerging' | 'growing' | 'peak' | 'declining' | 'stable' {
    if (trendData.length < 3) return 'emerging'

    const sortedData = trendData.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    )

    const recentData = sortedData.slice(-5)
    const scores = recentData.map((d) => d.trendScore)

    // Calculate trend direction
    let increases = 0
    let decreases = 0

    for (let i = 1; i < scores.length; i++) {
      if (scores[i] > scores[i - 1]) increases++
      else if (scores[i] < scores[i - 1]) decreases++
    }

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) /
      scores.length

    // Determine stage
    if (increases >= 3 && avgScore < 50) return 'emerging'
    if (increases >= 3 && avgScore >= 50) return 'growing'
    if (avgScore >= 80 && variance < 50) return 'peak'
    if (decreases >= 3) return 'declining'
    return 'stable'
  }

  /**
   * Calculate trend momentum
   */
  static calculateMomentum(
    recentScores: number[],
    historicalAverage: number
  ): number {
    if (recentScores.length === 0) return 0

    const recentAverage =
      recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    const momentum = ((recentAverage - historicalAverage) / historicalAverage) * 100

    return momentum
  }
}
