// authService.ts

import { ACCESS_TOKEN_STORAGE_NAME, REFRESH_TOKEN_STORAGE_NAME, USER_STORAGE_NAME, makeApiRequest, makeCommonApiRequest, refreshAccessToken } from './apiService'

// Require at least one lowercase letter, one uppercase letter, one number, and one special character, with a minimum length of 8 characters.
const PASSWORD_REGEXP = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

/**
 * Sign out procedure.
 */
export const signOut = () => {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_NAME)
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_NAME)
  localStorage.removeItem(USER_STORAGE_NAME)
}

/**
 * Validate password strength; Returns true if valid, throws validation error if not.
 *
 * @param {string} password
 */
export const validatePasswordStrength = (password: string) => {
  const passed = PASSWORD_REGEXP.test(password)
  if (passed) return { valid: true, message: 'Password strength is strong enough.' }
  return { valid: false, message: 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character, with a minimum length of 8 characters.' }
}

/**
 * Fetch the API whether the user is authenticated.
 */
export const isAuthenticated = async () => {
  /**
   * Request to verify access token.
   */
  const accessTokenRequest = makeApiRequest({ endpoint: '/auth', method: 'GET', includeCredentials: true })

  /**
   * Attempt to refresh the access token, then try again.
   */
  const retryAuth = async () => {
    await refreshAccessToken()
    const response = await accessTokenRequest
    return response.ok
  }

  try {
    const response = await accessTokenRequest

    if (response.ok) return true
    throw new Error('Not authenticated initially - try refreshing the token.')

  } catch (error) {
    // Attempt to refresh the token, then try again.
    if (await retryAuth()) {
      return true
    } else {
      // Could not refresh to get a new token; Handle non-OK response (e.g., unauthorized).
      signOut()
      return false
    }
  }
}

/**
 * Authenticates a user by sending a sign-in request to the server.
 *
 * @param {string} email - User's email address.
 * @param {string} password - User's password.
 * @param {string} [totp] - Two-factor authentication code.
 */
export const signIn = async (email: string, password: string, totp?: string) => {

  try {
    // Send a POST request to the sign-in endpoint with user credentials.
    const successfulSignIn = await makeCommonApiRequest({
      endpoint: '/auth/sign-in',
      method: 'POST',
      body: { email, password, totp },
      responseType: 'json',
    })

    // Store the authentication token in the local storage.
    localStorage.setItem(ACCESS_TOKEN_STORAGE_NAME, successfulSignIn.accessToken)
    localStorage.setItem(REFRESH_TOKEN_STORAGE_NAME, successfulSignIn.refreshToken)

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
    const successfulSignUp = await makeCommonApiRequest({
      endpoint: '/auth/sign-up',
      method: 'POST',
      body: { email, password, confirmPassword },
      includeCredentials: false,
      responseType: 'json',
    })

    // Store the authentication token in the local storage.
    localStorage.setItem(ACCESS_TOKEN_STORAGE_NAME, successfulSignUp.accessToken)
    localStorage.setItem(REFRESH_TOKEN_STORAGE_NAME, successfulSignUp.refreshToken)

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
export const changePassword = (oldPassword: string, newPassword: string, confirmPassword: string) => {
  return makeCommonApiRequest({
    endpoint: '/auth/change-password',
    method: 'POST',
    body: { oldPassword, newPassword, confirmPassword },
    includeCredentials: true,
    responseType: 'text',
  })
}

/**
 * Resets the user's password.
 *
 * @param {string} email - User's email address.
 */
export const resetPassword = (email: string) => {
  // Send a POST request to the sign-in endpoint with user credentials.
  return makeCommonApiRequest({
    endpoint: '/auth/reset-password',
    method: 'POST',
    body: { email },
    responseType: 'text',
  })
}

/**
 * Signs out all devices.
 */
export const signOutAllDevices = () => {
  return makeCommonApiRequest({
    endpoint: '/auth/sign-out',
    method: 'DELETE',
    includeCredentials: true,
    responseType: 'text',
  })
}

/**
 * Fetches the user's email verification status.
 * * If there was an error, it will return false since it was unable to verify.
 */
export const getVerifiedEmailStatus = async () => {
  try {
    const emailVerifiedResponse = await makeCommonApiRequest({
      endpoint: '/auth/verify-email',
      method: 'GET',
      includeCredentials: true,
      responseType: 'json',
    })
    // Return the authentication result.
    return emailVerifiedResponse.emailVerified
  } catch (error) {
    return false
  }
}

/**
 * Sends a request to the server to verify the user's email address.
 * * It will email the user with a verification code.
 */
export const verifyEmailRequest = () => {
  return makeCommonApiRequest({
    endpoint: '/auth/verify-email/request',
    method: 'GET',
    responseType: 'text',
    includeCredentials: true,
  })
}

/**
 * Verifies the user's email address with the code.
 *
 * @param {string} code
 */
export const verifyEmailConfirm = (code: string) => {
  return makeCommonApiRequest({
    endpoint: '/auth/verify-email/confirm',
    method: 'POST',
    body: { code },
    responseType: 'text',
    includeCredentials: true,
  })
}
