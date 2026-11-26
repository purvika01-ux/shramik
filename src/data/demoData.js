import { emptyData, makeLabourId } from '../utils/backup'
import { addDays, monthKeyOf, monthLabel, monthRange, parseISODate, todayISO } from '../utils/dateUtils'
import { labourSummary } from '../utils/calculations'

const NAMES = [
  'Ramesh Kumar', 'Suresh Yadav', 'Mahesh Singh', 'Rajesh Sharma', 'Dinesh Prajapati',
  'Mukesh Verma', 'Ganesh Patil', 'Sunil Chauhan', 'Anil Gupta', 'Vijay Paswan',
  'Santosh Mandal', 'Manoj Rajput', 'Pappu Ram', 'Gurpreet Singh', 'Harjit Singh',
  'Raju Mahato', 'Bablu Khan', 'Shankar Nishad', 'Sanjay Kushwaha', 'Ashok Jatav',
  'Pradeep Saini', 'Ravi Teli', 'Deepak Lohar', 'Kuldeep Kumar', 'Mohammad Salim',
  'Irfan Ansari', 'Balwinder Singh', 'Lakhan Manjhi', 'Om Prakash', 'Jagdish Bind',
]

const WAGES = [600, 650, 700, 700, 750, 750, 800, 850, 900]
const METHODS = ['Cash', 'Cash', 'Cash', 'UPI', 'UPI', 'Bank Transfer']

// Small deterministic random generator so demo data looks the same every reset
function rng(seed) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const roundTo = (n, step) => Math.round(n / step) * step

/**
 * Builds ~30 labourers with attendance from the start of last month up to YESTERDAY
 * (today is left unmarked so the contractor can try marking it), plus advances and
 * month-end payments.
 */
export function createDemoData() {
  const rand = rng(20261104)
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const data = emptyData()
  const today = todayISO()
  const thisMonth = monthKeyOf(today)
  const startDate = addDays(`${thisMonth}-01`, -1).slice(0, 7) + '-01' // 1st of last month
  const lastMonth = monthKeyOf(startDate)
  const now = Date.now()

  // Labourers
  NAMES.forEach((name, i) => {
    const no = i + 1
    const mobile = String(pick([9, 8, 7, 6])) + String(Math.floor(rand() * 1e9)).padStart(9, '0')
    data.labourers.push({
      id: makeLabourId(no),
      name,
      mobile,
      dailyWage: pick(WAGES),
      status: no === 27 || no === 30 ? 'inactive' : 'active',
      joinedOn: startDate,
      createdAt: now - (40 - i) * 1000,
    })
  })
  data.nextLabourNo = NAMES.length + 1

  // A few labourers got a raise mid-way (shows historical wage rates are preserved)
  const raiseOn = addDays(startDate, 15)
  const raised = new Set(['L-001', 'L-004', 'L-014'])

  // Attendance: Mon–Sat, up to yesterday. One entry per labourer per day:
  // mostly Full Day (on busy days some do 1–3 extra hours), some Half Day, a few "by hours", a few Absent.
  const hpd = data.settings.hoursPerDay
  for (let d = startDate; d < today; d = addDays(d, 1)) {
    if (parseISODate(d).getDay() === 0) continue // Sunday off
    const records = {}
    const busy = rand() < 0.4
    for (const l of data.labourers) {
      // inactive labourers stopped coming 3 weeks ago
      if (l.status === 'inactive' && d > addDays(today, -21)) continue
      const wage = raised.has(l.id) && d < raiseOn ? l.dailyWage - 50 : l.dailyWage
      const r = rand()
      if (r < 0.8) {
        const extra = busy && rand() < 0.35 ? 1 + Math.floor(rand() * 3) : 0
        records[l.id] = extra ? { status: 'P', extraHours: extra, wage, hpd } : { status: 'P', wage, hpd }
      } else if (r < 0.87) records[l.id] = { status: 'H', wage, hpd }
      else if (r < 0.92) records[l.id] = { status: 'T', hours: 2 + Math.floor(rand() * 4), wage, hpd }
      else records[l.id] = { status: 'A', wage, hpd }
    }
    data.attendance[d] = { savedAt: parseISODate(d).getTime() + 19 * 3600e3, records }
  }

  // Transactions
  let seq = 0
  const txn = (labourId, type, amount, date, method, remarks) => {
    seq++
    data.transactions.push({
      id: `T-demo-${seq}`,
      labourId,
      type,
      amount,
      date,
      method: type === 'payment' ? method : '',
      remarks,
      createdAt: parseISODate(date).getTime() + 12 * 3600 * 1000 + seq,
    })
  }
  const advRemarks = ['Ghar bhejne ke liye', 'Medical', 'Ration', 'Festival', '', '', 'Room rent']
  const lm = monthRange(lastMonth)
  const firstOfThisMonth = `${thisMonth}-01`

  for (const l of data.labourers) {
    // last month advances
    const nAdv = Math.floor(rand() * 3)
    for (let k = 0; k < nAdv; k++) {
      txn(l.id, 'advance', roundTo(500 + rand() * 1500, 100), addDays(lm.from, 3 + Math.floor(rand() * 22)), '', pick(advRemarks))
    }
  }
  // Month-end settlement for last month (most labourers paid fully, some partially)
  for (const l of data.labourers) {
    const s = labourSummary(data, l.id, { to: lm.to })
    if (s.balance <= 0) continue
    const r = rand()
    const amount = r < 0.6 ? s.balance : roundTo(s.balance * (0.5 + rand() * 0.4), 500)
    if (amount > 0) {
      txn(l.id, 'payment', amount, firstOfThisMonth, pick(METHODS),
        amount === s.balance ? `Full hisab – ${monthLabel(lastMonth)}` : 'Partial payment')
    }
  }
  // This month advances (only dates before today)
  for (const l of data.labourers) {
    if (l.status !== 'active' || rand() > 0.35) continue
    const d = addDays(firstOfThisMonth, Math.floor(rand() * 3))
    if (d < today) txn(l.id, 'advance', roundTo(300 + rand() * 1200, 100), d, '', pick(advRemarks))
  }

  return data
}
