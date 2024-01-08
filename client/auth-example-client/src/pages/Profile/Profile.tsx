import { useEffect, useRef, useState } from 'react'
import { addTotp, changePassword, getVerifiedEmailStatus, hasTotp, removeTotp, clearJwt, signOutAllDevices, verifyEmailConfirm, verifyEmailRequest, validateNewPassword, activateTotp } from '../../services/authService'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import FormInput from '../../components/FormInput/FormInput'
import FormButton from '../../components/FormButton/FormButton'

interface ProfileSidebar {
  label: string,
  element: JSX.Element,
}

/**
 * Display the sidebar in the profile.
 */
const ProfileSidebar = ({ onSidebarItemClick }: { onSidebarItemClick: (item: ProfileSidebar) => void }) => {
  const [indexSelected, setIndexSelected] = useState(0)
  const [sidebarOpened, setSidebarOpened] = useState(false)
  const sidebarArea = useRef(null)

  const items = [
    { label: 'Dashboard', element: <ProfileDash /> },
    { label: 'Change password', element: <ChangePasswordForm /> },
    { label: 'Verify email', element: <VerifyEmail /> },
    { label: 'Two-factor auth', element: <TotpSection /> },
    { label: 'Sign out all devices', element: <SignOutAllDevices /> },
  ]

  const onSidebarItemClickInternal = (item: ProfileSidebar, index: number) => {
    setIndexSelected(index)
    onSidebarItemClick(item)
    setSidebarOpened(false)
  }

  const sidebarSharedClassName = 'fixed bg-neutral-200 dark:bg-neutral-400 text-black h-screen left-0'

  const openedSidebarClassName = [
    'sm:block w-52 top-14 p-2',
    sidebarSharedClassName,
    sidebarOpened ? 'block' : 'hidden',
  ].join(' ')

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscKeypress)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscKeypress)
    }
  })

  const handleOutsideClick = (e: MouseEvent) => {
    if (sidebarOpened && sidebarArea.current && !(sidebarArea.current as HTMLDivElement).contains(e.target as Node)) {
      setSidebarOpened(false)
    }
  }

  const handleEscKeypress = (e: KeyboardEvent) => {
    if (sidebarOpened && e.key === 'Escape') setSidebarOpened(false)
  }

  return (
    <>
      {/* Responsive */}
      <div className={`${sidebarSharedClassName} sm:hidden left-0 w-8 top-14 pt-2 text-center`} onClick={() => setSidebarOpened(true)}>
        <span>⚙</span>
      </div>

      {/* Opened */}
      <div className={openedSidebarClassName} ref={sidebarArea}>
        <div className='sm:hidden mb-2'>
          <button onClick={() => setSidebarOpened(false)}>
            <em>&larr;Collapse</em>
          </button>
        </div>

        {/* Sidebar content goes here */}
        {items.map((item, index) => (
          <div key={index}>
            <button
              className={`my-4 ${indexSelected === index ? 'font-bold' : ''}`}
              onClick={() => onSidebarItemClickInternal(item, index)}>
              {indexSelected === index && <span>⚙&nbsp;</span>}
              {item.label}
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

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
  const app = useApp()

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
      app.setAuthenticated(false)
      navigate('/sign-in')
    } catch (error) {
      alert((error as Error).message || 'Sign up unsuccessful; Please try again.')
    } finally {
      setChangingPassword(false)
    }
  }

  const onReset = () => {
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordValidationErrors([])
  }

  const minLabelWidth = 'min-w-[140px]'

  return (
    <>
      <h2>Change Password</h2>
      <br />
      <form onSubmit={onChangePasswordFormSubmit}>
        <input type='email' name='email' autoComplete='username' style={{ display: 'none' }} />
        <FormInput type='password' required={true} name='oldPassword' autoComplete='current-password' label='Old password' value={oldPassword} setValue={setOldPassword} minLabelWidth={minLabelWidth} />
        <br />
        <FormInput type='password' required={true} name='newPassword' autoComplete='new-password' label='New password' value={newPassword} setValue={setNewPassword} minLabelWidth={minLabelWidth} />
        <br />
        <FormInput type='password' required={true} name='confirmPassword' autoComplete='new-password' label='Confirm password' value={confirmPassword} setValue={setConfirmPassword} minLabelWidth={minLabelWidth} />
        <br />
        <FormButton text='Change password' isSubmittingText='Changing password...' isSubmitting={changingPassword} type='submit' primary={true} />
        &nbsp;
        <button className='btn' type='button' onClick={onReset}>Reset form</button>
        {passwordValidationErrors.length > 0 && (
          <div className='text-warn'>
            <p><b>Issues:</b></p>
            <ul>
              {passwordValidationErrors.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
      <br />
      <div>
        Note: Once your password has been changed, you will automatically be signed out.
        <br />
        <br />
        Note: If you signed up with Google, you can set a password by signing out and then using the 'Reset password' feature in the Sign In page.
      </div>
    </>
  )
}

/**
 * Component: Sign out of all devices, child component.
 */
const SignOutAllDevices = () => {
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const app = useApp()

  /**
   * Make request to sign out of all devices.
   */
  const onSignOutAllDevices = async () => {
    if (!confirm('Are you sure you want to sign out of all devices?')) return

    setSigningOut(true)
    try {
      await signOutAllDevices()
      // alert('Sign out of all devices successfully; You will be redirected shortly')
      clearJwt()
      app.setAuthenticated(false)
      navigate('/sign-in')
    } catch (_) {
      alert('Could not complete at this time.')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <>
      <h2>Sign Out All Devices</h2>
      <br />
      <div>This will sign out of all your devices.</div>
      <br />
      <FormButton disabled={signingOut} type='button' onClick={onSignOutAllDevices} text='Sign out of all devices' isSubmitting={signingOut} isSubmittingText='Signing out...' primary={true} />
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
  const [initiallyLoaded, setInitiallyLoaded] = useState(false)

  const disableActions = verifying || sendingVerificationEmail

  // Check if email is verified initially..
  useEffect(() => {
    const request = async () => {
      const emailVerifiedRequest = await getVerifiedEmailStatus()
      setEmailVerified(emailVerifiedRequest)
      setInitiallyLoaded(true)
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
      await verifyEmailConfirm(verificationCode)
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
      const verifyEmailSendResponse = await verifyEmailRequest()
      alert(verifyEmailSendResponse)
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
  const verifyEmailForm = (
      <>
        <p>Please verify your email address.</p>
        <form onSubmit={onVerifyEmailFormSubmit}>
          <FormButton disabled={disableActions} onClick={onSendVerificationEmail} text='Send verification email' isSubmitting={sendingVerificationEmail} isSubmittingText='Sending verification email...' primary={true} />
          <br />
          <br />
          <FormInput type='text' name='code' required value={verificationCode} setValue={setVerificationCode} label='Verification code' />
          <br />
          <FormButton text='Verify email' isSubmittingText='Verifying...' disabled={disableActions} isSubmitting={sendingVerificationEmail} type='submit' primary={true} />
        </form>
      </>
    )

  /**
   * Display if already verified.
   */
  const alreadyVerified = (
    <>
      <p>Your email has been verified. ✅</p>
      <FormButton disabled={disableActions} onClick={onSendVerificationEmail} text='Re-verify' isSubmitting={sendingVerificationEmail} isSubmittingText='Sending verification email...' primary={true} />
    </>
  )

  return (
    <>
      <h2>Email Verification</h2>
      <br />
      {initiallyLoaded && (emailVerified ? alreadyVerified : verifyEmailForm)}
    </>
  )
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
  const app = useApp()

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
      await removeTotp(code)
      // alert(message)
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
      app.setAuthenticated(false)
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
      <div>
        Click this button to show/hide the TOTP content:&nbsp;
        <button className={toggleTotpContent ? 'btn' : 'btn-primary'} onClick={() => setToggleTotpContent(val => !val)} type='button'>{toggleTotpContent ? 'Hide' : 'Show'}</button>
      </div>
      <br />
      <h3>QR Code</h3>
      <div>
        Scan this with your OTP generator app of choice:
        <br />
        {toggleTotpContent && totpAdded ? <img className='border rounded p-1 bg-white' src={qrcode} /> : <div><em>**QR CODE HIDDEN**</em></div>}
      </div>
      <br />
      <div>
        <h3>Backup codes x10</h3>
        <div>
          {toggleTotpContent ? <strong>{backup.join(', ')}</strong> : <em>**BACKUP CODES HIDDEN**</em>}
          <br />These can be used in place of a generated TOTP. Once one is used, it will be consumed and will not be able to be used again.
          <br />Please store these in a secure location and update your list each time you use a backup code.
          <br />If you are running out of backup codes, you must remove the TOTP and then re-add it again.
        </div>
      </div>
      <br />
      <div>
        <h3>Confirm</h3>
        <div>
          You must activate the TOTP by using it below at least once, to ensure it has been set up on your end.
          <br /><strong>Be sure to save/copy the backup codes before activating the TOTP!</strong>
        </div>

        <FormButton onClick={onActivateTotp} text='Activate TOTP' isSubmitting={loadingTotp} isSubmittingText='Activating...' primary={true} />
      </div>
    </>
  )

  return (
    <>
      <h2>Two-factor Authentication</h2>
      <br />
      <p>Two-factor authentication is accomplished with 'Timed One Time Passwords' (TOTP), which can be generated with popular OTP generators like 'Google Authenticator' or 'Authy'.</p>
      <br />
      <p>TOTP active? <b>{totpEnabled ? 'Yes! ✅' : 'No ❌'}</b></p>
      <br />
      {totpEnabled && !totpAdded && <FormButton isSubmitting={loadingTotp} type='button' onClick={onRemoveTotp} text='Remove TOTP' isSubmittingText='Removing...'  primary={true}/>}
      {!totpEnabled && !totpAdded && <FormButton isSubmitting={loadingTotp} type='button' onClick={onAddTotp} text='Add TOTP' isSubmittingText='Adding...'  primary={true}/>}
      {qrcode && backup.length && totpAdded && totpContent}
    </>
  )
}

const ProfileDash = () => {
  return (
    <>
      <h2>Dashboard</h2>
      <br />
      <div>
        Some profile details can go here.
      </div>
    </>
  )
}

/**
 * Component: User's profile, parent component
 */
const Profile = () => {
  const [elementDisplayed, setElementDisplayed] = useState<JSX.Element | null>(<ProfileDash />)


  const onSidebarItemClick = (item: ProfileSidebar) => {
    setElementDisplayed(item.element)
  }

  const defaultLanding = (
    <div>You may configure your account by choosing the options in the sidebar.</div>
  )

  return (
    <div className='flex'>

      <ProfileSidebar onSidebarItemClick={onSidebarItemClick} />

      <div className='flex-1 p-4 ml-4 sm:ml-52'>
        <h1>Profile</h1>

        <hr />
        <br />

        {elementDisplayed}
        {!elementDisplayed && defaultLanding}
      </div>
    </div>
  )
}

export default Profile