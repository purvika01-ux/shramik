import { useMemo } from 'react'
import { Users, CheckCircle2, IndianRupee, Clock, CalendarDays, Calculator, FileText, Settings, LogOut, ChevronRight, CalendarCheck, UserRound } from 'lucide-react'
import DashboardChart from '../components/DashboardChart'
import { LanguageSwitch } from '../components/Header'
import { Button } from '../components/ui'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import { dayStats, totalPending } from '../utils/calculations'
import { formatINR } from '../utils/currency'
import { formatDate, todayISO } from '../utils/dateUtils'

// Big coloured shortcut tiles (like a phone app home screen)
const TILES = [
  { page: 'labour', key: 'dash.labourMgmt', icon: Users, bg: 'bg-green-50 ring-green-100', iconCls: 'text-green-600' },
  { page: 'attendance', key: 'nav.attendance', icon: CalendarDays, bg: 'bg-blue-50 ring-blue-100', iconCls: 'text-blue-600' },
  { page: 'hisab', key: 'nav.hisab', icon: Calculator, bg: 'bg-orange-50 ring-orange-100', iconCls: 'text-orange-500' },
  { page: 'reports', key: 'nav.reports', icon: FileText, bg: 'bg-violet-50 ring-violet-100', iconCls: 'text-violet-600' },
]

export default function Dashboard({ navigate, onOpenSettings }) {
  const { data, summaries } = useData()
  const { user, logout } = useAuth()
  const { t, dayName } = useLang()
  const today = todayISO()

  const activeCount = useMemo(() => data.labourers.filter((l) => l.status === 'active').length, [data.labourers])
  const stats = dayStats(data, today)
  const pending = totalPending(summaries)

  const STATS = [
    { label: t('dash.labourers'), value: activeCount, icon: Users, cls: 'bg-green-50 text-green-600', page: '/labour' },
    { label: t('dash.present'), value: stats.present, icon: CheckCircle2, cls: 'bg-green-50 text-green-600', page: '/attendance' },
    { label: t('dash.todayWages'), value: formatINR(stats.wages), icon: IndianRupee, cls: 'bg-orange-50 text-orange-500', page: '/attendance' },
    { label: t('dash.pendingShort'), value: formatINR(pending), icon: Clock, cls: 'bg-red-50 text-red-500', page: '/hisab' },
  ]

  return (
    <div>
      {/* ---------- Green header ---------- */}
      <div className="-mx-4 rounded-b-[28px] bg-green-600 px-5 pb-20 pt-5 text-white md:mx-0 md:rounded-3xl md:pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-green-100">
              {dayName(today)}, {formatDate(today)}
            </p>
            <h1 className="mt-1 break-words text-[26px] font-extrabold leading-tight tracking-tight">{t('dash.hello', { name: user.name })}</h1>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-green-700 shadow-sm active:bg-green-50"
            aria-label={t('dash.profile')}
            title={t('dash.profile')}
          >
            <UserRound className="size-6" />
          </button>
        </div>
        <div className="mt-3 w-fit">
          <LanguageSwitch compact />
        </div>
      </div>

      {/* ---------- Today's numbers ---------- */}
      <div className="relative -mt-14 grid grid-cols-2 gap-1 rounded-2xl bg-white p-2 shadow-lg shadow-slate-300/40 sm:grid-cols-4">
        {STATS.map(({ label, value, icon: Icon, cls, page }) => (
          <button key={label} type="button" onClick={() => navigate(page)} className="flex min-w-0 flex-col items-center rounded-xl px-1 py-3 text-center active:bg-slate-50">
            <span className={`grid size-10 place-items-center rounded-full ${cls}`}>
              <Icon className="size-5" strokeWidth={2.4} />
            </span>
            <span className="money-fit mt-1.5 max-w-full truncate font-extrabold tracking-tight text-slate-900">{value}</span>
            <span className="text-[13px] font-medium leading-tight text-slate-600">{label}</span>
          </button>
        ))}
      </div>

      {/* ---------- Main action ---------- */}
      <button
        type="button"
        onClick={() => navigate('/attendance')}
        className="mt-4 flex w-full items-center gap-4 rounded-2xl bg-green-600 px-5 py-4 text-left text-white shadow-sm shadow-green-700/20 active:bg-green-700"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/15">
          <CalendarCheck className="size-7" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-bold leading-snug">{t('dash.markToday')}</span>
          {/* Is today's attendance already saved? */}
          <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${stats.saved ? 'bg-white text-green-700' : 'bg-green-800/50 text-green-50'}`}>
            {stats.saved && <CheckCircle2 className="size-3.5" />} {t(stats.saved ? 'dash.marked' : 'dash.notMarked')}
          </span>
        </span>
        <ChevronRight className="size-6 shrink-0" />
      </button>

      {/* ---------- Sections ---------- */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TILES.map(({ page, key, icon: Icon, bg, iconCls }) => (
          <button
            key={page}
            type="button"
            onClick={() => navigate(`/${page}`)}
            className={`flex min-h-[124px] flex-col justify-between rounded-2xl p-4 text-left ring-1 active:scale-[0.98] ${bg}`}
          >
            <span className="grid size-12 place-items-center rounded-xl bg-white shadow-sm">
              <Icon className={`size-7 ${iconCls}`} strokeWidth={2.2} />
            </span>
            <span className="mt-3 flex items-end justify-between gap-1">
              <span className="min-w-0 text-[16px] font-bold leading-snug text-slate-900">{t(key)}</span>
              <ChevronRight className={`size-5 shrink-0 ${iconCls}`} />
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpenSettings}
        className="mt-3 flex h-16 w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 text-left shadow-sm shadow-slate-200/70 active:bg-slate-50"
      >
        <Settings className="size-6 text-slate-700" />
        <span className="flex-1 text-[16px] font-bold text-slate-900">{t('set.title')}</span>
        <ChevronRight className="size-5 text-slate-500" />
      </button>

      <div className="mt-5">
        <DashboardChart data={data} />
      </div>

      <Button size="lg" variant="greenOutline" icon={LogOut} className="mt-5 w-full md:hidden" onClick={logout}>
        {t('auth.logout')}
      </Button>
    </div>
  )
}
