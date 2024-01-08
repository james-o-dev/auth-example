import { Totp, generateConfig } from 'time2fa'
import { cleanUpTests, generateUser, getTestUser } from '../support/shared'

describe('Google SSO Spec', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  after(async () => {
    await cleanUpTests()
  })

  const generateOtp = (secret) => {
    const config = generateConfig()
    const codes = Totp.generatePasscodes({ secret }, config)
    return codes[0]
  }

  it('use the Google SSO button', () => {
    cy.visit('/sign-up')
    cy.get('button span').contains('Sign in with Google').click()
    cy.origin('https://accounts.google.com', () => {
      cy.url().should('include', 'accounts.google.com')
      cy.url().should('include', 'client_id')
      const redirectUriEncode = encodeURIComponent(Cypress.env('DEV_CLIENT_HOST'))
      cy.url().should('include', `&redirect_uri=${redirectUriEncode}`)
    })
  })

  it('sign up, add TOTP and sign in', () => {
    let code

    cy.intercept('PUT', '/auth/totp/add').as('addTotp')

    const { email } = generateUser()
    const encoded = encodeURIComponent(email)

    cy.visit('/google-sso-callback?test=' + encoded)

    // Check email is verified.
    cy.get('nav button').contains('Verify email').click()
    cy.get('main p').contains('Your email has been verified. ✅').should('exist')

    // Now add TOTP.
    cy.get('nav button').contains('Two-factor auth').click()
    cy.get('main button').contains('Add TOTP').click()

    cy.getAllLocalStorage().then(async (result) => {
      const localStorage = result[Cypress.env('DEV_CLIENT_HOST')]
      const accessToken = localStorage.accessToken
      Cypress.env('accessToken', accessToken)

      cy.wait('@addTotp').then(async () => {
        const testUser = await getTestUser()
        const { secret } = JSON.parse(testUser.totp)

        // Prompt.
        cy.window().then(win => {
          // Get a OTP code.
          code = generateOtp(secret)
          cy.stub(win, 'prompt').returns(code)
          cy.get('main button').contains('Activate TOTP').click()
        })

        // Redirect back to sign-in.
        cy.url().should('include', 'sign-in')

        // Sign in again.
        cy.visit('/google-sso-callback?test=' + encoded)

        // TOTP required.

        // Attempt to sign in without TOTP.
        cy.get('button').contains('Submit TOTP').click()
        cy.get('input[name="totp"]:invalid').should('exist')

        // Submit wrong code.
        cy.get('input[name="totp"]').type('code')
        cy.get('button').contains('Submit TOTP').click()

        // Submit correct code.
        code = generateOtp(secret)
        cy.get('input[name="totp"]').clear()
        cy.get('input[name="totp"]').type(code)
        cy.get('button').contains('Submit TOTP').click()

        cy.get('h1').contains('Profile').should('exist')
      })
    })
  })
})