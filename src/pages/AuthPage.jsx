import { useState } from 'react'
import { ArrowLeft, CheckCircle2, Lock, Mail, MailCheck, Phone, User, UserPlus } from 'lucide-react'
import { WorkerLogo, Skyline } from '../components/Illustrations'
import { LanguageSwitch } from '../components/Header'
import { Button, Input, PasswordInput } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import api, { errorMessage } from '../api/axios'

const MOBILE_RE = /^[6-9]\d{9}$/

/** Same frame for every login-related screen: ← back, language, logo, title … city drawing at the bottom */
function AuthLayout({ onBack, title, subtitle, children }) {
  const { t } = useLang()
  return (
    <div className="flex min-h-[100svh] flex-col bg-gradient-to-b from-white to-green-50/60">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 pt-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="-ml-2 grid size-12 place-items-center rounded-xl text-slate-800 hover:bg-slate-100"
            aria-label={t('common.back')}
            title={t('common.back')}
          >
            <ArrowLeft className="size-6" />
          </button>
          <LanguageSwitch compact />
        </div>

        <div className="mt-2 flex flex-col items-center text-center">
          <WorkerLogo className="size-16" />
          <p className="mt-1 text-[28px] font-extrabold leading-tight tracking-tight text-green-700">{t('app.name')}</p>
          <p className="text-sm font-medium text-slate-600">{t('app.subtitle')}</p>
        </div>

        <h1 className="mt-8 text-[28px] font-extrabold leading-tight tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-base text-slate-600">{subtitle}</p>

        {children}
      </div>

      <Skyline className="mt-8 h-24 opacity-90" />
    </div>
  )
}

function ErrorText({ children }) {
  if (!children) return null
  return (
    <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-[15px] text-red-700" role="alert">
      {children}
    </p>
  )
}

/**
 * Login and Register (contractors can register; admin only logs in)
 * mode: 'login' | 'register'   goTo: 'home' | 'login' | 'register' | 'forgot-password'
 */
export default function AuthPage({ mode, goTo }) {
  const { login, register } = useAuth()
  const { t } = useLang()
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isRegister = mode === 'register'

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  // Mobile box: digits only, at most 10
  const setMobile = (e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))

  const switchMode = () => {
    goTo(isRegister ? 'login' : 'register')
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (isRegister && !form.name.trim()) return setError(t('auth.err.name'))
    if (!form.email.trim()) return setError(t('auth.err.required'))
    if (isRegister && !MOBILE_RE.test(form.mobile)) return setError(t('auth.err.mobile'))
    if (!form.password) return setError(t('auth.err.required'))
    if (isRegister && form.password.length < 6) return setError(t('auth.err.password'))

    setLoading(true)
    try {
      if (isRegister) await register(form.name.trim(), form.email.trim(), form.mobile, form.password)
      else await login(form.email.trim(), form.password, remember)
    } catch (err) {
      setError(errorMessage(err))
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      onBack={() => goTo('home')}
      title={t(isRegister ? 'auth.createTitle' : 'auth.welcome')}
      subtitle={t(isRegister ? 'auth.registerAs' : 'auth.loginContinue')}
    >
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {isRegister && (
          <Input icon={User} value={form.name} onChange={set('name')} autoComplete="name" placeholder={t('auth.fullName')} aria-label={t('auth.fullName')} />
        )}
        <Input icon={Mail} type="email" inputMode="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder={t('auth.emailAddress')} aria-label={t('auth.emailAddress')} />
        {isRegister && (
          <Input
            icon={Phone}
            type="tel"
            inputMode="numeric"
            value={form.mobile}
            onChange={setMobile}
            autoComplete="tel-national"
            placeholder={t('auth.mobile')}
            aria-label={t('auth.mobile')}
          />
        )}
        <PasswordInput
          icon={Lock}
          value={form.password}
          onChange={set('password')}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          placeholder={t('auth.password')}
          aria-label={t('auth.password')}
        />

        {!isRegister && (
          <div className="flex items-center justify-between gap-2">
            <label className="-ml-1 flex h-11 cursor-pointer items-center gap-2.5 px-1 text-[15px] text-slate-700">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-5 accent-green-600" />
              {t('auth.remember')}
            </label>
            <button type="button" onClick={() => goTo('forgot-password')} className="-mr-1 h-11 px-1 text-[15px] font-semibold text-green-700 hover:underline">
              {t('auth.forgot')}
            </button>
          </div>
        )}

        <ErrorText>{error}</ErrorText>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? t('auth.wait') : t(isRegister ? 'auth.register' : 'auth.login')}
        </Button>
      </form>

      {isRegister ? (
        <p className="mt-5 text-center text-[15px] text-slate-700">
          {t('auth.haveAccount')}{' '}
          <button type="button" onClick={switchMode} className="inline-flex h-10 items-center font-bold text-green-700 hover:underline">
            {t('auth.login')}
          </button>
        </p>
      ) : (
        <>
          <div className="my-5 flex items-center gap-3 text-sm text-slate-500">
            <span className="h-px flex-1 bg-slate-300" /> {t('common.or')} <span className="h-px flex-1 bg-slate-300" />
          </div>
          <Button size="lg" variant="outline" className="w-full" icon={UserPlus} onClick={switchMode}>
            {t('auth.createNew')}
          </Button>
        </>
      )}
    </AuthLayout>
  )
}

