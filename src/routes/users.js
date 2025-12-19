import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { requirePermission } from '../security/rbac.js'
import bcrypt from 'bcryptjs'

const router = Router()

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

// Update User (Role, Plan)
router.put('/:id', requirePermission('manage_users'), async (req, res) => {
  const { name, roleId, membershipPlanId } = req.body
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        name,
        roleId: roleId || undefined,
        membershipPlanId: membershipPlanId || undefined
      }
    })
    res.json(user)
  } catch (e) {
    res.status(500).json({ error: 'update_failed' })
  }
})

// Delete User
router.delete('/:id', requirePermission('manage_users'), async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (e) {
    res.status(500).json({ error: 'delete_failed' })
  }
})

export const usersRouter = router
