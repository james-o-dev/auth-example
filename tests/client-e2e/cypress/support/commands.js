// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('signUp', (email, password) => {
  cy.get('header a').contains('Sign up').click()

  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.get('input[name="confirmPassword"]').type(password)

  cy.get('button').contains('Sign Up').click()

  cy.get('h1').contains('Profile').should('exist')

  cy.getAllLocalStorage().then(async (result) => {
    const localStorage = result[Cypress.env('DEV_CLIENT_HOST')]
    Cypress.env('accessToken', localStorage.accessToken)
  })
})

/**
 * Handle sign in.
 *
 * @param {string} email
 * @param {string} password
 */
Cypress.Commands.add('signIn', (email, password) => {
  cy.visit('/sign-in')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)

  cy.get('button').contains('Sign In').click()

  // if (totp) {
  //   cy.get('input[name="totp"]').type(totp)
  //   cy.get('button').contains('Sign In').click()
  // }

  cy.get('h1').contains('Profile').should('exist')

  cy.getAllLocalStorage().then(async (result) => {
    const localStorage = result[Cypress.env('DEV_CLIENT_HOST')]
    Cypress.env('accessToken', localStorage.accessToken)
  })
})