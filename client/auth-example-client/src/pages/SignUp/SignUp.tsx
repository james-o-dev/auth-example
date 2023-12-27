// Import React and required hooks
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../../services/authService';

// Define the SignUp component
const SignUp: React.FC = () => {
  // State to hold form input values
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate()

  // Function to handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // You can make an API call or handle signup logic as per your application requirements
    // For simplicity, logging the input values to the console in this example
    setIsSubmitting(true)
    try {
      await signUp(email, password)
      alert('Sign up successful; You will be redirected shortly.')
      navigate('/protected')
    } catch (error) {
      alert((error as Error).message || 'Sign up unsuccessful; Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  };

  return (
    <div>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <br />
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <br />
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <br />
        <button type="submit">Sign Up</button>
        {isSubmitting && <span>Signing up...</span>}
      </form>
      <div>
        <Link to='/sign-in'>Sign in instead</Link>
        <br />
        <Link to='/'>Home</Link>
      </div>
    </div>
  );
};

export default SignUp;
