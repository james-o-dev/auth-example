import React, { useState } from 'react'
import { useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface AuthContextType {
  authenticated: boolean;
  setAuthenticated: (authenticated: boolean) => void;
}

/**
 * Provide the auth context for child components.
 */
export const AuthContext = React.createContext<AuthContextType>(null!)

/**
 * Provider for the auth context.
 * * Include this at the root level, above the Routes.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(false)

  return <AuthContext.Provider value={{ authenticated, setAuthenticated }}>{children}</AuthContext.Provider>
}

/**
 * Wrap this in a component in order to require authentication.
 * * If not authenticated, it will redirect to the sign-in page.
 */
export const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const auth = useAuth()
  const location = useLocation()

  if (!auth.authenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.

    return <Navigate to='/sign-in' state={{ from: location }} replace />
  }

  return children
}