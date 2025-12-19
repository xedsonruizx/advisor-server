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
  password: z.string().min(12)
})

function signToken(userId) {
  const secret = process.env.JWT_SECRET
  const expiresIn = '1h'
  return jwt.sign({ sub: userId }, secret, { expiresIn })
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production'
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/'
  })
}

router.post('/register', async (req, res) => {
  const parse = registerSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: 'invalid_input' })
  const { email, password, name } = parse.data
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return res.status(409).json({ error: 'email_in_use' })
  const passwordHash = await bcrypt.hash(password, 12)
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
  if (!parse.success) return res.status(400).json({ error: 'invalid_input' })
  const { email, password } = parse.data
  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } })
  if (!user) return res.status(401).json({ error: 'invalid_credentials' })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' })
  const token = signToken(user.id)
  setAuthCookie(res, token)
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role?.name || null })
})

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' })
  res.status(204).end()
})

router.get('/me', async (req, res) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ error: 'unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } }
    })
    if (!user) return res.status(401).json({ error: 'unauthorized' })
    const permissions = (user.role?.rolePermissions || []).map(rp => rp.permission.name)
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role?.name || null, permissions })
  } catch {
    res.status(401).json({ error: 'unauthorized' })
  }
})

export const authRouter = router
