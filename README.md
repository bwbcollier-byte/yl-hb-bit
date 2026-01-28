# FansPro NFL Players Enrichment

Scrapes NFL player data from FansPro profiles and enriches Airtable records.

## Setup

```bash
npm install
npm run build
```

## Environment Variables

```
AIRTABLE_TOKEN=your_token
AIRTABLE_BASE_ID=appO5ykln5Hkjh1ie
AIRTABLE_PLAYERS_TABLE_ID=tblOTNzi0ifeAIRAM
AIRTABLE_PLAYERS_VIEW_ID=viw1FyIYASqTvySS1
LIMIT=10  # Optional - limits number of records to process
```

## Run

```bash
npm start
```

## Fields Extracted

- Current Team
- Height
- Weight
- Date of Birth
- Age
- College
- Hometown
- Position
- Jersey Number
- Draft Year
- Draft Round
- Draft Pick
- Draft Team
- Contract Value
- Contract Years
- Agent Info
- Social Media Handles
- Team History
- Awards
