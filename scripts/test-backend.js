require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const axios = require('axios')

const prisma = new PrismaClient()

async function testBackend() {
  console.log('🧪 Testing TikTok Trend Tracker Backend\n')
  console.log('=' .repeat(50))

  // Test 1: Database Connection
  console.log('\n📊 Test 1: Database Connection')
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    const hashtagCount = await prisma.hashtag.count()
    console.log(`   Found ${hashtagCount} hashtags in database`)
  } catch (error) {
    console.log('❌ Database connection failed:', error.message)
  }

  // Test 2: Redis Connection
  console.log('\n🔴 Test 2: Redis Connection')
  try {
    const redis = require('../lib/redis').default
    await redis.ping()
    console.log('✅ Redis connected successfully')
  } catch (error) {
    console.log('❌ Redis connection failed:', error.message)
  }

  // Test 3: RapidAPI TikTok
  console.log('\n🎵 Test 3: RapidAPI TikTok Connection')
  try {
    const api = axios.create({
      baseURL: `https://${process.env.RAPIDAPI_HOST}`,
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST,
      },
      timeout: 10000,
    })

    console.log('   Fetching trending hashtags...')
    const response = await api.get('/challenge/list', {
      params: { count: 5 },
    })
    
    if (response.data) {
      console.log('✅ RapidAPI connected successfully')
      console.log(`   Received data structure:`, Object.keys(response.data))
    }
  } catch (error) {
    console.log('❌ RapidAPI connection failed:', error.message)
    if (error.response) {
      console.log(`   Status: ${error.response.status}`)
      console.log(`   Message:`, error.response.data)
    }
  }

  // Test 4: Check Environment Variables
  console.log('\n🔧 Test 4: Environment Variables')
  const requiredEnvs = [
    'DATABASE_URL',
    'REDIS_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'RAPIDAPI_KEY',
    'RAPIDAPI_HOST',
  ]

  requiredEnvs.forEach(env => {
    if (process.env[env]) {
      console.log(`✅ ${env} is set`)
    } else {
      console.log(`❌ ${env} is missing`)
    }
  })

  // Test 5: Database Schema
  console.log('\n📋 Test 5: Database Schema')
  try {
    const tables = ['hashtag', 'sound', 'creator', 'user', 'alert', 'apiUsage']
    
    for (const table of tables) {
      const count = await prisma[table].count()
      console.log(`✅ Table '${table}': ${count} records`)
    }
  } catch (error) {
    console.log('❌ Schema check failed:', error.message)
  }

  // Test 6: Sample Data Query
  console.log('\n🔍 Test 6: Sample Data Query')
  try {
    const recentHashtags = await prisma.hashtag.findMany({
      take: 5,
      orderBy: { viewCount: 'desc' },
      select: {
        name: true,
        videoCount: true,
        viewCount: true,
      }
    })

    if (recentHashtags.length > 0) {
      console.log('✅ Top 5 hashtags:')
      recentHashtags.forEach((h, i) => {
        console.log(`   ${i + 1}. #${h.name} - ${h.videoCount} videos, ${h.viewCount.toString()} views`)
      })
    } else {
      console.log('⚠️  No hashtags found. Run: npm run seed')
    }
  } catch (error) {
    console.log('❌ Query failed:', error.message)
  }

  console.log('\n' + '='.repeat(50))
  console.log('\n🎉 Backend test completed!\n')

  await prisma.$disconnect()
}

testBackend().catch(console.error)
