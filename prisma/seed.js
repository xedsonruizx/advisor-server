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

async function upsertPlan(id, name, currency, price) {
  return prisma.membershipPlan.upsert({
    where: { id },
    update: { name, currency, price },
    create: { id, name, currency, price }
  })
}

async function upsertUser(email, name, password, role) {
  const passwordHash = await bcrypt.hash(password, 12)
  return prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, roleId: role.id },
    create: { email, name, passwordHash, roleId: role.id }
  })
}

async function main() {
  const adminRole = await upsertRole('admin', ['manage_users', 'manage_plans', 'view_advisories'])
  const advisorRole = await upsertRole('advisor', ['view_advisories', 'create_advisory'])
  const clientRole = await upsertRole('client', ['purchase_membership', 'view_advisories'])

  await upsertPlan('basic', 'Básico', 'clp', 25000)
  await upsertPlan('pro', 'Pro', 'clp', 55000)
  await upsertPlan('enterprise', 'Enterprise', 'clp', 120000)

  await upsertUser('admin@example.com', 'Admin', 'AdminPassword123!', adminRole)
  await upsertUser('advisor@example.com', 'Advisor', 'AdvisorPassword123!', advisorRole)
  const client1 = await upsertUser('client1@example.com', 'Client Uno', 'ClientPassword123!', clientRole)

  await prisma.user.update({
    where: { id: client1.id },
    data: { membershipPlanId: 'basic' }
  })
}

main().then(() => {
  process.exit(0)
}).catch(e => {
  process.exit(1)
})
