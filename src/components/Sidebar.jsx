import { HardHat, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { NAV_ITEMS } from './navItems'
import { useLang } from '../i18n/LanguageContext'
import { LanguageSwitch } from './Header'

/** compact = phone top bar: smaller icon, no subtitle, name may wrap to 2 lines instead of being cut off */
export function Brand({ compact = false }) {
  const { t } = useLang()
  return (
    <div className={`flex min-w-0 items-center ${compact ? 'gap-2' : 'gap-3'}`}>
      <div className={`grid shrink-0 place-items-center rounded-xl bg-green-600 text-white ${compact ? 'size-9 max-[350px]:hidden' : 'size-10'}`}>
        <HardHat className="size-5" strokeWidth={2.25} />
      </div>
      {compact ? (
        <p className="line-clamp-2 min-w-0 text-[15px] font-bold leading-tight text-slate-900">{t('app.name')}</p>
      ) : (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-base font-bold text-slate-900">{t('app.name')}</p>
          <p className="truncate text-xs text-slate-500">{t('app.subtitle')}</p>
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ current, onNavigate, onOpenSettings }) {
  const { t } = useLang()
  const { user, logout } = useAuth()
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex print:hidden">
      <div className="px-2">
        <Brand />
      </div>
      <nav className="mt-8 flex flex-col gap-1">
        {NAV_ITEMS.map(({ page, key, icon: Icon }) => {
          const active = current === page
          return (
            <button
              key={page}
              type="button"
              onClick={() => onNavigate(`/${page}`)}
              className={`flex h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition-colors ${
                active ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
              {t(key)}
            </button>
          )
        })}
      </nav>
      <div className="mt-auto space-y-3">
        <LanguageSwitch />
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Settings className="size-5" /> {t('set.title')}
        </button>
        <div className="flex items-center gap-2 border-t border-slate-200 pt-3">
          <p className="min-w-0 flex-1 break-words px-1 text-sm font-semibold leading-tight text-slate-700" title={user.email}>
            {user.name} {t('auth.roleContractor')}
          </p>
          <button type="button" onClick={logout} className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-600 hover:bg-red-50">
            <LogOut className="size-4" /> {t('auth.logout')}
          </button>
        </div>
      </div>
    </aside>
  )
}
