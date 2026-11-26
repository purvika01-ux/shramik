import { useEffect, useMemo, useState } from 'react'
import { UserPlus, Users, ChevronRight } from 'lucide-react'
import LabourForm from '../components/LabourForm'
import LabourProfile from '../components/LabourProfile'
import { Avatar, Button, Card, EmptyState, PageHeader, SearchBox, StatusBadge } from '../components/ui'
import { useData } from '../context/DataContext'
import { useLang } from '../i18n/LanguageContext'
import { formatINR } from '../utils/currency'

const FILTERS = ['active', 'inactive', 'all']

export default function Labour({ route, navigate }) {
  if (route.id) return <LabourProfile labourId={route.id} navigate={navigate} />
  return <LabourList route={route} navigate={navigate} />
}

function LabourList({ route, navigate }) {
  const { data } = useData()
  const { t } = useLang()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('active')
  const [formOpen, setFormOpen] = useState(false)

  // "?add=1" opens the Add form directly
  useEffect(() => {
    if (route.query.add) {
      setFormOpen(true)
      navigate('/labour', null, { replace: true })
    }
  }, [route.query.add, navigate])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.labourers
      .filter((l) => filter === 'all' || l.status === filter)
      .filter((l) => !q || l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q) || l.mobile.includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data.labourers, query, filter])

  const count = (k) => (k === 'all' ? data.labourers.length : data.labourers.filter((l) => l.status === k).length)
  const filterLabel = { active: t('common.active'), inactive: t('common.inactive'), all: t('common.all') }

  return (
    <div>
      <PageHeader title={t('lab.title')} subtitle={t('lab.activeCount', { n: count('active') })} />
      <Button size="lg" icon={UserPlus} onClick={() => setFormOpen(true)} className="mb-4 w-full sm:w-auto">
        {t('lab.addNew')}
      </Button>

      <div className="mb-4 space-y-3">
        <SearchBox value={query} onChange={setQuery} placeholder={t('lab.search')} />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`h-10 rounded-full px-4 text-sm font-semibold ${filter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
            >
              {filterLabel[f]} ({count(f)})
            </button>
          ))}
        </div>
      </div>

      <Card>
        {data.labourers.length === 0 ? (
          <EmptyState icon={Users} title={t('lab.none')} message={t('lab.noneMsg')} action={<Button icon={UserPlus} onClick={() => setFormOpen(true)}>{t('lab.add')}</Button>} />
        ) : list.length === 0 ? (
          <EmptyState icon={Users} title={t('common.noMatch')} message={t('common.noMatchMsg')} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((l) => (
              <li key={l.id}>
                <button type="button" onClick={() => navigate(`/labour/${l.id}`)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 active:bg-slate-100">
                  <Avatar name={l.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold text-slate-900">{l.name}</p>
                    <p className="mt-0.5 flex flex-wrap gap-x-2 text-[13px] text-slate-500">
                      <span className="whitespace-nowrap">{l.id}</span>
                      <span className="whitespace-nowrap">{l.mobile || t('lab.noMobile')}</span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="whitespace-nowrap text-[15px] font-bold text-slate-900">
                      {formatINR(l.dailyWage)}
                      <span className="text-xs font-normal text-slate-500">{t('common.perDay')}</span>
                    </p>
                    {l.status === 'inactive' && <StatusBadge status={l.status} />}
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-slate-300" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <LabourForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
