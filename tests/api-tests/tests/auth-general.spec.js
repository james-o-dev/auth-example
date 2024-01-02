const sharedFunctions = require('../lib/shared')
const users = []

describe('Auth general', () => {

  afterAll(async () => {
    await sharedFunctions.cleanupTests()
  })

  test('successfully signs up user', async () => {
    const response = await sharedFunctions.signUpUser()
    expect(response.accessToken).toBeDefined()
    expect(response.refreshToken).toBeDefined()
    users.push(response)
  })

  test('successfully signs in user', async () => {
    const response = await sharedFunctions.signInUser(users[0])
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.accessToken).toBeTruthy()
    expect(data.refreshToken).toBeDefined()
  })

  test('successfully refreshes access token', async () => {
    const response = await sharedFunctions.refreshAccessToken(users[0])
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.accessToken).toBeTruthy()
  })

  test('successfully signs out user - all devices', async () => {
    let response = await fetch(`${process.env.API_HOST}/auth/sign-out`, {
      method: 'DELETE',
      headers: {
        ...sharedFunctions.getAuthHeader(users[0].accessToken),
      },
      credentials: 'include',
    })
    expect(response.status).toBe(204)

    // Attempt to refresh access token. Should not allow it since it has been revoked.
    response = await sharedFunctions.refreshAccessToken(users[0])
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data).toBe('Unauthorized.')
  })
})
