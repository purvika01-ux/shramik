import { useEffect, useMemo, useState } from 'react'
import { Download, Printer, FileText, Loader2, ReceiptText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { downloadSalarySlip } from '../utils/salarySlip'
import api, { errorMessage } from '../api/axios'
import { BalanceText, Button, Card, DayBadge, EmptyState, Field, Input, PageHeader, Select } from '../components/ui'
import { TypeBadge } from '../components/TransactionList'
import { useData } from '../context/DataContext'
import { useLang } from '../i18n/LanguageContext'
import { TRANSLATIONS } from '../i18n/translations'
import { useToast } from '../components/Toast'
import { attendanceHistory, describeEntry, sortTxnsDesc } from '../utils/calculations'
import { formatINR, formatINRPlain } from '../utils/currency'
import { currentMonthKey, formatDate, monthLabel, monthRange, todayISO } from '../utils/dateUtils'

/** English text for the PDF (built-in PDF fonts cannot draw Hindi/Punjabi letters) */
const enT = (key, vars) => {
  let s = TRANSLATIONS.en[key] ?? key
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v)
  return s
}

export default function Reports() {
  const { data, labourById } = useData()
  const { t, monthName } = useLang()
  const toast = useToast()
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonthKey())
  const [labourId, setLabourId] = useState('all')
  const range = monthRange(month)

  // Monthly totals are calculated by the server: GET /api/reports/monthly
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    const labourerId = labourId === 'all' ? 'all' : labourById[labourId]?._id
    api
      .get('/reports/monthly', { params: { month, labourerId } })
      .then((res) => {
        if (cancelled) return
        const rows = res.data.rows.map((r) => ({ ...r, labour: labourById[r.code] })).filter((r) => r.labour)
        setReport({ rows, totals: res.data.totals })
      })
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [month, labourId, labourById])

  const single = labourId !== 'all' ? labourById[labourId] : null
  const singleDays = useMemo(() => (single ? attendanceHistory(data, labourId, range) : []), [data, labourId, single, range.from, range.to])
  const singleTxns = useMemo(
    () => (single ? sortTxnsDesc(data.transactions.filter((x) => x.labourId === labourId && x.date >= range.from && x.date <= range.to)) : []),
    [data.transactions, labourId, single, range.from, range.to],
  )
  const title = `${single ? single.name : t('rep.all')} – ${monthName(month)}`

  // PDF uses English (built-in PDF fonts cannot draw Hindi/Punjabi letters)
  const downloadPdf = async () => {
    if (!report?.rows.length) return toast.error(t('rep.nothing'))
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pdfTitle = `${single ? single.name : 'All Labourers'} - ${monthLabel(month)}`
      doc.setFontSize(16)
      doc.text('ShramikKhata - Digital Labour Register', 14, 15)
      doc.setFontSize(11)
      doc.setTextColor(90)
      doc.text(`Monthly Report: ${pdfTitle}`, 14, 22)
      doc.text(
        `Generated on ${formatDate(todayISO())}   |   Full day = daily wage, Half day = 50%, Hourly rate = daily wage / ${data.settings.hoursPerDay} hrs (extra hours paid at this rate)`,
        14,
        28,
      )
      const tt = report.totals
      const money = [7, 8, 9, 10, 11]
      autoTable(doc, {
        startY: 34,
        head: [['ID', 'Name', 'Full Day', 'Half Day', 'By Hours', 'Absent', 'Extra Hrs', 'Prev. Balance', 'Wages', 'Advances', 'Payments', 'Balance Due']],
        body: report.rows.map((r) => [
          r.labour.id, r.labour.name, r.full, r.half, r.hourly, r.absent, r.extraHours,
          formatINRPlain(r.opening), formatINRPlain(r.wages), formatINRPlain(r.advances), formatINRPlain(r.payments), formatINRPlain(r.closing),
        ]),
        foot: [['', 'TOTAL', tt.full, tt.half, tt.hourly, tt.absent, tt.extraHours, formatINRPlain(tt.opening), formatINRPlain(tt.wages), formatINRPlain(tt.advances), formatINRPlain(tt.payments), formatINRPlain(tt.closing)]],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 23, 42] },
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
        columnStyles: Object.fromEntries(money.map((i) => [i, { halign: 'right' }])),
      })
      if (single && singleDays.length) {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 8,
          head: [['Date', 'Attendance', 'Earned']],
          body: [...singleDays].reverse().map((d) => [formatDate(d.date), describeEntry(d.rec, enT), formatINRPlain(d.earned)]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [22, 163, 74] },
        })
      }
      if (single && singleTxns.length) {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 8,
          head: [['Date', 'Type', 'Method', 'Remarks', 'Amount']],
          body: singleTxns.map((x) => [formatDate(x.date), x.type === 'advance' ? 'Advance' : 'Payment', x.method || '-', x.remarks || '-', formatINRPlain(x.amount)]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [217, 119, 6] },
        })
      }
      doc.setFontSize(8)
      doc.setTextColor(120)
      doc.text('Balance Due = Previous Balance + Wages - Advances - Payments', 14, doc.internal.pageSize.getHeight() - 8)
      const file = `Report-${single ? single.id : 'All'}-${month}.pdf`
      doc.save(file)
      toast.success(t('rep.pdfDone', { file }))
    } catch (err) {
      console.error(err)
      toast.error(t('rep.pdfFail'))
    }
  }

  // One-page salary slip for the selected labourer and month
  const downloadSlip = async () => {
    if (!single) return toast.error(t('rep.slipPick'))
    const row = report?.rows[0]
    if (!row) return toast.error(t('rep.nothing'))
    try {
      const file = await downloadSalarySlip({ labour: single, row, month, contractorName: user.name, hoursPerDay: data.settings.hoursPerDay })
      toast.success(t('rep.pdfDone', { file }))
    } catch (err) {
      console.error(err)
      toast.error(t('rep.pdfFail'))
    }
  }

  const tt = report?.totals

  return (
    <div>
      <div className="print:hidden">
        <PageHeader title={t('nav.reports')} subtitle={t('rep.subtitle')} />
        <Card className="mb-4 grid gap-4 p-4 sm:grid-cols-2">
          <Field label={t('rep.month')}>
            <Input type="month" value={month} max={currentMonthKey()} onChange={(e) => e.target.value && setMonth(e.target.value)} />
          </Field>
          <Field label={t('rep.labourer')}>
            <Select value={labourId} onChange={(e) => setLabourId(e.target.value)}>
              <option value="all">{t('rep.all')}</option>
              {[...data.labourers].sort((a, b) => a.name.localeCompare(b.name)).map((l) => (
                <option key={l.id} value={l.id}>{l.name} ({l.id})</option>
              ))}
            </Select>
          </Field>
        </Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Button size="lg" icon={Download} onClick={downloadPdf} className="col-span-2 h-16 text-lg sm:col-span-1 sm:h-auto">{t('rep.pdf')}</Button>
          <Button size="tile" variant="secondary" icon={Printer} onClick={() => window.print()}>{t('rep.print')}</Button>
          <Button size="tile" variant="greenOutline" icon={ReceiptText} onClick={downloadSlip} disabled={loading}>{t('rep.slip')}</Button>
        </div>
        <p className="mb-5 mt-2 text-xs text-slate-500">{t('rep.pdfNote')}</p>
      </div>

      <div className="space-y-4">
        <div className="hidden print:block">
          <h1 className="text-xl font-bold">{t('app.name')} – {t('app.subtitle')}</h1>
          <p className="text-sm text-slate-600">{title} · {formatDate(todayISO())}</p>
        </div>
        <h2 className="text-lg font-bold text-slate-900 print:hidden">{title}</h2>

        {loading || error || !report ? (
          <Card className="grid place-items-center p-10 text-sm">
            {error ? <p className="text-red-600">{error}</p> : <Loader2 className="size-7 animate-spin text-green-600" aria-label="Loading" />}
          </Card>
        ) : (
        <>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <Count label={t('rep.present')} value={tt.full} cls="bg-green-50 text-green-700" />
          <Count label={t('rep.half')} value={tt.half} cls="bg-orange-50 text-orange-600" />
          <Count label={t('rep.hourly')} value={tt.hourly} cls="bg-blue-50 text-blue-700" />
          <Count label={t('rep.absent')} value={tt.absent} cls="bg-red-50 text-red-600" />
        </div>
        {tt.extraHours > 0 && (
          <div className="rounded-2xl bg-green-50 px-4 py-3.5 text-center ring-1 ring-green-100">
            <p className="text-[15px] font-medium text-slate-700">{t('rep.extra')}</p>
            <p className="text-2xl font-extrabold text-green-800">{t('common.hrs', { n: tt.extraHours })}</p>
          </div>
        )}
        <Card className="divide-y divide-slate-100">
          <Line label={t('rep.prev')} value={formatINR(tt.opening)} />
          <Line label={`+ ${t('rep.wages')}`} value={formatINR(tt.wages)} cls="text-green-700" />
          <Line label={`− ${t('rep.advances')}`} value={formatINR(tt.advances)} cls="text-amber-700" />
          <Line label={`− ${t('rep.payments')}`} value={formatINR(tt.payments)} />
          <Line label={`= ${t('rep.due')}`} value={<BalanceText value={tt.closing} />} big />
        </Card>

        {/* Per labourer */}
        {report.rows.length === 0 ? (
          <Card><EmptyState icon={FileText} title={t('rep.none')} message={t('rep.noneMsg')} /></Card>
        ) : labourId === 'all' ? (
          <Card>
            <ul className="divide-y divide-slate-100">
              {report.rows.map((r) => (
                <li key={r.labour.id} className="px-4 py-3.5 print:break-inside-avoid">
                  {/* Name ........ balance due */}
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-[16px] font-semibold text-slate-900">{r.labour.name}</p>
                    <p className="shrink-0 whitespace-nowrap text-[16px] font-bold"><BalanceText value={r.closing} /></p>
                  </div>
                  {/* Day counts */}
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
                    <span className="whitespace-nowrap rounded-md bg-green-50 px-2 py-1 text-green-700">{t('rep.present')}: {r.full}</span>
                    {r.half > 0 && <span className="whitespace-nowrap rounded-md bg-yellow-50 px-2 py-1 text-yellow-800">{t('rep.half')}: {r.half}</span>}
                    {r.hourly > 0 && <span className="whitespace-nowrap rounded-md bg-blue-50 px-2 py-1 text-blue-700">{t('rep.hourly')}: {r.hourly}</span>}
                    {r.absent > 0 && <span className="whitespace-nowrap rounded-md bg-red-50 px-2 py-1 text-red-600">{t('rep.absent')}: {r.absent}</span>}
                    {r.extraHours > 0 && <span className="whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 text-slate-700">+{t('common.hrs', { n: r.extraHours })}</span>}
                  </div>
                  {/* Money in 3 equal columns */}
                  <div className="mt-2.5 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    <span className="min-w-0 truncate">{t('rep.wages')}<b className="block truncate text-sm text-slate-800">{formatINR(r.wages)}</b></span>
                    <span className="min-w-0 truncate">{t('rep.advances')}<b className="block truncate text-sm text-amber-700">{formatINR(r.advances)}</b></span>
                    <span className="min-w-0 truncate">{t('rep.payments')}<b className="block truncate text-sm text-slate-800">{formatINR(r.payments)}</b></span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-2">
            <Card className="print:break-inside-avoid">
              <h3 className="border-b border-slate-100 px-4 py-3 font-bold text-slate-900">{t('rep.dayWise')}</h3>
              {singleDays.length === 0 ? (
                <EmptyState title={t('prof.noHistory')} />
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {singleDays.map((d) => (
                    <li key={d.date} className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span className="whitespace-nowrap">{formatDate(d.date)}</span>
                        <DayBadge entry={d.rec} />
                      </span>
                      <span className="shrink-0 whitespace-nowrap font-semibold">{formatINR(d.earned)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card className="print:break-inside-avoid">
              <h3 className="border-b border-slate-100 px-4 py-3 font-bold text-slate-900">{t('rep.txns')}</h3>
              {singleTxns.length === 0 ? (
                <EmptyState title={t('tx.none')} />
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {singleTxns.map((x) => (
                    <li key={x.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <span className="flex flex-wrap items-center gap-2">
                        {formatDate(x.date)} <TypeBadge type={x.type} />
                      </span>
                      <span className="font-semibold">{formatINR(x.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
        </>
        )}
        <p className="px-1 text-xs text-slate-500">{t('rep.formula')}</p>
      </div>
    </div>
  )
}

function Count({ label, value, cls }) {
  return (
    <div className={`rounded-2xl px-1 py-4 ${cls}`}>
      <p className="text-3xl font-extrabold">{value}</p>
      <p className="text-[13px] font-semibold">{label}</p>
    </div>
  )
}

function Line({ label, value, cls = 'text-slate-900', big }) {
  return (
    <div className={`flex items-center justify-between px-4 ${big ? 'py-4' : 'py-3'}`}>
      <span className={`text-slate-600 ${big ? 'font-bold text-slate-900' : 'text-[15px]'}`}>{label}</span>
      <span className={`font-bold ${big ? 'text-xl' : 'text-[16px]'} ${cls}`}>{value}</span>
    </div>
  )
}
