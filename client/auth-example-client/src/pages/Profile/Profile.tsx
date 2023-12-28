import { useState } from 'react'
import { changePassword, signOut } from '../../services/authService'
import { Link, useNavigate } from 'react-router-dom'

const Profile = () => {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  /**
   * Sign out.
   */
  const onSignOut = () => {
    signOut()
    navigate('/sign-in')
  }

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
      alert('Password changed successfull; You will be signed out shortly.')
      signOut()
      navigate('/sign-in')
    } catch (error) {
      alert((error as Error).message || 'Sign up unsuccessful; Please try again.')
    } finally {
      setIsSubmitting(false)
    }
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
      <form onSubmit={onChangePasswordFormSubmit}>
        <label>
          Old password:
          <input type="password" name="oldPassword" value={oldPassword} required onChange={e => setOldPassword(e.target.value)} />
        </label>
        <br />
        <label>
          New password:
          <input type="password" name="newPassword" value={newPassword} required onChange={e => setNewPassword(e.target.value)} />
        </label>
        <br />
        <label>
          Confirm new password:
          <input type="password" name="confirmPassword" value={confirmPassword} required onChange={e => setConfirmPassword(e.target.value)} />
        </label>
        <br />
        <button disabled={isSubmitting} type="submit">Change Password</button>
        {isSubmitting && <span>Signing in...</span>}
      </form>
    </>
  )
}

export default Profile