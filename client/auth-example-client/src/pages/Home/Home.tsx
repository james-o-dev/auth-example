import { useEffect, useState } from 'react';
import Navbar from '../../components/NavBar/NavBar';
import { apiHealth } from '../../services/authService';

const Home = () => {
  const [healthMessage, setHealthMessage] = useState('Loading...');

  useEffect(() => {
    // Initially get the state of the API health.
    const fetchAPIHealth = async () => {
      const getHealth = await apiHealth()
      setHealthMessage(getHealth)
    }
    fetchAPIHealth()
  }, []);

  return (
    <>
      <Navbar />
      <h1>Hello World!</h1>
      <p>API health: {healthMessage}</p>
    </>
  );
}

export default Home;