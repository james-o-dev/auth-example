const { randomUUID } = require('node:crypto')
const sharedFunctions = require('../lib/shared')

describe('Reset password tests', () => {

  /**
   * Reset password request.
   *
   * @param {string} email
   */
  const resetPasswordRequest = async (email) => {
    return fetch(`${process.env.API_HOST}/auth/reset-password/request`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  describe('Request to reset password', () => {
    let user

    beforeAll(async () => {
      const response = await sharedFunctions.signUpUser()
      user = response
    })

    test('Successfully updates database on reset request', async () => {
      const response = await resetPasswordRequest(user.email)
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      let data = await response.json()
      expect(data.userId).toBeTruthy()

      // Add one second delay.
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Check database that the 'resetPassword' object has been saved.
      const getUser = await sharedFunctions.getTestUser(user.accessToken)
      data = await getUser.json()
      expect(data.resetPassword).toBeTruthy()
      const resetPassword = JSON.parse(data.resetPassword)
      expect(resetPassword.code).toBeTruthy()
      expect(resetPassword.expiry).toBeTruthy()
    })

    test('Email not found', async () => {
      const response = await resetPasswordRequest(sharedFunctions.getUniqueEmail())
      expect(response.status).toBe(404)
      expect(response.ok).toBe(false)
    })
  })

  describe('Confirm to reset password', () => {
    let user
    let userId
    let resetPassword

    beforeAll(async () => {
      const response = await sharedFunctions.signUpUser()
      user = response
    })

    beforeEach(async () => {
      // Do re-confirm request.
      let response = await resetPasswordRequest(user.email)
      let data = await response.json()
      userId = data.userId // Get the userId, necessary for email change.
      // Sign in again to get new token.
      // Needed when password change succeeds.
      response = await sharedFunctions.signInUser(user.email, user.password)
      data = await response.json()
      user.accessToken = data.accessToken
      user.refreshToken = data.refreshToken
      // Get test user to get reset code.
      response = await sharedFunctions.getTestUser(user.accessToken)
      data = await response.json()
      resetPassword = JSON.parse(data.resetPassword)
    })

    /**
     * Reset password confirm request.
     *
     * @param {string} userId
     * @param {string} code
     * @param {string} newPassword
     * @param {string} confirmPassword
     */
    const resetPasswordConfirm = async (userId, code, newPassword, confirmPassword) => {
      return fetch(`${process.env.API_HOST}/auth/reset-password/confirm`, {
        method: 'POST',
        body: JSON.stringify({ userId, code, newPassword, confirmPassword }),
      })
    }

    test('Updates password on successful confirm', async () => {
      const oldPassword = user.password
      const newPassword = sharedFunctions.getGeneratedPassword()
      // Make request.
      let response = await resetPasswordConfirm(userId, resetPassword.code, newPassword, newPassword)
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)

      // Should invalidate existing access tokens.
      response = await sharedFunctions.authenticateAccessToken(user.accessToken)
      expect(response.status).toBe(401)
      // Should invalidate existing refresh tokens.
      response = await sharedFunctions.refreshAccessToken(user.refreshToken)
      expect(response.status).toBe(401)

      // Check sign-in.
      const signInTests = [
        { password: oldPassword, status: 401 },
        { password: newPassword, status: 200 },
      ]
      await Promise.all(signInTests.map(async test => {
        const response = await sharedFunctions.signInUser(user.email, test.password)
        expect(response.status).toBe(test.status)
        if (test.status === 200) user.password = test.password
      }))

      // Password has been changed.
      user.password = newPassword
    })

    test('Invalid code', async () => {
      const newPassword = sharedFunctions.getGeneratedPassword()
      // Make request.
      let response = await resetPasswordConfirm(userId, newPassword, newPassword, newPassword)
      expect(response.status).toBe(400)
      expect(response.ok).toBe(false)
    })

    test('Invalid new password', async () => {
      const passwords = [null, '', 'wrong password']

      await Promise.all(passwords.map(async password => {
        // Make request.
        let response = await resetPasswordConfirm(userId, resetPassword.code, password, password)
        expect(response.status).toBe(400)
        expect(response.ok).toBe(false)
      }))
    })

    test('New password does not match', async () => {
      // Make request.
      let response = await resetPasswordConfirm(userId, resetPassword.code, sharedFunctions.getGeneratedPassword(), sharedFunctions.getGeneratedPassword())
      expect(response.status).toBe(400)
      expect(response.ok).toBe(false)
    })

    test('User ID not found', async () => {
      const newPassword = sharedFunctions.getGeneratedPassword()

      // Make request.
      let response = await resetPasswordConfirm(randomUUID(), resetPassword.code, newPassword, newPassword)
      expect(response.status).toBe(404)
      expect(response.ok).toBe(false)
    })

    test('Password already reset', async () => {
      const newPassword = sharedFunctions.getGeneratedPassword()

      // Make request.
      let response = await resetPasswordConfirm(userId, resetPassword.code, newPassword, newPassword)
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      user.password = newPassword

      // Make another.
      response = await resetPasswordConfirm(userId, resetPassword.code, newPassword, newPassword)
      await response.json()
      expect(response.status).toBe(400)
      expect(response.ok).toBe(false)
    })

    test('Code expired', async () => {
      const newPassword = sharedFunctions.getGeneratedPassword()

      const newResetPassword = {
        ...resetPassword,
        expiry: Date.now() - 99999999999, // Expired.
      }
      // Update test user to expire code.
      await sharedFunctions.updateTestUser(user.accessToken, {
        resetPassword: JSON.stringify(newResetPassword),
      })

      const response = await resetPasswordConfirm(userId, resetPassword.code, newPassword, newPassword)
      expect(response.status).toBe(400)
      expect(response.ok).toBe(false)
    })
  })
})