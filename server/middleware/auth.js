const jwt = require('jsonwebtoken')
const User = require('../models/User')

/**
 * Checks the "Authorization: Bearer <token>" header.
 * If the token is valid and the account is active, the logged-in user is put on req.user.
 */
async function protect(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Please log in' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    if (!user) return res.status(401).json({ message: 'Account not found. Please log in again.' })
    // 401 makes the app log the user out straight away
    if (!user.isActive) return res.status(401).json({ message: 'Your account has been deactivated by the admin' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'Session expired. Please log in again.' })
  }
}

/** Only lets the given roles through, e.g. allowRoles('admin') */
function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'You are not allowed to do this' })
    next()
  }
}

module.exports = { protect, allowRoles }
