import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/prisma.js'
import { sendMail } from '../services/mailer.js'
import { buildResetPasswordMail } from '../emails/auth/resetPassword.js'
import { buildVerifyEmailMail } from '../emails/auth/verifyEmail.js'
import { v4 as uuidv4 } from 'uuid'

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
  const verificationToken = uuidv4()
  const user = await prisma.user.create({
    data: { email, name, passwordHash, roleId: role.id, verificationToken }
  })
  const verifyUrl = `http://localhost:${process.env.PORT || 4000}/api/auth/verify?token=${verificationToken}`
  try {
    const mail = buildVerifyEmailMail({
      name,
      verifyUrl,
      clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
    })
    await sendMail({ to: email, subject: mail.subject, html: mail.html, text: mail.text })
  } catch (e) {
    console.error('Email verification send failed:', e?.message || e)
  }
  const token = signToken(user.id)
  setAuthCookie(res, token)
  res.status(201).json({ id: user.id, email: user.email, name: user.name, role: 'client', emailVerified: user.emailVerified })
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
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role?.name || null, emailVerified: user.emailVerified })
})

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' })
  res.status(204).end()
})

router.post('/forgot', async (req, res) => {
  const email = req.body?.email
  if (!email) return res.status(400).json({ error: 'invalid_input' })
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    // Always respond 200 to avoid email enumeration
    if (user) {
      const resetToken = uuidv4()
      const expires = new Date(Date.now() + 60 * 60 * 1000) // 1h
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: resetToken, passwordResetTokenExpires: expires }
      })
      const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`
      try {
        const mail = buildResetPasswordMail({
          name: user.name || '',
          resetUrl,
          clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
        })
        await sendMail({ to: email, subject: mail.subject, html: mail.html, text: mail.text })
      } catch (e) {
        console.error('Password reset send failed:', e?.message || e)
      }
    }
    res.json({ ok: true })
  } catch (e) {
    res.json({ ok: true })
  }
})

const resetSchema = z.object({
  token: z.string().uuid(),
  password: z.string().min(12)
})

router.post('/reset', async (req, res) => {
  const parse = resetSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: 'invalid_input' })
  const { token, password } = parse.data
  const user = await prisma.user.findFirst({ where: { passwordResetToken: token } })
  if (!user) return res.status(400).json({ error: 'invalid_token' })
  if (!user.passwordResetTokenExpires || user.passwordResetTokenExpires < new Date()) {
    return res.status(400).json({ error: 'token_expired' })
  }
  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetTokenExpires: null }
  })
  res.json({ ok: true })
})

router.get('/verify', async (req, res) => {
  const token = req.query.token
  if (!token) return res.status(400).json({ error: 'invalid_token' })
  const user = await prisma.user.findFirst({ where: { verificationToken: token } })
  if (!user) return res.status(400).json({ error: 'invalid_token' })
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null }
  })
  res.json({ ok: true })
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
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role?.name || null, permissions, emailVerified: user.emailVerified })
  } catch {
    // Invalid token, treat as logged out
    res.json(null)
  }
})

const updateMeSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().min(1).optional(),
  password: z.string().min(12).optional()
}).refine((data) => {
  if (data.password && !data.currentPassword) return false
  return true
}, { message: 'current_password_required', path: ['currentPassword'] })

router.put('/me', async (req, res) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ error: 'unauthorized' })
  const parsed = updateMeSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) return res.status(404).json({ error: 'not_found' })
    
    const data = {}
    if (parsed.data.name) data.name = parsed.data.name
    if (parsed.data.email && parsed.data.email !== user.email) {
      const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } })
      if (exists) return res.status(409).json({ error: 'email_in_use' })
      data.email = parsed.data.email
    }
    if (parsed.data.password) {
      const ok = await bcrypt.compare(parsed.data.currentPassword || '', user.passwordHash)
      if (!ok) return res.status(401).json({ error: 'invalid_current_password' })
      data.passwordHash = await bcrypt.hash(parsed.data.password, 10)
    }
    
    const updated = await prisma.user.update({ where: { id: user.id }, data })
    const role = await prisma.role.findUnique({ where: { id: updated.roleId } })
    res.json({ id: updated.id, email: updated.email, name: updated.name, role: role?.name || null })
  } catch (e) {
    res.status(500).json({ error: 'update_failed' })
  }
})

export const authRouter = router
