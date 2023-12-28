// Navbar.tsx

import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from '../../services/authService'

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
  { label: 'Sign In', to: '/sign-in', type: 'unauth', },
  { label: 'Sign Up', to: '/sign-up', type: 'unauth', },
  { label: '⚠ Profile', to: '/profile', type: 'auth' },
]

const Navbar: React.FC<NavbarProps> = ({ navItems = NAV_ITEMS }) => {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const onSignOut = () => {
    signOut()
    alert('You have been signed out.')
    navigate('/sign-in')
  }

  return (
    <nav>
      <ul>
        {navItems
          .filter(({ type }) => (type === 'all') || (type === 'auth' && user) || (type === 'unauth' && !user))
          .map(({ to, label }, index) => {
            return (
              <li key={index}>
                <Link to={to}>{label}</Link>
              </li>
            )
          })}
        {user && <li><a href="" onClick={onSignOut}>Sign Out</a></li>}
      </ul>
    </nav>
  )
}

export default Navbar
