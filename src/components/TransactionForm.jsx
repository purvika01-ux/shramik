import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import { Button, Field, Input, Select } from './ui'
import { useData } from '../context/DataContext'
import { useLang } from '../i18n/LanguageContext'
import { useToast } from './Toast'
import { useConfirm } from './ConfirmationDialog'
import { todayISO } from '../utils/dateUtils'
import { formatINR } from '../utils/currency'

export const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer']
const QUICK_AMOUNTS = [500, 1000, 2000, 5000]

/** One form for both Advance and Payment (type = 'advance' | 'payment'). */
export default function TransactionForm({ open, onClose, type, labourId: presetLabour }) {
  const { data, summaries, addTransaction, labourById } = useData()
  const { t } = useLang()
  const toast = useToast()
  const confirm = useConfirm()
  const isPayment = type === 'payment'
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({ labourId: presetLabour || '', amount: '', date: todayISO(), method: 'Cash', remarks: '' })
      setErrors({})
    }
  }, [open, presetLabour])

  // Active first, then inactive (they may still have dues)
  const options = useMemo(
    () => [...data.labourers].sort((a, b) => (a.status === b.status ? a.name.localeCompare(b.name) : a.status === 'active' ? -1 : 1)),
    [data.labourers],
  )

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const balance = form.labourId ? summaries[form.labourId]?.balance ?? 0 : null

  const submit = async (ev) => {
    ev?.preventDefault()
    const e = {}
    const amount = Number(form.amount)
    if (!form.labourId) e.labourId = t('tx.err.labour')
    if (!form.amount) e.amount = t('tx.err.amount')
    else if (!Number.isFinite(amount) || amount <= 0) e.amount = t('tx.err.amountPos')
    else if (amount > 1000000) e.amount = t('tx.err.amountHigh')
    else if (Math.round(amount * 100) !== amount * 100) e.amount = t('tx.err.decimal')
    if (!form.date) e.date = t('tx.err.date')
    else if (form.date > todayISO()) e.date = t('tx.err.future')
    setErrors(e)
    if (Object.keys(e).length) {
      toast.error(t('common.fixErrors'))
      return
    }
    const name = labourById[form.labourId].name
    if (isPayment && amount > balance) {
      const ok = await confirm({
        title: t('tx.overTitle'),
        message: t('tx.overMsg', { name, bal: formatINR(balance), amt: formatINR(amount) }),
        confirmText: t('tx.overYes'),
      })
      if (!ok) return
    }
    setSaving(true)
    const ok = await addTransaction({ ...form, type, amount })
    setSaving(false)
    if (!ok) return
    toast.success(t(isPayment ? 'tx.savedPayment' : 'tx.savedAdvance', { amt: formatINR(amount), name }))
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t(isPayment ? 'tx.addPayment' : 'tx.addAdvance')}
      footer={
        <>
          <Button variant="secondary" size="lg" className="flex-1 px-3" onClick={onClose}>{t('common.cancel')}</Button>
          <Button size="lg" variant={isPayment ? 'primary' : 'warning'} className="flex-[1.4] px-3" onClick={submit} disabled={saving}>
            {t(isPayment ? 'tx.savePayment' : 'tx.saveAdvance')}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label={t('tx.labour')} required error={errors.labourId}>
          <Select value={form.labourId || ''} onChange={set('labourId')} error={errors.labourId}>
            <option value="">{t('tx.choose')}</option>
            {options.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.id}){l.status === 'inactive' ? ` – ${t('common.inactive')}` : ''}
              </option>
            ))}
          </Select>
        </Field>
        {balance !== null && (
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-600">{t('tx.balanceNow')}</span>
            <b className={balance < 0 ? 'text-red-600' : 'text-slate-900'}>
              {balance < 0 ? t('money.extra', { amt: formatINR(-balance) }) : formatINR(balance)}
            </b>
          </div>
        )}
        <Field label={t('tx.amount')} required error={errors.amount}>
          <Input type="number" inputMode="decimal" min="1" value={form.amount || ''} onChange={set('amount')} placeholder="0" error={errors.amount} className="text-lg font-semibold" />
        </Field>
        {/* Quick amounts = less typing */}
        <div className="-mt-1 space-y-2">
          {isPayment && balance > 0 && (
            <button type="button" onClick={() => setForm((f) => ({ ...f, amount: String(balance) }))} className="h-11 w-full rounded-xl border border-green-200 bg-green-50 px-3 text-sm font-semibold text-green-700 hover:bg-green-100">
              {t('tx.payFull', { amt: formatINR(balance) })}
            </button>
          )}
          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setForm((f) => ({ ...f, amount: String(a) }))}
                className={`h-11 rounded-xl text-sm font-semibold ${Number(form.amount) === a ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {formatINR(a)}
              </button>
            ))}
          </div>
        </div>
        <Field label={t('tx.date')} required error={errors.date}>
          <Input type="date" value={form.date || ''} max={todayISO()} onChange={set('date')} error={errors.date} />
        </Field>
        {isPayment && (
          <Field label={t('tx.method')} required>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, method: m }))}
                  className={`h-12 rounded-xl border-2 text-sm font-semibold ${
                    form.method === m ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {t(`method.${m}`)}
                </button>
              ))}
            </div>
          </Field>
        )}
        <Field label={t('tx.remarks')} hint={t('common.optional')}>
          <Input value={form.remarks || ''} onChange={set('remarks')} maxLength={100} />
        </Field>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}

export function AdvanceForm(props) {
  return <TransactionForm {...props} type="advance" />
}

export function PaymentForm(props) {
  return <TransactionForm {...props} type="payment" />
}
