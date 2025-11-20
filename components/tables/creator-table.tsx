'use client'

import { Users, TrendingUp, Eye, ArrowUp } from 'lucide-react'
import Image from 'next/image'

interface CreatorData {
  id: string
  username: string
  nickname: string
  avatarUrl: string | null
  followerCount: number
  videoCount: number
  verified: boolean
  latestTrend: {
    trendScore: number
    growthRate: number
    engagementRate: number
  }
}

interface CreatorTableProps {
  data: CreatorData[]
}

export default function CreatorTable({ data }: CreatorTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <Users className="mx-auto mb-4 text-muted-foreground" size={48} />
        <p className="text-muted-foreground">No trending creators available</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users size={24} />
          Rising Creators
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left p-4 font-medium">Rank</th>
              <th className="text-left p-4 font-medium">Creator</th>
              <th className="text-left p-4 font-medium">Username</th>
              <th className="text-left p-4 font-medium">Followers</th>
              <th className="text-left p-4 font-medium">Videos</th>
              <th className="text-left p-4 font-medium">Trend Score</th>
              <th className="text-left p-4 font-medium">Growth</th>
              <th className="text-left p-4 font-medium">Engagement</th>
            </tr>
          </thead>
          <tbody>
            {data.map((creator, index) => (
              <tr key={creator.id} className="border-b border-border hover:bg-secondary/50 transition">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    {index < 3 && <TrendingUp className="text-orange-500" size={16} />}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {creator.avatarUrl ? (
                      <Image
                        src={creator.avatarUrl}
                        alt={creator.nickname}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {creator.nickname.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{creator.nickname}</span>
                        {creator.verified && (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">@{creator.username}</td>
                <td className="p-4 font-medium">{creator.followerCount.toLocaleString()}</td>
                <td className="p-4">{creator.videoCount.toLocaleString()}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-secondary rounded-full h-2 max-w-[100px]">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${creator.latestTrend.trendScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {creator.latestTrend.trendScore}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1 text-green-600 font-medium">
                    <ArrowUp size={16} />
                    {creator.latestTrend.growthRate.toFixed(1)}%
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-sm font-medium">
                    {creator.latestTrend.engagementRate.toFixed(2)}%
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
