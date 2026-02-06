# NFL Football Reference Player Enrichment

Automated enrichment script for NFL player data from Pro-Football-Reference.com.

## Overview

This script extracts comprehensive NFL player data from Pro-Football-Reference.com and updates Airtable records with the enriched information.

## Features

- Extracts essential NFL player biographical and career information
- Updates Airtable records with SR (Sports Reference) fields
- Handles ad blocker detection modals automatically
- Resource blocking for faster scraping (images, CSS, fonts)
- Handles errors gracefully - single failures don't stop the batch
- Runs weekly via GitHub Actions

## Data Extracted

### Basic Information
- Name, Team, Position
- Height, Weight
- Born Date, Born Location
- High School, College

### Career Information
- Draft information
- Hall of Fame status
- Awards summary
- All Awards (detailed, one per line)
- Transactions (one per line)

### Social & Media
- Instagram profile link
- Player News RSS Feed

## Configuration

### Airtable Setup
- **Base**: NFL Gridiron (app0EH5LaZrzn3w1E)
- **Table**: Talent (tblzqwKvSFUTsUuFt)
- **View**: SREF Data (viwjHvfwwFXrquPqq)
- **URL Field**: Player URL (SR)
- **Field Prefix**: SR (Sports Reference)

### Environment Variables
Required secrets for GitHub Actions:
- `AIRTABLE_TOKEN`: Your Airtable API token
- `AIRTABLE_BASE_ID`: app0EH5LaZrzn3w1E
- `AIRTABLE_PLAYERS_TABLE_ID`: tblzqwKvSFUTsUuFt

## Local Development

```bash
# Install dependencies
npm install

# Run the enrichment
npm start
```

## GitHub Actions

The script runs automatically every Monday at 2:00 AM UTC via GitHub Actions workflow.

## Error Handling

- Individual record failures are logged but don't stop the batch
- Each record gets a status update (Success/Error)
- Detailed error messages stored in "SR Updates" field
- Timestamp tracking via "SR Last Check" field

## Technical Details

- Uses Puppeteer with Stealth plugin to avoid detection
- Implements resource blocking for faster page loads
- Processes records with individual updates for reliability
- Graceful browser cleanup on exit
