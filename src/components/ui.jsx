// Small shared UI building blocks
import { useState } from 'react'
import { Eye, EyeOff, Search, X } from 'lucide-react'
import { formatINR } from '../utils/currency'
import { useLang } from '../i18n/LanguageContext'
import { describeEntry } from '../utils/calculations'

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold leading-tight transition-colors active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none'
const BTN_VARIANTS = {
  primary: 'bg-green-600 text-white shadow-sm shadow-green-700/20 hover:bg-green-700',
  warning: 'bg-amber-500 text-white hover:bg-amber-600',
  dark: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  dangerOutline: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
  outline: 'bg-white text-slate-800 border-2 border-slate-700 hover:bg-slate-50',
  greenOutline: 'bg-white text-green-700 border-2 border-green-600 hover:bg-green-50',
}
const BTN_SIZES = {
  sm: 'h-10 px-3.5 text-sm',
  md: 'h-12 px-4 text-[15px]',
  lg: 'h-14 px-5 text-[17px]',
}

export function Button({ variant = 'primary', size = 'md', className = '', icon: Icon, children, ...props }) {
  if (size === 'tile') {
    // Big square-ish action: icon on top, label below (never squeezes text onto 2 lines)
    return (
      <button type="button" className={`${BTN_BASE} ${BTN_VARIANTS[variant]} min-h-[80px] flex-col gap-1.5 rounded-2xl px-2 py-3 text-[15px] ${className}`} {...props}>
        {Icon && <Icon className="size-6" strokeWidth={2.25} />}
        <span className="max-w-full truncate">{children}</span>
      </button>
    )
  }
  return (
    <button type="button" className={`${BTN_BASE} ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${className}`} {...props}>
      {Icon && <Icon className={size === 'lg' ? 'size-5' : 'size-4'} strokeWidth={2.25} />}
      {children}
    </button>
  )
}

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/70 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {/* On phones the top bar already shows the page name */}
        <h1 className="hidden text-2xl font-bold tracking-tight text-slate-900 md:block md:text-[28px]">{title}</h1>
        {subtitle && <p className="text-[15px] text-slate-500 md:mt-1 md:text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Field({ label, error, hint, children, required }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-sm text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  )
}

const INPUT =
  'w-full h-[52px] rounded-xl border bg-white px-3.5 text-base text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-green-500/30'

/** icon: optional lucide icon shown inside the box on the left */
export function Input({ error, className = '', icon: Icon, ...props }) {
  const input = <input className={`${INPUT} ${error ? 'border-red-400' : 'border-slate-300 focus:border-green-600'} ${Icon ? 'pl-12' : ''} ${className}`} {...props} />
  if (!Icon) return input
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-500" />
      {input}
    </div>
  )
}

/** Password box with an eye button to show / hide what was typed */
export function PasswordInput({ className = '', ...props }) {
  const { t } = useLang()
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye
  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className={`pr-12 ${className}`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-slate-500 hover:text-slate-800"
        aria-label={t(visible ? 'auth.hidePassword' : 'auth.showPassword')}
        title={t(visible ? 'auth.hidePassword' : 'auth.showPassword')}
      >
        <Icon className="size-5" />
      </button>
    </div>
  )
}

export function Select({ error, className = '', children, ...props }) {
  return (
    <select className={`${INPUT} ${error ? 'border-red-400' : 'border-slate-300 focus:border-green-600'} ${className}`} {...props}>
      {children}
    </select>
  )
}

export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${INPUT} border-slate-300 pl-11 pr-10 focus:border-green-600`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

const BADGE = {
  green: 'bg-green-50 text-green-700 ring-green-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
}

export function Badge({ color = 'slate', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${BADGE[color]} ${className}`}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const { t } = useLang()
  return status === 'active' ? <Badge color="green">{t('common.active')}</Badge> : <Badge color="red">{t('common.inactive')}</Badge>
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {Icon && (
        <div className="mb-3 grid size-14 place-items-center rounded-2xl bg-green-50 text-green-600">
          <Icon className="size-7" />
        </div>
      )}
      <p className="text-base font-semibold text-slate-800">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Shows a money value; negative balance = labourer has taken more than earned */
export function BalanceText({ value, className = '' }) {
  const { t } = useLang()
  const color = value > 0 ? 'text-slate-900' : value < 0 ? 'text-red-600' : 'text-green-700'
  return <span className={`${color} ${className}`}>{value < 0 ? t('money.extra', { amt: formatINR(-value) }) : formatINR(value)}</span>
}

/** Colour per attendance type: Full = green, Half = yellow, By hours = blue, Absent = red */
export const DAY_COLORS = {
  P: 'bg-green-50 text-green-800 ring-green-600/25',
  H: 'bg-yellow-50 text-yellow-900 ring-yellow-500/40',
  T: 'bg-blue-50 text-blue-800 ring-blue-600/25',
  A: 'bg-red-50 text-red-700 ring-red-600/25',
}

/** One day's entry in words, e.g. "Full Day + 3 hrs", "Half Day", "3 hrs", "Absent" */
export function DayBadge({ entry, className = '' }) {
  const { t } = useLang()
  if (!entry) return null
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${DAY_COLORS[entry.status]} ${className}`}>
      {describeEntry(entry, t)}
    </span>
  )
}

export function Avatar({ name, className = '' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
  return (
    // Default colours unless the caller passes its own bg-/text- colour
    <div className={`grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold ${/bg-/.test(className) ? '' : 'bg-green-50 text-green-800'} ${className}`}>
      {initials}
    </div>
  )
}
