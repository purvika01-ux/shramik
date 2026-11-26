import { useMemo, useState } from 'react'
import { ArrowLeft, Banknote, HandCoins, ChevronRight, IndianRupee, BookOpen, Trash2, User } from 'lucide-react'
import { AdvanceForm, PaymentForm } from '../components/TransactionForm'
import { TypeBadge } from '../components/TransactionList'
import { Avatar, BalanceText, Badge, Button, Card, EmptyState, PageHeader, SearchBox, StatusBadge } from '../components/ui'
import { useData } from '../context/DataContext'
import { useLang } from '../i18n/LanguageContext'
import { useConfirm } from '../components/ConfirmationDialog'
import { useToast } from '../components/Toast'
import { buildLedger, totalPending } from '../utils/calculations'
import { formatINR, roundMoney } from '../utils/currency'
import { formatDate } from '../utils/dateUtils'

export default function HisabKitab({ route, navigate }) {
  const [form, setForm] = useState(null) // { type, labourId }
  const open = (type, labourId) => setForm({ type, labourId })
  const close = () => setForm(null)

  return (
    <>
      {route.id ? <Ledger labourId={route.id} navigate={navigate} open={open} /> : <Overview navigate={navigate} open={open} />}
      <AdvanceForm open={form?.type === 'advance'} onClose={close} labourId={form?.labourId} />
      <PaymentForm open={form?.type === 'payment'} onClose={close} labourId={form?.labourId} />
    </>
  )
}

/** The only two money actions */
function ActionButtons({ open, labourId }) {
  const { t } = useLang()
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button size="tile" variant="warning" icon={HandCoins} onClick={() => open('advance', labourId)}>
        {t('his.addAdvance')}
      </Button>
      <Button size="tile" icon={Banknote} onClick={() => open('payment', labourId)}>
        {t('his.addPayment')}
      </Button>
    </div>
  )
}

function Totals({ wages, advances, payments, pending }) {
  const { t } = useLang()
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {/* Total wages */}
      <div className="col-span-2 flex items-center justify-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/70 lg:col-span-1">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-green-600 text-white">
          <IndianRupee className="size-7" strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[28px] font-extrabold leading-tight tracking-tight text-slate-900">{formatINR(wages)}</p>
          <p className="text-[15px] font-medium text-slate-600">{t('his.wages')}</p>
        </div>
      </div>
      <Box label={t('his.advances')} value={formatINR(advances)} icon={HandCoins} cls="bg-orange-50 ring-orange-100" iconCls="bg-orange-500" />
      <Box label={t('his.payments')} value={formatINR(payments)} icon={Banknote} cls="bg-green-50 ring-green-100" iconCls="bg-green-600" />
      {/* What is still to be paid */}
      <div className={`col-span-2 rounded-2xl p-4 text-center ring-1 lg:col-span-1 ${pending < 0 ? 'bg-red-50 ring-red-100' : 'bg-green-100/70 ring-green-200'}`}>
        <p className={`text-[28px] font-extrabold leading-tight tracking-tight ${pending < 0 ? 'text-red-600' : 'text-slate-900'}`}>
          {pending < 0 ? t('money.extra', { amt: formatINR(-pending) }) : formatINR(pending)}
        </p>
        <p className="text-[15px] font-medium text-slate-700">{t('his.pending')}</p>
      </div>
    </div>
  )
}

