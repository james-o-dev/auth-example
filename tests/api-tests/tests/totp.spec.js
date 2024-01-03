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

  /**
   * Add TOTP to the user.
   *
   * @param {string} accessToken
   */
  const addTotp = async (accessToken) => {
    return fetch(`${process.env.API_HOST}/auth/totp/add`, {
      method: 'PUT',
      headers: {
        ...sharedFunctions.getAuthHeader(accessToken),
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
        ...sharedFunctions.getAuthHeader(accessToken),
      },
      body: JSON.stringify({ code }),
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

      response = await addTotp(user.accessToken)
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
      response = await addTotp(user.accessToken)
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
        const response = await addTotp(token)
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

      await addTotp(user.accessToken)
      response = await sharedFunctions.getTestUser(user.accessToken)
      data = await response.json()
      totpSettings = JSON.parse(data.totp)
    })

    test('TOTP successfully activated + sign-ins with TOTP', async () => {
      let response, data

      const code = sharedFunctions.getTotpCode(totpSettings.secret)
      response = await activateTotp(user.accessToken, code)
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
        const response = await activateTotp(token)
        expect(response.status).toBe(401)
        expect(response.ok).toBe(false)
      }))
    })

    test('Invalid TOTP', async () => {
      const tests = [null, '', 'code']

      await Promise.all(tests.map(async (code) => {
        const response = await activateTotp(user.accessToken, code)
        expect(response.status).toBe(401)
        expect(response.ok).toBe(false)
      }))
    })

    test('TOTP not added', async () => {
      let response = await sharedFunctions.signUpUser()
      const nonTotpUser = response

      response = await activateTotp(nonTotpUser.accessToken, 'code')
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
      await addAndActivateTotp(user.accessToken)
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

      await addTotp(accessToken)
      response = await sharedFunctions.getTestUser(accessToken)
      data = await response.json()
      const totpSettings = JSON.parse(data.totp)

      const code = sharedFunctions.getTotpCode(totpSettings.secret)
      await activateTotp(accessToken, code)

      response = await sharedFunctions.signInUserWithTotp(email, password, totpSettings.secret)
      data = await response.json()

      return {
        code,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }
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
      data = await addAndActivateTotp(newUser.accessToken, newUser.email, newUser.password)
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
      await addTotp(newUser.accessToken)

      response = await removeTotp(newUser.accessToken, 'code')
      data = await response.json()
      expect(response.status).toBe(400)
      expect(response.ok).toBe(false)
      expect(data).toBe('TOTP is not active.')
    })
  })
})