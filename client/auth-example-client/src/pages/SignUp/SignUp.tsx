// Import React and required hooks
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp, validateNewPassword } from '../../services/authService'

// Define the SignUp component
const SignUp: React.FC = () => {
  // State to hold form input values
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationMessages, setValidationMessages] = useState([] as string[])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

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

    setValidationMessages([])
    const validationErrors = validateNewPassword(password, confirmPassword)
    if (validationErrors.length > 0) {
      setValidationMessages(validationErrors)
      return
    }

    // You can make an API call or handle signup logic as per your application requirements
    // For simplicity, logging the input values to the console in this example
    setIsSubmitting(true)
    try {
      await signUp(email, password, confirmPassword)
      alert('Sign up successful; You will be redirected shortly.')
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
    <div>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <br />
        <label>
          Email:
          <input
            type='email'
            name='email'
            autoComplete='username'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <br />
        <label>
          Password:
          <input
            type='password'
            name='password'
            autoComplete='new-password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <br />
        <label>
          Confirm password:
          <input
            type='password'
            name='confirmPassword'
            autoComplete='new-password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>
        <br />
        {validationMessages.length > 0 && (
          <div>
            <p><b>Issues:</b></p>
            <ul>
              {validationMessages.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </div>
        )}
        <button type='submit'>SIGN UP</button>
        <button type='button' onClick={resetForm}>reset</button>
        {isSubmitting && <span>Signing up...</span>}
      </form>
      <div>
        <Link to='/sign-in'>Sign in instead</Link>
        <br />
        <Link to='/'>Home</Link>
      </div>
    </div>
  )
}

export default SignUp