function Overview({ navigate, open }) {
  const { data, summaries } = useData()
  const { t } = useLang()
  const [query, setQuery] = useState('')

  const totals = useMemo(() => {
    const x = { wages: 0, advances: 0, payments: 0 }
    for (const s of Object.values(summaries)) {
      x.wages += s.wages
      x.advances += s.advances
      x.payments += s.payments
    }
    return { wages: roundMoney(x.wages), advances: roundMoney(x.advances), payments: roundMoney(x.payments), pending: totalPending(summaries) }
  }, [summaries])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.labourers
      .filter((l) => !q || l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q))
      .sort((a, b) => (a.status === b.status ? a.name.localeCompare(b.name) : a.status === 'active' ? -1 : 1))
  }, [data.labourers, query])

  return (
    <div className="space-y-4">
      <PageHeader title={t('nav.hisab')} subtitle={t('his.subtitle')} />
      <ActionButtons open={open} />
      <Totals {...totals} />
      <SearchBox value={query} onChange={setQuery} placeholder={t('his.search')} />

      <Card>
        {data.labourers.length === 0 ? (
          <EmptyState icon={IndianRupee} title={t('lab.none')} message={t('lab.noneMsg')} action={<Button onClick={() => navigate('/labour', { add: 1 })}>{t('lab.add')}</Button>} />
        ) : list.length === 0 ? (
          <EmptyState title={t('common.noMatch')} message={t('common.noMatchMsg')} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((l) => {
              const s = summaries[l.id]
              return (
                <li key={l.id}>
                  <button type="button" onClick={() => navigate(`/hisab/${l.id}`)} className="w-full px-4 py-3.5 text-left hover:bg-slate-50 active:bg-slate-100">
                    <div className="flex items-center gap-3">
                      <Avatar name={l.name} className="size-9 text-xs" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[16px] font-semibold text-slate-900">{l.name}</p>
                        <p className="text-xs text-slate-500">{l.id} {l.status === 'inactive' && <Badge className="ml-1">{t('common.inactive')}</Badge>}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-medium text-slate-400">{t('his.balance')}</p>
                        <p className="whitespace-nowrap text-[16px] font-bold"><BalanceText value={s.balance} /></p>
                      </div>
                      <ChevronRight className="size-5 text-slate-300" />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                      <span className="min-w-0 truncate">{t('type.wages')}<b className="block truncate text-sm text-slate-800">{formatINR(s.wages)}</b></span>
                      <span className="min-w-0 truncate">{t('type.advance')}<b className="block truncate text-sm text-amber-700">{formatINR(s.advances)}</b></span>
                      <span className="min-w-0 truncate">{t('type.payment')}<b className="block truncate text-sm text-slate-800">{formatINR(s.payments)}</b></span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
      <p className="px-1 text-xs text-slate-500">{t('his.formula')}</p>
    </div>
  )
}

function Ledger({ labourId, navigate, open }) {
  const { data, summaries, labourById, deleteTransaction } = useData()
  const { t, monthName } = useLang()
  const confirm = useConfirm()
  const toast = useToast()
  const labour = labourById[labourId]
  const entries = useMemo(() => (labour ? buildLedger(data, labourId) : []), [data, labourId, labour])

  if (!labour) {
    return (
      <Card>
        <EmptyState title={t('prof.notFound')} action={<Button onClick={() => navigate('/hisab')}>{t('his.back')}</Button>} />
      </Card>
    )
  }
  const s = summaries[labourId]

  const removeTxn = async (x) => {
    const ok = await confirm({ title: t('tx.deleteTitle'), message: t('tx.deleteMsg', { amt: formatINR(x.amount), date: formatDate(x.date) }), confirmText: t('common.delete'), danger: true })
    if (!ok) return
    if (!(await deleteTransaction(x.id))) return
    toast.success(t('tx.deleted'))
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => navigate('/hisab')} className="hidden h-11 md:inline-flex items-center gap-2 pr-3 text-[15px] font-semibold text-slate-600">
        <ArrowLeft className="size-5" /> {t('his.back')}
      </button>

      <Card className="flex items-center gap-3 p-4">
        <Avatar name={labour.name} className="size-12" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-slate-900">{labour.name}</h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {labour.id} · {formatINR(labour.dailyWage)}{t('common.perDay')} <StatusBadge status={labour.status} />
          </p>
        </div>
        <Button variant="ghost" size="sm" icon={User} onClick={() => navigate(`/labour/${labour.id}`)}>{t('his.profile')}</Button>
      </Card>

      <Totals wages={s.wages} advances={s.advances} payments={s.payments} pending={s.balance} />
      <ActionButtons open={open} labourId={labourId} />

      <Card>
        <h2 className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 font-bold text-slate-900">
          <BookOpen className="size-5 text-slate-400" /> {t('his.history')}
        </h2>
        {entries.length === 0 ? (
          <EmptyState title={t('his.noEntries')} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {entries.map((e) => (
              <li key={e.id} className={`px-4 py-3.5 ${e.kind === 'wages' ? 'bg-green-50/50' : ''}`}>
                {/* Line 1: type + date ........ amount */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <TypeBadge type={e.kind} />
                    <span className="whitespace-nowrap text-sm text-slate-500">{formatDate(e.date)}</span>
                  </div>
                  <p className={`shrink-0 whitespace-nowrap text-[16px] font-bold ${e.kind === 'wages' ? 'text-green-700' : e.kind === 'advance' ? 'text-amber-700' : 'text-slate-900'}`}>
                    {e.kind === 'wages' ? '+' : '−'} {formatINR(e.amount)}
                  </p>
                </div>
                {/* Line 2: details (can wrap) ........ running balance + delete */}
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  <p className="min-w-0 break-words text-sm text-slate-600">
                    {e.kind === 'wages'
                      ? t('his.wagesEntry', { month: monthName(e.monthKey), n: e.days })
                      : [e.method && t(`method.${e.method}`), e.remarks].filter(Boolean).join(' · ') || '—'}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="whitespace-nowrap text-xs text-slate-500">
                      {t('his.balance')}: <BalanceText value={e.balance} className="font-semibold" />
                    </span>
                    {e.kind !== 'wages' && (
                      <button type="button" onClick={() => removeTxn(e)} className="-mr-2 grid size-10 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={t('common.delete')}>
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className="px-1 text-xs text-slate-500">{t('his.formula')}</p>
    </div>
  )
}

function Box({ label, value, icon: Icon, cls, iconCls }) {
  return (
    <div className={`flex flex-col items-center rounded-2xl p-4 text-center ring-1 ${cls}`}>
      <span className={`grid size-9 place-items-center rounded-lg text-white ${iconCls}`}>
        <Icon className="size-5" />
      </span>
      <p className="money-fit mt-2 font-extrabold text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
  )
}
