// authService.ts

const API_BASE = '' // Add the API Gateway base URL here.
if (!API_BASE) throw new Error('API_BASE is not set.')

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
 * Helper: Add the authentication token to the request headers.
 */
const authHeader = () => {
  return {
    Authorization: `Bearer ${localStorage.getItem(TOKEN_STORAGE_NAME)}`
  }
}

/**
 * Fetches the health status from the API endpoint.
 */
export const apiHealth = async () => {
  try {
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
    // Simulate an asynchronous operation, e.g., fetching user data from a server
    const response = await fetch(`${API_BASE}/auth`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(), // Add the authentication token to the request headers.
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

    // Clear existing tokens, if there are any.
    signOut()

    // Re-throw the error to indicate that sign-in was unsuccessful.
    throw error
  }
}

/**
 * Signs up and authenticates the newly created user.
 *
 * This function is similar to signIn(), but it creates a new user in the database.
 * It is recommended to use signIn() instead of signUp() if you already have a user account.
 *
 * This function also stores the authentication token in the local storage.
 *
 * @param {string} email - User's email address.
 * @param {string} password - User's password.
 * @param {string} confirmPassword - User's password, re-confirmed.
 */
export const signUp = async (email: string, password: string, confirmPassword: string) => {

  try {
    // Send a POST request to the sign-in endpoint with user credentials.
    const response = await fetch(`${API_BASE}/auth/sign-up`, {
      method: 'POST',
      body: JSON.stringify({ email, password, confirmPassword }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Parse the JSON response from the server.
    const successfulSignUp = await response.json()

    if (!response.ok) throw new Error(successfulSignUp)

    // Store the authentication token in the local storage.
    localStorage.setItem(TOKEN_STORAGE_NAME, successfulSignUp.token)
    localStorage.setItem(USER_STORAGE_NAME, JSON.stringify(successfulSignUp.user))

    // Return the authentication result.
    return successfulSignUp
  } catch (error) {
    // Handle and log any errors that occur during the sign-in process.
    console.error('Error during sign-up:', error)

    // Clear existing tokens, if there are any.
    signOut()

    // Re-throw the error to indicate that sign-in was unsuccessful.
    throw error
  }
}

/**
 * Changes the user's password.
 *
 * @param {string} oldPassword
 * @param {string} newPassword
 * @param {string} confirmPassword
 */
export const changePassword = async (oldPassword: string, newPassword: string, confirmPassword: string) => {

  // Send a POST request to the sign-in endpoint with user credentials.
  const response = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(), // Add the authentication token to the request headers.
    },
    credentials: 'include',
  })

  // Parse the JSON response from the server.
  const successfulChangePassword = await response.json()

  if (!response.ok) throw new Error(successfulChangePassword)

  // Store the authentication token in the local storage.
  localStorage.setItem(TOKEN_STORAGE_NAME, successfulChangePassword.token)
  localStorage.setItem(USER_STORAGE_NAME, JSON.stringify(successfulChangePassword.user))

  // Return the authentication result.
  return successfulChangePassword
}