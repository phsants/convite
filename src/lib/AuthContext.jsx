import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from 'react'

const STORAGE_TOKEN = 'convite_token'
const STORAGE_USER = 'convite_user'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_USER)
      const token = localStorage.getItem(STORAGE_TOKEN)
      if (stored && token) {
        const parsed = JSON.parse(stored)
        setUser(parsed)
      }
    } catch {
      localStorage.removeItem(STORAGE_USER)
      localStorage.removeItem(STORAGE_TOKEN)
    } finally {
      setIsLoadingAuth(false)
    }
  }, [])

  const login = (userData, token) => {
    setUser(userData)
    localStorage.setItem(STORAGE_TOKEN, token)
    localStorage.setItem(STORAGE_USER, JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_TOKEN)
    localStorage.removeItem(STORAGE_USER)
  }

  const isAuthenticated = !!user
  const isLoadingPublicSettings = false
  const authError = null
  const appPublicSettings = null

  const navigateToLogin = () => {}
  const checkAppState = () => {}

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        login,
        logout,
        navigateToLogin,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
