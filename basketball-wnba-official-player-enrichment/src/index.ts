import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser } from 'puppeteer';

puppeteer.use(StealthPlugin());

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'app48HBwrT9Clhd4x';
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID || 'tblzqwKvSFUTsUuFt'; // Talent table
const VIEW_ID = 'viw0scQ2J9HMo5sh7'; // WNBA Official Data view
const UPDATE_BATCH_SIZE = 10; // Batch update Airtable every 10 records

interface AirtableRecord {
  id: string;
  fields: {
    'URL NBA Link'?: string;  // Note: Still called "NBA Link" even for WNBA
    'NBA Data Status'?: string;
    'NBA Last Check'?: string;
    'NBA Updates'?: string;
    'NBA Name First'?: string;
    'NBA Name Last'?: string;
    'NBA Team'?: string;
    'NBA Team Link'?: string;
    'NBA Number'?: string;
    'NBA Position'?: string;
    'NBA Height'?: string;
    'NBA Weight'?: string;
    'NBA College'?: string;
    'NBA Country'?: string;
    'NBA Birthdate'?: string;
    'NBA Draft'?: string;
    'NBA Bio'?: string;
    'NBA Status'?: string;
    'NBA Image'?: string;
    'NBA Awards & Honours'?: string;
    'NBA Instagram'?: string;
    'NBA Twitter'?: string;
    'NBA Tiktok'?: string;
  };
}

