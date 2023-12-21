
/**
 * Helper to build a Lambda response object.
 *
 * @param {number} statusCode
 * @param {*} body
 * @param {*} [options]
 */
const buildLambdaResponse = (statusCode, body, options = {}) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body)
  }
}

// index.js
export const handler = async (event) => {
  try {
    // Get attributes of the request.
    const reqBody = JSON.parse(event.body)
    const reqMethod = event.httpMethod
    const reqPath = event.path
    const reqResourcePath = event.requestContext.resourcePath
    const reqPathParameters = event.pathParameters
    const reqQueryStringParameters = event.queryStringParameters

    // Console log attributes.
    console.log({
      // reqBody,
      reqMethod,
      reqPath,
      reqPathParameters,
      reqQueryStringParameters,
      reqResourcePath,
    })

    if (reqPath === '/health' && reqMethod === 'GET') return buildLambdaResponse(200, 'I am healthy! ❤❤❤')

    // API not found or implemented.
    return buildLambdaResponse(404, 'API endpoint not found')

  } catch (error) {
    console.error('Error:', error)
    return buildLambdaResponse(500, 'Internal Server Error')
  }
}
