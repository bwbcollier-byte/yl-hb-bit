# GitHub Actions Setup for Company Enrichment

Automate daily company data formatting runs using GitHub Actions.

## Overview

GitHub Actions can run the enrichment script automatically on a schedule (e.g., daily at 2 AM UTC) or manually on demand.

## Prerequisites

- GitHub repository for the project
- DeepSeek API key
- Airtable personal access token
- All 6 environment variables configured as GitHub Secrets

## Step 1: Push Code to GitHub

```bash
# Initialize git repository
git init

# Add files
git add .
git commit -m "Initial commit - Company CRM enrichment system"

# Create GitHub repository and push
git remote add origin https://github.com/yunikonlabsdevelopment-alt/hb-crm-companies-enrichment.git
git branch -M main
git push -u origin main
```

## Step 2: Add GitHub Secrets

Navigate to your repository settings:
`https://github.com/yunikonlabsdevelopment-alt/hb-crm-companies-enrichment/settings/secrets/actions`

Click "New repository secret" and add each of these:

### Required Secrets

| Secret Name | Value | Description |
|------------|-------|-------------|
| `DEEPSEEK_API_KEY` | `sk-176de4b5569d4a51b2ad3951ec3dd07c` | DeepSeek AI API key |
| `AIRTABLE_TOKEN` | `patxFW6a0mC8jVJ9E.e07f01...` | Your Airtable PAT |
| `AIRTABLE_BASE_ID` | `appLp3fajmG8rtPT9` | HB Contacts & Companies base |
| `AIRTABLE_TABLE_ID` | `tblSkHc4c2mSQ6Osx` | Companies CRM table |
| `AIRTABLE_SOURCE_VIEW_ID` | `viwj01Ix6bJcit1RA` | Update Records view |
| `AIRTABLE_TARGET_VIEW_ID` | `viwDWt3VxUHgxrXu3` | Live Database view |

## Step 3: Create Workflow File

The workflow file is already included at `.github/workflows/enrich-companies.yml`:

```yaml
name: Enrich Company Records

on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch:  # Allow manual triggers

jobs:
  enrich:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run enrichment
        env:
          DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
          AIRTABLE_TOKEN: ${{ secrets.AIRTABLE_TOKEN }}
          AIRTABLE_BASE_ID: ${{ secrets.AIRTABLE_BASE_ID }}
          AIRTABLE_TABLE_ID: ${{ secrets.AIRTABLE_TABLE_ID }}
          AIRTABLE_SOURCE_VIEW_ID: ${{ secrets.AIRTABLE_SOURCE_VIEW_ID }}
          AIRTABLE_TARGET_VIEW_ID: ${{ secrets.AIRTABLE_TARGET_VIEW_ID }}
          CONFIDENCE_THRESHOLD: 90
          TEST_MODE: false
        run: npm start
```

## Step 4: Commit Workflow

```bash
git add .github/workflows/enrich-companies.yml
git commit -m "Add GitHub Actions workflow for automated enrichment"
git push
```

## Step 5: Generate package-lock.json

GitHub Actions uses `npm ci` which requires `package-lock.json`:

```bash
npm install --package-lock-only
git add package-lock.json
git commit -m "Add package-lock.json for CI/CD"
git push
```

## Step 6: Test Manual Run

1. Go to Actions tab: `https://github.com/yunikonlabsdevelopment-alt/hb-crm-companies-enrichment/actions`
2. Click "Enrich Company Records" workflow
3. Click "Run workflow" button
4. Select branch (main)
5. Click "Run workflow" to start manual run

## Step 7: Monitor Execution

Watch the workflow run in real-time:
- Green checkmark = Success
- Red X = Failure (check logs)

View logs by clicking on the workflow run.

## Scheduled Runs

The workflow runs automatically daily at **2 AM UTC**:
- 7 PM PST (Pacific Standard Time)
- 8 PM PDT (Pacific Daylight Time)

### Modify Schedule

Edit the cron expression in `.github/workflows/enrich-companies.yml`:

```yaml
schedule:
  - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

Common schedules:
- Every 12 hours: `0 */12 * * *`
- Every Monday: `0 2 * * 1`
- Twice daily: `0 2,14 * * *`

## Configuration

### Test Mode

The workflow runs in **production mode** by default (`TEST_MODE: false`).

To test with 10 records first, change to:
```yaml
TEST_MODE: true
```

### Confidence Threshold

Default is 90%. Adjust if needed:
```yaml
CONFIDENCE_THRESHOLD: 85
```

## Troubleshooting

### Workflow Fails: "npm ci" error

**Solution**: Generate and commit `package-lock.json`:
```bash
npm install --package-lock-only
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### Authentication Errors

**Solution**: Verify all 6 secrets are set correctly in GitHub repository settings.

### Rate Limiting

Airtable has a 5 requests/second limit. The script includes 1-second delays to stay within limits.

## Security Notes

- **Never commit** `.env` file to git
- **Never hardcode** API keys in code
- **Always use** GitHub Secrets for sensitive data
- **Review** logs to ensure no secrets are printed

## Notifications

GitHub Actions sends email notifications on workflow failures by default. Configure in:
`Settings → Notifications → Actions`

## Cost Monitoring

Each run costs ~$30-45 in DeepSeek API calls. Monitor usage in:
- DeepSeek dashboard
- GitHub Actions usage (minutes are free for public repos)

## Related Documentation

- [README.md](README.md) - Full documentation
- [QUICK_START.md](QUICK_START.md) - Getting started guide
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Technical details

---

**Last Updated**: 2025
