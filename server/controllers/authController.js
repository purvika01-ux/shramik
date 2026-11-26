const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { sendPasswordResetEmail } = require('../utils/mailer')

const RESET_MINUTES = 30
const MOBILE_RE = /^[6-9]\d{9}$/

/** "+91 98765 43210" -> "9876543210" */
function cleanMobile(value) {
  let digits = String(value || '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  return digits
}

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

function makeToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// What the frontend gets back about the logged-in user (never the password)
function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, mobile: user.mobile || '', role: user.role, hoursPerDay: user.hoursPerDay }
}

// POST /api/auth/register  – contractors sign themselves up
async function register(req, res) {
  const { name, email, password } = req.body
  const mobile = cleanMobile(req.body.mobile)
  if (!name?.trim() || !email?.trim() || !password || !mobile) {
    return res.status(400).json({ message: 'Name, email, mobile number and password are required' })
  }
  if (!MOBILE_RE.test(mobile)) return res.status(400).json({ message: 'Enter a valid 10-digit mobile number' })
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' })

  const exists = await User.findOne({ email: email.toLowerCase().trim() })
  if (exists) return res.status(400).json({ message: 'This email is already registered' })

  const hashed = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email, mobile, password: hashed, role: 'contractor' })
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

// POST /api/auth/forgot-password  body: { email }
// Always gives the same answer, so nobody can use it to find out which emails are registered.
async function forgotPassword(req, res) {
  const email = String(req.body.email || '').toLowerCase().trim()
  if (!email) return res.status(400).json({ message: 'Enter your email address' })

  const user = await User.findOne({ email })
  if (user && user.isActive) {
    const token = crypto.randomBytes(32).toString('hex')
    user.resetTokenHash = hashToken(token)
    user.resetTokenExpires = new Date(Date.now() + RESET_MINUTES * 60 * 1000)
    await user.save()

    // APP_URL is the website address. In development the request's own address is used.
    const base = process.env.APP_URL || (process.env.NODE_ENV !== 'production' && req.get('origin')) || 'http://localhost:5173'
    const link = `${base.replace(/\/$/, '')}/#/reset-password?token=${token}`
    try {
      await sendPasswordResetEmail({ to: user.email, name: user.name, link, minutes: RESET_MINUTES })
    } catch (err) {
      console.error('Could not send password reset email:', err.message)
      return res.status(500).json({ message: 'Could not send the email right now. Please try again later.' })
    }
  }
  res.json({ message: 'If this email is registered, a password reset link has been sent to it.' })
}

// POST /api/auth/reset-password  body: { token, password }
async function resetPassword(req, res) {
  const { token, password } = req.body
  if (!token || typeof token !== 'string') return res.status(400).json({ message: 'This reset link is not valid' })
  if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' })

  const user = await User.findOne({ resetTokenHash: hashToken(token), resetTokenExpires: { $gt: new Date() } })
  if (!user) return res.status(400).json({ message: 'This reset link is not valid or has expired. Please ask for a new one.' })

  user.password = await bcrypt.hash(password, 10)
  user.resetTokenHash = null // a link works only once
  user.resetTokenExpires = null
  await user.save()
  res.json({ message: 'Password changed. You can log in now.' })
}

module.exports = { register, login, me, changePassword, forgotPassword, resetPassword }
