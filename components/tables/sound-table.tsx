'use client'

import { Music, TrendingUp, Eye, ArrowUp } from 'lucide-react'

interface SoundData {
  id: string
  title: string
  author: string
  videoCount: number
  latestTrend: {
    trendScore: number
    growthRate: number
    viewCount: bigint
  }
}

interface SoundTableProps {
  data: SoundData[]
}

export default function SoundTable({ data }: SoundTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <Music className="mx-auto mb-4 text-muted-foreground" size={48} />
        <p className="text-muted-foreground">No trending sounds available</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Music size={24} />
          Trending Sounds
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left p-4 font-medium">Rank</th>
              <th className="text-left p-4 font-medium">Sound</th>
              <th className="text-left p-4 font-medium">Artist</th>
              <th className="text-left p-4 font-medium">Videos</th>
              <th className="text-left p-4 font-medium">Trend Score</th>
              <th className="text-left p-4 font-medium">Growth</th>
            </tr>
          </thead>
          <tbody>
            {data.map((sound, index) => (
              <tr key={sound.id} className="border-b border-border hover:bg-secondary/50 transition">
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
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
                      <Music size={16} className="text-white" />
                    </div>
                    <span className="font-medium max-w-[200px] truncate">{sound.title}</span>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">{sound.author}</td>
                <td className="p-4">{sound.videoCount.toLocaleString()}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-secondary rounded-full h-2 max-w-[100px]">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                        style={{ width: `${sound.latestTrend.trendScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {sound.latestTrend.trendScore}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1 text-green-600 font-medium">
                    <ArrowUp size={16} />
                    {sound.latestTrend.growthRate.toFixed(1)}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
