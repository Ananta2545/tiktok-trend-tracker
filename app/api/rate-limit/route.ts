import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get API usage stats for THIS USER ONLY
    const totalCalls = await prisma.apiUsage.count({
      where: { userId: user.id },
    })
    
    const callsLast24Hours = await prisma.apiUsage.count({
      where: { 
        userId: user.id,
        timestamp: { gte: last24Hours },
      },
    })

    const callsLast7Days = await prisma.apiUsage.count({
      where: { 
        userId: user.id,
        timestamp: { gte: last7Days },
      },
    })

    const callsLast30Days = await prisma.apiUsage.count({
      where: { 
        userId: user.id,
        timestamp: { gte: last30Days },
      },
    })

    // Get calls by endpoint for THIS USER ONLY
    const callsByEndpoint = await prisma.apiUsage.groupBy({
      by: ['endpoint'],
      where: { 
        userId: user.id,
        timestamp: { gte: last7Days },
      },
      _count: { endpoint: true },
      orderBy: { _count: { endpoint: 'desc' } },
      take: 10,
    })

    // Get hourly breakdown for last 24 hours for THIS USER ONLY
    const hourlyBreakdown = await prisma.apiUsage.groupBy({
      by: ['timestamp'],
      where: { 
        userId: user.id,
        timestamp: { gte: last24Hours },
      },
      _count: true,
    })

    // Group by hour
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000)
      hour.setMinutes(0, 0, 0)
      const count = hourlyBreakdown.filter(h => {
        const hTime = new Date(h.timestamp)
        return hTime.getHours() === hour.getHours()
      }).length
      return {
        hour: hour.getHours(),
        count,
      }
    }).reverse()

    // Calculate rate limit status
    const rateLimitPerHour = 1000 // Max calls per hour
    const currentHourCalls = hourlyData[hourlyData.length - 1]?.count || 0
    const rateLimitPercentage = (currentHourCalls / rateLimitPerHour) * 100

    // Get response time stats for THIS USER ONLY
    const recentCalls = await prisma.apiUsage.findMany({
      where: { 
        userId: user.id,
        timestamp: { gte: last24Hours },
      },
      select: { responseTime: true, statusCode: true },
      orderBy: { timestamp: 'desc' },
      take: 100,
    })

    const avgResponseTime = recentCalls.length > 0
      ? recentCalls.reduce((sum, call) => sum + (call.responseTime || 0), 0) / recentCalls.length
      : 0

    const successRate = recentCalls.length > 0
      ? (recentCalls.filter(call => call.statusCode >= 200 && call.statusCode < 300).length / recentCalls.length) * 100
      : 0

    return NextResponse.json({
      totalCalls,
      callsLast24Hours,
      callsLast7Days,
      callsLast30Days,
      callsByEndpoint: callsByEndpoint.map(item => ({
        endpoint: item.endpoint,
        count: item._count.endpoint,
      })),
      hourlyData,
      rateLimit: {
        current: currentHourCalls,
        max: rateLimitPerHour,
        percentage: rateLimitPercentage,
      },
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate * 100) / 100,
    })
  } catch (error) {
    console.error('API rate limit dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
