import express, { Router } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/prisma.js'
import { z } from 'zod'
import { createCheckoutSession } from '../services/payment.js'
import { requirePermission, requireAuth } from '../security/rbac.js'

const router = Router()

const purchaseSchema = z.object({
  planId: z.enum(['basic', 'pro', 'enterprise'])
})

router.get('/plans', async (req, res) => {
  try {
    const items = await prisma.membershipplan.findMany({
      where: { isVisible: true },
      orderBy: { price: 'asc' }
    })
    res.json(items)
  } catch (e) {
    console.error('Error fetching membership plans:', e)
    res.status(500).json({ error: 'fetch_plans_failed' })
  }
})

router.post('/purchase', requirePermission('purchase_membership'), async (req, res) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ error: 'unauthorized' })
  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }
  const parse = purchaseSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: 'invalid_input' })
  const { planId } = parse.data
  const plan = await prisma.membershipplan.findUnique({ where: { id: planId } })
  if (!plan) return res.status(404).json({ error: 'plan_not_found' })
  const session = await createCheckoutSession({
    plan,
    customerId: payload.sub,
    successUrl: `${process.env.CLIENT_URL}/dashboard?status=success`,
    cancelUrl: `${process.env.CLIENT_URL}/memberships?status=cancel`
  })
  res.json({ checkoutUrl: session.url })
})

router.post('/webhook', express.json({ type: 'application/json' }), async (req, res) => {
  res.status(200).end()
})

router.get('/status', requireAuth, async (req, res) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ error: 'unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, include: { membershipplan: true } })
    res.json({ membership: user?.membershipplan || null })
  } catch {
    res.status(401).json({ error: 'unauthorized' })
  }
})

export const membershipRouter = router
