import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import redis from './redis'
import { prisma } from './prisma'

interface AxiosRequestConfigWithMetadata extends InternalAxiosRequestConfig {
  metadata?: { start: number }
}

class TikTokAPIService {
  private api: AxiosInstance
  private cachePrefix = 'tiktok:'
  private cacheTTL = 300 // 5 minutes

  constructor() {
    this.api = axios.create({
      baseURL: `https://${process.env.RAPIDAPI_HOST}`,
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST!,
      },
      timeout: 10000,
    })

    // Request interceptor for logging
    this.api.interceptors.request.use(
      async (config: AxiosRequestConfigWithMetadata) => {
        const start = Date.now()
        config.metadata = { start }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for logging
    this.api.interceptors.response.use(
      async (response) => {
        const config = response.config as AxiosRequestConfigWithMetadata
        const duration = Date.now() - (config.metadata?.start || Date.now())
        await this.logApiUsage(
          response.config.url || '',
          response.config.method || 'GET',
          response.status,
          duration
        )
        return response
      },
      async (error) => {
        const config = error.config as AxiosRequestConfigWithMetadata
        const duration = Date.now() - (config?.metadata?.start || Date.now())
        await this.logApiUsage(
          error.config?.url || '',
          error.config?.method || 'GET',
          error.response?.status || 500,
          duration
        )
        return Promise.reject(error)
      }
    )
  }

  private async logApiUsage(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number
  ) {
    try {
      await prisma.apiUsage.create({
        data: {
          endpoint,
          method: method.toUpperCase(),
          statusCode,
          responseTime,
          timestamp: new Date(),
        },
      })
    } catch (error) {
      console.error('Failed to log API usage:', error)
    }
  }

  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(`${this.cachePrefix}${key}`)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  private async setCache(key: string, value: any, ttl: number = this.cacheTTL) {
    try {
      await redis.setEx(`${this.cachePrefix}${key}`, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async getTrendingHashtags(limit: number = 50): Promise<any[]> {
    const cacheKey = `trending_hashtags:${limit}`
    const cached = await this.getFromCache<any[]>(cacheKey)
    if (cached) return cached

    try {
      const response = await this.api.get('/feed/list', {
        params: { 
          count: limit,
          region: 'US'
        },
      })
      
      // Handle both array and object with videos property
      let videos: any[] = []
      if (Array.isArray(response.data?.data)) {
        videos = response.data.data
      } else if (response.data?.data?.videos && Array.isArray(response.data.data.videos)) {
        videos = response.data.data.videos
      }
      
      // Extract hashtags from videos
      const hashtagMap = new Map()
      videos.forEach((video: any) => {
        const title = video.title || ''
        const hashtagMatches = title.match(/#[\w]+/g) || []
        const playCount = video.play_count || 0
        
        hashtagMatches.forEach((hashtag: string) => {
          const cleanName = hashtag.replace(/^#/, '').toLowerCase()
          if (hashtagMap.has(cleanName)) {
            const existing = hashtagMap.get(cleanName)
            existing.count++
            existing.views += playCount
          } else {
            hashtagMap.set(cleanName, {
              name: cleanName,
              displayName: hashtag,
              count: 1,
              views: playCount
            })
          }
        })
      })
      
      const data = Array.from(hashtagMap.values())
        .sort((a, b) => b.views - a.views)
        .slice(0, limit)
      
      await this.setCache(cacheKey, data, 180) // 3 minutes
      return data
    } catch (error) {
      console.error('Failed to fetch trending hashtags:', error)
      return []
    }
  }

  async getHashtagDetails(hashtagName: string): Promise<any> {
    const cacheKey = `hashtag:${hashtagName}`
    const cached = await this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const response = await this.api.get('/challenge/detail', {
        params: { challenge: hashtagName },
      })
      const data = response.data?.data
      await this.setCache(cacheKey, data, 300)
      return data
    } catch (error) {
      console.error(`Failed to fetch hashtag details for ${hashtagName}:`, error)
      return null
    }
  }

  async getHashtagVideos(hashtagName: string, cursor: string = '0'): Promise<any> {
    const cacheKey = `hashtag_videos:${hashtagName}:${cursor}`
    const cached = await this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const response = await this.api.get('/challenge/posts', {
        params: {
          challenge: hashtagName,
          cursor,
          count: 30,
        },
      })
      const data = response.data
      await this.setCache(cacheKey, data, 180)
      return data
    } catch (error) {
      console.error(`Failed to fetch videos for hashtag ${hashtagName}:`, error)
      return null
    }
  }

  async getTrendingSounds(limit: number = 50): Promise<any[]> {
    const cacheKey = `trending_sounds:${limit}`
    const cached = await this.getFromCache<any[]>(cacheKey)
    if (cached) return cached

    try {
      const response = await this.api.get('/music/trending', {
        params: { count: limit },
      })
      const data = response.data?.data || []
      await this.setCache(cacheKey, data, 180)
      return data
    } catch (error) {
      console.error('Failed to fetch trending sounds:', error)
      return []
    }
  }

  async getSoundDetails(soundId: string): Promise<any> {
    const cacheKey = `sound:${soundId}`
    const cached = await this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const response = await this.api.get('/music/info', {
        params: { music_id: soundId },
      })
      const data = response.data?.data
      await this.setCache(cacheKey, data, 300)
      return data
    } catch (error) {
      console.error(`Failed to fetch sound details for ${soundId}:`, error)
      return null
    }
  }

  async getUserInfo(username: string): Promise<any> {
    const cacheKey = `user:${username}`
    const cached = await this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const response = await this.api.get('/user/info', {
        params: { unique_id: username },
      })
      const data = response.data?.data
      await this.setCache(cacheKey, data, 300)
      return data
    } catch (error) {
      console.error(`Failed to fetch user info for ${username}:`, error)
      return null
    }
  }

  async getUserVideos(userId: string, cursor: string = '0'): Promise<any> {
    const cacheKey = `user_videos:${userId}:${cursor}`
    const cached = await this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const response = await this.api.get('/user/posts', {
        params: {
          user_id: userId,
          cursor,
          count: 30,
        },
      })
      const data = response.data
      await this.setCache(cacheKey, data, 180)
      return data
    } catch (error) {
      console.error(`Failed to fetch videos for user ${userId}:`, error)
      return null
    }
  }

  async searchVideos(keyword: string, cursor: string = '0'): Promise<any> {
    const cacheKey = `search:${keyword}:${cursor}`
    const cached = await this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const response = await this.api.get('/search/video', {
        params: {
          keywords: keyword,
          cursor,
          count: 30,
        },
      })
      const data = response.data
      await this.setCache(cacheKey, data, 300)
      return data
    } catch (error) {
      console.error(`Failed to search videos for keyword ${keyword}:`, error)
      return null
    }
  }

  async getVideoDetails(videoId: string): Promise<any> {
    const cacheKey = `video:${videoId}`
    const cached = await this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const response = await this.api.get('/video/info', {
        params: { video_id: videoId },
      })
      const data = response.data?.data
      await this.setCache(cacheKey, data, 300)
      return data
    } catch (error) {
      console.error(`Failed to fetch video details for ${videoId}:`, error)
      return null
    }
  }

  async clearCache(pattern: string = '*') {
    try {
      const keys = await redis.keys(`${this.cachePrefix}${pattern}`)
      if (keys.length > 0) {
        await redis.del(keys)
      }
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }
}

export const tiktokApi = new TikTokAPIService()