interface ExtractedData {
  'NBA Name First': string;
  'NBA Name Last': string;
  'NBA Team': string;
  'NBA Team Link': string;
  'NBA Number': string;
  'NBA Position': string;
  'NBA Height': string;
  'NBA Weight': string;
  'NBA College': string;
  'NBA Country': string;
  'NBA Birthdate': string;
  'NBA Draft': string;
  'NBA Bio': string;
  'NBA Status': string;
  'NBA Image': string;
  'NBA Awards & Honours': string;
  'NBA Instagram': string;
  'NBA Twitter': string;
  'NBA Tiktok': string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPlayersToProcess(): Promise<AirtableRecord[]> {
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`);
    url.searchParams.set('view', VIEW_ID);
    url.searchParams.set('pageSize', '100');
    
    // Only fetch fields we need for comparison and processing
    const fieldsToFetch = [
      'URL NBA Link',
      'NBA Name First', 'NBA Name Last', 'NBA Team', 'NBA Team Link',
      'NBA Number', 'NBA Position', 'NBA Height', 'NBA Weight',
      'NBA College', 'NBA Country', 'NBA Birthdate', 'NBA Draft',
      'NBA Status', 'NBA Image', 'NBA Bio', 'NBA Awards & Honours',
      'NBA Instagram', 'NBA Twitter', 'NBA Tiktok'
    ];
    fieldsToFetch.forEach(field => url.searchParams.append('fields[]', field));
    
    if (offset) {
      url.searchParams.set('offset', offset);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    });

    if (!response.ok) {
      throw new Error(`Airtable fetch error: ${response.status}`);
    }

    const data = (await response.json()) as { records: AirtableRecord[]; offset?: string };
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

// Helper function to dismiss cookie consent popups
async function dismissCookiePopup(page: any): Promise<void> {
  try {
    await page.evaluate(() => {
      // Try multiple cookie consent selectors
      const selectors = [
        'button:has-text("I Accept")',
        'button:has-text("Accept All")',
        'button:has-text("Accept")',
        '#onetrust-accept-btn-handler',
        '.ot-btn-accept',
        'button[aria-label="Accept"]'
      ];
      
      const buttons = Array.from(document.querySelectorAll('button'));
      const acceptButton = buttons.find((btn: any) => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('accept') || text.includes('agree') || 
               btn.id?.includes('accept') || btn.className?.includes('accept');
      });
      
      if (acceptButton) {
        (acceptButton as HTMLButtonElement).click();
      }
    });
    await new Promise(r => setTimeout(r, 500));
  } catch (e) {
    // Silently ignore - popup might not exist
  }
}

function convertBirthdateToISO(dateStr: string): string {
  // Convert "Jan 22, 2002" to "2002-01-22"
  const monthMap: { [key: string]: string } = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
    'January': '01', 'February': '02', 'March': '03', 'April': '04',
    'June': '06', 'July': '07', 'August': '08',
    'September': '09', 'October': '10', 'November': '11', 'December': '12',
  };

  const parts = dateStr.trim().split(/[\s,]+/).filter(p => p);
  if (parts.length !== 3) return dateStr;

  const monthStr = parts[0];
  const dayStr = parts[1];
  const yearStr = parts[2];

  const month = monthMap[monthStr];
  if (!month) return dateStr;

  return `${yearStr}-${month}-${dayStr.padStart(2, '0')}`;
}

// Extract data from the player page
async function extractFromMainPage(page: any): Promise<Partial<ExtractedData>> {
  return await page.evaluate(() => {
    const result: any = {};

    // Extract player name from h1
    const nameElement = document.querySelector('h1._PlayerProfileHeader__name_jfo3w_233');
    if (nameElement) {
      const spans = nameElement.querySelectorAll('span');
      if (spans.length >= 2) {
        result['NBA Name First'] = (spans[0] as HTMLElement).textContent?.trim() || '';
        result['NBA Name Last'] = (spans[1] as HTMLElement).textContent?.trim() || '';
      } else if (spans.length === 1) {
        const fullName = (spans[0] as HTMLElement).textContent?.trim() || '';
        const nameParts = fullName.split(' ');
        if (nameParts.length >= 2) {
          result['NBA Name First'] = nameParts[0];
          result['NBA Name Last'] = nameParts.slice(1).join(' ');
        } else {
          result['NBA Name Last'] = fullName;
        }
      }
    }

    // Extract number from the header
    const numberElement = document.querySelector('p._PlayerProfileHeader__number_jfo3w_251');
    if (numberElement) {
      const spans = numberElement.querySelectorAll('span');
      if (spans.length >= 2) {
        result['NBA Number'] = (spans[1] as HTMLElement).textContent?.trim() || '';
      }
    }

    // Extract team and position from bottom section
    const bottomInfo = document.querySelector('._PlayerProfileHeader__info__bottom_jfo3w_211');
    if (bottomInfo) {
      const paragraphs = bottomInfo.querySelectorAll('p');
      if (paragraphs.length >= 1) {
        result['NBA Team'] = (paragraphs[0] as HTMLElement).textContent?.trim() || '';
      }
      if (paragraphs.length >= 2) {
        result['NBA Position'] = (paragraphs[1] as HTMLElement).textContent?.trim() || '';
      }
    }

    // Extract team logo link
    const teamLogoDiv = document.querySelector('._PlayerProfileHeader__headshot__teamLogo_jfo3w_76 img');
    if (teamLogoDiv) {
      const src = teamLogoDiv.getAttribute('src') || '';
      // Extract team ID from logo URL: https://cdn.wnba.com/logos/wnba/1611661325/primary/D/logo.svg
      const teamIdMatch = src.match(/\/logos\/wnba\/(\d+)\//);
      if (teamIdMatch) {
        const teamId = teamIdMatch[1];
        // Look up team abbreviation from page or construct URL
        const teamAbbr = result['NBA Team']?.split(' ').pop()?.toLowerCase() || '';
        result['NBA Team Link'] = `https://www.wnba.com/team/${teamId}`;
      }
    }

    // Extract headshot image
    const headshotImg = document.querySelector('._PlayerProfileHeader__headshot__img_jfo3w_33');
    if (headshotImg) {
      result['NBA Image'] = headshotImg.getAttribute('src') || '';
    }

    // Extract info from the info table (height, birthdate, weight, college, draft, experience)
    const infoTable = document.querySelector('._PlayerProfileHeader__info-table_jfo3w_264');
    if (infoTable) {
      const dls = infoTable.querySelectorAll('dl');
      
      dls.forEach((dl) => {
        const dt = dl.querySelector('dt');
        const dd = dl.querySelector('dd');
        
        if (dt && dd) {
          const label = (dt as HTMLElement).textContent?.trim().toLowerCase() || '';
          const value = (dd as HTMLElement).textContent?.trim() || '';
          
          if (label.includes('height')) {
            // Format: "6-0" convert to cm
            const heightMatch = value.match(/(\d+)-(\d+)/);
            if (heightMatch) {
              const feet = parseInt(heightMatch[1]);
              const inches = parseInt(heightMatch[2]);
              const cm = Math.round((feet * 12 + inches) * 2.54);
              result['NBA Height'] = `${cm}`;
            }
          } else if (label.includes('weight')) {
            // Format: "157 lbs" convert to kg
            const weightMatch = value.match(/(\d+)\s*lbs?/i);
            if (weightMatch) {
              const lbs = parseInt(weightMatch[1]);
              const kg = Math.round(lbs * 0.453592);
              result['NBA Weight'] = `${kg}`;
            }
          } else if (label.includes('birthdate')) {
            result['NBA Birthdate'] = value;
          } else if (label.includes('college') || label.includes('country')) {
            // Format: "Iowa / USA"
            const parts = value.split('/').map(p => p.trim());
            if (parts.length >= 1) {
              result['NBA College'] = parts[0];
            }
            if (parts.length >= 2) {
              result['NBA Country'] = parts[1];
            }
          } else if (label.includes('draft')) {
            result['NBA Draft'] = value;
          }
        }
      });
    }

    // Extract social media links (only from player header section, not footer)
    const playerHeaderLinks = document.querySelector('._PlayerProfileHeader__links_jfo3w_314');
    if (playerHeaderLinks) {
      const socialLinks = playerHeaderLinks.querySelectorAll('.WNBASocialLinks__list a');
      socialLinks.forEach((link) => {
        const href = link.getAttribute('href') || '';
        const title = link.querySelector('title')?.textContent?.toLowerCase() || '';
        
        if (title.includes('instagram') || href.includes('instagram.com')) {
          result['NBA Instagram'] = href;
        } else if (title.includes('x') || title.includes('twitter') || href.includes('twitter.com') || href.includes('x.com')) {
          result['NBA Twitter'] = href;
        } else if (title.includes('tiktok') || href.includes('tiktok.com')) {
          result['NBA Tiktok'] = href;
        }
      });
    }

    return result;
  });
}

