import fetch from 'node-fetch';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser } from 'puppeteer';

puppeteer.use(StealthPlugin());

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'app0EH5LaZrzn3w1E';
const AIRTABLE_PLAYERS_TABLE_ID = process.env.AIRTABLE_PLAYERS_TABLE_ID || 'tblzqwKvSFUTsUuFt'; // Talent table
const AIRTABLE_VIEW_ID = 'viwjHvfwwFXrquPqq'; // "SREF Data" view
const UPDATE_BATCH_SIZE = 10; // Batch size for Airtable updates

interface AirtableRecord {
  id: string;
  fields: {
    'Player URL (SR)'?: string;
    'Data Status (SR)'?: string;
    'Last Check (SR)'?: string;
    'Updates (SR)'?: string;
    'Name (SR)'?: string;
    'Status (SR)'?: string;
    'Active Start (SR)'?: string;
    'Active End (SR)'?: string;
    'Position (SR)'?: string;
    'Birthdate (SR)'?: string;
    'Colleges (SR)'?: string;
    'Instagram (SR)'?: string;
    'Full Position (SR)'?: string;
    'Shoots (SR)'?: string;
    'Height (SR)'?: string;
    'Weight (SR)'?: string;
    'Team (SR)'?: string;
    'Born Location (SR)'?: string;
    'Born Date (SR)'?: string;
    'High School (SR)'?: string;
    'College (SR)'?: string;
    'NBA Debut (SR)'?: string;
    'Draft (SR)'?: string;
    'Recruiting Rank (SR)'?: string;
    'Experience (SR)'?: string;
    'Career Length (SR)'?: string;
    'Hall of Fame (SR)'?: string;
    'Awards (SR)'?: string;
    'Player News RSS Feed (SR)'?: string;
    'All Awards (SR)'?: string;
    'All-Star Games (SR)'?: string;
    'Weekly Awards (SR)'?: string;
    'Monthly Awards (SR)'?: string;
    'All-League (SR)'?: string;
    'MVP Award Shares (SR)'?: string;
    'All-NBA Voting Shares (SR)'?: string;
    'All-Defensive Voting Shares (SR)'?: string;
    'All-Rookie Voting Shares (SR)'?: string;
    'Amateur Honors (SR)'?: string;
    'Points (SR)'?: string;
    'Points Per Game (SR)'?: string;
    'Total Rebounds (SR)'?: string;
    'Defensive Rebounds (SR)'?: string;
    'Assists (SR)'?: string;
    'Assists Per Game (SR)'?: string;
    'Steals (SR)'?: string;
    'Steals Per Game (SR)'?: string;
    'Free Throw Pct (SR)'?: string;
    '3-Pt Field Goal Pct (SR)'?: string;
    '2-Pt Field Goal Pct (SR)'?: string;
    'Effective Field Goal Pct (SR)'?: string;
    'True Shooting Pct (SR)'?: string;
    'Field Goals (SR)'?: string;
    'Field Goals Per Game (SR)'?: string;
    'Field Goal Attempts (SR)'?: string;
    'Field Goal Attempts Per Game (SR)'?: string;
    '2-Pt Field Goals (SR)'?: string;
    '2-Pt Field Goals Per Game (SR)'?: string;
    '2-Pt Field Goal Attempts (SR)'?: string;
    '2-Pt Field Goal Attempts Per Game (SR)'?: string;
    '3-Pt Field Goals (SR)'?: string;
    '3-Pt Field Goals Per Game (SR)'?: string;
    '3-Pt Field Goal Attempts (SR)'?: string;
    '3-Pt Field Goal Attempts Per Game (SR)'?: string;
    'Field Goals Missed (SR)'?: string;
    'Free Throws (SR)'?: string;
    'Free Throws Per Game (SR)'?: string;
    'Free Throw Attempts (SR)'?: string;
    'Free Throw Attempts Per Game (SR)'?: string;
    'Games (SR)'?: string;
    'Minutes Played (SR)'?: string;
    'Minutes Per Game (SR)'?: string;
    'Turnovers (SR)'?: string;
    'Personal Fouls (SR)'?: string;
    'Player Efficiency Rating (SR)'?: string;
    'Win Shares (SR)'?: string;
    'Offensive Win Shares (SR)'?: string;
    'Defensive Win Shares (SR)'?: string;
    'Win Shares Per 48 Minutes (SR)'?: string;
    'Box Plus/Minus (SR)'?: string;
    'Offensive Box Plus/Minus (SR)'?: string;
    'Defensive Box Plus/Minus (SR)'?: string;
    'Value Over Replacement Player (SR)'?: string;
    'Offensive Rating (SR)'?: string;
    'Defensive Rating (SR)'?: string;
    'Usage Pct (SR)'?: string;
    'Assist Pct (SR)'?: string;
    'Steal Pct (SR)'?: string;
    'Triple-Doubles (SR)'?: string;
    'Points Per 36 Minutes (SR)'?: string;
    'Assists Per 36 Minutes (SR)'?: string;
    'Field Goals Per 36 Minutes (SR)'?: string;
    'Free Throws Per 36 Minutes (SR)'?: string;
    'Free Throw Attempts Per 36 Minutes (SR)'?: string;
    'Steals Per 36 Minutes (SR)'?: string;
    'Turnovers Per 36 Minutes (SR)'?: string;
    'Points Per 100 Possessions (SR)'?: string;
    'Assists Per 100 Possessions (SR)'?: string;
    'Field Goals Per 100 Possessions (SR)'?: string;
    '2-Pt Field Goals Per 100 Possessions (SR)'?: string;
    '2-Pt Field Goal Attempts Per 100 Possessions (SR)'?: string;
    'Free Throws Per 100 Possessions (SR)'?: string;
    'Free Throw Attempts Per 100 Possessions (SR)'?: string;
    'Steals Per 100 Possessions (SR)'?: string;
    'Turnovers Per 100 Possessions (SR)'?: string;
    'Hall of Fame Probability (SR)'?: string;
    'Transactions (SR)'?: string;
  };
}

