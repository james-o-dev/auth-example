import { buildLambdaResponse, buildValidationError, generateRandomString } from './lib/common.mjs'
import { getCommand, putCommand, queryCommand, updateCommand, } from './lib/dynamodb.mjs'

import { randomUUID } from 'crypto'
import jsonwebtoken from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import { gmailSend } from './lib/mail.mjs'

// Environment variables.
const AUTH_INDEX_NAME = process.env.AUTH_INDEX_NAME
if (!AUTH_INDEX_NAME) throw new Error('Missing AUTH_INDEX_NAME environment variable')
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET
if (!ACCESS_TOKEN_SECRET) throw new Error('Missing ACCESS_TOKEN_SECRET environment variable')
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET
if (!REFRESH_TOKEN_SECRET) throw new Error('Missing REFRESH_TOKEN_SECRET environment variable')
const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME
if (!USERS_TABLE_NAME) throw new Error('Missing USERS_TABLE_NAME environment variable')

const ACCESS_TOKEN_EXPIRY = '10m'
const REFRESH_TOKEN_EXPIRY = '7d'

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
 * Generate an access token.
 *
 * @param {*} payload
 */
const generateAccessToken = (payload) => jsonwebtoken.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY })

/**
 * Generate a refresh token.
 *
 * @param {*} payload
 */
const generateRefreshToken = (payload) => jsonwebtoken.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY, })

/**
 * Verify an access token.
 *
 * @param {*} payload
 */
const verifyAccessToken = (token) => jsonwebtoken.verify(token, ACCESS_TOKEN_SECRET)

/**
 * Verify a refresh token.
 *
 * @param {*} payload
 */
const verifyRefreshToken = (token) => jsonwebtoken.verify(token, REFRESH_TOKEN_SECRET)

/**
 * Helper: Get an 'iat' value for this current time.
 */
const getIATNow = () => Math.round(Date.now() / 1000)

/**
 * Helper: Update the iat value for a user in the database.
 * * If the refresh token is issued before this iat, it is not valid.
 * * Should be called before a new refresh token is issued, to avoid new refresh tokens being immedtiately invalid.
 *
 * @param {string} userId
 */
const updateUserIAT = (userId) => updateCommand(USERS_TABLE_NAME, { userId }, { iat: getIATNow() })

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
 * Helper: Get the token from the auth header.
 *
 * @param {*} reqHeaders
 */
const getAuthHeaderToken = (reqHeaders) => {
  const authHeader = reqHeaders.Authorization
  if (!authHeader) return null

  const incomingToken = authHeader.split(' ')[1]
  if (!incomingToken) return null

  return incomingToken
}

/**
 * Helper: Verify the provided JWT token.
 *
 * @param {*} reqHeaders
 * @param {boolean} [isRefreshToken=false]
 */
const verifyAuth = (reqHeaders, isRefreshToken = false) => {
  try {
    const incomingToken = getAuthHeaderToken(reqHeaders)
    if (!incomingToken) return null

    return isRefreshToken ? verifyRefreshToken(incomingToken) : verifyAccessToken(incomingToken)
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
  try {
    const verified = verifyAuth(reqHeaders)
    if (!verified) throw buildValidationError(401, 'Unauthorized.')
    return buildLambdaResponse(200, { message: 'Token verified.', })
  } catch (_) {
    throw buildValidationError(401, 'Unauthorized.')
  }
}

/**
 * Endpoint to refresh access token.
 *
 * @param {*} reqHeaders
 */
const refreshTokenEndpoint = async (reqHeaders) => {
  const throwUnauth = (message = 'Unauthorized.') => {
    throw buildValidationError(401, message)
  }

  try {
    const { email, userId, iat } = verifyAuth(reqHeaders, true)

    // Check database that the user is authentic and is allowed access.
    const getUser = await getCommand(USERS_TABLE_NAME, { userId })
    if (getUser.Item.email !== email) throwUnauth()
    if (getUser.Item.iat && parseInt(iat) < parseInt(getUser.Item.iat)) throw throwUnauth('Refresh token has expired; Please sign in again.')

    // Generate new jwts.
    const user = getJwtPayload(email, userId)
    const accessToken = generateAccessToken(user)
    // const refreshToken = generateRefreshToken(user) // Can generate a new refresh token here, if we want to use 'rolling' refresh tokens.

    // Respond.
    return buildLambdaResponse(200, { message: 'New access token issued.', accessToken, })
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
  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)

  // Respond.
  return buildLambdaResponse(201, { message: 'User has been created.', accessToken, refreshToken, })
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

  // Create JWTs.
  const user = getJwtPayload(email, userId)
  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)

  // Successful login.
  return buildLambdaResponse(200, { message: 'Sign in successful.', accessToken, refreshToken })
}

/**
 * Invalidating all the refresh tokens for the user
 *
 * @param {*} reqHeaders
 */
const signOutEndpoint = async (reqHeaders) => {
  try {
    const { userId } = verifyAuth(reqHeaders)
    await updateUserIAT(userId)
    return buildLambdaResponse(204, { message: 'Sign out successful.' })

  } catch (_) {
    throw buildValidationError(401, 'Unauthorized')
  }
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
  // Invalidate existing refresh tokens.
  await updateCommand(USERS_TABLE_NAME, { userId }, { hashedPassword, iat: getIATNow() })

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
  const newPassword = `${generateRandomString(4)}-${generateRandomString(4)}-${generateRandomString(4)}`

  // Hash the password.
  const hashedPassword = await hashPassword(newPassword)

  // Update the password in the DB.
  // Invalidate existing refresh tokens.
  await updateCommand(USERS_TABLE_NAME, { userId }, { hashedPassword, iat: getIATNow() })

  // Send the new password to the user.
  await gmailSend({
    to: reqBody.email,
    subject: 'auth-example: Password reset',
    html: `
      <div>Hi,</div>
      <br>
      <div>Your new password is:</div>
      <div><strong>${newPassword}</strong></div>
      <br>
      <div>It is recommended to change this password to your own preference at your earliest convenience.</div>
    `
  })

  // Respond.
  return buildLambdaResponse(200, { message: 'An auto-generated password has been mailed to you.' })

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

    // Refresh token route.
    if (reqPath === '/auth/refresh-token' && reqMethod === 'GET') response = await refreshTokenEndpoint(reqHeaders)

    // Sign Up route.
    if (reqPath === '/auth/sign-up' && reqMethod === 'POST') response = await signUpEndpoint(reqBody)

    // Sign In route.
    if (reqPath === '/auth/sign-in' && reqMethod === 'POST') response = await signInEndpoint(reqBody)

    // Sign Out route.
    if (reqPath === '/auth/sign-out' && reqMethod === 'DELETE') response = await signOutEndpoint(reqHeaders)

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
