Cypress.on('uncaught:exception', () => false)

afterEach(function () {
  if (this.currentTest.state === 'failed') {
    const isFinalAttempt = this.currentTest.currentRetry() === this.currentTest.retries()
    if (isFinalAttempt) {
      const error = this.currentTest.err || {}
      cy.task('recordFailure', {
        test: this.currentTest.title,
        suite: this.currentTest.parent && this.currentTest.parent.title,
        error: error.message || 'Unknown Cypress failure',
        stack: error.stack || '',
        attempt: this.currentTest.currentRetry() + 1,
        recordedAt: new Date().toISOString()
      }, { log: false })
    }
    cy.screenshot(`${this.currentTest.title}-failure`, { capture: 'fullPage' })
  }
})
