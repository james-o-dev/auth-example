import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearJwt, resetPasswordConfirm, resetPasswordRequest, validateNewPassword } from '../../services/authService'
import { useAuth } from '../../contexts/AuthContext'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [userId, setUserId] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordValidationErrors, setPasswordValidationErrors] = useState([] as string[])
  const auth = useAuth()

  const disableActions = isSending || isChanging

  /**
   * Form to request a verification email to be sent
   *
   * @param e Form event
   */
  const onRequestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (disableActions) return

    setIsSending(true)
    try {
      const response = await resetPasswordRequest(email)
      setUserId(response.userId)
      setEmailSent(true)
    } catch (error) {
      alert(error)
    } finally {
      setIsSending(false)
    }
  }

  /**
   * Form to reset the password
   *
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  const onConfirmSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (disableActions) return

    setPasswordValidationErrors([])
    const validationErrors = validateNewPassword(newPassword, confirmPassword)
    if (validationErrors.length > 0) {
      setPasswordValidationErrors(validationErrors)
      return
    }

    setIsChanging(true)
    try {
      await resetPasswordConfirm(userId, code, newPassword, confirmPassword)
      alert('Password changed successfully')
      clearJwt()
      auth.setAuthenticated(false)
      navigate('/sign-in')
    } catch (error) {
      alert(error)
    } finally {
      setIsChanging(false)
    }
  }

  const RequestForm = (
    <form onSubmit={onRequestSubmit}>
      <label htmlFor='email'>
        Email:
        <input required type='email' name='email' value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <button disabled={disableActions} type='submit'>Send verification email</button>
      {isSending && <span>Sending...</span>}
    </form>
  )

  const ConfirmForm = (
    <form onSubmit={onConfirmSubmit}>
      <label htmlFor='code'>
        Verification code:
        <input required type='text' name='code' value={code} onChange={(e) => setCode(e.target.value)} />
      </label>
      <br />
      <label htmlFor='newPassword'>
        New password:
        <input required type='password' name='newPassword' autoComplete='new-password' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      </label>
      <br />
      <label htmlFor='confirmPassword'>
        Confirm password:
        <input required type='password' name='confirmPassword' autoComplete='new-password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      </label>
      <br />
      <button disabled={disableActions} type='submit'>Change password</button>
      {isChanging && <span>Changing...</span>}
      {passwordValidationErrors.length > 0 && (
        <div>
          <p><b>Issues:</b></p>
          <ul>
            {passwordValidationErrors.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  )

  return (
    <div>
      <h2>Reset Password</h2>
      <p>Enter your email address below to reset your password.</p>
      <p>This will send an email to the address containing a verification code. Use this code in conjunction with your new password in order to complete the process.</p>
      {!emailSent && RequestForm}
      {emailSent && ConfirmForm}
      <br />
      <Link to='/sign-in'>Sign in instead</Link>
    </div>
  )
}

export default ResetPassword