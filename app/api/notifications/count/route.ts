import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ unreadCount: 0 })
    }

    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ unreadCount: 0 })
    }

    const unreadCount = await prisma.notification.count({
      where: { 
        userId: user.id,
        read: false,
      },
    })

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error('Get notification count error:', error)
    return NextResponse.json({ unreadCount: 0 })
  }
}
