require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const axios = require('axios')

const prisma = new PrismaClient()

async function fetchCompleteTikTokData() {
  console.log('🚀 Fetching Complete TikTok Trend Data\n')
  
  const api = axios.create({
    baseURL: `https://${process.env.RAPIDAPI_HOST}`,
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': process.env.RAPIDAPI_HOST,
    },
    timeout: 15000,
  })

  try {
    console.log('📥 Fetching trending videos...')
    const response = await api.get('/feed/list', { 
      params: { 
        count: 50,
        region: 'US'
      } 
    })
    
    if (response.data.code !== 0 || !response.data.data) {
      console.log('⚠️  No data received')
      return
    }

    // Handle both array and videos array structure
    let videos = []
    if (Array.isArray(response.data.data)) {
      videos = response.data.data
    } else if (response.data.data.videos && Array.isArray(response.data.data.videos)) {
      videos = response.data.data.videos
    }

    console.log(`✅ Fetched ${videos.length} videos\n`)
    
    // Extract data
    const hashtagMap = new Map()
    const soundMap = new Map()
    const creatorMap = new Map()
    
    let processedVideos = 0
    
    for (const video of videos) {
      // Skip videos without title
      if (!video.title) continue
      
      processedVideos++
      
      // Extract hashtags
      const hashtagMatches = video.title.match(/#[\w]+/g) || []
      hashtagMatches.forEach(hashtag => {
        const cleanName = hashtag.replace(/^#/, '').toLowerCase()
        if (hashtagMap.has(cleanName)) {
          const existing = hashtagMap.get(cleanName)
          existing.videoCount++
          existing.viewCount += BigInt(video.play_count || 0)
        } else {
          hashtagMap.set(cleanName, {
            name: cleanName,
            displayName: hashtag,
            videoCount: 1,
            viewCount: BigInt(video.play_count || 0),
          })
        }
      })
      
      // Extract sound/music info
      if (video.music_info && video.music_info.id) {
        const soundId = video.music_info.id
        if (soundMap.has(soundId)) {
          const existing = soundMap.get(soundId)
          existing.videoCount++
          existing.playCount += video.play_count || 0
        } else {
          soundMap.set(soundId, {
            tiktokId: soundId,
            title: video.music_info.title || 'Unknown',
            author: video.music_info.author || 'Unknown',
            duration: video.music_info.duration || 0,
            playUrl: video.music_info.play || null,
            coverUrl: video.music_info.cover || null,
            isOriginal: video.music_info.original || false,
            videoCount: 1,
            playCount: video.play_count || 0,
          })
        }
      }
      
      // Extract creator info
      if (video.author && video.author.id) {
        const creatorId = video.author.id
        if (creatorMap.has(creatorId)) {
          const existing = creatorMap.get(creatorId)
          existing.videoCount++
          existing.totalViews += video.play_count || 0
          existing.totalLikes += video.digg_count || 0
        } else {
          creatorMap.set(creatorId, {
            tiktokId: creatorId,
            username: video.author.unique_id || 'unknown',
            displayName: video.author.nickname || 'Unknown',
            avatarUrl: video.author.avatar || null,
            followerCount: 0, // Not available in feed
            videoCount: 1,
            totalViews: video.play_count || 0,
            totalLikes: video.digg_count || 0,
            totalShares: video.share_count || 0,
          })
        }
      }
    }

    console.log(`📊 Processed ${processedVideos} videos`)
    console.log(`   Found ${hashtagMap.size} unique hashtags`)
    console.log(`   Found ${soundMap.size} unique sounds`)
    console.log(`   Found ${creatorMap.size} unique creators\n`)

    // Save hashtags
    console.log('💾 Saving hashtags...')
    let hashtagsCreated = 0
    let hashtagsUpdated = 0
    
    for (const [name, data] of hashtagMap) {
      try {
        const existing = await prisma.hashtag.findUnique({ where: { name } })
        
        if (existing) {
          await prisma.hashtag.update({
            where: { name },
            data: {
              videoCount: { increment: data.videoCount },
              viewCount: { increment: data.viewCount },
            }
          })
          hashtagsUpdated++
        } else {
          const hashtag = await prisma.hashtag.create({
            data: {
              name: data.name,
              displayName: data.displayName,
              videoCount: data.videoCount,
              viewCount: data.viewCount,
            }
          })
          
          // Create initial trend record
          await prisma.hashtagTrend.create({
            data: {
              hashtagId: hashtag.id,
              videoCount: data.videoCount,
              viewCount: data.viewCount,
              likeCount: BigInt(0),
              shareCount: BigInt(0),
              commentCount: BigInt(0),
              growthRate: 0,
              velocity: 0,
              trendScore: Math.random() * 100,
              timestamp: new Date(),
            }
          })
          hashtagsCreated++
        }
      } catch (error) {
        console.log(`   ❌ Failed: ${data.displayName}`)
      }
    }
    
    console.log(`   ✅ Created: ${hashtagsCreated}, Updated: ${hashtagsUpdated}`)

    // Save sounds
    console.log('💾 Saving sounds...')
    let soundsCreated = 0
    let soundsUpdated = 0
    
    for (const [tiktokId, data] of soundMap) {
      try {
        const existing = await prisma.sound.findUnique({ where: { tiktokId } })
        
        if (existing) {
          await prisma.sound.update({
            where: { tiktokId },
            data: {
              videoCount: { increment: data.videoCount },
            }
          })
          soundsUpdated++
        } else {
          const sound = await prisma.sound.create({
            data: {
              tiktokId: data.tiktokId,
              title: data.title,
              author: data.author,
              duration: data.duration,
              playUrl: data.playUrl,
              coverUrl: data.coverUrl,
              isOriginal: data.isOriginal,
              videoCount: data.videoCount,
            }
          })
          
          // Create initial trend record
          await prisma.soundTrend.create({
            data: {
              soundId: sound.id,
              videoCount: data.videoCount,
              viewCount: BigInt(data.playCount),
              growthRate: 0,
              velocity: 0,
              trendScore: Math.random() * 100,
              timestamp: new Date(),
            }
          })
          soundsCreated++
        }
      } catch (error) {
        console.log(`   ❌ Failed: ${data.title}`)
      }
    }
    
    console.log(`   ✅ Created: ${soundsCreated}, Updated: ${soundsUpdated}`)

    // Save creators
    console.log('💾 Saving creators...')
    let creatorsCreated = 0
    let creatorsUpdated = 0
    
    for (const [tiktokId, data] of creatorMap) {
      try {
        const existing = await prisma.creator.findUnique({ where: { tiktokId } })
        
        if (existing) {
          await prisma.creator.update({
            where: { tiktokId },
            data: {
              videoCount: { increment: data.videoCount },
              likeCount: { increment: BigInt(data.totalLikes) },
            }
          })
          creatorsUpdated++
        } else {
          const creator = await prisma.creator.create({
            data: {
              tiktokId: data.tiktokId,
              username: data.username,
              nickname: data.displayName,
              avatarUrl: data.avatarUrl,
              followerCount: data.followerCount,
              videoCount: data.videoCount,
              likeCount: BigInt(data.totalLikes),
            }
          })
          
          // Create initial trend record
          await prisma.creatorTrend.create({
            data: {
              creatorId: creator.id,
              followerCount: data.followerCount,
              videoCount: data.videoCount,
              totalViews: BigInt(data.totalViews),
              totalLikes: BigInt(data.totalLikes),
              growthRate: 0,
              engagementRate: 0,
              trendScore: Math.random() * 100,
              timestamp: new Date(),
            }
          })
          creatorsCreated++
        }
      } catch (error) {
        console.log(`   ❌ Failed: ${data.username}`)
      }
    }
    
    console.log(`   ✅ Created: ${creatorsCreated}, Updated: ${creatorsUpdated}`)

    console.log('\n📈 Summary:')
    console.log(`   Hashtags: ${hashtagsCreated + hashtagsUpdated}`)
    console.log(`   Sounds: ${soundsCreated + soundsUpdated}`)
    console.log(`   Creators: ${creatorsCreated + creatorsUpdated}`)
    console.log('\n✅ Complete TikTok data fetched successfully!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.response) {
      console.error('Status:', error.response.status)
    }
  } finally {
    await prisma.$disconnect()
  }
}

fetchCompleteTikTokData()
