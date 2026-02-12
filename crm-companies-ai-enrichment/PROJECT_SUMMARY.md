# Project Summary: HB CRM Company Enrichment

## Purpose

AI-powered data formatting and standardization system for the HB Companies CRM database. Unlike the contacts enrichment system, this focuses exclusively on **formatting existing data** rather than merging from multiple external sources.

## Technical Stack

- **Language**: TypeScript 5.x
- **Runtime**: Node.js 20+
- **AI Service**: DeepSeek API (deepseek-chat model)
- **Database**: Airtable (HB | Contacts & Companies base)
- **Libraries**:
  - `airtable` - Airtable API client
  - `libphonenumber-js` - Phone number parsing/formatting
  - `dotenv` - Environment configuration

## Architecture

### Data Flow

```
Airtable (Status = "To Enrich")
  ↓
Fetch with Pagination
  ↓
For Each Company:
  1. Call DeepSeek AI
  2. Analyze & Format Data
  3. Filter Computed Fields
  4. Update Airtable
  5. Set Status (Complete/Conflicts/Error)
  ↓
Airtable (Updated Records)
```

### Key Functions

#### `fetchCompaniesToEnrich()`
- Fetches all records with `Status (Live) = "To Enrich"`
- Implements pagination (100 records per page)
- Returns array of CompanyRecord objects
- Filters from "Update Records" view

#### `callDeepSeekAI(company: CompanyRecord)`
- Sends company data to DeepSeek API
- Custom prompt with 9 critical formatting rules
- Temperature: 0.1 (deterministic)
- Max tokens: 2000
- Returns EnrichmentResult with updates, conflicts, errors

#### `updateCompanyWithEnrichment(recordId, enrichment)`
- **Filters computed fields** (Emails (Contacts), Contacts (Live), Updates)
- Writes enriched data to Airtable
- Sets status based on conflicts/errors
- Logs all changes to "Notes AI" field
- Updates "Last Checked" date

#### `standardizePhone(phone: string)`
- Uses libphonenumber-js for parsing
- Formats to international format (+1 XXX XXX XXXX)
- Handles US default country code
- Returns formatted string or original if unparseable

#### `formatDate()`
- Returns current date in YYYY.MM.DD format
- Example: "2026.02.12"
- Used for Last Checked field and AI notes timestamps

### AI Prompt Strategy

The prompt instructs DeepSeek to:

1. **Standardize URLs**: Remove www., ensure protocol
2. **Format Phones**: International format with + prefix
3. **Clean Emails**: Lowercase, trimmed, validated
4. **Parse Addresses**: Extract structured components
5. **Fix Malformed Data**: Clean up repetitive/broken text
6. **Report Only True Issues**: Not formatting improvements
7. **Skip Computed Fields**: Never update read-only fields

### Confidence Scoring

- **90%+**: Updates applied, status = Complete
- **Below 90%**: Marked as Conflicts for manual review
- Prevents low-quality automated changes

## Data Model

### CompanyRecord Interface

```typescript
interface CompanyRecord {
  id: string;
  fields: {
    'Name (Live)'?: string;
    'Company Name (Live)'?: string;
    'Soc Website (Live)'?: string;
    'Soc Instagram (Live)'?: string;
    'Soc Facebook (Live)'?: string;
    'Soc Linkedin (Live)'?: string;
    'Soc Twitter (Live)'?: string;
    'Soc Emails (Live)'?: string;
    'Soc Phones (Live)'?: string;
    'Phone (Live)'?: string;
    'Fax (Live)'?: string;
    'Address (Live)'?: string;
    'City (Live)'?: string;
    'State (Live)'?: string;
    'Postcode (Live)'?: string;
    'Country (Live)'?: string;
    'Status (Live)'?: string;
    'Last Checked'?: string;
    'Notes AI'?: string;
    'Enrichment Log'?: string;
    // Computed fields (read-only)
    'Emails (Contacts)'?: string;
    'Contacts (Live)'?: string[];
    'Updates'?: string;
  };
}
```

### EnrichmentResult Interface

```typescript
interface EnrichmentResult {
  success: boolean;
  confidence: number;  // 0-100
  updates: {
    [fieldName: string]: string;
  };
  conflicts: string[];  // Data inconsistencies
  errors: string[];     // Validation failures
  aiLog: string;        // AI reasoning
}
```

## Status Workflow

```
"To Enrich" → Processing
               ↓
       ┌───────┴────────┐
       ↓                ↓
   Complete       Conflicts/Error
```

### Status Meanings

- **To Enrich**: Ready for processing
- **Complete**: Successfully formatted, no issues
- **Conflicts**: Data inconsistencies need review
- **Error**: Major validation failures

## Field Formatting Rules

### Website URLs
- Input: `www.company.com`, `company.com`
- Output: `http://company.com`

### Social Media
- Instagram: `https://instagram.com/username`
- Facebook: `https://facebook.com/page`
- LinkedIn: `https://linkedin.com/company/name`
- Twitter: `https://twitter.com/handle`

### Phone Numbers
- Input: `4787432159`, `(478) 743-2159`
- Output: `+1 478 743 2159`

