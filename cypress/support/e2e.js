Cypress.on('uncaught:exception', () => false)

afterEach(function () {
  if (this.currentTest.state === 'failed') {
    cy.screenshot(`${this.currentTest.title}-failure`, { capture: 'fullPage' })
  }
})
