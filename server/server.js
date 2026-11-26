require('dotenv').config({ quiet: true })
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' })) // backups can be a few MB

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/admin', require('./routes/adminRoutes'))
app.use('/api', require('./routes/contractorRoutes'))

// Unknown API route
app.use((req, res) => res.status(404).json({ message: 'Route not found' }))

// Any error thrown in a controller ends up here
app.use((err, req, res, next) => {
  console.error(err)
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'File is too large' })
  res.status(500).json({ message: 'Something went wrong on the server' })
})

const PORT = process.env.PORT || 5000

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message)
    process.exit(1)
  })