// Extract bio and awards from the bio page
async function extractFromBioPage(page: any): Promise<{bio: string, awards: string}> {
  return await page.evaluate(() => {
    const result = { bio: '', awards: '' };
    
    // Extract bio from the article section
    const article = document.querySelector('article');
    if (article) {
      const bioSection = article.querySelector('section');
      if (bioSection) {
        // Get all paragraphs and list items
        const paragraphs = Array.from(bioSection.querySelectorAll('p, ul li'));
        result.bio = paragraphs.map(p => (p as HTMLElement).innerText?.trim() || '').join('\n');
      }
    }
    
    // Extract awards from the awards section
    const awardsDiv = document.querySelector('.Player_awardsAndHonors__EYX0X');
    if (awardsDiv) {
      const awardsList: Array<{year: number, award: string}> = [];
      const awardDivs = awardsDiv.querySelectorAll('.Player_award__tfPIj');
      
      awardDivs.forEach((awardDiv) => {
        const descriptionEl = awardDiv.querySelector('.Player_award__description__3wPFI');
        const yearsEl = awardDiv.querySelector('.Player_award__years__3Gn0_');
        
        if (descriptionEl && yearsEl) {
          let description = (descriptionEl as HTMLElement).innerText?.trim() || '';
          const yearsText = (yearsEl as HTMLElement).innerText?.trim() || '';
          
          if (description && yearsText) {
            // Remove count prefix like "5x ", "1x ", etc.
            description = description.replace(/^\d+x\s+/, '');
            
            // Parse years - format is like "2017 / 2019 / 2020"
            const years = yearsText.split('/').map(y => y.trim()).filter(y => y);
            
            // Create an entry for each year
            years.forEach(yearStr => {
              const year = parseInt(yearStr, 10);
              if (!isNaN(year)) {
                awardsList.push({ year, award: description });
              }
            });
          }
        }
      });
      
      // Sort by year first, then by award name
      awardsList.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.award.localeCompare(b.award);
      });
      
      // Format as "YYYY | Award Name"
      result.awards = awardsList.map(item => `${item.year} | ${item.award}`).join('\n');
    }

    return result;
  });
}

