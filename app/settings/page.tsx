'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Bell, 
  Mail, 
  Webhook, 
  Clock, 
  TrendingUp, 
  Eye, 
  Save,
  CheckCircle2,
  AlertCircle,
  Send
} from 'lucide-react'
import { SpinnerLoader } from '@/components/loading-skeleton'

export default function SettingsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState<string>('')

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: async () => {
      const res = await fetch('/api/user/preferences')
      if (!res.ok) throw new Error('Failed to fetch preferences')
      return res.json()
    },
    enabled: !!session,
  })

  const [formData, setFormData] = useState({
    emailNotifications: true,
    webhookNotifications: false,
    webhookUrl: '',
    dailyDigest: true,
    digestTime: '09:00',
    minEngagementRate: 5.0,
    minViewCount: 100000,
  })

  // Update form when data loads
  useEffect(() => {
    if (preferences) {
      setFormData(preferences)
    }
  }, [preferences])

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errorData = await res.json()
        console.error('Save failed:', errorData)
        throw new Error(errorData.error || 'Failed to save preferences')
      }
      return res.json()
    },
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      console.log('Settings saved successfully')
      setSaveStatus('success')
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] })
      setTimeout(() => setSaveStatus('idle'), 3000)
    },
    onError: (error) => {
      console.error('Save error:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    },
  })

  const handleSave = () => {
    saveMutation.mutate(formData)
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your notification preferences and alert thresholds</p>
        </div>

        {/* Notification Settings */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Bell size={24} />
            Notification Preferences
          </h2>
          
          <div className="space-y-6">
            {/* Email Notifications */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Mail className="mt-1 text-blue-500" size={20} />
                <div>
                  <h3 className="font-medium mb-1">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive instant alerts when trends match your criteria
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.emailNotifications}
                  onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Webhook Notifications */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Webhook className="mt-1 text-purple-500" size={20} />
                <div>
                  <h3 className="font-medium mb-1">Webhook Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Send trend alerts to your custom endpoint
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.webhookNotifications}
                  onChange={(e) => setFormData({ ...formData, webhookNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {formData.webhookNotifications && (
              <div className="ml-8 pl-4 border-l-2 border-purple-500">
                <label className="block text-sm font-medium mb-2">Webhook URL</label>
                <input
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  placeholder="https://your-server.com/webhook"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {/* Daily Digest */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Clock className="mt-1 text-green-500" size={20} />
                <div>
                  <h3 className="font-medium mb-1">Daily Digest</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive a summary of daily trends
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dailyDigest}
                  onChange={(e) => setFormData({ ...formData, dailyDigest: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {formData.dailyDigest && (
              <div className="ml-8 pl-4 border-l-2 border-green-500">
                <label className="block text-sm font-medium mb-2">Digest Time</label>
                <input
                  type="time"
                  value={formData.digestTime}
                  onChange={(e) => setFormData({ ...formData, digestTime: e.target.value })}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Alert Thresholds */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={24} />
            Alert Thresholds
          </h2>
          
          <div className="space-y-6">
            {/* Minimum Engagement Rate */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <TrendingUp size={16} />
                Minimum Engagement Rate
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={formData.minEngagementRate}
                  onChange={(e) => setFormData({ ...formData, minEngagementRate: parseFloat(e.target.value) })}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-lg font-semibold min-w-[60px] text-right">
                  {formData.minEngagementRate.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Only alert on trends with at least this engagement rate
              </p>
            </div>

            {/* Minimum View Count */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Eye size={16} />
                Minimum View Count
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10000"
                  max="10000000"
                  step="10000"
                  value={formData.minViewCount}
                  onChange={(e) => setFormData({ ...formData, minViewCount: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-lg font-semibold min-w-[100px] text-right">
                  {(formData.minViewCount / 1000).toFixed(0)}K
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Only alert on trends with at least this many views
              </p>
            </div>
          </div>
        </div>

        {/* Manual Triggers */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Send size={24} />
            Manual Triggers
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Manually trigger alerts and digests. Make sure to save your settings first!
          </p>
          
          <div className="space-y-3">
            {/* Check My Alerts */}
            <div className="flex items-center gap-4">
              <button
                onClick={async () => {
                  setTestStatus('sending')
                  setTestMessage('')
                  try {
                    const res = await fetch('/api/check-my-alerts', { method: 'POST' })
                    const data = await res.json()
                    if (res.ok) {
                      setTestStatus('success')
                      setTestMessage(data.message || `Checked ${data.alertsChecked} alerts, ${data.notificationsSent} triggered`)
                    } else {
                      setTestStatus('error')
                      setTestMessage(data.error || 'Failed to check alerts')
                    }
                  } catch (error) {
                    setTestStatus('error')
                    setTestMessage('Network error')
                  }
                  setTimeout(() => setTestStatus('idle'), 5000)
                }}
                disabled={testStatus === 'sending'}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-purple-700 transition disabled:opacity-50"
              >
                {testStatus === 'sending' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Checking...
                  </>
                ) : (
                  <>
                    <Bell size={20} />
                    Check My Alerts Now
                  </>
                )}
              </button>
            </div>

            {/* Send Daily Digest */}
            <div className="flex items-center gap-4">
              <button
                onClick={async () => {
                  setTestStatus('sending')
                  setTestMessage('')
                  try {
                    const res = await fetch('/api/send-digest', { method: 'POST' })
                    const data = await res.json()
                    if (res.ok) {
                      setTestStatus('success')
                      setTestMessage(`Daily digest sent to ${data.emailTo}`)
                    } else {
                      setTestStatus('error')
                      setTestMessage(data.error || 'Failed to send digest')
                    }
                  } catch (error) {
                    setTestStatus('error')
                    setTestMessage('Network error')
                  }
                  setTimeout(() => setTestStatus('idle'), 5000)
                }}
                disabled={testStatus === 'sending'}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-green-700 transition disabled:opacity-50"
              >
                {testStatus === 'sending' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail size={20} />
                    Send Daily Digest Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4">
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={20} />
              <span>Settings saved successfully!</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle size={20} />
              <span>Failed to save settings</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50"
          >
            {saveStatus === 'saving' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
