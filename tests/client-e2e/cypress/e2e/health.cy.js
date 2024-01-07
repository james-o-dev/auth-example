describe('Check health', () => {
  it('passes', () => {
    cy.visit('/')

    cy.get('h2').should('contain', 'Hello World!')
    cy.get('p').should('contain', 'API health: I am healthy! ❤❤❤')
  })
})