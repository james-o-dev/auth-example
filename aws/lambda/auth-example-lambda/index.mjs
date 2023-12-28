import { buildLambdaResponse, buildValidationError, generateRandomString } from './lib/common.mjs'
import { getCommand, putCommand, queryCommand, updateCommand, } from './lib/dynamodb.mjs'

import { randomUUID } from 'crypto'
import jsonwebtoken from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'

// Environment variables.
const AUTH_INDEX_NAME = process.env.AUTH_INDEX_NAME
const JWT_SECRET = process.env.JWT_SECRET
const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME
const JWT_EXPIRY = '1h'

/**
 * Helper: Returns a standardized object of the JWT payload.
 *
 * @param {string} email
 * @param {string} userId
 */
const getJwtPayload = (email, userId) => {
  return { email, userId }
}

/**
 * Helper: Hash a password.
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
 * @param {string} [expiresIn]
 */
const generateToken = (payload, expiresIn = JWT_EXPIRY) => {
  const options = { expiresIn } // Set expiration time as needed.

  return jsonwebtoken.sign(payload, JWT_SECRET, options)
}

/**
 * Helper: Do sign in validation.
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
 * Helper: Do sign up validation.
 * * Throws a 400 error if they are invalid.
 * * TODO: Replace with API Gateway validation
 *
 * @param {*} reqBody
 */
const signUpValidation = (reqBody) => {
  if (!reqBody.confirmPassword) throw buildValidationError(400, 'Password not re-confirmed.')
  if (reqBody.password !== reqBody.confirmPassword) throw buildValidationError(400, 'Passwords do not match.')

  return { email: reqBody.email, password: reqBody.password, }
}

/**
 * Helper: Verify the provided JWT token.
 *
 * @param {*} reqHeaders
 * @returns
 */
const verifyAuth = (reqHeaders) => {
  try {
    const authHeader = reqHeaders.Authorization
    if (!authHeader) return null

    const incomingToken = authHeader.split(' ')[1]
    if (!incomingToken) return null

    return jsonwebtoken.verify(incomingToken, JWT_SECRET)
  } catch (_) {
    // Return null if the token could not be verified
    return null
  }
}

/**
 * Helper: Find a user from the provided email.
 * * Returns the Dyanamo DB response.
 * * Throws an error if there is a DB error.
 *
 * @param {string} email
 */
const findUserFromEmailQuery = (email) => {
  return queryCommand(USERS_TABLE_NAME, {
    indexName: AUTH_INDEX_NAME,
    attributeValues: {
      email,
    }
  })
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

  try {
    const { email, userId } = verifyAuth(reqHeaders)

    // Return a new extended token once verified.
    const user = getJwtPayload(email, userId)
    const token = generateToken(user)

    return buildLambdaResponse(200, { message: 'Token verified.', user, token, })
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
  signInValidation(reqBody)
  const { email, password } = signUpValidation(reqBody)

  // Check that the email already exists.
  const findEmail = await findUserFromEmailQuery(email)
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
  const user = getJwtPayload(email, userId)
  const token = generateToken(user)

  // Respond.
  return buildLambdaResponse(201, { message: 'User has been created.', user, token })
}

/**
 * Handle the sign-in endpoint.
 *
 * @param {*} reqBody
 */
const signInEndpoint = async (reqBody) => {
  const INVALID_USER_MESSAGE = 'Invalid email or password'

  const { email, password } = signInValidation(reqBody)

  const findUser = await findUserFromEmailQuery(email)

  // Email was not found.
  if (!findUser.Count) throw buildValidationError(401, INVALID_USER_MESSAGE)

  // User was found, here is the record.
  const { hashedPassword, userId } = findUser.Items[0]

  const doesPasswordsMatch = await bcryptjs.compare(password, hashedPassword)
  if (!doesPasswordsMatch) throw buildValidationError(401, INVALID_USER_MESSAGE)

  // Else if found, we have the email and the userId.

  // Create JWT.
  const user = getJwtPayload(email, userId)
  const token = generateToken(user)

  // Successful login.
  return buildLambdaResponse(200, { message: 'Sign in successful.', user, token })
}

/**
 * Handle the auth endpoint.
 * * Note: Only used if using httpOnly cookies for token storage.
 */
const signOutEndpoint = () => {
  // TODO
  throw buildValidationError(501, 'Not yet implemented. Check back soon...')
}

/**
 * Change password endpoint.
 *
 * @param {string} userId
 * @param {*} reqBody
 */
const changePasswordEndpoint = async (userId, reqBody) => {
  if (!userId) throw buildValidationError(401, 'Unauthorized.')
  if (!reqBody) throw buildValidationError(400, 'Invalid request body.')
  if (!reqBody.oldPassword) throw buildValidationError(400, 'Invalid old password.')
  if (!reqBody.newPassword) throw buildValidationError(400, 'Invalid new password.')
  if (!reqBody.confirmPassword) throw buildValidationError(400, 'Password not re-confirmed.')

  const { oldPassword, newPassword, confirmPassword } = reqBody

  if (newPassword !== confirmPassword) throw buildValidationError(400, 'Passwords do not match.')
  if (oldPassword === newPassword) throw buildValidationError(400, 'New password must not match the old one.')

  // Get old hashedPassword.
  const getUser = await getCommand(USERS_TABLE_NAME, { userId })
  const { hashedPassword: oldHashedPassword } = getUser.Item

  // Verify old password.
  const doesOldPasswordMatch = await bcryptjs.compare(oldPassword, oldHashedPassword)
  if (!doesOldPasswordMatch) throw buildValidationError(401, 'Unauthorized.')

  // Hash new password.
  const hashedPassword = await hashPassword(newPassword)

  // Update new password in DB.
  await updateCommand(USERS_TABLE_NAME, { userId }, { hashedPassword })

  // Respond.
  return buildLambdaResponse(200, { message: 'Password has been changed.' })
}

/**
 * Reset password endpoint.
 *
 * @param {*} reqBody
 */
const resetPasswordEndpoint = async (reqBody) => {
  if (!reqBody) throw buildValidationError(400, 'Invalid request body.')
  if (!reqBody.email) throw buildValidationError(400, 'Invalid email.')

  // Find email.
  const findUser = await findUserFromEmailQuery(reqBody.email)

  // If email not found, return with a 404.
  if (!findUser.Count) throw buildValidationError(404, 'Email not found.')

  const { userId } = findUser.Items[0]

  // Generate a new password.
  const newPassword = generateRandomString(8)

  // Hash the password.
  const hashedPassword = await hashPassword(newPassword)

  // Update the password in the DB.
  await updateCommand(USERS_TABLE_NAME, { userId }, { hashedPassword })

  // Send the new password to the user.
  // TODO

  // Respond.
  return buildLambdaResponse(200, { message: 'Password has been reset.', password: 'NOTE TEMP: ' + newPassword })

  // return buildLambdaResponse(501, 'Not yet implemented. Check back soon...')
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
      reqHeaders,
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

    // Reset route.
    if (reqPath === '/auth/reset-password' && reqMethod === 'POST') response = await resetPasswordEndpoint(reqBody)

    // Change Password route.
    if (reqPath === '/auth/change-password' && reqMethod === 'POST') {
      const verified = verifyAuth(reqHeaders)
      if (!verified) throw buildValidationError(401, 'Unauthorized.')

      response = await changePasswordEndpoint(verified.userId, reqBody)
    }

    // Respond.
    return response

  } catch (error) {
    if (error.validation) return buildLambdaResponse(error.code, error.message)

    console.error('Error:', error)
    return buildLambdaResponse(500, 'Internal Server Error')
  }
}
