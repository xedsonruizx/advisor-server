import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function check() {
  const roles = await prisma.role.findMany()
  console.log('ROLES EN DB:', roles)
}
check()