import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkAdminPermissions() {
  const adminEmail = 'admin@example.com'
  const user = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { 
      role: { 
        include: { 
          rolePermissions: { 
            include: { permission: true } 
          } 
        } 
      } 
    }
  })

  if (!user) {
    console.log('Admin user not found')
    return
  }

  console.log('User Role:', user.role?.name)
  const permissions = user.role?.rolePermissions.map(rp => rp.permission.name) || []
  console.log('Permissions:', permissions)
  
  if (permissions.includes('view_payments')) {
    console.log('✅ Has view_payments permission')
  } else {
    console.log('❌ MISSING view_payments permission')
  }
}

checkAdminPermissions()
  .catch(console.error)
  .finally(() => prisma.$disconnect())