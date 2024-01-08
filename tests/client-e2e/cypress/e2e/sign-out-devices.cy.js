import { cleanUpTests, generateUser } from '../support/shared'

describe('Sign out devices Spec', () => {
  beforeEach(() => {
    cy.get('div.fixed button').contains('Sign out all devices').click()
  })

  before(() => {
    cy.visit('/')
    const userAccount = generateUser()
    const { email, password } = userAccount
    cy.signUp(email, password)
  })

  after(async () => {
    await cleanUpTests()
  })

  it('passes', () => {
    cy.get('button.btn-primary').contains('Sign out of all devices').click()
    cy.url().should('include', '/sign-in')

    // Should not allow visiting profile after sign-out.
    cy.visit('/profile')
    cy.url().should('include', '/sign-in')
  })
})