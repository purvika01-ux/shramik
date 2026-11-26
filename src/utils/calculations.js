import { roundMoney } from './currency'
import { monthKeyOf } from './dateUtils'
import { DEFAULT_HOURS_PER_DAY } from './backup'

/*
 * Attendance types (one per labourer per day)
 *   P = Full Day   -> daily wage + extra hours × hourly rate
 *   H = Half Day   -> daily wage × 0.5
 *   T = By hours   -> hours worked × hourly rate
 *   A = Absent     -> 0
 * Hourly rate = daily wage ÷ working hours in a full day (default 8)
 * Example: ₹800/day, 8 hrs -> ₹100/hr. Full + 3 extra = ₹1,100. Only 3 hrs = ₹300.
 */
export const STATUSES = ['P', 'H', 'T', 'A']
export const PRESENT_TYPES = ['P', 'H', 'T']

export function hourlyRate(wage, hoursPerDay = DEFAULT_HOURS_PER_DAY) {
  return (Number(wage) || 0) / (Number(hoursPerDay) || DEFAULT_HOURS_PER_DAY)
}

/** Earnings for one day's record — uses the wage and hours-per-day stored WITH the record. */
export function recordWage(rec) {
  if (!rec) return 0
  const wage = Number(rec.wage) || 0
  const rate = hourlyRate(wage, rec.hpd)
  switch (rec.status) {
    case 'P':
      return roundMoney(wage + (Number(rec.extraHours) || 0) * rate)
    case 'H':
      return roundMoney(wage * 0.5)
    case 'T':
      return roundMoney((Number(rec.hours) || 0) * rate)
    default:
      return 0
  }
}

/** Keeps only the fields that matter for a type; returns null if invalid (e.g. "hours" with 0 hours) */
export function cleanEntry(e) {
  if (!e || !STATUSES.includes(e.status)) return null
  if (e.status === 'P') {
    const extra = Math.max(0, Math.round((Number(e.extraHours) || 0) * 2) / 2)
    return extra ? { status: 'P', extraHours: extra } : { status: 'P' }
  }
  if (e.status === 'T') {
    const hours = Math.round((Number(e.hours) || 0) * 2) / 2
    return hours > 0 ? { status: 'T', hours } : null
  }
  return { status: e.status }
}

export function sameEntry(a, b) {
  const x = cleanEntry(a), y = cleanEntry(b)
  if (!x || !y) return x === y
  return x.status === y.status && (x.extraHours || 0) === (y.extraHours || 0) && (x.hours || 0) === (y.hours || 0)
}

/** Short words for an entry, e.g. "Full Day + 3 hrs", "Half Day", "3 hrs", "Absent" (t = translate function) */
export function describeEntry(e, t) {
  if (!e) return '—'
  if (e.status === 'P') return e.extraHours ? `${t('type.full')} + ${t('common.hrs', { n: e.extraHours })}` : t('type.full')
  if (e.status === 'H') return t('type.half')
  if (e.status === 'T') return t('common.hrs', { n: e.hours })
  return t('att.absent')
}

const inRange = (date, from, to) => (!from || date >= from) && (!to || date <= to)

/** Calls fn(date, record) for every attendance record of one labourer */
function eachRecord(data, labourId, { from, to } = {}, fn) {
  for (const [date, day] of Object.entries(data.attendance)) {
    if (!inRange(date, from, to)) continue
    const rec = day?.records?.[labourId]
    if (rec) fn(date, rec)
  }
}

/**
 * Summary for one labourer within an optional date range.
 * Balance = Wages − Advances − Payments
 */
export function labourSummary(data, labourId, range = {}) {
  let full = 0, half = 0, hourly = 0, absent = 0, extraHours = 0, hoursWorked = 0, wages = 0
  eachRecord(data, labourId, range, (_d, rec) => {
    if (rec.status === 'P') {
      full++
      extraHours += Number(rec.extraHours) || 0
    } else if (rec.status === 'H') half++
    else if (rec.status === 'T') {
      hourly++
      hoursWorked += Number(rec.hours) || 0
    } else if (rec.status === 'A') absent++
    wages += recordWage(rec)
  })
  let advances = 0, payments = 0
  for (const t of data.transactions) {
    if (t.labourId !== labourId || !inRange(t.date, range.from, range.to)) continue
    if (t.type === 'advance') advances += Number(t.amount)
    else if (t.type === 'payment') payments += Number(t.amount)
  }
  wages = roundMoney(wages)
  advances = roundMoney(advances)
  payments = roundMoney(payments)
  return {
    full,
    half,
    hourly,
    absent,
    extraHours: roundMoney(extraHours),
    hoursWorked: roundMoney(hoursWorked),
    daysWorked: full + half + hourly,
    wages,
    advances,
    payments,
    balance: roundMoney(wages - advances - payments),
  }
}

export function allSummaries(data, range) {
  const map = {}
  for (const l of data.labourers) map[l.id] = labourSummary(data, l.id, range)
  return map
}

/** Home screen numbers for one date */
export function dayStats(data, date) {
  const day = data.attendance[date]
  let present = 0, absent = 0, wages = 0
  for (const rec of Object.values(day?.records || {})) {
    if (rec.status === 'A') absent++
    else present++
    wages += recordWage(rec)
  }
  return { present, absent, wages: roundMoney(wages), saved: !!day }
}

export function totalPending(summaries) {
  return roundMoney(Object.values(summaries).reduce((sum, s) => sum + Math.max(0, s.balance), 0))
}

export function sortTxnsDesc(txns) {
  return [...txns].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return b.createdAt - a.createdAt
  })
}

/** Attendance history of one labourer (newest first): [{ date, rec, earned }] */
export function attendanceHistory(data, labourId, range) {
  const rows = []
  eachRecord(data, labourId, range, (date, rec) => rows.push({ date, rec, earned: recordWage(rec) }))
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1))
}

/**
 * Register-style ledger: one "wages" line per month + every advance/payment,
 * with a running balance. Returned newest first.
 */
export function buildLedger(data, labourId) {
  const months = {}
  eachRecord(data, labourId, {}, (date, rec) => {
    const mk = monthKeyOf(date)
    const m = (months[mk] ||= { amount: 0, days: 0, lastDate: date })
    m.amount += recordWage(rec)
    if (rec.status !== 'A') m.days++
    if (date > m.lastDate) m.lastDate = date
  })
  const entries = Object.entries(months).map(([mk, m]) => ({
    id: `W-${mk}`,
    kind: 'wages',
    monthKey: mk,
    date: m.lastDate,
    amount: roundMoney(m.amount),
    days: m.days,
    sortKey: `${m.lastDate}-0`,
  }))
  for (const t of data.transactions) {
    if (t.labourId !== labourId) continue
    entries.push({ ...t, kind: t.type, sortKey: `${t.date}-1-${String(t.createdAt).padStart(15, '0')}` })
  }
  entries.sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1))
  let running = 0
  for (const e of entries) {
    running = roundMoney(e.kind === 'wages' ? running + e.amount : running - e.amount)
    e.balance = running
  }
  return entries.reverse()
}
