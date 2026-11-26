import { memo } from 'react'
import { Minus, Plus } from 'lucide-react'
import { formatINR } from '../utils/currency'
import { hourlyRate, recordWage } from '../utils/calculations'
import { Avatar } from './ui'

/** − [ 3 ] +  : big touch-friendly number picker (steps of 1, half hours can be typed) */
export function Stepper({ value, onChange, min = 0, max = 24, label, t }) {
  const set = (v) => {
    const n = Math.round(Math.min(max, Math.max(min, Number(v) || 0)) * 2) / 2
    onChange(n)
  }
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button type="button" onClick={() => set(value - 1)} disabled={value <= min} className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white text-slate-700 active:bg-slate-100 disabled:opacity-35" aria-label={t('att.less')}>
        <Minus className="size-5" />
      </button>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step="0.5"
        value={value}
        onFocus={(e) => e.target.select()}
        onChange={(e) => set(e.target.value)}
        className="h-11 w-16 rounded-xl border border-slate-300 bg-white text-center text-lg font-bold text-slate-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-500/30"
        aria-label={label}
      />
      <button type="button" onClick={() => set(value + 1)} disabled={value >= max} className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white text-slate-700 active:bg-slate-100 disabled:opacity-35" aria-label={t('att.more')}>
        <Plus className="size-5" />
      </button>
    </div>
  )
}

const TYPES = [
  { value: 'P', key: 'type.full', on: 'border-green-600 bg-green-600 text-white' },
  { value: 'H', key: 'type.half', on: 'border-yellow-400 bg-yellow-400 text-yellow-950' },
  { value: 'T', key: 'type.hours', on: 'border-blue-600 bg-blue-600 text-white' },
]

/**
 * One labourer:
 *   Name                         ₹1,100
 *   ₹800/day · ₹100/hr           Earned
 *   [   Present   ][   Absent   ]
 *   (if Present) [Full Day][Half Day][By Hours]
 *                Extra hours  − 3 +   (+₹300)   or   Hours worked  − 3 +
 */
const Row = memo(function Row({ labour, index, entry, wage, hpd, onChange, t }) {
  const status = entry?.status
  const isPresent = status === 'P' || status === 'H' || status === 'T'
  const rate = hourlyRate(wage, hpd)
  const earned = entry ? recordWage({ ...entry, wage, hpd }) : 0
  const id = labour.id

  return (
    <li className="px-4 py-4">
      <div className="flex items-start gap-3">
        <Avatar name={labour.name} className={`size-10 text-xs ${status === 'A' ? 'bg-red-50 text-red-700' : isPresent ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-bold text-slate-900">{labour.name}</p>
          <p className="mt-0.5 text-[13px] text-slate-500">
            <span className="whitespace-nowrap">{formatINR(wage)}{t('common.perDay')}</span>
            {' · '}
            <span className="whitespace-nowrap">{t('att.perHour', { rate: formatINR(rate) })}</span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`whitespace-nowrap text-[17px] font-bold ${status === 'A' ? 'text-red-600' : 'text-slate-900'}`}>{entry ? formatINR(earned) : '—'}</p>
          <p className="text-[11px] text-slate-500">{t('att.dayTotal')}</p>
        </div>
      </div>

      {/* Present / Absent */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:pl-[52px]" role="radiogroup" aria-label={labour.name}>
        <button
          type="button"
          role="radio"
          aria-checked={isPresent}
          onClick={() => onChange(id, isPresent ? null : { status: 'P' })}
          className={`h-14 rounded-xl border-2 text-[16px] font-bold transition-colors ${isPresent ? 'border-green-600 bg-green-600 text-white' : 'border-slate-200 bg-white text-slate-700 active:bg-green-50'}`}
        >
          {t('att.present')}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={status === 'A'}
          onClick={() => onChange(id, status === 'A' ? null : { status: 'A' })}
          className={`h-14 rounded-xl border-2 text-[16px] font-bold transition-colors ${status === 'A' ? 'border-red-600 bg-red-600 text-white' : 'border-slate-200 bg-white text-slate-700 active:bg-red-50'}`}
        >
          {t('att.absent')}
        </button>
      </div>

      {/* Present → Full Day / Half Day / By Hours */}
      {isPresent && (
        <div className="mt-3 rounded-2xl bg-slate-50 p-3 sm:ml-[52px]">
          <div className="grid grid-cols-3 gap-2" role="radiogroup">
            {TYPES.map((o) => {
              const on = status === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() =>
                    onChange(id, o.value === 'P' ? { status: 'P', extraHours: entry.extraHours || 0 } : o.value === 'T' ? { status: 'T', hours: entry.hours || Math.min(4, hpd) } : { status: 'H' })
                  }
                  className={`min-h-12 rounded-xl border-2 px-1 text-sm font-bold leading-tight ${on ? o.on : 'border-slate-200 bg-white text-slate-700'}`}
                >
                  {t(o.key)}
                </button>
              )
            })}
          </div>

          {status === 'P' && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-700">{t('att.extraHours')}</p>
                {entry.extraHours > 0 && <p className="text-xs font-semibold text-green-700">+{formatINR(entry.extraHours * rate)}</p>}
              </div>
              <Stepper value={entry.extraHours || 0} min={0} max={16} label={t('att.extraHours')} t={t} onChange={(v) => onChange(id, { status: 'P', extraHours: v })} />
            </div>
          )}

          {status === 'T' && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <p className="min-w-0 text-sm font-semibold text-slate-700">{t('att.hoursWorked')}</p>
              <Stepper value={entry.hours || 0} min={0} max={24} label={t('att.hoursWorked')} t={t} onChange={(v) => onChange(id, { status: 'T', hours: v })} />
            </div>
          )}
        </div>
      )}
    </li>
  )
})

/** wageInfo[id] = { wage, hpd } – stored values for saved entries, current values for new ones */
export default function AttendanceList({ labourers, draft, wageInfo, onChange, t }) {
  return (
    <ul className="divide-y divide-slate-100">
      {labourers.map((l, i) => (
        <Row key={l.id} labour={l} index={i} entry={draft[l.id]} wage={wageInfo[l.id].wage} hpd={wageInfo[l.id].hpd} onChange={onChange} t={t} />
      ))}
    </ul>
  )
}
