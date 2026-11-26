import { useState } from 'react'
import { ArrowLeft, LogIn, UserPlus } from 'lucide-react'
import { Brand } from '../components/Sidebar'
import { LanguageSwitch } from '../components/Header'
import { Button, Card, Field, Input, PasswordInput } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import { errorMessage } from '../api/axios'

/**
 * Login and Register on one page (contractors can register; admin only logs in)
 * mode: 'login' | 'register'   goTo: switches between 'home', 'login' and 'register'
 */
export default function AuthPage({ mode, goTo }) {
  const { login, register } = useAuth()
  const { t } = useLang()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isRegister = mode === 'register'

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const switchMode = () => {
    goTo(isRegister ? 'login' : 'register')
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (isRegister && !form.name.trim()) return setError(t('auth.err.name'))
    if (!form.email.trim() || !form.password) return setError(t('auth.err.required'))
    if (isRegister && form.password.length < 6) return setError(t('auth.err.password'))

    setLoading(true)
    try {
      if (isRegister) await register(form.name.trim(), form.email.trim(), form.password)
      else await login(form.email.trim(), form.password)
    } catch (err) {
      setError(errorMessage(err))
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <button type="button" onClick={() => goTo('home')} className="mb-4 inline-flex h-10 items-center gap-2 pr-3 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="size-4" /> {t('land.backHome')}
        </button>
        <div className="mb-6 flex items-center justify-between gap-3">
          <Brand />
          <LanguageSwitch compact />
        </div>

        <Card className="p-5">
          <h1 className="text-xl font-bold text-slate-900">{t(isRegister ? 'auth.registerTitle' : 'auth.loginTitle')}</h1>
          <p className="mb-5 mt-1 text-sm text-slate-500">{t(isRegister ? 'auth.registerHint' : 'auth.loginHint')}</p>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {isRegister && (
              <Field label={t('auth.name')} required>
                <Input value={form.name} onChange={set('name')} autoComplete="name" />
              </Field>
            )}
            <Field label={t('auth.email')} required>
              <Input type="email" value={form.email} onChange={set('email')} autoComplete="email" />
            </Field>
            <Field label={t('auth.password')} required>
              <PasswordInput value={form.password} onChange={set('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} />
            </Field>

            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}

            <Button type="submit" size="lg" className="w-full" icon={isRegister ? UserPlus : LogIn} disabled={loading}>
              {loading ? t('auth.wait') : t(isRegister ? 'auth.register' : 'auth.login')}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-sm text-slate-600">
          {t(isRegister ? 'auth.haveAccount' : 'auth.noAccount')}{' '}
          <button type="button" onClick={switchMode} className="font-semibold text-green-700 hover:underline">
            {t(isRegister ? 'auth.login' : 'auth.register')}
          </button>
        </p>
      </div>
    </div>
  )
}
