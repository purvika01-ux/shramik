const mongoose = require('mongoose')

/*
 * One attendance entry = one labourer on one date.
 *   status P = Full Day (+ optional extraHours)
 *          H = Half Day
 *          T = By hours (hours)
 *          A = Absent
 * wage and hoursPerDay are copied from the labourer/settings when the entry is first saved,
 * so later wage changes never change old earnings.
 */
const correctionSchema = new mongoose.Schema(
  {
    from: { type: Object, default: null },
    to: { type: Object, default: null },
    reason: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: true },
)

const attendanceSchema = new mongoose.Schema(
  {
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    labourer: { type: mongoose.Schema.Types.ObjectId, ref: 'Labourer', required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    status: { type: String, enum: ['P', 'H', 'T', 'A'], required: true },
    extraHours: { type: Number, default: 0 },
    hours: { type: Number, default: 0 },
    wage: { type: Number, required: true },
    hoursPerDay: { type: Number, required: true },
    corrections: [correctionSchema], // history of changes made after first saving
  },
  { timestamps: true },
)

// Only one entry per labourer per day
attendanceSchema.index({ labourer: 1, date: 1 }, { unique: true })
attendanceSchema.index({ contractor: 1, date: 1 })

module.exports = mongoose.model('Attendance', attendanceSchema)
