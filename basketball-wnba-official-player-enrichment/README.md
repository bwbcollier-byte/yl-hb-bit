# WNBA Official Player Data Enrichment

Automated enrichment of player profiles with data from official WNBA.com player pages.

## Overview

This script fetches player data from the [WNBA Official Data] view in Airtable and enriches it with information scraped from www.wnba.com player profile pages.

## Features

- **18 Data Fields**: Extracts comprehensive player information including stats, bio, and social media
- **Social Media Links**: Instagram, Twitter (X), and TikTok profiles
- **Batch Processing**: Updates Airtable in batches of 10 for efficiency
- **Smart Updates**: Only updates records when data actually changes
- **Error Handling**: Retries failed requests and logs errors appropriately
- **Stealth Mode**: Uses puppeteer-extra with stealth plugin to avoid detection

## Extracted Fields

### Standard Fields (15)
- **NBA Name First**: Player's first name
- **NBA Name Last**: Player's last name
- **NBA Team**: Current team full name (e.g., "Indiana Fever")
- **NBA Team Link**: Link to team page on WNBA.com
- **NBA Number**: Jersey number
- **NBA Position**: Playing position (Guard, Forward, Center)
- **NBA Height**: Height in centimeters (converted from feet-inches)
- **NBA Weight**: Weight in kilograms (converted from pounds)
- **NBA College**: College/university attended
- **NBA Country**: Country of origin
- **NBA Birthdate**: Date of birth in ISO format (YYYY-MM-DD)
- **NBA Bio**: Player biography and career information
- **NBA Status**: Current status (Active, Retired, etc.)
- **NBA Image**: Headshot image URL
- **NBA Awards & Honours**: Career achievements and awards

### Social Media Fields (3)
- **NBA Instagram**: Instagram profile URL
- **NBA Twitter**: Twitter/X profile URL
- **NBA Tiktok**: TikTok profile URL

### Metadata Fields (3)
- **NBA Data Status**: Status of last enrichment (Updated/Current/Error)
- **NBA Last Check**: Timestamp of last check
- **NBA Updates**: Summary of what was updated

## Setup

### Prerequisites

- Node.js 18 or higher
- Airtable account with access token
- Access to the HB | Data | Sports | Basketball base

### Environment Variables

Create a `.env` file or set these environment variables:

```bash
AIRTABLE_TOKEN=your_airtable_token
AIRTABLE_BASE_ID=app48HBwrT9Clhd4x
AIRTABLE_TABLE_ID=tblzqwKvSFUTsUuFt
```

### Installation

```bash
npm install
```

### Build

```bash
npm run build
```

### Run

```bash
npm start
```

## How It Works

1. **Fetch Records**: Retrieves all records from the "WNBA Official Data" view
2. **Filter**: Processes only records with a value in "URL NBA Link"
3. **Extract**: For each player:
   - Navigates to their WNBA.com profile page
   - Extracts data from the player header and info sections
   - Attempts to fetch additional bio from the /bio page
   - Extracts social media links from the social links section
4. **Compare**: Checks if extracted data differs from existing Airtable data
5. **Update**: Batch updates Airtable with new data every 10 records

## URL Format

WNBA player URLs follow this format:
```
https://www.wnba.com/player/{PLAYER_ID}
```

Example:
```
https://www.wnba.com/player/1642286
```

## Data Sources

All data is extracted from official WNBA.com player pages:
- Main profile: `/player/{id}`
- Bio page: `/player/{id}/bio`

## Automation

### GitHub Actions

This script runs automatically via GitHub Actions:
- **Schedule**: Every Monday at 2:00 AM UTC
- **Workflow**: `.github/workflows/enrichment.yml`

### Required Secrets

Configure these in GitHub repository settings:
- `AIRTABLE_TOKEN`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_PLAYERS_TABLE_ID`

## Rate Limiting

- 2 second delay between player pages
- 1 second delay between batch updates
- Automatic retries (up to 3 attempts) for failed requests

## Error Handling

- Failed requests are retried up to 3 times with exponential backoff
- Errors are logged to Airtable in the "NBA Updates" field
- Script continues processing even if individual players fail

## Notes

- Field names use "NBA" prefix even though this is WNBA data (for consistency with existing schema)
- Link field is still called "URL NBA Link" in Airtable
- Heights converted from feet-inches to centimeters
- Weights converted from pounds to kilograms
- Birthdates converted to ISO format (YYYY-MM-DD)

## Development

```bash
# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Run built version
npm start
```

## License

ISC
