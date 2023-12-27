const CORS_ORIGIN = process.env.CORS_ORIGIN
if (!CORS_ORIGIN) throw new Error('CORS_ORIGIN environment variable has not been set.')

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
export const buildLambdaResponse = (statusCode, body, options = {}) => {
  // Build and return the Lambda response object
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json',
      ...options.headers,
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
    'Set-Cookie': cookies
  }
}