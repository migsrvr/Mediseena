// ==============================================================================
// MEDISEENA APPLICATION ROUTER & CONTEXT WRAPPER
// ==============================================================================

import { useEffect, useState } from 'react'
import { AuthProvider } from './context/AuthContext.jsx'
import LandingPage from './pages/LandingPage.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/Profile.jsx'
import UploadPrescription from './pages/UploadPrescription.jsx'
import ReviewExtraction from './pages/ReviewExtraction.jsx'
import Records from './pages/Records.jsx'
import RecordDetail from './pages/RecordDetail.jsx'
import KpiAnalytics from './pages/KpiAnalytics.jsx'
import LogoutPage from './pages/LogoutPage.jsx'

function getPath() {
  return window.location.pathname
}

function MainRoutes() {
  const [path, setPath] = useState(getPath())

  useEffect(() => {
    const onPopState = () => setPath(getPath())
    const onClick = (e) => {
      const anchor = e.target.closest?.('a[href^="/"]')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || !href.startsWith('/')) return
      // Don't intercept hash links or downloads
      if (href.startsWith('/#') || anchor.hasAttribute('download')) return

      e.preventDefault()
      if (href !== window.location.pathname) {
        window.history.pushState(null, '', href)
        setPath(href)
      }
    }
    window.addEventListener('popstate', onPopState)
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('popstate', onPopState)
      document.removeEventListener('click', onClick)
    }
  }, [])

  // Public / Auth routes
  if (path === '/register') return <Register />
  if (path === '/login') return <Login />
  if (path === '/landing-page') return <LandingPage />
  if (path === '/') {
    return <LandingPage />
  }

  // Authenticated workspace routes
  if (path === '/dashboard') return <Dashboard />
  if (path === '/profile') return <Profile />
  if (path === '/upload') return <UploadPrescription />
  if (path === '/review') return <ReviewExtraction />
  if (path === '/records') return <Records />
  if (path.startsWith('/records/')) {
    const recordId = path.split('/')[2]
    return <RecordDetail recordId={recordId} />
  }
  if (path === '/kpis') return <KpiAnalytics />
  if (path === '/logout') return <LogoutPage />

  // Fallback default
  return <Dashboard />
}

export default function App() {
  return (
    <AuthProvider>
      <MainRoutes />
    </AuthProvider>
  )
}
