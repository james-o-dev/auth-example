import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleSSO, signIn } from '../../services/authService'
import { useApp } from '../../contexts/AppContext'
import GoogleSignInButton from '../../components/GoogleSignInButton/GoogleSignInButton'
import FormInput from '../../components/FormInput/FormInput'
import FormButton from '../../components/FormButton/FormButton'
import SignInCard from '../../components/SignInCard/SignInCard'


const SignIn = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totp, setTotp] = useState('')
  const [requireTotp, setRequireTotp] = useState(false)
  const navigate = useNavigate()
  const app = useApp()

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
        // alert(response.message)
        app.setAuthenticated(true)
        navigate('/profile')
      }
    } catch (error) {
      alert((error as Error).message || 'Sign in unsuccessful; Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const minLabelWidth = 'min-w-[120px]'

  /**
   * Additional input for TOTP.
   */
  const totpInput = (
    <>
      <FormInput name='totp' value={totp} setValue={setTotp} required={true} label='TOTP required' minLabelWidth={minLabelWidth} />
      <br />
    </>
  )

  return (
    <div className='container-sm'>
      <br />
      <SignInCard title='Sign In'>
        <form onSubmit={handleSubmit}>
          <FormInput type='email' name='email' autoComplete='username' value={email} setValue={setEmail} required={true} label='Email' minLabelWidth={minLabelWidth} />
          <br />
          <FormInput type='password' name='password' autoComplete='current-password' value={password} setValue={setPassword} required={true} label='Password' minLabelWidth={minLabelWidth} />
          <br />
          {requireTotp && totpInput}
          <FormButton text='Sign In' isSubmittingText='Signing in...' isSubmitting={isSubmitting} fullWidth={true} type='submit' primary={true} />
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
      </SignInCard>
    </div>
  )
}

export default SignIn