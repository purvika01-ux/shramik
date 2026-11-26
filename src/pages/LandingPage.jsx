import { ArrowRight, CalendarCheck, FileText, IndianRupee, Languages, LogIn, ReceiptText, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { WorkerLogo, WorkersScene } from '../components/Illustrations'
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
      {/* ---------- First screen: on phones this is the whole landing page (welcome screen) ---------- */}
      <section className="relative overflow-hidden bg-white lg:bg-gradient-to-b lg:from-white lg:to-green-50">
        {/* soft green shapes in the corners */}
        <div className="pointer-events-none absolute -right-16 top-40 size-48 rounded-full bg-green-100/70 blur-2xl lg:hidden" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-20 top-[52%] size-40 rounded-full bg-green-50 blur-2xl lg:hidden" aria-hidden="true" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col pt-8 md:px-8 lg:grid lg:min-h-0 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-16">
          <div className="flex flex-col px-6 md:px-0">
            {/* language + login only on big screens (phones: exactly like the app welcome screen) */}
            <div className="mb-6 hidden items-center gap-2 lg:flex">
              <LanguageSwitch compact />
              <button type="button" onClick={login} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-green-700 hover:bg-green-50">
                <LogIn className="size-4" /> {t('auth.login')}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <WorkerLogo className="size-[60px] shrink-0" />
              <div className="min-w-0 leading-tight">
                <p className="text-[28px] font-extrabold tracking-tight text-green-700">{t('app.name')}</p>
                <p className="text-[15px] font-medium text-slate-700">{t('app.subtitle')}</p>
              </div>
            </div>

            <h1 className="mt-10 text-[32px] font-extrabold leading-[1.15] tracking-tight text-slate-900 md:text-5xl">
              {t('land.heroA')}
              <br />
              <span className="text-green-600">{t('land.heroB')}</span>
              <br />
              {t('land.heroC')}
            </h1>
            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-slate-600">{t('land.heroText')}</p>

            <div className="mt-8 hidden max-w-sm flex-col gap-3 lg:flex">
              <Button size="lg" className="w-full" onClick={register}>
                {t('land.getStarted')} <ArrowRight className="size-5" />
              </Button>
              <Button size="lg" variant="ghost" className="w-full" onClick={login}>{t('auth.login')}</Button>
            </div>
          </div>

          {/* Picture fills the width on phones */}
          <div className="mt-4 flex flex-1 items-end bg-gradient-to-b from-transparent to-green-50/60 lg:mt-0 lg:bg-none">
            <WorkersScene className="w-full" />
          </div>

          {/* White rounded panel at the bottom: dots, Get Started, Login */}
          <div className="relative z-10 -mt-6 rounded-t-[32px] bg-white px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 lg:hidden">
            <div className="mb-5 flex justify-center gap-1.5" aria-hidden="true">
              <span className="h-1.5 w-7 rounded-full bg-green-600" />
              <span className="size-1.5 rounded-full bg-slate-300" />
              <span className="size-1.5 rounded-full bg-slate-300" />
            </div>
            <div className="mx-auto flex max-w-sm flex-col gap-1.5">
              <Button size="lg" className="w-full" onClick={register}>
                {t('land.getStarted')} <ArrowRight className="size-5" />
              </Button>
              <Button size="lg" variant="ghost" className="w-full text-slate-800" onClick={login}>{t('auth.login')}</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Everything below is for big screens only; on phones the welcome screen above is the whole page */}
      <div className="hidden lg:block">
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
    </div>
  )
}
