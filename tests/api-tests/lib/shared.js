const { randomUUID } = require('node:crypto')

const TEST_USER_UNIQUE_PART = 'apitest'

/**
 * Sign up a new user.
 *
 * @returns {Promise<object>} The user - email, password, refreshToken, accessToken.
 */
const signUpUser = async () => {
  const unique = `+${TEST_USER_UNIQUE_PART}${Date.now()}`
  const email = process.env.API_TEST_EMAIL.replace('{+}', unique)
  const password = randomUUID() + 'A123!'
  const newUser = {
    email,
    password,
  }

  const response = await fetch(`${process.env.API_HOST}/auth/sign-up`, {
    method: 'POST',
    body: JSON.stringify({
      ...newUser,
      confirmPassword: password,
    }),
  })
  const data = await response.json()
  if (!response.ok) {
    console.error(data)
    throw new Error('Could not sign up user.')
  }

  const user = {
    ...newUser,
    ...data,
  }

  return user
}

/**
 * Get the authorization header.
 *
 * @param {string} token
 */
const getAuthHeader = (token) => {
  return { Authorization: `Bearer ${token}` }
}

/**
 * Sign in a user.
 *
 * @param {object} user
 * @param {string} user.email The user's email.
 * @param {string} user.password The user's password.
 * @returns {Promise<Response>} The response.
 */
const signInUser = async (user) => {
  return fetch(`${process.env.API_HOST}/auth/sign-in`, {
    method: 'POST',
    body: JSON.stringify({
      email: user.email,
      password: user.password,
    }),
  })
}

/**
 * Refresh the access token.
 *
 * @param {object} user
 * @param {string} user.refreshToken The user's refresh token.
 */
const refreshAccessToken = async (user) => {
  return fetch(`${process.env.API_HOST}/auth/refresh-token`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(user.refreshToken),
    },
    credentials: 'include',
  })
}

const cleanupTests = async () => {
  return fetch(`${process.env.API_HOST}/admin/cleanup-tests`, { method: 'GET' })
}

module.exports = {
  signUpUser,
  getAuthHeader,
  signInUser,
  refreshAccessToken,
  cleanupTests,
}