const { randomUUID } = require('node:crypto')

const users = []

afterAll(() => {
  console.log('Clean up the following users:\n' + users.map(({ email, password }) => `e: ${email} | p: ${password}`).join('\n'))
})

// HELPERS

/**
 * Sign up a new user.
 *
 * @returns {Promise<object>} The user - email, password, refreshToken, accessToken.
 */
const signUpUser = async () => {
  const unique = `+apitest${Date.now()}`
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
  users.push(user)

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

// TESTS

test('successfully signs up user', async () => {
  const response = await signUpUser()
  expect(response.accessToken).toBeDefined()
  expect(response.refreshToken).toBeDefined()
})

test('successfully signs in user', async () => {
  const response = await signInUser(users[0])
  const data = await response.json()
  expect(response.status).toBe(200)
  expect(data.accessToken).toBeTruthy()
  expect(data.refreshToken).toBeDefined()
})

test('successfully refreshes access token', async () => {
  const response = await refreshAccessToken(users[0])
  const data = await response.json()
  expect(response.status).toBe(200)
  expect(data.accessToken).toBeTruthy()
})

test('successfully signs out user - all devices', async () => {
  let response = await fetch(`${process.env.API_HOST}/auth/sign-out`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(users[0].accessToken),
    },
    credentials: 'include',
  })
  expect(response.status).toBe(204)

  // Attempt to refresh access token. Should not allow it since it has been revoked.
  response = await refreshAccessToken(users[0])
  expect(response.status).toBe(401)
  const data = await response.json()
  expect(data).toBe('Unauthorized.')
})
