import { buildLambdaResponse, buildValidationError } from './lib/common.mjs'

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

    // Health route.
    if (reqPath === '/health' && reqMethod === 'GET') return buildLambdaResponse(200, 'I am healthy! ❤❤❤')

    // Auth route.
    if (reqPath === '/auth' && reqMethod === 'GET') {
      // TODO
      throw buildValidationError(501, 'Not yet implemented. Check back soon...')
    }

    // Sign Up route
    if (reqPath === '/auth/sign-up' && reqMethod === 'POST') {
      // TODO
      throw buildValidationError(501, 'Not yet implemented. Check back soon...')
    }

    // Sign In route
    if (reqPath === '/auth/sign-in' && reqMethod === 'POST') {
      // TODO
      throw buildValidationError(501, 'Not yet implemented. Check back soon...')
    }

    // API not found or implemented.
    return buildLambdaResponse(404, 'API endpoint not found')

  } catch (error) {
    if (error.validation) return buildLambdaResponse(error.code, error.message)

    console.error('Error:', error)
    return buildLambdaResponse(500, 'Internal Server Error')
  }
}
