import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import axios from 'axios'

export const maxDuration = 60 // Maximum execution time for Vercel

export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Fetching latest TikTok trends...')

    const api = axios.create({
      baseURL: `https://${process.env.RAPIDAPI_HOST}`,
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST,
      },
      timeout: 15000,
    })

    const response = await api.get('/feed/list', { 
      params: { 
        count: 50,
        region: 'US'
      } 
    })
    
    if (response.data.code !== 0 || !response.data.data) {
      console.log('⚠️  No data received from TikTok API')
      return NextResponse.json({ 
        success: false, 
        message: 'No data received from TikTok API' 
      }, { status: 200 })
    }

    let videos = []
    if (Array.isArray(response.data.data)) {
      videos = response.data.data
    } else if (response.data.data.videos && Array.isArray(response.data.data.videos)) {
      videos = response.data.data.videos
    }

    console.log(`📹 Processing ${videos.length} videos...`)
    
    const hashtagMap = new Map()
    const soundMap = new Map()
    const creatorMap = new Map()
    let processedVideos = 0
    
    for (const video of videos) {
      if (!video.title) continue

      // Process hashtags
      if (video.textExtra && Array.isArray(video.textExtra)) {
        for (const tag of video.textExtra) {
          if (tag.hashtagName) {
            const name = tag.hashtagName.toLowerCase()
            if (!hashtagMap.has(name)) {
              hashtagMap.set(name, {
                name,
                displayName: tag.hashtagName,
                videos: new Set(),
                views: 0,
              })
            }
            const tagData = hashtagMap.get(name)
            tagData.videos.add(video.id)
            tagData.views += parseInt(video.playCount) || 0
          }
        }
      }

      // Process sounds
      if (video.music) {
        const soundId = video.music.id
        if (!soundMap.has(soundId)) {
          soundMap.set(soundId, {
            id: soundId,
            title: video.music.title || 'Unknown',
            author: video.music.authorName || 'Unknown',
            videos: new Set(),
            plays: 0,
          })
        }
        const soundData = soundMap.get(soundId)
        soundData.videos.add(video.id)
        soundData.plays += parseInt(video.music.playCount) || 0
      }

      // Process creators
      if (video.author) {
        const username = video.author.uniqueId
        if (!creatorMap.has(username)) {
          creatorMap.set(username, {
            username,
            nickname: video.author.nickname || username,
            followers: parseInt(video.authorStats?.followerCount) || 0,
            videos: new Set(),
            totalViews: 0,
          })
        }
        const creatorData = creatorMap.get(username)
        creatorData.videos.add(video.id)
        creatorData.totalViews += parseInt(video.playCount) || 0
      }

      processedVideos++
    }

    // Save hashtags
    let hashtagsUpdated = 0
    for (const [name, data] of hashtagMap) {
      try {
        const hashtag = await prisma.hashtag.upsert({
          where: { name },
          update: {
            displayName: data.displayName,
            videoCount: data.videos.size,
            viewCount: BigInt(data.views),
            lastUpdatedAt: new Date(),
          },
          create: {
            name,
            displayName: data.displayName,
            videoCount: data.videos.size,
            viewCount: BigInt(data.views),
          },
        })

        // Calculate trend metrics
        const previousTrend = await prisma.hashtagTrend.findFirst({
          where: { hashtagId: hashtag.id },
          orderBy: { timestamp: 'desc' },
        })

        let growthRate = 0
        if (previousTrend) {
          const viewDiff = Number(data.views - Number(previousTrend.viewCount))
          growthRate = previousTrend.viewCount > 0 
            ? (viewDiff / Number(previousTrend.viewCount)) * 100 
            : 0
        }

        const velocity = previousTrend ? growthRate : 0
        const trendScore = (growthRate * 0.5) + (data.videos.size * 0.3) + (velocity * 0.2)

        await prisma.hashtagTrend.create({
          data: {
            hashtagId: hashtag.id,
            videoCount: data.videos.size,
            viewCount: BigInt(data.views),
            likeCount: BigInt(0),
            shareCount: BigInt(0),
            commentCount: BigInt(0),
            growthRate,
            velocity,
            trendScore,
          },
        })

        hashtagsUpdated++
      } catch (error) {
        console.error(`Error updating hashtag ${name}:`, error)
      }
    }

    // Save sounds
    let soundsUpdated = 0
    for (const [id, data] of soundMap) {
      try {
        const sound = await prisma.sound.upsert({
          where: { tiktokId: id },
          update: {
            title: data.title,
            author: data.author,
            videoCount: data.videos.size,
            lastUpdatedAt: new Date(),
          },
          create: {
            tiktokId: id,
            title: data.title,
            author: data.author,
            duration: 0,
            videoCount: data.videos.size,
          },
        })

        const previousTrend = await prisma.soundTrend.findFirst({
          where: { soundId: sound.id },
          orderBy: { timestamp: 'desc' },
        })

        let growthRate = 0
        if (previousTrend) {
          const playDiff = Number(data.plays - Number(previousTrend.viewCount))
          growthRate = previousTrend.viewCount > 0 
            ? (playDiff / Number(previousTrend.viewCount)) * 100 
            : 0
        }

        const velocity = previousTrend ? growthRate : 0
        const trendScore = (growthRate * 0.5) + (data.videos.size * 0.3) + (velocity * 0.2)

        await prisma.soundTrend.create({
          data: {
            soundId: sound.id,
            videoCount: data.videos.size,
            viewCount: BigInt(data.plays),
            growthRate,
            velocity,
            trendScore,
          },
        })

        soundsUpdated++
      } catch (error) {
        console.error(`Error updating sound ${id}:`, error)
      }
    }

    // Save creators
    let creatorsUpdated = 0
    for (const [username, data] of creatorMap) {
      try {
        const creator = await prisma.creator.upsert({
          where: { username },
          update: {
            nickname: data.nickname,
            followerCount: data.followers,
            videoCount: data.videos.size,
            lastUpdatedAt: new Date(),
          },
          create: {
            tiktokId: username,
            username,
            nickname: data.nickname,
            followerCount: data.followers,
            videoCount: data.videos.size,
          },
        })

        const previousTrend = await prisma.creatorTrend.findFirst({
          where: { creatorId: creator.id },
          orderBy: { timestamp: 'desc' },
        })

        let growthRate = 0
        if (previousTrend) {
          const viewDiff = Number(data.totalViews - Number(previousTrend.totalViews))
          growthRate = previousTrend.totalViews > 0 
            ? (viewDiff / Number(previousTrend.totalViews)) * 100 
            : 0
        }

        const engagementRate = data.videos.size > 0 
          ? (data.totalViews / data.followers) / 100 
          : 0

        const trendScore = (growthRate * 0.4) + (engagementRate * 0.3) + (data.followers * 0.0001)

        await prisma.creatorTrend.create({
          data: {
            creatorId: creator.id,
            followerCount: data.followers,
            videoCount: data.videos.size,
            totalViews: BigInt(data.totalViews),
            totalLikes: BigInt(0),
            growthRate,
            engagementRate,
            trendScore,
          },
        })

        creatorsUpdated++
      } catch (error) {
        console.error(`Error updating creator ${username}:`, error)
      }
    }

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      processed: {
        videos: processedVideos,
        hashtags: hashtagsUpdated,
        sounds: soundsUpdated,
        creators: creatorsUpdated,
      }
    }

    console.log('✅ Trends updated:', summary)

    return NextResponse.json(summary)

  } catch (error) {
    console.error('❌ Error fetching trends:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
