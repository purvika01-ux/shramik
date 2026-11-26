const mongoose = require('mongoose')

// A person who can log in: either an admin or a contractor
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash, never the plain password
    role: { type: String, enum: ['admin', 'contractor'], default: 'contractor' },
    isActive: { type: Boolean, default: true }, // admin can deactivate a contractor

    // Contractor settings
    hoursPerDay: { type: Number, default: 8 }, // working hours in a full day (for the hourly rate)
    nextLabourNo: { type: Number, default: 1 }, // used to make labour codes L-001, L-002 ...
  },
  { timestamps: true },
)

module.exports = mongoose.model('User', userSchema)
