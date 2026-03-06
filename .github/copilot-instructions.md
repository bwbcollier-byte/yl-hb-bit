# AI Coding Agent Instructions

## Workspace Overview

This is a **multi-project workspace** of web scrapers and data enrichment tools that integrate with Airtable and external AI services. Each project is a standalone Node.js/TypeScript application focused on specific data collection and enrichment workflows.

### Project Categories

1. **News Scrapers**: ESPN, NBA - extract articles, enrich with AI tagging
2. **Player/Roster Processors**: Fanspro, Spotrac - scrape rosters, populate databases
3. **Athlete Scrapers**: Olympics (Australians, historic games) - collect athlete data
4. **Enrichment Systems**: CRM, Transfermarkt, Premier League - standardize and augment data

## Architecture Patterns

### Common Stack
- **Language**: TypeScript 5.3+ (ES2020 target)
- **Runtime**: Node.js 20+
- **Build**: `tsc` compilation to `dist/`
- **Entry**: Usually single `src/index.ts` per project
- **ORM/DB**: Airtable SDK for all data persistence

### Standard Project Structure
```
project/
├── src/index.ts          # Main entry point with orchestration logic
├── package.json          # Dependencies (puppeteer, dotenv, openai/deepseek)
├── tsconfig.json         # Shared config: strict mode, ES2020, commonjs
├── .env                  # Airtable tokens, API keys (NOT in git)
└── README.md             # Airtable schema, field mappings, env vars
```

### Airtable Integration Pattern
Every project uses the same configuration pattern:
```typescript
import dotenv from 'dotenv';
dotenv.config();

// Required in .env:
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE_ID = process.env.AIRTABLE_TABLE_ID!;
```

**Critical**: All Airtable Base IDs and Table IDs are hardcoded in source (found in README or code). Field names are case-sensitive strings.

## Developer Workflows

### Setup New Project Environment
```bash
cd <project-folder>
npm install
npm run build
export AIRTABLE_TOKEN="pat.xxxxx"  # From user's workspace
npm start
```

### Test Before Production
Many projects have test files: `test-*.js` or `test-*.ts` - run these to validate scraping logic against live sites before full execution.

### Common Commands
- `npm start` - Run with ts-node (requires ts-node dependency)
- `npm run build` - Compile TypeScript to dist/
- `npm run dev` - Same as start (for some projects)

## Key Project-Specific Patterns

### Puppeteer Scraping
Used in: **nba-news-scraper**, **fanspro-rosters-processor**, **spotrac-rosters-processor**, **olympics-australians-scraper**

```typescript
import puppeteer from 'puppeteer';

// Always handle rate limiting:
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Typical flow:
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto(url);
await page.click(selector);  // Interactive elements
const content = await page.content();
await browser.close();
```

**Pattern**: Use Puppeteer for JavaScript-heavy sites (ESPN, NBA), falling back to fetch/cheerio for static sites.

### AI Text Processing
Used in: **nba-news-scraper**, **crm-companies-ai-enrichment**

Two API patterns:
- **OpenAI API** (for DeepSeek compatibility): `new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com/v1' })`
- **RapidAPI**: Multiple API keys rotated to avoid rate limits

Example (DeepSeek):
```typescript
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

const response = await deepseek.chat.completions.create({
  model: 'deepseek-chat',
  messages: [{ role: 'user', content: prompt }],
});
```

### Airtable Field Updates
Standard pattern for updating records:
```typescript
await base(TABLE_ID).update(recordId, {
  'Field Name': value,
  'Status': 'Done',
  'Last Checked': new Date().toISOString(),
});
```

**Critical**: Field names are **case-sensitive** and must match Airtable exactly.

### URL Format Handling
Project-specific URL transformations (e.g., Fanspro):
```typescript
// Fix broken Airtable URLs before use
function fixFanspoUrl(url: string): string {
  const match = url.match(/\/teams\/([^\/]+)\/(\d+)(\d{4}-\d{4})$/);
  if (match) {
    return `https://fanspo.com/nfl/teams/${match[1]}/${match[2]}?sid=${match[3]}`;
  }
  return url;
}
```

## Data Flow Patterns

1. **Fetch URLs from Airtable** → Query a specific view with filters
2. **Scrape External Site** → Puppeteer for JS-heavy, fetch for static
3. **Extract & Transform** → Parse HTML, run through AI for enrichment
4. **Check for Duplicates** → Query "already processed" fields in Airtable
5. **Update Target Table** → Insert/update records, mark status as "Done"

Example (NBA scraper):
- Fetch news source URLs from News Sources table
- Visit each URL, detect new articles
- Scrape article content, extract player URLs
- Match player URLs to Talent profiles
- Create Article records with Status = "In Progress"
- Update to "Done" after full processing

## Error Handling Conventions

- **Test Mode**: Many projects have environment variable to limit records (e.g., `LIMIT=10`, `TEST_LIMIT=10`)
- **Status Tracking**: Use "Status" field in Airtable (e.g., "In Progress" → "Done", "Error", "Conflicts")
- **Logging**: Console.log with emoji prefixes: `✅`, `📋`, `❌`, `⚠️`
- **Rate Limiting**: Always include sleep() between requests to avoid bans

## Integration Points

### External APIs
- **Airtable REST API**: Base URL `https://api.airtable.com/v0/{baseId}/{tableId}`
- **Puppeteer**: For browser automation (npm: `puppeteer`)
- **DeepSeek AI**: OpenAI-compatible API for text enrichment
- **RapidAPI**: Multiple external scrapers (website contacts, social media, LinkedIn)

### Shared Dependencies
```json
{
  "puppeteer": "^22.0.0",      // Browser automation
  "dotenv": "^16.4.1",          // Environment loading
  "openai": "^6.22.0",          // DeepSeek (OpenAI API)
  "airtable": "^1.0.0",         // Airtable SDK
  "typescript": "^5.3.3",       // Build language
  "ts-node": "^10.9.2"          // Runtime TypeScript
}
```

## Project-Specific Notes

- **crm-companies-ai-enrichment**: Largest single file (1572 lines), handles multiple external API keys rotating across requests to avoid rate limits
- **nba-news-scraper**: Complex content extraction including image scraping and player tagging via URL matching
- **olympics-australians-scraper**: Handles dynamic "Load More" buttons and React component state
- **fanspro-rosters-processor**: URL format transformation required before scraping
- **transfermarkt-talent-enrich-profile**: ISO date conversion, competition aggregation in AI processing

## When Modifying Projects

1. **Update .env template** in README if adding new environment variables
2. **Test with `npm run build`** to catch TypeScript errors early
3. **Use test files** to validate scraping logic before full runs
4. **Check Airtable schema** - field names in code must match exactly
5. **Document Airtable Base/Table IDs** in project README (they're hardcoded in source)
6. **Add rate limiting** for any new external API calls
7. **Use status tracking** to manage long-running processes safely

## Running Tests & Debugging

Each project directory may have test files:
```bash
# Examples from workspace
node test-exact-extraction.js    # fanspro-rosters-processor
node test-article-create.js      # nba-news-scraper
npm test                         # crm-companies-ai-enrichment
```

For troubleshooting: check `console.log` output with emoji prefixes and look at Airtable record Status field for failure reasons.
