import { cleanUpTests, generateUser, getTestUser } from '../support/shared'
import { Totp, generateConfig } from 'time2fa'

describe('TOTP Spec', () => {
  let userAccount

  after(async () => {
    await cleanUpTests()
  })

  const generateOtp = (secret) => {
    const config = generateConfig()
    const codes = Totp.generatePasscodes({ secret }, config)
    return codes[0]
  }

  it('Add/activate/remove TOTP', () => {
    cy.intercept('PUT', '/auth/totp/add').as('addTotp')
    cy.intercept('POST', '/auth/sign-in').as('signIn')

    cy.visit('/')

    userAccount = generateUser()
    const { email, password } = userAccount
    cy.signUp(email, password)

    cy.get('nav button').contains('Two-factor auth').click()
    cy.get('main button').contains('Add TOTP').click()

    cy.wait('@addTotp').then(async () => {
      let code

      const testUser = await getTestUser()
      const { secret } = JSON.parse(testUser.totp)

      // Show the TOTP content.
      cy.get('main button').contains('Show').click()

      // Check TOTP related elements are shown.
      cy.get('main img#totp-qrcode').should('exist')
      cy.get('main strong#totp-backup-codes').should('exist')

      // Prompt.
      cy.window().then(win => {
        // Get a OTP code.
        code = generateOtp(secret)
        cy.stub(win, 'prompt').returns(code)
        cy.get('main button').contains('Activate TOTP').click()
      })

      // Redirected to the sign-in form.
      cy.url().should('include', '/sign-in')

      // Attempt to sign in again.
      const { email, password } = userAccount
      cy.visit('/sign-in')
      cy.get('input[name="email"]').type(email)
      cy.get('input[name="password"]').type(password)
      cy.get('button').contains('Sign In').click()

      // Attempt to use the wrong code.
      cy.get('input[name="totp"]').type('totp')
      cy.get('button').contains('Sign In').click()
      cy.wait('@signIn')

      // Then attempt the correct one.
      // Get a OTP code.
      code = generateOtp(secret)
      cy.get('input[name="totp"]').clear()
      cy.get('input[name="totp"]').type(code)
      cy.get('button').contains('Sign In').click()

      // Now attempt to remove.
      cy.get('nav button').contains('Two-factor auth').click()

      // Prompt.
      cy.window().then(win => {
        cy.stub(win, 'prompt').returns(code)
        cy.get('main button').contains('Remove TOTP').click()
      })

      cy.get('b').contains('No ❌').should('exist')
      cy.get('main button').contains('Add TOTP').should('exist')
    })
  })

  it('Non-activated TOTP should not be applied', () => {
    cy.visit('/')
    const newUser = generateUser()
    const { email, password } = newUser
    cy.signUp(email, password)

    cy.get('nav button').contains('Two-factor auth').click()
    cy.get('main button').contains('Add TOTP').click()

    // Show the TOTP content.
    cy.get('main button').contains('Show').click()

    // Check TOTP related elements are shown.
    cy.get('main img#totp-qrcode').should('exist')
    cy.get('main strong#totp-backup-codes').should('exist')

    // Sign out.
    cy.get('header a').contains('Sign out').click()

    // Sign in again - it should allow signing in without a TOTP.
    cy.signIn(email, password)
    cy.get('h1').contains('Profile').should('exist')
  })
})