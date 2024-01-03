// Header.tsx

import React from 'react'
import { NavLink } from 'react-router-dom'
import { clearJwt } from '../../services/authService'
import { useAuth } from '../../contexts/AuthContext'

interface HeaderItem {
  to: string,
  label: string,
  type: HeaderItemType,
}
enum HeaderItemType {
  'all',
  'auth',
  'unauth',
}

const Header: React.FC = () => {
  const auth = useAuth()

  const navItems: HeaderItem[] = [
    { label: 'Home', to: '/', type: HeaderItemType.all },
    { label: 'Sign in', to: '/sign-in', type: HeaderItemType.unauth },
    { label: 'Sign up', to: '/sign-up', type: HeaderItemType.unauth },
    { label: '👤 Profile', to: '/profile', type: HeaderItemType.auth },
  ].filter(({ type }) => {
    if (type === HeaderItemType.all) return true
    else if (type === HeaderItemType.auth && auth.authenticated) return true
    else if (type === HeaderItemType.unauth && !auth.authenticated) return true
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
          {navItems
            .map(({ to, label }, index) => {
              return (
                <li key={index}>
                  <NavLink to={to}>{label}</NavLink>
                  {/* <NavLink to={to} className={({ isActive }) => isActive ? 'font-bold underline' : ''}>{label}</NavLink> */}
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
