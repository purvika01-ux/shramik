// Creates (or resets) the admin account using ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD from .env
// Run: npm run create-admin
require('dotenv').config({ quiet: true })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI)
  const email = process.env.ADMIN_EMAIL.toLowerCase()
  const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)

  await User.findOneAndUpdate(
    { email },
    { name: process.env.ADMIN_NAME || 'Admin', email, password, role: 'admin', isActive: true },
    { upsert: true },
  )
  console.log(`Admin ready: ${email}`)
  await mongoose.disconnect()
}

createAdmin().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
