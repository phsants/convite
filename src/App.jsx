import React from 'react'
import { Toaster } from '@/components/ui/toaster'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from '@/pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import PageNotFound from '@/lib/PageNotFound'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import UserNotRegisteredError from '@/components/UserNotRegisteredError'
import Login from '@/pages/Login'

const { Pages = {}, Layout, mainPage } = pagesConfig || {}
const mainPageKey = mainPage ?? Object.keys(Pages)[0]
const MainPage = mainPageKey && Pages[mainPageKey] ? Pages[mainPageKey] : null

const PUBLIC_PATHS = ['login', 'Confirmar']

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout ? (
    <Layout currentPageName={currentPageName}>{children}</Layout>
  ) : (
    <>{children}</>
  )

const ProtectedRoute = ({ children, path }) => {
  const { user, isLoadingAuth } = useAuth()
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600" />
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: path }} />
  }
  return children
}

const AuthenticatedApp = () => {
  const {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    navigateToLogin,
  } = useAuth()

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600" />
      </div>
    )
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />
    }
    if (authError.type === 'auth_required') {
      navigateToLogin()
      return null
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute path="/">
            <LayoutWrapper currentPageName={mainPageKey}>
              {MainPage ? <MainPage /> : null}
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      {Object.entries(Pages).map(([path, Page]) => {
        const pathName = path.replace(/ /g, '-')
        const isPublic = PUBLIC_PATHS.some((p) => pathName.toLowerCase() === p.toLowerCase())
        return (
          <Route
            key={path}
            path={`/${pathName}`}
            element={
              isPublic ? (
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              ) : (
                <ProtectedRoute path={`/${pathName}`}>
                  <LayoutWrapper currentPageName={path}>
                    <Page />
                  </LayoutWrapper>
                </ProtectedRoute>
              )
            }
          />
        )
      })}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
