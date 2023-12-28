const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN
const GMAIL_USER_EMAIL = process.env.GMAIL_USER_EMAIL

if (!GMAIL_CLIENT_ID) throw new Error('Missing GMAIL_CLIENT_ID environment variable')
if (!GMAIL_CLIENT_SECRET) throw new Error('Missing GMAIL_CLIENT_SECRET environment variable')
if (!GMAIL_REFRESH_TOKEN) throw new Error('Missing GMAIL_REFRESH_TOKEN environment variable')
if (!GMAIL_USER_EMAIL) throw new Error('Missing GMAIL_USER_EMAIL environment variable')

import { createTransport } from 'nodemailer'
import { google } from 'googleapis'
const OAuth2 = google.auth.OAuth2

/**
 * Returns an access token for the Gmail API.
 */
const getAccessToken = async () => {
  const oauth2Client = new OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  )

  oauth2Client.setCredentials({
    refresh_token: GMAIL_REFRESH_TOKEN,
  })

  return oauth2Client.getAccessToken()
}

/**
 * Sends an email using the Gmail API.
 * * Currently does not support attachments.
 *
 * @param {Object} params - The email parameters
 * @param {string} params.to - The recipient email address
 * @param {string} params.subject - The email subject
 * @param {string} params.text - The email body text
 * @param {string} params.html - The email body HTML
 */
export const gmailSend = async ({ to, subject, text, html }) => {

  const accessToken = await getAccessToken()

  // Create transporter
  const transporter = createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: GMAIL_USER_EMAIL,
      accessToken,
      clientId: GMAIL_CLIENT_ID,
      clientSecret: GMAIL_CLIENT_SECRET,
      refreshToken: GMAIL_REFRESH_TOKEN,
    },
  })

  // Build email
  // Send email
  return transporter.sendMail({
    from: GMAIL_USER_EMAIL,
    to,
    subject,
    text,
    html,
  })
}
