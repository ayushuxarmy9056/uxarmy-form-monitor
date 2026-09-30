# UXArmy hourly form monitor

This Cypress suite opens every configured form, fills it, checks the controls, and—when live submission is explicitly enabled—submits it and validates every mutating API response.

## Run locally

```bash
npm install
npm test
```

Do **not** run the spec with `node cypress/e2e/forms.cy.js`. The `describe`, `it`, and `cy` globals are supplied by Cypress, not Node. Running the file directly produces `ReferenceError: describe is not defined`.

The default is a safe dry run: it fills and validates but does not submit a production lead.

To test actual submission, use a dedicated QA/test inbox and run:

```bash
CYPRESS_testEmail=qa-inbox@your-company.com CYPRESS_liveSubmit=true npm test
```

## Configured forms

All 16 supplied forms are configured in `cypress/fixtures/forms.json`. Add future forms with one object per form:

```json
{
  "name": "Descriptive name",
  "url": "https://uxarmy.com/path/",
  "api": "**/wp-json/uxarmy/v1/submit-contact-sales"
}
```

Forms using the same field names work without code changes. If a form uses different field names or a different API route, update its fixture and the `values` mapping in `cypress/e2e/forms.cy.js`.

## Free five-hour hosting with GitHub Actions

1. Create a GitHub repository and push this project.
2. In **Settings → Secrets and variables → Actions → Secrets**, add `FORM_TEST_EMAIL` with a QA inbox.
3. Run **Actions → Five-hour form monitor → Run workflow** once to confirm the dry run.
4. Only after the site owner approves hourly test leads, add repository variable `LIVE_FORM_SUBMISSION=true`.

The cron runs at 00:17, 05:17, 10:17, 15:17, and 20:17 UTC. Every run publishes a summary with its result and logs link. A failed run opens (or comments on) a `form-monitor` GitHub issue and uploads screenshots/API results for seven days. GitHub may delay scheduled jobs during busy periods. Public repositories have free standard-runner usage; private repositories use the account's included Actions minutes.

GitHub's own email/web notifications can also report failed workflow runs. Enable them under **GitHub → Settings → Notifications → Actions**.

## Email report after every run

The workflow can email a PASS/FAIL report after every manual or scheduled run. Add these under **Settings → Secrets and variables → Actions → Repository secrets**:

- `SMTP_USERNAME`: dedicated sender email address.
- `SMTP_APP_PASSWORD`: email-provider app password; never use the normal account password.
- `REPORT_TO`: one recipient or a comma-separated list of recipients.

Optional secrets for non-Gmail providers:

- `SMTP_HOST` (defaults to `smtp.gmail.com`).
- `SMTP_PORT` (defaults to `465`).
- `SMTP_SECURE` (defaults to `true`).
- `REPORT_FROM` (defaults to the SMTP username).

For Gmail, enable two-step verification and generate an App Password for the dedicated sender account. If the required secrets are absent, email is skipped without failing the form tests.

### Email through Google Apps Script (no SMTP account)

If SMTP/App Passwords are unavailable, deploy `google-apps-script/Code.gs` as a Google Apps Script Web App:

1. Replace `REPLACE_WITH_A_LONG_RANDOM_SECRET` with a long random token.
2. Deploy as **Web app**, execute as **Me**, and allow access to **Anyone**.
3. Authorize Gmail/MailApp access and copy the `/exec` Web App URL.
4. Add GitHub Secrets `REPORT_WEBHOOK_URL` (the `/exec` URL) and `REPORT_WEBHOOK_TOKEN` (the same random token).
5. Keep `REPORT_TO` set to the report recipients. SMTP secrets are not needed when both webhook secrets exist.

Never commit the real token to Git. Enter it only in the private Apps Script editor and the GitHub repository secret.

## What is checked

- Page and primary form load.
- Fields can be populated and retain their values.
- Consent checkboxes and submit control are usable.
- The expected primary submission API is called in live mode.
- Every POST/PUT/PATCH/DELETE made during submission returns HTTP 2xx or 3xx.
- The primary response body is present; when it contains a `success` property, it must be `true`.
- Failures produce screenshots; live runs also save an API-call JSON artifact.

Do not enable hourly live submission against production without an agreed QA email/domain, server-side suppression of CRM notifications, and rate-limit approval. A staging endpoint is preferable.
