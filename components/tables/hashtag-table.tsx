'use client'

import { Hash, TrendingUp, Eye, ArrowUp } from 'lucide-react'

interface HashtagData {
  id: string
  name: string
  displayName: string
  videoCount: number
  viewCount: bigint
  latestTrend: {
    trendScore: number
    growthRate: number
    velocity: number
  }
}

interface HashtagTableProps {
  data: HashtagData[]
}

export default function HashtagTable({ data }: HashtagTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <Hash className="mx-auto mb-4 text-muted-foreground" size={48} />
        <p className="text-muted-foreground">No trending hashtags available</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Hash size={24} />
          Trending Hashtags
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left p-4 font-medium">Rank</th>
              <th className="text-left p-4 font-medium">Hashtag</th>
              <th className="text-left p-4 font-medium">Videos</th>
              <th className="text-left p-4 font-medium">Views</th>
              <th className="text-left p-4 font-medium">Trend Score</th>
              <th className="text-left p-4 font-medium">Growth</th>
              <th className="text-left p-4 font-medium">Velocity</th>
            </tr>
          </thead>
          <tbody>
            {data.map((hashtag, index) => (
              <tr key={hashtag.id} className="border-b border-border hover:bg-secondary/50 transition">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    {index < 3 && <TrendingUp className="text-orange-500" size={16} />}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Hash size={16} className="text-primary" />
                    <span className="font-medium">{hashtag.displayName}</span>
                  </div>
                </td>
                <td className="p-4">{hashtag.videoCount.toLocaleString()}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-muted-foreground" />
                    {Number(hashtag.viewCount).toLocaleString()}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-secondary rounded-full h-2 max-w-[100px]">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${hashtag.latestTrend.trendScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {hashtag.latestTrend.trendScore}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1 text-green-600 font-medium">
                    <ArrowUp size={16} />
                    {hashtag.latestTrend.growthRate.toFixed(1)}%
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-sm">
                    {hashtag.latestTrend.velocity.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
