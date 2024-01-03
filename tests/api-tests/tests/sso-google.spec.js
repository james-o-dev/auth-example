const sharedFunctions = require('../lib/shared')

describe('Google SSO tests', () => {

  // Write a Jest test describe function
  describe('Get Google SSO link', () => {

    test('Get the link', async () => {
      let response, data

      response = await fetch(`${process.env.API_HOST}/auth/sso/google`)
      data = await response.json()
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      expect(data.url).toBeTruthy()
      expect(data.url.includes('https://accounts.google.com/o/oauth2/v2/auth?')).toBe(true)
    })
  })

  describe('Sign in with Google SSO', () => {

    /**
     * Google SSO callback request.
     *
     * @param {string} email
     * @param {string} ssoToken
     * @param {string} totpInput
     */
    const googleSSOCallback = async (email, ssoToken, totpInput) => {
      return fetch(`${process.env.API_HOST}/auth/sso/google/callback`, {
        method: 'POST',
        body: JSON.stringify({ test: email, ssoToken, totpInput }),
      })
    }

    test('Does not allow non-test emails to use the test mode', async () => {
      const response = await googleSSOCallback('test@test.com')
      expect(response.status).toBe(401)
      expect(response.ok).toBe(false)
    })

    test('Google SSO for sign-up and sign-in', async () => {
      let response, data
      const email = sharedFunctions.getUniqueEmail()

      // Sign up.
      response = await googleSSOCallback(email)
      data = await response.json()
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      expect(data.refreshToken).toBeTruthy()
      expect(data.accessToken).toBeTruthy()

      // Sign in.
      response = await googleSSOCallback(email)
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      expect(data.refreshToken).toBeTruthy()
      expect(data.accessToken).toBeTruthy()
    })

    test('Google SSO for sign-in with TOTP', async () => {
      let response, data

      // First, sign up.
      const user = await sharedFunctions.signUpUser()

      // Add TOTP.
      // Activate TOTP.
      data = await sharedFunctions.addAndActivateTotp(user.accessToken, user.email, user.password)
      user.accessToken = data.accessToken
      const totpInput = data.code

      // Attempt Google SSO callback without TOTP.
      response = await googleSSOCallback(user.email)
      data = await response.json()
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      expect(data.totpRequired).toBe(true)
      expect(data.ssoToken).toBeTruthy()
      const ssoToken = data.ssoToken

      const [response0, response1, response2] = await Promise.all([
        googleSSOCallback(user.email, user.accessToken, totpInput), // Invalid SSO
        googleSSOCallback(user.email, ssoToken, 'totpInput'), // Invalid TOTP
        googleSSOCallback(user.email, ssoToken, totpInput), // Valid sign in.
      ])
      const [data0, data1, data2] = await Promise.all([
        response0.json(),
        response1.json(),
        response2.json(),
      ])
      expect(response0.status).toBe(401)
      expect(response0.ok).toBe(false)
      expect(data0).toBe('Unauthorized.')

      expect(response1.status).toBe(401)
      expect(response1.ok).toBe(false)
      expect(data1).toBe('Invalid TOTP.')

      expect(response2.status).toBe(200)
      expect(response2.ok).toBe(true)
      expect(data2.refreshToken).toBeTruthy()
      expect(data2.accessToken).toBeTruthy()
    }, 10000)

    test('Invalid Google code', async () => {
      const response = await fetch(`${process.env.API_HOST}/auth/sso/google/callback`, {
        method: 'POST',
        body: JSON.stringify({ code: 'invalid-google-code' }),
      })
      expect(response.status).toBe(401)
      expect(response.ok).toBe(false)
    })
  })
})