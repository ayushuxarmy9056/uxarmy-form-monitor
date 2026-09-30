const nodemailer = require('nodemailer')
const fs = require('fs')
const path = require('path')

const required = ['SMTP_USERNAME', 'SMTP_APP_PASSWORD', 'REPORT_TO']
const missing = required.filter((name) => !process.env[name])

if (missing.length) {
  console.log(`Email report skipped; missing GitHub Secrets: ${missing.join(', ')}`)
  process.exit(0)
}

const status = process.env.TEST_OUTCOME || 'unknown'
const passed = status === 'success'
const runUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
const timestamp = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'full',
  timeStyle: 'long',
  timeZone: 'Asia/Kolkata'
}).format(new Date())
const failurePath = path.join(process.cwd(), 'cypress', 'results', 'failures.json')
const failures = fs.existsSync(failurePath)
  ? JSON.parse(fs.readFileSync(failurePath, 'utf8'))
  : []
const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
const failureText = failures.length
  ? `\n\nFailed forms and errors:\n${failures.map((failure, index) => `${index + 1}. ${failure.test}\n   ${failure.error}`).join('\n')}`
  : '\n\nFailed forms and errors: none'
const failureHtml = failures.length
  ? `<h3 style="color:#c62828">Failed forms and errors</h3><ol>${failures.map((failure) => `<li><strong>${escapeHtml(failure.test)}</strong><br><pre style="white-space:pre-wrap;background:#f6f8fa;padding:8px">${escapeHtml(failure.error)}</pre></li>`).join('')}</ol>`
  : '<h3 style="color:#14804a">✅ No Cypress failures were recorded</h3>'

const details = [
  `Result: ${status.toUpperCase()}`,
  'Forms configured: 16',
  `Submission mode: ${process.env.CYPRESS_liveSubmit === 'true' ? 'LIVE' : 'DRY RUN'}`,
  `Executed: ${timestamp}`,
  `Run logs and failure evidence: ${runUrl}`
].join('\n')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || 'true') === 'true',
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_APP_PASSWORD
  }
})

async function send() {
  const info = await transporter.sendMail({
    from: process.env.REPORT_FROM || `UXArmy Form Monitor <${process.env.SMTP_USERNAME}>`,
    to: process.env.REPORT_TO,
    subject: `${passed ? 'PASS' : 'FAIL'} — UXArmy 16-form monitor`,
    text: `UXArmy automated form-monitoring report\n\n${details}${failureText}`,
    html: `
      <h2 style="color:${passed ? '#14804a' : '#c62828'}">${passed ? 'PASS' : 'FAIL'} — UXArmy form monitor</h2>
      <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
        <tr><td><strong>Result</strong></td><td>${status.toUpperCase()}</td></tr>
        <tr><td><strong>Forms configured</strong></td><td>16</td></tr>
        <tr><td><strong>Submission mode</strong></td><td>${process.env.CYPRESS_liveSubmit === 'true' ? 'LIVE' : 'DRY RUN'}</td></tr>
        <tr><td><strong>Executed</strong></td><td>${timestamp}</td></tr>
      </table>
      ${failureHtml}
      <p><a href="${runUrl}">Open run logs, screenshots, and API evidence</a></p>
    `
  })

  console.log(`Email report sent: ${info.messageId}`)
}

send().catch((error) => {
  console.error(`Email report failed: ${error.message}`)
  process.exit(1)
})
