import { cleanUpTests, generateUser } from '../support/shared'

describe('Sign Up spec', () => {

  const fillSignUpForm = (email, password, confirmPassword) => {
    cy.get('header a').contains('Sign up').click()

    cy.get('button').contains('Reset Form').click()

    if (email) cy.get('input[name="email"]').type(email)
    if (password) cy.get('input[name="password"]').type(password)
    if (confirmPassword) cy.get('input[name="confirmPassword"]').type(confirmPassword)
  }

  const clickSignUp = () => {
    cy.get('button').contains('Sign Up').click()
  }

  beforeEach(() => {
    cy.visit('/')
  })

  after(async () => {
    await cleanUpTests()
  })

  it('passes', () => {
    const { email, password } = generateUser()
    cy.signUp(email, password)
  })

  it('does not pass - incorrect email', () => {
    const { password } = generateUser()

    const invalidEmail = 'invalid-email'
    fillSignUpForm(invalidEmail, password, password)
    clickSignUp()

    cy.get('input[name="email"]:invalid').should('exist')
  })

  it('does not pass - no password', () => {
    const { email } = generateUser()

    fillSignUpForm(email, '')
    clickSignUp()

    cy.get('input[name="password"]:invalid').should('exist')
  })

  it('does not pass - incorrect password', () => {
    const { email } = generateUser()

    const passwords = [
      'NoSpecialCharacters',
      'NOLOWERCASELETTER1!',
      'nouppercaseletter2!',
      'noNUMBER!',
    ]

    passwords.forEach(password => {
      fillSignUpForm(email, password, password)
      clickSignUp()
      cy.get('li').contains('Password must contain at least')
    })
  })

  it('does not pass - passwords do not match', () => {
    const { email, password } = generateUser()
    const { password: differentPassword } = generateUser()

    fillSignUpForm(email, password, differentPassword)
    clickSignUp()
    cy.get('li').contains('Passwords do not match.')
  })
})