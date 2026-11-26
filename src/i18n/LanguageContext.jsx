import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LANGUAGES, TRANSLATIONS } from './translations'
import { parseISODate } from '../utils/dateUtils'

const LANG_KEY = 'sahil-contractor:lang'
const LanguageContext = createContext(null)

function initialLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (TRANSLATIONS[saved]) return saved
  } catch {
    /* ignore */
  }
  return 'en'
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLang)
  const locale = LANGUAGES.find((l) => l.code === lang).locale

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((code) => {
    if (!TRANSLATIONS[code]) return
    setLangState(code)
    try {
      localStorage.setItem(LANG_KEY, code)
    } catch {
      /* ignore */
    }
  }, [])

  const t = useCallback(
    (key, vars) => {
      let s = TRANSLATIONS[lang][key] ?? TRANSLATIONS.en[key] ?? key
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v)
      return s
    },
    [lang],
  )

  const value = useMemo(() => {
    const fmt = (iso, opts) => new Intl.DateTimeFormat(locale, opts).format(parseISODate(iso))
    return {
      lang,
      setLang,
      t,
      /** "Thursday" in the chosen language */
      dayName: (iso) => fmt(iso, { weekday: 'long' }),
      /** "5 November" in the chosen language */
      dayMonth: (iso) => fmt(iso, { day: 'numeric', month: 'long' }),
      /** "2026-11" -> "November 2026" in the chosen language */
      monthName: (mk) => fmt(`${mk}-01`, { month: 'long', year: 'numeric' }),
    }
  }, [lang, setLang, t, locale])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLang() {
  return useContext(LanguageContext)
}
