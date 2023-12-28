const API_BASE = '' // Set the API Gateway base URL here.
if (!API_BASE) throw new Error('API_BASE is not set.')

export const ACCESS_TOKEN_STORAGE_NAME = 'accessToken'
export const REFRESH_TOKEN_STORAGE_NAME = 'refreshToken'
export const USER_STORAGE_NAME = 'user'

const getAccessToken = async () => {
  // TODO
  // Once access/refresh tokens are implemented server-side, determine if expired.
  // If so, get a new access token from the server, using the refresh token

  return localStorage.getItem(ACCESS_TOKEN_STORAGE_NAME)
}

/**
 * Helper: Add the authentication token to the request headers.
 */
const getAuthHeader = async () => {
  const accessToken = await getAccessToken()
  return {
    Authorization: `Bearer ${accessToken}`
  }
}

/**
 * Fetches the health status from the API endpoint.
 */
export const apiHealth = async () => {
  try {
    const response = await makeApiRequest({ endpoint: '/health', method: 'GET' })
    const healthResponse = await response.json()
    if (!response.ok) throw new Error(typeof healthResponse === 'object' ? JSON.stringify(healthResponse) : healthResponse)
    return healthResponse
  } catch (error) {
    return 'Not good ☹'
  }
}

/**
 * Makes a request to the API endpoint.
 *
 * @param {object} param0
 * @param {string} param0.endpoint - The API endpoint to make the request to.
 * @param {string} param0.method - The HTTP method to use.
 * @param {object} [param0.body] - The request body.
 * @param {HeadersInit} [param0.headers] - The request headers.
 * @param {boolean} [param0.includeCredentials] - Whether to include the authentication token in the request headers.
 * @returns {Promise<Response>} - The response from the API endpoint.
 */
export const makeApiRequest = async (
  { endpoint, method, body, headers, includeCredentials }:
    { endpoint: string; method: string; body?: object; headers?: HeadersInit; includeCredentials?: boolean }
): Promise<Response> => {

  const authHeader = includeCredentials ? await getAuthHeader() : {}

  return fetch(API_BASE + endpoint, {
    method,
    body: JSON.stringify(body),
    headers: {
      ...authHeader,
      ...headers,
    },
  })
}