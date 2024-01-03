import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleSSO, signIn } from '../../services/authService'
import { useAuth } from '../../contexts/AuthContext'

const SignIn = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totp, setTotp] = useState('')
  const [requireTotp, setRequireTotp] = useState(false)
  const navigate = useNavigate()
  const auth = useAuth()

  // Handle form submission.
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return

    // Sign In.
    setIsSubmitting(true)
    try {
      const response = await signIn(email, password, totp)

      if (response.totpRequired) {
        setRequireTotp(true)
        return
      } else {
        alert(response.message)
        auth.setAuthenticated(true)
        navigate('/profile')
      }
    } catch (error) {
      alert((error as Error).message || 'Sign in unsuccessful; Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Additional input for TOTP.
   */
  const totpInput = (
    <>
      <label>
        TOTP required:
        <input required type='text' name='totp' value={totp} onChange={(e) => setTotp(e.target.value)} />
      </label>
      <br />
    </>
  )

  return (
    <div>
      <h2>Sign In</h2>
      <form onSubmit={handleSubmit}>
        <br />
        <label>
          Email:
          <input required type='email' name='email' autoComplete='username' value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <br />
        <label>
          Password:
          <input required type='password' name='password' autoComplete='current-password' value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <br />
        {requireTotp && totpInput}
        <button disabled={isSubmitting} type='submit'>Sign In</button>
        {isSubmitting && <span>Signing in...</span>}
      </form>
      <button type='button' onClick={useGoogleSSO}>Sign in with Google</button>
      <div>
        <Link to='/sign-up'>Sign up instead</Link>
        <br />
        <Link to='/reset-password'>Reset password</Link>
        <br />
        <Link to='/'>Home</Link>
      </div>
    </div>
  )
}

export default SignIn