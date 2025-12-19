import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetAdmin() {
  const email = 'admin@example.com'
  const newPassword = 'root'
  
  console.log(`Checking user ${email}...`)
  const user = await prisma.user.findUnique({ where: { email } })
  
  if (!user) {
    console.log('User not found!')
    return
  }
  
  console.log('User found. Resetting password...')
  // Using cost 10 as per recent optimization
  const passwordHash = await bcrypt.hash(newPassword, 10)
  
  await prisma.user.update({
    where: { email },
    data: { passwordHash }
  })
  
  console.log(`Password for ${email} has been reset to: ${newPassword}`)
  
  // Verify immediately
  const updatedUser = await prisma.user.findUnique({ where: { email } })
  const match = await bcrypt.compare(newPassword, updatedUser.passwordHash)
  console.log(`Immediate verification match: ${match}`)
}

resetAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect())