# Quick Start Guide

Get the HB Company CRM enrichment system running in 5 minutes.

## Prerequisites

- Node.js 20+
- DeepSeek API key
- Airtable personal access token

## Step 1: Clone and Install

```bash
git clone https://github.com/yunikonlabsdevelopment-alt/hb-crm-companies-enrichment.git
cd hb-crm-companies-enrichment
npm install
```

## Step 2: Configure Environment

Create `.env` file:

```env
DEEPSEEK_API_KEY=sk-your-api-key-here
AIRTABLE_TOKEN=pat.your-token-here
AIRTABLE_BASE_ID=appLp3fajmG8rtPT9
AIRTABLE_TABLE_ID=tblSkHc4c2mSQ6Osx
AIRTABLE_SOURCE_VIEW_ID=viwj01Ix6bJcit1RA
AIRTABLE_TARGET_VIEW_ID=viwDWt3VxUHgxrXu3
CONFIDENCE_THRESHOLD=90
TEST_LIMIT=10
```

## Step 3: Test Run

```bash
npm test
```

This will process 10 companies in test mode. Review the results:
- ✅ **Complete**: Successfully formatted
- ⚠️ **Conflicts**: Review in Airtable
- ❌ **Error**: Check error messages

## Step 4: Review Results

1. Open Airtable: https://airtable.com/appLp3fajmG8rtPT9/tblSkHc4c2mSQ6Osx
2. Check the "Live Database" view
3. Review "Status (Live)" column for test records
4. Check "Notes AI" for any conflicts/errors

## Step 5: Production Run

If test results look good:

```bash
npm start
```

## What Gets Formatted

### URLs
- Website: Remove www., ensure http://
- Social: Full URLs with proper protocol

### Contact Info
- Phones: +1 XXX XXX XXXX format
- Emails: lowercase, trimmed

### Addresses
- Parsed into: City, State, Postcode, Country
- Cleaned up repetitive text

## Status Updates

Records move through:
1. **To Enrich** → (processing) → **Complete**
2. **To Enrich** → (issues found) → **Conflicts** or **Error**

## Common Issues

### "Computed field" errors
Fixed in v1.0 - system now skips read-only fields automatically.

### Low confidence scores
AI is conservative - review "Conflicts" records manually.

### Address formatting
AI cleans up repetitive text but may need manual review for complex cases.

## Next Steps

- Review [README.md](README.md) for detailed documentation
- Set up automated runs with [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)
- Check [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for technical details

## Cost & Time

- **~1,868 companies** to process
- **~31 minutes** total time (1-second delay)
- **~$30-45** estimated cost

## Support

Questions? Check the documentation or contact the development team.
