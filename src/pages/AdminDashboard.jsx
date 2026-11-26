import { useEffect, useMemo, useState } from 'react'
import { Briefcase, HardHat, KeyRound, Loader2, LogOut, UserCheck, UserX, Users } from 'lucide-react'
import DashboardCard from '../components/DashboardCard'
import ChangePasswordForm from '../components/ChangePasswordForm'
import { Brand } from '../components/Sidebar'
import { LanguageSwitch } from '../components/Header'
import { Button, Card, EmptyState, PageHeader, StatusBadge } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmationDialog'
import api, { errorMessage } from '../api/axios'
import { formatDate } from '../utils/dateUtils'

/** Admin: see every registered contractor and activate / deactivate their account */
export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const { t } = useLang()
  const toast = useToast()
  const confirm = useConfirm()
  const [contractors, setContractors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [passwordOpen, setPasswordOpen] = useState(false)

  // Totals for the stat cards – worked out from the contractor list already loaded
  const stats = useMemo(() => {
    const active = contractors.filter((c) => c.isActive).length
    return {
      contractors: contractors.length,
      labourers: contractors.reduce((sum, c) => sum + (c.labourers || 0), 0),
      active,
      inactive: contractors.length - active,
    }
  }, [contractors])

  useEffect(() => {
    api
      .get('/admin/contractors')
      .then((res) => setContractors(res.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const toggle = async (c) => {
    const activate = !c.isActive
    const ok = await confirm({
      title: t(activate ? 'admin.activateTitle' : 'admin.deactivateTitle'),
      message: t(activate ? 'admin.activateMsg' : 'admin.deactivateMsg', { name: c.name }),
      confirmText: t(activate ? 'lab.activate' : 'lab.deactivate'),
      danger: !activate,
    })
    if (!ok) return
    try {
      await api.patch(`/admin/contractors/${c.id}/status`, { isActive: activate })
      setContractors((list) => list.map((x) => (x.id === c.id ? { ...x, isActive: activate } : x)))
      toast.success(t(activate ? 'admin.activated' : 'admin.deactivated', { name: c.name }))
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 md:px-8">
          <div className="min-w-0 flex-1">
            <Brand compact />
          </div>
          <LanguageSwitch compact />
          <Button variant="secondary" size="sm" icon={KeyRound} onClick={() => setPasswordOpen(true)} aria-label={t('pw.title')} title={t('pw.title')}>
            <span className="hidden sm:inline">{t('pw.title')}</span>
          </Button>
          <Button variant="secondary" size="sm" icon={LogOut} onClick={logout}>{t('auth.logout')}</Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <PageHeader title={t('admin.title')} subtitle={t('admin.subtitle', { name: user.name })} />

        {!loading && !error && (
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <DashboardCard label={t('admin.statContractors')} value={stats.contractors} icon={Briefcase} tone="navy" />
            <DashboardCard label={t('admin.statLabourers')} value={stats.labourers} icon={HardHat} tone="amber" />
            <DashboardCard label={t('admin.statActive')} value={stats.active} icon={UserCheck} tone="green" />
            <DashboardCard label={t('admin.statInactive')} value={stats.inactive} icon={UserX} tone="red" />
          </div>
        )}

        <Card>
          {loading ? (
            <div className="grid place-items-center p-10"><Loader2 className="size-7 animate-spin text-green-600" aria-label="Loading" /></div>
          ) : error ? (
            <p className="p-6 text-center text-sm text-red-600">{error}</p>
          ) : contractors.length === 0 ? (
            <EmptyState icon={Users} title={t('admin.none')} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {contractors.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold text-slate-900">
                      <span className="truncate">{c.name}</span>
                      <StatusBadge status={c.isActive ? 'active' : 'inactive'} />
                    </p>
                    <p className="truncate text-sm text-slate-500">{c.email}</p>
                    <p className="text-xs text-slate-500">
                      {t('admin.labourers', { n: c.labourers })} · {t('admin.joined', { date: formatDate(new Date(c.createdAt).toLocaleDateString('en-CA')) })}
                    </p>
                  </div>
                  <Button size="sm" variant={c.isActive ? 'dangerOutline' : 'primary'} onClick={() => toggle(c)}>
                    {t(c.isActive ? 'lab.deactivate' : 'lab.activate')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
      <ChangePasswordForm open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  )
}
