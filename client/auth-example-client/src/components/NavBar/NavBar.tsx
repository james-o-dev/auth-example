// Navbar.tsx

import React from 'react';
import { Link } from 'react-router-dom';

export interface NavbarItem {
  to: string,
  label: string,
}

export interface NavbarProps {
  navItems?: NavbarItem[]
}

const NAV_ITEMS: NavbarItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Sign In', to: '/sign-in' },
  { label: 'Sign Up', to: '/sign-up' },
  { label: '⚠ Protected', to: '/protected' },
]

const Navbar: React.FC<NavbarProps> = ({ navItems = NAV_ITEMS }) => {
  return (
    <nav>
      <ul>
        {navItems.map(({ to, label }, index) => {
          return (
            <li key={index}>
              <Link to={to}>{label}</Link>
            </li>
          )
        })}
      </ul>
    </nav>
  );
};

export default Navbar;
