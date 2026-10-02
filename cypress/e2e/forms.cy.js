const forms = require('../fixtures/forms.json')

const values = {
  full_name: 'Automated Monitor',
  firstname: 'Automated',
  lastname: 'Monitor',
  company_name: 'UXArmy QA',
  job_title: 'QA Monitor',
  phone: '2015550123',
  country: 'Singapore',
  message: 'Scheduled automated form health check. Please ignore this QA submission.',
  business_problem: 'Automated QA check of the enquiry workflow.',
  research_market: 'Singapore',
  research_function_today: 'A small centralized research team.',
  research_team_member_in_team: '3',
  current_research: 'Singapore',
  product_decision: 'Validate the next product release.',
  marketing_question_decision: 'Validate campaign messaging.',
  preferred_study_timeline: 'Within four weeks',
  anything_else_we_should_know: 'Scheduled automated QA check; please ignore.'
}

function fillMainForm() {
  cy.get('form').filter(':has([name="email"])').not(':has(#whatsappSubmitBtn)').first().as('form')

  cy.get('@form').then(($form) => {
    cy.wrap($form.find('input, textarea, select')).each(($field) => {
      const type = ($field.attr('type') || $field.prop('tagName')).toLowerCase()
      const name = $field.attr('name')

      if (type === 'email') {
        cy.wrap($field).clear().type(Cypress.env('testEmail'))
      } else if (['text', 'tel', 'textarea'].includes(type)) {
        cy.wrap($field).clear().type(values[name] || 'Automated QA response')
      } else if (type === 'select') {
        cy.wrap($field).find('option').then(($options) => {
          const selectable = [...$options].find((option) => !option.disabled && option.value)
          if (selectable) cy.wrap($field).select(selectable.value)
        })
      }
    })

    const checkboxNames = [...new Set(
      [...$form.find('input[type="checkbox"]')]
        .map((checkbox) => checkbox.name)
        .filter(Boolean)
    )]

    checkboxNames.forEach((name) => {
      const checkboxes = $form.find('input[type="checkbox"]').filter((_, checkbox) => checkbox.name === name)

      // Select one valid answer from checkbox groups, matching normal user behaviour.
      // Standalone checkboxes (for example required consent) are still checked.
      cy.wrap(checkboxes.first()).check({ force: true })
    })

    const radioNames = [...new Set([...$form.find('input[type="radio"]')].map((radio) => radio.name))]
    radioNames.forEach((name) => {
      cy.wrap($form.find(`input[type="radio"][name="${name}"]`).first()).check({ force: true })
    })
  })
}

describe('hourly form health monitor', () => {
  forms.forEach((form) => {
    it(`${form.name}: fills the form and verifies submission APIs`, () => {
      const submissionCalls = []

      cy.intercept({ middleware: true, url: '**' }, (request) => {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
          request.on('response', (response) => {
            submissionCalls.push({
              method: request.method,
              url: request.url,
              status: response.statusCode
            })
          })
        }
      })
      cy.intercept('POST', form.api).as('primarySubmission')

      cy.visit(form.url)
      cy.get('body').should('be.visible')
      fillMainForm()

      cy.get('@form').within(() => {
        cy.get('[name="email"]').should('have.value', Cypress.env('testEmail'))
        cy.get('input[type="text"], input[type="tel"], textarea').filter(':visible').each(($field) => {
          cy.wrap($field).should('not.have.value', '')
        })
        cy.get('button[type="submit"], input[type="submit"]').should('be.visible').and('not.be.disabled')
      })

      if (!Cypress.env('liveSubmit')) {
        cy.log('Dry-run passed. Set CYPRESS_liveSubmit=true to submit and assert API responses.')
        return
      }

      cy.get('@form').find('button[type="submit"], input[type="submit"]').click()
      cy.wait('@primarySubmission', { timeout: 30000 }).then(({ request, response }) => {
        expect(request.body, 'submission request body').to.exist
        expect(response, 'submission response').to.exist
        const responseDetails = typeof response.body === 'string'
          ? response.body
          : JSON.stringify(response.body)

        cy.log(`Primary API response: ${response.statusCode} ${responseDetails}`)
        cy.writeFile(
          `cypress/results/${Cypress.spec.name}-${form.name.replace(/\W+/g, '-').toLowerCase()}-primary.json`,
          { method: request.method, url: request.url, status: response.statusCode, body: response.body }
        ).then(() => {
          expect(response.statusCode, `primary API status; response: ${responseDetails}`).to.be.within(200, 399)
          if (typeof response.body === 'object' && response.body !== null && 'success' in response.body) {
            expect(response.body.success, 'API success field').to.equal(true)
          }
        })
      })

      cy.then(() => {
        expect(submissionCalls, 'mutating API calls made during submit').not.to.be.empty
        submissionCalls.forEach((call) => {
          expect(call.status, `${call.method} ${call.url}`).to.be.within(200, 399)
        })
        cy.writeFile(`cypress/results/${Cypress.spec.name}-${form.name.replace(/\\W+/g, '-').toLowerCase()}.json`, submissionCalls)
      })
    })
  })
})
