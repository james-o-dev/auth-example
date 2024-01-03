const sharedFunctions = require('../lib/shared')

describe('Test users', () => {

  describe('Get test user', () => {
    let user

    beforeAll(async () => {
      const response = await sharedFunctions.signUpUser()
      user = response
    })

    test('Should return the test user', async () => {
      const response = await sharedFunctions.getTestUser(user.accessToken)
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      expect(data.userId).toBeTruthy()
      expect(data.email).toBe(user.email)
    })

    test('Should not return a non-test user', async () => {
      // Create a 'non-test' user.
      // In truth, it will use a secondary 'identifier' that does not get validated.
      // However this secondary identifier will be removed during cleanup nonetheless.
      const nonTestEmail = sharedFunctions.getUniqueEmail(undefined, true)
      const nonTestUser = await sharedFunctions.signUpUser({ email: nonTestEmail  })

      // Attempt to get this user
      const response = await sharedFunctions.getTestUser(nonTestUser.accessToken)
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(response.ok).toBe(false)
      expect(data).toBe('Invalid test user.')
    })
  })

  describe('Update test user', () => {
    let user

    beforeAll(async () => {
      const response = await sharedFunctions.signUpUser()
      user = response
    })

    test('Should update the test user', async () => {
      let response = await sharedFunctions.updateTestUser(user.accessToken, {
        adminTest: true,
      })
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)

      // Now get the test user again.
      response = await sharedFunctions.getTestUser(user.accessToken)
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      expect(data.adminTest).toBe(true)
    })

    test('Should not update a non-test user', async () => {
      // Create a 'non-test' user.
      // In truth, it will use a secondary 'identifier' that does not get validated.
      // However this secondary identifier will be removed during cleanup nonetheless.
      const nonTestEmail = sharedFunctions.getUniqueEmail(undefined, true)
      const nonTestUser = await sharedFunctions.signUpUser({ email: nonTestEmail  })

      const response = await sharedFunctions.updateTestUser(nonTestUser.accessToken, {
        adminTest: true,
      })
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(response.ok).toBe(false)
      expect(data).toBe('Invalid test user.')
    })
  })
})