interface WebhookNotification {
  type: 'hashtag' | 'sound' | 'creator' | 'trend_alert'
  title: string
  message: string
  data?: any
  timestamp: string
}

export async function sendWebhookNotification(
  webhookUrl: string,
  notification: WebhookNotification
) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TikTok-Trend-Tracker/1.0',
      },
      body: JSON.stringify({
        ...notification,
        source: 'tiktok-trend-tracker',
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Webhook notification error:', error)
    return { success: false, error }
  }
}
