import { useState } from 'react';
import { Link, redirect } from 'react-router-dom';
import { signIn } from '../../services/authService';

const SignIn = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return

    // Sign In.
    setIsSubmitting(true)
    try {
      await signIn(email, password)
      alert('Sign in successful.')
      redirect('/protected')
    } catch (error) {
      alert('Sign in unsuccessful.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h2>Sign In</h2>
      <form onSubmit={handleSubmit}>
        <br />
        <label>
          Email:
          <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <br />
        <label>
          Password:
          <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <br />
        <button disabled={isSubmitting} type="submit">Sign In</button>
        {isSubmitting && <span>Signing in...</span>}
      </form>
      <div>
        <Link to='/sign-up'>Sign up instead</Link>
        <br />
        <Link to='/'>Home</Link>
      </div>
    </div>
  );
}

export default SignIn;