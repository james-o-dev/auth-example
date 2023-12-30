import { useState } from 'react'
import { changePassword, signOut, signOutAllDevices } from '../../services/authService'
import { Link, useNavigate } from 'react-router-dom'

/**
 * Form to change passwords, child component.
 */
const ChangePasswordForm = () => {
  const navigate = useNavigate()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Change password.
   *
   * @param {React.FormEvent<HTMLFormElement>} event
   */
  const onChangePasswordFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) return

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.')
      return
    }

    if (newPassword === oldPassword) {
      alert('New password must not match the old password.')
      return
    }

    setIsSubmitting(true)
    try {
      await changePassword(oldPassword, newPassword, confirmPassword)
      alert('Password changed successful; You will be signed out shortly.')
      signOut()
      navigate('/sign-in')
    } catch (error) {
      alert((error as Error).message || 'Sign up unsuccessful; Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onChangePasswordFormSubmit}>
      <div>
        <label htmlFor="oldPassword">Old Password</label>
        <input type="password" id="oldPassword" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} />
      </div>
      <div>
        <label htmlFor="newPassword">New Password</label>
        <input type="password" id="newPassword" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
      </div>
      <div>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input type="password" id="confirmPassword" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
      </div>
      <button type="submit">Change Password</button>
    </form>
  )
}

/**
 * Component: Sign out of all devices, child component.
 */
const SignOutAllDevices = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSignOutAllDevices = async () => {
    if (!confirm('Are you sure you want to sign out of all devices?')) return

    setIsSubmitting(true)
    try {
      await signOutAllDevices()
      alert('Sign out of all devices successfully; You will be redirected shortly')
      signOut()
      navigate('/sign-in')
    } catch (_) {
      alert('Could not complete at this time.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <p>This will sign-out of all your devices.</p>
      <button disabled={isSubmitting} type="button" onClick={onSignOutAllDevices}>Sign out of all devices</button>
      {isSubmitting && <span>Signing out...</span>}
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
    signOut()
    navigate('/sign-in')
  }

  return (
    <>
      <h1>My Profile.</h1>
      <Link to="/">Home</Link>
      <br />
      <a href="" type="button" onClick={onSignOut}>Sign out</a>

      <hr />
      <h2>Change Password</h2>
      <p>Note: This will sign you out.</p>
      <ChangePasswordForm />

      <hr />
      <h2>Verify Email</h2>
      <pre>TODO</pre>

      <hr />
      <h2>Sign out of all devices</h2>
      <SignOutAllDevices />
    </>
  )
}

export default Profile