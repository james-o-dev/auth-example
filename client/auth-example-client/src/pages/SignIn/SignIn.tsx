import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleSSO, signIn } from '../../services/authService'
import { useAuth } from '../../contexts/AuthContext'
import GoogleSignInButton from '../../components/GoogleSignInButton/GoogleSignInButton'


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
      <label className='flex'>
        <div className='mr-2 min-w-[150px]'>TOTP required:</div>
        <input required type='text' name='totp' value={totp} onChange={(e) => setTotp(e.target.value)} />
      </label>
      <br />
    </>
  )

  return (
    <div className='container-sm'>
      <div className='max-w-sm mx-auto border rounded p-4'>
        <h2 className='text-center'>Sign In</h2>
        <form onSubmit={handleSubmit}>
          <hr />
          <br />
          <label className='flex'>
            <div className='mr-2 min-w-[70px]'>Email:</div>
            <input className='w-full' required type='email' name='email' autoComplete='username' value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <br />
          <label className='flex'>
            <div className='mr-2 min-w-[70px]'>Password:</div>
            <input className='w-full' required type='password' name='password' autoComplete='current-password' value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <br />
          {requireTotp && totpInput}
          {isSubmitting && <span>Signing in...</span>}
          <button className='w-full primary' disabled={isSubmitting} type='submit'>Sign In</button>
        </form>
        <br />
        <div className='flex justify-center'>
          <GoogleSignInButton onClick={useGoogleSSO} />
        </div>
        <br />
        <div className='flex flex-col'>
          <Link to='/sign-up'>Sign up instead &rarr;</Link>
          <Link to='/reset-password'>Reset password &rarr;</Link>
        </div>
      </div>
    </div>
  )
}

export default SignIn