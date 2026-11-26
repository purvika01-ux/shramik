import { useEffect, useState } from 'react'
import Modal from './Modal'
import { Button, Field, Input } from './ui'
import { useData } from '../context/DataContext'
import { useLang } from '../i18n/LanguageContext'
import { useToast } from './Toast'

const EMPTY = { name: '', mobile: '', dailyWage: '', status: 'active' }

/** Add / Edit labourer. Pass `labour` to edit. */
export default function LabourForm({ open, onClose, labour, onSaved }) {
  const { data, addLabour, updateLabour } = useData()
  const { t } = useLang()
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const isEdit = !!labour

  useEffect(() => {
    if (open) {
      setForm(labour ? { name: labour.name, mobile: labour.mobile, dailyWage: String(labour.dailyWage), status: labour.status } : EMPTY)
      setErrors({})
    }
  }, [open, labour])

  const validate = () => {
    const e = {}
    const name = form.name.trim()
    if (!name) e.name = t('lab.err.name')
    else if (name.length < 2) e.name = t('lab.err.nameShort')
    else if (!/^[\p{L}\p{M} .'-]+$/u.test(name)) e.name = t('lab.err.nameLetters')

    const mobile = form.mobile.trim()
    if (mobile) {
      if (!/^[6-9]\d{9}$/.test(mobile)) e.mobile = t('lab.err.mobile')
      else if (data.labourers.some((l) => l.mobile === mobile && l.id !== labour?.id)) e.mobile = t('lab.err.mobileDup')
    }

    const wage = Number(form.dailyWage)
    if (!form.dailyWage) e.dailyWage = t('lab.err.wage')
    else if (!Number.isFinite(wage) || wage <= 0) e.dailyWage = t('lab.err.wagePos')
    else if (wage > 10000) e.dailyWage = t('lab.err.wageHigh')
    return e
  }

  const [saving, setSaving] = useState(false)

  const submit = async (ev) => {
    ev?.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) {
      toast.error(t('common.fixErrors'))
      return
    }
    setSaving(true)
    if (isEdit) {
      const ok = await updateLabour(labour.id, form)
      setSaving(false)
      if (!ok) return
      toast.success(t('lab.updated', { name: form.name.trim() }))
      onSaved?.(labour)
    } else {
      const created = await addLabour(form)
      setSaving(false)
      if (!created) return
      toast.success(t('lab.added', { name: created.name, id: created.id }))
      onSaved?.(created)
    }
    onClose()
  }

  const wageChanged = isEdit && form.dailyWage !== '' && Number(form.dailyWage) !== labour.dailyWage

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('lab.edit', { name: labour.name }) : t('lab.addNew')}
      footer={
        <>
          <Button variant="secondary" size="lg" className="flex-1 px-3" onClick={onClose}>{t('common.cancel')}</Button>
          <Button size="lg" className="flex-[1.4] px-3" onClick={submit} disabled={saving}>{isEdit ? t('lab.saveChanges') : t('lab.add')}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {isEdit && (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {t('lab.id')}: <b className="text-slate-900">{labour.id}</b>
          </p>
        )}
        <Field label={t('lab.name')} required error={errors.name}>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t('lab.namePh')} error={errors.name} autoFocus maxLength={60} />
        </Field>
        <Field label={t('lab.mobile')} error={errors.mobile} hint={t('lab.mobileHint')}>
          <Input
            type="tel"
            value={form.mobile}
            onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
            placeholder="98XXXXXXXX"
            inputMode="numeric"
            error={errors.mobile}
          />
        </Field>
        <Field label={t('lab.wage')} required error={errors.dailyWage} hint={wageChanged ? t('lab.wageNote') : undefined}>
          <Input type="number" inputMode="numeric" min="1" value={form.dailyWage} onChange={(e) => setForm((f) => ({ ...f, dailyWage: e.target.value }))} placeholder={t('lab.wagePh')} error={errors.dailyWage} />
        </Field>
        <Field label={t('lab.status')}>
          <div className="grid grid-cols-2 gap-2">
            {['active', 'inactive'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm((f) => ({ ...f, status: s }))}
                className={`min-h-12 rounded-xl border-2 px-2 text-sm font-semibold ${
                  form.status === s ? 'border-green-600 bg-green-50 text-green-800' : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {t(s === 'active' ? 'lab.statusActive' : 'lab.statusInactive')}
              </button>
            ))}
          </div>
        </Field>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
