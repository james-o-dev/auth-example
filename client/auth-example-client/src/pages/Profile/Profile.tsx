import { useEffect, useState } from 'react'
import { addTotp, changePassword, getVerifiedEmailStatus, hasTotp, removeTotp, clearJwt, signOutAllDevices, verifyEmailConfirm, verifyEmailRequest, validateNewPassword, activateTotp } from '../../services/authService'
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
      <p>
        Note: Once your password has been changed, you will automatically be signed out.
        <br />
        Note: If you signed up with Google, you can set a password by signing out and then using the 'Reset password' feature in the Sign In page.
      </p>

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
  const navigate = useNavigate()
  const [loadingTotp, setLoadingTotp] = useState(false)
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [totpAdded, setTotpAdded] = useState(false)
  const [qrcode, setQrcode] = useState('')
  const [backup, setBackup] = useState([])
  const [toggleTotpContent, setToggleTotpContent] = useState(false)

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

    const code = prompt('Please enter the current TOTP code:')
    if (!code) return

    setLoadingTotp(true)
    try {
      const message = await removeTotp(code)
      alert(message)
      setTotpEnabled(false)
    } catch (error) {
      console.error(error)
      alert((error as Error)?.message || 'TOTP could not be removed at this time.')
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

    setTotpAdded(false)
    setToggleTotpContent(false)
    setLoadingTotp(true)
    try {
      const response = await addTotp()

      alert([
        'TOTP has been added;',
        'However, it will not activated until you confirm it below.',
      ].join('\n'))

      setQrcode(response.qrcode)
      setBackup(response.backup)
      setTotpAdded(true)
    } catch (error) {
      alert('TOTP could not be added at this time.')
    } finally {
      setLoadingTotp(false)
    }
  }

  /**
   * Activates TOTP (Time-based One-Time Password) for the user's account.
   *
   * Prompts the user to enter their current TOTP code. Sends a request to
   * activate TOTP if a valid code is provided. Sets loading state and handles
   * response/errors. Logs the user out and redirects to sign in page if
   * successful.
   */
  const onActivateTotp = async () => {
    if (loadingTotp) return

    const backupCodesSaved = confirm('Have you stored the backup codes securely?')
    if (!backupCodesSaved) return

    const code = prompt('Please enter the current TOTP code (backup codes excluded):')
    if (!code) return

    setLoadingTotp(true)
    try {
      await activateTotp(code)
      setTotpEnabled(true)
      alert('TOTP has been activated; You will now be signed out.')
      clearJwt()
      navigate('/sign-in')
    } catch (error) {
      alert((error as Error)?.message || 'TOTP could not be activated at this time.')
    } finally {
      setLoadingTotp(false)
    }
  }

  /**
   * Display QR code and backup codes.
   */
  const totpContent = (
    <>
      <p>
        Click this button to show/hide the TOTP content:
        <button onClick={() => setToggleTotpContent(val => !val)} type='button'>{toggleTotpContent ? 'Hide' : 'Show'}</button>
      </p>
      <h3>QR Code</h3>
      <div>
        Scan this with your OTP generator app of choice:
        <br />
        {toggleTotpContent && totpAdded ? <img src={qrcode} /> : <div><em>**QR CODE HIDDEN**</em></div>}
      </div>
      <div>
        <h3>Backup codes x10</h3>
        <div>
          {toggleTotpContent ? <strong>{backup.join(', ')}</strong> : <em>**BACKUP CODES HIDDEN**</em>}
          <br />These can be used in place of a generated TOTP. Once one is used, it will be consumed and will not be able to be used again.
          <br />Please store these in a secure location and update your list each time you use a backup code.
          <br />If you are running out of backup codes, you must remove the TOTP and then re-add it again.
        </div>
      </div>
      <div>
        <h3>Confirm</h3>
        <div>
          You must activate the TOTP by using it below at least once, to ensure it has been set up on your end.
          <br /><strong>Be sure to save/copy the backup codes before activating the TOTP!</strong>
        </div>
        <button disabled={loadingTotp} type='button' onClick={onActivateTotp}>Activate TOTP</button>
      </div>
    </>
  )

  return (
    <>
      <p>Two-factor authentication is accomplished with 'Timed One Time Passwords' (TOTP), which can be generated with popular OTP generators like 'Google Authenticator' or 'Authy'.</p>
      <p>Is TOTP enabled and active? {totpEnabled ? '✅' : '❌'}</p>
      {totpEnabled && !totpAdded && <button disabled={loadingTotp} type='button' onClick={onRemoveTotp}>Remove TOTP</button>}
      {!totpEnabled && !totpAdded && <button disabled={loadingTotp} type='button' onClick={onAddTotp}>Add TOTP</button>}
      {loadingTotp && <span>Updating TOTP settings...</span>}
      {qrcode && backup.length && totpAdded && totpContent}
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