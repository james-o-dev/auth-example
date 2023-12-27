// authService.ts

const API_BASE = '' // Add the API Gateway base URL here.

export const TOKEN_STORAGE_NAME = 'token'
export const USER_STORAGE_NAME = 'user'

/**
 * Sign out procedure.
 */
export const signOut = () => {
  localStorage.removeItem(TOKEN_STORAGE_NAME)
  localStorage.removeItem(USER_STORAGE_NAME)
}

/**
 * Fetches the health status from the API endpoint.
 */
export const apiHealth = async () => {
  try {
    if (!API_BASE) throw new Error('API_BASE is not set.')

    const response = await fetch(`${API_BASE}/health`)
    const healthResponse = await response.json()
    if (!response.ok) throw new Error(typeof healthResponse === 'object' ? JSON.stringify(healthResponse) : healthResponse)
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
      headers: {
        'Authorization': `Bearer ${localStorage.getItem(TOKEN_STORAGE_NAME)}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (response.ok) {
      // You can customize the success condition based on your server response
      const successfulAuth = await response.json()

      // Store the authentication token in the local storage.
      localStorage.setItem(TOKEN_STORAGE_NAME, successfulAuth.token)
      localStorage.setItem(USER_STORAGE_NAME, JSON.stringify(successfulAuth.user))

      return successfulAuth // Assuming the presence of user data indicates authentication
    } else {
      // Handle non-OK response (e.g., unauthorized)
      return false
    }
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

/**
 * Authenticates a user by sending a sign-in request to the server.
 *
 * @param {string} email - User's email address.
 * @param {string} password - User's password.
 */
export const signIn = async (email: string, password: string) => {
  // Ensure that API_BASE is set before making the request.
  if (!API_BASE) throw new Error('API_BASE is not set.')

  try {
    // Send a POST request to the sign-in endpoint with user credentials.
    const response = await fetch(`${API_BASE}/auth/sign-in`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Parse the JSON response from the server.
    const successfulSignIn = await response.json()

    if (!response.ok) throw new Error(successfulSignIn)

    // Store the authentication token in the local storage.
    localStorage.setItem(TOKEN_STORAGE_NAME, successfulSignIn.token)
    localStorage.setItem(USER_STORAGE_NAME, JSON.stringify(successfulSignIn.user))

    // Return the authentication result.
    return successfulSignIn
  } catch (error) {
    // Handle and log any errors that occur during the sign-in process.
    console.error('Error during sign-in:', error)

    // Clear existing token, if there is one.
    signOut()

    // Re-throw the error to indicate that sign-in was unsuccessful.
    throw error
  }
}
