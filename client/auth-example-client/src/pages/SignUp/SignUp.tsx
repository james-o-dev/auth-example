// Import React and required hooks
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp, useGoogleSSO, validateEmailFormat, validateNewPassword } from '../../services/authService'
import { useAuth } from '../../contexts/AuthContext'
import GoogleSignInButton from '../../components/GoogleSignInButton/GoogleSignInButton'

// Define the SignUp component
const SignUp: React.FC = () => {
  // State to hold form input values
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationMessages, setValidationMessages] = useState([] as string[])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const auth = useAuth()

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
      alert('Sign up successful; You will be redirected shortly.')
      auth.setAuthenticated(true)
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

  return (
    <div className='container-sm'>
      <div className='max-w-sm mx-auto border rounded p-4'>
        <h2 className='text-center'>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <hr />
          <br />
          <label className='flex items-center'>
            <div className='mr-2 min-w-[140px]'>Email:</div>
            <input
              type='email'
              name='email'
              className='w-full'
              autoComplete='username'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <br />
          <label className='flex items-center'>
            <div className='mr-2 min-w-[140px]'>Password:</div>
            <input
              type='password'
              name='password'
              className='w-full'
              autoComplete='new-password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <br />
          <label className='flex items-center'>
            <div className='mr-2 min-w-[140px]'>Confirm Password:</div>
            <input
              type='password'
              name='confirmPassword'
              autoComplete='new-password'
              className='w-full'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>
          {validationMessages.length > 0 && (
            <div>
              <p className='text-red-500'><b>Issues:</b></p>
              <ul>
                {validationMessages.map((message, index) => (
                  <li className='text-red-500' key={index}>{message}</li>
                ))}
              </ul>
            </div>
          )}
          <br />
          <button disabled={isSubmitting} className='w-full' type='submit'>
            {isSubmitting ? 'Signing up...' : 'Sign Up'}
          </button>
          <button className='w-full mt-1' type='button' onClick={resetForm}>Reset Form</button>
        </form>
        <br />
        <div className='flex justify-center'>
          <GoogleSignInButton onClick={useGoogleSSO} />
        </div>
        <br />
        <Link to='/sign-in'>Sign in instead &rarr;</Link>
        <div>
        </div>
      </div>

    </div>
  )
}

export default SignUp
