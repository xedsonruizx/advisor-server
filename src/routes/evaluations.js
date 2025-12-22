import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'

const router = Router()

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  // Assuming auth middleware populates req.user or we fetch it
  // For now, we rely on the caller to ensure authentication. 
  // TODO: Integrate with auth middleware properly.
  // This is a placeholder. Real implementation depends on how auth is handled globally.
  // Based on other routes, we might need to verify token here if not done globally.
  next()
}

// --- Admin Routes ---

const optionSchema = z.object({
  text: z.string(),
  value: z.string().nullish(),
  score: z.number().default(0),
  penalty: z.string().nullish(),
  conditionOperator: z.string().nullish(),
  order: z.number().default(0)
})

const questionSchema = z.object({
  text: z.string(),
  type: z.enum(['text', 'number', 'select', 'radio', 'checkbox', 'date']),
  order: z.number().default(0),
  required: z.boolean().default(true),
  parentQuestionId: z.string().nullish(),
  parentOptionId: z.string().nullish(),
  conditionOperator: z.string().nullish(),
  conditionValue: z.string().nullish(),
  options: z.array(optionSchema).optional()
})

const questionUpdateSchema = questionSchema.extend({
  parentQuestionId: z.string().nullish(),
  parentOptionId: z.string().nullish(),
  conditionOperator: z.string().nullish(),
  conditionValue: z.string().nullish()
})

// Create Question
router.post('/questions', async (req, res) => {
  try {
    const parse = questionUpdateSchema.safeParse(req.body)
    if (!parse.success) return res.status(400).json({ error: parse.error })
    
    const { options, ...questionData } = parse.data
    
    const question = await prisma.evaluationQuestion.create({
      data: {
        ...questionData,
        options: {
          create: options || []
        }
      },
      include: { options: true }
    })
    
    res.json(question)
  } catch (error) {
    console.error('Error creating question:', error)
    res.status(500).json({ error: 'Failed to create question' })
  }
})

// Update Question
router.put('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params
    // Simple update logic. For options, it's complex (update/create/delete).
    // For MVP, we might replace options or handle them separately.
    // Let's assume full replacement of options for simplicity or just updating question fields.
    // If options are provided, we delete existing and create new ones (brute force) or handle granularly.
    // Brute force is safer for integrity but changes IDs.
    
    const parse = questionUpdateSchema.safeParse(req.body)
    if (!parse.success) return res.status(400).json({ error: parse.error })
    
    const { options, ...questionData } = parse.data
    
    // Transaction to update question and replace options
    const question = await prisma.$transaction(async (tx) => {
      await tx.evaluationOption.deleteMany({ where: { questionId: id } })
      
      return tx.evaluationQuestion.update({
        where: { id },
        data: {
          ...questionData,
          options: {
            create: options || []
          }
        },
        include: { options: true }
      })
    })
    
    res.json(question)
  } catch (error) {
    console.error('Error updating question:', error)
    res.status(500).json({ error: 'Failed to update question' })
  }
})

// Delete Question
router.delete('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params
    await prisma.evaluationQuestion.delete({ where: { id } })
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting question:', error)
    res.status(500).json({ error: 'Failed to delete question' })
  }
})

// Get All Questions (Admin)
router.get('/questions', async (req, res) => {
  try {
    const questions = await prisma.evaluationQuestion.findMany({
      include: { options: true },
      orderBy: { order: 'asc' }
    })
    res.json(questions)
  } catch (error) {
    console.error('Error fetching questions:', error)
    res.status(500).json({ error: 'Failed to fetch questions' })
  }
})

// --- User Routes ---

// Get Evaluation Structure (Public/User)
router.get('/structure', async (req, res) => {
  try {
    const questions = await prisma.evaluationQuestion.findMany({
      include: { options: true },
      orderBy: { order: 'asc' }
    })
    res.json(questions)
  } catch (error) {
    console.error('Error fetching structure:', error)
    res.status(500).json({ error: 'Failed to fetch structure' })
  }
})

const submitSchema = z.object({
  userId: z.string(),
  responses: z.array(z.object({
    questionId: z.string(),
    optionId: z.string().optional(), // For select/radio
    optionIds: z.array(z.string()).optional(), // For checkbox (if we handle array)
    textValue: z.string().optional() // For text/number
  }))
})

