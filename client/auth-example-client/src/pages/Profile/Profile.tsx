import { useEffect, useState } from 'react'
import { addTotp, changePassword, getVerifiedEmailStatus, hasTotp, removeTotp, clearJwt, signOutAllDevices, verifyEmailConfirm, verifyEmailRequest, validateNewPassword } from '../../services/authService'
import { Link, useNavigate } from 'react-router-dom'

/**
 * Form to change passwords, child component.
 */
const ChangePasswordForm = () => {
  const navigate = useNavigate()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordValidationErrors, setPasswordValidationErrors] = useState([] as string[])

  /**
   * Change password.
   *
   * @param {React.FormEvent<HTMLFormElement>} event
   */
  const onChangePasswordFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (changingPassword) return

    setPasswordValidationErrors([])
    const validationErrors = validateNewPassword(newPassword, confirmPassword, oldPassword)
    if (validationErrors.length > 0) {
      setPasswordValidationErrors(validationErrors)
      return
    }

    setChangingPassword(true)
    try {
      await changePassword(oldPassword, newPassword, confirmPassword)
      alert('Password changed successful; You will be signed out shortly.')
      clearJwt()
      navigate('/sign-in')
    } catch (error) {
      alert((error as Error).message || 'Sign up unsuccessful; Please try again.')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <>
      <p>Note: This will sign you out.</p>

      <form onSubmit={onChangePasswordFormSubmit}>
        <input type='email' name='email' autoComplete='username' style={{ display: 'none' }} />
        <div>
          <label htmlFor='oldPassword'>Old password:</label>
          <input type='password' name='oldPassword' autoComplete='current-password' value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} />
        </div>
        <div>
          <label htmlFor='newPassword'>New password:</label>
          <input type='password' name='newPassword' autoComplete='new-password' value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        </div>
        <div>
          <label htmlFor='confirmPassword'>Confirm password:</label>
          <input type='password' name='confirmPassword' autoComplete='new-password' value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        </div>
        <br />
        <button disabled={changingPassword} type='submit'>Change password</button>
        {changingPassword && <span>Changing password...</span>}
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
    </>
  )
}

/**
 * Component: Sign out of all devices, child component.
 */