async function enrichPlayerWithWNBA(page: any, link: string, browser?: any): Promise<ExtractedData> {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const playerId = link.split('/').filter(p => p).pop() || 'unknown';
      console.log(`  🔄 Attempt ${attempt}/${MAX_RETRIES}: Processing player ${playerId}`);
      
      // Navigate to main player page (profile tab)
      try {
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));
      } catch (navError) {
        throw new Error(`Failed to navigate to player page: ${navError instanceof Error ? navError.message : 'Unknown navigation error'}`);
      }

      // Dismiss cookie popup (try multiple times as it might load dynamically)
      await dismissCookiePopup(page);
      await dismissCookiePopup(page);

      // Extract from main page
      const mainData = await extractFromMainPage(page);

      // Check if Bio tab exists before trying to extract from bio page
      let bioData = { bio: '', awards: '' };
      try {
        const hasBioTab = await page.evaluate(() => {
          const bioLink = document.querySelector('a._SubNav__item_1e7v7_27[href*="/bio"]');
          return bioLink !== null;
        });
        
        if (hasBioTab) {
          console.log(`  📖 Bio tab found - extracting bio and awards`);
          const bioLink = `${link}/bio`;
          
          try {
            await page.goto(bioLink, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 1000));
            
            // Dismiss cookie popup on bio page
            await dismissCookiePopup(page);
            await dismissCookiePopup(page);
            
            bioData = await extractFromBioPage(page);
            console.log(`  ✓ Bio extracted: ${bioData.bio.length} chars, Awards: ${bioData.awards ? 'Yes' : 'No'}`);
          } catch (bioError) {
            console.log(`  ⚠️  Could not load/extract bio page: ${bioError instanceof Error ? bioError.message : 'Unknown error'}`);
            console.log(`  ➡️  Continuing with main page data only`);
          }
        } else {
          console.log(`  ⚠️  No Bio tab found - skipping bio extraction`);
        }
      } catch (e) {
        console.log(`  ⚠️  Bio tab detection error: ${e instanceof Error ? e.message : 'Unknown error'}`);
        console.log(`  ➡️  Continuing with main page data only`);
      }

      // Convert birthdate to ISO format if present
      if (mainData['NBA Birthdate']) {
        mainData['NBA Birthdate'] = convertBirthdateToISO(mainData['NBA Birthdate']);
      }

      // Set bio and awards from bio page
      if (bioData.bio) {
        mainData['NBA Bio'] = bioData.bio;
      }
      if (bioData.awards) {
        mainData['NBA Awards & Honours'] = bioData.awards;
      }

      // Set status (could extract from page if available, default to Active if on roster)
      mainData['NBA Status'] = 'Active';

      const extractedData = mainData as ExtractedData;
      console.log(`  ✅ Successfully extracted data for ${extractedData['NBA Name First']} ${extractedData['NBA Name Last']}`);
      console.log(`  🔍 DEBUG: Bio in extractedData = ${(extractedData['NBA Bio'] || '').length} chars, Awards = ${!!extractedData['NBA Awards & Honours']}`);
      
      return extractedData;

    } catch (error) {
      console.error(`  ❌ Attempt ${attempt} failed:`, error);
      
      if (attempt < MAX_RETRIES) {
        console.log(`  ⏳ Waiting before retry...`);
        await new Promise(r => setTimeout(r, 5000 * attempt));
      } else {
        throw error;
      }
    }
  }

  throw new Error(`Failed after ${MAX_RETRIES} attempts`);
}

function hasDataChanged(record: AirtableRecord, extracted: ExtractedData): boolean {
  const fields = record.fields;

  // List of fields to compare
  const fieldsToCompare: (keyof ExtractedData)[] = [
    'NBA Name First', 'NBA Name Last', 'NBA Team', 'NBA Team Link',
    'NBA Number', 'NBA Position', 'NBA Height', 'NBA Weight',
    'NBA College', 'NBA Country', 'NBA Birthdate', 'NBA Draft',
    'NBA Status', 'NBA Image', 'NBA Bio', 'NBA Awards & Honours',
    'NBA Instagram', 'NBA Twitter', 'NBA Tiktok'
  ];

  for (const field of fieldsToCompare) {
    const existing = fields[field] || '';
    const newValue = extracted[field] || '';
    
    if (existing !== newValue) {
      return true;
    }
  }

  return false;
}

