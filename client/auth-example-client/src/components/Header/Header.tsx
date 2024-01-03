// Header.tsx

import React from 'react'
import { NavLink } from 'react-router-dom'
import { clearJwt } from '../../services/authService'
import { useAuth } from '../../contexts/AuthContext'

export interface HeaderItem {
  to: string,
  label: string,
  type: 'all' | 'auth' | 'unauth',
}

export interface HeaderProps {
  navItems?: HeaderItem[]
}

const NAV_ITEMS: HeaderItem[] = [
  { label: 'Home', to: '/', type: 'all' },
  { label: 'Sign in', to: '/sign-in', type: 'unauth' },
  { label: 'Sign up', to: '/sign-up', type: 'unauth' },
  { label: '👤 Profile', to: '/profile', type: 'auth' },
]

const Header: React.FC<HeaderProps> = ({ navItems = NAV_ITEMS }) => {
  const auth = useAuth()

  const filteredNavItems = navItems.filter(({ type }) => {
    if (type === 'all') return true
    else if (type === 'auth' && auth.authenticated) return true
    else if (type === 'unauth' && !auth.authenticated) return true
    else return false
  })

  /**
   * Sign the user out.
   */
  const onSignOut = () => {
    clearJwt()
    alert('You have been signed out.')
    auth.setAuthenticated(false)
  }

  return (
    <header className=''>
      <h1>Auth Example</h1>
      <nav>
        <ul className='inline-flex'>
          {filteredNavItems
            .map(({ to, label }, index) => {
              return (
                <li key={index}>
                  <NavLink to={to}>{label}</NavLink>
                  {/* <NavLink to={to} className={({ isActive }) => isActive ? 'collapse' : ''}>{label}</NavLink> */}
                </li>
              )
            })}
          {auth.authenticated && <li><a href='' onClick={onSignOut}>Sign out</a></li>}
        </ul>
      </nav>
      <hr />
    </header>
  )
}

export default Header
