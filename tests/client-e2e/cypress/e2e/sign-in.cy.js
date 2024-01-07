import { cleanUpTests, generateUser } from '../support/shared'

describe('Sign In spec', () => {
  let user

  after(async () => {
    await cleanUpTests()
  })

  const fillSignInForm = (email, password) => {
    cy.get('input[name="email"]').clear()
    cy.get('input[name="password"]').clear()

    if (email) {
      cy.get('input[name="email"]').type(email)
    }
    if (password) {
      cy.get('input[name="password"]').type(password)
    }
  }

  const clickSignIn = () => {
    cy.get('button').contains('Sign In').click()
  }

  before(() => {
    cy.visit('/')
    user = generateUser()
    cy.signUp(user.email, user.password)
    cy.get('header a').contains('Sign out').click()
  })

  beforeEach(() => {
    cy.visit('/')
    cy.get('header a').contains('Sign in').click()
  })

  it('passes', () => {
    fillSignInForm(user.email, user.password)
    clickSignIn()

    cy.get('h1').contains('Profile').should('exist')
    cy.get('header a').contains('Sign out').click()
  })

  it('no email', () => {
    fillSignInForm('', user.password)
    clickSignIn()
    cy.get('input[name="email"]:invalid').should('exist')
  })

  it('no password', () => {
    fillSignInForm(user.email, '')
    clickSignIn()
    cy.get('input[name="password"]:invalid').should('exist')
  })

  it('wrong password', () => {
    const { password } = generateUser()

    fillSignInForm(user.email, password)
    clickSignIn()

    cy.on('window:alert', (str) => {
      expect(str).to.contain('Invalid email or password')
    })
  })
})