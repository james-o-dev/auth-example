import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearJwt, resetPasswordConfirm, resetPasswordRequest, validateNewPassword } from '../../services/authService'
import { useAuth } from '../../contexts/AuthContext'
import FormInput from '../../components/FormInput/FormInput'
import FormButton from '../../components/FormButton/FormButton'

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

  const requestMinLabelWidth = 'min-w-[60px]'
  const confirmMinLabelWidth = 'min-w-[140px]'


  const RequestForm = (
    <form onSubmit={onRequestSubmit}>
      <FormInput required type='email' name='email' value={email} setValue={setEmail} label='Email' minLabelWidth={requestMinLabelWidth} />
      <br />
      <FormButton text='Send verification email' isSubmittingText='Sending...' disabled={disableActions} isSubmitting={isSending} fullWidth={true} />
    </form>
  )

  const ConfirmForm = (
    <form onSubmit={onConfirmSubmit}>
      <FormInput required name='code' value={code} setValue={setCode} label='Verification code' minLabelWidth={confirmMinLabelWidth} />
      <br />
      <FormInput required type='password' autoComplete='new-password' name='newPassword' value={newPassword} setValue={setNewPassword} label='New password' minLabelWidth={confirmMinLabelWidth} />
      <br />
      <FormInput required type='password' autoComplete='new-password' name='confirmPassword' value={confirmPassword} setValue={setConfirmPassword} label='Confirm password' minLabelWidth={confirmMinLabelWidth} />
      <br />
      <FormButton text='Change password' isSubmittingText='Changing...' disabled={disableActions} isSubmitting={isChanging} fullWidth={true} />
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