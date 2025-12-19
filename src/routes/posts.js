import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requirePermission, requireAuth, optionalAuth } from '../security/rbac.js'

const router = Router()

const postSchema = z.object({
  title: z.string().min(3),
  shortDescription: z.string().min(5),
  content: z.string().min(10),
  mediaUrl: z.string().optional().or(z.literal('')).or(z.null()),
  mediaType: z.enum(['image', 'video']).optional().or(z.literal('')).or(z.null()),
  minPlanId: z.string().optional().or(z.literal('')).or(z.null())
})

// Public/Client: Get posts (with locking logic)
router.get('/', optionalAuth, async (req, res) => {
  const userId = req.userId
  let userLevel = 0

  if (userId) {
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      include: { membershipplan: true } 
    })
    userLevel = user?.membershipplan?.level || 0
  }

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: { membershipplan: true }
  })

  const processedPosts = posts.map(post => {
    const requiredLevel = post.membershipplan?.level || 0
    const isLocked = userLevel < requiredLevel

    if (isLocked) {
      return {
        id: post.id,
        title: post.title,
        shortDescription: post.shortDescription,
        createdAt: post.createdAt,
        minPlan: post.membershipplan,
        isLocked: true,
        content: null,
        mediaUrl: null,
        mediaType: null
      }
    }
    
    return { ...post, minPlan: post.membershipplan, isLocked: false }
  })

  res.json(processedPosts)
})

// Public/Client: Get Single Post (with locking logic)
router.get('/:id', optionalAuth, async (req, res) => {
  const userId = req.userId
  let userLevel = 0

  if (userId) {
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      include: { membershipplan: true } 
    })
    userLevel = user?.membershipplan?.level || 0
  }

  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: { membershipplan: true }
  })

  if (!post) return res.status(404).json({ error: 'not_found' })

  const requiredLevel = post.membershipplan?.level || 0
  const isLocked = userLevel < requiredLevel

  if (isLocked) {
    res.json({
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      createdAt: post.createdAt,
      minPlan: post.membershipplan,
      isLocked: true,
      content: null,
      mediaUrl: null,
      mediaType: null
    })
  } else {
    res.json({ ...post, minPlan: post.membershipplan, isLocked: false })
  }
})

// Admin: Create Post
router.post('/', requirePermission('manage_plans'), async (req, res) => {
  const parse = postSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: 'invalid_input', details: parse.error })
  
  const { title, shortDescription, content, mediaUrl, mediaType, minPlanId } = parse.data
  
  const post = await prisma.post.create({
    data: {
      title,
      shortDescription,
      content,
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaType || undefined,
      minPlanId: minPlanId || undefined
    }
  })
  
  res.status(201).json(post)
})

// Admin: Update Post
router.put('/:id', requirePermission('manage_plans'), async (req, res) => {
  const parse = postSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: 'invalid_input', details: parse.error })

  const { title, shortDescription, content, mediaUrl, mediaType, minPlanId } = parse.data
  
  try {
    const post = await prisma.post.update({
      where: { id: req.params.id },
      data: {
        title,
        shortDescription,
        content,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        minPlanId: minPlanId || null
      }
    })
    res.json(post)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'not_found' })
    throw e
  }
})

// Admin: Delete Post
router.delete('/:id', requirePermission('manage_plans'), async (req, res) => {
  try {
    await prisma.post.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'not_found' })
    throw e
  }
})

export const postsRouter = router
