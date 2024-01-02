const sharedFunctions = require('../lib/shared')

describe('Reset password tests', () => {

  afterAll(async () => {
    await sharedFunctions.cleanupTests()
  })

  describe('Request to reset password', () => {
    let user

    beforeAll(async () => {
      const response = await sharedFunctions.signUpUser()
      user = response
    })

    const resetPasswordRequest = async (email) => {
      return fetch(`${process.env.API_HOST}/auth/reset-password/request`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    }

    test('Successfully updates database on reset request', async () => {
      const response = await resetPasswordRequest(user.email)
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)

      // Check database that the 'resetPassword' object has been saved.
      const getUser = await sharedFunctions.getTestUser(user.accessToken)
      const data = await getUser.json()
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

  describe.skip('Confirm to reset password', () => {
    test('Updates password on successful confirm', async () => {

    })

    test('Invalid code', async () => {

    })

    test('Invalid password', async () => {

    })

    test('Passwords do not match', async () => {

    })

    test('User ID not found', async () => {

    })
  })
})