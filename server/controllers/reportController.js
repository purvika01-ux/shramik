const Labourer = require('../models/Labourer')
const Attendance = require('../models/Attendance')
const Transaction = require('../models/Transaction')
const { labourSummary, roundMoney } = require('../utils/wage')

// "2026-11" -> { from: "2026-11-01", to: "2026-11-30" }
function monthRange(month) {
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, '0')}` }
}

// The day before a "YYYY-MM-DD" date
function dayBefore(date) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d - 1).toLocaleDateString('en-CA')
}

/**
 * GET /api/reports/monthly?month=2026-11&labourerId=all
 * For each labourer: days worked, wages, advances and payments in the month,
 * plus the balance carried from earlier months (opening) and the balance due (closing).
 *   Closing balance = Opening balance + Wages − Advances − Payments
 */
async function monthlyReport(req, res) {
  const month = req.query.month
  if (!/^\d{4}-\d{2}$/.test(month || '')) return res.status(400).json({ message: 'month must be like 2026-11' })
  const { from, to } = monthRange(month)
  const allLabourers = !req.query.labourerId || req.query.labourerId === 'all'

  const labourerFilter = { contractor: req.user._id }
  if (!allLabourers) labourerFilter._id = req.query.labourerId
  const labourers = await Labourer.find(labourerFilter).sort({ name: 1 }).catch(() => [])

  // Everything up to the end of the month (earlier entries make up the opening balance)
  const ids = labourers.map((l) => l._id)
  const [entries, transactions] = await Promise.all([
    Attendance.find({ labourer: { $in: ids }, date: { $lte: to } }).lean(),
    Transaction.find({ labourer: { $in: ids }, date: { $lte: to } }).lean(),
  ])

  const rows = []
  for (const l of labourers) {
    const myEntries = entries.filter((e) => e.labourer.equals(l._id))
    const myTxns = transactions.filter((t) => t.labourer.equals(l._id))
    const month = labourSummary(myEntries, myTxns, from, to)
    const opening = labourSummary(myEntries, myTxns, null, dayBefore(from)).balance
    const row = { labourerId: l._id, code: l.code, name: l.name, ...month, opening, closing: roundMoney(opening + month.balance) }
    // In the "all labourers" report, skip people with nothing to show for this month
    const hasActivity = row.daysWorked + row.absent > 0 || row.advances || row.payments || row.opening
    if (!allLabourers || hasActivity) rows.push(row)
  }

  const keys = ['full', 'half', 'hourly', 'absent', 'extraHours', 'daysWorked', 'wages', 'advances', 'payments', 'opening', 'closing']
  const totals = {}
  for (const k of keys) totals[k] = roundMoney(rows.reduce((sum, r) => sum + r[k], 0))

  res.json({ month, from, to, rows, totals })
}

module.exports = { monthlyReport }
