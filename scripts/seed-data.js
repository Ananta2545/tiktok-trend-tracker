const { PrismaClient } = require('@prisma/client')
const axios = require('axios')

const prisma = new PrismaClient()

async function fetchTikTokData() {
  const api = axios.create({
    baseURL: `https://${process.env.RAPIDAPI_HOST}`,
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': process.env.RAPIDAPI_HOST,
    },
    timeout: 15000,
  })

  console.log('🔍 Fetching trending hashtags from TikTok...')
  
  try {
    const response = await api.get('/feed/list', {
      params: { 
        count: 50,
        region: 'US'
      },
    })
    
    if (response.data.code === 0 && response.data.data) {
      // Handle both array and object with videos property
      let videos = []
      if (Array.isArray(response.data.data)) {
        videos = response.data.data
      } else if (response.data.data.videos && Array.isArray(response.data.data.videos)) {
        videos = response.data.data.videos
      }
      
      if (videos.length === 0) {
        console.log('⚠️  No videos returned from API. Using mock data instead.')
        return getMockData()
      }
      
      console.log(`📹 Found ${videos.length} videos`)
      
      // Extract hashtags from videos
      const hashtagMap = new Map()
      
      videos.forEach(video => {
        const title = video.title || ''
        const playCount = video.play_count || 0
        
        // Skip videos with no title
        if (!title) return
        
        const hashtagMatches = title.match(/#[\w]+/g) || []
        
        hashtagMatches.forEach(hashtag => {
          const cleanName = hashtag.replace(/^#/, '').toLowerCase()
          
          if (hashtagMap.has(cleanName)) {
            const existing = hashtagMap.get(cleanName)
            existing.video_count++
            existing.view_count += playCount
          } else {
            hashtagMap.set(cleanName, {
              challenge_info: {
                challenge_name: cleanName,
                stats: {
                  video_count: 1,
                  view_count: playCount
                }
              }
            })
          }
        })
      })
      
      // Convert to array and sort by views
      const challenges = Array.from(hashtagMap.values())
        .sort((a, b) => {
          const aViews = a.challenge_info?.stats?.view_count || 0
          const bViews = b.challenge_info?.stats?.view_count || 0
          return bViews - aViews
        })
        .slice(0, 20)
      
      console.log(`✅ Extracted ${challenges.length} hashtags from ${videos.length} videos`)
      return challenges
    } else {
      console.log('⚠️  Unexpected API response. Using mock data instead.')
      return getMockData()
    }
  } catch (error) {
    console.error('❌ Failed to fetch from TikTok API:', error.message)
    console.log('ℹ️  Using mock data instead...')
    return getMockData()
  }
}

function getMockData() {
  return [
    {
      challenge_info: {
        cid: '1',
        challenge_name: 'fyp',
        desc: 'For You Page - The main TikTok feed',
        stats: { video_count: 1500000000, view_count: 500000000000 }
      }
    },
    {
      challenge_info: {
        cid: '2',
        challenge_name: 'viral',
        desc: 'Viral content on TikTok',
        stats: { video_count: 800000000, view_count: 300000000000 }
      }
    },
    {
      challenge_info: {
        cid: '3',
        challenge_name: 'trending',
        desc: 'Trending content',
        stats: { video_count: 500000000, view_count: 200000000000 }
      }
    },
    {
      challenge_info: {
        cid: '4',
        challenge_name: 'dance',
        desc: 'Dance challenges and trends',
        stats: { video_count: 300000000, view_count: 150000000000 }
      }
    },
    {
      challenge_info: {
        cid: '5',
        challenge_name: 'comedy',
        desc: 'Funny and comedy content',
        stats: { video_count: 250000000, view_count: 120000000000 }
      }
    },
    {
      challenge_info: {
        cid: '6',
        challenge_name: 'tutorial',
        desc: 'How-to and tutorial videos',
        stats: { video_count: 200000000, view_count: 100000000000 }
      }
    },
    {
      challenge_info: {
        cid: '7',
        challenge_name: 'duet',
        desc: 'Duet with other creators',
        stats: { video_count: 180000000, view_count: 90000000000 }
      }
    },
    {
      challenge_info: {
        cid: '8',
        challenge_name: 'lifestyle',
        desc: 'Lifestyle and daily life content',
        stats: { video_count: 150000000, view_count: 80000000000 }
      }
    },
    {
      challenge_info: {
        cid: '9',
        challenge_name: 'music',
        desc: 'Music and audio content',
        stats: { video_count: 120000000, view_count: 70000000000 }
      }
    },
    {
      challenge_info: {
        cid: '10',
        challenge_name: 'fashion',
        desc: 'Fashion and style trends',
        stats: { video_count: 100000000, view_count: 60000000000 }
      }
    }
  ]
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...')
    
    // Fetch data
    const challenges = await fetchTikTokData()
    
    console.log(`📊 Processing ${challenges.length} hashtags...`)
    
    let created = 0
    let updated = 0
    
    for (const item of challenges) {
      const info = item.challenge_info || item
      
      if (!info || !info.challenge_name) {
        console.log('⚠️  Skipping invalid item:', item)
        continue
      }

      const hashtagName = info.challenge_name.replace(/^#/, '')
      const videoCount = info.stats?.video_count || 0
      const viewCount = BigInt(info.stats?.view_count || 0)

      try {
        // Check if hashtag exists
        const existing = await prisma.hashtag.findUnique({
          where: { name: hashtagName }
        })

        if (existing) {
          // Update existing
          await prisma.hashtag.update({
            where: { name: hashtagName },
            data: {
              displayName: `#${hashtagName}`,
              videoCount,
              viewCount,
            }
          })
          updated++
        } else {
          // Create new
          const hashtag = await prisma.hashtag.create({
            data: {
              name: hashtagName,
              displayName: `#${hashtagName}`,
              videoCount,
              viewCount,
            }
          })
          created++

          // Create initial trend record
          await prisma.hashtagTrend.create({
            data: {
              hashtagId: hashtag.id,
              videoCount,
              viewCount,
              likeCount: BigInt(0),
              shareCount: BigInt(0),
              commentCount: BigInt(0),
              growthRate: 0,
              velocity: 0,
              trendScore: Math.random() * 100,
              timestamp: new Date(),
            }
          })
        }
        
        console.log(`✅ Processed: #${hashtagName}`)
      } catch (error) {
        console.error(`❌ Failed to process #${hashtagName}:`, error.message)
      }
    }

    console.log('\n📈 Seed Summary:')
    console.log(`   ✨ Created: ${created} new hashtags`)
    console.log(`   🔄 Updated: ${updated} existing hashtags`)
    console.log(`   📊 Total: ${created + updated} hashtags`)
    console.log('\n✅ Database seeded successfully!')
    
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed
seedDatabase()
  .then(() => {
    console.log('\n🎉 All done! You can now view data in your dashboard.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
