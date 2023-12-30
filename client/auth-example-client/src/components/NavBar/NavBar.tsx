// Navbar.tsx

import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearJwt } from '../../services/authService'
import { hasRefreshToken } from '../../services/apiService'

export interface NavbarItem {
  to: string,
  label: string,
  type: 'all' | 'auth' | 'unauth',
}

export interface NavbarProps {
  navItems?: NavbarItem[]
}

const NAV_ITEMS: NavbarItem[] = [
  { label: 'Home', to: '/', type: 'all' },
  { label: 'Sign in', to: '/sign-in', type: 'unauth', },
  { label: 'Sign up', to: '/sign-up', type: 'unauth', },
  { label: '👤 Profile', to: '/profile', type: 'auth' },
]

const Navbar: React.FC<NavbarProps> = ({ navItems = NAV_ITEMS }) => {
  const navigate = useNavigate()
  const authenticated = hasRefreshToken()

  const filteredNavItems = navItems.filter(({ type }) => {
    if (type === 'all') return true
    else if (type === 'auth' && authenticated) return true
    else if (type === 'unauth' && !authenticated) return true
    else return false
  })

  /**
   * Sign the user out.
   */
  const onSignOut = () => {
    clearJwt()
    alert('You have been signed out.')
    navigate('/sign-in')
  }

  return (
    <nav>
      <ul>
        {filteredNavItems
          .map(({ to, label }, index) => {
            return (
              <li key={index}>
                <Link to={to}>{label}</Link>
              </li>
            )
          })}
        {authenticated && <li><a href='' onClick={onSignOut}>Sign out</a></li>}
      </ul>
    </nav>
  )
}

export default Navbar