interface PlayerData {
  'Name (SR)'?: string;
  'Team (SR)'?: string;
  'Position (SR)'?: string;
  'Height (SR)'?: string;
  'Weight (SR)'?: string;
  'Born Date (SR)'?: string;
  'Born Location (SR)'?: string;
  'High School (SR)'?: string;
  'College (SR)'?: string;
  'Draft (SR)'?: string;
  'Hall of Fame (SR)'?: string;
  'Awards (SR)'?: string;
  'All Awards (SR)'?: string;
  'Transactions (SR)'?: string;
  'Instagram (SR)'?: string;
  'Player News RSS Feed (SR)'?: string;
}

async function getPlayerURLsFromAirtable(): Promise<AirtableRecord[]> {
  if (!AIRTABLE_TOKEN) {
    throw new Error('AIRTABLE_TOKEN environment variable is required');
  }

  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  // Paginate through all records
  do {
    let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PLAYERS_TABLE_ID}?view=${AIRTABLE_VIEW_ID}&pageSize=100`;
    if (offset) {
      url += `&offset=${offset}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data: any = await response.json();
    
    if (!response.ok) {
      console.error('Airtable API error:', data);
      throw new Error(`Airtable API error: ${response.status}`);
    }

    allRecords.push(...(data.records || []));
    offset = data.offset;
  } while (offset);

  console.log(`📋 Total records in view: ${allRecords.length}`);
  
  // Filter records: only process if SR Player URL exists
  const filtered = allRecords.filter(record => 
    record.fields['Player URL (SR)']
  );
  
  console.log(`🔗 Records with Player URL (SR): ${filtered.length}`);
  
  return filtered;
}

