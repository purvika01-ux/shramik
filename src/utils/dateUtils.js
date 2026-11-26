// All dates are stored as local "YYYY-MM-DD" strings (no timezone surprises).
// Display format is Indian: DD/MM/YYYY.

const pad = (n) => String(n).padStart(2, '0')

export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayISO() {
  return toISODate(new Date())
}

export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '—'
  const dt = new Date(timestamp)
  let h = dt.getHours()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${formatDate(toISODate(dt))}, ${h}:${pad(dt.getMinutes())} ${ampm}`
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function dayName(iso) {
  return DAYS[parseISODate(iso).getDay()]
}

export function addDays(iso, n) {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/** "2026-11-04" -> "2026-11" */
export function monthKeyOf(iso) {
  return iso.slice(0, 7)
}

export function currentMonthKey() {
  return monthKeyOf(todayISO())
}

/** "2026-11" -> "November 2026" */
export function monthLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

export function shortMonthLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  return `${MONTHS[m - 1].slice(0, 3)} ${y}`
}

/** First and last ISO date of a month key */
export function monthRange(monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return { from: `${monthKey}-01`, to: `${monthKey}-${pad(last)}` }
}
