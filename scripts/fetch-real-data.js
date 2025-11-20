require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const axios = require('axios')

const prisma = new PrismaClient()

async function fetchRealTikTokData() {
  console.log('🚀 Fetching Real TikTok Data\n')
  
  const api = axios.create({
    baseURL: `https://${process.env.RAPIDAPI_HOST}`,
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': process.env.RAPIDAPI_HOST,
    },
    timeout: 15000,
  })

  try {
    console.log('📥 Fetching feed videos...')
    const response = await api.get('/feed/list', { 
      params: { 
        count: 30,
        region: 'US'
      } 
    })
    
    if (response.data.code === 0 && response.data.data) {
      const videos = Array.isArray(response.data.data) ? response.data.data : []
      console.log(`✅ Fetched ${videos.length} videos`)
      
      // Extract hashtags from video titles
      const hashtagMap = new Map()
      
      videos.forEach(video => {
        const title = video.title || ''
        const playCount = video.play_count || 0
        
        // Extract hashtags from title using regex
        const hashtagMatches = title.match(/#[\w]+/g) || []
        
        hashtagMatches.forEach(hashtag => {
          const cleanName = hashtag.replace(/^#/, '').toLowerCase()
          
          if (hashtagMap.has(cleanName)) {
            const existing = hashtagMap.get(cleanName)
            existing.videoCount++
            existing.viewCount += BigInt(playCount)
          } else {
            hashtagMap.set(cleanName, {
              name: cleanName,
              displayName: hashtag,
              videoCount: 1,
              viewCount: BigInt(playCount),
            })
          }
        })
      })

      console.log(`\n📊 Found ${hashtagMap.size} unique hashtags`)
      
      let created = 0
      let updated = 0

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
            updated++
          } else {
            const hashtag = await prisma.hashtag.create({
              data: {
                name: data.name,
                displayName: data.displayName,
                videoCount: data.videoCount,
                viewCount: data.viewCount,
              }
            })
            
            // Create trend record
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
            created++
          }
          
          console.log(`✅ ${data.displayName}`)
        } catch (error) {
          console.log(`❌ Failed: ${data.displayName} - ${error.message}`)
        }
      }

      console.log(`\n📈 Summary:`)
      console.log(`   ✨ Created: ${created}`)
      console.log(`   🔄 Updated: ${updated}`)
      console.log(`   📊 Total: ${created + updated}`)
      
    } else {
      console.log('⚠️  No video data received from API')
      console.log('Response:', JSON.stringify(response.data, null, 2))
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.response) {
      console.error('Status:', error.response.status)
      console.error('Data:', error.response.data)
    }
  } finally {
    await prisma.$disconnect()
  }
}

fetchRealTikTokData()
