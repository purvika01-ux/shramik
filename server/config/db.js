const mongoose = require('mongoose')

// Connects to MongoDB using the MONGO_URI from the .env file
async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('MongoDB connected')
}

module.exports = connectDB
