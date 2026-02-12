import dotenv from 'dotenv';
import { parsePhoneNumber, CountryCode } from 'libphonenumber-js';

dotenv.config();

// Configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE_ID = process.env.AIRTABLE_TABLE_ID!;
const SOURCE_VIEW_ID = process.env.AIRTABLE_SOURCE_VIEW_ID!;
const TARGET_VIEW_ID = process.env.AIRTABLE_TARGET_VIEW_ID!;
const TEST_MODE = process.env.TEST_MODE === 'true';
const TEST_LIMIT = parseInt(process.env.TEST_LIMIT || '10', 10);
const CONFIDENCE_THRESHOLD = parseInt(process.env.CONFIDENCE_THRESHOLD || '90', 10);

// RapidAPI Keys for Website Contacts Scraper (50 req/month per key, 1 req/sec)
const WEBSITE_CONTACTS_API_KEYS = [
  'c83516b3acmshdfd6347a5914a11p17e517jsn06a3c5de8b13',
  '7f039e9cd5msh7d53bf9623df131p1191ccjsnd5baa1efdd82',
  '0be625e0dbmshe3f58bae0a1b103p1a9cb4jsn8f4252e04b42',
  'bfb3e64505mshd9c819df5fb856fp18e4f4jsn98cea7554500',
  '4146451f26mshca24e2bfa13bff4p1aab81jsn84d33f841460',
  '8be5f006c9mshd812675480db254p1b653ejsn602cc9149241',
  '2a6da923bamsh0840070fa506709p145861jsnae8888e67f00',
  '0be625e0dbmshe3f58bae0a1b103p1a9cb4jsn8f4252e04b42',
  'cea3641b50msh52581f483562ccdp186ee6jsn6759e8241393',
  '8f8ab324eamsh88b8de70b402e0cp1d7d0ajsn13c934eadbd9',
  '4030dde5ddmshe67eb1d7832914dp17c97ajsndaa5b65ce7d4',
  '730a02e172msh79ca9cab92fe41dp1b34a2jsnd53411309cd7',
];

// RapidAPI Keys for Social Scraper (200 req/month per key, 1000 req/hour)
const SOCIAL_SCRAPER_API_KEYS = [
  'c83516b3acmshdfd6347a5914a11p17e517jsn06a3c5de8b13',
  '7f039e9cd5msh7d53bf9623df131p1191ccjsnd5baa1efdd82',
  '0be625e0dbmshe3f58bae0a1b103p1a9cb4jsn8f4252e04b42',
  'bfb3e64505mshd9c819df5fb856fp18e4f4jsn98cea7554500',
  '4146451f26mshca24e2bfa13bff4p1aab81jsn84d33f841460',
  '8be5f006c9mshd812675480db254p1b653ejsn602cc9149241',
  '2a6da923bamsh0840070fa506709p145861jsnae8888e67f00',
  '0be625e0dbmshe3f58bae0a1b103p1a9cb4jsn8f4252e04b42',
  'cea3641b50msh52581f483562ccdp186ee6jsn6759e8241393',
  '8f8ab324eamsh88b8de70b402e0cp1d7d0ajsn13c934eadbd9',
  '4030dde5ddmshe67eb1d7832914dp17c97ajsndaa5b65ce7d4',
  '730a02e172msh79ca9cab92fe41dp1b34a2jsnd53411309cd7',
];

// RapidAPI Keys for LinkedIn Scraper (500 req/month per key, 1000 req/hour)
const LINKEDIN_SCRAPER_API_KEYS = [
  'c83516b3acmshdfd6347a5914a11p17e517jsn06a3c5de8b13',
  '7f039e9cd5msh7d53bf9623df131p1191ccjsnd5baa1efdd82',
  '0be625e0dbmshe3f58bae0a1b103p1a9cb4jsn8f4252e04b42',
  'bfb3e64505mshd9c819df5fb856fp18e4f4jsn98cea7554500',
  '4146451f26mshca24e2bfa13bff4p1aab81jsn84d33f841460',
  '8be5f006c9mshd812675480db254p1b653ejsn602cc9149241',
  '2a6da923bamsh0840070fa506709p145861jsnae8888e67f00',
  '0be625e0dbmshe3f58bae0a1b103p1a9cb4jsn8f4252e04b42',
  'cea3641b50msh52581f483562ccdp186ee6jsn6759e8241393',
  '8f8ab324eamsh88b8de70b402e0cp1d7d0ajsn13c934eadbd9',
  '4030dde5ddmshe67eb1d7832914dp17c97ajsndaa5b65ce7d4',
  '730a02e172msh79ca9cab92fe41dp1b34a2jsnd53411309cd7',
];

// RapidAPI Keys for Facebook Scraper (200 req/month per key, 1000 req/hour)
const FACEBOOK_SCRAPER_API_KEYS = [
  'c83516b3acmshdfd6347a5914a11p17e517jsn06a3c5de8b13',
  '7f039e9cd5msh7d53bf9623df131p1191ccjsnd5baa1efdd82',
  '0be625e0dbmshe3f58bae0a1b103p1a9cb4jsn8f4252e04b42',
  'bfb3e64505mshd9c819df5fb856fp18e4f4jsn98cea7554500',
  '4146451f26mshca24e2bfa13bff4p1aab81jsn84d33f841460',
  '8be5f006c9mshd812675480db254p1b653ejsn602cc9149241',
  '2a6da923bamsh0840070fa506709p145861jsnae8888e67f00',
  '0be625e0dbmshe3f58bae0a1b103p1a9cb4jsn8f4252e04b42',
  'cea3641b50msh52581f483562ccdp186ee6jsn6759e8241393',
  '8f8ab324eamsh88b8de70b402e0cp1d7d0ajsn13c934eadbd9',
  '4030dde5ddmshe67eb1d7832914dp17c97ajsndaa5b65ce7d4',
  '730a02e172msh79ca9cab92fe41dp1b34a2jsnd53411309cd7',
];

// RapidAPI Keys for Instagram Scraper (unlimited req/month, standard rate limit)
const INSTAGRAM_SCRAPER_API_KEYS = [
  'c83516b3acmshdfd6347a5914a11p17e517jsn06a3c5de8b13',
  '7f039e9cd5msh7d53bf9623df131p1191ccjsnd5baa1efdd82',
  '0be625e0dbmshe3f58bae0a1b103p1a9cb4jsn8f4252e04b42',
  'bfb3e64505mshd9c819df5fb856fp18e4f4jsn98cea7554500',
  '4146451f26mshca24e2bfa13bff4p1aab81jsn84d33f841460',
  '8be5f006c9mshd812675480db254p1b653ejsn602cc9149241',
  '2a6da923bamsh0840070fa506709p145861jsnae8888e67f00',
  '0be625e0dbmshe3f58bae0a1b103p1a9cb4jsn8f4252e04b42',
  'cea3641b50msh52581f483562ccdp186ee6jsn6759e8241393',
  '8f8ab324eamsh88b8de70b402e0cp1d7d0ajsn13c934eadbd9',
  '4030dde5ddmshe67eb1d7832914dp17c97ajsndaa5b65ce7d4',
  '730a02e172msh79ca9cab92fe41dp1b34a2jsnd53411309cd7',
];

let currentWebsiteContactsKeyIndex = 0;
let currentSocialScraperKeyIndex = 0;
let currentLinkedInScraperKeyIndex = 0;
let currentFacebookScraperKeyIndex = 0;
let currentInstagramScraperKeyIndex = 0;

