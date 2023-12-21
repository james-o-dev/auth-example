import { buildLambdaResponse, buildValidationError } from './lib/common.mjs'
import { putCommand } from './lib/dynamodb.mjs'

import { randomUUID } from 'crypto'
import jsonwebtoken from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET
const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME

/**
 * Helper: Has a password.
 *
 * @param {string} password
 */
const hashPassword = async (password) => {
  const saltRounds = 10
  const hashedPassword = await bcryptjs.hash(password, saltRounds)
  return hashedPassword
}

/**
 * Helper: Generate JWT token
 *
 * @param {*} payload
 * @param {string} expiresIn
 */
const generateToken = (payload, expiresIn = '1h') => {
  const options = { expiresIn } // Set expiration time as needed.

  return jsonwebtoken.sign(payload, JWT_SECRET, options)
}

/**
 * Helper: Do sign up and sign in validation.
 * * Throws a 400 error if they are invalid.
 * * TODO: Replace with API Gateway validation
 *
 * @param {*} reqBody
 */
const signInValidation = (reqBody) => {
  if (!reqBody) throw buildValidationError(400, 'Invalid request body.')
  if (!reqBody.email) throw buildValidationError(400, 'Invalid email.')
  if (!reqBody.password) throw buildValidationError(400, 'Invalid password.')

  return { email: reqBody.email, password: reqBody.password, }
}

const findUserViaEmail = async (email) => {

}

/**
 * Handle the auth endpoint.
 */
const authEndpoint = async () => {
  // TODO
  throw buildValidationError(501, 'Not yet implemented. Check back soon...')
}

/**
 * Handle the sign-up endpoint
 *
 * @param {*} reqBody
 */
const signUpEndpoint = async (reqBody) => {
  const { email, password } = signInValidation(reqBody)

  // Check that the email already exists.
  // TODO do scan on email
  if (false) {
    // TODO
    throw buildValidationError(409, 'Email already in use.')
  }

  // Hash the password.
  const hashedPassword = await hashPassword(password)
  // Generate a UUID.
  const userId = randomUUID()

  // Store in DB.
  await putCommand(USERS_TABLE_NAME, { userId }, {
    email,
    hashedPassword,
    dateCreated: Date.now(),
  })

  // Create JWT.
  const jwt = generateToken({ email, userId })

  // Respond.
  return buildLambdaResponse(201, { jwt, message: 'User has been created.' })
}

/**
 * Handle the sign-in endpoint.
 *
 * @param {reqBody} reqBody
 */
const signInEndpoint = async (reqBody) => {
  const { email, password } = signInValidation(reqBody)

  // Find email and hashedPassword.
  if(!'TODO If not found...') {
    throw buildValidationError(401, 'Invalid email or password')
  }

  // Else if found, we have the email and the userId.

  // Generate token.

  // TODO
  throw buildValidationError(501, 'Not yet implemented. Check back soon...')
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
      // reqBody, // Do not log the body, for privacy purposes.
      reqMethod,
      reqPath,
      reqPathParameters,
      reqQueryStringParameters,
      reqResourcePath,
    })

    // By default, the API is not found or implemented.
    let response = buildLambdaResponse(404, 'API endpoint not found')

    // Health route.
    if (reqPath === '/health' && reqMethod === 'GET') response = buildLambdaResponse(200, 'I am healthy! ❤❤❤')

    // Auth route.
    if (reqPath === '/auth' && reqMethod === 'GET') response = await authEndpoint()

    // Sign Up route.
    if (reqPath === '/auth/sign-up' && reqMethod === 'POST') response = await signUpEndpoint(reqBody)

    // Sign In route.
    if (reqPath === '/auth/sign-in' && reqMethod === 'POST') response = await signInEndpoint()

    // Respond.
    return response

  } catch (error) {
    if (error.validation) return buildLambdaResponse(error.code, error.message)

    console.error('Error:', error)
    return buildLambdaResponse(500, 'Internal Server Error')
  }
}
