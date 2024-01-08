import { cleanUpTests, generateUser, getTestUser } from '../support/shared'

describe('Verify Email Spec', () => {
  let userAccount

  beforeEach(() => {
    cy.intercept('GET', '/auth/verify-email/request').as('verifyEmailRequest')
    const { email, password } = userAccount
    cy.signIn(email, password)
    cy.get('div.fixed button').contains('Verify email').click()
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

  it('passes', () => {
    cy.get('button').contains('Send verification email').click()

    cy.wait('@verifyEmailRequest').then(async () => {
      // Get the code from the database.
      const testUser = await getTestUser()
      const { code } = JSON.parse(testUser.verifyEmail)

      // Input the code and submit.
      cy.get('input[name="code"]').type(code)
      cy.get('form button').contains('Verify email').click()
      // Successful.
      cy.get('div').contains('Your email has been verified').should('exist')

      // Re-verify to reset and be ready for the next test.
      cy.get('button').contains('Re-verify').click()
    })
  })

  it('incorrect code', () => {
    cy.get('button').contains('Send verification email').click()

    cy.get('input[name="code"]').type('code')
    cy.get('form button').contains('Verify email').click()

    cy.on('window:alert', (str) => {
      expect(str).to.contains('Code does not match')
    })
  })

  it('no code', () => {
    cy.get('button').contains('Send verification email').click()

    cy.get('input[name="code"]').clear()
    cy.get('form button').contains('Verify email').click()

    cy.get('input[name="code"]:invalid').should('exist')
  })
})