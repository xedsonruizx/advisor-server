import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requirePermission, optionalAuth } from '../security/rbac.js'

const router = Router()

const docSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional().or(z.literal('')).or(z.null()),
  type: z.enum(['folder', 'file']).default('folder'),
  isDraft: z.boolean().default(true),
  parentId: z.string().optional().or(z.literal('')).or(z.null()),
  order: z.number().int().default(0),
  minPlanId: z.string().optional().or(z.literal('')).or(z.null())
})

// Get Tree (or list of all items to build tree)
router.get('/tree', optionalAuth, async (req, res) => {
    const userId = req.userId
    let isAdmin = false
    let userLevel = 0
    
    if (userId) {
        const user = await prisma.user.findUnique({ 
            where: { id: userId }, 
            include: { role: true, membershipplan: true } 
        })
        isAdmin = user?.role?.name === 'admin'
        userLevel = user?.membershipplan?.level || 0
    }

    const where = isAdmin ? {} : { isDraft: false }

    const items = await prisma.documentationItem.findMany({
        where,
        orderBy: { order: 'asc' },
        include: { membershipplan: true }
    })

    const result = items.map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        parentId: item.parentId,
        order: item.order,
        isDraft: item.isDraft,
        minPlanId: item.minPlanId,
        isLocked: item.minPlanId ? (userLevel < (item.membershipplan?.level || 0)) : false
    }))

    res.json(result)
})

// Get Item Content
router.get('/:id', optionalAuth, async (req, res) => {
    const userId = req.userId
    
    const item = await prisma.documentationItem.findUnique({
        where: { id: req.params.id },
        include: { membershipplan: true }
    })

    if (!item) return res.status(404).json({ error: 'not_found' })

    // Check Draft
    let isAdmin = false
    let userLevel = 0
    if (userId) {
         const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true, membershipplan: true } })
         isAdmin = user?.role?.name === 'admin'
         userLevel = user?.membershipplan?.level || 0
    }

    if (item.isDraft && !isAdmin) {
        return res.status(404).json({ error: 'not_found' })
    }

    // Check Subscription
    const requiredLevel = item.membershipplan?.level || 0
    if (requiredLevel > userLevel && !isAdmin) {
        return res.status(403).json({ error: 'subscription_required', requiredLevel })
    }

    res.json(item)
})

// Admin: Create
router.post('/', requirePermission('manage_plans'), async (req, res) => { 
    const parse = docSchema.safeParse(req.body)
    if (!parse.success) return res.status(400).json({ error: 'invalid_input', details: parse.error })
    
    const data = parse.data
    const item = await prisma.documentationItem.create({
        data: {
            title: data.title,
            content: data.content,
            type: data.type,
            isDraft: data.isDraft,
            order: data.order,
            parentId: data.parentId || null,
            minPlanId: data.minPlanId || null
        }
    })
    res.json(item)
})

// Admin: Update
router.put('/:id', requirePermission('manage_plans'), async (req, res) => {
    const parse = docSchema.safeParse(req.body)
    if (!parse.success) return res.status(400).json({ error: 'invalid_input', details: parse.error })

    const data = parse.data
    try {
        const item = await prisma.documentationItem.update({
            where: { id: req.params.id },
            data: {
                title: data.title,
                content: data.content,
                type: data.type,
                isDraft: data.isDraft,
                order: data.order,
                parentId: data.parentId || null,
                minPlanId: data.minPlanId || null
            }
        })
        res.json(item)
    } catch(e) {
        if (e.code === 'P2025') return res.status(404).json({ error: 'not_found' })
        throw e
    }
})

// Admin: Delete
router.delete('/:id', requirePermission('manage_plans'), async (req, res) => {
    try {
        await prisma.documentationItem.delete({ where: { id: req.params.id } })
        res.status(204).send()
    } catch(e) {
        if (e.code === 'P2025') return res.status(404).json({ error: 'not_found' })
        throw e
    }
})

export const docsRouter = router
