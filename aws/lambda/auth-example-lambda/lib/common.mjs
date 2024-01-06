import { randomBytes } from 'crypto'

const API_GATEWAY_ENABLED = JSON.parse(process.env.API_GATEWAY_ENABLED || false)

const DEV_CLIENT_HOST = process.env.DEV_CLIENT_HOST || ''
const PROD_CLIENT_HOST = process.env.PROD_CLIENT_HOST || ''

const allowedOrigins = new Set([DEV_CLIENT_HOST, PROD_CLIENT_HOST])

/**
 * Returns a random string of the specified length.
 *
 * @param {number}

/**
 * Returns an object used to throw validation errors.
 *
 * @param {number} code
 * @param {string} message
 */
export const buildValidationError = (code, message) => {
  return { validation: true, code, message }
}

/**
 * Builds a standardized AWS Lambda response object with the specified status code, body, and optional headers.
 *
 * @param {number} statusCode - The HTTP status code for the response.
 * @param {*} body - The body of the response.
 * @param {Object} [options={}] - Additional options for the response.
 * @param {Object} [options.headers={}] - Additional headers to include in the response.
 */
export const buildLambdaResponse = (statusCode, body, headers) => {
  // Build and return the Lambda response object
  return {
    statusCode,
    headers,
    body,
  }
}

/**
 * Final object to respond to the client
 *
 * @param {object} responseObject - The response object.
 * @param {number} res.statusCode - The HTTP status code for the response.
 * @param {*} [res.body] - The body of the response.
 * @param {Object} [options.headers={}] - Additional headers to include in the response.
 * @param {string} origin Request origin
 */
export const lambdaRespond = ({ statusCode, body, headers }, origin) => {
  let cors = {}
  // If API Gateway is enabled, it must add the CORS headers.
  // DO NOT ENABLE if using functionUrls (i.e. not CORS), or else these headers will be added twice - which is not allowed.
  if (API_GATEWAY_ENABLED) {
    cors = {
      'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : '',
      'Access-Control-Allow-Credentials': true,
    }
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...cors,
      ...headers,
    },
    body: JSON.stringify(body),
  }
}

/**
 * Generates a cookie string based on the provided parameters.
 *
 * @function
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value of the cookie.
 * @param {number} maxAge - The maximum age of the cookie in seconds.
 * @param {boolean} [secure=false] - Indicates if the cookie should be marked as secure.
 * @returns {string} A cookie string suitable for the 'Set-Cookie' header.
 *
 * @example
 * // Usage example:
 * const cookie = makeCookie('cookie1', 'value1', 3600, true);
 *
 * // Result:
 * // 'cookie1=value1; Path=/; Max-Age=3600; Secure; HttpOnly'
 */
export const makeCookie = (name, value, maxAge, secure = false) => {
  let cookieString = `${name}=${value}; Path=/; Max-Age=${maxAge}; `
  if (secure) cookieString += 'Secure; HttpOnly'
  return cookieString.trim()
}

/**
 * Spread this in the response header options
 *
 * @param {string[]} cookies
 */
export const setCookieHeader = (cookies) => {
  return {
    'Set-Cookie': cookies,
  }
}

/**
 * Generates a random string of the specified length.
 * * Only generates with lower case and numbers.
 *
 * @param {string} length
 */
export const generateRandomString = (length) => {
  length = Math.ceil(length / 2)
  return randomBytes(length).toString('hex')
}