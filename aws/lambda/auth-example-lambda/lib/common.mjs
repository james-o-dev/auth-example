
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
 * Helper to build a Lambda response object.
 *
 * @param {number} statusCode
 * @param {*} body
 * @param {*} [options]
 */
export const buildLambdaResponse = (statusCode, body, options = {}) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body)
  }
}