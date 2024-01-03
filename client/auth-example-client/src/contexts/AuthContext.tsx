import React from 'react'
import { AuthContext } from '../providers/AuthProvider'

/**
 * Return the auth context to use for components.
 * * Must be within the AuthProvider.
 */
export const useAuth = () => {
  return React.useContext(AuthContext)
}