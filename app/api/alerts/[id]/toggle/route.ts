import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const { isActive } = await request.json()

    const alert = await prisma.trendAlert.update({
      where: { 
        id: params.id,
        userId: user.id,
      },
      data: { isActive },
    })

    return NextResponse.json(alert)
  } catch (error) {
    console.error('Toggle alert error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