const SignOutAllDevices = () => {
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  /**
   * Make request to sign out of all devices.
   */
  const onSignOutAllDevices = async () => {
    if (!confirm('Are you sure you want to sign out of all devices?')) return

    setSigningOut(true)
    try {
      await signOutAllDevices()
      alert('Sign out of all devices successfully; You will be redirected shortly')
      clearJwt()
      navigate('/sign-in')
    } catch (_) {
      alert('Could not complete at this time.')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <>
      <p>This will sign out of all your devices.</p>
      <button disabled={signingOut} type='button' onClick={onSignOutAllDevices}>Sign out of all devices</button>
      {signingOut && <span>Signing out...</span>}
    </>
  )
}

/**
 * Component: Handle email verification, child component.
 */
const VerifyEmail = () => {
  const [emailVerified, setEmailVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [sendingVerificationEmail, setSendingVerificationEmail] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')

  const disableActions = verifying || sendingVerificationEmail

  // Check if email is verified initially..
  useEffect(() => {
    const request = async () => {
      const emailVerifiedRequest = await getVerifiedEmailStatus()
      setEmailVerified(emailVerifiedRequest)
    }
    request()
  }, [])

  /**
   * Form submit to send email verification code.
   *
   * @param {React.FormEvent<HTMLFormElement>} event
   */
  const onVerifyEmailFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (disableActions) return

    setVerifying(true)
    try {
      const verifyEmailConfirmResponse = await verifyEmailConfirm(verificationCode)
      alert(verifyEmailConfirmResponse)
      setEmailVerified(true)
    } catch (error) {
      alert((error as Error).message || 'Verification unsuccessful; Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  /**
   * Request to send the verification email.
   */
  const onSendVerificationEmail = async () => {
    if (disableActions) return

    const confirmMessage = [
      'This will send an email to your email address, containing a verification code.',
      'Copy this code, paste it in the input and submit in order to verify your email address.',
    ].join('\n')
    if (!confirm(confirmMessage)) return

    setSendingVerificationEmail(true)
    try {
      const verifyEmailConfirmResponse = await verifyEmailRequest()
      alert(verifyEmailConfirmResponse)
      setEmailVerified(false)
    } catch (error) {
      alert((error as Error).message || 'Unable to send verification email; Please try again.')
    } finally {
      setSendingVerificationEmail(false)
    }
  }

  /**
   * Verify email form.
   */
  const verifyEmailForm = () => {
    return (
      <>
        <p>Please verify your email address.</p>
        <form onSubmit={onVerifyEmailFormSubmit}>
          <button disabled={disableActions} type='button' onClick={onSendVerificationEmail}>Send verification email</button>
          {sendingVerificationEmail && <span>Sending verification email...</span>}
          <br />
          <br />
          <label>
            Verification code:
            <input type='text' name='email' required value={verificationCode} onChange={e => setVerificationCode(e.target.value)} />
          </label>
          <button disabled={disableActions} type='submit'>Verify email</button>
          {verifying && <span>Verifying...</span>}
        </form>
      </>
    )
  }

  /**
   * Display if already verified.
   */
  const alreadyVerified = (
    <>
      <p>Your email has been verified. ✅</p>
      <button disabled={disableActions} type='button' onClick={onSendVerificationEmail}>Re-verify</button>
      {sendingVerificationEmail && <span>Sending verification email...</span>}
    </>
  )

  return emailVerified ? alreadyVerified : verifyEmailForm()
}

/**
 * Component: Handle TOTP, child component.
 * * Check whether the account has TOTP
 * * Remove TOTP if it exists
 * * Add TOTP if it does not exist
 */
const TotpSection = () => {
  const [loadingTotp, setLoadingTotp] = useState(false)
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [qrcode, setQrcode] = useState('')
  const [backup, setBackup] = useState([])

  useEffect(() => {
    // Check if TOTP is enabled initially.
    const request = async () => {
      setLoadingTotp(true)
      const hasTotpResponse = await hasTotp()
      setTotpEnabled(hasTotpResponse.totp)
      setLoadingTotp(false)
    }
    request()
  }, [])

  /**
   * Request to remove TOTP.
   */
  const onRemoveTotp = async () => {
    if (loadingTotp) return

    setLoadingTotp(true)
    try {
      const message = await removeTotp()
      alert(message)
      setTotpEnabled(false)
    } catch (error) {
      alert('TOTP could not be removed at this time.')
    } finally {
      setLoadingTotp(false)
    }
  }

  /**
   * Request to add TOTP.
   * * Will then display QR code and backup codes.
   */
  const onAddTotp = async () => {
    if (loadingTotp) return

    if(!confirm('Are you sure you want to add TOTP two-factor authentication to this account?')) return

    setLoadingTotp(true)
    try {
      const response = await addTotp()

      alert([
        'TOTP has been added and authentication tokens have been revoked.',
        'Please capture the QR code in your OTP generator app and securely store the backup codes.',
        'Afterwards, refresh this page to be redirected to the sign-in page.'
      ].join('\n'))

      setQrcode(response.qrcode)
      setBackup(response.backup)
      setTotpEnabled(true)
    } catch (error) {
      alert('TOTP could not be added at this time.')
    } finally {
      setLoadingTotp(false)
    }
  }

  /**
   * Display QR code and backup codes.
   */
  const totpContent = (
    <>
      <h3>TOTP added</h3>
      <p><strong>WARNING:</strong> The QR image and backup codes will be lost once you navigate away or sign out.</p>
      <div>
        <img src={qrcode} />
      </div>
      <div>
        <p>Backup codes:</p>
        <p>{backup.join(', ')}</p>\
      </div>
    </>
  )

  return (
    <>
      <p>Two-factor authentication accomplished with 'Timed One Time Passwords' (TOTP), which can be generated with popular OTP generators like 'Google Authenticator' or 'Authy'.</p>
      <p>Is TOTP enabled?: {totpEnabled ? '✅' : '❌'}</p>
      {totpEnabled && <button disabled={loadingTotp} type='button' onClick={onRemoveTotp}>Remove TOTP</button>}
      {!totpEnabled && <button disabled={loadingTotp} type='button' onClick={onAddTotp}>Add TOTP</button>}
      {qrcode && backup.length && totpContent}
    </>
  )
}

/**
 * Component: User's profile, parent component
 */
const Profile = () => {
  const navigate = useNavigate()

  /**
   * Sign out.
   */
  const onSignOut = () => {
    clearJwt()
    navigate('/sign-in')
  }

  return (
    <>
      <h1>My Profile</h1>
      <Link to='/'>Home</Link>
      <br />
      <a href='' type='button' onClick={onSignOut}>Sign out</a>

      <hr />
      <h2>Change password</h2>
      <ChangePasswordForm />

      <hr />
      <h2>Verify email</h2>
      <VerifyEmail />

      <hr />
      <h2>Two-factor authentication</h2>
      <TotpSection />

      <hr />
      <h2>Sign out of all devices</h2>
      <SignOutAllDevices />
    </>
  )
}

export default Profile