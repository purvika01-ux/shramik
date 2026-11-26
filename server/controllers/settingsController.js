const User = require('../models/User')
const Labourer = require('../models/Labourer')
const Attendance = require('../models/Attendance')
const Transaction = require('../models/Transaction')
const { cleanEntry } = require('../utils/wage')

// PUT /api/settings  body: { hoursPerDay }  – only affects attendance marked from now on
async function updateSettings(req, res) {
  const hours = Number(req.body.hoursPerDay)
  if (!(hours >= 1 && hours <= 24)) return res.status(400).json({ message: 'Hours must be between 1 and 24' })
  await User.findByIdAndUpdate(req.user._id, { hoursPerDay: hours })
  res.json({ hoursPerDay: hours })
}

// Deletes all labourers, attendance and transactions of one contractor
async function deleteContractorData(contractorId) {
  await Promise.all([
    Labourer.deleteMany({ contractor: contractorId }),
    Attendance.deleteMany({ contractor: contractorId }),
    Transaction.deleteMany({ contractor: contractorId }),
  ])
}

// DELETE /api/data – "Clear all & start fresh"
async function clearData(req, res) {
  await deleteContractorData(req.user._id)
  await User.findByIdAndUpdate(req.user._id, { nextLabourNo: 1 })
  res.json({ message: 'All data cleared' })
}

/**
 * POST /api/data/import – replaces the contractor's data with a whole register.
 * Used for "Restore backup" and "Reset demo data". The body is the same shape as the
 * backup file: { settings, nextLabourNo, labourers, attendance, corrections, transactions }
 */
async function importData(req, res) {
  const data = req.body
  if (!data || !Array.isArray(data.labourers) || !Array.isArray(data.transactions) || typeof data.attendance !== 'object') {
    return res.status(400).json({ message: 'This is not a valid backup file' })
  }
  const contractor = req.user._id
  await deleteContractorData(contractor)

  // 1. Labourers. Remember which new _id belongs to each labour code ("L-001").
  const labourers = await Labourer.insertMany(
    data.labourers.map((l) => ({
      contractor,
      code: l.id,
      name: l.name,
      mobile: l.mobile || '',
      dailyWage: Number(l.dailyWage) || 1,
      status: l.status === 'inactive' ? 'inactive' : 'active',
      joinedOn: l.joinedOn || new Date().toLocaleDateString('en-CA'),
    })),
  )
  const idByCode = Object.fromEntries(labourers.map((l) => [l.code, l._id]))

  // 2. Correction history, grouped by "date|code"
  const corrections = {}
  for (const c of data.corrections || []) {
    ;(corrections[`${c.date}|${c.labourId}`] ||= []).push({ from: c.from || null, to: c.to || null, reason: c.reason || '', at: c.at ? new Date(c.at) : new Date() })
  }

  // 3. Attendance
  const hoursPerDay = Number(data.settings?.hoursPerDay) || 8
  const entries = []
  for (const [date, day] of Object.entries(data.attendance)) {
    for (const [code, rec] of Object.entries(day?.records || {})) {
      const entry = cleanEntry(rec)
      if (!entry || !idByCode[code]) continue
      entries.push({
        contractor,
        labourer: idByCode[code],
        date,
        ...entry,
        wage: Number(rec.wage) || 0,
        hoursPerDay: Number(rec.hpd) || hoursPerDay,
        corrections: corrections[`${date}|${code}`] || [],
      })
    }
  }
  await Attendance.insertMany(entries)

  // 4. Advances and payments
  const transactions = data.transactions
    .filter((t) => idByCode[t.labourId] && ['advance', 'payment'].includes(t.type) && Number(t.amount) > 0)
    .map((t) => ({
      contractor,
      labourer: idByCode[t.labourId],
      type: t.type,
      amount: Number(t.amount),
      date: t.date,
      method: t.type === 'payment' ? t.method || 'Cash' : '',
      remarks: t.remarks || '',
      createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
    }))
  await Transaction.insertMany(transactions)

  // 5. Settings
  // Next code number must be higher than every imported code (L-030 -> 31)
  const highestCode = Math.max(0, ...labourers.map((l) => Number(l.code.replace(/\D/g, '')) || 0))
  const nextLabourNo = Math.max(Number(data.nextLabourNo) || 1, highestCode + 1)
  await User.findByIdAndUpdate(contractor, { hoursPerDay, nextLabourNo })

  res.json({ message: 'Data imported', labourers: labourers.length, attendance: entries.length, transactions: transactions.length })
}

module.exports = { updateSettings, clearData, importData }
