import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function checkUsers() {
  const users = await prisma.user.findMany({
    include: { role: true }
  })
  console.log('USERS:', JSON.stringify(users, null, 2))
}
checkUsers()