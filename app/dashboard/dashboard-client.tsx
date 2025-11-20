'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  TrendingUp, 
  Hash, 
  Music, 
  Users, 
  Bell, 
  Settings, 
  BarChart3,
  Activity
} from 'lucide-react'
import TrendChart from '@/components/charts/trend-chart'
import HashtagTable from '@/components/tables/hashtag-table'
import SoundTable from '@/components/tables/sound-table'
import CreatorTable from '@/components/tables/creator-table'
import StatsCard from '@/components/cards/stats-card'
import { useSocket } from '@/components/socket-provider'
import { StatsCardSkeleton, ChartSkeleton, TableSkeleton } from '@/components/loading-skeleton'

export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState<'hashtags' | 'sounds' | 'creators'>('hashtags')
  const { isConnected } = useSocket()

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const { data: notificationCount } = useQuery({
    queryKey: ['notification-count'],
    queryFn: async () => {
      const res = await fetch('/api/notifications/count')
      if (!res.ok) return 0
      const data = await res.json()
      return data.unreadCount || 0
    },
    refetchInterval: 30000,
  })

  const { data: trendingHashtags, isLoading: hashtagsLoading } = useQuery({
    queryKey: ['trending-hashtags'],
    queryFn: async () => {
      const res = await fetch('/api/trends/hashtags')
      if (!res.ok) throw new Error('Failed to fetch hashtags')
      return res.json()
    },
    refetchInterval: 60000,
  })

  const { data: trendingSounds, isLoading: soundsLoading } = useQuery({
    queryKey: ['trending-sounds'],
    queryFn: async () => {
      const res = await fetch('/api/trends/sounds')
      if (!res.ok) throw new Error('Failed to fetch sounds')
      return res.json()
    },
    refetchInterval: 60000,
  })

  const { data: trendingCreators, isLoading: creatorsLoading } = useQuery({
    queryKey: ['trending-creators'],
    queryFn: async () => {
      const res = await fetch('/api/trends/creators')
      if (!res.ok) throw new Error('Failed to fetch creators')
      return res.json()
    },
    refetchInterval: 60000,
  })

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['trend-chart', activeTab],
    queryFn: async () => {
      const res = await fetch(`/api/charts/${activeTab}`)
      if (!res.ok) throw new Error('Failed to fetch chart data')
      return res.json()
    },
    refetchInterval: 60000,
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">TikTok Trend Tracker</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity size={14} />
                  <span>
                    {isConnected ? (
                      <span className="text-green-500">● Live</span>
                    ) : (
                      <span className="text-red-500">● Offline</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a 
                href="/ai-features" 
                className="px-3 py-2 hover:bg-secondary rounded-lg transition text-sm font-medium flex items-center gap-2"
                title="AI Features"
              >
                <BarChart3 size={18} />
                <span className="hidden md:inline">AI Tools</span>
              </a>
              <a 
                href="/rate-limit" 
                className="px-3 py-2 hover:bg-secondary rounded-lg transition text-sm font-medium flex items-center gap-2"
                title="API Dashboard"
              >
                <Activity size={18} />
                <span className="hidden md:inline">API</span>
              </a>
              <a 
                href="/notifications" 
                className="p-2 hover:bg-secondary rounded-lg transition relative"
                title="Notifications"
              >
                <Bell size={20} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </a>
              <a 
                href="/settings" 
                className="p-2 hover:bg-secondary rounded-lg transition"
                title="Settings"
              >
                <Settings size={20} />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statsLoading ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              <StatsCard
                title="Trending Hashtags"
                value={stats?.hashtagCount || 0}
                change={stats?.hashtagGrowth || 0}
                icon={<Hash />}
                color="blue"
              />
              <StatsCard
                title="Viral Sounds"
                value={stats?.soundCount || 0}
                change={stats?.soundGrowth || 0}
                icon={<Music />}
                color="purple"
              />
              <StatsCard
                title="Rising Creators"
                value={stats?.creatorCount || 0}
                change={stats?.creatorGrowth || 0}
                icon={<Users />}
                color="pink"
              />
            </>
          )}
        </div>

        {/* Chart Section */}
        {chartLoading ? (
          <ChartSkeleton />
        ) : (
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BarChart3 size={24} />
                Trend Analytics
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('hashtags')}
                  className={`px-4 py-2 rounded-lg transition ${
                    activeTab === 'hashtags'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary'
                  }`}
                >
                  Hashtags
                </button>
                <button
                  onClick={() => setActiveTab('sounds')}
                  className={`px-4 py-2 rounded-lg transition ${
                    activeTab === 'sounds'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary'
                  }`}
                >
                  Sounds
                </button>
                <button
                  onClick={() => setActiveTab('creators')}
                  className={`px-4 py-2 rounded-lg transition ${
                    activeTab === 'creators'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary'
                  }`}
                >
                  Creators
                </button>
              </div>
            </div>
            <TrendChart data={chartData} type={activeTab} />
          </div>
        )}

        {/* Tables Section */}
        <div className="space-y-8">
          {activeTab === 'hashtags' && (
            hashtagsLoading ? <TableSkeleton rows={10} /> : <HashtagTable data={trendingHashtags || []} />
          )}
          {activeTab === 'sounds' && (
            soundsLoading ? <TableSkeleton rows={10} /> : <SoundTable data={trendingSounds || []} />
          )}
          {activeTab === 'creators' && (
            creatorsLoading ? <TableSkeleton rows={10} /> : <CreatorTable data={trendingCreators || []} />
          )}
        </div>
      </main>
    </div>
  )
}
