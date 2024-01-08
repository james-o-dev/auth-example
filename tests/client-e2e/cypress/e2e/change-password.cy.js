import { cleanUpTests, generateUser } from '../support/shared'

describe('Change Password Spec', () => {
  let userAccount

  beforeEach(() => {
    // Sign in.
    cy.visit('/sign-in')
    fillSignInForm()

    // Switch to change password.
    signInButton()
  })

  const fillSignInForm = () => {
    cy.get('input[name="email"]').type(userAccount.email)
    cy.get('input[name="password"]').type(userAccount.password)
    cy.get('button').contains('Sign In').click()
  }
  const signInButton = () => {
    cy.get('div.fixed button').contains('Change password').click()
  }

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
    const { password: newPassword } = generateUser()
    cy.get('input[name="oldPassword"]').type(userAccount.password)
    cy.get('input[name="newPassword"]').type(newPassword)
    cy.get('input[name="confirmPassword"]').type(newPassword)
    cy.get('form button[type="submit"]').contains('Change password').click()

    userAccount.password = newPassword

    // Redirects to sign in page.
    cy.url().should('include', '/sign-in')
    // Sign in using new password
    fillSignInForm()
    // Successful.
    cy.get('h1').contains('Profile').should('exist')
  })

  it('empty password fields', () => {
    const { password: newPassword } = generateUser()

    const fields = [
      { fieldName: 'oldPassword', values: ['', newPassword, newPassword] },
      { fieldName: 'newPassword', values: [userAccount.password, '', newPassword] },
      { fieldName: 'confirmPassword', values: [userAccount.password, newPassword, ''] },
    ]

    fields.forEach(({ fieldName, values }) => {
      const [oldPassword, newPassword, confirmPassword] = values

      cy.get('button').contains('Reset form').click()

      if (oldPassword) cy.get('input[name="oldPassword"]').type(oldPassword)
      if (newPassword) cy.get('input[name="newPassword"]').type(newPassword)
      if (confirmPassword) cy.get('input[name="confirmPassword"]').type(confirmPassword)

      cy.get('form button[type="submit"]').contains('Change password').click()

      cy.get(`input[name="${fieldName}"]:invalid`).should('exist')
    })
  })

  it('invalid password', () => {
    const passwords = [
      'NoSpecialCharacters',
      'NOLOWERCASELETTER1!',
      'nouppercaseletter2!',
      'noNUMBER!',
    ]

    passwords.forEach((password) => {
      cy.get('button').contains('Reset form').click()

      cy.get('input[name="oldPassword"]').type(userAccount.password)
      cy.get('input[name="newPassword"]').type(password)
      cy.get('input[name="confirmPassword"]').type(password)

      cy.get('form button[type="submit"]').contains('Change password').click()

      cy.get('li').contains('Password must contain at least')
    })
  })

  it('new passwords do not match', () => {
    const { password: newPassword } = generateUser()
    const { password: confirmPassword } = generateUser()

    cy.get('button').contains('Reset form').click()

    cy.get('input[name="oldPassword"]').type(userAccount.password)
    cy.get('input[name="newPassword"]').type(newPassword)
    cy.get('input[name="confirmPassword"]').type(confirmPassword)

    cy.get('form button[type="submit"]').contains('Change password').click()

    cy.get('li').contains('Passwords do not match').should('exist')
  })

  it('invalid old password', () => {
    const { password: oldPassword } = generateUser()
    const { password: newPassword } = generateUser()

    cy.get('button').contains('Reset form').click()

    cy.get('input[name="oldPassword"]').type(oldPassword)
    cy.get('input[name="newPassword"]').type(newPassword)
    cy.get('input[name="confirmPassword"]').type(newPassword)

    cy.get('form button[type="submit"]').contains('Change password').click()

    cy.on('window:alert', (str) => {
      expect(str).to.contains('Unauthorized')
    })
  })
})