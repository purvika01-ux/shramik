/*
 * Wage calculation (same rules as the frontend's src/utils/calculations.js)
 *   P = Full Day  -> daily wage + extra hours × hourly rate
 *   H = Half Day  -> daily wage × 0.5
 *   T = By hours  -> hours × hourly rate
 *   A = Absent    -> 0
 *   Hourly rate   = daily wage ÷ hours in a full day
 *   Balance       = Wages − Advances − Payments
 */

const STATUSES = ['P', 'H', 'T', 'A']

function roundMoney(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

/** Earnings for one attendance entry, using the wage stored with the entry */
function entryWage(entry) {
  const wage = Number(entry.wage) || 0
  const rate = wage / (Number(entry.hoursPerDay) || 8)
  if (entry.status === 'P') return roundMoney(wage + (Number(entry.extraHours) || 0) * rate)
  if (entry.status === 'H') return roundMoney(wage * 0.5)
  if (entry.status === 'T') return roundMoney((Number(entry.hours) || 0) * rate)
  return 0
}

/**
 * Cleans an entry sent by the app. Hours are rounded to the nearest half hour.
 * Returns null if it is not valid (e.g. "By hours" with 0 hours).
 */
function cleanEntry(e) {
  if (!e || !STATUSES.includes(e.status)) return null
  if (e.status === 'P') {
    const extraHours = Math.max(0, Math.round((Number(e.extraHours) || 0) * 2) / 2)
    return { status: 'P', extraHours, hours: 0 }
  }
  if (e.status === 'T') {
    const hours = Math.round((Number(e.hours) || 0) * 2) / 2
    return hours > 0 && hours <= 24 ? { status: 'T', extraHours: 0, hours } : null
  }
  return { status: e.status, extraHours: 0, hours: 0 }
}

const inRange = (date, from, to) => (!from || date >= from) && (!to || date <= to)

/** Totals for one labourer from their attendance entries and transactions within a date range */
function labourSummary(entries, transactions, from, to) {
  const s = { full: 0, half: 0, hourly: 0, absent: 0, extraHours: 0, hoursWorked: 0, wages: 0, advances: 0, payments: 0 }
  for (const e of entries) {
    if (!inRange(e.date, from, to)) continue
    if (e.status === 'P') {
      s.full++
      s.extraHours += e.extraHours || 0
    } else if (e.status === 'H') s.half++
    else if (e.status === 'T') {
      s.hourly++
      s.hoursWorked += e.hours || 0
    } else s.absent++
    s.wages += entryWage(e)
  }
  for (const t of transactions) {
    if (!inRange(t.date, from, to)) continue
    if (t.type === 'advance') s.advances += t.amount
    else s.payments += t.amount
  }
  for (const k of ['extraHours', 'hoursWorked', 'wages', 'advances', 'payments']) s[k] = roundMoney(s[k])
  s.daysWorked = s.full + s.half + s.hourly
  s.balance = roundMoney(s.wages - s.advances - s.payments)
  return s
}

module.exports = { roundMoney, entryWage, cleanEntry, labourSummary }
