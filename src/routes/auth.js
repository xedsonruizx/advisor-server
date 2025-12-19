import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/prisma.js'

const router = Router()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  name: z.string().min(2)
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional()
})

function signToken(userId, expiresIn = '1h') {
  const secret = process.env.JWT_SECRET
  return jwt.sign({ sub: userId }, secret, { expiresIn })
}

function setAuthCookie(res, token, maxAge) {
  const isProd = process.env.NODE_ENV === 'production'
  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/'
  }
  
  if (maxAge) {
    options.maxAge = maxAge
  }
  
  res.cookie('token', token, options)
}

router.post('/register', async (req, res) => {
  const parse = registerSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: 'invalid_input' })
  const { email, password, name } = parse.data
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return res.status(409).json({ error: 'email_in_use' })
  // Reduced cost to 10 for better performance while maintaining security
  const passwordHash = await bcrypt.hash(password, 10)
  let role = await prisma.role.findUnique({ where: { name: 'client' } })
  if (!role) role = await prisma.role.create({ data: { name: 'client' } })
  const user = await prisma.user.create({
    data: { email, name, passwordHash, roleId: role.id }
  })
  const token = signToken(user.id)
  setAuthCookie(res, token)
  res.status(201).json({ id: user.id, email: user.email, name: user.name, role: 'client' })
})

router.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body)
  if (!parse.success) {
    console.error('Login validation error:', parse.error)
    return res.status(400).json({ error: 'invalid_input' })
  }
  const { email, password, rememberMe } = parse.data
  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } })
  if (!user) {
    console.warn(`Login failed: User not found for email ${email}`)
    return res.status(401).json({ error: 'invalid_credentials' })
  }
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    console.warn(`Login failed: Invalid password for user ${email}`)
    return res.status(401).json({ error: 'invalid_credentials' })
  }
  
  // 30 days if remember me, otherwise 1 hour
  const expiresIn = rememberMe ? '30d' : '1h'
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined
  
  const token = signToken(user.id, expiresIn)
  setAuthCookie(res, token, maxAge)
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role?.name || null })
})

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' })
  res.status(204).end()
})

router.get('/me', async (req, res) => {
  const token = req.cookies.token
  // Return 200 with null user instead of 401/500 to avoid console errors on frontend
  if (!token) return res.json(null)
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: { include: { rolepermission: { include: { permission: true } } } } }
    })
    
    if (!user) return res.json(null)
    
    const permissions = (user.role?.rolepermission || []).map(rp => rp.permission.name)
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role?.name || null, permissions })
  } catch {
    // Invalid token, treat as logged out
    res.json(null)
  }
})

export const authRouter = router
