import { useState } from 'react'
import { resetPassword, signOut } from '../../services/authService'
import { Link, useNavigate } from 'react-router-dom'

const ResetPassword = () => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  /**
   * Handles form submission
   *
   * @param {React.FormEvent<HTMLFormElement>} e - The form event
   */
  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await resetPassword(email)

      alert('A new password has been sent to you; You will be redirected to the sign-in page shortly.')
      signOut()
      navigate('/sign-in')

    } catch (error) {
      alert((error as Error).message || 'Password reset was unsuccessful; Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h2>Reset Password</h2>
      <form onSubmit={onFormSubmit}>
        <label htmlFor='email'>
          Email:
          <input required type='email' name='email' value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button disabled={isSubmitting} type='submit'>Reset password</button>
        {isSubmitting && <span>Resetting...</span>}
      </form>
      <br />
      <Link to='/sign-in'>Sign in instead</Link>
    </div>
  )
}

export default ResetPassword