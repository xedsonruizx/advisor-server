import jwt from 'jsonwebtoken'
import { prisma } from '../db/prisma.js'

export async function getUserWithPermissions(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } }
  })
  return user
}

export function requireAuth(req, res, next) {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ error: 'unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'unauthorized' })
  }
}

export function requireRole(...roles) {
  return async (req, res, next) => {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'unauthorized' })
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      const user = await getUserWithPermissions(payload.sub)
      const name = user?.role?.name
      if (!name || !roles.includes(name)) return res.status(403).json({ error: 'forbidden' })
      req.userId = payload.sub
      next()
    } catch {
      res.status(401).json({ error: 'unauthorized' })
    }
  }
}

export function requirePermission(permissionName) {
  return async (req, res, next) => {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'unauthorized' })
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      const user = await getUserWithPermissions(payload.sub)
      const perms = (user?.role?.rolePermissions || []).map(rp => rp.permission.name)
      if (!perms.includes(permissionName)) return res.status(403).json({ error: 'forbidden' })
      req.userId = payload.sub
      next()
    } catch {
      res.status(401).json({ error: 'unauthorized' })
    }
  }
}
