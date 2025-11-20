'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Bell, 
  BellOff,
  TrendingUp, 
  Hash,
  Music,
  Users,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react'
import { SpinnerLoader } from '@/components/loading-skeleton'

export default function NotificationsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Failed to fetch notifications')
      return res.json()
    },
    enabled: !!session,
    refetchInterval: 30000,
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/mark-all-read', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to mark all as read')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0

  const { data: alerts } = useQuery({
    queryKey: ['trend-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/alerts')
      if (!res.ok) throw new Error('Failed to fetch alerts')
      return res.json()
    },
    enabled: !!session,
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to mark as read')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete alert')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trend-alerts'] })
    },
  })

  const getIcon = (type: string) => {
    switch (type) {
      case 'hashtag':
        return <Hash className="text-blue-500" size={20} />
      case 'sound':
        return <Music className="text-purple-500" size={20} />
      case 'creator':
        return <Users className="text-pink-500" size={20} />
      default:
        return <TrendingUp className="text-orange-500" size={20} />
    }
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <SpinnerLoader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on trending content that matters to you</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notifications Feed */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Bell size={24} />
                    Recent Alerts
                    {unreadCount > 0 && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </h2>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsReadMutation.mutate()}
                    className="text-sm text-blue-500 hover:text-blue-400 flex items-center gap-1"
                  >
                    <CheckCircle2 size={16} />
                    Mark all as read
                  </button>
                )}
              </div>
              
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {notifications && notifications.length > 0 ? (
                  notifications.map((notif: any) => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-secondary/50 transition ${
                        !notif.read ? 'bg-blue-500/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">{getIcon(notif.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium">{notif.title}</h3>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock size={12} />
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-4">
                            {notif.metrics && (
                              <div className="flex items-center gap-4 text-xs">
                                <span className="text-muted-foreground">
                                  Views: <strong className="text-foreground">{notif.metrics.views?.toLocaleString()}</strong>
                                </span>
                                <span className="text-muted-foreground">
                                  Growth: <strong className="text-green-600">+{notif.metrics.growth}%</strong>
                                </span>
                              </div>
                            )}
                            {!notif.read && (
                              <button
                                onClick={() => markAsReadMutation.mutate(notif.id)}
                                className="ml-auto text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1"
                              >
                                <CheckCircle2 size={14} />
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <BellOff className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <p className="text-muted-foreground">No notifications yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Create alerts in settings to start receiving notifications
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp size={20} />
                  Active Alerts
                </h2>
              </div>
              
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {alerts && alerts.length > 0 ? (
                  alerts.map((alert: any) => (
                    <div key={alert.id} className="p-4 hover:bg-secondary/50 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getIcon(alert.type)}
                          <span className="font-medium text-sm">{alert.name}</span>
                        </div>
                        <button
                          onClick={() => deleteAlertMutation.mutate(alert.id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {alert.threshold && (
                          <div>Threshold: {alert.threshold.toLocaleString()}</div>
                        )}
                        {alert.active ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 size={12} />
                            Active
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-500">
                            <XCircle size={12} />
                            Paused
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <BellOff className="mx-auto mb-3 text-muted-foreground" size={36} />
                    <p className="text-sm text-muted-foreground">No active alerts</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <a
                href="/settings"
                className="block w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-center hover:opacity-90 transition"
              >
                Manage Alert Settings
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
