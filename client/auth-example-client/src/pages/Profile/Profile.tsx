import { useState } from 'react'
import { signOut } from '../../services/authService'
import { useNavigate } from 'react-router-dom'

const Profile = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  /**
   * Sign out.
   */
  const onSignOut = () => {
    signOut()
    navigate('/sign-in')
  }

  const onFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }

    setSubmitting(true)

    alert('TODO')

    setSubmitting(false)
  }

  return (
    <>
      <h1>My Profile.</h1>
      <button type="button" onClick={onSignOut}>Sign out</button>

      <hr />
      <h2>Change Password</h2>
      <p>Note: This will sign you out.</p>
      <form onSubmit={onFormSubmit}>
        <label>
          Change password:
          <input type="password" name="password" value={password} required onChange={e => setPassword(e.target.value)} />
        </label>
        <br />
        <label>
          Confirm new password:
          <input type="password" name="confirmPassword" value={confirmPassword} required onChange={e => setConfirmPassword(e.target.value)} />
        </label>
        <br />
        <button disabled={submitting} type="submit">Change Password</button>
      </form>
    </>
  )
}

export default Profile