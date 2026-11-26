import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import api, { errorMessage } from '../api/axios'
import { emptyData } from '../utils/backup'
import { createDemoData } from '../data/demoData'
import { allSummaries } from '../utils/calculations'
import { useToast } from '../components/Toast'
import { Button } from '../components/ui'

const DataContext = createContext(null)

/**
 * Turns the API responses into the register shape the pages use
 * (labourers keyed by their code "L-001", attendance grouped by date).
 */
function buildRegister(user, labourers, attendance, transactions) {
  const data = emptyData()
  data.settings.hoursPerDay = user.hoursPerDay

  const codeById = {}
  for (const l of labourers) {
    codeById[l._id] = l.code
    data.labourers.push({
      id: l.code,
      _id: l._id,
      name: l.name,
      mobile: l.mobile,
      dailyWage: l.dailyWage,
      status: l.status,
      joinedOn: l.joinedOn,
      createdAt: Date.parse(l.createdAt),
    })
  }
  data.nextLabourNo = Math.max(0, ...labourers.map((l) => Number(l.code.replace(/\D/g, '')) || 0)) + 1

  for (const a of attendance) {
    const code = codeById[a.labourer]
    if (!code) continue
    const day = (data.attendance[a.date] ||= { savedAt: 0, records: {} })
    const rec = { status: a.status, wage: a.wage, hpd: a.hoursPerDay }
    if (a.status === 'P' && a.extraHours) rec.extraHours = a.extraHours
    if (a.status === 'T') rec.hours = a.hours
    day.records[code] = rec
    day.savedAt = Math.max(day.savedAt, Date.parse(a.updatedAt))
    for (const c of a.corrections || []) {
      data.corrections.push({ id: c._id, date: a.date, labourId: code, from: c.from, to: c.to, reason: c.reason, at: Date.parse(c.at) })
    }
  }

  for (const t of transactions) {
    const code = codeById[t.labourer]
    if (!code) continue
    data.transactions.push({
      id: t._id,
      labourId: code,
      type: t.type,
      amount: t.amount,
      date: t.date,
      method: t.method,
      remarks: t.remarks,
      createdAt: Date.parse(t.createdAt),
    })
  }
  return data
}

/**
 * Loads the logged-in contractor's register from the server and gives the pages
 * simple actions (add labour, save attendance, ...). Every action calls the API and
 * then reloads the data, so the screen always shows what is saved in MongoDB.
 * Actions return true/the saved item on success, or false after showing an error toast.
 */
export function DataProvider({ children }) {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState('')

  const loadData = useCallback(async () => {
    const [me, labourers, attendance, transactions] = await Promise.all([
      api.get('/auth/me'),
      api.get('/labourers'),
      api.get('/attendance'),
      api.get('/transactions'),
    ])
    setData(buildRegister(me.data.user, labourers.data, attendance.data, transactions.data))
  }, [])

  const firstLoad = useCallback(() => {
    setLoadError('')
    loadData().catch((err) => setLoadError(errorMessage(err)))
  }, [loadData])

  useEffect(firstLoad, [firstLoad])

  /** Runs an API call, reloads the data, and shows an error toast if anything fails */
  const run = useCallback(
    async (request) => {
      try {
        const result = await request()
        await loadData()
        return result ?? true
      } catch (err) {
        toast.error(errorMessage(err))
        return false
      }
    },
    [loadData, toast],
  )

  // Pages use labour codes ("L-001"); the API needs the MongoDB _id
  const mongoId = useCallback((code) => data?.labourers.find((l) => l.id === code)?._id, [data])

  const actions = useMemo(
    () => ({
      // ---------- Labour ----------
      addLabour: (fields) =>
        run(async () => {
          const res = await api.post('/labourers', fields)
          return { id: res.data.code, name: res.data.name }
        }),
      updateLabour: (code, fields) => run(() => api.put(`/labourers/${mongoId(code)}`, fields)),
      setLabourStatus: (code, status) => run(() => api.put(`/labourers/${mongoId(code)}`, { status })),
      deleteLabour: (code) => run(() => api.delete(`/labourers/${mongoId(code)}`)),

      // ---------- Attendance ----------
      /** entries: { 'L-001': { status, extraHours?, hours? } | null } – null removes the entry */
      saveAttendance: (date, entries, reason = '') =>
        run(() => {
          const byId = {}
          for (const [code, entry] of Object.entries(entries)) byId[mongoId(code)] = entry
          return api.post('/attendance', { date, entries: byId, reason })
        }),

      // ---------- Advances & Payments ----------
      addTransaction: (txn) => run(() => api.post('/transactions', { ...txn, labourerId: mongoId(txn.labourId) })),
      deleteTransaction: (id) => run(() => api.delete(`/transactions/${id}`)),

      // ---------- Settings ----------
      updateHoursPerDay: (hours) => run(() => api.put('/settings', { hoursPerDay: Number(hours) })),
      restoreData: (backupData) => run(() => api.post('/data/import', backupData)),
      resetDemoData: () => run(() => api.post('/data/import', createDemoData())),
      clearAllData: () => run(() => api.delete('/data')),
    }),
    [run, mongoId],
  )

  const summaries = useMemo(() => (data ? allSummaries(data) : {}), [data])
  const labourById = useMemo(() => Object.fromEntries((data?.labourers || []).map((l) => [l.id, l])), [data])

  const value = useMemo(() => ({ data, summaries, labourById, ...actions }), [data, summaries, labourById, actions])

  if (loadError) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="font-semibold text-red-600">Could not load your data</p>
          <p className="mt-1 text-sm text-slate-500">{loadError}</p>
          <Button className="mt-4" icon={RefreshCw} onClick={firstLoad}>Try again</Button>
        </div>
      </div>
    )
  }
  if (!data) return <FullPageLoader />

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function FullPageLoader() {
  return (
    <div className="grid min-h-screen place-items-center text-slate-500">
      <Loader2 className="size-8 animate-spin text-green-600" aria-label="Loading" />
    </div>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
