import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { prisma } from './prisma'
import redis from './redis'

let io: SocketIOServer | null = null

export const initializeSocketIO = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  } as any)

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('authenticate', async (userId: string) => {
      socket.data.userId = userId
      socket.join(`user:${userId}`)
      console.log(`User ${userId} authenticated`)
    })

    socket.on('subscribe:hashtag', (hashtagId: string) => {
      socket.join(`hashtag:${hashtagId}`)
      console.log(`Socket ${socket.id} subscribed to hashtag ${hashtagId}`)
    })

    socket.on('unsubscribe:hashtag', (hashtagId: string) => {
      socket.leave(`hashtag:${hashtagId}`)
      console.log(`Socket ${socket.id} unsubscribed from hashtag ${hashtagId}`)
    })

    socket.on('subscribe:creator', (creatorId: string) => {
      socket.join(`creator:${creatorId}`)
      console.log(`Socket ${socket.id} subscribed to creator ${creatorId}`)
    })

    socket.on('unsubscribe:creator', (creatorId: string) => {
      socket.leave(`creator:${creatorId}`)
      console.log(`Socket ${socket.id} unsubscribed from creator ${creatorId}`)
    })

    socket.on('subscribe:sound', (soundId: string) => {
      socket.join(`sound:${soundId}`)
      console.log(`Socket ${socket.id} subscribed to sound ${soundId}`)
    })

    socket.on('unsubscribe:sound', (soundId: string) => {
      socket.leave(`sound:${soundId}`)
      console.log(`Socket ${socket.id} unsubscribed from sound ${soundId}`)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  // Set up Redis pub/sub for distributed events
  setupRedisSubscriptions()

  return io
}

const setupRedisSubscriptions = async () => {
  const subscriber = redis.duplicate()
  await subscriber.connect()

  subscriber.subscribe('trend:update', (message) => {
    const data = JSON.parse(message)
    io?.to(`${data.type}:${data.id}`).emit('trend:update', data)
  })

  subscriber.subscribe('trend:alert', (message) => {
    const data = JSON.parse(message)
    io?.to(`user:${data.userId}`).emit('trend:alert', data)
  })

  subscriber.subscribe('system:notification', (message) => {
    const data = JSON.parse(message)
    io?.emit('system:notification', data)
  })
}

export const getSocketIO = () => io

export const emitTrendUpdate = async (type: string, id: string, data: any) => {
  if (io) {
    io.to(`${type}:${id}`).emit('trend:update', data)
  }
  // Also publish to Redis for distributed systems
  await redis.publish('trend:update', JSON.stringify({ type, id, ...data }))
}

export const emitUserAlert = async (userId: string, alert: any) => {
  if (io) {
    io.to(`user:${userId}`).emit('trend:alert', alert)
  }
  await redis.publish('trend:alert', JSON.stringify({ userId, ...alert }))
}

export const emitSystemNotification = async (notification: any) => {
  if (io) {
    io.emit('system:notification', notification)
  }
  await redis.publish('system:notification', JSON.stringify(notification))
}

export const broadcastToRoom = (room: string, event: string, data: any) => {
  if (io) {
    io.to(room).emit(event, data)
  }
}
