const TEST_USER_UNIQUE_PART = '+apitest'

/**
 * Request to clean up test records in the database.
 */
export const cleanUpTests = async () => {
  return fetch(`${Cypress.env('API_HOST')}/admin/cleanup-tests`, {
    method: 'GET',
    headers: {
      origin: Cypress.env('DEV_CLIENT_HOST'),
    },
  })
}

/**
 * Generate a test email and password
 */
export const generateUser = () => {
  const unique = `${TEST_USER_UNIQUE_PART}${Date.now()}`
  return {
    email: Cypress.env('API_TEST_EMAIL').replace('{+}', unique),
    password: `${Math.random()}Aa123!`.replace('.',''),
  }
}

/**
 * Return the test user
 * * use the accessToken currently stored in the Cypress env.
 */
export const getTestUser = async () => {
  const accessToken = Cypress.env('accessToken')

  const response = await fetch(`${Cypress.env('API_HOST')}/admin/test-user`, {
    method: 'GET',
    headers: {
      origin: Cypress.env('DEV_CLIENT_HOST'),
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const data = await response.json()
  return data
}

/**
 * Handle sign in.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} [totp]
 */
export const signIn = (email, password, totp) => {
  cy.visit('/sign-in')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.get('button').contains('Sign In').click()

  if (totp) {
    // TODO handle sign in with TOTP.
  }
}