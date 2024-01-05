import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { googleSSOCallback } from '../../services/authService'
import { useAuth } from '../../contexts/AuthContext'
import FormInput from '../../components/FormInput/FormInput'
import FormButton from '../../components/FormButton/FormButton'

const GoogleSSOCallback = () => {
  // Get the current location object
  const location = useLocation()
  const navigate = useNavigate()
  const initialLoad = useRef(false) // Prevents double-calling initial request in dev StrictMode.
  const [totpRequired, setTotpRequired] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [ssoToken, setSsoToken] = useState('')
  const [totpInput, setTotpInput] = useState('')
  const auth = useAuth()

  /**
   * Attempt to sign in with Google
   * * Can be called as a form submit event handler
   * * Can be called directly to sign in with Google
   *
   * @param e - The form submit event
   * @returns - A promise that resolves when the sign in is complete
   *
   * @example
   *
   * // Sign in with Google
   * signInWithGoogle()
   *
   * // Sign in with Google as a form submit event handler
   * <form onSubmit={signInWithGoogle}
   *
   */
  const signInWithGoogle = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()

    // Access the query string parameters
    const queryParams = new URLSearchParams(location.search)
    const code = queryParams.get('code') as string

    setIsLoading(true)
    try {
      const response = await googleSSOCallback(code, totpInput, ssoToken)
      if (response.totpRequired) {
        setTotpRequired(true)
        setSsoToken(response.ssoToken)
        return
      }
      // alert(response.message)
      auth.setAuthenticated(true)
      navigate('/profile')
    } catch (error) {
      alert((error as Error)?.message || 'Could not sign in with Google at this time. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (initialLoad.current) return
    signInWithGoogle()
    initialLoad.current = true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <p>Signing in with Google...</p>
      {totpRequired && (
        <form onSubmit={signInWithGoogle}>
          <br />
          <FormInput label='TOTP required' name='totp' value={totpInput} setValue={setTotpInput} />
          <br />
          <FormButton text='Submit TOTP' isSubmittingText='Submitting TOTP...' isSubmitting={isLoading} type='submit' />
        </form>
      )}
    </>
  )
}

export default GoogleSSOCallback