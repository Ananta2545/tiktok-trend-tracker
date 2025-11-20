require('dotenv').config()
const axios = require('axios')

async function testRapidAPI() {
  console.log('🧪 Testing RapidAPI Endpoints\n')
  console.log('API Key:', process.env.RAPIDAPI_KEY?.substring(0, 10) + '...')
  console.log('API Host:', process.env.RAPIDAPI_HOST)
  console.log('=' .repeat(50))

  const api = axios.create({
    baseURL: `https://${process.env.RAPIDAPI_HOST}`,
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': process.env.RAPIDAPI_HOST,
    },
    timeout: 15000,
  })

  // Test different endpoints to find working ones
  const endpoints = [
    { name: 'Feed List', path: '/feed/list', params: { count: 20 } },
    { name: 'Video Search', path: '/video/search', params: { keywords: 'trending', count: 20 } },
    { name: 'User Info', path: '/user/info', params: { unique_id: 'tiktok' } },
    { name: 'Video Info', path: '/video/info', params: { video_url: 'https://www.tiktok.com/@tiktok/video/7016165887010955525' } },
    { name: 'Hashtag Info', path: '/hashtag/info', params: { hashtag_name: 'fyp' } },
    { name: 'Music Info', path: '/music/info', params: { music_id: '123456' } },
  ]

  for (const endpoint of endpoints) {
    console.log(`\n📍 Testing: ${endpoint.name}`)
    console.log(`   Path: ${endpoint.path}`)
    
    try {
      const response = await api.get(endpoint.path, { params: endpoint.params })
      console.log(`   ✅ SUCCESS - Status: ${response.status}`)
      console.log(`   Response keys:`, Object.keys(response.data))
      
      if (response.data.data) {
        console.log(`   Data type:`, Array.isArray(response.data.data) ? 'Array' : 'Object')
        if (Array.isArray(response.data.data)) {
          console.log(`   Items count: ${response.data.data.length}`)
          if (response.data.data.length > 0) {
            console.log(`   First item keys:`, Object.keys(response.data.data[0]))
          }
        }
      }
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ FAILED - Status: ${error.response.status}`)
        console.log(`   Message:`, error.response.data?.message || error.message)
      } else {
        console.log(`   ❌ ERROR:`, error.message)
      }
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ Test completed!')
}

testRapidAPI().catch(console.error)
