import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    await prisma.notification.update({
      where: { 
        id: params.id,
        userId: user.id, // Ensure user owns this notification
      },
      data: { read: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark as read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
