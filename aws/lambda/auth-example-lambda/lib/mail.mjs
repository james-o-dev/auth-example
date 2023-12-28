const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, USER_EMAIL } = JSON.parse(process.env.NODEMAILER_AUTH)
if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !USER_EMAIL) {
  throw new Error('Missing NODEMAILER_AUTH env variables')
}

import { createTransport } from 'nodemailer'
import { google } from 'googleapis'
const OAuth2 = google.auth.OAuth2

/**
 * Returns an access token for the Gmail API.
 */
const getAccessToken = async () => {
  const oauth2Client = new OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  )

  oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN,
  })

  return oauth2Client.getAccessToken()
}

/**
 * Sends an email using the Gmail API.
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
      user: USER_EMAIL,
      accessToken,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN,
    },
  })

  // Build email
  // Send email
  return transporter.sendMail({
    from: USER_EMAIL,
    to,
    subject,
    text,
    html,
  })
}
