import { CalendarCheck, Check, FileText, IndianRupee, Languages, LogIn, ReceiptText, ShieldCheck, UserPlus, Users, UserCheck, HandCoins, Wallet } from 'lucide-react'
import { Brand } from '../components/Sidebar'
import { LanguageSwitch } from '../components/Header'
import { Button } from '../components/ui'
import { useLang } from '../i18n/LanguageContext'

const FEATURES = [
  { icon: Users, key: 'labour' },
  { icon: CalendarCheck, key: 'attendance' },
  { icon: IndianRupee, key: 'hisab' },
  { icon: FileText, key: 'reports' },
  { icon: ReceiptText, key: 'slip' },
  { icon: Languages, key: 'language' },
]

/** First page visitors see before logging in */
export default function LandingPage({ goTo }) {
  const { t } = useLang()
  const login = () => goTo('login')
  const register = () => goTo('register')

  return (
    <div className="min-h-screen bg-white">
      {/* ---------- Top bar ---------- */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-8">
          <div className="min-w-0 flex-1">
            <Brand />
          </div>
          <div className="hidden sm:block">
            <LanguageSwitch compact />
          </div>
          <Button variant="secondary" size="sm" icon={LogIn} onClick={login}>{t('auth.login')}</Button>
          {/* on phones the big "Get started" button below is enough */}
          <div className="hidden sm:block">
            <Button size="sm" onClick={register}>{t('auth.register')}</Button>
          </div>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="bg-gradient-to-b from-green-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-2">
          <div>
            <div className="mb-4 sm:hidden">
              <LanguageSwitch compact />
            </div>
            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">{t('land.badge')}</span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">{t('land.title')}</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">{t('land.subtitle')}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" icon={UserPlus} onClick={register}>{t('land.cta')}</Button>
              <Button size="lg" variant="secondary" icon={LogIn} onClick={login}>{t('land.haveAccount')}</Button>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              {['land.point1', 'land.point2', 'land.point3'].map((k) => (
                <li key={k} className="flex items-center gap-1.5">
                  <Check className="size-4 text-green-600" strokeWidth={3} /> {t(k)}
                </li>
              ))}
            </ul>
          </div>

          <AppPreview />
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{t('land.featuresTitle')}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-slate-600">{t('land.featuresSubtitle')}</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, key }) => (
            <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5">
              <span className="grid size-11 place-items-center rounded-xl bg-green-50 text-green-700">
                <Icon className="size-5" strokeWidth={2.25} />
              </span>
              <h3 className="mt-4 font-bold text-slate-900">{t(`land.f.${key}`)}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{t(`land.f.${key}Text`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{t('land.howTitle')}</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <li key={n} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                <span className="grid size-9 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white">{n}</span>
                <h3 className="mt-4 font-bold text-slate-900">{t(`land.step${n}`)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{t(`land.step${n}Text`)}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 flex items-start justify-center gap-2 text-center text-sm text-slate-600">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-green-600" /> {t('land.secure')}
          </p>
        </div>
      </section>

      {/* ---------- Call to action ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:px-8">
        <div className="rounded-3xl bg-green-600 px-6 py-10 text-center text-white md:py-14">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t('land.ctaTitle')}</h2>
          <p className="mx-auto mt-2 max-w-xl text-green-50">{t('land.ctaText')}</p>
          <Button size="lg" variant="secondary" icon={UserPlus} className="mt-6 border-0" onClick={register}>{t('land.cta')}</Button>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <p className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-slate-500 md:px-8">
          © {new Date().getFullYear()} {t('app.name')} – {t('app.subtitle')}
        </p>
      </footer>
    </div>
  )
}

/** A small picture of the app's home screen, built with the same styles (sample numbers) */
function AppPreview() {
  const { t } = useLang()
  const tiles = [
    { label: t('dash.totalLabour'), value: '28', icon: Users, tone: 'bg-slate-100 text-slate-700' },
    { label: t('dash.presentToday'), value: '24', icon: UserCheck, tone: 'bg-green-50 text-green-700' },
    { label: t('dash.wagesToday'), value: '₹18,450', icon: HandCoins, tone: 'bg-amber-50 text-amber-700' },
    { label: t('dash.pending'), value: '₹4,12,300', icon: Wallet, tone: 'bg-slate-900 text-white' },
  ]
  const rows = [
    { name: 'Ramesh Kumar', status: t('type.full'), extra: '+2 hrs', cls: 'bg-green-50 text-green-700' },
    { name: 'Suresh Yadav', status: t('type.half'), cls: 'bg-yellow-50 text-yellow-800' },
    { name: 'Gurpreet Singh', status: t('att.absent'), cls: 'bg-red-50 text-red-600' },
  ]
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-100 p-3 shadow-xl shadow-slate-200 md:p-4" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3">
        {tiles.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <span className={`mb-2 grid size-8 place-items-center rounded-lg ${tone}`}>
              <Icon className="size-4" strokeWidth={2.25} />
            </span>
            <p className="truncate text-xs font-medium text-slate-500">{label}</p>
            <p className="text-lg font-bold tracking-tight text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between gap-2 px-3.5 py-2.5">
            <span className="truncate text-sm font-semibold text-slate-800">{r.name}</span>
            <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${r.cls}`}>
              {r.status} {r.extra}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
