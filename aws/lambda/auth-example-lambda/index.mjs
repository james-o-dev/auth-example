import { buildLambdaResponse, buildValidationError } from './lib/common.mjs'
import { putCommand, queryCommand, } from './lib/dynamodb.mjs'

import { randomUUID } from 'crypto'
import jsonwebtoken from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'

// Environment variables.
const AUTH_INDEX_NAME = process.env.AUTH_INDEX_NAME
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

/**
 * Get the auth header.
 * * Spread this in the options.header object in the response params.
 *
 * @param {string} token
 */
const getAuthHeader = (token) => {
  return { Authorization: `Bearer ${token}` }
}

/**
 * Helper: Authenticate and verify a user based on the provided request headers.
 *
 * @param {*} reqHeaders
 */
const authEndpoint = async (reqHeaders) => {
  const throwUnauth = () => {
    throw buildValidationError(401, 'Unauthorized.')
  }

  const authHeader = reqHeaders.Authorization
  if (!authHeader) throwUnauth()

  const token = authHeader.split(' ')[1]
  if (!token) throwUnauth()

  try {
    const verified = jsonwebtoken.verify(token, JWT_SECRET)

    return buildLambdaResponse(200, verified)
  } catch (_) {
    throwUnauth()
  }
}

/**
 * Handle the sign-up endpoint
 *
 * @param {*} reqBody
 */
const signUpEndpoint = async (reqBody) => {
  const { email, password } = signInValidation(reqBody)

  // Check that the email already exists.
  const findEmail = await queryCommand(USERS_TABLE_NAME, {
    indexName: AUTH_INDEX_NAME,
    attributeValues: {
      email,
    }
  })
  if (findEmail.Count) throw buildValidationError(409, 'Email already in use.')

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
  return buildLambdaResponse(201, { message: 'User has been created.' }, {
    headers: {
      ...getAuthHeader(jwt)
    }
  })
}

/**
 * Handle the sign-in endpoint.
 *
 * @param {*} reqBody
 */
const signInEndpoint = async (reqBody) => {
  const INVALID_USER_MESSAGE = 'Invalid email or password'

  const { email, password } = signInValidation(reqBody)

  const findUser = await queryCommand(USERS_TABLE_NAME, {
    indexName: AUTH_INDEX_NAME,
    attributeValues: {
      email,
    }
  })

  // Email was not found.
  if (!findUser.Count) throw buildValidationError(401, INVALID_USER_MESSAGE)

  // User was found, here is the record.
  const { hashedPassword, userId } = findUser.Items[0]

  const doesPasswordsMatch = await bcryptjs.compare(password, hashedPassword);
  if (!doesPasswordsMatch) throw buildValidationError(401, INVALID_USER_MESSAGE)

  // Else if found, we have the email and the userId.

  // Create JWT.
  const jwt = generateToken({ email, userId, })

  // Successful login.
  return buildLambdaResponse(200, { message: 'Sign in successful.' }, {
    headers: {
      ...getAuthHeader(jwt)
    }
  })
}

/**
 * Handle the auth endpoint.
 */
const signOutEndpoint = () => {
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
    const reqHeaders = event.headers

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
    if (reqPath === '/auth' && reqMethod === 'GET') response = await authEndpoint(reqHeaders)

    // Sign Up route.
    if (reqPath === '/auth/sign-up' && reqMethod === 'POST') response = await signUpEndpoint(reqBody)

    // Sign In route.
    if (reqPath === '/auth/sign-in' && reqMethod === 'POST') response = await signInEndpoint(reqBody)

    // Sign Out route.
    if (reqPath === '/auth/sign-out' && reqMethod === 'DELETE') response = await signOutEndpoint()

    // Respond.
    return response

  } catch (error) {
    if (error.validation) return buildLambdaResponse(error.code, error.message)

    console.error('Error:', error)
    return buildLambdaResponse(500, 'Internal Server Error')
  }
}