/** Step 1: ask for the email and send a reset link */
export function ForgotPassword({ goTo }) {
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) return setError(t('fp.err.email'))
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim() })
      setSent(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout onBack={() => goTo('login')} title={t('fp.title')} subtitle={t('fp.hint')}>
      {sent ? (
        <div className="mt-6 space-y-5">
          <div className="flex gap-3 rounded-2xl bg-green-50 p-4 text-[15px] text-green-900 ring-1 ring-green-100" role="status">
            <MailCheck className="size-6 shrink-0 text-green-600" />
            <p>{t('fp.sent')}</p>
          </div>
          <Button size="lg" className="w-full" onClick={() => goTo('login')}>{t('fp.back')}</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <Input icon={Mail} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder={t('auth.emailAddress')} aria-label={t('auth.emailAddress')} />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? t('auth.wait') : t('fp.send')}
          </Button>
          <Button size="lg" variant="ghost" className="w-full text-green-800" onClick={() => goTo('login')}>{t('fp.back')}</Button>
        </form>
      )}
    </AuthLayout>
  )
}

/** Step 2: the link from the email opens this screen to set a new password */
export function ResetPassword({ token, goTo }) {
  const { t } = useLang()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) return setError(t('auth.err.password'))
    if (form.password !== form.confirm) return setError(t('pw.err.match'))
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password: form.password })
      setDone(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout onBack={() => goTo('login')} title={t('rp.title')} subtitle={t('rp.hint')}>
      {!token ? (
        <div className="mt-6 space-y-4">
          <ErrorText>{t('rp.invalid')}</ErrorText>
          <Button size="lg" className="w-full" onClick={() => goTo('forgot-password')}>{t('fp.send')}</Button>
        </div>
      ) : done ? (
        <div className="mt-6 space-y-5">
          <div className="flex gap-3 rounded-2xl bg-green-50 p-4 text-[15px] text-green-900 ring-1 ring-green-100" role="status">
            <CheckCircle2 className="size-6 shrink-0 text-green-600" />
            <p>{t('rp.done')}</p>
          </div>
          <Button size="lg" className="w-full" onClick={() => goTo('login')}>{t('auth.login')}</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <PasswordInput icon={Lock} value={form.password} onChange={set('password')} autoComplete="new-password" placeholder={t('rp.new')} aria-label={t('rp.new')} />
          <PasswordInput icon={Lock} value={form.confirm} onChange={set('confirm')} autoComplete="new-password" placeholder={t('rp.confirm')} aria-label={t('rp.confirm')} />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? t('auth.wait') : t('rp.save')}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
