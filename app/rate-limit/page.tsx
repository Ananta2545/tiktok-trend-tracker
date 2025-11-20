'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  Zap,
  AlertCircle,
  CheckCircle,
  BarChart3
} from 'lucide-react'
import { SpinnerLoader } from '@/components/loading-skeleton'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function RateLimitPage() {
  const { data: session } = useSession()

  const { data: rateLimitData, isLoading } = useQuery({
    queryKey: ['rate-limit'],
    queryFn: async () => {
      const res = await fetch('/api/rate-limit')
      if (!res.ok) throw new Error('Failed to fetch rate limit data')
      return res.json()
    },
    enabled: !!session,
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <SpinnerLoader />
      </div>
    )
  }

  const hourlyChartData = {
    labels: rateLimitData?.hourlyData?.map((d: any) => `${d.hour}:00`) || [],
    datasets: [
      {
        label: 'API Calls',
        data: rateLimitData?.hourlyData?.map((d: any) => d.count) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const endpointChartData = {
    labels: rateLimitData?.callsByEndpoint?.map((e: any) => e.endpoint) || [],
    datasets: [
      {
        label: 'Calls',
        data: rateLimitData?.callsByEndpoint?.map((e: any) => e.count) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
        ],
      },
    ],
  }

  const hourlyLimit = rateLimitData?.rateLimit?.hourly
  const dailyLimit = rateLimitData?.rateLimit?.daily
  const rateLimitPercentage = hourlyLimit?.percentage || 0
  const dailyLimitPercentage = dailyLimit?.percentage || 0
  const rateLimitStatus = rateLimitPercentage > 80 ? 'danger' : rateLimitPercentage > 60 ? 'warning' : 'success'
  const dailyLimitStatus = dailyLimitPercentage > 80 ? 'danger' : dailyLimitPercentage > 60 ? 'warning' : 'success'

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Activity size={32} />
            API Rate Limit Dashboard
          </h1>
          <p className="text-muted-foreground">Monitor your API usage and performance metrics</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Last 24 Hours</h3>
              <Clock className="text-blue-500" size={20} />
            </div>
            <p className="text-3xl font-bold">{rateLimitData?.callsLast24Hours?.toLocaleString() || 0}</p>
            <p className="text-sm text-muted-foreground mt-2">API calls</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Last 7 Days</h3>
              <TrendingUp className="text-purple-500" size={20} />
            </div>
            <p className="text-3xl font-bold">{rateLimitData?.callsLast7Days?.toLocaleString() || 0}</p>
            <p className="text-sm text-muted-foreground mt-2">API calls</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Avg Response Time</h3>
              <Zap className="text-yellow-500" size={20} />
            </div>
            <p className="text-3xl font-bold">{rateLimitData?.avgResponseTime || 0}<span className="text-lg">ms</span></p>
            <p className="text-sm text-muted-foreground mt-2">Average latency</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Success Rate</h3>
              {rateLimitData?.successRate >= 95 ? (
                <CheckCircle className="text-green-500" size={20} />
              ) : (
                <AlertCircle className="text-orange-500" size={20} />
              )}
            </div>
            <p className="text-3xl font-bold">{rateLimitData?.successRate || 0}<span className="text-lg">%</span></p>
            <p className="text-sm text-muted-foreground mt-2">Successful requests</p>
          </div>
        </div>

        {/* Rate Limit Status */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity size={24} />
            Current Rate Limit Status
          </h2>
          
          {/* Hourly Limit */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Hourly Limit</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                {hourlyLimit?.current || 0} / {hourlyLimit?.max || 0} calls this hour
              </span>
              <span className={`text-sm font-semibold ${
                rateLimitStatus === 'danger' ? 'text-red-500' :
                rateLimitStatus === 'warning' ? 'text-yellow-500' :
                'text-green-500'
              }`}>
                {rateLimitPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  rateLimitStatus === 'danger' ? 'bg-red-500' :
                  rateLimitStatus === 'warning' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(rateLimitPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Daily Limit */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Daily Limit</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                {dailyLimit?.current || 0} / {dailyLimit?.max || 0} calls today
              </span>
              <span className={`text-sm font-semibold ${
                dailyLimitStatus === 'danger' ? 'text-red-500' :
                dailyLimitStatus === 'warning' ? 'text-yellow-500' :
                'text-green-500'
              }`}>
                {dailyLimitPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  dailyLimitStatus === 'danger' ? 'bg-red-500' :
                  dailyLimitStatus === 'warning' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(dailyLimitPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {(rateLimitStatus === 'danger' || dailyLimitStatus === 'danger') && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-4">
              <p className="text-red-500 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                Warning: You're approaching your rate limit. Consider reducing API calls or upgrading your plan.
              </p>
            </div>
          )}
        </div>

        {/* Hourly Chart */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={24} />
            API Calls - Last 24 Hours
          </h2>
          <div className="h-64">
            <Line
              data={hourlyChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </div>
        </div>

        {/* Endpoint Breakdown */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Top Endpoints (Last 7 Days)</h2>
          <div className="h-64">
            <Bar
              data={endpointChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </div>
          <div className="mt-6 space-y-3">
            {rateLimitData?.callsByEndpoint?.map((endpoint: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="font-mono text-sm">{endpoint.endpoint}</span>
                <span className="font-semibold">{endpoint.count.toLocaleString()} calls</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
