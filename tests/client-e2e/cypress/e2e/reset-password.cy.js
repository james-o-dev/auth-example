import { cleanUpTests, generateUser, getTestUser } from '../support/shared'

describe('Reset Password Spec', () => {
  let userAccount

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

  beforeEach(() => {
    cy.intercept('/auth/reset-password/request').as('requestEmail')
    cy.visit('/')
    cy.get('header a').contains('Sign in').click()
    cy.get('a').contains('Reset password').click()
  })

  it('passes', () => {
    const { password: newPassword } = generateUser()

    cy.get('input[name="email"]').type(userAccount.email)
    cy.get('button').contains('Send verification email').click()

    cy.wait('@requestEmail').then(async () => {
      const data = await getTestUser()
      const { code } = JSON.parse(data.resetPassword)

      // Change password form.
      cy.get('input[name="code"]').type(code)
      cy.get('input[name="newPassword"]').type(newPassword)
      cy.get('input[name="confirmPassword"]').type(newPassword)
      cy.get('button').contains('Change password').click()

      // Should be redirected to sign in.
      cy.url().should('include', '/sign-in')

      // Attempt to sign in again.
      cy.get('input[name="email"]').type(userAccount.email)
      cy.get('input[name="password"]').type(newPassword)
      cy.get('button').contains('Sign In').click()

      // Sign in successful.
      cy.get('h1').contains('Profile').should('exist')
    })
  })

  it('email does not exist', () => {
    const { email } = generateUser()

    cy.get('input[name="email"]').type(email)
    cy.get('button').contains('Send verification email').click()

    cy.on('window:alert', (str) => {
      expect(str.message).to.contains('Email not found')
    })
  })

  it('incorrect code', () => {
    const { password: newPassword } = generateUser()

    cy.get('input[name="email"]').type(userAccount.email)
    cy.get('button').contains('Send verification email').click()

    cy.wait('@requestEmail')

    // Change password form.
    cy.get('input[name="code"]').type('code')
    cy.get('input[name="newPassword"]').type(newPassword)
    cy.get('input[name="confirmPassword"]').type(newPassword)
    cy.get('button').contains('Change password').click()

    cy.on('window:alert', (str) => {
      expect(str.message).to.contains('Invalid code')
    })
  })

  it('passwords do not match', () => {
    const { password: newPassword } = generateUser()

    cy.get('input[name="email"]').type(userAccount.email)
    cy.get('button').contains('Send verification email').click()

    cy.wait('@requestEmail')

    // Change password form.
    cy.get('input[name="code"]').type('code')
    cy.get('input[name="newPassword"]').type(newPassword)
    cy.get('input[name="confirmPassword"]').type(userAccount.password)
    cy.get('button').contains('Change password').click()

    cy.get('li').contains('Passwords do not match').should('exist')
  })

  it('no password', () => {
    const { password: newPassword } = generateUser()

    cy.get('input[name="email"]').type(userAccount.email)
    cy.get('button').contains('Send verification email').click()

    cy.wait('@requestEmail')

    // Change password form.
    cy.get('input[name="code"]').type('code')
    cy.get('input[name="newPassword"]').clear()
    cy.get('input[name="confirmPassword"]').type(newPassword)
    cy.get('button').contains('Change password').click()

    cy.get('input[name="newPassword"]:invalid').should('exist')
  })

  it('invalid passwords', () => {
    cy.get('input[name="email"]').type(userAccount.email)
    cy.get('button').contains('Send verification email').click()

    cy.wait('@requestEmail')

    // Change password form.
    cy.get('input[name="code"]').type('code')

    const passwords = [
      'NoSpecialCharacters',
      'NOLOWERCASELETTER1!',
      'nouppercaseletter2!',
      'noNUMBER!',
    ]
    passwords.forEach(password => {
      cy.get('input[name="newPassword"]').clear()
      cy.get('input[name="confirmPassword"]').clear()

      cy.get('input[name="newPassword"]').type(password)
      cy.get('input[name="confirmPassword"]').type(password)
      cy.get('button').contains('Change password').click()
      cy.get('li').contains('Password must contain at least')
    })
  })
})