// Helper to format date as YYYY.MM.DD
function formatDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// Extract website domain from emails (excluding generic email providers)
function extractWebsiteFromEmails(emailsField?: string | string[]): string | null {
  if (!emailsField) return null;
  
  const excludedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'msn.com', 'aol.com', 'icloud.com', 'live.com', 'me.com', 'protonmail.com'];
  
  // Handle both string and array formats
  let emails: string[];
  if (Array.isArray(emailsField)) {
    emails = emailsField.filter(e => e && typeof e === 'string').map(e => e.trim().toLowerCase());
  } else {
    emails = emailsField.split(',').map(e => e.trim().toLowerCase()).filter(e => e);
  }
  
  for (const email of emails) {
    const match = email.match(/@([\w.-]+\.[a-z]{2,})$/i);
    if (match) {
      const domain = match[1];
      if (!excludedDomains.includes(domain)) {
        return domain;
      }
    }
  }
  
  return null;
}

// Get country code from country name
function getCountryCode(countryName?: string): string {
  if (!countryName) return '';
  
  const countryMap: { [key: string]: string } = {
    'united states': 'US',
    'usa': 'US',
    'us': 'US',
    'america': 'US',
    'canada': 'CA',
    'united kingdom': 'GB',
    'uk': 'GB',
    'britain': 'GB',
    'australia': 'AU',
    'new zealand': 'NZ',
    'ireland': 'IE',
    'germany': 'DE',
    'france': 'FR',
    'spain': 'ES',
    'italy': 'IT',
    'netherlands': 'NL',
    'belgium': 'BE',
    'switzerland': 'CH',
    'austria': 'AT',
    'sweden': 'SE',
    'norway': 'NO',
    'denmark': 'DK',
    'finland': 'FI',
    'poland': 'PL',
    'portugal': 'PT',
    'greece': 'GR',
    'czech republic': 'CZ',
    'hungary': 'HU',
    'romania': 'RO',
    'bulgaria': 'BG',
    'slovakia': 'SK',
    'croatia': 'HR',
    'slovenia': 'SI',
    'lithuania': 'LT',
    'latvia': 'LV',
    'estonia': 'EE',
    'japan': 'JP',
    'china': 'CN',
    'india': 'IN',
    'south korea': 'KR',
    'korea': 'KR',
    'singapore': 'SG',
    'hong kong': 'HK',
    'taiwan': 'TW',
    'thailand': 'TH',
    'malaysia': 'MY',
    'indonesia': 'ID',
    'philippines': 'PH',
    'vietnam': 'VN',
    'brazil': 'BR',
    'mexico': 'MX',
    'argentina': 'AR',
    'chile': 'CL',
    'colombia': 'CO',
    'peru': 'PE',
    'venezuela': 'VE',
    'south africa': 'ZA',
    'egypt': 'EG',
    'nigeria': 'NG',
    'kenya': 'KE',
    'israel': 'IL',
    'uae': 'AE',
    'united arab emirates': 'AE',
    'saudi arabia': 'SA',
    'turkey': 'TR',
    'russia': 'RU',
    'ukraine': 'UA',
  };
  
  const normalized = countryName.toLowerCase().trim();
  return countryMap[normalized] || '';
}

// Helper function to check if a task is already complete
function hasTaskComplete(company: CompanyRecord, task: string): boolean {
  const tasks = company.fields['Tasks Complete'] || [];
  return tasks.includes(task);
}

// Helper function to add task to Tasks Complete array
function addTaskComplete(company: CompanyRecord, task: string): void {
  if (!company.fields['Tasks Complete']) {
    company.fields['Tasks Complete'] = [];
  }
  if (!company.fields['Tasks Complete'].includes(task)) {
    company.fields['Tasks Complete'].push(task);
  }
}

// Call Website Contacts Scraper API with key rotation
async function scrapeWebsiteContacts(domain: string): Promise<any | null> {
  const maxRetries = WEBSITE_CONTACTS_API_KEYS.length;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = WEBSITE_CONTACTS_API_KEYS[currentWebsiteContactsKeyIndex];
    
    try {
      console.log(`   🌐 Scraping ${domain} with Website Contacts API (key ${currentWebsiteContactsKeyIndex + 1}/${WEBSITE_CONTACTS_API_KEYS.length})...`);
      
      const url = `https://website-contacts-scraper.p.rapidapi.com/scrape-contacts?query=${encodeURIComponent(domain)}&match_email_domain=false&external_matching=false`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Rapidapi-Key': apiKey,
          'X-Rapidapi-Host': 'website-contacts-scraper.p.rapidapi.com',
        },
      });
      
      if (response.status === 429) {
        console.log(`   ⚠️  Key ${currentWebsiteContactsKeyIndex + 1} rate limited, trying next key...`);
        currentWebsiteContactsKeyIndex = (currentWebsiteContactsKeyIndex + 1) % WEBSITE_CONTACTS_API_KEYS.length;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        continue;
      }
      
      if (!response.ok) {
        console.log(`   ⚠️  API error ${response.status}, trying next key...`);
        currentWebsiteContactsKeyIndex = (currentWebsiteContactsKeyIndex + 1) % WEBSITE_CONTACTS_API_KEYS.length;
        continue;
      }
      
      const data = await response.json() as any;
      
      if (data.status === 'OK' && data.data && data.data.length > 0) {
        console.log(`   ✅ Found contacts data for ${domain}`);
        return data.data[0];
      }
      
      console.log(`   ℹ️  No data found for ${domain}`);
      return null;
      
    } catch (error) {
      console.log(`   ⚠️  Error with key ${currentWebsiteContactsKeyIndex + 1}: ${error}`);
      currentWebsiteContactsKeyIndex = (currentWebsiteContactsKeyIndex + 1) % WEBSITE_CONTACTS_API_KEYS.length;
    }
  }
  
  console.log(`   ❌ All Website Contacts API keys exhausted for ${domain}`);
  return null;
}

