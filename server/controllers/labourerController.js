const mongoose = require('mongoose')
const Labourer = require('../models/Labourer')
const Attendance = require('../models/Attendance')
const Transaction = require('../models/Transaction')
const User = require('../models/User')

// Checks the form fields. Returns an error message or null.
function validate({ name, mobile, dailyWage }) {
  if (!name?.trim()) return 'Name is required'
  const phone = String(mobile || '').trim()
  if (phone && !/^[6-9]\d{9}$/.test(phone)) return 'Enter a valid 10-digit mobile number' // mobile is optional
  const wage = Number(dailyWage)
  if (!(wage > 0 && wage <= 10000)) return 'Daily wage must be between 1 and 10000'
  return null
}

const todayISO = () => new Date().toLocaleDateString('en-CA') // "YYYY-MM-DD" in server's local time

// GET /api/labourers – all labourers of the logged-in contractor
async function getLabourers(req, res) {
  const labourers = await Labourer.find({ contractor: req.user._id }).sort({ code: 1 })
  res.json(labourers)
}

// POST /api/labourers
async function addLabourer(req, res) {
  const error = validate(req.body)
  if (error) return res.status(400).json({ message: error })

  // Take the next number for this contractor (L-001, L-002 ...)
  const user = await User.findByIdAndUpdate(req.user._id, { $inc: { nextLabourNo: 1 } })
  const code = `L-${String(user.nextLabourNo).padStart(3, '0')}`

  const labourer = await Labourer.create({
    contractor: req.user._id,
    code,
    name: req.body.name.trim(),
    mobile: String(req.body.mobile || '').trim(),
    dailyWage: Number(req.body.dailyWage),
    status: req.body.status === 'inactive' ? 'inactive' : 'active',
    joinedOn: todayISO(),
  })
  res.status(201).json(labourer)
}

// PUT /api/labourers/:id – edit details, or only change status (active / inactive)
async function updateLabourer(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Labourer not found' })
  // Always search with the contractor id so nobody can edit another contractor's labourer
  const labourer = await Labourer.findOne({ _id: req.params.id, contractor: req.user._id })
  if (!labourer) return res.status(404).json({ message: 'Labourer not found' })

  const onlyStatus = req.body.name === undefined
  if (!onlyStatus) {
    const error = validate(req.body)
    if (error) return res.status(400).json({ message: error })
    labourer.name = req.body.name.trim()
    labourer.mobile = String(req.body.mobile || '').trim()
    // New wage only applies to attendance marked from now on (old entries keep their own wage)
    labourer.dailyWage = Number(req.body.dailyWage)
  }
  if (['active', 'inactive'].includes(req.body.status)) labourer.status = req.body.status

  await labourer.save()
  res.json(labourer)
}

// DELETE /api/labourers/:id – also removes their attendance and transactions
async function deleteLabourer(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Labourer not found' })
  const labourer = await Labourer.findOneAndDelete({ _id: req.params.id, contractor: req.user._id })
  if (!labourer) return res.status(404).json({ message: 'Labourer not found' })

  await Attendance.deleteMany({ labourer: labourer._id })
  await Transaction.deleteMany({ labourer: labourer._id })
  res.json({ message: 'Labourer deleted' })
}

module.exports = { getLabourers, addLabourer, updateLabourer, deleteLabourer }
