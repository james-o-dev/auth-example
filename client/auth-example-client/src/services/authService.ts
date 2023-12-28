// authService.ts

import { ACCESS_TOKEN_STORAGE_NAME, REFRESH_TOKEN_STORAGE_NAME, USER_STORAGE_NAME, makeApiRequest } from './apiService'

/**
 * Sign out procedure.
 */
export const signOut = () => {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_NAME)
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_NAME)
  localStorage.removeItem(USER_STORAGE_NAME)
}

/**
 * Fetch the API whether the user is authenticated.
 */
export const isAuthenticated = async () => {
  try {
    // Simulate an asynchronous operation, e.g., fetching user data from a server
    const response = await makeApiRequest({ endpoint: '/auth', method: 'GET', includeCredentials: true })

    if (response.ok) {
      // You can customize the success condition based on your server response
      const successfulAuth = await response.json()

      // Store the authentication token in the local storage.
      localStorage.setItem(ACCESS_TOKEN_STORAGE_NAME, successfulAuth.token)
      localStorage.setItem(USER_STORAGE_NAME, JSON.stringify(successfulAuth.user))

      return successfulAuth // Assuming the presence of user data indicates authentication
    } else {
      // Handle non-OK response (e.g., unauthorized)
      signOut()
      return false
    }
  } catch (error) {
    signOut()
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
    const response = await makeApiRequest({
      endpoint: '/auth/sign-in',
      method: 'POST',
      body: { email, password },
    })

    // Parse the JSON response from the server.
    const successfulSignIn = await response.json()

    if (!response.ok) throw new Error(successfulSignIn)

    // Store the authentication token in the local storage.
    localStorage.setItem(ACCESS_TOKEN_STORAGE_NAME, successfulSignIn.token)
    localStorage.setItem(USER_STORAGE_NAME, JSON.stringify(successfulSignIn.user))

    // Return the authentication result.
    return successfulSignIn
  } catch (error) {
    // Handle and log any errors that occur during the sign-in process.
    console.error('Error during sign-in:', error)

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
    const response = await makeApiRequest({
      endpoint: '/auth/sign-up',
      method: 'POST',
      body: { email, password, confirmPassword },
      includeCredentials: false,
    })

    // Parse the JSON response from the server.
    const successfulSignUp = await response.json()

    if (!response.ok) throw new Error(successfulSignUp)

    // Store the authentication token in the local storage.
    localStorage.setItem(ACCESS_TOKEN_STORAGE_NAME, successfulSignUp.token)
    localStorage.setItem(USER_STORAGE_NAME, JSON.stringify(successfulSignUp.user))

    // Return the authentication result.
    return successfulSignUp
  } catch (error) {
    // Handle and log any errors that occur during the sign-in process.
    console.error('Error during sign-up:', error)

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

  const response = await makeApiRequest({
    endpoint: '/auth/change-password',
    method: 'POST',
    body: { oldPassword, newPassword, confirmPassword },
    includeCredentials: true
  })

  // Parse the JSON response from the server.
  const successfulChangePassword = await response.json()

  if (!response.ok) throw new Error(successfulChangePassword)

  // Store the authentication token in the local storage.
  localStorage.setItem(ACCESS_TOKEN_STORAGE_NAME, successfulChangePassword.token)
  localStorage.setItem(USER_STORAGE_NAME, JSON.stringify(successfulChangePassword.user))

  // Return the authentication result.
  return successfulChangePassword
}

/**
 * Resets the user's password.
 *
 * @param {string} email - User's email address.
 */
export const resetPassword = async (email: string) => {
  // Send a POST request to the sign-in endpoint with user credentials.
  const response = await makeApiRequest({
    endpoint: '/auth/reset-password',
    method: 'POST',
    body: { email },
  })

  // Parse the JSON response from the server.
  const resetPasswordResponse = await response.json()

  if (!response.ok) throw new Error(resetPasswordResponse)

  // Return the authentication result.
  return resetPasswordResponse
}