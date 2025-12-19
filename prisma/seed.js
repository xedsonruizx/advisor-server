import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function upsertPermission(name) {
  return prisma.permission.upsert({
    where: { name },
    update: {},
    create: { name }
  })
}

async function upsertRole(name, permissionNames) {
  const role = await prisma.role.upsert({
    where: { name },
    update: {},
    create: { name }
  })
  for (const p of permissionNames) {
    const perm = await upsertPermission(p)
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
      update: {},
      create: { roleId: role.id, permissionId: perm.id }
    })
  }
  return role
}

async function upsertPlan(id, name, currency, price, level, isVisible = true) {
  return prisma.membershipplan.upsert({
    where: { id },
    update: { name, currency, price, level, isVisible },
    create: { id, name, currency, price, level, isVisible }
  })
}

async function upsertUser(email, name, password, role, planId = null) {
  const passwordHash = await bcrypt.hash(password, 12)
  return prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, roleId: role.id, membershipPlanId: planId },
    create: { email, name, passwordHash, roleId: role.id, membershipPlanId: planId }
  })
}

async function createFakeData(clientRole) {
  console.log('Seeding fake data...')
  
  const plans = ['basic', 'pro', 'enterprise']
  const names = ['Juan Perez', 'Maria Garcia', 'Pedro Lopez', 'Ana Martinez', 'Carlos Sanchez', 'Laura Torres']
  
  for (let i = 0; i < 15; i++) {
    const name = names[i % names.length] + ` ${i}`
    const email = `client${i+10}@example.com`
    const planId = plans[i % plans.length]
    
    const user = await upsertUser(email, name, 'ClientPassword123!', clientRole, planId)
    
    // Create fake payments for this user
    const numPayments = Math.floor(Math.random() * 3) + 1
    for (let j = 0; j < numPayments; j++) {
      await prisma.payment.create({
        data: {
          userId: user.id,
          amount: planId === 'basic' ? 25000 : planId === 'pro' ? 55000 : 120000,
          currency: 'clp',
          status: 'succeeded',
          planId: planId,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
        }
      })
    }
  }
}

async function main() {
  // Roles & Permissions
  // Admin gets all permissions
  const adminRole = await upsertRole('admin', ['manage_users', 'manage_plans', 'view_advisories', 'manage_posts', 'view_payments'])
  const advisorRole = await upsertRole('advisor', ['view_advisories', 'create_advisory', 'manage_posts'])
  const clientRole = await upsertRole('client', ['purchase_membership', 'view_advisories'])

  // Plans
  await upsertPlan('basic', 'Básico', 'clp', 25000, 1)
  await upsertPlan('pro', 'Pro', 'clp', 55000, 2)
  await upsertPlan('enterprise', 'Enterprise', 'clp', 120000, 3)
  
  // Hidden Admin/Lifetime Plan
  const lifetimePlan = await upsertPlan('lifetime', 'Membresía Vitalicia', 'clp', 0, 999, false)

  // Users
  // Admin with lifetime plan
  await upsertUser('admin@example.com', 'Administrador', 'root', adminRole, lifetimePlan.id)
  
  await upsertUser('advisor@example.com', 'Asesor Legal', 'AdvisorPassword123!', advisorRole)
  
  const client1 = await upsertUser('client1@example.com', 'Cliente Demo', 'ClientPassword123!', clientRole, 'basic')
  
  // Fake Data
  await createFakeData(clientRole)
}

main().then(() => {
  process.exit(0)
}).catch(e => {
  console.error(e)
  process.exit(1)
})
