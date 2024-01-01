import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { googleSSOCallback } from '../../services/authService'

const GoogleSSOCallback = () => {
  // Get the current location object
  const location = useLocation()
  const navigate = useNavigate()
  const alreadyLoaded = useRef(false)

  useEffect(() => {
    if (alreadyLoaded.current) return

    const signInWithGoogle = async () => {
      // Access the query string parameters
      const queryParams = new URLSearchParams(location.search)
      const code = queryParams.get('code') as string

      try {
        await googleSSOCallback(code)
        alert('Google sign in successful; You will be redirected shortly.')
        navigate('/profile')
      } catch (error) {
        alert('Could not sign in with Google at this time.')
      }
    }
    signInWithGoogle()
    alreadyLoaded.current = true
  }, [location.search, navigate])

  return (
    <>
      <p>Signing in with Google...</p>
    </>
  )
}

export default GoogleSSOCallback