// Call Social Scraper API (fallback) with key rotation
async function scrapeSocialProfiles(websiteUrl: string): Promise<any | null> {
  const maxRetries = SOCIAL_SCRAPER_API_KEYS.length;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = SOCIAL_SCRAPER_API_KEYS[currentSocialScraperKeyIndex];
    
    try {
      console.log(`   🌐 Scraping ${websiteUrl} with Social Scraper API (key ${currentSocialScraperKeyIndex + 1}/${SOCIAL_SCRAPER_API_KEYS.length})...`);
      
      const url = `https://website-social-scraper-api.p.rapidapi.com/contacts?website=${encodeURIComponent(websiteUrl)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Rapidapi-Key': apiKey,
          'X-Rapidapi-Host': 'website-social-scraper-api.p.rapidapi.com',
        },
      });
      
      if (response.status === 429) {
        console.log(`   ⚠️  Key ${currentSocialScraperKeyIndex + 1} rate limited, trying next key...`);
        currentSocialScraperKeyIndex = (currentSocialScraperKeyIndex + 1) % SOCIAL_SCRAPER_API_KEYS.length;
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        continue;
      }
      
      if (!response.ok) {
        console.log(`   ⚠️  API error ${response.status}, trying next key...`);
        currentSocialScraperKeyIndex = (currentSocialScraperKeyIndex + 1) % SOCIAL_SCRAPER_API_KEYS.length;
        continue;
      }
      
      const data = await response.json();
      console.log(`   ✅ Found social profiles for ${websiteUrl}`);
      return data;
      
    } catch (error) {
      console.log(`   ⚠️  Error with key ${currentSocialScraperKeyIndex + 1}: ${error}`);
      currentSocialScraperKeyIndex = (currentSocialScraperKeyIndex + 1) % SOCIAL_SCRAPER_API_KEYS.length;
    }
  }
  
  console.log(`   ❌ All Social Scraper API keys exhausted for ${websiteUrl}`);
  return null;
}

// Extract LinkedIn company identifier from URL
function extractLinkedInIdentifier(linkedinUrl: string): string | null {
  if (!linkedinUrl) return null;
  
  // Handle formats like:
  // https://www.linkedin.com/company/youtube/
  // https://linkedin.com/company/youtube
  // linkedin.com/company/youtube
  const match = linkedinUrl.match(/linkedin\.com\/company\/([^\/\?]+)/i);
  return match ? match[1] : null;
}

// Call LinkedIn Scraper API with key rotation
async function scrapeLinkedInCompany(linkedinUrl: string): Promise<any | null> {
  const identifier = extractLinkedInIdentifier(linkedinUrl);
  if (!identifier) {
    console.log(`   ⚠️  Could not extract LinkedIn identifier from: ${linkedinUrl}`);
    return null;
  }
  
  const maxRetries = LINKEDIN_SCRAPER_API_KEYS.length;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = LINKEDIN_SCRAPER_API_KEYS[currentLinkedInScraperKeyIndex];
    
    try {
      console.log(`   🔗 Scraping LinkedIn: ${identifier} (key ${currentLinkedInScraperKeyIndex + 1}/${LINKEDIN_SCRAPER_API_KEYS.length})...`);
      
      const url = `https://linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com/companies/detail?identifier=${encodeURIComponent(identifier)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Rapidapi-Key': apiKey,
          'X-Rapidapi-Host': 'linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com',
        },
      });
      
      if (response.status === 429) {
        console.log(`   ⚠️  Key ${currentLinkedInScraperKeyIndex + 1} rate limited, trying next key...`);
        currentLinkedInScraperKeyIndex = (currentLinkedInScraperKeyIndex + 1) % LINKEDIN_SCRAPER_API_KEYS.length;
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      
      if (!response.ok) {
        console.log(`   ⚠️  API error ${response.status}, trying next key...`);
        currentLinkedInScraperKeyIndex = (currentLinkedInScraperKeyIndex + 1) % LINKEDIN_SCRAPER_API_KEYS.length;
        continue;
      }
      
      const data = await response.json() as any;
      
      if (data.data) {
        console.log(`   ✅ Found LinkedIn company data for ${identifier}`);
        return data.data;
      }
      
      console.log(`   ℹ️  No LinkedIn data found for ${identifier}`);
      return null;
      
    } catch (error) {
      console.log(`   ⚠️  Error with key ${currentLinkedInScraperKeyIndex + 1}: ${error}`);
      currentLinkedInScraperKeyIndex = (currentLinkedInScraperKeyIndex + 1) % LINKEDIN_SCRAPER_API_KEYS.length;
    }
  }
  
  console.log(`   ❌ All LinkedIn Scraper API keys exhausted for ${identifier}`);
  return null;
}

// Call Facebook Scraper API with key rotation
async function scrapeFacebookPage(facebookUrl: string): Promise<any | null> {
  if (!facebookUrl) return null;
  
  const maxRetries = FACEBOOK_SCRAPER_API_KEYS.length;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = FACEBOOK_SCRAPER_API_KEYS[currentFacebookScraperKeyIndex];
    
    try {
      console.log(`   📘 Scraping Facebook: ${facebookUrl} (key ${currentFacebookScraperKeyIndex + 1}/${FACEBOOK_SCRAPER_API_KEYS.length})...`);
      
      const url = `https://facebook-scraper-api4.p.rapidapi.com/get_facebook_pages_details_from_link?link=${encodeURIComponent(facebookUrl)}&show_verified_badge=false&proxy_country=us&page_section=default`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Rapidapi-Key': apiKey,
          'X-Rapidapi-Host': 'facebook-scraper-api4.p.rapidapi.com',
        },
      });
      
      if (response.status === 429) {
        console.log(`   ⚠️  Key ${currentFacebookScraperKeyIndex + 1} rate limited, trying next key...`);
        currentFacebookScraperKeyIndex = (currentFacebookScraperKeyIndex + 1) % FACEBOOK_SCRAPER_API_KEYS.length;
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      
      if (!response.ok) {
        console.log(`   ⚠️  API error ${response.status}, trying next key...`);
        currentFacebookScraperKeyIndex = (currentFacebookScraperKeyIndex + 1) % FACEBOOK_SCRAPER_API_KEYS.length;
        continue;
      }
      
      const data = await response.json() as any;
      
      // Check if it's an error response and try next key
      if (data.success === false) {
        console.log(`   ⚠️  Facebook API error: ${data.message || 'Unknown error'}, trying next key...`);
        currentFacebookScraperKeyIndex = (currentFacebookScraperKeyIndex + 1) % FACEBOOK_SCRAPER_API_KEYS.length;
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      
      // Facebook API returns an array with one object
      if (data && Array.isArray(data) && data.length > 0 && data[0]) {
        console.log(`   ✅ Found Facebook page data`);
        return data[0]; // Return the first object in the array
      }
      
      console.log(`   ℹ️  No Facebook data found`);
      return null;
      
    } catch (error) {
      console.log(`   ⚠️  Error with key ${currentFacebookScraperKeyIndex + 1}: ${error}`);
      currentFacebookScraperKeyIndex = (currentFacebookScraperKeyIndex + 1) % FACEBOOK_SCRAPER_API_KEYS.length;
    }
  }
  
  console.log(`   ❌ All Facebook Scraper API keys exhausted`);
  return null;
}

// Extract Instagram username from URL
function extractInstagramUsername(instagramUrl: string): string | null {
  if (!instagramUrl) return null;
  
  // Handle formats like:
  // https://www.instagram.com/mrbeast/
  // https://instagram.com/mrbeast
  // instagram.com/mrbeast
  const match = instagramUrl.match(/instagram\.com\/([^\/\?]+)/i);
  return match ? match[1] : null;
}

// Call Instagram Scraper API with key rotation
async function scrapeInstagramProfile(instagramUrl: string): Promise<any | null> {
  const username = extractInstagramUsername(instagramUrl);
  if (!username) {
    console.log(`   ⚠️  Could not extract Instagram username from: ${instagramUrl}`);
    return null;
  }
  
  const maxRetries = INSTAGRAM_SCRAPER_API_KEYS.length;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = INSTAGRAM_SCRAPER_API_KEYS[currentInstagramScraperKeyIndex];
    
    try {
      console.log(`   📷 Scraping Instagram: ${username} (key ${currentInstagramScraperKeyIndex + 1}/${INSTAGRAM_SCRAPER_API_KEYS.length})...`);
      
      const url = `https://instagram-social-api.p.rapidapi.com/v1/info?username_or_id_or_url=${encodeURIComponent(username)}&include_about=true&url_embed_safe=true`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Rapidapi-Key': apiKey,
          'X-Rapidapi-Host': 'instagram-social-api.p.rapidapi.com',
        },
      });
      
      if (response.status === 429) {
        console.log(`   ⚠️  Key ${currentInstagramScraperKeyIndex + 1} rate limited, trying next key...`);
        currentInstagramScraperKeyIndex = (currentInstagramScraperKeyIndex + 1) % INSTAGRAM_SCRAPER_API_KEYS.length;
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      
      if (!response.ok) {
        console.log(`   ⚠️  API error ${response.status}, trying next key...`);
        currentInstagramScraperKeyIndex = (currentInstagramScraperKeyIndex + 1) % INSTAGRAM_SCRAPER_API_KEYS.length;
        continue;
      }
      
      const result = await response.json() as any;
      
      // Check for error response
      if (result.error || result.message) {
        console.log(`   ⚠️  Instagram API error: ${result.message || result.error}, trying next key...`);
        currentInstagramScraperKeyIndex = (currentInstagramScraperKeyIndex + 1) % INSTAGRAM_SCRAPER_API_KEYS.length;
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      
      // Instagram API returns data object
      if (result && result.data) {
        console.log(`   ✅ Found Instagram profile data`);
        return result.data;
      }
      
      console.log(`   ℹ️  No Instagram data found`);
      return null;
      
    } catch (error) {
      console.log(`   ⚠️  Error with key ${currentInstagramScraperKeyIndex + 1}: ${error}`);
      currentInstagramScraperKeyIndex = (currentInstagramScraperKeyIndex + 1) % INSTAGRAM_SCRAPER_API_KEYS.length;
    }
  }
  
  console.log(`   ❌ All Instagram Scraper API keys exhausted for ${username}`);
  return null;
}

