import { cleanUpTests, generateUser, getTestUser } from '../support/shared'
import { Totp, generateConfig } from 'time2fa'

describe('Change Password Spec', () => {
  let userAccount

  beforeEach(() => {
    cy.intercept('PUT', '/auth/totp/add').as('addTotp')

    // Sign in.
    const { email, password } = userAccount
    cy.signIn(email, password)

    cy.get('nav button').contains('Two-factor auth').click()
  })

  before(() => {
    cy.visit('/')

    userAccount = generateUser()
    const { email, password } = userAccount
    cy.signUp(email, password)
    cy.get('header a').contains('Sign out').click()
  })

  after(async () => {
    await cleanUpTests()
  })

  const generateOtp = (secret) => {
    const config = generateConfig()
    const codes = Totp.generatePasscodes({ secret }, config)
    return codes[0]
  }

  it('Add/activate/remove TOTP', () => {
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
})