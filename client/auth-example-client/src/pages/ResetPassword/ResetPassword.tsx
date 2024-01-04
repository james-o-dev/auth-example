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
      <label htmlFor='email' className='flex items-center'>
        <div className='mr-2 min-w-[60px]'>Email:</div>
        <input required className='w-full' type='email' name='email' value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <br />
      <button className='w-full' disabled={disableActions} type='submit'>
        {isSending ? 'Sending...' : 'Send verification email'}
      </button>
    </form>
  )

  const ConfirmForm = (
    <form onSubmit={onConfirmSubmit}>
      <label htmlFor='code' className='flex items-center'>
        <div className='mr-2 min-w-[140px]'>Verification code:</div>
        <input required className='w-full' type='text' name='code' value={code} onChange={(e) => setCode(e.target.value)} />
      </label>
      <br />
      <label htmlFor='newPassword' className='flex items-center'>
        <div className='mr-2 min-w-[140px]'>New password:</div>
        <input required className='w-full' type='password' name='newPassword' autoComplete='new-password' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      </label>
      <br />
      <label htmlFor='confirmPassword' className='flex items-center'>
        <div className='mr-2 min-w-[140px]'>Confirm password:</div>
        <input required className='w-full' type='password' name='confirmPassword' autoComplete='new-password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      </label>
      <br />
      <button className='w-full' disabled={disableActions} type='submit'>
        {isChanging ? 'Changing...' : 'Change password'}
      </button>
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
    <div className='container-sm'>
      <div className='max-w-sm mx-auto border rounded p-4'>
        <h2 className='text-center'>Reset Password</h2>
        <hr />
        <br />
        <p>Enter your email address below to reset your password.</p>
        <br />
        <p>This will send an email to the address containing a verification code. Use this code in conjunction with your new password in order to complete the process.</p>
        <br />
        {!emailSent && RequestForm}
        {emailSent && ConfirmForm}
        <br />
        <Link to='/sign-in'>Sign in instead &rarr;</Link>
      </div>
    </div>
  )
}

export default ResetPassword