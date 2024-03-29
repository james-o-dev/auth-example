const { randomUUID } = require('node:crypto')
const { Totp, generateConfig } = require('time2fa')

const TEST_USER_UNIQUE_PART = '+apitest'
const TEST_USER_UNIQUE_PART_2 = '+nontestuser'

const devOriginHeader = {
  origin: process.env.DEV_CLIENT_HOST,
}

/**
 * Generate a unique email address.
 *
 * @param {string} [email] Custom email to use. Be sure to include '{+}' in the email.
 */
const getUniqueEmail = (email = process.env.API_TEST_EMAIL, useSecondaryIdentifer = false) => {
  const unique = `${useSecondaryIdentifer ? TEST_USER_UNIQUE_PART_2 : TEST_USER_UNIQUE_PART}${Date.now()}`
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
    headers: devOriginHeader,
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
 * * With TOTP
 *
 * @param {string} email The user's email.
 * @param {string} password The user's password.
 * @param {string} [totp] TOTP if active
 * @returns {Promise<Response>} The response.
 */
const signInUser = async (email, password, totp) => {
  return fetch(`${process.env.API_HOST}/auth/sign-in`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      totp,
    }),
  })
}

/**
 * Generate a current TOTP, from an existing TOTP secret
 * * Using default TOTP settings
 *
 * @param {string} secret
 */
const getTotpCode = (secret) => {
  const config = generateConfig()
  const codes = Totp.generatePasscodes({ secret }, config)
  return codes[0]
}

/**
 * Sign in a user with TOTP.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} totpSecret The TOTP secret that is used to generate OTPs. Get this from the database.
 */
const signInUserWithTotp = async (email, password, totpSecret) => {
  const totp = getTotpCode(totpSecret)
  return signInUser(email, password, totp)
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
  return fetch(`${process.env.API_HOST}/admin/cleanup-tests`, { method: 'GET', headers: devOriginHeader})
}

const getTestUser = async (accessToken) => {
  return fetch(`${process.env.API_HOST}/admin/test-user`, {
    method: 'GET',
    headers: {
      ...devOriginHeader,
      ...getAuthHeader(accessToken),
    },
  })
}

const updateTestUser = async (accessToken, body) => {
  return fetch(`${process.env.API_HOST}/admin/test-user`, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: {
      ...devOriginHeader,
      ...getAuthHeader(accessToken),
    },
  })
}

/**
 * Add TOTP to the user.
 *
 * @param {string} accessToken
 */
const addTotp = async (accessToken) => {
  return fetch(`${process.env.API_HOST}/auth/totp/add`, {
    method: 'PUT',
    headers: {
      ...getAuthHeader(accessToken),
    },
  })
}

/**
 * Activate an existing TOTP auth for the user.
 *
 * @param {string} accessToken
 * @param {string} code Current TOTP
 */
const activateTotp = async (accessToken, code) => {
  return fetch(`${process.env.API_HOST}/auth/totp/activate`, {
    method: 'PUT',
    headers: {
      ...getAuthHeader(accessToken),
    },
    body: JSON.stringify({ code }),
  })
}

/**
 * Adds and activates TOTP for the user.
 * * It will also sign in again to get new tokens.
 *
 * @param {string} accessToken
 * @param {string} email
 * @param {string} password
 */
const addAndActivateTotp = async (accessToken, email, password) => {
  let response, data

  // Add TOTP.
  await addTotp(accessToken)
  // Get test user from the DB.
  response = await getTestUser(accessToken)
  data = await response.json()
  // Get the TOTP settings from the test user.
  const totpSettings = JSON.parse(data.totp)
  // Get the TOTP code.
  const code = getTotpCode(totpSettings.secret)
  await activateTotp(accessToken, code)
  // Sign in with TOTP, to get new tokens.
  response = await signInUserWithTotp(email, password, totpSettings.secret)
  data = await response.json()

  return {
    code,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  }
}

module.exports = {
  activateTotp,
  addAndActivateTotp,
  addTotp,
  authenticateAccessToken,
  cleanupTests,
  getAuthHeader,
  getGeneratedPassword,
  getTestUser,
  getTotpCode,
  getUniqueEmail,
  refreshAccessToken,
  signInUser,
  signInUserWithTotp,
  signUpUser,
  TEST_USER_UNIQUE_PART_2,
  TEST_USER_UNIQUE_PART,
  updateTestUser,
}