import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Extract index name from URL
 * @param {string} url - The onvista URL
 * @returns {string} - Extracted index name
 */
function extractIndexName(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const indexPart = pathParts.find(part => part.includes('Index'));
    if (indexPart) {
      return indexPart.replace(/-Index-\d+$/, '').replace(/-/g, '_');
    }
    return 'unknown_index';
  } catch (error) {
    console.error('Error extracting index name:', error);
    return 'unknown_index';
  }
}

/**
 * Create formatted timestamp string
 * @returns {string} - Timestamp in YYYY-MM-DD_HH-MM-SS format
 */
function createTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

/**
 * Ensure directory exists, create if it doesn't
 * @param {string} path - Directory path
 */
function ensureDirectory(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

/**
 * Initialize consent cookies for the browser context
 * @param {object} context - Playwright browser context
 * @param {string} domain - Domain for cookies
 */
async function initializeConsentCookies(context, domain) {
  try {
    await context.addCookies([
      {
        name: 'consentDate',
        value: '2025-12-03T19:04:45.610Z',
        domain: domain,
        path: '/'
      },
      {
        name: 'consentUUID',
        value: 'c870f882-6ae2-45a3-ad39-4e9553343e32_50',
        domain: domain,
        path: '/'
      }
    ]);
    console.log(`Consent cookies initialized for domain: ${domain}`);
  } catch (error) {
    console.error('Error setting consent cookies:', error);
    throw error;
  }
}

/**
 * Sort table by "Perf. relativ" column (descending)
 * @param {object} page - Playwright page object
 */
async function sortByPerformance(page) {
  try {
    const perfHeader = page.locator('th').filter({ hasText: /Perf\. relativ/i });
    await perfHeader.waitFor({ timeout: 10000 });
    await perfHeader.click();
    console.log('Clicked "Perf. relativ" first time');
    await page.waitForTimeout(500);
    await perfHeader.click();
    console.log('Clicked "Perf. relativ" second time (descending)');
    await page.waitForTimeout(1000);
  } catch (error) {
    console.error('Error sorting by performance:', error);
    throw error;
  }
}

/**
 * Check if pagination exists and get next page button
 * @param {object} page - Playwright page object
 * @returns {object|null} - Next page button locator or null
 */
async function getNextPageButton(page) {
  try {
    // Target the specific "Nächste Seite" (Next Page) button
    const nextButton = page.locator('button[aria-label="Nächste Seite"]');
    const isVisible = await nextButton.isVisible({ timeout: 2000 });
    if (isVisible) {
      // Check if button is not disabled
      const isDisabled = await nextButton.isDisabled();
      if (!isDisabled) {
        console.log('Next page button found and enabled');
        return nextButton;
      } else {
        console.log('Next page button is disabled (last page reached)');
      }
    }
    return null;
  } catch (error) {
    console.log('No pagination found or error:', error.message);
    return null;
  }
}

/**
 * Handle pagination and capture all pages
 * @param {object} page - Playwright page object
 * @param {string} basePath - Base path for screenshots
 * @param {string} indexName - Index name for file naming
 * @param {string} timestamp - Timestamp for file naming
 */
async function handlePagination(page, basePath, indexName, timestamp) {
  let pageNumber = 1;
  let hasMorePages = true;

  console.log('Starting pagination loop...');

  while (hasMorePages) {
    // Take screenshot of current page
    const filename = `${indexName}_${timestamp}_page${pageNumber}.png`;
    const filepath = join(basePath, filename);
    
    console.log(`[Page ${pageNumber}] Taking screenshot: ${filename}`);
    await page.screenshot({ 
      path: filepath, 
      fullPage: true 
    });
    console.log(`[Page ${pageNumber}] Screenshot saved: ${filepath}`);

    // Check for next page button
    const nextButton = await getNextPageButton(page);
    if (nextButton) {
      try {
        console.log(`[Page ${pageNumber}] Clicking next page button...`);
        await nextButton.click();
        
        // Wait for page to load
        await page.waitForTimeout(3000);
        
        pageNumber++;
        console.log(`[Page ${pageNumber}] Successfully navigated to page ${pageNumber}`);
      } catch (error) {
        console.log(`[Page ${pageNumber}] Error navigating to next page:`, error.message);
        hasMorePages = false;
      }
    } else {
      console.log(`[Page ${pageNumber}] No more pages available. Pagination complete.`);
      hasMorePages = false;
    }
  }

  console.log(`Pagination finished. Total pages captured: ${pageNumber}`);
  return pageNumber;
}

/**
 * Process a single URL using an existing page
 * @param {object} page - Playwright page object
 * @param {string} url - URL to process
 */
async function processUrl(page, url) {
  console.log(`\nProcessing URL: ${url}`);
  
  try {
    await page.goto(url, { timeout: 30000 });
    console.log('Page loaded');

    await sortByPerformance(page);

    const indexName = extractIndexName(url);
    const timestamp = createTimestamp();
    const screenshotDir = join(__dirname, 'screenshots', indexName, timestamp);
    ensureDirectory(screenshotDir);

    console.log(`Saving screenshots to: ${screenshotDir}`);
    const totalPages = await handlePagination(page, screenshotDir, indexName, timestamp);
    
    console.log(`Completed: Captured ${totalPages} page(s) for ${indexName}`);
  } catch (error) {
    console.error(`Error processing URL ${url}:`, error);
  }
}

/**
 * Main function
 */
async function main() {
  let config;
  try {
    const configPath = join(__dirname, 'config.json');
    const configData = readFileSync(configPath, 'utf-8');
    config = JSON.parse(configData);
  } catch (error) {
    console.error('Error reading config.json:', error);
    process.exit(1);
  }

  if (!config.urls || !Array.isArray(config.urls) || config.urls.length === 0) {
    console.error('No URLs found in config.json');
    process.exit(1);
  }

  console.log(`Found ${config.urls.length} URL(s) to process`);
  
  const browser = await chromium.launch({ 
    headless: true,
    slowMo: 100
  });

  let context;
  let page;
  try {
    // Create browser context and single page for entire session
    context = await browser.newContext();
    page = await context.newPage();
    
    // Initialize consent cookies once for all URLs
    const firstUrl = new URL(config.urls[0]);
    await initializeConsentCookies(context, firstUrl.hostname);
    console.log('Session initialized with consent cookies');
    
    // Process all URLs sequentially using the same page
    for (const url of config.urls) {
      await processUrl(page, url);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    if (page) {
      await page.close();
    }
    if (context) {
      await context.close();
    }
    await browser.close();
    console.log('\nBrowser closed. All done!');
  }
}

main().catch(console.error);

