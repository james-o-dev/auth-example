import './App.css'
import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom'
import SignUp from './pages/SignUp/SignUp'
import SignIn from './pages/SignIn/SignIn'
import Home from './pages/Home/Home'
import { isAuthenticated, signOut } from './services/authService'
import Profile from './pages/Profile/Profile'
import ResetPassword from './pages/ResetPassword/ResetPassword'

const isAuthenticatedLoader = async () => {
  try {
    const response = await isAuthenticated()
    if (!response) throw 'Not Authenticated'
    return response

  } catch (error) {
    alert('You are not authenticated; Please sign in.')
    signOut()
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
    loader: isAuthenticatedLoader
  },
  {
    path: '/reset-password',
    Component: ResetPassword,
  },
  {
    path: '/',
    Component: Home,
  },
])

function App() {
  return (
    <RouterProvider router={router} fallbackElement={<p>Loading...</p>} />
  )
}

export default App
