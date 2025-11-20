'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface SocketContextType {
  socket: any | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: true, // Default to true for polling mode
})

export const useSocket = () => useContext(SocketContext)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<any | null>(null)
  const [isConnected, setIsConnected] = useState(true) // Use polling mode instead of WebSocket
  const { data: session } = useSession()

  useEffect(() => {
    // Simulate connection for now - use HTTP polling instead of WebSocket
    setIsConnected(true)
    console.log('Using HTTP polling mode for real-time updates')

    // Poll for updates every 30 seconds
    const pollInterval = setInterval(() => {
      console.log('Polling for updates...')
    }, 30000)

    return () => {
      clearInterval(pollInterval)
    }
  }, [session])

  // Simulated event handlers
  const simulatedSocket = {
    emit: (event: string, data: any) => {
      console.log(`Event emitted: ${event}`, data)
    },
    on: (event: string, handler: any) => {
      console.log(`Listener registered for: ${event}`)
    },
  }

  return (
    <SocketContext.Provider value={{ socket: simulatedSocket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}