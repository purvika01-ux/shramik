import { useMemo } from 'react'
import { Users, UserCheck, HandCoins, Wallet, CalendarCheck, IndianRupee, CheckCircle2 } from 'lucide-react'
import DashboardCard from '../components/DashboardCard'
import { useData } from '../context/DataContext'
import { useLang } from '../i18n/LanguageContext'
import { dayStats, totalPending } from '../utils/calculations'
import { formatINR } from '../utils/currency'
import { formatDate, todayISO } from '../utils/dateUtils'

export default function Dashboard({ navigate }) {
  const { data, summaries } = useData()
  const { t, dayName } = useLang()
  const today = todayISO()

  const activeCount = useMemo(() => data.labourers.filter((l) => l.status === 'active').length, [data.labourers])
  const stats = dayStats(data, today)
  const pending = totalPending(summaries)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-slate-500">
          {dayName(today)}, {formatDate(today)}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('dash.greeting')} 👋</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DashboardCard label={t('dash.totalLabour')} value={activeCount} icon={Users} onClick={() => navigate('/labour')}
          hint={data.labourers.length > activeCount ? t('dash.inactive', { n: data.labourers.length - activeCount }) : undefined} />
        <DashboardCard label={t('dash.presentToday')} value={stats.present} icon={UserCheck} tone="green" onClick={() => navigate('/attendance')}
          hint={stats.absent ? `${t('att.absent')}: ${stats.absent}` : undefined} />
        <DashboardCard label={t('dash.wagesToday')} value={formatINR(stats.wages)} icon={HandCoins} tone="amber" onClick={() => navigate('/attendance')} />
        <DashboardCard label={t('dash.pending')} value={formatINR(pending)} icon={Wallet} tone="navy" onClick={() => navigate('/hisab')} hint={t('dash.pendingHint')} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate('/attendance')}
          className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-5 text-center text-white active:bg-green-700 hover:bg-green-700"
        >
          <CalendarCheck className="size-7" />
          <span className="text-lg font-bold leading-snug tracking-wide">{t('dash.markToday')}</span>
          {/* Is today's attendance already saved? */}
          <span className={`mt-1 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${stats.saved ? 'bg-white text-green-700' : 'bg-green-700/60 text-green-50'}`}>
            {stats.saved && <CheckCircle2 className="size-3.5" />} {t(stats.saved ? 'dash.marked' : 'dash.notMarked')}
          </span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/hisab')}
          className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-5 text-center text-white active:bg-slate-800 hover:bg-slate-800"
        >
          <IndianRupee className="size-7" />
          <span className="text-lg font-bold leading-snug tracking-wide">{t('dash.viewHisab')}</span>
        </button>
      </div>
    </div>
  )
}
