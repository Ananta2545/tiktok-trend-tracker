'use client'

import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number | string
  change: number
  icon: React.ReactNode
  color: 'blue' | 'purple' | 'pink' | 'green'
}

export default function StatsCard({ title, value, change, icon, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
    green: 'from-green-500 to-green-600',
  }

  const isPositive = change >= 0

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`bg-gradient-to-br ${colorClasses[color]} p-3 rounded-lg text-white`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          {Math.abs(change)}%
        </div>
      </div>
      <div>
        <p className="text-muted-foreground text-sm mb-1">{title}</p>
        <p className="text-3xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  )
}
