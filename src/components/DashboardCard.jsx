const TONES = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-green-50 text-green-700',
  red: 'bg-red-50 text-red-600',
  amber: 'bg-amber-50 text-amber-700',
  navy: 'bg-slate-900 text-white',
}

/** Icon on top, then label, then the big number – nothing squeezed side by side */
export default function DashboardCard({ label, value, icon: Icon, tone = 'slate', hint, onClick, className = '' }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex min-w-0 flex-col items-start rounded-2xl border border-slate-200 bg-white p-4 text-left ${onClick ? 'hover:border-slate-300 active:bg-slate-50' : ''} ${className}`}
    >
      {Icon && (
        <span className={`mb-3 grid size-10 place-items-center rounded-xl ${TONES[tone]}`}>
          <Icon className="size-5" strokeWidth={2.25} />
        </span>
      )}
      <span className="text-sm font-medium leading-snug text-slate-500">{label}</span>
      <span className="money-fit mt-1 font-bold tracking-tight text-slate-900">{value}</span>
      {hint && <span className="mt-0.5 text-xs text-slate-500">{hint}</span>}
    </Tag>
  )
}
