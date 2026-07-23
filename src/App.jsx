import React, { Suspense, useEffect } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import PageNotFound from './lib/PageNotFound'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import ClientOnboarding from './pages/ClientOnboarding'
import ClientDashboard from './pages/ClientDashboard'
import PublicEntryWithLogo from './pages/PublicEntryWithLogo'
import PublicLegalLibrary from './pages/PublicLegalLibrary'
import PasswordReset from './pages/PasswordReset'
import Payment from './pages/Payment'
import { createPageUrl } from '@/utils'
import ErrorBoundary from '@/components/app/ErrorBoundary'
import AppStatusBar from '@/components/app/AppStatusBar'
import KeyboardShortcutsModal from '@/components/app/KeyboardShortcutsModal'
import SupabaseConfigGate from '@/components/app/SupabaseConfigGate'
import { base44 } from '@/api/base44Client'

const { Pages, Layout, mainPage } = pagesConfig
const mainPageKey = mainPage ?? Object.keys(Pages)[0]
const MainPage = mainPageKey ? Pages[mainPageKey] : () => null
const CLIENT_ALLOWED_PAGES = new Set(['Dashboard', 'Cases', 'Invoices', 'Documents', 'Notifications', 'Profile'])
const BROKER_ALLOWED_PAGES = new Set(['Brokers', 'Clients', 'Cases', 'Notifications', 'Profile'])
const PENDING_CLIENT_ALLOWED_PAGES = new Set(['ClientOnboarding'])
const STAFF_ROLES = new Set(['admin', 'staff', 'lawyer', 'assistant', 'secretary'])

const PageFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center" style={{background:'radial-gradient(circle at 50% 35%, #101d3d 0%, #050913 42%, #02040a 100%)'}}>
    <div className="text-center space-y-5 select-none">
      <div className="relative mx-auto h-20 w-20">
        <div className="absolute inset-0 rounded-3xl bg-white/5 border border-blue-400/25 shadow-2xl shadow-blue-500/20"/>
        <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-blue-600/90 to-slate-950 flex items-center justify-center overflow-hidden">
          <img src="/icon-192.png" alt="HELM Portal" className="h-12 w-12 rounded-xl object-contain drop-shadow-lg" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        </div>
        <div className="absolute inset-0 rounded-3xl border border-blue-400/30 animate-ping"/>
      </div>
      <div className="space-y-2">
        <div className="h-1.5 w-32 mx-auto rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-blue-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"/></div>
        <p className="text-xs text-white/40">جارٍ تحميل HELM Portal…</p>
      </div>
    </div>
  </div>
)

const LayoutWrapper = ({ children, currentPageName }) => Layout ? <Suspense fallback={<PageFallback />}><Layout currentPageName={currentPageName}>{children}</Layout></Suspense> : <>{children}</>

function RealtimeBridge() { useEffect(() => { const stop = base44.realtime.subscribe(); return stop }, []); return null }

function OnboardingRoute() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (STAFF_ROLES.has(user?.role) || user?.role === 'broker') return <Navigate to={createPageUrl(user?.role === 'broker' ? 'Brokers' : 'Dashboard')} replace />
  if (user?.role === 'client') return <Navigate to={createPageUrl('Dashboard')} replace />
  return <ClientOnboarding />
}

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicEntryWithLogo />} />
      <Route path="/Payment" element={<Payment />} />
      <Route path="/PublicLegalLibrary" element={<PublicLegalLibrary />} />
      <Route path="/PasswordReset" element={<PasswordReset />} />
      <Route path={createPageUrl('ClientOnboarding')} element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, user, isAuthenticated } = useAuth()
  if (isLoadingPublicSettings || isLoadingAuth) return <PageFallback />
  if (!isAuthenticated || !user) return <PublicRoutes />

  const fallbackPage = user?.role === 'broker' ? 'Brokers' : 'Dashboard'
  const resolvePage = (path, Page) => user?.role === 'client' && path === 'Dashboard' ? ClientDashboard : Page
  const renderPage = (path, Page) => {
    if (user?.role === 'pending_client' && !PENDING_CLIENT_ALLOWED_PAGES.has(path)) return <Navigate to={createPageUrl('ClientOnboarding')} replace />
    if (user?.role === 'client' && !CLIENT_ALLOWED_PAGES.has(path)) return <Navigate to={createPageUrl('Dashboard')} replace />
    if (user?.role === 'broker' && !BROKER_ALLOWED_PAGES.has(path)) return <Navigate to={createPageUrl('Brokers')} replace />
    const ResolvedPage = resolvePage(path, Page)
    return <LayoutWrapper currentPageName={path}><Suspense fallback={<PageFallback />}><ResolvedPage /></Suspense></LayoutWrapper>
  }

  return (
    <>
      <RealtimeBridge />
      <Routes>
        <Route path="/" element={user?.role === 'pending_client' ? <Navigate to={createPageUrl('ClientOnboarding')} replace /> : renderPage(fallbackPage, Pages[fallbackPage] || MainPage)} />
        <Route path={createPageUrl('ClientOnboarding')} element={<OnboardingRoute />} />
        <Route path="/Payment" element={<Payment />} />
        <Route path="/PublicLegalLibrary" element={<PublicLegalLibrary />} />
        <Route path="/PasswordReset" element={<PasswordReset />} />
        {Object.entries(Pages).map(([path, Page]) => <Route key={path} path={`/${path}`} element={renderPage(path, Page)} />)}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <SupabaseConfigGate>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router><AppStatusBar /><KeyboardShortcutsModal /><AuthenticatedApp /></Router>
            <Toaster />
          </QueryClientProvider>
        </AuthProvider>
      </SupabaseConfigGate>
    </ErrorBoundary>
  )
}

export default App