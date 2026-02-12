# HB CRM Company Enrichment System

AI-powered data formatting and standardization for the HB Companies CRM database using DeepSeek AI.

## Overview

This system automatically formats and standardizes existing company data in the "HB | Contacts & Companies" Airtable base. Unlike the contacts enrichment system, this focuses on **formatting existing data** rather than merging from multiple sources.

### Features

- ✅ **Smart Formatting**: AI-driven standardization of all company fields
- 🌐 **URL Standardization**: Formats website and social media URLs correctly
- 📞 **Phone Formatting**: International format with + prefix
- 📧 **Email Validation**: Lowercase, trimmed, comma-separated
- 🏢 **Address Parsing**: Structured address components
- 🤖 **DeepSeek AI**: Intelligent data analysis and formatting
- ⚡ **Batch Processing**: Handles large datasets efficiently
- 🧪 **Test Mode**: Validate on 10 records before full run

## Configuration

### Airtable Setup

- **Base ID**: `appLp3fajmG8rtPT9` (HB | Contacts & Companies)
- **Table ID**: `tblSkHc4c2mSQ6Osx` (Companies CRM)
- **Source View**: `viwj01Ix6bJcit1RA` (Update Records)
- **Target View**: `viwDWt3VxUHgxrXu3` (Live Database)

### Status Workflow

Records with `Status (Live) = "To Enrich"` are processed and updated to:
- ✅ **Complete**: Successfully formatted
- ⚠️ **Conflicts**: Data inconsistencies found (needs review)
- ❌ **Error**: Validation failures

## Fields Formatted

### Company Information
- Company Name (Live)
- Type (Live)
- Talent Type (Live)

### Contact Details
- Soc Website (Live)
- Soc Emails (Live)
- Soc Phones (Live)
- Phone (Live)
- Fax (Live)

### Social Media
- Soc Instagram (Live)
- Soc Facebook (Live)
- Soc Linkedin (Live)
- Soc Twitter (Live)

### Address Components
- Address (Live)
- City (Live)
- State (Live)
- Postcode (Live)
- Country (Live)

### Metadata
- Status (Live)
- Last Checked
- Notes AI
- Enrichment Log

## Installation

```bash
# Install dependencies
npm install

# Create .env file with your credentials
cp .env.example .env

# Edit .env with your API keys
nano .env
```

## Usage

### Test Mode (10 records)
```bash
npm test
```

### Production Mode (all records)
```bash
npm start
```

### Build TypeScript
```bash
npm run build
```

## Formatting Rules

### Website URLs
- Remove "www." prefix
- Ensure http:// or https:// protocol
- Example: `www.company.com` → `http://company.com`

### Social Media URLs
- Full URLs with proper protocol
- Instagram: `https://instagram.com/username`
- Facebook: `https://facebook.com/company`
- LinkedIn: `https://linkedin.com/company/name`
- Twitter: `https://twitter.com/handle`

### Phone Numbers
- International format with + prefix
- Spaces for readability
- Example: `+1 XXX XXX XXXX`

### Email Addresses
- Lowercase
- Trimmed whitespace
- Comma-separated if multiple
- Example: `admin@company.com, info@company.com`

### Addresses
- Full format with all components
- Structured: Street, City, State, Postcode, Country
- Clean up repetitive or malformed data

## AI Prompt Logic

The DeepSeek AI analyzes each company record and:

1. **Standardizes URLs**: Formats website and social media links
2. **Validates Phones**: International format with + prefix
3. **Cleans Emails**: Lowercase, trimmed, validated
4. **Parses Addresses**: Extracts city, state, postcode, country
5. **Detects Issues**: Flags true errors and conflicts only
6. **Logs Changes**: Tracks all modifications with reasoning

### Confidence Threshold

- **Minimum**: 90% confidence required for updates
- **Below Threshold**: Record marked as "Conflicts" for review

## Error Handling

### Conflict Detection
- Data inconsistencies
- Ambiguous information
- Contradictory values

### Error Reporting
- Only major validation failures
- NOT formatting improvements
- NOT missing data

### Computed Fields
The system automatically skips these read-only fields:
- Emails (Contacts)
- Contacts (Live)
- Updates

## Project Structure

```
crm-companies-ai-enrichment/
├── src/
│   └── index.ts          # Main enrichment logic
├── dist/                 # Compiled JavaScript
├── .env                  # Environment variables (not in git)
├── .env.example          # Template for configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Environment Variables

```env
DEEPSEEK_API_KEY=your_deepseek_api_key
AIRTABLE_TOKEN=your_airtable_token
AIRTABLE_BASE_ID=appLp3fajmG8rtPT9
AIRTABLE_TABLE_ID=tblSkHc4c2mSQ6Osx
AIRTABLE_SOURCE_VIEW_ID=viwj01Ix6bJcit1RA
AIRTABLE_TARGET_VIEW_ID=viwDWt3VxUHgxrXu3
CONFIDENCE_THRESHOLD=90
TEST_LIMIT=10
```

## Cost Estimation

Based on ~1,868 companies:
- **API Calls**: ~1,868 calls to DeepSeek
- **Estimated Cost**: $30-45 (at $0.016-$0.024 per call)
- **Processing Time**: ~31 minutes (1-second delay between records)

## Deployment

### GitHub Actions (Automated)

See [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md) for automation setup with daily scheduled runs.

### Manual Run

```bash
# Test first
npm test

# Review results, then run full
npm start
```

## Related Systems

- **Contact Enrichment**: [hb-crm-contacts-enrichment](https://github.com/yunikonlabsdevelopment-alt/hb-crm-contacts-enrichment)

## Support

For issues or questions, contact the development team.

---

**Last Updated**: 2025
