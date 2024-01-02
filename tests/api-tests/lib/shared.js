const { randomUUID } = require('node:crypto')

const TEST_USER_UNIQUE_PART = 'apitest'

/**
 * Generate a unique email address.
 *
 * @param {string} [email] Custom emial to use. Be sure to include '{+}' in the email.
 */
const getUniqueEmail = (email = process.env.API_TEST_EMAIL) => {
  const unique = `+${TEST_USER_UNIQUE_PART}${Date.now()}`
  return email.replace('{+}', unique)
}

/**
 * Generate a random valid password.
 */
const getGeneratedPassword = () => {
  return randomUUID() + 'A123!'
}

/**
 * Sign up a new user.
 *
 * @param {object} [user]
 * @param {string} [user.email] The user's email.
 * @param {string} [user.password] The user's password.
 * @returns {Promise<object>} The user - email, password, refreshToken, accessToken.
 */
const signUpUser = async ({ email, password } = {}) => {
  const newUser = {
    email: email || getUniqueEmail(),
    password: password || getGeneratedPassword(),
  }

  const response = await fetch(`${process.env.API_HOST}/auth/sign-up`, {
    method: 'POST',
    body: JSON.stringify({
      ...newUser,
      confirmPassword: newUser.password,
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
 * Authenticate the access token.
 *
 * @param {string} accessToken
 */
const authenticateAccessToken = async (accessToken) => {
  return fetch(`${process.env.API_HOST}/auth`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(accessToken),
    },
  })
}

/**
 * Refresh the access token.
 *
 * @param {string} refreshToken The user's refresh token.
 */
const refreshAccessToken = async (refreshToken) => {
  return fetch(`${process.env.API_HOST}/auth/refresh-token`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(refreshToken),
    },
    credentials: 'include',
  })
}

const cleanupTests = async () => {
  return fetch(`${process.env.API_HOST}/admin/cleanup-tests`, { method: 'GET' })
}

const getTestUser = async (accessToken) => {
  return fetch(`${process.env.API_HOST}/admin/test-user`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(accessToken),
    },
  })
}

const updateTestUser = async (accessToken, body) => {
  return fetch(`${process.env.API_HOST}/admin/test-user`, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: {
      ...getAuthHeader(accessToken),
    },
  })
}

module.exports = {
  authenticateAccessToken,
  cleanupTests,
  getAuthHeader,
  getGeneratedPassword,
  getTestUser,
  getUniqueEmail,
  refreshAccessToken,
  signInUser,
  signUpUser,
  updateTestUser,
}