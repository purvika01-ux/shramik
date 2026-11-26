import { Trash2, Receipt } from 'lucide-react'
import { Badge, EmptyState } from './ui'
import { useLang } from '../i18n/LanguageContext'
import { formatINR } from '../utils/currency'
import { formatDate } from '../utils/dateUtils'

/** Advance/payment history as a simple card list (same on phone and desktop). */
export default function TransactionList({ txns, labourById, showName = true, onDelete }) {
  const { t } = useLang()
  if (!txns.length) return <EmptyState icon={Receipt} title={t('tx.none')} message={t('tx.noneMsg')} />

  return (
    <ul className="divide-y divide-slate-100">
      {txns.map((x) => (
        <li key={x.id} className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={x.type} />
              <span className="text-sm text-slate-500">{formatDate(x.date)}</span>
            </div>
            {showName && <p className="mt-1 truncate text-[15px] font-semibold text-slate-900">{labourById[x.labourId]?.name || x.labourId}</p>}
            {(x.method || x.remarks) && (
              <p className="mt-0.5 break-words text-sm text-slate-500">{[x.method && t(`method.${x.method}`), x.remarks].filter(Boolean).join(' · ')}</p>
            )}
          </div>
          <span className={`shrink-0 whitespace-nowrap text-base font-bold ${x.type === 'advance' ? 'text-amber-700' : 'text-slate-900'}`}>{formatINR(x.amount)}</span>
          {onDelete && (
            <button type="button" onClick={() => onDelete(x)} className="grid size-10 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={t('common.delete')}>
              <Trash2 className="size-4" />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

export function TypeBadge({ type }) {
  const { t } = useLang()
  if (type === 'wages') return <Badge color="blue">{t('type.wages')}</Badge>
  return type === 'advance' ? <Badge color="amber">{t('type.advance')}</Badge> : <Badge color="green">{t('type.payment')}</Badge>
}
