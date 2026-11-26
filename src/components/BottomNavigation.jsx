import { NAV_ITEMS } from './navItems'
import { useLang } from '../i18n/LanguageContext'

export default function BottomNavigation({ current, onNavigate }) {
  const { t } = useLang()
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white md:hidden print:hidden">
      <div className="grid grid-cols-5">
        {NAV_ITEMS.map(({ page, key, icon: Icon }) => {
          const active = current === page
          return (
            <button
              key={page}
              type="button"
              onClick={() => onNavigate(`/${page}`)}
              aria-current={active ? 'page' : undefined}
              className={`flex h-[68px] min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-[11px] font-semibold leading-[1.15] ${
                active ? 'text-green-700' : 'text-slate-500'
              }`}
            >
              <span className={`grid h-8 w-14 place-items-center rounded-full ${active ? 'bg-green-100' : ''}`}>
                <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className="line-clamp-2 max-w-full break-words text-center">{t(key)}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