### Email Addresses
- Input: `Admin@Company.COM`, ` info@company.com `
- Output: `admin@company.com, info@company.com`

### Addresses
- Cleans repetitive text
- Extracts structured components
- Adds country if missing

## Error Handling

### Computed Field Protection

```typescript
const computedFields = ['Emails (Contacts)', 'Contacts (Live)', 'Updates'];
const filteredUpdates: any = {};

for (const [key, value] of Object.entries(enrichment.updates)) {
  if (!computedFields.includes(key)) {
    filteredUpdates[key] = value;
  }
}
```

### API Error Handling
- Catches Airtable API errors (422, 404, etc.)
- Logs detailed error messages
- Continues processing remaining records
- Sets status to "Error" for failed records

### Rate Limiting
- 1-second delay between records
- Respects Airtable's 5 req/sec limit
- Prevents API throttling

## Test Mode

Enable with `TEST_MODE=true`:
- Processes only 10 records
- Validates configuration
- Estimates cost/time before full run
- Default limit configurable via `TEST_LIMIT`

## Performance

### Processing Time
- ~1,868 companies in database
- 1-second delay between records
- Estimated: **31 minutes** total

### API Costs
- DeepSeek API: ~$0.016-$0.024 per call
- 1,868 companies = **$30-$45** estimated
- More cost-effective than GPT-4

## Environment Configuration

```env
DEEPSEEK_API_KEY=sk-176de4b5569d4a51b2ad3951ec3dd07c
AIRTABLE_TOKEN=patxFW6a0mC8jVJ9E.e07f01...
AIRTABLE_BASE_ID=appLp3fajmG8rtPT9
AIRTABLE_TABLE_ID=tblSkHc4c2mSQ6Osx
AIRTABLE_SOURCE_VIEW_ID=viwj01Ix6bJcit1RA
AIRTABLE_TARGET_VIEW_ID=viwDWt3VxUHgxrXu3
CONFIDENCE_THRESHOLD=90
TEST_MODE=false
TEST_LIMIT=10
```

## Deployment

### GitHub Actions
- Scheduled daily at 2 AM UTC
- Manual trigger via workflow_dispatch
- Requires 6 GitHub Secrets
- Uses `npm ci` for reproducible builds

### Manual Execution
```bash
# Test mode
npm test

# Production mode
npm start
```

## Key Differences from Contacts Enrichment

| Aspect | Contacts | Companies |
|--------|----------|-----------|
| **Data Sources** | NBAPA, RealGM, Fanspro, NFLPA | None (format existing only) |
| **Focus** | Merge & enrich | Format & standardize |
| **Status Field** | `Status` | `Status (Live)` |
| **Notes Field** | `Notes` | `Notes AI` |
| **Primary Goal** | Data enrichment | Data cleanup |
| **Computed Fields** | None | 3 fields filtered |

## File Structure

```
crm-companies-ai-enrichment/
├── src/
│   └── index.ts              # Main enrichment logic (450 lines)
├── dist/                     # Compiled JavaScript
├── .github/
│   └── workflows/
│       └── enrich-companies.yml  # GitHub Actions config
├── .env                      # Environment variables (gitignored)
├── .env.example              # Configuration template
├── .gitignore                # Git exclusions
├── package.json              # Dependencies & scripts
├── package-lock.json         # Dependency lock file
├── tsconfig.json             # TypeScript config
├── README.md                 # Full documentation
├── QUICK_START.md            # Quick setup guide
├── GITHUB_ACTIONS_SETUP.md   # Automation setup
└── PROJECT_SUMMARY.md        # This file
```

## Testing Results

Initial test (10 records):
- ✅ **4 Complete**: Successfully formatted
- ⚠️ **4 Conflicts**: Minor issues (address formatting)
- ❌ **2 Errors**: Over-reporting by AI (fixed in v1.0.1)

After prompt refinement:
- Expected: 8-9/10 successful
- Conflicts reduced to genuine issues only

## Future Enhancements

1. **Source Integration**: Add data sources like company registries
2. **Duplicate Detection**: Check for duplicate companies
3. **Bulk Operations**: Process multiple fields simultaneously
4. **Validation Rules**: Custom rules per field type
5. **Reporting Dashboard**: Detailed metrics and analytics

## Security

- ✅ API keys in environment variables only
- ✅ `.env` excluded from git
- ✅ GitHub Secrets for CI/CD
- ✅ No credentials in logs
- ✅ Read-only access to computed fields

## Maintenance

### Regular Tasks
- Monitor DeepSeek API usage
- Review "Conflicts" records in Airtable
- Update prompt if AI behavior drifts
- Check GitHub Actions logs for failures

### Troubleshooting
- **Low success rate**: Review AI prompt, adjust confidence threshold
- **API errors**: Check Airtable token validity
- **Rate limiting**: Increase delay between records

## Related Systems

- **Contact Enrichment**: [hb-crm-contacts-enrichment](https://github.com/yunikonlabsdevelopment-alt/hb-crm-contacts-enrichment)
- **NBA Player Enrichment**: Multiple data source scrapers
- **WNBA Player Enrichment**: Official site scraper

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Maintainer**: Yunikon Labs Development Team
