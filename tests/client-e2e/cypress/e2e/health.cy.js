describe('Check health', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('passes', () => {
    cy.get('h2').should('contain', 'Hello World!')
    cy.get('p').should('contain', 'API health: I am healthy! ❤❤❤')
  })

  it('toggle light/dark mode', () => {
    cy.get('header button img[alt="Dark mode"').click()
    cy.get('div.dark').should('exist')

    cy.get('header button img[alt="Light mode"').click()
    cy.get('div.dark').should('not.exist')
  })
})