const mongoose = require('mongoose')

// A worker who belongs to one contractor
const labourerSchema = new mongoose.Schema(
  {
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    code: { type: String, required: true }, // short ID shown in the app, e.g. "L-001"
    name: { type: String, required: true, trim: true },
    mobile: { type: String, default: '', trim: true },
    dailyWage: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    joinedOn: { type: String, required: true }, // "YYYY-MM-DD"
  },
  { timestamps: true },
)

// Labour codes are unique inside one contractor's register
labourerSchema.index({ contractor: 1, code: 1 }, { unique: true })

module.exports = mongoose.model('Labourer', labourerSchema)