// Interfaces
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
    'Soc Youtube (Live)'?: string;
    'Soc Emails (Live)'?: string;
    'Soc Phones (Live)'?: string;
    'Phone (Live)'?: string;
    'Tasks Complete'?: string[];
    'LI Universal Name'?: string;
    'LI Description'?: string;
    'LI Tagline'?: string;
    'LI Website'?: string;
    'LI Phone'?: string;
    'LI Specialties'?: string;
    'LI Industries'?: string;
    'LI Founded Info'?: string;
    'LI Employee Count'?: string;
    'LI Follower Count'?: string;
    'LI Employee Count Range'?: string;
    'LI Locations Headquarters'?: string;
    'LI Logo Url'?: string;
    'LI Logo'?: any;
    'FB Title'?: string;
    'FB Rating'?: string;
    'FB Phone'?: string;
    'FB Image'?: string;
    'FB Followers Display'?: string;
    'FB Email'?: string;
    'FB Description'?: string;
    'FB Bio'?: string;
    'FB Address'?: string;
    'FB Logo'?: any;
    'IG Username'?: string;
    'IG Public Phone Number'?: string;
    'IG Public Email'?: string;
    'IG Profile Pic Url Hd'?: string;
    'IG Profile Image'?: any;
    'IG Media Count'?: string;
    'IG Id'?: string;
    'IG Full Name'?: string;
    'IG Following Count'?: string;
    'IG Follower Count'?: string;
    'IG External Url'?: string;
    'IG Contact Phone Number'?: string;
    'IG Category'?: string;
    'IG Biography Email'?: string;
    'IG Biography'?: string;
    'IG Country'?: string;
    'About (Live)'?: string;
    'Notes (Live)'?: string;
    'Status (Live)'?: string;
    'Fax (Live)'?: string;
    'Address (Live)'?: string;
    'City (Live)'?: string;
    'State (Live)'?: string;
    'Postcode (Live)'?: string;
    'Country (Live)'?: string;
    'Country Code (Live)'?: string;
    'Type (Live)'?: string;
    'Talent Type (Live)'?: string;
    'Contacts (Live)'?: string[];
    'Last Checked'?: string;
    Updates?: string;
    'Notes AI'?: string;
    'Enrichment Log'?: string;
    'Emails (Contacts)'?: string | string[];
    [key: string]: any;
  };
}

interface EnrichmentResult {
  success: boolean;
  confidence: number;
  updates: {
    [key: string]: string | string[];
  };
  conflicts: string[];
  errors: string[];
  aiLog: string;
}

// Fetch companies from Airtable (with pagination)
async function fetchCompaniesToEnrich(): Promise<CompanyRecord[]> {
  const companies: CompanyRecord[] = [];
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;
  let offset: string | undefined = undefined;

  try {
    do {
      const params = new URLSearchParams({
        view: SOURCE_VIEW_ID,
      });
      
      if (offset) {
        params.append('offset', offset);
      }

      const response = await fetch(`${url}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as { records: CompanyRecord[]; offset?: string };
      
      // Filter for "To Enrich" status
      const toEnrich = data.records.filter(r => r.fields['Status (Live)'] === 'To Enrich');
      companies.push(...toEnrich);
      
      offset = data.offset;
      
      if (offset) {
        console.log(`📄 Fetched ${companies.length} companies to enrich so far...`);
      }
    } while (offset);

    console.log(`✅ Total companies to enrich: ${companies.length}`);
    
    if (TEST_MODE) {
      const limited = companies.slice(0, TEST_LIMIT);
      console.log(`🧪 TEST MODE: Processing only ${limited.length} companies`);
      return limited;
    }
    
    return companies;
  } catch (error) {
    console.error('❌ Error fetching companies from Airtable:', error);
    throw error;
  }
}

// Update company status in Airtable
async function updateCompanyStatus(recordId: string, status: string): Promise<void> {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${recordId}`;

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          'Status (Live)': status,
          'Last Checked': new Date().toISOString().split('T')[0],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Status update error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error(`❌ Error updating status for ${recordId}:`, error);
  }
}

// Update company with enriched data
async function updateCompanyWithEnrichment(
  recordId: string,
  enrichment: EnrichmentResult
): Promise<void> {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${recordId}`;

  // Filter out computed fields and select fields that cannot be updated freely
  const computedFields = ['Emails (Contacts)', 'Contacts (Live)', 'Updates', 'Type (Live)', 'Talent Type (Live)'];
  
  // Auto-populate Country Code from Country if not set by AI
  if (enrichment.updates['Country (Live)'] && !enrichment.updates['Country Code (Live)']) {
    const countryValue = enrichment.updates['Country (Live)'];
    if (typeof countryValue === 'string') {
      const countryCode = getCountryCode(countryValue);
      if (countryCode) {
        enrichment.updates['Country Code (Live)'] = countryCode;
      }
    }
  }
  const filteredUpdates: any = {};
  
  for (const [key, value] of Object.entries(enrichment.updates)) {
    if (!computedFields.includes(key)) {
      filteredUpdates[key] = value;
    }
  }

  const fields: any = {
    ...filteredUpdates,
    'Last Checked': new Date().toISOString().split('T')[0],
    'Enrichment Log': enrichment.aiLog,
  };

  if (enrichment.conflicts.length > 0) {
    fields['Status (Live)'] = 'Conflicts';
    fields['Notes AI'] = `[${formatDate()}] Conflicts found:\n${enrichment.conflicts.join('\n')}\n\n${fields['Notes AI'] || ''}`;
  } else if (enrichment.errors.length > 0) {
    fields['Status (Live)'] = 'Error';
    fields['Notes AI'] = `[${formatDate()}] Errors:\n${enrichment.errors.join('\n')}\n\n${fields['Notes AI'] || ''}`;
  } else {
    fields['Status (Live)'] = 'Complete';
  }

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Update error: ${response.status} - ${errorText}`);
    }

    console.log(`✅ Updated record ${recordId} with status: ${fields['Status (Live)']}`);
  } catch (error) {
    console.error(`❌ Error updating record ${recordId}:`, error);
    throw error;
  }
}

