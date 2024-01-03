import { useEffect, useState } from 'react'
import { apiHealth } from '../../services/apiService'

const Home = () => {
  const [healthMessage, setHealthMessage] = useState('Loading...')

  useEffect(() => {
    // Initially get the state of the API health.
    const fetchAPIHealth = async () => {
      const getHealth = await apiHealth()
      setHealthMessage(getHealth)
    }
    fetchAPIHealth()
  }, [])

  return (
    <>
      <h2>Hello World!</h2>
      <p>API health: {healthMessage}</p>
    </>
  )
}

export default Home