async function scrapePlayerData(url: string, browser: Browser): Promise<PlayerData> {
  const page = await browser.newPage();
  const data: PlayerData = {};

  try {
    // Enable request interception for resource blocking
    await page.setRequestInterception(true);
    
    // Block images, stylesheets, and fonts for faster page loads
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Handle ad blocker detection modal if present
    try {
      // Wait a bit for the modal to appear
      await page.waitForSelector('button', { timeout: 2000 }).catch(() => {});
      
      // Try to find and click "Continue to the site without supporting us" or close button
      await page.evaluate(() => {
        // Look for the continue link/button
        const continueText = Array.from(document.querySelectorAll('*')).find(el => 
          el.textContent?.includes('Continue to the site without supporting')
        ) as HTMLElement;
        if (continueText) {
          continueText.click();
          return;
        }
        
        // Look for X close button
        const closeButton = document.querySelector('button[aria-label="Close"]') as HTMLElement;
        if (closeButton) {
          closeButton.click();
          return;
        }
        
        // Look for any button with "DISABLE" text
        const disableButton = Array.from(document.querySelectorAll('button')).find(btn =>
          btn.textContent?.includes('DISABLE')
        ) as HTMLElement;
        if (disableButton) {
          // Don't click this one, look for other options
        }
      });
      
      // Wait a moment for the modal to close
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      // No modal found, continue
    }

    const scrapedData = await page.evaluate(() => {
      const result: any = {};

      // BR Name
      const h1 = document.querySelector('h1');
      result['Name (SR)'] = h1?.textContent?.trim();

      // Instagram - only set if actually found
      const instagramLink = Array.from(document.querySelectorAll('a')).find(a => 
        a.href && a.href.includes('instagram.com')
      );
      result['Instagram (SR)'] = instagramLink?.href || undefined;

      // Position - extract from <strong>Position</strong>: QB
      const positionP = Array.from(document.querySelectorAll('p')).find(p => {
        const strong = p.querySelector('strong');
        return strong?.textContent?.trim() === 'Position';
      });
      if (positionP) {
        // Get full text and parse it
        const fullText = positionP.textContent || '';
        // Remove newlines and normalize spaces
        const cleanText = fullText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        // Match "Position: XX" where XX is capital letters
        const posMatch = cleanText.match(/Position:\s*([A-Z]+)/);
        if (posMatch) {
          result['Position (SR)'] = posMatch[1]?.trim();
        }
      }

      // Height and Weight - look for spans containing height/weight pattern
      const heightWeightP = Array.from(document.querySelectorAll('p')).find(p => {
        const spans = p.querySelectorAll('span');
        return spans.length > 0 && p.textContent?.includes('cm');
      });
      if (heightWeightP) {
        const spans = heightWeightP.querySelectorAll('span');
        if (spans[0]) {
          const heightStr = spans[0].textContent?.trim() || ''; // e.g., "6-10"
          // Convert feet-inches to cm: 6'10" = 6*12+10 = 82 inches = 208.28 cm
          const heightMatch = heightStr.match(/(\d+)-(\d+)/);
          if (heightMatch) {
            const feet = parseInt(heightMatch[1]);
            const inches = parseInt(heightMatch[2]);
            const totalInches = feet * 12 + inches;
            const cm = Math.round(totalInches * 2.54);
            result['Height (SR)'] = cm.toString();
          }
        }
        if (spans[1]) {
          const weightStr = spans[1].textContent?.trim() || ''; // e.g., "215lb"
          // Convert lbs to kg: 215 lb * 0.453592 ≈ 97.5 kg
          const weightMatch = weightStr.match(/(\d+)\s*lb/);
          if (weightMatch) {
            const lbs = parseInt(weightMatch[1]);
            const kg = Math.round(lbs * 0.453592);
            result['Weight (SR)'] = kg.toString();
          }
        }
      }

      // Born Location - extract location only
      let birthLocation = '';
      const jsonLdScript = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).find(s => 
        s.textContent?.includes('birthDate')
      );
      if (jsonLdScript) {
        try {
          const jsonData = JSON.parse(jsonLdScript.textContent || '{}');
          if (jsonData.birthPlace) {
            birthLocation = jsonData.birthPlace;
          }
        } catch (e) {
          // JSON parse failed, fall back to text parsing
        }
      }
      // Fallback: parse from text if JSON-LD didn't work
      if (!birthLocation) {
        const bornText = Array.from(document.querySelectorAll('p')).find(p =>
          p.textContent?.includes('Born:')
        )?.textContent;
        if (bornText) {
          // Look for pattern like "Born: August 3, 2005, Milwaukee, Wisconsin"
          const match = bornText.match(/Born:\s*[A-Za-z]+ \d+,\s*\d{4},\s*(.+?)(?:\n|$)/);
          if (match) {
            birthLocation = match[1].trim();
          }
        }
      }
      result['Born Location (SR)'] = birthLocation;

      // High School
      const hsText = Array.from(document.querySelectorAll('p')).find(p =>
        p.textContent?.includes('High School:')
      )?.textContent;
      if (hsText) {
        result['High School (SR)'] = hsText.split('High School:')[1]?.trim();
      }

      // College - extract from <strong>College</strong>: <a href="/schools/arizona/">Arizona</a>
      const collegeP = Array.from(document.querySelectorAll('p')).find(p =>
        p.textContent?.includes('College:')
      );
      if (collegeP) {
        const collegeLink = collegeP.querySelector('a[href*="/schools/"]');
        if (collegeLink) {
          result['College (SR)'] = collegeLink.textContent?.trim();
        }
      }

      // Draft - look for draft paragraph and combine all info
      const draftP = Array.from(document.querySelectorAll('p')).find(p =>
        p.textContent?.includes('Draft:')
      );
      if (draftP) {
        const text = draftP.textContent || '';
        // Extract everything after "Draft:" as the draft info
        const draftMatch = text.match(/Draft:\s*(.+?)(?:\n|$)/);
        if (draftMatch) {
          result['Draft (SR)'] = draftMatch[1]?.trim();
        }
      }

      // Recruiting Rank
      const rankText = Array.from(document.querySelectorAll('p')).find(p =>
        p.textContent?.includes('Recruiting Rank:')
      )?.textContent;
      if (rankText) {
        result['Recruiting Rank (SR)'] = rankText.split('Recruiting Rank:')[1]?.trim();
      }

      // Experience
      const expText = Array.from(document.querySelectorAll('p')).find(p =>
        p.textContent?.includes('Experience:')
      )?.textContent;
      if (expText) {
        result['Experience (SR)'] = expText.split('Experience:')[1]?.trim();
      }

      // Hall of Fame
      const hofText = Array.from(document.querySelectorAll('p')).find(p =>
        p.textContent?.includes('Hall of Fame:')
      )?.textContent;
      if (hofText) {
        result['Hall of Fame (SR)'] = hofText.split('Hall of Fame:')[1]?.trim();
      }

      // All Awards - extract from awards table tbody with year | award format
      // Look for tbody that contains td.single (awards table)
      const allTbodies = Array.from(document.querySelectorAll('tbody'));
      const awardsTbody = allTbodies.find(tbody => {
        const singleTd = tbody.querySelector('td.single');
        return singleTd !== null;
      });
      
      if (awardsTbody) {
        const awardRows = Array.from(awardsTbody.querySelectorAll('tr'));
        const awardItems = awardRows.map(row => {
          const td = row.querySelector('td.single');
          if (!td) return '';
          
          const allText = td.textContent?.trim() || '';
          const links = Array.from(td.querySelectorAll('a'));
          if (links.length === 0) return allText;
          
          // Check if first link contains a year (e.g., "2007 NFL")
          const firstLinkText = links[0]?.textContent?.trim() || '';
          const yearMatch = firstLinkText.match(/^(\d{4})\s+NFL/);
          
          if (yearMatch && links.length > 1) {
            // Format: YEAR | NFL AwardName
            const year = yearMatch[1];
            const awardText = links[links.length - 1]?.textContent?.trim() || '';
            return `${year} | NFL ${awardText}`;
          } else {
            // No year - just the full text content
            return allText;
          }
        }).filter(text => text.length > 0);
        result['All Awards (SR)'] = awardItems.length > 0 ? awardItems.join('\n') : undefined;
      }

      // Transactions - extract from div_transactions
      const transactionsDiv = document.querySelector('#div_transactions');
      if (transactionsDiv) {
        const transactionItems = Array.from(transactionsDiv.querySelectorAll('ul li'));
        const transactions = transactionItems.map(li => {
          // Get text and clean up extra whitespace
          const text = li.textContent?.trim() || '';
          return text.replace(/\s+/g, ' ');
        }).filter(text => text.length > 0);
        result['Transactions (SR)'] = transactions.length > 0 ? transactions.join('\n') : undefined;
      }

      // Player News RSS - look for link with /players/news.fcgi?id=...&rss=1
      const newsRssLink = Array.from(document.querySelectorAll('a')).find(a =>
        a.href && a.href.includes('/players/news.fcgi') && a.href.includes('rss=1')
      );
      if (newsRssLink) {
        const href = newsRssLink.href;
        // Convert relative URL to absolute
        result['Player News RSS Feed (SR)'] = href.startsWith('http') ? href : `https://www.pro-football-reference.com${href}`;
      }

      return result;
    });

    Object.assign(data, scrapedData);

    // Extract all leaderboard statistics (72 fields)
    const leaderboards: Record<string, string> = {
      'leaderboard_notable-awards': 'All Awards (SR)',
      'leaderboard_allstar': 'All-Star Games (SR)',
      'leaderboard_weekly_awards': 'Weekly Awards (SR)',
      'leaderboard_monthly_awards': 'Monthly Awards (SR)',
      'leaderboard_all_league': 'All-League (SR)',
      'leaderboard_mvp_shares': 'MVP Award Shares (SR)',
      'leaderboard_all_nba_shares': 'All-NBA Voting Shares (SR)',
      'leaderboard_all_defense_shares': 'All-Defensive Voting Shares (SR)',
      'leaderboard_all_rookie_shares': 'All-Rookie Voting Shares (SR)',
      'leaderboard_amateur-honors': 'Amateur Honors (SR)',
      'leaderboard_pts': 'Points (SR)',
      'leaderboard_pts_per_g': 'Points Per Game (SR)',
      'leaderboard_trb': 'Total Rebounds (SR)',
      'leaderboard_drb': 'Defensive Rebounds (SR)',
      'leaderboard_ast': 'Assists (SR)',
      'leaderboard_ast_per_g': 'Assists Per Game (SR)',
      'leaderboard_stl': 'Steals (SR)',
      'leaderboard_stl_per_g': 'Steals Per Game (SR)',
      'leaderboard_ft_pct': 'Free Throw Pct (SR)',
      'leaderboard_fg3_pct': '3-Pt Field Goal Pct (SR)',
      'leaderboard_fg2_pct': '2-Pt Field Goal Pct (SR)',
      'leaderboard_efg_pct': 'Effective Field Goal Pct (SR)',
      'leaderboard_ts_pct': 'True Shooting Pct (SR)',
      'leaderboard_fg': 'Field Goals (SR)',
      'leaderboard_fg_per_g': 'Field Goals Per Game (SR)',
      'leaderboard_fga': 'Field Goal Attempts (SR)',
      'leaderboard_fga_per_g': 'Field Goal Attempts Per Game (SR)',
      'leaderboard_fg2': '2-Pt Field Goals (SR)',
      'leaderboard_fg2_per_g': '2-Pt Field Goals Per Game (SR)',
      'leaderboard_fg2a': '2-Pt Field Goal Attempts (SR)',
      'leaderboard_fg2a_per_g': '2-Pt Field Goal Attempts Per Game (SR)',
      'leaderboard_fg3': '3-Pt Field Goals (SR)',
      'leaderboard_fg3_per_g': '3-Pt Field Goals Per Game (SR)',
      'leaderboard_fg3a': '3-Pt Field Goal Attempts (SR)',
      'leaderboard_fg3a_per_g': '3-Pt Field Goal Attempts Per Game (SR)',
      'leaderboard_fgx': 'Field Goals Missed (SR)',
      'leaderboard_ft': 'Free Throws (SR)',
      'leaderboard_ft_per_g': 'Free Throws Per Game (SR)',
      'leaderboard_fta': 'Free Throw Attempts (SR)',
      'leaderboard_fta_per_g': 'Free Throw Attempts Per Game (SR)',
      'leaderboard_g': 'Games (SR)',
      'leaderboard_mp': 'Minutes Played (SR)',
      'leaderboard_mp_per_g': 'Minutes Per Game (SR)',
      'leaderboard_tov': 'Turnovers (SR)',
      'leaderboard_pf': 'Personal Fouls (SR)',
      'leaderboard_per': 'Player Efficiency Rating (SR)',
      'leaderboard_ws': 'Win Shares (SR)',
      'leaderboard_ows': 'Offensive Win Shares (SR)',
      'leaderboard_dws': 'Defensive Win Shares (SR)',
      'leaderboard_ws_per_48': 'Win Shares Per 48 Minutes (SR)',
      'leaderboard_bpm': 'Box Plus/Minus (SR)',
      'leaderboard_obpm': 'Offensive Box Plus/Minus (SR)',
      'leaderboard_dbpm': 'Defensive Box Plus/Minus (SR)',
      'leaderboard_vorp': 'Value Over Replacement Player (SR)',
      'leaderboard_off_rtg': 'Offensive Rating (SR)',
      'leaderboard_def_rtg': 'Defensive Rating (SR)',
      'leaderboard_usg_pct': 'Usage Pct (SR)',
      'leaderboard_ast_pct': 'Assist Pct (SR)',
      'leaderboard_stl_pct': 'Steal Pct (SR)',
      'leaderboard_trp_dbl': 'Triple-Doubles (SR)',
      'leaderboard_pts_per_mp': 'Points Per 36 Minutes (SR)',
      'leaderboard_ast_per_mp': 'Assists Per 36 Minutes (SR)',
      'leaderboard_fg_per_mp': 'Field Goals Per 36 Minutes (SR)',
      'leaderboard_ft_per_mp': 'Free Throws Per 36 Minutes (SR)',
      'leaderboard_fta_per_mp': 'Free Throw Attempts Per 36 Minutes (SR)',
      'leaderboard_stl_per_mp': 'Steals Per 36 Minutes (SR)',
      'leaderboard_tov_per_mp': 'Turnovers Per 36 Minutes (SR)',
      'leaderboard_pts_per_poss': 'Points Per 100 Possessions (SR)',
      'leaderboard_ast_per_poss': 'Assists Per 100 Possessions (SR)',
      'leaderboard_fg_per_poss': 'Field Goals Per 100 Possessions (SR)',
      'leaderboard_fg2_per_poss': '2-Pt Field Goals Per 100 Possessions (SR)',
      'leaderboard_fg2a_per_poss': '2-Pt Field Goal Attempts Per 100 Possessions (SR)',
      'leaderboard_ft_per_poss': 'Free Throws Per 100 Possessions (SR)',
      'leaderboard_fta_per_poss': 'Free Throw Attempts Per 100 Possessions (SR)',
      'leaderboard_stl_per_poss': 'Steals Per 100 Possessions (SR)',
      'leaderboard_tov_per_poss': 'Turnovers Per 100 Possessions (SR)',
      'leaderboard_hof_prob': 'Hall of Fame Probability (SR)',
    };

    const leaderboardData = await page.evaluate((leaderboardMap) => {
      const result: Record<string, string> = {};
      
      for (const [divId, fieldName] of Object.entries(leaderboardMap)) {
        const divElement = document.getElementById(divId);
        if (divElement) {
          // Extract text from individual data items, skip headers and buttons
          const items: string[] = [];
          
          // Find the container div (first div child after h4 and p)
          const containerDiv = divElement.querySelector('div');
          if (containerDiv) {
            // Get all direct child divs which contain the data
            const childDivs = containerDiv.querySelectorAll(':scope > div');
            childDivs.forEach(childDiv => {
              // Extract text from the span inside each div
              const span = childDiv.querySelector('span');
              if (span) {
                const text = span.textContent?.trim();
                if (text && text.length > 0) {
                  // Clean up whitespace
                  items.push(text.replace(/\s+/g, ' '));
                }
              }
            });
          }
          
          if (items.length > 0) {
            result[fieldName] = items.join('\n');
          }
        }
      }
      
      return result;
    }, leaderboards);

    Object.assign(data, leaderboardData);

    // Extract transactions
    const transactionsDiv = await page.$('#div_transactions');
    if (transactionsDiv) {
      const transactionsText = await transactionsDiv.evaluate(el => {
        const paragraphs = el.querySelectorAll('p');
        const transactions: string[] = [];
        
        paragraphs.forEach(p => {
          let text = p.textContent?.trim() || '';
          if (text.length > 0) {
            // Convert dates to ISO format (e.g., "June 28, 2005" -> "2005-06-28")
            text = text.replace(
              /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/g,
              (match, month, day, year) => {
                const monthMap: Record<string, string> = {
                  'January': '01', 'February': '02', 'March': '03', 'April': '04',
                  'May': '05', 'June': '06', 'July': '07', 'August': '08',
                  'September': '09', 'October': '10', 'November': '11', 'December': '12'
                };
                const monthNum = monthMap[month];
                const dayPadded = day.padStart(2, '0');
                return `${year}-${monthNum}-${dayPadded}`;
              }
            );
            transactions.push(text);
          }
        });
        
        return transactions.join('\n\n');
      });
      if (transactionsText) {
        data['Transactions (SR)'] = transactionsText;
      }
    }

    // Team - look for <p><strong>Team</strong>: pattern first (primary extraction method)
    let teamValue = '';
    const allParagraphs = Array.from(await page.$$('p'));
    for (const p of allParagraphs) {
      const strongTag = await p.$('strong');
      if (strongTag) {
        const strongText = await strongTag.evaluate(el => el.textContent?.trim());
        if (strongText === 'Team') {
          const teamLink = await p.$('a');
          if (teamLink) {
            teamValue = await teamLink.evaluate(el => el.textContent?.trim() || '');
            break;
          }
        }
      }
    }

    // Fallback: find link with /teams/ in href
    if (!teamValue) {
      const teamLinks = await page.$$('a[href*="/teams/"]');
      for (const link of teamLinks) {
        const href = await link.evaluate(el => (el as HTMLAnchorElement).href);
        const text = await link.evaluate(el => el.textContent?.trim());
        if (href.includes('/teams/') && !href.includes('/draft') && !href.includes('/coaches/') && text?.includes('202')) {
          teamValue = text || '';
          break;
        }
      }
    }

    if (teamValue) {
      data['Team (SR)'] = teamValue;
    }

  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    throw error;
  } finally {
    await page.close();
  }

  return data;
}