async function updateAirtableRecord(recordId: string, data: Partial<ExtractedData>, status: string, updates: string): Promise<void> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${recordId}`;
  
  const fieldsToUpdate: any = {
    ...data,
    'NBA Data Status': status,
    'NBA Last Check': new Date().toISOString().split('T')[0],
    'NBA Updates': updates,
  };
  
  // Debug: Log bio/awards data
  if (data['NBA Bio'] || data['NBA Awards & Honours']) {
    console.log(`  📊 Updating: Bio=${(data['NBA Bio'] || '').length} chars, Awards=${!!data['NBA Awards & Honours']}`);
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: fieldsToUpdate }),
  });

  if (!response.ok) {
    throw new Error(`Airtable update error: ${response.status}`);
  }
}

async function updateAirtableBatch(updates: Array<{id: string, fields: any}>): Promise<void> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ records: updates }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Airtable batch update error: ${response.status} - ${errorText}`);
  }
}

async function main() {
  console.log('🏀 WNBA Official Player Data Enrichment');
  console.log('=====================================\n');

  // Fetch all records from the WNBA Official Data view
  console.log('📊 Fetching players from Airtable...');
  const records = await fetchPlayersToProcess();
  console.log(`✅ Found ${records.length} players in view\n`);

  // Filter to records with WNBA links
  const recordsWithLinks = records.filter(r => r.fields['URL NBA Link']);
  console.log(`🔗 ${recordsWithLinks.length} players have WNBA links\n`);

  if (recordsWithLinks.length === 0) {
    console.log('✅ No players to process. Exiting.');
    return;
  }

  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  const page = await browser.newPage();
  
  // Block unnecessary resources to speed up loading
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const resourceType = req.resourceType();
    if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
      req.abort();
    } else {
      req.continue();
    }
  });
  
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  let processedCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  let errorCount = 0;

  for (const record of recordsWithLinks) {
    const link = record.fields['URL NBA Link']!;
    console.log(`\n[${processedCount + 1}/${recordsWithLinks.length}] Processing: ${link}`);
    
    try {
      const extractedData = await enrichPlayerWithWNBA(page, link, browser);

      // Check if data has changed and update immediately
      if (hasDataChanged(record, extractedData)) {
        console.log(`  📝 Data has changed - updating Airtable`);
        
        await updateAirtableBatch([{
          id: record.id,
          fields: {
            ...extractedData,
            'NBA Data Status': 'Updated',
            'NBA Last Check': new Date().toISOString().split('T')[0],
            'NBA Updates': `Updated on ${new Date().toISOString().split('T')[0]}`,
          }
        }]);
        console.log(`  ✅ Updated successfully`);
        updatedCount++;
      } else {
        console.log(`  ✓ No changes detected - updating check time`);
        
        await updateAirtableBatch([{
          id: record.id,
          fields: {
            'NBA Data Status': 'Updated',
            'NBA Last Check': new Date().toISOString().split('T')[0],
            'NBA Updates': `Checked on ${new Date().toISOString().split('T')[0]} - no changes`,
          }
        }]);
        console.log(`  ✅ Check time updated`);
        unchangedCount++;
      }

      processedCount++;

    } catch (error) {
      console.error(`  ❌ Error processing player:`, error);
      processedCount++;
      errorCount++;
      
      // Always mark the record with error status and continue
      try {
        await updateAirtableBatch([{
          id: record.id,
          fields: {
            'NBA Data Status': 'Error',
            'NBA Last Check': new Date().toISOString().split('T')[0],
            'NBA Updates': `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          }
        }]);
        console.log(`  ✅ Error status recorded in Airtable - continuing to next player`);
      } catch (updateError) {
        console.error(`  ⚠️  Could not update Airtable with error status:`, updateError);
        console.log(`  ➡️  Continuing to next player anyway`);
      }
    }
    
    // Always delay between players, regardless of success/failure
    await sleep(2000);
  }

  await browser.close();

  console.log('\n=====================================');
  console.log('📈 Enrichment Summary');
  console.log('=====================================');
  console.log(`Total Records: ${recordsWithLinks.length}`);
  console.log(`Successfully Processed: ${processedCount}`);
  console.log(`  - Updated: ${updatedCount}`);
  console.log(`  - Unchanged: ${unchangedCount}`);
  console.log(`  - Errors: ${errorCount}`);
  console.log('=====================================\n');
}

main().catch(console.error);
