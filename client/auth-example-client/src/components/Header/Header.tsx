// Header.tsx

import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { clearJwt } from '../../services/authService'
import { useAuth } from '../../contexts/AuthContext'
import DropdownMenu from '../DropdownMenu/DropdownMenu'
import MenuIcon from '../../assets/menu.svg'

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
  const navigate = useNavigate()
  const [dropMenuOpened, setDropMenuOpened] = useState(false)

  const navItems: HeaderItem[] = [
    { label: 'Sign in', to: '/sign-in', type: HeaderItemType.unauth },
    { label: 'Sign up', to: '/sign-up', type: HeaderItemType.unauth },
    { label: 'Profile', to: '/profile', type: HeaderItemType.auth },
  ].filter(({ type }) => {
    if (type === HeaderItemType.all) return true
    else if (type === HeaderItemType.auth && auth.authenticated) return true
    else if (type === HeaderItemType.unauth && !auth.authenticated) return true
    else return false
  })

  // Nav items for the responsive nav menu.
  const navMenuItems = navItems.map(({ to, label }) => ({ value: to, text: label }))
  if (auth.authenticated) navMenuItems.push({ value: '/sign-out', text: 'Sign out' })

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
  const onResponsiveNavMenuClick = (v: string) => {
    if (v === '/sign-out') onSignOut()
    else navigate(v)
  }

  return (
    <header className='bg-gray-800 p-2 fixed w-full top-0 z-10 h-14 items-center mx-auto flex justify-between'>
      <div className='text-white font-bold text-lg cursor-pointer' onClick={() => navigate('/')}>Auth Example</div>

      <div className='hidden sm:flex space-x-4'>
        {navItems.map(({ to, label }, index) => <NavLink key={index} to={to} className={({ isActive }) => isActive ? classNames.active : classNames.nonactive}>{label}</NavLink>)}
        {auth.authenticated && <a className='text-white' href='#' onClick={onSignOut}>Sign out</a>}
      </div>

      <div className='flex sm:hidden'>
        <DropdownMenu options={navMenuItems} onSelect={onResponsiveNavMenuClick} opened={dropMenuOpened} setOpened={setDropMenuOpened} rtl={true}>
          <button onClick={() => setDropMenuOpened(v => !v)}>
            <img src={MenuIcon} alt='Responsive menu' />
          </button>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default Header
