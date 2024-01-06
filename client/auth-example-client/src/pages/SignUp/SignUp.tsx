// Import React and required hooks
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp, useGoogleSSO, validateEmailFormat, validateNewPassword } from '../../services/authService'
import { useApp } from '../../contexts/AppContext'
import GoogleSignInButton from '../../components/GoogleSignInButton/GoogleSignInButton'
import FormInput from '../../components/FormInput/FormInput'
import FormButton from '../../components/FormButton/FormButton'
import SignInCard from '../../components/SignInCard/SignInCard'

// Define the SignUp component
const SignUp: React.FC = () => {
  // State to hold form input values
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationMessages, setValidationMessages] = useState([] as string[])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const app = useApp()

  /**
   * Function to handle form submission.
   *
   * This function will validate the form input values before submitting.
   * If the form is valid, it will make an API call to the backend to handle signup logic.
   * If the API call is successful, it will display an alert and navigate to the protected page.
   * If the API call fails, it will display an alert and reset the form.
   *
   * @param {React.FormEvent} event - The form submission event.
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    let newValidationErrors: string[] = []

    const isEmaiLValid = validateEmailFormat(email)
    if (!isEmaiLValid.valid) newValidationErrors.push(isEmaiLValid.message)

    const passwordValidationErrorMessages = validateNewPassword(password, confirmPassword)
    if (passwordValidationErrorMessages.length > 0) newValidationErrors = [...newValidationErrors, ...passwordValidationErrorMessages]

    if (newValidationErrors.length > 0) {
      setValidationMessages(newValidationErrors)
      return
    }
    setValidationMessages([])

    // You can make an API call or handle signup logic as per your application requirements
    // For simplicity, logging the input values to the console in this example
    setIsSubmitting(true)
    try {
      await signUp(email, password, confirmPassword)
      // alert('Sign up successful; You will be redirected shortly.')
      app.setAuthenticated(true)
      navigate('/profile')
    } catch (error) {
      alert((error as Error).message || 'Sign up unsuccessful; Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Function to reset the form input values and validation messages.
   */
  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setValidationMessages([])
    setIsSubmitting(false)
  }

  const minLabelWidth = 'min-w-[140px]'

  return (
    <div className='container-sm'>
      <br />
      <SignInCard title='Sign Up'>
        <form onSubmit={handleSubmit}>
          <FormInput type='email' name='email' autoComplete='username' value={email} setValue={setEmail} required={true} label='Email' minLabelWidth={minLabelWidth} />
          <br />
          <FormInput type='password' name='password' autoComplete='new-password' value={password} setValue={setPassword} required={true} label='Password' minLabelWidth={minLabelWidth} />
          <br />
          <FormInput type='password' name='confirmPassword' autoComplete='new-password' value={confirmPassword} setValue={setConfirmPassword} required={true} label='Confirm Password' minLabelWidth={minLabelWidth} />
          {validationMessages.length > 0 && (
            <div className='text-warn'>
              <p><b>Issues:</b></p>
              <ul>
                {validationMessages.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            </div>
          )}
          <br />
          <FormButton text='Sign Up' isSubmittingText='Signing up...' isSubmitting={isSubmitting} fullWidth={true} type='submit' primary={true} />
          <button className='w-full mt-1 btn' type='button' onClick={resetForm}>Reset Form</button>
        </form>
        <br />
        <div className='flex justify-center'>
          <GoogleSignInButton onClick={useGoogleSSO} />
        </div>
        <br />
        <Link to='/sign-in'>Sign in instead &rarr;</Link>
      </SignInCard>

    </div>
  )
}

export default SignUp
