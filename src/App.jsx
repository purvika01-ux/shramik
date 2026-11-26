import { useEffect, useState } from 'react'
import { DataProvider, FullPageLoader } from './context/DataContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider, useLang } from './i18n/LanguageContext'
import { ToastProvider } from './components/Toast'
import { ConfirmProvider } from './components/ConfirmationDialog'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import BottomNavigation from './components/BottomNavigation'
import SettingsSheet from './components/SettingsSheet'
import Dashboard from './pages/Dashboard'
import Labour from './pages/Labour'
import Attendance from './pages/Attendance'
import HisabKitab from './pages/HisabKitab'
import Reports from './pages/Reports'
import AuthPage, { ForgotPassword, ResetPassword } from './pages/AuthPage'
import LandingPage from './pages/LandingPage'
import AdminDashboard from './pages/AdminDashboard'
import { useHashRoute } from './hooks/useHashRoute'

const PAGES = { dashboard: Dashboard, labour: Labour, attendance: Attendance, hisab: HisabKitab, reports: Reports }
// Name shown in the phone top bar
const TITLES = { labour: 'dash.labourMgmt', attendance: 'nav.attendance', hisab: 'nav.hisab', reports: 'nav.reports' }

function Shell() {
  const [route, navigate] = useHashRoute()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { t } = useLang()
  const Page = PAGES[route.page]
  const openSettings = () => setSettingsOpen(true)
  const isHome = route.page === 'dashboard'
  // Back: from a labourer's page to the list, from a list to Home
  const goBack = () => navigate(route.id ? `/${route.page}` : '/dashboard')

  return (
    <div className="flex min-h-screen">
      <Sidebar current={route.page} onNavigate={navigate} onOpenSettings={openSettings} />
      <div className="min-w-0 flex-1">
        {!isHome && <Header title={t(TITLES[route.page])} onBack={goBack} onOpenSettings={openSettings} />}
        <main className={`mx-auto max-w-3xl px-4 pb-28 md:px-8 md:pb-10 md:pt-8 lg:max-w-5xl print:max-w-none print:p-0 ${isHome ? 'pt-0' : 'pt-4'}`}>
          {/* key gives each section / labourer a fresh page state */}
          <Page key={`${route.page}/${route.id || ''}`} route={route} navigate={navigate} onOpenSettings={openSettings} />
        </main>
      </div>
      <BottomNavigation current={route.page} onNavigate={navigate} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

const PUBLIC_PAGES = ['login', 'register', 'forgot-password', 'reset-password']

/** Pages for visitors who are not logged in: #/ (landing), #/login, #/register, #/forgot-password, #/reset-password?token=… */
function PublicPages() {
  const read = () => {
    const path = window.location.hash.replace(/^#\/?/, '').split('?')[0]
    return PUBLIC_PAGES.includes(path) ? path : 'home'
  }
  const [page, setPage] = useState(read)

  useEffect(() => {
    const onChange = () => {
      setPage(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const goTo = (next) => {
    window.location.hash = next === 'home' ? '#/' : `#/${next}`
  }

  if (page === 'home') return <LandingPage goTo={goTo} />
  if (page === 'forgot-password') return <ForgotPassword goTo={goTo} />
  if (page === 'reset-password') {
    const token = new URLSearchParams(window.location.hash.split('?')[1] || '').get('token') || ''
    return <ResetPassword token={token} goTo={goTo} />
  }
  return <AuthPage key={page} mode={page} goTo={goTo} />
}

/**
 * Protected routes by role:
 *   not logged in -> Landing page, Login / Register
 *   admin         -> Admin dashboard (contractor list)
 *   contractor    -> the labour register (their own data only)
 */
function RoleRouter() {
  const { user, checking } = useAuth()
  if (checking) return <FullPageLoader />
  if (!user) return <PublicPages />
  if (user.role === 'admin') return <AdminDashboard />
  return (
    // key: a different contractor logging in gets a freshly loaded register
    <DataProvider key={user.id}>
      <Shell />
    </DataProvider>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <RoleRouter />
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </LanguageProvider>
  )
}
