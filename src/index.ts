import puppeteer from 'puppeteer';
import fetch from 'node-fetch';

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const AIRTABLE_PLAYERS_TABLE_ID = process.env.AIRTABLE_PLAYERS_TABLE_ID!;
const AIRTABLE_PLAYERS_VIEW_ID = process.env.AIRTABLE_PLAYERS_VIEW_ID!;
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT) : undefined;

interface NFLPlayer {
  id: string;
  fields: {
    'FP Link': string;
    'Profile Status'?: string;
  };
}

interface NFLPlayerData {
  headshot?: string;
  currentTeam?: string;
  height?: string;
  weight?: string;
  dateOfBirth?: string;
  age?: string;
  college?: string;
  hometown?: string;
  position?: string;
  jerseyNumber?: string;
  draftYear?: string;
  draftRound?: string;
  draftPick?: string;
  draftTeam?: string;
  contractValue?: string;
  contractYears?: string;
  agentNamed?: string;
  linkedAgent?: string;
  agentFpUrl?: string;
  agentAgency?: string;
  instagramHandle?: string;
  twitterHandle?: string;
  socialLinks?: string;
  awards?: string;
  teamHistory?: string;
  lastProfileCheck?: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchNFLPlayers(): Promise<NFLPlayer[]> {
  console.log('📥 Fetching NFL players from Airtable "To Process" view...');
  const allRecords: NFLPlayer[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PLAYERS_TABLE_ID}`);
    url.searchParams.set('viewIdOrName', AIRTABLE_PLAYERS_VIEW_ID);
    url.searchParams.set('pageSize', '100');
    if (offset) {
      url.searchParams.set('offset', offset);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    });

    if (!response.ok) {
      throw new Error(`Airtable fetch error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { records: NFLPlayer[]; offset?: string };
    allRecords.push(...data.records);
    console.log(`  Fetched ${data.records.length} records (total: ${allRecords.length})`);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

async function extractNFLPlayerData(page: any): Promise<NFLPlayerData | null> {
  try {
    const playerData = await page.evaluate(() => {
      const data: any = {};
      const bodyText = document.body.innerText;
      const lines = bodyText.split('\n').map((l: string) => l.trim());
      
      // Extract current team and position from header area
      const headerText = bodyText.split('\n').slice(0, 20).join('\n');
      const teamMatch = headerText.match(/(.+?)\s+•#(\d+)\s+•\s+(\w+)/);
      if (teamMatch) {
        data.currentTeam = teamMatch[1]?.trim();
        data.jerseyNumber = teamMatch[2];
        data.position = teamMatch[3];
      }
      
      // Extract Headshot from img tag
      const headshot = (document as any).querySelector('img[alt*="player"], img[src*="headshots"]');
      if (headshot) {
        data.headshot = headshot.src || '';
      }
      
      // Extract HT/WT with conversions
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // HT/WT on same line
        if (line.includes('HT/WT')) {
          const hwMatch = line.match(/HT\/WT\s+(.+?),\s*(\d+)\s*lbs/);
          if (hwMatch) {
            const heightStr = hwMatch[1]?.trim() || '';
            const weightLbs = parseInt(hwMatch[2]);
            
            // Convert height to cm
            const heightParts = heightStr.match(/(\d+)['′]?\s*(\d*)/);
            if (heightParts) {
              const feet = parseInt(heightParts[1]);
              const inches = parseInt(heightParts[2] || '0');
              const totalInches = feet * 12 + inches;
              const heightCm = Math.round(totalInches * 2.54);
              data.height = heightCm.toString();
            }
            
            // Convert weight to kg
            const weightKg = Math.round(weightLbs * 0.453592);
            data.weight = weightKg.toString();
          }
        }
        
        // DOB on same line - extract date and hometown
        if (line.includes('DOB') && line.includes('/')) {
          const dobMatch = line.match(/DOB\s+([0-9/]+)/);
          if (dobMatch) {
            data.dateOfBirth = dobMatch[1]?.trim();
            
            // Calculate age
            const dobStr = dobMatch[1]?.trim();
            const [month, day, year] = dobStr.split('/').map(Number);
            const dob = new Date(year, month - 1, day);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
              age--;
            }
            data.age = age.toString();
          }
        }
        
        // Extract Hometown from the full date paragraph
        const hometownMatch = bodyText.match(/(\d+)\s+\w+,\s+(\d{4})\s+in\s+([^<\n]+)/);
        if (hometownMatch) {
          data.hometown = hometownMatch[3]?.trim();
        }
        
        // COLLEGE on same line
        if (line.includes('COLLEGE') && !line.includes('HT/WT')) {
          const collegeMatch = line.match(/COLLEGE\s+(.+?)$/);
          if (collegeMatch) {
            data.college = collegeMatch[1]?.trim();
          }
        }
        
        // DRAFT on same line
        if (line.includes('DRAFT') && line.includes('Rd')) {
          const draftMatch = line.match(/(\d+):\s+Rd\s+(\d+),\s+Pk\s+(\d+)\s+\((\w+)\)/);
          if (draftMatch) {
            data.draftYear = draftMatch[1];
            data.draftRound = draftMatch[2];
            data.draftPick = draftMatch[3];
            data.draftTeam = draftMatch[4];
          }
        }
      }
      
      // Extract Contract Value and Years from h6 tag
      const contractH6 = (document as any).querySelector('h6.MuiTypography-subtitle1');
      if (contractH6) {
        const contractText = contractH6.textContent || '';
        const contractMatch = contractText.match(/(\$[\d.]+[KMB]?)\s*-\s*(\d+)\s*yrs/);
        if (contractMatch) {
          data.contractValue = contractMatch[1];
          data.contractYears = contractMatch[2];
        }
      }
      
      // Extract Hometown from date paragraph - look for "in City, STATE" pattern
      const dateParas = (document as any).querySelectorAll('p[class*="MuiTypography"]');
      for (let i = 0; i < dateParas.length; i++) {
        const datePara = dateParas[i];
        const text = datePara.textContent || '';
        // Look for pattern like "in Atlanta, GA" or "in Pembroke Pines, FL"
        const hometownMatch = text.match(/in\s+([A-Za-z\s]+,\s*[A-Z]{2})/);
        if (hometownMatch) {
          data.hometown = hometownMatch[1]?.trim();
          break;
        }
      }
      
      // Extract Agent Named and Agency - they appear together in ListItemText with agent icon
      const allListItems = (document as any).querySelectorAll('[class*="ListItemText"][class*="multiline"]');
      if (allListItems && allListItems.length > 0) {
        // The agent entry is usually one of the first few multiline ListItemText elements
        for (let i = 0; i < Math.min(allListItems.length, 5); i++) {
          const item = allListItems[i];
          const primaryText = item.querySelector('[class*="primary"]')?.textContent || '';
          const secondaryText = item.querySelector('[class*="secondary"]')?.textContent || '';
          
          // Check if this looks like an agent entry (contains # and contract info, or has a valid agency name)
          if (primaryText.includes('#') && primaryText.includes('contracts')) {
            const agentNameMatch = primaryText.match(/(.+?)\s*\(#/);
            if (agentNameMatch) {
              data.agentNamed = agentNameMatch[1]?.trim();
            }
            if (secondaryText && !secondaryText.includes('2') && secondaryText.length > 5) {
              data.agentAgency = secondaryText.trim();
            }
            break; // Found the agent entry
          }
        }
      }
      
      // Extract Awards - look for text containing award keywords
      const awardKeywords = ['Pro Bowl', 'All-Pro', 'MVP', 'Comeback Player', 'Rookie', 'Super Bowl', 'SB', 'Champions'];
      const allText = (document as any).body.innerText || '';
      const awards: string[] = [];
      
      // Try different selectors to find awards
      let awardElements: any[] = [];
      
      // Method 1: Look in ul.MuiList-root for award text
      const lists = (document as any).querySelectorAll('ul.MuiList-root li');
      for (let i = 0; i < lists.length; i++) {
        const listItem = lists[i];
        const text = listItem.textContent?.trim() || '';
        // Check if this looks like an award (contains award keywords)
        for (const keyword of awardKeywords) {
          if (text.includes(keyword)) {
            awardElements.push(listItem);
            break;
          }
        }
      }
      
      // Method 2: If no awards found in lists, try looking for p tags with award keywords
      if (awardElements.length === 0) {
        const pTags = (document as any).querySelectorAll('p');
        for (let i = 0; i < pTags.length; i++) {
          const p = pTags[i];
          const text = p.textContent?.trim() || '';
          for (const keyword of awardKeywords) {
            if (text.includes(keyword) && text.length < 150) { // Avoid long paragraphs
              awardElements.push(p);
              break;
            }
          }
        }
      }
      
      // Extract text from found award elements
      awardElements.forEach((el: any) => {
        const awardText = el.textContent?.trim();
        if (awardText && awardText.length > 2 && !awards.includes(awardText)) {
          awards.push(awardText);
        }
      });
      
      // Only keep first 10 awards and join them
      if (awards.length > 0) {
        data.awards = awards.slice(0, 10).join(', ');
      }
      
      // Extract Team History - more specific extraction
      const teamHistoryLinks = (document as any).querySelectorAll('a[href*="/nfl/teams/"] p');
      if (teamHistoryLinks && teamHistoryLinks.length > 0) {
        const teams: string[] = [];
        teamHistoryLinks.forEach((link: any) => {
          const teamName = link.textContent?.trim();
          // Filter out non-team entries and avoid duplicates
          if (teamName && !teamName.includes('Round') && !teamName.includes('#') && !teams.includes(teamName)) {
            teams.push(teamName);
          }
        });
        if (teams.length > 0) {
          data.teamHistory = teams.join(', ');
        }
      }
      
      // Set Last Profile Check to today's date
      const today = new Date();
      data.lastProfileCheck = today.toISOString().split('T')[0];
      
      return data;
    });

    return playerData;
  } catch (error) {
    console.log('    ⚠️  Could not extract all data from player profile');
    return null;
  }
}

async function updateNFLPlayerRecord(recordId: string, data: NFLPlayerData): Promise<void> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PLAYERS_TABLE_ID}/${recordId}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        'Headshot': data.headshot,
        'Current Team': data.currentTeam,
        'Height': data.height,
        'Weight': data.weight,
        'Date of Birth': data.dateOfBirth,
        'Age': data.age,
        'College': data.college,
        'Hometown': data.hometown,
        'Position': data.position,
        'Jersey Number': data.jerseyNumber,
        'Draft Year': data.draftYear,
        'Draft Round': data.draftRound,
        'Draft Pick': data.draftPick,
        'Draft Team': data.draftTeam,
        'Contract Value': data.contractValue,
        'Contract Years': data.contractYears,
        'Agent Named': data.agentNamed,
        'Linked Agent': data.linkedAgent,
        'Agent FP Url': data.agentFpUrl,
        'Agent Agency': data.agentAgency,
        'Instagram Handle': data.instagramHandle,
        'Twitter Handle': data.twitterHandle,
        'Social Links': data.socialLinks,
        'Awards': data.awards,
        'Team History': data.teamHistory,
        'Last Profile Check': data.lastProfileCheck,
        'Profile Status': 'Done',
        'Enrichment Date': new Date().toISOString().split('T')[0],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update record: ${response.status}`);
  }
}

async function scrapeNFLPlayers(): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const players = await fetchNFLPlayers();
    console.log(`🏈 Found ${players.length} NFL players to process\n`);

    let processed = 0;
    for (const player of players) {
      if (LIMIT && processed >= LIMIT) break;

      const { id, fields } = player;
      const url = fields['FP Link'];

      if (!url) {
        console.log(`⏭️  Skipping record ${id} - no FP Link`);
        continue;
      }

      processed++;
      console.log(`[${processed}/${players.length}] Processing: ${url.split('/').pop()}`);

      try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(2000);

        const playerData = await extractNFLPlayerData(page);

        if (playerData) {
          console.log(`  ✅ Extracted player data`);
          await updateNFLPlayerRecord(id, playerData);
          console.log(`  ✅ Updated Airtable record`);
        } else {
          console.log(`  ⚠️  No data extracted`);
        }

        await page.close();
        await sleep(1000);
      } catch (error) {
        console.log(`  ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log(`\n✅ Processed ${processed} NFL players`);
  } finally {
    await browser.close();
  }
}

scrapeNFLPlayers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
