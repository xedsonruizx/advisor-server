import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { requirePermission } from '../security/rbac.js'

const router = Router()

// List Payments
router.get('/', requirePermission('view_payments'), async (req, res) => {
  const payments = await prisma.payment.findMany({
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  res.json(payments)
})

export const paymentsRouter = router
