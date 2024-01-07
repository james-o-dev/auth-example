const TEST_USER_UNIQUE_PART = '+apitest'

export const cleanUpTests = async () => {

  return fetch(`${Cypress.env('API_HOST')}/admin/cleanup-tests`, {
    method: 'GET',
    headers: {
      origin: Cypress.env('DEV_CLIENT_HOST'),
    },
  })
}

export const generateUser = () => {
  const unique = `${TEST_USER_UNIQUE_PART}${Date.now()}`
  return {
    email: Cypress.env('API_TEST_EMAIL').replace('{+}', unique),
    password: `${Math.random()}Aa123!`.replace('.',''),
  }
}