// Submit Evaluation
router.post('/submit', async (req, res) => {
  try {
    const parse = submitSchema.safeParse(req.body)
    if (!parse.success) return res.status(400).json({ error: parse.error })
    
    const { userId, responses } = parse.data
    
    // Check if evaluation already exists
    const existingEval = await prisma.evaluation.findUnique({ where: { userId } })
    if (existingEval) {
      // Logic: "se debe borrar cada vez que se reinicia la prueba"
      // If submitting, we assume it's a new attempt replacing the old one.
      await prisma.evaluation.delete({ where: { userId } })
    }
    
    // Calculate score and process responses
    let totalScore = 0
    let maxPossibleScore = 0
    const processedResponses = []
    
    // Fetch all questions to calculate max score
    const allQuestions = await prisma.evaluationQuestion.findMany({
      include: { options: true }
    })

    // Calculate max possible score dynamically based on user's path (conditional logic)
    // We need to simulate the "visible" questions based on the user's responses to determine the max score
    // However, the backend receives only the responses.
    // Ideally, we should calculate max score based on the questions that *were* answered or *should have been* answered.
    // A simpler approach for now: Calculate max score based on the questions that the user actually answered (assuming frontend sends only visible ones)
    // OR: Re-evaluate visibility logic here. Re-evaluating is safer but complex.
    // Given the prompt: "only questions that appear in the evaluation will be part of the total score".
    // Since the frontend filters visible questions, the `responses` array contains exactly the questions that were shown.
    // So we can iterate through `responses` to identify which questions were part of this user's evaluation path.
    
    // 1. Get all questions to have their metadata (type, options, scores)
    const allQuestionsMap = new Map(allQuestions.map(q => [q.id, q]))

    for (const resp of responses) {
      const question = allQuestionsMap.get(resp.questionId)
      if (!question) continue

      // Calculate Max Score for this specific question
      if (['select', 'radio'].includes(question.type)) {
        const maxOptionScore = question.options.reduce((max, opt) => Math.max(max, opt.score), 0)
        maxPossibleScore += maxOptionScore
      } else if (question.type === 'checkbox') {
        const sumOptionScores = question.options.reduce((sum, opt) => sum + (opt.score > 0 ? opt.score : 0), 0)
        maxPossibleScore += sumOptionScores
      } else if (question.type === 'number' && question.options && question.options.length > 0) {
        // For number questions with rules, max score should be just 1 (base points for answering)
        // because rules are now ONLY for penalties (messages), not scoring adjustment.
        maxPossibleScore += 1 
      } else {
        // Text/Number (without rules)/Date
        maxPossibleScore += 1
      }

      // Calculate Actual Score
      // ... (existing logic below)
      
      // Handle Multi-select (checkbox) - array of optionIds
      if (resp.optionIds && resp.optionIds.length > 0) {
        for (const optId of resp.optionIds) {
          const option = question.options.find(o => o.id === optId) // Use pre-fetched options
          if (option) {
            totalScore += option.score
            processedResponses.push({
              questionId: resp.questionId,
              optionId: optId
            })
          }
        }
      } 
      // Handle Single Select / Radio
      else if (resp.optionId) {
        const option = question.options.find(o => o.id === resp.optionId)
        if (option) {
          totalScore += option.score
          processedResponses.push({
            questionId: resp.questionId,
            optionId: resp.optionId
          })
        }
      } 
      // Handle Text/Number
      else if (resp.textValue) {
        let matchedOptionId = null
        let points = 1 // Default point

        // Check if there are rules (options) for this number question
        if (question.type === 'number' && question.options && question.options.length > 0) {
          const val = parseFloat(resp.textValue)
          if (!isNaN(val)) {
            // Sort options by order to prioritize
            const sortedOptions = [...question.options].sort((a, b) => a.order - b.order)
            
            for (const opt of sortedOptions) {
              if (opt.conditionOperator && opt.value) {
                const target = parseFloat(opt.value)
                let match = false
                switch (opt.conditionOperator) {
                  case 'equals': match = val === target; break;
                  case 'not_equals': match = val !== target; break;
                  case 'greater_than': match = val > target; break;
                  case 'less_than': match = val < target; break;
                  case 'greater_than_or_equal': match = val >= target; break;
                  case 'less_than_or_equal': match = val <= target; break;
                }
                
                if (match) {
                  // points = opt.score // Score ignored for number rules, only penalty text used
                  matchedOptionId = opt.id
                  break; // Stop at first match
                }
              }
            }
          }
        }

        totalScore += points
        processedResponses.push({
          questionId: resp.questionId,
          textValue: resp.textValue,
          optionId: matchedOptionId // Link the rule if matched
        })
      }
    }
    
    const evaluation = await prisma.evaluation.create({
      data: {
        userId,
        score: totalScore,
        maxScore: maxPossibleScore,
        status: 'completed',
        completedAt: new Date(),
        responses: {
          create: processedResponses
        }
      },
      include: { responses: true }
    })
    
    res.json(evaluation)
  } catch (error) {
    console.error('Error submitting evaluation:', error)
    res.status(500).json({ error: 'Failed to submit evaluation' })
  }
})

// Get User Results
router.get('/results/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const evaluation = await prisma.evaluation.findUnique({
      where: { userId },
      include: {
        responses: {
          include: {
            question: true,
            option: true
          }
        }
      }
    })
    
    if (!evaluation) return res.status(404).json({ error: 'Evaluation not found' })
    
    res.json(evaluation)
  } catch (error) {
    console.error('Error fetching results:', error)
    res.status(500).json({ error: 'Failed to fetch results' })
  }
})

// Reset Evaluation
router.delete('/reset/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    await prisma.evaluation.deleteMany({ where: { userId } }) // deleteMany avoids error if not found? No, delete needs unique. deleteMany is safer if unique constraint might verify. But userId is unique.
    // Actually findUnique + delete is standard.
    // But if it doesn't exist, delete throws? deleteMany returns count.
    // Let's use delete if exists.
    
    const existing = await prisma.evaluation.findUnique({ where: { userId } })
    if (existing) {
      await prisma.evaluation.delete({ where: { userId } })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error resetting evaluation:', error)
    res.status(500).json({ error: 'Failed to reset evaluation' })
  }
})

export const evaluationRouter = router
