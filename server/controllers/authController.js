const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

function makeToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// What the frontend gets back about the logged-in user (never the password)
function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, hoursPerDay: user.hoursPerDay }
}

// POST /api/auth/register  – contractors sign themselves up
async function register(req, res) {
  const { name, email, password } = req.body
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' })
  }
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' })

  const exists = await User.findOne({ email: email.toLowerCase().trim() })
  if (exists) return res.status(400).json({ message: 'This email is already registered' })

  const hashed = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email, password: hashed, role: 'contractor' })
  res.status(201).json({ token: makeToken(user), user: publicUser(user) })
}

// POST /api/auth/login  – admin and contractors
async function login(req, res) {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })

  const user = await User.findOne({ email: email.toLowerCase().trim() })
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Wrong email or password' })
  }
  if (!user.isActive) return res.status(403).json({ message: 'Your account has been deactivated by the admin' })

  res.json({ token: makeToken(user), user: publicUser(user) })
}

// GET /api/auth/me  – who is logged in (used when the app reloads)
async function me(req, res) {
  res.json({ user: publicUser(req.user) })
}

// PUT /api/auth/password  body: { currentPassword, newPassword }  – admin and contractors
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Enter current and new password' })
  if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' })

  // req.user has no password field, so load it again with the hash
  const user = await User.findById(req.user._id)
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(400).json({ message: 'Current password is wrong' })
  }
  user.password = await bcrypt.hash(newPassword, 10)
  await user.save()
  res.json({ message: 'Password changed' })
}

module.exports = { register, login, me, changePassword }
