const mongoose = require('mongoose')
const User = require('../models/User')
const Labourer = require('../models/Labourer')

// GET /api/admin/contractors – every registered contractor with how many labourers they have
async function getContractors(req, res) {
  const contractors = await User.find({ role: 'contractor' }).select('-password').sort({ createdAt: -1 }).lean()

  // Count labourers per contractor in one query
  const counts = await Labourer.aggregate([{ $group: { _id: '$contractor', count: { $sum: 1 } } }])
  const countById = Object.fromEntries(counts.map((c) => [String(c._id), c.count]))

  res.json(
    contractors.map((c) => ({
      id: c._id,
      name: c.name,
      email: c.email,
      isActive: c.isActive,
      createdAt: c.createdAt,
      labourers: countById[String(c._id)] || 0,
    })),
  )
}

// PATCH /api/admin/contractors/:id/status  body: { isActive: true | false }
async function setContractorStatus(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Contractor not found' })
  if (typeof req.body.isActive !== 'boolean') return res.status(400).json({ message: 'isActive must be true or false' })

  const contractor = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'contractor' },
    { isActive: req.body.isActive },
    { returnDocument: 'after' },
  )
  if (!contractor) return res.status(404).json({ message: 'Contractor not found' })
  res.json({ id: contractor._id, isActive: contractor.isActive })
}

module.exports = { getContractors, setContractorStatus }
