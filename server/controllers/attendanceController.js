const Attendance = require('../models/Attendance')
const Labourer = require('../models/Labourer')
const { cleanEntry } = require('../utils/wage')

const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '')

// Short form of an entry, used in the correction history
const short = (e) => (e ? { status: e.status, extraHours: e.extraHours || 0, hours: e.hours || 0 } : null)
const same = (a, b) => a.status === b.status && (a.extraHours || 0) === (b.extraHours || 0) && (a.hours || 0) === (b.hours || 0)

// GET /api/attendance?from=YYYY-MM-DD&to=YYYY-MM-DD  (both optional)
async function getAttendance(req, res) {
  const filter = { contractor: req.user._id }
  if (isDate(req.query.from) || isDate(req.query.to)) {
    filter.date = {}
    if (isDate(req.query.from)) filter.date.$gte = req.query.from
    if (isDate(req.query.to)) filter.date.$lte = req.query.to
  }
  const entries = await Attendance.find(filter).sort({ date: 1 })
  res.json(entries)
}

/**
 * POST /api/attendance – save one day's attendance
 * body: { date, entries: { <labourerId>: { status, extraHours?, hours? } | null }, reason? }
 *   null removes that labourer's entry for the day.
 *   An existing entry keeps the wage it was first saved with.
 *   Changing an already-saved entry is recorded in its correction history with the reason.
 */
async function saveAttendance(req, res) {
  const { date, entries = {}, reason = '' } = req.body
  if (!isDate(date)) return res.status(400).json({ message: 'A valid date is required' })

  let saved = 0
  for (const [labourerId, sent] of Object.entries(entries)) {
    // Only this contractor's active labourers can be marked
    const labourer = await Labourer.findOne({ _id: labourerId, contractor: req.user._id, status: 'active' }).catch(() => null)
    if (!labourer) continue

    const existing = await Attendance.findOne({ labourer: labourer._id, date })
    const entry = sent ? cleanEntry(sent) : null
    if (sent && !entry) return res.status(400).json({ message: `Invalid attendance for ${labourer.name}` })

    if (!entry) {
      // Remove the entry
      if (existing) await existing.deleteOne()
      saved++
      continue
    }

    if (existing) {
      if (!same(existing, entry)) {
        existing.corrections.push({ from: short(existing), to: short(entry), reason: String(reason).trim() })
        existing.status = entry.status
        existing.extraHours = entry.extraHours
        existing.hours = entry.hours
        await existing.save()
      }
    } else {
      await Attendance.create({
        contractor: req.user._id,
        labourer: labourer._id,
        date,
        ...entry,
        wage: labourer.dailyWage, // wage at the time of marking
        hoursPerDay: req.user.hoursPerDay,
      })
    }
    saved++
  }
  res.json({ message: 'Attendance saved', saved })
}

module.exports = { getAttendance, saveAttendance }
