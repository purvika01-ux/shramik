import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCheck, Save, CheckCircle2, Users, UserPlus } from 'lucide-react'
import AttendanceList from '../components/AttendanceList'
import Modal from '../components/Modal'
import { Badge, Button, Card, EmptyState, SearchBox } from '../components/ui'
import { useData } from '../context/DataContext'
import { useLang } from '../i18n/LanguageContext'
import { useConfirm } from '../components/ConfirmationDialog'
import { useToast } from '../components/Toast'
import { cleanEntry, recordWage, sameEntry } from '../utils/calculations'
import { formatINR, roundMoney } from '../utils/currency'
import { addDays, formatDate, formatDateTime, todayISO } from '../utils/dateUtils'

export default function Attendance({ navigate }) {
  const { data, saveAttendance } = useData()
  const { t, dayName } = useLang()
  const confirm = useConfirm()
  const toast = useToast()
  const today = todayISO()
  const [date, setDate] = useState(today)
  const [draft, setDraft] = useState({})
  const [query, setQuery] = useState('')
  const [correction, setCorrection] = useState(null) // { count, entries }

  // Only active labourers can be marked
  const active = useMemo(() => data.labourers.filter((l) => l.status === 'active').sort((a, b) => a.name.localeCompare(b.name)), [data.labourers])
  const saved = data.attendance[date]
  const hpdNow = data.settings.hoursPerDay

  // Saved entry of each active labourer for this date
  const savedMap = useMemo(() => {
    const m = {}
    for (const l of active) {
      const rec = saved?.records[l.id]
      if (rec) m[l.id] = cleanEntry(rec)
    }
    return m
  }, [saved, active])

  useEffect(() => {
    setDraft(savedMap)
  }, [savedMap])

  // Saved entries keep their own wage & hours-per-day; new ones use today's values
  const wageInfo = useMemo(() => {
    const m = {}
    for (const l of active) {
      const rec = saved?.records[l.id]
      m[l.id] = { wage: rec?.wage ?? l.dailyWage, hpd: rec?.hpd ?? hpdNow }
    }
    return m
  }, [active, saved, hpdNow])

  const dirty = useMemo(() => active.some((l) => !sameEntry(draft[l.id], savedMap[l.id])), [active, draft, savedMap])

  const stats = useMemo(() => {
    let present = 0, absent = 0, wages = 0
    for (const l of active) {
      const e = draft[l.id]
      if (!e) continue
      if (e.status === 'A') absent++
      else present++
      wages += recordWage({ ...e, ...wageInfo[l.id] })
    }
    return { present, absent, wages: roundMoney(wages) }
  }, [active, draft, wageInfo])
  const marked = stats.present + stats.absent

  const onChange = useCallback((id, entry) => setDraft((d) => ({ ...d, [id]: entry })), [])

  const changeDate = async (next) => {
    if (!next || next === date) return
    if (next > today) return toast.error(t('att.future'))
    if (dirty) {
      const ok = await confirm({ title: t('att.leaveTitle'), message: t('att.leaveMsg', { date: formatDate(date) }), confirmText: t('att.leaveYes'), danger: true })
      if (!ok) return
    }
    setDate(next)
  }

  const markAllPresent = () => {
    // Keep anyone already on Full Day (with their extra hours); everyone else becomes Full Day
    setDraft((d) => Object.fromEntries(active.map((l) => [l.id, d[l.id]?.status === 'P' ? d[l.id] : { status: 'P' }])))
    toast.success(t('att.allPresentToast', { n: active.length }))
  }

  const [saving, setSaving] = useState(false)

  const save = async () => {
    // "By hours" needs a number of hours
    const missing = active.find((l) => draft[l.id]?.status === 'T' && !(Number(draft[l.id].hours) > 0))
    if (missing) return toast.error(t('att.hoursRequired', { name: missing.name }))
    if (!dirty) return saved ? toast.success(t('att.savedBtn')) : toast.error(t('att.nothingMarked'))

    const entries = {}
    let changedSaved = 0
    for (const l of active) {
      if (sameEntry(draft[l.id], savedMap[l.id])) continue
      entries[l.id] = draft[l.id] || null
      if (savedMap[l.id]) changedSaved++
    }
    if (!saved && Object.values(entries).every((v) => v === null)) return toast.error(t('att.nothingMarked'))
    if (changedSaved > 0) return setCorrection({ count: changedSaved, entries }) // editing saved data needs a reason
    setSaving(true)
    const ok = await saveAttendance(date, entries)
    setSaving(false)
    if (!ok) return
    toast.success(t('att.savedToast', { date: formatDate(date) }))
  }

  const saveCorrection = async (reason) => {
    setSaving(true)
    const ok = await saveAttendance(date, correction.entries, reason)
    setSaving(false)
    if (!ok) return
    setCorrection(null)
    toast.success(t('att.savedToast', { date: formatDate(date) }))
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? active.filter((l) => l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q)) : active
  }, [active, query])

  const isToday = date === today

  return (
    <div className="pb-32 md:pb-24">
      {/* Date */}
      <Card className="mb-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => changeDate(addDays(date, -1))} className="grid size-12 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white text-slate-700 active:bg-slate-100" aria-label={t('att.prevDay')}>
            <ChevronLeft className="size-6" />
          </button>
          <label className="relative min-w-0 flex-1 text-center">
            <span className="block text-sm font-semibold text-slate-500">{isToday ? t('common.today') : dayName(date)}</span>
            <span className="block text-2xl font-bold tracking-tight text-slate-900">{formatDate(date)}</span>
            {/* Invisible native date picker over the date text */}
            <input type="date" value={date} max={today} onChange={(e) => changeDate(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label={t('att.selectDate')} />
          </label>
          <button type="button" onClick={() => changeDate(addDays(date, 1))} disabled={isToday} className="grid size-12 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white text-slate-700 active:bg-slate-100 disabled:opacity-30" aria-label={t('att.nextDay')}>
            <ChevronRight className="size-6" />
          </button>
        </div>
        {!isToday && (
          <button type="button" onClick={() => changeDate(today)} className="mx-auto mt-2 block text-sm font-semibold text-green-700">
            {t('att.goToday')}
          </button>
        )}

        {/* Counts */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Count label={t('common.total')} value={active.length} cls="bg-slate-100 text-slate-800" />
          <Count label={t('att.present')} value={stats.present} cls="bg-green-50 text-green-700" />
          <Count label={t('att.absent')} value={stats.absent} cls="bg-red-50 text-red-600" />
        </div>
        <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white">
          <span className="text-sm text-slate-300">{t('att.todayWages')}</span>
          <span className="whitespace-nowrap text-lg font-bold">{formatINR(stats.wages)}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {saved ? (
            <Badge color="green"><CheckCircle2 className="size-3.5" /> {t('att.saved')} · {formatDateTime(saved.savedAt)}</Badge>
          ) : (
            <Badge color="amber">{t('att.notSaved')}</Badge>
          )}
          {dirty && <Badge color="blue">{t('att.unsaved')}</Badge>}
        </div>
      </Card>

      {active.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title={t('att.noActive')} message={t('att.noActiveMsg')} action={<Button icon={UserPlus} onClick={() => navigate('/labour', { add: 1 })}>{t('lab.add')}</Button>} />
        </Card>
      ) : (
        <>
          <Button size="lg" icon={CheckCheck} onClick={markAllPresent} className="mb-3 h-16 w-full text-[17px] tracking-wide">
            {t('att.markAll')}
          </Button>
          <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            <p>{t('att.tapAgain')}</p>
            <p className="mt-1 text-xs text-slate-500">{t('att.rateInfo', { hpd: hpdNow })}</p>
          </div>
          {active.length > 8 && (
            <div className="mb-3">
              <SearchBox value={query} onChange={setQuery} placeholder={t('att.find')} />
            </div>
          )}
          <Card>
            {visible.length ? (
              <AttendanceList labourers={visible} draft={draft} wageInfo={wageInfo} onChange={onChange} t={t} />
            ) : (
              <EmptyState title={t('common.noMatch')} message={t('common.noMatchMsg')} />
            )}
          </Card>
        </>
      )}

      {/* Sticky save bar */}
      {active.length > 0 && (
        <div className="fixed inset-x-0 bottom-[68px] z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:bottom-0 md:left-64 print:hidden">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <p className="hidden flex-1 text-sm text-slate-600 sm:block">
              {t('att.marked', { n: marked })} / {active.length} · <b>{formatINR(stats.wages)}</b>
            </p>
            <Button size="lg" icon={Save} onClick={save} disabled={saving} className="h-14 w-full text-base sm:w-auto sm:min-w-64" variant={dirty ? 'primary' : 'secondary'}>
              {saved && !dirty ? t('att.savedBtn') : saved ? t('att.update') : t('att.save')}
            </Button>
          </div>
        </div>
      )}

      <CorrectionDialog open={!!correction} count={correction?.count} date={formatDate(date)} onCancel={() => setCorrection(null)} onSave={saveCorrection} />
    </div>
  )
}

/** Asks for a reason before changing already-saved attendance */
function CorrectionDialog({ open, count, date, onCancel, onSave }) {
  const { t } = useLang()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setReason('')
      setError('')
    }
  }, [open])

  const submit = () => {
    if (reason.trim().length < 3) return setError(t('att.reasonReq'))
    onSave(reason.trim())
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={t('att.editTitle')}
      size="sm"
      stackFooter
      footer={
        <>
          <Button variant="secondary" size="lg" className="flex-1" onClick={onCancel}>{t('common.cancel')}</Button>
          <Button size="lg" className="flex-1" onClick={submit}>{t('att.saveCorrection')}</Button>
        </>
      }
    >
      <p className="text-[15px] text-slate-700">{t('att.editMsg', { n: count, date })}</p>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
          {t('att.reason')} <span className="text-red-500">*</span>
        </span>
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
            setError('')
          }}
          placeholder={t('att.reasonPh')}
          rows={3}
          maxLength={150}
          autoFocus
          className={`w-full rounded-xl border bg-white px-3.5 py-3 text-base outline-none focus:ring-2 focus:ring-green-500/30 ${error ? 'border-red-400' : 'border-slate-300 focus:border-green-600'}`}
        />
        {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
      </label>
    </Modal>
  )
}

function Count({ label, value, cls }) {
  return (
    <div className={`rounded-xl px-1 py-2.5 ${cls}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="truncate text-xs font-semibold">{label}</p>
    </div>
  )
}
