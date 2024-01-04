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
    { label: 'Profile', to: '/profile', type: HeaderItemType.auth },
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

  const classNames = {
    active: 'text-white font-bold',
    nonactive: 'text-white',
  }

  return (
    <header className='bg-gray-800 p-4 fixed w-full top-0 z-10'>
      <div className='container mx-auto flex items-center justify-between '>
        <div className='text-white font-bold text-lg'>Auth Example</div>
        <div className='hidden md:flex space-x-4'>
          {navItems.map(({ to, label }, index) => <NavLink key={index} to={to} className={({ isActive }) => isActive ? classNames.active : classNames.nonactive}>{label}</NavLink>)}
          {auth.authenticated && <a className='text-white' href='' onClick={onSignOut}>Sign out</a>}
        </div>
      </div>
    </header>
  )
}

export default Header
