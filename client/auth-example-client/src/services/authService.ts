// authService.ts

import { ACCESS_TOKEN_STORAGE_NAME, REFRESH_TOKEN_STORAGE_NAME, makeApiRequest, makeCommonApiRequest, refreshAccessToken } from './apiService'

// Require at least one lowercase letter, one uppercase letter, one number, and one special character, with a minimum length of 8 characters.
const PASSWORD_REGEXP = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+-])[A-Za-z\d!@#$%^&*()_+-]{8,}$/

// Standard email format. Also includes '+' symbol.
const EMAIL_REGEXP = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

/**
 * Clear JWTs.
 */
export const clearJwt = () => {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_NAME)
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_NAME)
}

/**
 * Validate password strength.
 *
 * @param {string} password
 */
export const validatePasswordStrength = (password: string) => {
  const passed = PASSWORD_REGEXP.test(password)
  if (passed) return { valid: true, message: 'Password strength is strong enough.' }
  return { valid: false, message: 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (!@#$%^&*()_+-), with a minimum length of 8 characters.' }
}

/**
 * Validate email format.
 *
 * @param {string} email
 */
export const validateEmailFormat = (email: string) => {
  const passed = EMAIL_REGEXP.test(email)
  if (passed) return { valid: true, message: 'Email format is valid.' }
  return { valid: false, message: 'Email format is invalid' }
}

/**
 * Fetch the API whether the user is authenticated.
 */
export const isAuthenticated = async () => {
  // Initial attempt to verify.
  const response = await makeApiRequest({ endpoint: '/auth', method: 'GET', includeCredentials: true })
  // No errors, it is verified.
  if (response.ok) return true

  // Get new access token, via the refresh token.
  const newAccessToken = await refreshAccessToken()
  // New access token is already saved, it is assumed to be authenticated now.
  if (newAccessToken) return true

  // It could not refresh the token, not authenticated.
  // Also clean-up existing stored JWTs.
  clearJwt()
  return false
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
 * Request to reset the user's password.
 *
 * @param {string} email - User's email address.
 */
export const resetPasswordRequest = (email: string) => {
  // Send a POST request to the sign-in endpoint with user credentials.
  return makeCommonApiRequest({
    endpoint: '/auth/reset-password/request',
    method: 'POST',
    body: { email },
    responseType: 'json',
  })
}

/**
 * Request to reset the user's password.
 *
 * @param {string} userId
 * @param {string} code
 * @param {string} newPassword
 * @param {string} confirmPassword
 */
export const resetPasswordConfirm = (userId: string, code: string, newPassword: string, confirmPassword: string) => {
  // Send a POST request to the sign-in endpoint with user credentials.
  return makeCommonApiRequest({
    endpoint: '/auth/reset-password/confirm',
    method: 'POST',
    body: {
      userId,
      code,
      newPassword,
      confirmPassword,
    },
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

/**
 * Checks if the current user has TOTP enabled.
 */
export const hasTotp = () => {
  return makeCommonApiRequest({
    endpoint: '/auth/totp',
    method: 'GET',
    responseType: 'json',
    includeCredentials: true,
  })
}

/**
 * Removes TOTP from the user's account.
 *
 * @param {string} code - Current TOTP code provided by the user.
 */
export const removeTotp = (code: string) => {
  return makeCommonApiRequest({
    endpoint: '/auth/totp/remove',
    method: 'POST',
    responseType: 'text',
    body: { code },
    includeCredentials: true,
  })
}

/**
 * Adds TOTP to the user's account.
 */
export const addTotp = () => {
  return makeCommonApiRequest({
    endpoint: '/auth/totp/add',
    method: 'PUT',
    responseType: 'json',
    includeCredentials: true,
  })
}

/**
 * Request to activate the TOTP.
 *
 * @param {string} code - Current TOTP code provided by the user.
 */
export const activateTotp = (code: string) => {
  return makeCommonApiRequest({
    endpoint: '/auth/totp/activate',
    method: 'PUT',
    responseType: 'text',
    body: { code },
    includeCredentials: true,
  })
}

/**
 * Validates the new password.
 *
 * @param {string} newPassword
 * @param {string} confirmPassword
 * @param {string} [oldPassword] - The old password.
 */
export const validateNewPassword = (newPassword: string, confirmPassword: string, oldPassword?: string) => {
  const errorMessages: string[] = []

  if (!newPassword) errorMessages.push('Password was not defined.')

  if (newPassword !== confirmPassword) errorMessages.push('Passwords do not match.')

  const validateThePassword = validatePasswordStrength(newPassword)
  if (!validateThePassword.valid) errorMessages.push(validateThePassword.message)

  if (oldPassword && oldPassword === newPassword) errorMessages.push('New password must not match the old password.')

  return errorMessages
}

/**
 * Redirects the user to the Google SSO page.
 */
export const useGoogleSSO = async () => {
  const { url } = await makeCommonApiRequest({
    endpoint: '/auth/sso/google',
    method: 'GET',
    responseType: 'json',
  })
  window.location = url
}

/**
 * Given the code provided by the Google SSO callback, request from the server to verify and then sign-in
 * * Will sign-up if the email does not exist in the database - they will have no password.
 *
 * @param {string} code - Code provided by the Google SSO callback.
 * @param {string} [totpInput] - Two-factor authentication code.
 * @param {string} [ssoToken] - Temporary token used during SSO and TOTP.
 */
export const googleSSOCallback = async (code: string, totpInput?: string, ssoToken?: string) => {
  try {
    // Send a POST request to the sign-in endpoint with user credentials.
    const successResponse = await makeCommonApiRequest({
      endpoint: '/auth/sso/google/callback',
      method: 'POST',
      body: { code, totpInput, ssoToken },
      includeCredentials: false,
      responseType: 'json',
    })

    // Store the authentication token in the local storage.
    localStorage.setItem(ACCESS_TOKEN_STORAGE_NAME, successResponse.accessToken)
    localStorage.setItem(REFRESH_TOKEN_STORAGE_NAME, successResponse.refreshToken)

    return successResponse
  } catch (error) {
    // Handle and log any errors that occur during the sign-in process.
    console.error('Error during Google sign-in:', error)

    // Re-throw the error to indicate that sign-in was unsuccessful.
    throw error
  }
}
