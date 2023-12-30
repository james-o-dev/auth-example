import './App.css'
import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom'
import SignUp from './pages/SignUp/SignUp'
import SignIn from './pages/SignIn/SignIn'
import Home from './pages/Home/Home'
import { isAuthenticated, clearJwt } from './services/authService'
import Profile from './pages/Profile/Profile'
import ResetPassword from './pages/ResetPassword/ResetPassword'

/**
 * Helper: Request if authenticated. Throw error if not.
 * * Signs out if not authenticated (removes local tokens).
 */
const getIsAuthenticatedShared = async () => {
  try {
    const response = await isAuthenticated()
    if (!response) throw 'Not Authenticated'
  } catch (error) {
    clearJwt()
    throw error
  }
}

/**
 * Loader: Only checks if authenticated.
 * * Clears local tokens if not authenticated.
 * * Always returns true
 */
const checkAuthenticatedState = async () => {
  try {
    await getIsAuthenticatedShared()
  } catch (error) {
    // Ignore.
  }
  return true
}

/**
 * Loader: Displays message and redirects to sign in if not authenticated.
 * * Returns true if authenticated
 */
const mustBeAuthenticated = async () => {
  try {
    await getIsAuthenticatedShared()
    return true
  } catch (error) {
    alert('You are not authenticated. Please sign in.')
    return redirect('/sign-in')
  }
}

const router = createBrowserRouter([
  {
    path: '/sign-up',
    Component: SignUp,
  },
  {
    path: '/sign-in',
    Component: SignIn,
  },
  {
    path: '/profile',
    Component: Profile,
    loader: mustBeAuthenticated
  },
  {
    path: '/reset-password',
    Component: ResetPassword,
  },
  {
    path: '/',
    Component: Home,
    loader: checkAuthenticatedState
  },
])

function App() {
  return (
    <RouterProvider router={router} fallbackElement={<p>Loading...</p>} />
  )
}

export default App
