import { Outlet, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import Header from './components/Header/Header'
import Home from './pages/Home/Home'
import SignIn from './pages/SignIn/SignIn'
import SignUp from './pages/SignUp/SignUp'
import ResetPassword from './pages/ResetPassword/ResetPassword'
import GoogleSSOCallback from './pages/GoogleSSOCallback/GoogleSSOCallback'
import Profile from './pages/Profile/Profile'
import { AuthProvider, RequireAuth } from './providers/AuthProvider'
import { useAuth } from './contexts/AuthContext'
import { useEffect, useState } from 'react'
import { isAuthenticated } from './services/authService'

const App = () => {
  return (
    <>
      <AuthProvider>
        <Routes>
          <Route path='/' element={<Layout />}>
            <Route index element={<Home />} />
            <Route path='/sign-in' element={<SignIn />} />
            <Route path='/sign-up' element={<SignUp />} />
            <Route path='/reset-password' element={<ResetPassword />} />
            <Route path='/google-sso-callback' element={<GoogleSSOCallback />} />

            {/* Protected */}
            <Route path='/profile' element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            } />

          </Route>
        </Routes>
      </AuthProvider>
    </>
  )
}

const Layout = () => {
  const [hasLoaded, setHasLoaded] = useState(false)
  const auth = useAuth()
  const location = useLocation()

  useEffect(() => {
    const request = async () => {
      const response = await isAuthenticated()
      auth.setAuthenticated(response)
      setHasLoaded(true)
    }
    request()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]) // We re-authenticated every time a location/route changes.

  const content = (
    <>
      <Header />
      <Outlet />
    </>
  )
  const loading = <div>Loading...</div>
  return hasLoaded ? content : loading
}

export default App
