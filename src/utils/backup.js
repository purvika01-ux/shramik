// Helpers for the backup file (download / restore). App data itself now lives in MongoDB.

export const SCHEMA_VERSION = 3
export const DEFAULT_HOURS_PER_DAY = 8

/*
 * Register shape used inside the app and in backup files
 * {
 *   version: 3,
 *   nextLabourNo: 31,
 *   settings: { hoursPerDay: 8 },
 *   labourers: [{ id: 'L-001', _id, name, mobile, dailyWage, status, joinedOn, createdAt }],
 *   attendance: {
 *     '2026-11-20': {
 *       savedAt,
 *       records: {
 *         'L-001': { status: 'P', extraHours: 3, wage: 800, hpd: 8 },  // Full day + 3 extra hours
 *         'L-002': { status: 'H', wage: 700, hpd: 8 },                 // Half day
 *         'L-003': { status: 'T', hours: 3, wage: 800, hpd: 8 },       // Worked only 3 hours
 *         'L-004': { status: 'A', wage: 600, hpd: 8 },                 // Absent
 *       },
 *     },
 *   },
 *   corrections: [{ id, date, labourId, from, to, reason, at }],
 *   transactions: [{ id, labourId, type, amount, date, method, remarks, createdAt }],
 * }
 * DataContext builds this shape from the API, so the pages did not need to change.
 */
export function emptyData() {
  return {
    version: SCHEMA_VERSION,
    nextLabourNo: 1,
    settings: { hoursPerDay: DEFAULT_HOURS_PER_DAY },
    labourers: [],
    attendance: {},
    corrections: [],
    transactions: [],
  }
}

const BACKUP_APP = 'sahil-contractor'

/** Wraps the data for a backup file */
export function makeBackup(data) {
  return JSON.stringify({ app: BACKUP_APP, exportedAt: new Date().toISOString(), data }, null, 1)
}

/** Reads a backup file's text. Returns { data, exportedAt } or null if it is not a valid backup. */
export function readBackup(text) {
  try {
    const parsed = JSON.parse(text)
    const data = parsed?.app === BACKUP_APP ? parsed.data : parsed
    const valid =
      data?.version === SCHEMA_VERSION &&
      Array.isArray(data.labourers) &&
      Array.isArray(data.transactions) &&
      data.attendance && typeof data.attendance === 'object' &&
      data.labourers.every((l) => l && typeof l.id === 'string' && typeof l.name === 'string')
    return valid ? { data: { ...emptyData(), ...data }, exportedAt: parsed?.exportedAt || null } : null
  } catch {
    return null
  }
}

export function makeLabourId(no) {
  return `L-${String(no).padStart(3, '0')}`
}
