import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import { authRouter } from './routes/auth.js'
import { membershipRouter } from './routes/memberships.js'
import { postsRouter } from './routes/posts.js'
import { usersRouter } from './routes/users.js'
import { paymentsRouter } from './routes/payments.js'
import { faqsRouter } from './routes/faqs.js'

const app = express()
const port = process.env.PORT || 4000
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

app.set('trust proxy', 1)
app.use(helmet())
app.use(
  cors({
    origin: clientUrl,
    credentials: true
  })
)
app.use(express.json())
app.use(cookieParser())
app.use(morgan('combined'))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})
app.use(limiter)

app.get('/health', (req, res) => res.json({ ok: true }))
app.use('/api/auth', authRouter)
app.use('/api/memberships', membershipRouter)
app.use('/api/posts', postsRouter)
app.use('/api/users', usersRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/faqs', faqsRouter)

app.use((err, req, res, next) => {
  const status = err.status || 500
  res.status(status).json({ error: 'internal_error' })
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
