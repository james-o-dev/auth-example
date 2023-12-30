import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '../../services/authService'

const SignIn = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  // Handle form submission.
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return

    // Sign In.
    setIsSubmitting(true)
    try {
      await signIn(email, password)
      alert('Sign in successful; You will be redirected shortly.')
      navigate('/profile')
    } catch (error) {
      alert((error as Error).message || 'Sign in unsuccessful; Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
        <button disabled={isSubmitting} type='submit'>Sign In</button>
        {isSubmitting && <span>Signing in...</span>}
      </form>
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