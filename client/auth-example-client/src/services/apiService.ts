// Process env in Vite https://vitejs.dev/guide/env-and-mode
const API_HOST = import.meta.env.VITE_API_HOST
if (!API_HOST) throw new Error('API_HOST is not defined')

export const ACCESS_TOKEN_STORAGE_NAME = 'accessToken'
export const REFRESH_TOKEN_STORAGE_NAME = 'refreshToken'

import { isExpired } from 'react-jwt'

/**
 * Helper: Get the user's refresh token
 */
const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_STORAGE_NAME) || ''

/**
 * Returns if the user has a refresh token.
 */
export const hasRefreshToken = () => !!getRefreshToken()

/**
 * Helper: Refresh the access token.
 */
export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken()

  if (!refreshToken) return ''

  try {
    // Note: Do not use the `makeApiRequest()` helper function here, or you will be stuck in an infinite loop!.
    const response = await fetch(`${API_HOST}/auth/refresh-token`, {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    })

    // It could not refresh the access token.
    if (!response.ok) return ''

    // Succesfully returned an acccess token.
    const refreshTokenResponse = await response.json()

    // Set the new access token to be returned.
    const accessToken = refreshTokenResponse.accessToken

    // Set the new access token in storage.
    localStorage.setItem(ACCESS_TOKEN_STORAGE_NAME, accessToken)

    // Return the access token
    return accessToken

  } catch (error) {
    // It could not refresh the access token.
    return ''
  }
}

/**
 * Helper: Get the access token from local storage.
 */
const getAccessToken = async () => {

  // Get access token.
  let accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_NAME) || ''

  if (!accessToken || isExpired(accessToken)) {
    accessToken = await refreshAccessToken()
  }

  return accessToken
}

/**
 * Helper: Add the authentication token to the request headers.
 */
const getAuthHeader = async () => {
  const accessToken = await getAccessToken()
  return {
    Authorization: `Bearer ${accessToken}`,
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
    { endpoint: string; method: string; body?: object; headers?: HeadersInit; includeCredentials?: boolean },
): Promise<Response> => {

  let authHeader = {}
  let credentials: RequestCredentials = 'omit'
  if (includeCredentials) {
    authHeader = await getAuthHeader()
    credentials = 'include'
  }

  return fetch(API_HOST + endpoint, {
    method,
    body: JSON.stringify(body),
    headers: {
      ...authHeader,
      ...headers,
    },
    credentials,
  })
}

/**
 * Further simplify API requests.
 *
 * @param {object} param0
 * @param {string} param0.endpoint - The API endpoint to make the request to.
 * @param {string} param0.method - The HTTP method to use.
 * @param {'json' | 'text'} param0.responseType - The response type to use.
 * @param {object} [param0.body] - The request body.
 * @param {HeadersInit} [param0.headers] - The request headers.
 * @param {boolean} [param0.includeCredentials] - Whether to include the authentication token in the request headers.
 */
export const makeCommonApiRequest = async ({
  endpoint,
  method,
  responseType,
  body,
  includeCredentials,
  headers,
}: {
  endpoint: string;
  method: string;
  responseType: 'json' | 'text';
  body?: object;
  includeCredentials?: boolean;
  headers?: HeadersInit;
}) => {
  const response = await makeApiRequest({
    endpoint,
    method,
    body,
    includeCredentials,
    headers,
  })
  let parsedResponse = null

  if (responseType === 'json') {
    parsedResponse = await response.json()
  } else if (responseType === 'text') {
    parsedResponse = await response.text()
  }

  if (!response.ok) throw new Error(parsedResponse)

  // Return the authentication result.
  return parsedResponse
}