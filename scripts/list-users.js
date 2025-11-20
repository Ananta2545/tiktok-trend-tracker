require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
    })
    
    console.log('📋 Users in database:')
    if (users.length === 0) {
      console.log('   (No users found)')
    } else {
      users.forEach(u => console.log(`   - ${u.email} (${u.name || 'No name'})`))
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
