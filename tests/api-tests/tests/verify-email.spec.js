const sharedFunctions = require('../lib/shared')

describe('Verify email tests', () => {

  /**
   * Make a request to verify email.
   *
   * @param {string} accessToken
   */
  const verifyEmailRequest = async (accessToken) => {
    return fetch(`${process.env.API_HOST}/auth/verify-email/request`, {
      headers: {
        ...sharedFunctions.getAuthHeader(accessToken),
      },
    })
  }

  /**
   * Check if email is verified.
   *
   * @param {string} accessToken
   */
  const isEmailVerified = async (accessToken) => {
    return fetch(`${process.env.API_HOST}/auth/verify-email`, {
      headers: {
        ...sharedFunctions.getAuthHeader(accessToken),
      },
    })
  }

  describe('Is email verified', () => {
    let user

    beforeAll(async () => {
      const response = await sharedFunctions.signUpUser()
      user = response
    })

    test('Verify email success', async () => {
      const response = await isEmailVerified(user.accessToken)
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      expect(data.emailVerified).toBe(false)
    })

    test('Invalid accessToken', async () => {
      const response = await isEmailVerified('user.accessToken')
      expect(response.status).toBe(401)
      expect(response.ok).toBe(false)
    })
  })

  describe('Verify email request', () => {
    let user

    beforeAll(async () => {
      const response = await sharedFunctions.signUpUser()
      user = response
    })

    test('Verify email request success', async () => {
      let response = await verifyEmailRequest(user.accessToken)
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)

      // Check the user in the DB.
      response = await sharedFunctions.getTestUser(user.accessToken)
      let data = await response.json()
      expect(data.emailVerified).toBe(false)
      expect(data.verifyEmail).toBeTruthy()

      // Check with request.
      response = await isEmailVerified(user.accessToken)
      data = await response.json()
      expect(data.emailVerified).toBe(false)
    })

    test('Invalid accessToken', async () => {
      const response = await verifyEmailRequest('user.accessToken')
      expect(response.status).toBe(401)
      expect(response.ok).toBe(false)
    })
  })

  describe('Verify email confirm', () => {
    let user

    beforeAll(async () => {
      const response = await sharedFunctions.signUpUser()
      user = response
    })

    /**
     * Confirm email verification.
     *
     * @param {string} accessToken
     * @param {string} code
     */
    const verifyEmailConfirm = async (accessToken, code) => {
      return fetch(`${process.env.API_HOST}/auth/verify-email/confirm`, {
        method: 'POST',
        body: JSON.stringify({ code }),
        headers: {
          ...sharedFunctions.getAuthHeader(accessToken),
        },
      })
    }

    const requestAndGetVerifyEmailDetail = async (accessToken) => {
      await verifyEmailRequest(user.accessToken)
      const response = await sharedFunctions.getTestUser(accessToken)
      const data = await response.json()
      return JSON.parse(data.verifyEmail)
    }

    test('Verify email confirm success', async () => {
      const verifyEmailDetail = await requestAndGetVerifyEmailDetail(user.accessToken)

      let response = await verifyEmailConfirm(user.accessToken, verifyEmailDetail.code)
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)

      // Email should now be verified
      response = await isEmailVerified(user.accessToken)
      const data = await response.json()
      expect(data.emailVerified).toBe(true)
    })

    test('Invalid accessToken', async () => {
      const response = await verifyEmailConfirm('user.accessToken', isEmailVerified.code)
      expect(response.status).toBe(401)
      expect(response.ok).toBe(false)
    })

    test('Invalid code', async () => {
      await requestAndGetVerifyEmailDetail(user.accessToken)

      const response = await verifyEmailConfirm(user.accessToken, 'invalid code')
      expect(response.status).toBe(400)
      expect(response.ok).toBe(false)
    })

    test('Verify email already confirmed', async () => {
      const verifyEmailDetail = await requestAndGetVerifyEmailDetail(user.accessToken)

      // Verify first.
      await verifyEmailConfirm(user.accessToken, verifyEmailDetail.code)

      // Verify again.
      const response = await verifyEmailConfirm(user.accessToken, isEmailVerified.code)
      expect(response.status).toBe(400)
      expect(response.ok).toBe(false)
    })
  })
})