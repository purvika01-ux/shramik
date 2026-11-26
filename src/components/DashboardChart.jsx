import { useEffect, useMemo, useRef, useState } from 'react'
import { BarController, BarElement, CategoryScale, Chart, Legend, LinearScale, Tooltip } from 'chart.js'
import { Card } from './ui'
import { useLang } from '../i18n/LanguageContext'
import { recordWage } from '../utils/calculations'
import { formatINR, roundMoney } from '../utils/currency'
import { addDays, formatDate, monthKeyOf, shortMonthLabel, todayISO } from '../utils/dateUtils'

// Register only the pieces a bar chart needs (keeps the bundle small)
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const GREEN = '#16a34a'
const RED = '#fca5a5'
const AMBER = '#d97706'

/** Present / absent count for each of the last 7 days (oldest first, today last) */
function last7Days(data) {
  const today = todayISO()
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6)
    let present = 0, absent = 0
    for (const rec of Object.values(data.attendance[date]?.records || {})) {
      if (rec.status === 'A') absent++
      else present++
    }
    return { date, label: formatDate(date).slice(0, 5), present, absent }
  })
}

/** Wages earned (from attendance) in each of the last 6 months, oldest first */
function last6Months(data) {
  const today = todayISO()
  const [y, m] = today.split('-').map(Number)
  const keys = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(y, m - 1 - (5 - i), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const totals = Object.fromEntries(keys.map((k) => [k, 0]))
  for (const [date, day] of Object.entries(data.attendance)) {
    const mk = monthKeyOf(date)
    if (!(mk in totals)) continue
    for (const rec of Object.values(day?.records || {})) totals[mk] += recordWage(rec)
  }
  return keys.map((k) => ({ label: shortMonthLabel(k), wages: roundMoney(totals[k]) }))
}

/** Dashboard bar chart: attendance over the last 7 days, or wages per month */
export default function DashboardChart({ data }) {
  const { t, dayName } = useLang()
  const [view, setView] = useState('week')
  const canvasRef = useRef(null)

  const week = useMemo(() => last7Days(data), [data])
  const months = useMemo(() => last6Months(data), [data])

  useEffect(() => {
    const config =
      view === 'week'
        ? {
            labels: week.map((d) => d.label),
            datasets: [
              { label: t('chart.present'), data: week.map((d) => d.present), backgroundColor: GREEN, borderRadius: 4 },
              { label: t('chart.absent'), data: week.map((d) => d.absent), backgroundColor: RED, borderRadius: 4 },
            ],
            stacked: true,
            money: false,
          }
        : {
            labels: months.map((d) => d.label),
            datasets: [{ label: t('chart.wages'), data: months.map((d) => d.wages), backgroundColor: AMBER, borderRadius: 4 }],
            stacked: false,
            money: true,
          }

    const chart = new Chart(canvasRef.current, {
      type: 'bar',
      data: { labels: config.labels, datasets: config.datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
          legend: { display: config.datasets.length > 1, position: 'bottom', labels: { boxWidth: 12, boxHeight: 12 } },
          tooltip: {
            callbacks: config.money
              ? { label: (ctx) => `${ctx.dataset.label}: ${formatINR(ctx.parsed.y)}` }
              : { title: (items) => `${dayName(week[items[0].dataIndex].date)}, ${formatDate(week[items[0].dataIndex].date)}` },
          },
        },
        scales: {
          x: { stacked: config.stacked, grid: { display: false }, ticks: { font: { size: 11 } } },
          y: {
            stacked: config.stacked,
            beginAtZero: true,
            ticks: {
              precision: 0,
              font: { size: 11 },
              callback: config.money ? (v) => (v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`) : undefined,
            },
          },
        },
      },
    })
    return () => chart.destroy()
  }, [view, week, months, t, dayName])

  const tabClass = (active) =>
    `rounded-lg px-3 py-1.5 text-xs font-semibold ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-900">{t(view === 'week' ? 'chart.weekTitle' : 'chart.monthTitle')}</h2>
        <div className="flex rounded-xl bg-slate-100 p-1" role="tablist">
          <button type="button" role="tab" aria-selected={view === 'week'} className={tabClass(view === 'week')} onClick={() => setView('week')}>
            {t('chart.weekTab')}
          </button>
          <button type="button" role="tab" aria-selected={view === 'month'} className={tabClass(view === 'month')} onClick={() => setView('month')}>
            {t('chart.monthTab')}
          </button>
        </div>
      </div>
      <div className="relative h-64">
        <canvas ref={canvasRef} aria-label={t(view === 'week' ? 'chart.weekTitle' : 'chart.monthTitle')} role="img" />
      </div>
    </Card>
  )
}
