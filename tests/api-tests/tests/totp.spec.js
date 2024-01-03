const sharedFunctions = require('../lib/shared')

describe('TOTP tests', () => {

  /**
   * Checks if the user has TOTP enabled.
   *
   * @param {string} accessToken
   */
  const hasTotp = async (accessToken) => {
    return fetch(`${process.env.API_HOST}/auth/totp`, {
      headers: {
        ...sharedFunctions.getAuthHeader(accessToken),
      },
    })
  }

  describe('Has TOTP', () => {
    let user

    beforeAll(async () => {
      const response = await sharedFunctions.signUpUser()
      user = response
    })

    test('Has TOTP', async () => {
      const response = await hasTotp(user.accessToken)
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      expect(data.totp).toBe(false)
    })

    test('Invalid token', async () => {
      const tokens = ['', null, user.refreshToken]

      await Promise.all(tokens.map(async (token) => {
        const response = await hasTotp(token)
        expect(response.status).toBe(401)
        expect(response.ok).toBe(false)
      }))
    })
  })


  describe('Add TOTP', () => {
    let user

    beforeAll(async () => {
      const response = await sharedFunctions.signUpUser()
      user = response
    })

    test('Adds TOTP successfully', async () => {
      let data, response

      response = await sharedFunctions.addTotp(user.accessToken)
      data = await response.json()
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      expect(data.backup.length).toBeGreaterThan(0)
      expect(data.qrcode).toBeTruthy()

      // Check if TOTP is active. It should still not be.
      response = await hasTotp(user.accessToken)
      data = await response.json()
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      expect(data.totp).toBe(false)

      // Check DB - it should have the settings saved.
      response = await sharedFunctions.getTestUser(user.accessToken)
      data = await response.json()
      expect(data.totp).toBeTruthy()

      // Allows overriding the TOTP.
      response = await sharedFunctions.addTotp(user.accessToken)
      data = await response.json()
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      expect(data.backup.length).toBeGreaterThan(0)
      expect(data.qrcode).toBeTruthy()

      // Sign in does not require a TOTP yet - it is not yet activated.
      response = await sharedFunctions.signInUser(user.email, user.password)
      data = await response.json()
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      expect(data.refreshToken).toBeTruthy()
      expect(data.accessToken).toBeTruthy()
    })

    test('Invalid token', async () => {
      const tokens = ['', null, user.refreshToken]

      await Promise.all(tokens.map(async (token) => {
        const response = await sharedFunctions.addTotp(token)
        expect(response.status).toBe(401)
        expect(response.ok).toBe(false)
      }))
    })
  })

  describe('Activate TOTP', () => {
    let user
    let totpSettings

    beforeAll(async () => {
      const response = await sharedFunctions.signUpUser()
      user = response
    })

    beforeEach(async () => {
      let response, data

      await sharedFunctions.addTotp(user.accessToken)
      response = await sharedFunctions.getTestUser(user.accessToken)
      data = await response.json()
      totpSettings = JSON.parse(data.totp)
    })

    test('TOTP successfully activated + sign-ins with TOTP', async () => {
      let response, data

      const code = sharedFunctions.getTotpCode(totpSettings.secret)
      response = await sharedFunctions.activateTotp(user.accessToken, code)
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)

      // Should invalidate existing access tokens.
      response = await sharedFunctions.authenticateAccessToken(user.accessToken)
      expect(response.status).toBe(401)
      // Should invalidate existing refresh tokens.
      response = await sharedFunctions.refreshAccessToken(user.refreshToken)
      expect(response.status).toBe(401)

      // Must sign in again because TOTP is now active.
      response = await sharedFunctions.signInUserWithTotp(user.email, user.password, totpSettings.secret)
      data = await response.json()
      user.accessToken = data.accessToken
      user.refreshToken = data.refreshToken

      // TOTP should now be active.
      response = await hasTotp(user.accessToken)
      data = await response.json()
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      expect(data.totp).toBe(true)

      // Now sign-in requires a TOTP.
      response = await sharedFunctions.signInUser(user.email, user.password)
      data = await response.json()
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      expect(data.totpRequired).toBe(true)
      expect(data.refreshToken).toBeFalsy()
      expect(data.accessToken).toBeFalsy()

      // Check using a backup code.
      const backup = totpSettings.backup[0]
      response = await sharedFunctions.signInUser(user.email, user.password, backup)
      data = await response.json()
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      expect(data.refreshToken).toBeTruthy()
      expect(data.accessToken).toBeTruthy()
      expect(data.message).toBe('Sign in successful. A backup TOTP code was used. You have 9 remaining codes left. To replenish, remove and re-add TOTP.')

      // Check database that the backup has been consumed.
      response = await sharedFunctions.getTestUser(user.accessToken)
      data = await response.json()
      const updatedTotpSettings = JSON.parse(data.totp)
      expect(updatedTotpSettings.backup.length).toBe(totpSettings.backup.length - 1)
      expect(updatedTotpSettings.backup).not.toContain(backup)
    })

    test('Invalid token', async () => {
      const tokens = ['', null, user.refreshToken]

      await Promise.all(tokens.map(async (token) => {
        const response = await sharedFunctions.activateTotp(token)
        expect(response.status).toBe(401)
        expect(response.ok).toBe(false)
      }))
    })

    test('Invalid TOTP', async () => {
      const tests = [null, '', 'code']

      await Promise.all(tests.map(async (code) => {
        const response = await sharedFunctions.activateTotp(user.accessToken, code)
        expect(response.status).toBe(401)
        expect(response.ok).toBe(false)
      }))
    })

    test('TOTP not added', async () => {
      let response = await sharedFunctions.signUpUser()
      const nonTotpUser = response

      response = await sharedFunctions.activateTotp(nonTotpUser.accessToken, 'code')
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(response.ok).toBe(false)
      expect(data).toBe('TOTP is not enabled for this user.')
    })
  })

  describe('Remove TOTP', () => {
    let user

    beforeAll(async () => {
      const response = await sharedFunctions.signUpUser()
      user = response
      await sharedFunctions.addAndActivateTotp(user.accessToken)
    })

    /**
     * Remove TOTP.
     * * Requires a current TOTP code
     *
     * @param {string} accessToken
     * @param {string} code
     */
    const removeTotp = async (accessToken, code) => {
      return fetch(`${process.env.API_HOST}/auth/totp/remove`, {
        method: 'POST',
        body: JSON.stringify({ code }),
        headers: {
          ...sharedFunctions.getAuthHeader(accessToken),
        },
      })
    }

    test('Invalid token', async () => {
      const tokens = ['', null, user.refreshToken]

      await Promise.all(tokens.map(async (token) => {
        const response = await removeTotp(token, 'code')
        expect(response.status).toBe(401)
        expect(response.ok).toBe(false)
      }))
    })

    test('TOTP successfully removed', async () => {
      let response, data

      data = await sharedFunctions.signUpUser()
      const newUser = data
      data = await sharedFunctions.addAndActivateTotp(newUser.accessToken, newUser.email, newUser.password)
      newUser.accessToken = data.accessToken
      newUser.refreshToken = data.refreshToken

      response = await removeTotp(newUser.accessToken, data.code)
      data = await response.json()
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)

      response = await hasTotp(newUser.accessToken)
      data = await response.json()
      expect(data.totp).toBe(false)
    })

    test('Invalid TOTP', async () => {
      const codes = ['', null, user.refreshToken]

      await Promise.all(codes.map(async (code) => {
        const response = await removeTotp(user.accessToken, code)
        expect(response.status).toBe(401)
        expect(response.ok).toBe(false)
      }))
    })

    test('TOTP not added', async () => {
      let response, data

      data = await sharedFunctions.signUpUser()
      const newUser = data

      response = await removeTotp(newUser.accessToken, 'code')
      data = await response.json()
      expect(response.status).toBe(400)
      expect(response.ok).toBe(false)
      expect(data).toBe('TOTP is not enabled for this user.')
    })

    test('TOTP not active', async () => {
      let response, data

      data = await sharedFunctions.signUpUser()
      const newUser = data

      // Add TOTP but don't activate it.
      await sharedFunctions.addTotp(newUser.accessToken)

      response = await removeTotp(newUser.accessToken, 'code')
      data = await response.json()
      expect(response.status).toBe(400)
      expect(response.ok).toBe(false)
      expect(data).toBe('TOTP is not active.')
    })
  })
})