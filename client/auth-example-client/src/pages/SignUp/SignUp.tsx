// Import React and required hooks
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Define the SignUp component
const SignUp: React.FC = () => {
  // State to hold form input values
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Function to handle form submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Perform signup logic here (e.g., send data to server)
    console.log('Sign up:', { email, password });

    // You can make an API call or handle signup logic as per your application requirements
    // For simplicity, logging the input values to the console in this example
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
