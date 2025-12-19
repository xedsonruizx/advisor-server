import { v4 as uuid } from 'uuid'

const state = {
  items: []
}

function create({ email, name, passwordHash }) {
  const now = new Date().toISOString()
  const user = { id: uuid(), email, name, passwordHash, createdAt: now, role: 'client', membership: null }
  state.items.push(user)
  return user
}

function findByEmail(email) {
  return state.items.find(u => u.email === email)
}

function findById(id) {
  return state.items.find(u => u.id === id)
}

function setMembership(userId, membership) {
  const u = findById(userId)
  if (u) u.membership = membership
  return u
}

export const users = { create, findByEmail, findById, setMembership }
