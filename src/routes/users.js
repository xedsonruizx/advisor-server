import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { requirePermission } from '../security/rbac.js'
import bcrypt from 'bcryptjs'

const router = Router()

// Get Roles (Placed first to ensure priority)
router.get('/roles', requirePermission('manage_users'), async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' }
    })
    res.json(roles)
  } catch (e) {
    console.error('Error fetching roles:', e)
    res.status(500).json({ error: 'fetch_roles_failed' })
  }
})

// List Users
router.get('/', requirePermission('manage_users'), async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      role: true,
      membershipPlan: true,
      _count: {
        select: { payments: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  res.json(users)
})

// Get Roles
/* router.get('/roles', requirePermission('manage_users'), async (req, res) => {
  const roles = await prisma.role.findMany({
    orderBy: { name: 'asc' }
  })
  res.json(roles)
}) */

// Get Single User
router.get('/:id', requirePermission('manage_users'), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      role: true,
      membershipPlan: true,
      payments: { orderBy: { createdAt: 'desc' } }
    }
  })
  if (!user) return res.status(404).json({ error: 'not_found' })
  res.json(user)
})

// Create User
router.post('/', requirePermission('manage_users'), async (req, res) => {
  const { name, email, password, roleId, membershipPlanId } = req.body
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'missing_fields' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        roleId: roleId || undefined,
        membershipPlanId: membershipPlanId || undefined
      }
    })
    res.status(201).json(user)
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(409).json({ error: 'email_exists' })
    }
    console.error(e)
    res.status(500).json({ error: 'create_failed' })
  }
})

// Update User (Role, Plan)
router.put('/:id', requirePermission('manage_users'), async (req, res) => {
  const { name, roleId, membershipPlanId, password } = req.body
  try {
    const data = {
      name,
      roleId: roleId || undefined,
      membershipPlanId: membershipPlanId || undefined
    }

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 12)
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data
    })
    res.json(user)
  } catch (e) {
    res.status(500).json({ error: 'update_failed' })
  }
})

// Delete User
router.delete('/:id', requirePermission('manage_users'), async (req, res) => {
  try {
    // Optional: Delete payments first or handle cascade if not configured in DB
    // Prisma usually needs explicit cascade or deletion of related records
    await prisma.payment.deleteMany({ where: { userId: req.params.id } })
    await prisma.user.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'delete_failed' })
  }
})

export const usersRouter = router
