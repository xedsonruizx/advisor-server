import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { requirePermission } from '../security/rbac.js'

const router = Router()

// Public: Get all FAQs
router.get('/', async (req, res) => {
  try {
    const faqs = await prisma.faq.findMany({
      orderBy: { order: 'asc' }
    })
    res.json(faqs)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'fetch_faqs_failed' })
  }
})

// Admin: Create FAQ
router.post('/', requirePermission('manage_users'), async (req, res) => {
  const { question, answer, order } = req.body
  if (!question || !answer || question.trim().length < 5 || answer.trim().length < 10) {
    return res.status(400).json({ error: 'invalid_input' })
  }
  
  try {
    const faq = await prisma.faq.create({
      data: {
        question,
        answer,
        order: order || 0
      }
    })
    res.status(201).json(faq)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'create_faq_failed' })
  }
})

// Admin: Update FAQ
router.put('/:id', requirePermission('manage_users'), async (req, res) => {
  const { question, answer, order } = req.body
  
  if (question && question.trim().length < 5) return res.status(400).json({ error: 'invalid_question' })
  if (answer && answer.trim().length < 10) return res.status(400).json({ error: 'invalid_answer' })

  try {
    const faq = await prisma.faq.update({
      where: { id: req.params.id },
      data: {
        question,
        answer,
        order
      }
    })
    res.json(faq)
  } catch (e) {
    res.status(500).json({ error: 'update_faq_failed' })
  }
})

// Admin: Delete FAQ
router.delete('/:id', requirePermission('manage_users'), async (req, res) => {
  try {
    await prisma.faq.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (e) {
    res.status(500).json({ error: 'delete_faq_failed' })
  }
})

export const faqsRouter = router