async function batchUpdateRecords(updates: Array<{ id: string; fields: any }>): Promise<void> {
  if (updates.length === 0) return;

  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PLAYERS_TABLE_ID}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ records: updates })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to batch update records: ${JSON.stringify(error)}`);
  }
}

function prepareUpdateFields(oldRecord: AirtableRecord, data: PlayerData): any {
  const today = new Date().toISOString().split('T')[0];

  // Check if extraction failed (no data extracted at all)
  const hasAnyData = data['Name (SR)'] || data['Team (SR)'] || data['Born Date (SR)'] || data['College (SR)'] ||
    data['Height (SR)'] || data['Weight (SR)'] || data['Position (SR)'] || data['All Awards (SR)'];

  if (!hasAnyData) {
    return {
      'Data Status (SR)': 'Error',
      'Last Check (SR)': today,
      'Updates (SR)': 'Failed to extract data from Pro Football Reference page after multiple attempts',
    };
  }

  // Compare with existing data to detect changes
  const changes: string[] = [];
  const oldFields = oldRecord.fields;

  if (data['Name (SR)'] && data['Name (SR)'] !== oldFields['Name (SR)']) {
    changes.push('Name: Updated (SR)');
  }
  if (data['Team (SR)'] && data['Team (SR)'] !== oldFields['Team (SR)']) {
    changes.push('Team: Updated (SR)');
  }
  if (data['Position (SR)'] && data['Position (SR)'] !== oldFields['Position (SR)']) {
    changes.push('Position: Updated (SR)');
  }
  if (data['Height (SR)'] && data['Height (SR)'] !== oldFields['Height (SR)']) {
    changes.push('Height: Updated (SR)');
  }
  if (data['Weight (SR)'] && data['Weight (SR)'] !== oldFields['Weight (SR)']) {
    changes.push('Weight: Updated (SR)');
  }
  if (data['Born Date (SR)'] && data['Born Date (SR)'] !== oldFields['Born Date (SR)']) {
    changes.push('Born Date: Updated (SR)');
  }
  if (data['Born Location (SR)'] && data['Born Location (SR)'] !== oldFields['Born Location (SR)']) {
    changes.push('Born Location: Updated (SR)');
  }
  if (data['High School (SR)'] && data['High School (SR)'] !== oldFields['High School (SR)']) {
    changes.push('High School: Updated (SR)');
  }
  if (data['College (SR)'] && data['College (SR)'] !== oldFields['College (SR)']) {
    changes.push('College: Updated (SR)');
  }
  if (data['Draft (SR)'] && data['Draft (SR)'] !== oldFields['Draft (SR)']) {
    changes.push('Draft: Updated (SR)');
  }
  if (data['Hall of Fame (SR)'] && data['Hall of Fame (SR)'] !== oldFields['Hall of Fame (SR)']) {
    changes.push('Hall of Fame: Updated (SR)');
  }
  if (data['Awards (SR)'] && data['Awards (SR)'] !== oldFields['Awards (SR)']) {
    changes.push('Awards: Updated (SR)');
  }
  if (data['All Awards (SR)'] && data['All Awards (SR)'] !== oldFields['All Awards (SR)']) {
    changes.push('All Awards: Updated (SR)');
  }
  if (data['Transactions (SR)'] && data['Transactions (SR)'] !== oldFields['Transactions (SR)']) {
    changes.push('Transactions: Updated (SR)');
  }
  if (data['Instagram (SR)'] && data['Instagram (SR)'] !== oldFields['Instagram (SR)']) {
    changes.push('Instagram: Updated (SR)');
  }
  if (data['Player News RSS Feed (SR)'] && data['Player News RSS Feed (SR)'] !== oldFields['Player News RSS Feed (SR)']) {
    changes.push('Player News RSS Feed: Updated (SR)');
  }
  const status = changes.length > 0 ? 'Updated' : 'Complete';
  const updates = changes.length > 0 ? changes.join('; ') : `Verified on ${today}`;

  const fields: any = {
    'Data Status (SR)': status,
    'Last Check (SR)': today,
    'Updates (SR)': updates,
  };

  if (data['Name (SR)']) fields['Name (SR)'] = data['Name (SR)'];
  if (data['Team (SR)']) fields['Team (SR)'] = data['Team (SR)'];
  if (data['Position (SR)']) fields['Position (SR)'] = data['Position (SR)'];
  if (data['Height (SR)']) fields['Height (SR)'] = data['Height (SR)'];
  if (data['Weight (SR)']) fields['Weight (SR)'] = data['Weight (SR)'];
  if (data['Born Date (SR)']) fields['Born Date (SR)'] = data['Born Date (SR)'];
  if (data['Born Location (SR)']) fields['Born Location (SR)'] = data['Born Location (SR)'];
  if (data['High School (SR)']) fields['High School (SR)'] = data['High School (SR)'];
  if (data['College (SR)']) fields['College (SR)'] = data['College (SR)'];
  if (data['Draft (SR)']) fields['Draft (SR)'] = data['Draft (SR)'];
  if (data['Hall of Fame (SR)']) fields['Hall of Fame (SR)'] = data['Hall of Fame (SR)'];
  if (data['Awards (SR)']) fields['Awards (SR)'] = data['Awards (SR)'];
  if (data['All Awards (SR)']) fields['All Awards (SR)'] = data['All Awards (SR)'];
  if (data['Transactions (SR)']) fields['Transactions (SR)'] = data['Transactions (SR)'];
  if (data['Instagram (SR)']) fields['Instagram (SR)'] = data['Instagram (SR)'];
  if (data['Player News RSS Feed (SR)']) fields['Player News RSS Feed (SR)'] = data['Player News RSS Feed (SR)'];

  return fields;
}

async function main(): Promise<void> {
  if (!AIRTABLE_TOKEN) {
    console.error('❌ AIRTABLE_TOKEN environment variable is required');
    process.exit(1);
  }

  let browser: Browser | null = null;

  try {
    console.log('🏈 NFL Football Reference Player Enrichment');
    console.log('============================================\n');

    // Fetch records from Airtable
    console.log('📥 Fetching player URLs from Airtable...');
    const records = await getPlayerURLsFromAirtable();
    console.log(`✅ Found ${records.length} records to process\n`);

    // Launch browser
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Process each record with batch updates
    const updateBatch: Array<{ id: string; fields: any }> = [];
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const url = record.fields['Player URL (SR)'];

      if (!url) {
        console.log(`⏭️  Skipping record ${record.id} - no URL`);
        continue;
      }

      console.log(`[${i + 1}/${records.length}] (${Math.round((i + 1) / records.length * 100)}%) Processing URL`);
      console.log(`🔍 Scraping: ${url}`);

      try {
        const playerData = await scrapePlayerData(url, browser);
        const updateFields = prepareUpdateFields(record, playerData);
        
        updateBatch.push({
          id: record.id,
          fields: updateFields
        });

        console.log(`✅ Extracted data for ${playerData['Name (SR)'] || 'Unknown'}`);

        // Batch update every UPDATE_BATCH_SIZE records
        if (updateBatch.length >= UPDATE_BATCH_SIZE) {
          console.log(`📤 Updating batch of ${updateBatch.length} records...`);
          await batchUpdateRecords(updateBatch);
          updateBatch.length = 0; // Clear the batch
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Error: ${errorMsg}`);
        
        const today = new Date().toISOString().split('T')[0];
        updateBatch.push({
          id: record.id,
          fields: {
            'Data Status (SR)': 'Error',
            'Last Check (SR)': today,
            'Updates (SR)': errorMsg
          }
        });

        // Batch update on error too
        if (updateBatch.length >= UPDATE_BATCH_SIZE) {
          console.log(`📤 Updating batch of ${updateBatch.length} records...`);
          await batchUpdateRecords(updateBatch);
          updateBatch.length = 0;
        }
      }
    }

    // Final batch update for remaining records
    if (updateBatch.length > 0) {
      console.log(`📤 Updating final batch of ${updateBatch.length} records...`);
      await batchUpdateRecords(updateBatch);
    }

    console.log('\n✅ Enrichment complete!');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

main();
