const mongoose = require('mongoose')

// Money given to a labourer: an advance (before wages are due) or a payment (settling wages)
const transactionSchema = new mongoose.Schema(
  {
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    labourer: { type: mongoose.Schema.Types.ObjectId, ref: 'Labourer', required: true },
    type: { type: String, enum: ['advance', 'payment'], required: true },
    amount: { type: Number, required: true, min: 1 },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    method: { type: String, default: '' }, // Cash / UPI / Bank Transfer (payments only)
    remarks: { type: String, default: '', trim: true },
  },
  { timestamps: true },
)

transactionSchema.index({ contractor: 1, date: 1 })

module.exports = mongoose.model('Transaction', transactionSchema)
