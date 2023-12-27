// authService.ts

const API_BASE = '' // Add the API Gateway base URL here.

/**
 * Fetches the health status from the API endpoint.
 */
export const apiHealth = async () => {
  try {
    if (!API_BASE) throw new Error('API_BASE is not set.')

    const response = await fetch(`${API_BASE}/health`)
    const healthResponse = await response.json()
    return healthResponse
  } catch (error) {
    return 'Not good ☹'
  }
}

/**
 * Fetch the API whether the user is authenticated.
 */
export const isAuthenticated = async () => {
  try {
    if (!API_BASE) throw new Error('API_BASE is not set.')

    // Simulate an asynchronous operation, e.g., fetching user data from a server
    const response = await fetch(`${API_BASE}/auth`, {
      method: 'GET',
      // headers: {
      //   'Authorization': `Bearer ${localStorage.getItem('token')}`,
      //   'Content-Type': 'application/json',
      // },
      credentials: 'include',
    })

    if (response.ok) {
      // You can customize the success condition based on your server response
      const userData = await response.json()
      return userData // Assuming the presence of user data indicates authentication
    } else {
      // Handle non-OK response (e.g., unauthorized)
      return false
    }
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}