// Call DeepSeek AI for enrichment
async function callDeepSeekAI(company: CompanyRecord): Promise<EnrichmentResult> {
  const prompt = `You are a company data enrichment expert. Analyze the following company record and standardize/format all fields correctly.

CRITICAL RULES:
1. UPDATE existing fields if they are poorly formatted, incomplete, or inconsistent
2. Standardize all social media URLs to proper format
3. Standardize phone numbers to international format with + prefix
4. Standardize email formats (lowercase, trim spaces)
5. Format addresses properly with full details
6. Validate and correct website URLs (remove www., ensure http:// or https://)
7. DO NOT report formatting corrections as errors or conflicts - they are improvements
8. DO NOT report missing data as errors - only real validation failures
9. DO NOT update these computed fields: "Emails (Contacts)", "Contacts (Live)", "Updates" - they are read-only
10. USE EXACT FIELD NAMES - do not shorten or modify them (e.g., "Soc Website (Live)" NOT "Website (Live)")

EXACT FIELD NAMES YOU MUST USE:
- Company Name (Live)
- Soc Website (Live)
- Soc Instagram (Live)
- Soc Facebook (Live)
- Soc Linkedin (Live)
- Soc Twitter (Live)
- Soc Youtube (Live)
- Soc Emails (Live)
- Soc Phones (Live)
- Phone (Live)
- Fax (Live)
- Address (Live)
- City (Live)
- State (Live)
- Postcode (Live)
- Country (Live)
- Country Code (Live)
- Type (Live)
- Notes (Live)
- LI Universal Name
- LI Description
- LI Tagline
- LI Website
- LI Phone
- LI Specialties
- LI Industries
- LI Founded Info
- LI Employee Count
- LI Follower Count
- LI Employee Count Range
- LI Locations Headquarters
- LI Logo Url
- FB Title
- FB Rating
- FB Phone
- FB Image
- FB Followers Display
- FB Email
- FB Description
- FB Bio
- FB Address
- IG Username
- IG Public Phone Number
- IG Public Email
- IG Profile Pic Url Hd
- IG Media Count
- IG Id
- IG Full Name
- IG Following Count
- IG Follower Count
- IG External Url
- IG Contact Phone Number
- IG Category
- IG Biography Email
- IG Biography
- IG Country
- About (Live)

FORMATTING RULES:
- Website URLs: Remove "www.", ensure http:// or https:// prefix
- Social URLs: Full URLs (e.g., https://instagram.com/username, https://linkedin.com/company/name)
- Phones: International format with + prefix (e.g., +1 XXX XXX XXXX)
- Emails: Lowercase, trimmed, comma-separated if multiple (use "Soc Emails (Live)" field ONLY)
- Address: Full format with street, city, state, postcode, country

WHAT TO REPORT:
- Errors: ONLY major validation failures (completely invalid data that cannot be fixed)
- Conflicts: ONLY when source data is contradictory or ambiguous
- Do NOT report: Formatting improvements, standardization, cleanup, adding missing details

COMPANY DATA:
${JSON.stringify(company.fields, null, 2)}

TASK:
1. Standardize and format all existing data
2. Fix any formatting issues (URLs, phones, emails, addresses)
3. Ensure social media URLs are complete and valid
4. Validate email formats in "Soc Emails (Live)" field only
5. Standardize phone number formats
6. Clean up repetitive or malformed address data
7. If "Country (Live)" exists, populate "Country Code (Live)" with 2-letter ISO code (e.g., US, CA, GB, AU)
8. **CRITICAL - WRITE "About (Live)" SECTION**: You MUST create a comprehensive "About (Live)" field using ALL available description/bio data from:
   - LI Description (LinkedIn company description)
   - FB Description and FB Bio (Facebook page info)
   - IG Biography (Instagram profile bio)
   - Any other company information available
   
   The About section MUST:
   - Be comprehensive and informative (2-4 well-written paragraphs)
   - Highlight what the company does, their expertise, and value proposition
   - Include relevant details about history, specialties, or achievements
   - Be written in third person, professional tone
   - NEVER include social media URLs, handles, @mentions, email addresses, or phone numbers
   - NEVER include contact information of any kind
   - Focus on the company's story, services, mission, and reputation
   - Synthesize information from multiple sources into one cohesive narrative
   
   THIS FIELD IS MANDATORY - Always generate it even if source data is limited.
9. Report ONLY true errors/conflicts - NOT formatting improvements
10. Use EXACT field names from the list above - do not create new field names or shorten existing ones

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "confidence": 95,
  "updates": {
    "Field Name": "new value"
  },
  "conflicts": [],
  "errors": [],
  "reasoning": "Brief explanation of changes made"
}`;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a precise data enrichment assistant. Always return valid JSON only, no markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as any;
    const content = data.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    let jsonContent = content;
    if (content.startsWith('```')) {
      jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    const aiResult = JSON.parse(jsonContent);

    // Build AI enrichment log
    const timestamp = formatDate();
    const aiLog = `[${timestamp}] AI Enrichment (Confidence: ${aiResult.confidence}%)\n${aiResult.reasoning}\n\nChanges: ${Object.keys(aiResult.updates || {}).length} fields updated\n${aiResult.conflicts?.length > 0 ? `Conflicts: ${aiResult.conflicts.length}` : ''}\n${aiResult.errors?.length > 0 ? `Errors: ${aiResult.errors.length}` : ''}`;

    return {
      success: true,
      confidence: aiResult.confidence || 0,
      updates: aiResult.updates || {},
      conflicts: aiResult.conflicts || [],
      errors: aiResult.errors || [],
      aiLog,
    };
  } catch (error) {
    console.error('❌ DeepSeek API error:', error);
    return {
      success: false,
      confidence: 0,
      updates: {},
      conflicts: [],
      errors: [`AI processing failed: ${error}`],
      aiLog: `[${formatDate()}] Error: ${error}`,
    };
  }
}

// Check for duplicate companies
function checkDuplicates(company: CompanyRecord, allCompanies: CompanyRecord[]): string[] {
  const duplicates: string[] = [];
  const currentId = company.id;
  const currentName = company.fields['Company Name (Live)']?.toLowerCase().trim();
  const currentWebsite = company.fields['Soc Website (Live)']?.toLowerCase().trim();
  
  for (const other of allCompanies) {
    if (other.id === currentId) continue;
    
    const otherName = other.fields['Company Name (Live)']?.toLowerCase().trim();
    const otherWebsite = other.fields['Soc Website (Live)']?.toLowerCase().trim();
    
    // Check for name match
    if (currentName && otherName && currentName === otherName) {
      const otherIdentifier = other.fields['Company Name (Live)'] || other.id;
      duplicates.push(`Possible duplicate name: "${company.fields['Company Name (Live)']}" matches record ${otherIdentifier} (${other.id})`);
    }
    
    // Check for website match
    if (currentWebsite && otherWebsite && currentWebsite === otherWebsite) {
      const otherIdentifier = other.fields['Company Name (Live)'] || other.id;
      duplicates.push(`Possible duplicate website: "${company.fields['Soc Website (Live)']}" matches record ${otherIdentifier} (${other.id})`);
    }
  }
  
  return duplicates;
}

