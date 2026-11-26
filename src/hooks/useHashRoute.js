import { useCallback, useEffect, useState } from 'react'

// Tiny hash router: "#/labour/L-001?add=1" -> { page: 'labour', id: 'L-001', query: { add: '1' } }
// Hash routes survive refresh and the phone's back button works naturally.

const PAGES = ['dashboard', 'labour', 'attendance', 'hisab', 'reports']

function parse() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  const [path, qs = ''] = hash.split('?')
  const [page, id] = path.split('/')
  return {
    page: PAGES.includes(page) ? page : 'dashboard',
    id: id ? decodeURIComponent(id) : null,
    query: Object.fromEntries(new URLSearchParams(qs)),
  }
}

export function useHashRoute() {
  const [route, setRoute] = useState(parse)

  useEffect(() => {
    const onChange = () => {
      setRoute(parse())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  /** navigate('/labour/L-001') or navigate('/labour', { add: 1 }, { replace: true }) */
  const navigate = useCallback((path, query, { replace = false } = {}) => {
    const qs = query ? `?${new URLSearchParams(query)}` : ''
    const target = `#${path}${qs}`
    if (replace) {
      window.history.replaceState(null, '', target)
      setRoute(parse())
    } else {
      window.location.hash = target
    }
  }, [])

  return [route, navigate]
}
