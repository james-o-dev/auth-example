import React from 'react'
import { AppContext } from '../providers/AppProvider'

/**
 * Return the app context to use for components.
 * * Must be within the AppProvider.
 */
export const useApp = () => {
  return React.useContext(AppContext)
}