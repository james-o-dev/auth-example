const sharedFunctions = require('../lib/shared')

const users = []

describe('Auth general', () => {

  afterAll(async () => {
    await sharedFunctions.cleanupTests()
  })

  describe('Sign up', () => {

    const signUpRequest = async ({ email, password, confirmPassword }) => {
      return fetch(`${process.env.API_HOST}/auth/sign-up`, {
        method: 'POST',
        body: JSON.stringify({ email, password, confirmPassword }),
      })
    }

    test('Successfully signs up user', async () => {
      const response = await sharedFunctions.signUpUser()
      expect(response.accessToken).toBeDefined()
      expect(response.refreshToken).toBeDefined()
      users.push(response)
    })

    test('Wrong email format', async () => {
      const emails = [null, '', 'wrong email']

      await Promise.all(emails.map(async email => {
        const correctPassword = sharedFunctions.getGeneratedPassword()

        const response = await signUpRequest({
          email,
          password: correctPassword,
          confirmPassword: correctPassword,
        })
        expect(response.ok).toBe(false)
        expect(response.status).toBe(400)
      }))
    })

    test('Wrong passwords', async () => {
      const passwords = [null, '', 'wrong password']

      await Promise.all(passwords.map(async password => {
        const response = await signUpRequest({
          email: sharedFunctions.getUniqueEmail(),
          password,
          confirmPassword: password,
        })
        expect(response.ok).toBe(false)
        expect(response.status).toBe(400)
      }))
    })

    test('Password not confirmed match', async () => {
      const response = await signUpRequest({
        email: sharedFunctions.getUniqueEmail(),
        password: sharedFunctions.getGeneratedPassword(),
        confirmPassword: sharedFunctions.getGeneratedPassword(),
      })
      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })
  })

  describe('Sign in', () => {
    let user

    const signInRequest = async ({ email, password }) => {
      return fetch(`${process.env.API_HOST}/auth/sign-in`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
    }

    beforeAll(async () => {
      const response = await sharedFunctions.signUpUser()
      user = response
    })

    test('Successfully signs in user', async () => {
      const response = await sharedFunctions.signInUser(user)
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      expect(data.accessToken).toBeTruthy()
      expect(data.refreshToken).toBeDefined()
    })

    test('Invalid email', async () => {
      const emails = [null, '']

      await Promise.all(emails.map(async email => {
        const response = await signInRequest({
          email,
          password: user.password,
        })
        expect(response.status).toBe(400)
        expect(response.ok).toBe(false)
      }))
    })

    test('Email not found', async () => {
      const response = await signInRequest({
        email: sharedFunctions.getUniqueEmail(),
        password: user.password,
      })
      expect(response.status).toBe(401)
      expect(response.ok).toBe(false)
    })

    test('Incorrect password', async () => {
      const response = await signInRequest({
        email: user.email,
        password: sharedFunctions.getGeneratedPassword(),
      })
      expect(response.status).toBe(401)
      expect(response.ok).toBe(false)
    })
  })

  describe('Refresh token', () => {
    let user

    const refreshTokenRequest = async (refreshToken) => {
      return fetch(`${process.env.API_HOST}/auth/refresh-token`, {
        method: 'GET',
        headers: {
          ...sharedFunctions.getAuthHeader(refreshToken),
        },
        credentials: 'include',
      })
    }

    beforeAll(async () => {
      const response = await sharedFunctions.signUpUser()
      user = response
    })

    test('Successfully refreshes access token', async () => {
      const response = await sharedFunctions.refreshAccessToken(user.refreshToken)
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)

      expect(data.accessToken).toBeTruthy()
    })

    test('Invalid refresh token', async () => {
      const tokens = [null, '', 'invalid token', user.accessToken]

      await Promise.all(tokens.map(async token => {
        const response = await refreshTokenRequest(token)
        expect(response.status).toBe(401)
        expect(response.ok).toBe(false)
      }))
    })
  })

  describe('Sign out user - all devices', () => {
    let user

    const signOutRequest = async (accessToken) => {
      return fetch(`${process.env.API_HOST}/auth/sign-out`, {
        method: 'DELETE',
        headers: {
          ...sharedFunctions.getAuthHeader(accessToken),
        },
        credentials: 'include',
      })
    }

    beforeAll(async () => {
      const response = await sharedFunctions.signUpUser()
      user = response
    })

    beforeEach(async () => {
      // Sign-in again to get new refresh and access tokens.
      const response = await sharedFunctions.signInUser({ email: user.email, password: user.password })
      const data = await response.json()
      user = {
        ...user,
        ...data,
      }
    })

    test('Successfully signs out', async () => {
      // A delay is required between sign-up/sign-in and sign out.
      // Caused by potential race condition.
      // Possibly due to DynamoDB's 'eventual write' which may cause issues.
      // Or possibly due to the JWT iat value.
      await new Promise(resolve => setTimeout(resolve, 1000))

      let response = await signOutRequest(user.accessToken)
      expect(response.status).toBe(204)

      // Attempt to refresh access token. Should not allow it since it has been revoked.
      response = await sharedFunctions.refreshAccessToken(user.refreshToken)
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data).toBe('Unauthorized.')
    })

    test('Invalid access token', async () => {
      const tokens = [null, '', 'invalid token', user.refreshToken]

      await Promise.all(tokens.map(async token => {
        const response = await signOutRequest(token)
        expect(response.status).toBe(401)
        expect(response.ok).toBe(false)
      }))
    })
  })
})