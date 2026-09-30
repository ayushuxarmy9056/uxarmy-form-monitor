// Keep this file private. Replace the placeholder with a long random value,
// deploy as a Web App, and store the same value in GitHub as REPORT_WEBHOOK_TOKEN.
const SHARED_TOKEN = 'REPLACE_WITH_A_LONG_RANDOM_SECRET'

function doPost(event) {
  try {
    const report = JSON.parse(event.postData.contents)
    if (!report.token || report.token !== SHARED_TOKEN) {
      return jsonResponse({ success: false, error: 'Unauthorized' })
    }
    if (!report.to || !report.subject || !report.text || !report.html) {
      return jsonResponse({ success: false, error: 'Missing report fields' })
    }

    MailApp.sendEmail({
      to: report.to,
      subject: report.subject,
      body: report.text,
      htmlBody: report.html,
      name: 'UXArmy Form Monitor'
    })

    return jsonResponse({ success: true })
  } catch (error) {
    return jsonResponse({ success: false, error: String(error) })
  }
}

function jsonResponse(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON)
}
