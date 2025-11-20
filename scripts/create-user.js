require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUser() {
  console.log('👤 Creating test user...\n')

  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })

    if (existing) {
      console.log('✅ Test user already exists')
      console.log('   Email: test@example.com')
      console.log('   Password: password123')
      return
    }

    // Create user with hashed password
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
      }
    })

    console.log('✅ Test user created successfully!')
    console.log('   Email: test@example.com')
    console.log('   Password: password123')
    console.log('\n🔐 You can now login to view the dashboard')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
