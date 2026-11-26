import { ArrowLeft, Settings } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { LANGUAGES } from '../i18n/translations'

/** EN | हि | ਪੰ – one tap to switch language */
export function LanguageSwitch({ compact = false }) {
  const { lang, setLang } = useLang()
  return (
    <div className="flex rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label="Language / भाषा / ਭਾਸ਼ਾ">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          role="radio"
          aria-checked={lang === l.code}
          title={l.label}
          onClick={() => setLang(l.code)}
          className={`flex-1 rounded-lg font-bold transition-colors ${compact ? 'h-9 min-w-9 px-1.5 text-sm' : 'h-10 text-sm'} ${
            lang === l.code ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500'
          }`}
        >
          {compact ? l.short : l.label}
        </button>
      ))}
    </div>
  )
}

/** Phone top bar for inner pages:  ←   Page name   ⚙  (Home has its own green header) */
export default function Header({ title, onBack, onOpenSettings }) {
  const { t } = useLang()
  return (
    <header className="sticky top-0 z-30 flex items-center gap-1 border-b border-slate-100 bg-white/95 px-2 py-2 backdrop-blur md:hidden print:hidden">
      <button type="button" onClick={onBack} className="grid size-12 shrink-0 place-items-center rounded-xl text-slate-800 active:bg-slate-100" aria-label={t('common.back')}>
        <ArrowLeft className="size-6" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-center text-lg font-bold text-slate-900">{title}</h1>
      <button
        type="button"
        onClick={onOpenSettings}
        className="grid size-12 shrink-0 place-items-center rounded-xl text-slate-700 active:bg-slate-100"
        aria-label={t('set.title')}
      >
        <Settings className="size-6" />
      </button>
    </header>
  )
}
