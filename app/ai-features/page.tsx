'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation } from '@tanstack/react-query'
import { 
  Brain, 
  Hash, 
  Music, 
  Users,
  Sparkles,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { SpinnerLoader } from '@/components/loading-skeleton'

export default function AIFeaturesPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'predict' | 'ideas' | 'competitor'>('predict')

  // Prediction
  const [predictionType, setPredictionType] = useState('hashtag')
  const [predictionInput, setPredictionInput] = useState('')

  const predictMutation = useMutation({
    mutationFn: async (data: { type: string; input: string }) => {
      const res = await fetch('/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to generate prediction')
      return res.json()
    },
  })

  // Content Ideas
  const [ideaCategory, setIdeaCategory] = useState('all')

  const ideasMutation = useMutation({
    mutationFn: async (category: string) => {
      const res = await fetch('/api/ai/content-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      })
      if (!res.ok) throw new Error('Failed to generate ideas')
      return res.json()
    },
  })

  // Competitor Tracking
  const [competitorUsername, setCompetitorUsername] = useState('')

  const competitorMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await fetch(`/api/competitor?username=${encodeURIComponent(username)}`)
      if (!res.ok) throw new Error('Failed to fetch competitor data')
      return res.json()
    },
  })

  const handlePredict = () => {
    if (!predictionInput.trim()) return
    predictMutation.mutate({ type: predictionType, input: predictionInput })
  }

  const handleGenerateIdeas = () => {
    ideasMutation.mutate(ideaCategory)
  }

  const handleTrackCompetitor = () => {
    if (!competitorUsername.trim()) return
    competitorMutation.mutate(competitorUsername)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hashtag': return <Hash className="text-blue-500" size={20} />
      case 'sound': return <Music className="text-purple-500" size={20} />
      case 'collaboration': return <Users className="text-pink-500" size={20} />
      default: return <Sparkles className="text-orange-500" size={20} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Brain size={32} />
            AI-Powered Features
          </h1>
          <p className="text-muted-foreground">Get intelligent insights and predictions for your content strategy</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab('predict')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'predict'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Trend Predictions
          </button>
          <button
            onClick={() => setActiveTab('ideas')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'ideas'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Content Ideas
          </button>
          <button
            onClick={() => setActiveTab('competitor')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'competitor'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Competitor Tracking
          </button>
        </div>

        {/* Trend Predictions */}
        {activeTab === 'predict' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={24} />
                AI Trend Prediction
              </h2>
              <p className="text-muted-foreground mb-6">
                Enter a hashtag, sound, or creator to get AI-powered predictions about their trending potential
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <div className="flex gap-2">
                    {['hashtag', 'sound', 'creator'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setPredictionType(type)}
                        className={`px-4 py-2 rounded-lg capitalize transition ${
                          predictionType === type
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {predictionType === 'hashtag' && 'Hashtag Name'}
                    {predictionType === 'sound' && 'Sound Title'}
                    {predictionType === 'creator' && 'Creator Username'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={predictionInput}
                      onChange={(e) => setPredictionInput(e.target.value)}
                      placeholder={
                        predictionType === 'hashtag' ? 'e.g., fyp' :
                        predictionType === 'sound' ? 'e.g., original sound' :
                        'e.g., username'
                      }
                      className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      onKeyPress={(e) => e.key === 'Enter' && handlePredict()}
                    />
                    <button
                      onClick={handlePredict}
                      disabled={predictMutation.isPending || !predictionInput.trim()}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
                    >
                      {predictMutation.isPending ? 'Analyzing...' : 'Predict'}
                    </button>
                  </div>
                </div>
              </div>

              {predictMutation.data && (
                <div className="mt-6 p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start gap-4">
                    <Brain className="text-primary mt-1" size={24} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">AI Prediction</h3>
                        <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                          {predictMutation.data.confidence}% confidence
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {predictMutation.data.prediction}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {predictMutation.isError && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-500 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    Failed to generate prediction. Please try again.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Ideas */}
        {activeTab === 'ideas' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles size={24} />
                Content Idea Generator
              </h2>
              <p className="text-muted-foreground mb-6">
                Get personalized content ideas based on current trending data
              </p>

              <div className="flex gap-2 mb-6">
                {['all', 'hashtag', 'sound', 'creator'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setIdeaCategory(cat)}
                    className={`px-4 py-2 rounded-lg capitalize transition ${
                      ideaCategory === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerateIdeas}
                disabled={ideasMutation.isPending}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {ideasMutation.isPending ? 'Generating Ideas...' : 'Generate Content Ideas'}
              </button>

              {ideasMutation.data?.ideas && ideasMutation.data.ideas.length > 0 && (
                <div className="mt-6 space-y-4">
                  {ideasMutation.data.ideas.map((idea: any) => (
                    <div key={idea.id} className="p-6 bg-secondary border border-border rounded-lg hover:shadow-lg transition">
                      <div className="flex items-start gap-4">
                        {getTypeIcon(idea.type)}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg">{idea.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              idea.difficulty === 'High Competition' || idea.difficulty === 'Hard to Reach'
                                ? 'bg-red-500/20 text-red-500'
                                : idea.difficulty === 'Medium Competition' || idea.difficulty === 'Reachable'
                                ? 'bg-yellow-500/20 text-yellow-500'
                                : 'bg-green-500/20 text-green-500'
                            }`}>
                              {idea.difficulty}
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-3">{idea.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            {idea.hashtags && (
                              <span className="text-blue-500">
                                {idea.hashtags.join(' ')}
                              </span>
                            )}
                            <span className="text-muted-foreground">
                              Est. {(idea.potentialViews / 1000).toFixed(0)}K+ potential views
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Competitor Tracking */}
        {activeTab === 'competitor' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users size={24} />
                Competitor Analysis
              </h2>
              <p className="text-muted-foreground mb-6">
                Track and analyze your competitors' performance metrics
              </p>

              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={competitorUsername}
                  onChange={(e) => setCompetitorUsername(e.target.value)}
                  placeholder="Enter competitor username..."
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  onKeyPress={(e) => e.key === 'Enter' && handleTrackCompetitor()}
                />
                <button
                  onClick={handleTrackCompetitor}
                  disabled={competitorMutation.isPending || !competitorUsername.trim()}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  {competitorMutation.isPending ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>

              {competitorMutation.data && (
                <div className="space-y-6">
                  {/* Competitor Profile */}
                  <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
                      {competitorMutation.data.competitor.nickname[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">
                        {competitorMutation.data.competitor.nickname}
                        {competitorMutation.data.competitor.verified && (
                          <span className="ml-2 text-blue-500">✓</span>
                        )}
                      </h3>
                      <p className="text-muted-foreground mb-3">@{competitorMutation.data.competitor.username}</p>
                      {competitorMutation.data.competitor.bio && (
                        <p className="text-sm text-muted-foreground mb-4">{competitorMutation.data.competitor.bio}</p>
                      )}
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Followers</p>
                          <p className="text-lg font-semibold">{competitorMutation.data.competitor.followers.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Following</p>
                          <p className="text-lg font-semibold">{competitorMutation.data.competitor.following.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Videos</p>
                          <p className="text-lg font-semibold">{competitorMutation.data.competitor.videos.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Likes</p>
                          <p className="text-lg font-semibold">{competitorMutation.data.competitor.totalLikes.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Analytics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-card border border-border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Avg Growth Rate</p>
                      <p className="text-2xl font-bold text-green-500">
                        {competitorMutation.data.analytics.avgRecentGrowth.toFixed(2)}%
                      </p>
                    </div>
                    <div className="p-4 bg-card border border-border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Engagement Rate</p>
                      <p className="text-2xl font-bold text-blue-500">
                        {competitorMutation.data.analytics.avgEngagement.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Insights */}
                  <div className="space-y-3">
                    {competitorMutation.data.insights.map((insight: any, index: number) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          insight.type === 'positive'
                            ? 'bg-green-500/10 border-green-500/20'
                            : insight.type === 'warning'
                            ? 'bg-yellow-500/10 border-yellow-500/20'
                            : 'bg-blue-500/10 border-blue-500/20'
                        }`}
                      >
                        <p className={`text-sm ${
                          insight.type === 'positive' ? 'text-green-500' :
                          insight.type === 'warning' ? 'text-yellow-500' :
                          'text-blue-500'
                        }`}>
                          {insight.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {competitorMutation.isError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-500 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    Competitor not found or data unavailable.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
