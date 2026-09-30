const fs = require('fs')
const path = require('path')

const failurePath = path.join(process.cwd(), 'cypress', 'results', 'failures.json')
const failures = fs.existsSync(failurePath)
  ? JSON.parse(fs.readFileSync(failurePath, 'utf8'))
  : []
const status = process.env.TEST_OUTCOME || 'unknown'
const runUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
const escapeCell = (value) => String(value || '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>')

const lines = [
  '## UXArmy form monitor',
  '',
  `- Result: **${status.toUpperCase()}**`,
  '- Forms configured: **16**',
  `- Submission mode: **${process.env.CYPRESS_liveSubmit === 'true' ? 'LIVE' : 'DRY RUN'}**`,
  `- Run: [Open logs and artifacts](${runUrl})`,
  ''
]

if (failures.length) {
  lines.push('### Failed forms and errors', '', '| Form/test | Error | Attempt |', '|---|---|---|')
  failures.forEach((failure) => {
    lines.push(`| ${escapeCell(failure.test)} | ${escapeCell(failure.error)} | ${failure.attempt || 1} |`)
  })
  lines.push('', '> Screenshots and API response JSON are available from the run artifacts.')
} else {
  lines.push('### Form results', '', '✅ No Cypress failures were recorded.')
}

const markdown = `${lines.join('\n')}\n`
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown)
} else {
  process.stdout.write(markdown)
}
