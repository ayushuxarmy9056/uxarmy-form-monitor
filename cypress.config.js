const { defineConfig } = require('cypress')
const fs = require('fs')
const path = require('path')

const resultsDirectory = path.join(__dirname, 'cypress', 'results')
const failuresFile = path.join(resultsDirectory, 'failures.json')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on) {
      on('before:run', () => {
        fs.mkdirSync(resultsDirectory, { recursive: true })
        fs.writeFileSync(failuresFile, '[]\n')
      })

      on('task', {
        recordFailure(failure) {
          let failures = []
          if (fs.existsSync(failuresFile)) {
            failures = JSON.parse(fs.readFileSync(failuresFile, 'utf8'))
          }
          failures.push(failure)
          fs.writeFileSync(failuresFile, `${JSON.stringify(failures, null, 2)}\n`)
          return null
        }
      })
    },
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 30000,
    retries: { runMode: 2, openMode: 0 }
  },
  env: {
    liveSubmit: false,
    testEmail: 'form-monitor@example.com'
  }
})
