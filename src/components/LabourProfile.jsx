import { useMemo, useState } from 'react'
import { ArrowLeft, Pencil, Phone, Trash2, UserCheck, UserX, IndianRupee, CalendarDays, PenLine } from 'lucide-react'
import { Avatar, Button, Card, DayBadge, EmptyState, StatusBadge } from './ui'
import TransactionList from './TransactionList'
import LabourForm from './LabourForm'
import { useData } from '../context/DataContext'
import { useLang } from '../i18n/LanguageContext'
import { useConfirm } from './ConfirmationDialog'
import { useToast } from './Toast'
import { attendanceHistory, describeEntry, sortTxnsDesc } from '../utils/calculations'
import { formatINR } from '../utils/currency'
import { formatDate } from '../utils/dateUtils'

const PAGE = 15

export default function LabourProfile({ labourId, navigate }) {
  const { data, summaries, labourById, setLabourStatus, deleteLabour, deleteTransaction } = useData()
  const { t, dayMonth, dayName } = useLang()
  const confirm = useConfirm()
  const toast = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const labour = labourById[labourId]
  const s = summaries[labourId]

  const history = useMemo(() => (labour ? attendanceHistory(data, labourId) : []), [data, labourId, labour])
  const txns = useMemo(() => sortTxnsDesc(data.transactions.filter((x) => x.labourId === labourId)), [data.transactions, labourId])
  // Correction notes by date
  const correctionsByDate = useMemo(() => {
    const m = {}
    for (const c of data.corrections) if (c.labourId === labourId) (m[c.date] ||= []).push(c)
    return m
  }, [data.corrections, labourId])

  if (!labour) {
    return (
      <Card>
        <EmptyState title={t('prof.notFound')} action={<Button onClick={() => navigate('/labour')}>{t('prof.back')}</Button>} />
      </Card>
    )
  }

  // Corrections saved before the shift change stored plain letters (P/H/A)
  const entryText = (e) => (!e ? '—' : typeof e === 'string' ? e : describeEntry(e, t))

  const toggleStatus = async () => {
    const deactivate = labour.status === 'active'
    const ok = await confirm({
      title: t(deactivate ? 'lab.deactivateTitle' : 'lab.activateTitle'),
      message: t(deactivate ? 'lab.deactivateMsg' : 'lab.activateMsg', { name: labour.name }),
      confirmText: t(deactivate ? 'lab.deactivate' : 'lab.activate'),
    })
    if (!ok) return
    if (!(await setLabourStatus(labour.id, deactivate ? 'inactive' : 'active'))) return
    toast.success(t(deactivate ? 'lab.nowInactive' : 'lab.nowActive', { name: labour.name }))
  }

  const remove = async () => {
    const ok = await confirm({ title: t('lab.deleteTitle'), message: t('lab.deleteMsg', { name: labour.name }), confirmText: t('lab.deleteYes'), danger: true })
    if (!ok) return
    if (!(await deleteLabour(labour.id))) return
    toast.success(t('lab.deleted', { name: labour.name }))
    navigate('/labour')
  }

  const removeTxn = async (x) => {
    const ok = await confirm({ title: t('tx.deleteTitle'), message: t('tx.deleteMsg', { amt: formatINR(x.amount), date: formatDate(x.date) }), confirmText: t('common.delete'), danger: true })
    if (!ok) return
    if (!(await deleteTransaction(x.id))) return
    toast.success(t('tx.deleted'))
  }

  const visibleHistory = showAll ? history : history.slice(0, PAGE)

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => navigate('/labour')} className="hidden h-11 md:inline-flex items-center gap-2 pr-3 text-[15px] font-semibold text-slate-600">
        <ArrowLeft className="size-5" /> {t('prof.back')}
      </button>

      <Card className="p-5">
        <div className="flex items-start gap-4">
          <Avatar name={labour.name} className="size-14 text-lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-slate-900">{labour.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span>{labour.id}</span>
              <StatusBadge status={labour.status} />
            </div>
            {labour.mobile ? (
              <a href={`tel:${labour.mobile}`} className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg bg-green-50 px-3 text-sm font-semibold text-green-700">
                <Phone className="size-4" /> {labour.mobile}
              </a>
            ) : (
              <p className="mt-1 text-sm text-slate-500">{t('lab.noMobile')}</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-600">{t('prof.dailyWage')}</span>
          <span className="text-xl font-bold text-slate-900">{formatINR(labour.dailyWage)}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 [&>button]:px-3">
          <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>{t('common.edit')}</Button>
          <Button variant="secondary" icon={IndianRupee} onClick={() => navigate(`/hisab/${labour.id}`)}>{t('nav.hisab')}</Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label={t('prof.sessions')}
          value={s.daysWorked}
          hint={`${t('prof.sessionsHint', { p: s.full, h: s.half, t: s.hourly, a: s.absent })}${s.extraHours ? ` · ${t('prof.extra', { n: s.extraHours })}` : ''}`}
        />
        <Stat label={t('prof.wages')} value={formatINR(s.wages)} />
        <Stat label={t('prof.advances')} value={formatINR(s.advances)} tone="text-amber-700" />
        <Stat label={t('prof.payments')} value={formatINR(s.payments)} />
        <div className="col-span-2 rounded-2xl bg-slate-900 p-4 text-white">
          <p className="text-sm text-slate-300">{t('prof.balance')}</p>
          <p className={`mt-1 text-3xl font-bold ${s.balance < 0 ? 'text-red-300' : ''}`}>
            {s.balance < 0 ? t('money.extra', { amt: formatINR(-s.balance) }) : formatINR(s.balance)}
          </p>
          <p className="mt-1 text-xs text-slate-400">{t('prof.formula')}</p>
        </div>
      </div>

      {/* Attendance history grouped by date */}
      <Card>
        <h2 className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 font-bold text-slate-900">
          <CalendarDays className="size-5 text-slate-400" /> {t('prof.history')}
        </h2>
        {history.length === 0 ? (
          <EmptyState title={t('prof.noHistory')} />
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {visibleHistory.map((h) => (
                <li key={h.date} className="px-4 py-3.5">
                  {/* 20 November ........ ₹1,100 */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{dayMonth(h.date)}</p>
                      <p className="text-xs text-slate-500">{dayName(h.date)} · {formatDate(h.date)}</p>
                    </div>
                    <span className={`shrink-0 whitespace-nowrap text-[16px] font-bold ${h.rec.status === 'A' ? 'text-red-600' : 'text-slate-900'}`}>{formatINR(h.earned)}</span>
                  </div>
                  {/* Full Day + 3 hrs */}
                  <div className="mt-2">
                    <DayBadge entry={h.rec} />
                  </div>
                  {correctionsByDate[h.date]?.map((c) => (
                    <p key={c.id} className="mt-2 flex items-start gap-1.5 text-xs text-blue-700">
                      <PenLine className="mt-0.5 size-3 shrink-0" />
                      <span>{t('att.corrected')}: {entryText(c.from)} → {entryText(c.to)} · {c.reason}</span>
                    </p>
                  ))}
                </li>
              ))}
            </ul>
            {history.length > PAGE && (
              <div className="border-t border-slate-100 p-3 text-center">
                <Button variant="ghost" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? t('prof.showLess') : t('prof.showAll', { n: history.length })}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      <Card>
        <h2 className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 font-bold text-slate-900">
          <IndianRupee className="size-5 text-slate-400" /> {t('prof.payHistory')}
        </h2>
        <TransactionList txns={txns} labourById={labourById} showName={false} onDelete={removeTxn} />
      </Card>

      {/* Less-used actions at the bottom */}
      <div className="grid grid-cols-2 gap-3 pt-1 [&>button]:px-3">
        <Button variant="secondary" icon={labour.status === 'active' ? UserX : UserCheck} onClick={toggleStatus}>
          {t(labour.status === 'active' ? 'lab.deactivate' : 'lab.activate')}
        </Button>
        <Button variant="dangerOutline" icon={Trash2} onClick={remove}>{t('common.delete')}</Button>
      </div>

      <LabourForm open={editOpen} onClose={() => setEditOpen(false)} labour={labour} />
    </div>
  )
}

function Stat({ label, value, hint, tone = 'text-slate-900' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`money-fit mt-1 font-bold ${tone}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
