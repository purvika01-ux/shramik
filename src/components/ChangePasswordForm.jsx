import { useEffect, useState } from 'react'
import Modal from './Modal'
import { Button, Field, PasswordInput } from './ui'
import { useLang } from '../i18n/LanguageContext'
import { useToast } from './Toast'
import api, { errorMessage } from '../api/axios'

const EMPTY = { current: '', next: '', confirm: '' }

/** Change password for the logged-in user (admin or contractor) */
export default function ChangePasswordForm({ open, onClose }) {
  const { t } = useLang()
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setError('')
    }
  }, [open])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e?.preventDefault()
    if (!form.current || !form.next) return setError(t('pw.err.required'))
    if (form.next.length < 6) return setError(t('auth.err.password'))
    if (form.next !== form.confirm) return setError(t('pw.err.match'))

    setSaving(true)
    setError('')
    try {
      await api.put('/auth/password', { currentPassword: form.current, newPassword: form.next })
      toast.success(t('pw.changed'))
      onClose()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('pw.title')}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>{t('common.cancel')}</Button>
          <Button size="lg" className="flex-1" onClick={submit} disabled={saving}>{saving ? t('auth.wait') : t('pw.save')}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label={t('pw.current')} required>
          <PasswordInput value={form.current} onChange={set('current')} autoComplete="current-password" />
        </Field>
        <Field label={t('pw.new')} required hint={t('auth.err.password')}>
          <PasswordInput value={form.next} onChange={set('next')} autoComplete="new-password" />
        </Field>
        <Field label={t('pw.confirm')} required>
          <PasswordInput value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
        </Field>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
        {/* lets Enter submit the form */}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