// Main enrichment process
async function enrichCompanies(): Promise<void> {
  console.log('🚀 Starting Company CRM Enrichment with AI');
  console.log(`📊 Confidence Threshold: ${CONFIDENCE_THRESHOLD}%`);
  console.log(`🧪 Test Mode: ${TEST_MODE ? 'ON' : 'OFF'}`);
  console.log('');

  try {
    const companies = await fetchCompaniesToEnrich();
    
    if (companies.length === 0) {
      console.log('✅ No companies to enrich');
      return;
    }

    let processed = 0;
    let successful = 0;
    let conflicts = 0;
    let errors = 0;

    for (const company of companies) {
      processed++;
      const identifier = company.fields['Company Name (Live)'] || company.fields['Name (Live)'] || company.id;
      
      console.log(`\n[${processed}/${companies.length}] Processing: ${identifier}`);
      
      // Check for duplicates
      const duplicateWarnings = checkDuplicates(company, companies);
      if (duplicateWarnings.length > 0) {
        console.log(`⚠️  Found ${duplicateWarnings.length} possible duplicate(s)`);
      }
      
      // Update status to "Processing"
      await updateCompanyStatus(company.id, 'Processing');
      
      // Step 1: Try to extract website from emails if Soc Website (Live) is empty
      let websiteDomain = company.fields['Soc Website (Live)'];
      if (!websiteDomain) {
        const extractedDomain = extractWebsiteFromEmails(company.fields['Emails (Contacts)']);
        if (extractedDomain) {
          console.log(`🔍 Extracted domain from emails: ${extractedDomain}`);
          websiteDomain = `https://${extractedDomain}`;
          // Add to updates for later
          if (!company.fields['Soc Website (Live)']) {
            company.fields['Soc Website (Live)'] = websiteDomain;
          }
        }
      }
      
      // ========================================
      // STEP 1: DISCOVER ALL SOCIAL ACCOUNTS
      // ========================================
      let majorSocialChecked = false;
      let minorSocialChecked = false;
      
      if (websiteDomain) {
        const cleanDomain = websiteDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        
        // Check if Major Social Check was already done
        const skipMajorCheck = hasTaskComplete(company, 'Major Social Check');
        
        // Try Website Contacts Scraper API first (primary) if not already done
        let contactsData = null;
        if (!skipMajorCheck) {
          contactsData = await scrapeWebsiteContacts(cleanDomain);
          if (contactsData) {
            majorSocialChecked = true;
          }
        } else {
          console.log(`   ⏭️  Skipping Major Social Check (already completed)`);
        }
        
        if (contactsData) {
          // Update social fields from contacts scraper
          if (contactsData.facebook && !company.fields['Soc Facebook (Live)']) {
            company.fields['Soc Facebook (Live)'] = contactsData.facebook;
          }
          if (contactsData.instagram && !company.fields['Soc Instagram (Live)']) {
            company.fields['Soc Instagram (Live)'] = contactsData.instagram;
          }
          if (contactsData.linkedin && !company.fields['Soc Linkedin (Live)']) {
            company.fields['Soc Linkedin (Live)'] = contactsData.linkedin;
          }
          if (contactsData.twitter && !company.fields['Soc Twitter (Live)']) {
            company.fields['Soc Twitter (Live)'] = contactsData.twitter;
          }
          if (contactsData.youtube && !company.fields['Soc Youtube (Live)']) {
            company.fields['Soc Youtube (Live)'] = contactsData.youtube;
          }
          
          // Update emails if found
          if (contactsData.emails && contactsData.emails.length > 0 && !company.fields['Soc Emails (Live)']) {
            const emailsList = contactsData.emails.map((e: any) => e.value).slice(0, 10).join(', ');
            company.fields['Soc Emails (Live)'] = emailsList;
          }
          
          // Update phones if found
          if (contactsData.phone_numbers && contactsData.phone_numbers.length > 0 && !company.fields['Soc Phones (Live)']) {
            const phonesList = contactsData.phone_numbers.map((p: any) => `+${p.value}`).slice(0, 5).join(', ');
            company.fields['Soc Phones (Live)'] = phonesList;
          }
          
          console.log(`   ✅ Updated from Website Contacts Scraper`);
          
          // Rate limit: 1 req/sec for this API
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else if (!skipMajorCheck) {
          // Only try fallback if we attempted the major check
          // Check if Minor Social Check was already done
          const skipMinorCheck = hasTaskComplete(company, 'Minor Social Check');
          
          if (!skipMinorCheck) {
            // Fallback to Social Scraper API if contacts scraper failed
            console.log(`   🔄 Trying Social Scraper API as fallback...`);
            const socialData = await scrapeSocialProfiles(websiteDomain);
            
            if (socialData) {
              if (socialData.facebook && !company.fields['Soc Facebook (Live)']) {
                company.fields['Soc Facebook (Live)'] = socialData.facebook;
              }
              if (socialData.instagram && !company.fields['Soc Instagram (Live)']) {
                company.fields['Soc Instagram (Live)'] = socialData.instagram;
              }
              if (socialData.twitter && !company.fields['Soc Twitter (Live)']) {
                company.fields['Soc Twitter (Live)'] = socialData.twitter;
              }
              if (socialData.youtube && !company.fields['Soc Youtube (Live)']) {
                company.fields['Soc Youtube (Live)'] = socialData.youtube;
              }
              
              minorSocialChecked = true;
              console.log(`   ✅ Updated from Social Scraper API`);
            }
          } else {
            console.log(`   ⏭️  Skipping Minor Social Check (already completed)`);
          }
          
          // Small delay for this API
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // ========================================
      // STEP 2: ENRICH FROM SOCIAL PLATFORMS
      // ========================================
      // Now that we have all social URLs (from website scraping or already in DB),
      // scrape LinkedIn, Facebook, and Instagram for detailed company info
      
      // Step 2a: LinkedIn - Get company details
      let linkedinChecked = false;
      const skipLinkedinCheck = hasTaskComplete(company, 'Linkedin Check');
      
      if (company.fields['Soc Linkedin (Live)'] && !skipLinkedinCheck) {
        const linkedinData = await scrapeLinkedInCompany(company.fields['Soc Linkedin (Live)']);
        
        if (linkedinData && linkedinData.basic_info) {
          const info = linkedinData.basic_info;
          linkedinChecked = true;
          
          // Update LinkedIn-specific fields
          if (info.universal_name && !company.fields['LI Universal Name']) {
            company.fields['LI Universal Name'] = info.universal_name;
          }
          if (info.description && !company.fields['LI Description']) {
            company.fields['LI Description'] = info.description;
          }
          if (info.tagline && !company.fields['LI Tagline']) {
            company.fields['LI Tagline'] = info.tagline;
          }
          if (info.website && !company.fields['LI Website']) {
            company.fields['LI Website'] = info.website;
          }
          if (info.phone && !company.fields['LI Phone']) {
            company.fields['LI Phone'] = info.phone;
          }
          if (info.specialties && info.specialties.length > 0 && !company.fields['LI Specialties']) {
            company.fields['LI Specialties'] = info.specialties.join(', ');
          }
          if (info.industries && info.industries.length > 0 && !company.fields['LI Industries']) {
            company.fields['LI Industries'] = info.industries.join(', ');
          }
          
          // Founded info
          if (linkedinData.basic_info.founded_info) {
            const founded = linkedinData.basic_info.founded_info;
            if (founded.year && !company.fields['LI Founded Info']) {
              company.fields['LI Founded Info'] = `${founded.year}${founded.month ? `.${founded.month}` : ''}${founded.day ? `.${founded.day}` : ''}`;
            }
          }
          
          // Employee and follower counts
          if (linkedinData.stats) {
            if (linkedinData.stats.employee_count && !company.fields['LI Employee Count']) {
              company.fields['LI Employee Count'] = linkedinData.stats.employee_count.toString();
            }
            if (linkedinData.stats.follower_count && !company.fields['LI Follower Count']) {
              company.fields['LI Follower Count'] = linkedinData.stats.follower_count.toString();
            }
            if (linkedinData.stats.employee_count_range && !company.fields['LI Employee Count Range']) {
              const range = linkedinData.stats.employee_count_range;
              company.fields['LI Employee Count Range'] = `${range.start}-${range.end}`;
            }
          }
          
          // Headquarters location
          if (linkedinData.locations && linkedinData.locations.headquarters && !company.fields['LI Locations Headquarters']) {
            const hq = linkedinData.locations.headquarters;
            const parts = [hq.line1, hq.line2, hq.city, hq.state, hq.postal_code, hq.country].filter(p => p);
            company.fields['LI Locations Headquarters'] = parts.join(', ');
          }
          
          // Logo URL
          if (linkedinData.media && linkedinData.media.logo_url && !company.fields['LI Logo Url']) {
            company.fields['LI Logo Url'] = linkedinData.media.logo_url;
          }
          
          // Logo attachment
          if (linkedinData.media && linkedinData.media.logo_url && !company.fields['LI Logo']) {
            company.fields['LI Logo'] = [{
              url: linkedinData.media.logo_url
            }];
          }
          
          // Also update other fields if they're empty
          if (info.website && !company.fields['Soc Website (Live)']) {
            company.fields['Soc Website (Live)'] = info.website;
          }
          if (info.phone && !company.fields['Phone (Live)']) {
            company.fields['Phone (Live)'] = info.phone;
          }
          if (info.description && !company.fields['Notes (Live)']) {
            company.fields['Notes (Live)'] = info.description;
          }
          
          // Update address fields from headquarters if empty
          if (linkedinData.locations && linkedinData.locations.headquarters) {
            const hq = linkedinData.locations.headquarters;
            if (hq.line1 && !company.fields['Address (Live)']) {
              company.fields['Address (Live)'] = hq.line1 + (hq.line2 ? ` ${hq.line2}` : '');
            }
            if (hq.city && !company.fields['City (Live)']) {
              company.fields['City (Live)'] = hq.city;
            }
            if (hq.state && !company.fields['State (Live)']) {
              company.fields['State (Live)'] = hq.state;
            }
            if (hq.postal_code && !company.fields['Postcode (Live)']) {
              company.fields['Postcode (Live)'] = hq.postal_code;
            }
            if (hq.country && !company.fields['Country (Live)']) {
              company.fields['Country (Live)'] = hq.country;
            }
          }
          
          console.log(`   ✅ Updated from LinkedIn Company Data`);
        }
        
        // Rate limit for LinkedIn API
        await new Promise(resolve => setTimeout(resolve, 500));
      } else if (company.fields['Soc Linkedin (Live)'] && skipLinkedinCheck) {
        console.log(`   ⏭️  Skipping Linkedin Check (already completed)`);
      }
      
      // Step 2b: Facebook - Get page details
      let facebookChecked = false;
      const skipFacebookCheck = hasTaskComplete(company, 'Facebook Check');
      
      if (company.fields['Soc Facebook (Live)'] && !skipFacebookCheck) {
        const facebookData = await scrapeFacebookPage(company.fields['Soc Facebook (Live)']);
        
        if (facebookData) {
          facebookChecked = true;
          
          // Update Facebook-specific fields
          if (facebookData.title && !company.fields['FB Title']) {
            company.fields['FB Title'] = facebookData.title;
          }
          if (facebookData.rating && !company.fields['FB Rating']) {
            company.fields['FB Rating'] = facebookData.rating;
          }
          if (facebookData.phone && !company.fields['FB Phone']) {
            company.fields['FB Phone'] = facebookData.phone;
          }
          if (facebookData.image && !company.fields['FB Image']) {
            company.fields['FB Image'] = facebookData.image;
          }
          if (facebookData.followers_display && !company.fields['FB Followers Display']) {
            company.fields['FB Followers Display'] = facebookData.followers_display;
          }
          if (facebookData.email && !company.fields['FB Email']) {
            company.fields['FB Email'] = facebookData.email;
          }
          if (facebookData.description && !company.fields['FB Description']) {
            company.fields['FB Description'] = facebookData.description;
          }
          if (facebookData.bio && !company.fields['FB Bio']) {
            company.fields['FB Bio'] = facebookData.bio;
          }
          if (facebookData.address && !company.fields['FB Address']) {
            company.fields['FB Address'] = facebookData.address;
          }
          
          // Facebook logo attachment
          if (facebookData.image && !company.fields['FB Logo']) {
            company.fields['FB Logo'] = [{
              url: facebookData.image
            }];
          }
          
          // Also update other fields if they're empty
          if (facebookData.website && !company.fields['Soc Website (Live)']) {
            company.fields['Soc Website (Live)'] = `https://${facebookData.website}`;
          }
          if (facebookData.phone && !company.fields['Phone (Live)']) {
            company.fields['Phone (Live)'] = facebookData.phone;
          }
          if (facebookData.email && !company.fields['Soc Emails (Live)']) {
            company.fields['Soc Emails (Live)'] = facebookData.email;
          }
          if (facebookData.address && !company.fields['Address (Live)']) {
            company.fields['Address (Live)'] = facebookData.address;
          }
          
          console.log(`   ✅ Updated from Facebook Page Data`);
        }
        
        // Rate limit for Facebook API
        await new Promise(resolve => setTimeout(resolve, 500));
      } else if (company.fields['Soc Facebook (Live)'] && skipFacebookCheck) {
        console.log(`   ⏭️  Skipping Facebook Check (already completed)`);
      }
      
      // Step 2c: Instagram - Get profile details
      let instagramChecked = false;
      const skipInstagramCheck = hasTaskComplete(company, 'Instagram Check');
      
      if (company.fields['Soc Instagram (Live)'] && !skipInstagramCheck) {
        const instagramData = await scrapeInstagramProfile(company.fields['Soc Instagram (Live)']);
        
        if (instagramData) {
          instagramChecked = true;
          
          // Update Instagram-specific fields
          if (instagramData.username && !company.fields['IG Username']) {
            company.fields['IG Username'] = instagramData.username;
          }
          if (instagramData.public_phone_number && !company.fields['IG Public Phone Number']) {
            company.fields['IG Public Phone Number'] = instagramData.public_phone_number;
          }
          if (instagramData.public_email && !company.fields['IG Public Email']) {
            company.fields['IG Public Email'] = instagramData.public_email;
          }
          if (instagramData.profile_pic_url_hd && !company.fields['IG Profile Pic Url Hd']) {
            company.fields['IG Profile Pic Url Hd'] = instagramData.profile_pic_url_hd;
          }
          if (instagramData.media_count !== undefined && !company.fields['IG Media Count']) {
            company.fields['IG Media Count'] = instagramData.media_count.toString();
          }
          if (instagramData.id && !company.fields['IG Id']) {
            company.fields['IG Id'] = instagramData.id;
          }
          if (instagramData.full_name && !company.fields['IG Full Name']) {
            company.fields['IG Full Name'] = instagramData.full_name;
          }
          if (instagramData.following_count !== undefined && !company.fields['IG Following Count']) {
            company.fields['IG Following Count'] = instagramData.following_count.toString();
          }
          if (instagramData.follower_count !== undefined && !company.fields['IG Follower Count']) {
            company.fields['IG Follower Count'] = instagramData.follower_count.toString();
          }
          if (instagramData.external_url && !company.fields['IG External Url']) {
            company.fields['IG External Url'] = instagramData.external_url;
          }
          if (instagramData.contact_phone_number && !company.fields['IG Contact Phone Number']) {
            company.fields['IG Contact Phone Number'] = instagramData.contact_phone_number;
          }
          if (instagramData.category && !company.fields['IG Category']) {
            company.fields['IG Category'] = instagramData.category;
          }
          if (instagramData.biography_email && !company.fields['IG Biography Email']) {
            company.fields['IG Biography Email'] = instagramData.biography_email;
          }
          if (instagramData.biography && !company.fields['IG Biography']) {
            company.fields['IG Biography'] = instagramData.biography;
          }
          if (instagramData.about && instagramData.about.country && !company.fields['IG Country']) {
            company.fields['IG Country'] = instagramData.about.country;
          }
          
          // Instagram profile image attachment
          if (instagramData.profile_pic_url_hd && !company.fields['IG Profile Image']) {
            company.fields['IG Profile Image'] = [{
              url: instagramData.profile_pic_url_hd
            }];
          }
          
          // Also update other fields if they're empty
          if (instagramData.external_url && !company.fields['Soc Website (Live)']) {
            company.fields['Soc Website (Live)'] = instagramData.external_url;
          }
          if (instagramData.public_phone_number && !company.fields['Phone (Live)']) {
            company.fields['Phone (Live)'] = `+${instagramData.public_phone_country_code || '1'}${instagramData.public_phone_number}`;
          }
          if (instagramData.contact_phone_number && !company.fields['Phone (Live)']) {
            company.fields['Phone (Live)'] = instagramData.contact_phone_number;
          }
          if (instagramData.public_email && !company.fields['Soc Emails (Live)']) {
            company.fields['Soc Emails (Live)'] = instagramData.public_email;
          }
          if (instagramData.biography_email && !company.fields['Soc Emails (Live)']) {
            company.fields['Soc Emails (Live)'] = instagramData.biography_email;
          }
          if (instagramData.biography && !company.fields['Notes (Live)']) {
            company.fields['Notes (Live)'] = instagramData.biography;
          }
          if (instagramData.about && instagramData.about.country && !company.fields['Country (Live)']) {
            company.fields['Country (Live)'] = instagramData.about.country;
          }
          
          console.log(`   ✅ Updated from Instagram Profile Data`);
        }
        
        // Rate limit for Instagram API
        await new Promise(resolve => setTimeout(resolve, 500));
      } else if (company.fields['Soc Instagram (Live)'] && skipInstagramCheck) {
        console.log(`   ⏭️  Skipping Instagram Check (already completed)`);
      }
      
      // Track completed social scraping tasks
      if (majorSocialChecked) {
        addTaskComplete(company, 'Major Social Check');
        console.log('   ✓ Added: Major Social Check');
      }
      if (minorSocialChecked) {
        addTaskComplete(company, 'Minor Social Check');
        console.log('   ✓ Added: Minor Social Check');
      }
      if (linkedinChecked) {
        addTaskComplete(company, 'Linkedin Check');
        console.log('   ✓ Added: Linkedin Check');
      }
      if (facebookChecked) {
        addTaskComplete(company, 'Facebook Check');
        console.log('   ✓ Added: Facebook Check');
      }
      if (instagramChecked) {
        addTaskComplete(company, 'Instagram Check');
        console.log('   ✓ Added: Instagram Check');
      }
      
      // Always mark General Enrichment when processing
      addTaskComplete(company, 'General Enrichment');
      console.log(`   ✓ Tasks Complete: ${company.fields['Tasks Complete']?.join(', ') || 'none'}`);
      
      // ========================================
      // STEP 3: AI ENRICHMENT & ABOUT SECTION
      // ========================================
      // Use AI to format all data and create comprehensive About section
      console.log('🤖 Calling DeepSeek AI...');
      const enrichment = await callDeepSeekAI(company);
      
      // Add LinkedIn, Facebook, and Instagram fields to updates if they were populated
      const linkedinFields = ['LI Universal Name', 'LI Description', 'LI Tagline', 'LI Website', 'LI Phone', 
                              'LI Specialties', 'LI Industries', 'LI Founded Info', 'LI Employee Count', 
                              'LI Follower Count', 'LI Employee Count Range', 'LI Locations Headquarters', 
                              'LI Logo Url', 'LI Logo'];
      const facebookFields = ['FB Title', 'FB Rating', 'FB Phone', 'FB Image', 'FB Followers Display', 
                              'FB Email', 'FB Description', 'FB Bio', 'FB Address', 'FB Logo'];
      const instagramFields = ['IG Username', 'IG Public Phone Number', 'IG Public Email', 'IG Profile Pic Url Hd',
                               'IG Profile Image', 'IG Media Count', 'IG Id', 'IG Full Name', 'IG Following Count',
                               'IG Follower Count', 'IG External Url', 'IG Contact Phone Number', 'IG Category',
                               'IG Biography Email', 'IG Biography', 'IG Country'];
      
      for (const field of [...linkedinFields, ...facebookFields, ...instagramFields]) {
        if (company.fields[field as keyof typeof company.fields]) {
          enrichment.updates[field] = company.fields[field as keyof typeof company.fields] as string | string[];
        }
      }
      
      // Make sure About (Live) from AI response is included in updates
      if (enrichment.updates['About (Live)']) {
        console.log(`   ✅ About (Live) generated by AI (${enrichment.updates['About (Live)'].toString().length} chars)`);
      }
      
      // Preserve attachment fields as arrays (AI might return them as strings)
      const attachmentFields = ['LI Logo', 'FB Logo', 'IG Profile Image'];
      for (const field of attachmentFields) {
        if (company.fields[field as keyof typeof company.fields]) {
          enrichment.updates[field] = company.fields[field as keyof typeof company.fields] as string | string[];
        }
      }
      
      // Add Tasks Complete to updates
      if (company.fields['Tasks Complete']) {
        enrichment.updates['Tasks Complete'] = company.fields['Tasks Complete'];
      }
      
      // Add duplicate warnings to conflicts
      if (duplicateWarnings.length > 0) {
        enrichment.conflicts.push(...duplicateWarnings);
      }
      
      console.log(`📊 Confidence: ${enrichment.confidence}%`);
      console.log(`📝 Updates: ${Object.keys(enrichment.updates).length} fields`);
      
      // Debug: Check if About (Live) is in the updates
      if (enrichment.updates['About (Live)']) {
        console.log(`   ✅ About (Live) generated by AI (${enrichment.updates['About (Live)'].toString().length} chars)`);
      } else {
        console.log(`   ⚠️  About (Live) NOT generated by AI`);
        // Log what fields were actually returned
        const fieldNames = Object.keys(enrichment.updates).sort();
        console.log(`   📋 Fields returned: ${fieldNames.slice(0, 10).join(', ')}${fieldNames.length > 10 ? '...' : ''}`);
      }
      
      // Log errors and conflicts for debugging
      if (enrichment.errors.length > 0) {
        console.log(`   Errors: ${enrichment.errors[0]}`);
      }
      if (enrichment.conflicts.length > 0) {
        console.log(`   Conflicts: ${enrichment.conflicts[0]}`);
      }
      
      // Check confidence threshold
      if (enrichment.confidence < CONFIDENCE_THRESHOLD) {
        enrichment.errors.push(`Confidence ${enrichment.confidence}% below threshold ${CONFIDENCE_THRESHOLD}%`);
      }
      
      // Update the company
      await updateCompanyWithEnrichment(company.id, enrichment);
      
      // Track results
      if (enrichment.conflicts.length > 0) {
        conflicts++;
        console.log(`⚠️  Conflicts found: ${enrichment.conflicts.length}`);
      } else if (enrichment.errors.length > 0) {
        errors++;
        console.log(`❌ Errors: ${enrichment.errors.length}`);
      } else {
        successful++;
        console.log(`✅ Successfully enriched`);
      }
      
      // Rate limiting (1 second between requests)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n═══════════════════════════════════════');
    console.log('📊 ENRICHMENT SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`Total Processed: ${processed}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`⚠️  Conflicts: ${conflicts}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Fatal error during enrichment:', error);
    process.exit(1);
  }
}

// Run the enrichment
enrichCompanies();
