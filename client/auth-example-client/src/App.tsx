import './App.css'
import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom'
import Protected from './pages/Protected/Protected'
import SignUp from './pages/SignUp/SignUp'
import SignIn from './pages/SignIn/SignIn'
import Home from './pages/Home/Home'
import { isAuthenticated } from './services/authService'

const isAuthenticatedLoader = async () => {
  try {
    const response = await isAuthenticated()
    if (!response) throw 'Not Authenticated'
    return response

  } catch (error) {
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
    path: '/protected',
    Component: Protected,
    loader: isAuthenticatedLoader
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
