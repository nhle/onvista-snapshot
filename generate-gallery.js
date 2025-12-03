import { readdirSync, statSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Scan screenshots directory and organize data by index
 * @returns {Object} - Organized screenshot data
 */
function scanScreenshots() {
  const screenshotsDir = join(__dirname, 'screenshots');
  
  if (!existsSync(screenshotsDir)) {
    console.log('No screenshots directory found');
    return {};
  }

  const indices = {};
  const indexDirs = readdirSync(screenshotsDir);

  for (const indexName of indexDirs) {
    const indexPath = join(screenshotsDir, indexName);
    
    if (!statSync(indexPath).isDirectory()) continue;

    const timestampDirs = readdirSync(indexPath);
    const runs = [];

    for (const timestamp of timestampDirs) {
      const timestampPath = join(indexPath, timestamp);
      
      if (!statSync(timestampPath).isDirectory()) continue;

      const screenshots = readdirSync(timestampPath)
        .filter(f => f.endsWith('.png'))
        .sort()
        .map(f => ({
          filename: f,
          path: `screenshots/${indexName}/${timestamp}/${f}`
        }));

      if (screenshots.length > 0) {
        runs.push({
          timestamp,
          date: formatTimestamp(timestamp),
          screenshots
        });
      }
    }

    if (runs.length > 0) {
      runs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      indices[indexName] = {
        name: indexName.replace(/_/g, ' '),
        runs
      };
    }
  }

  return indices;
}

/**
 * Format timestamp to readable date
 * @param {string} timestamp - Timestamp in format YYYY-MM-DD_HH-MM-SS
 * @returns {string} - Formatted date
 */
function formatTimestamp(timestamp) {
  const [datePart, timePart] = timestamp.split('_');
  const [year, month, day] = datePart.split('-');
  const [hour, minute] = timePart.split('-');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * Generate main index.html page
 * @param {Object} indices - Screenshot data organized by index
 */
function generateIndexPage(indices) {
  const indexNames = Object.keys(indices).sort();
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Onvista Screenshots</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      line-height: 1.6;
    }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #333; margin-bottom: 10px; font-size: 2em; }
    .subtitle { color: #666; margin-bottom: 30px; }
    .index-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
    .index-card { 
      border: 1px solid #ddd; 
      border-radius: 6px; 
      padding: 20px; 
      text-decoration: none; 
      color: #333;
      transition: all 0.2s;
      background: #fafafa;
    }
    .index-card:hover { 
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
      transform: translateY(-2px);
      background: white;
    }
    .index-name { font-size: 1.2em; font-weight: 600; margin-bottom: 8px; color: #2563eb; }
    .index-stats { font-size: 0.9em; color: #666; }
    footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Onvista Screenshots</h1>
    <p class="subtitle">Browse historical index performance snapshots</p>
    
    <div class="index-grid">
${indexNames.map(key => {
  const index = indices[key];
  const latestRun = index.runs[0];
  return `      <a href="${key}.html" class="index-card">
        <div class="index-name">${index.name}</div>
        <div class="index-stats">
          ${index.runs.length} snapshot${index.runs.length > 1 ? 's' : ''}<br>
          Latest: ${latestRun.date}
        </div>
      </a>`;
}).join('\n')}
    </div>
    
    <footer>
      Generated on ${new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}
    </footer>
  </div>
</body>
</html>`;

  writeFileSync(join(__dirname, 'index.html'), html, 'utf-8');
  console.log('Generated index.html');
}

/**
 * Generate individual index page
 * @param {string} indexKey - Index key (filename safe)
 * @param {Object} indexData - Index data with runs
 */
function generateIndexDetailPage(indexKey, indexData) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${indexData.name} Screenshots</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      line-height: 1.6;
    }
    .container { max-width: 1400px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { margin-bottom: 30px; }
    .back-link { display: inline-block; color: #2563eb; text-decoration: none; margin-bottom: 15px; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #333; font-size: 2em; }
    .run-section { margin-bottom: 50px; }
    .run-header { 
      background: #f8f9fa; 
      padding: 15px 20px; 
      border-radius: 6px; 
      margin-bottom: 20px;
      border-left: 4px solid #2563eb;
    }
    .run-date { font-size: 1.3em; font-weight: 600; color: #333; }
    .run-info { color: #666; font-size: 0.9em; margin-top: 5px; }
    .screenshot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .screenshot-item { border: 1px solid #ddd; border-radius: 6px; overflow: hidden; background: white; }
    .screenshot-item img { width: 100%; height: 200px; object-fit: cover; object-position: top; display: block; }
    .screenshot-info { padding: 12px; background: #fafafa; }
    .screenshot-name { font-size: 0.9em; color: #333; font-weight: 500; }
    .screenshot-link { display: inline-block; margin-top: 8px; color: #2563eb; text-decoration: none; font-size: 0.85em; }
    .screenshot-link:hover { text-decoration: underline; }
    footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="index.html" class="back-link">← Back to all indices</a>
      <h1>📈 ${indexData.name}</h1>
    </div>
    
${indexData.runs.map(run => `    <div class="run-section">
      <div class="run-header">
        <div class="run-date">${run.date}</div>
        <div class="run-info">${run.screenshots.length} screenshot${run.screenshots.length > 1 ? 's' : ''}</div>
      </div>
      <div class="screenshot-grid">
${run.screenshots.map(screenshot => `        <div class="screenshot-item">
          <a href="${screenshot.path}" target="_blank">
            <img src="${screenshot.path}" alt="${screenshot.filename}" loading="lazy">
          </a>
          <div class="screenshot-info">
            <div class="screenshot-name">${screenshot.filename}</div>
            <a href="${screenshot.path}" class="screenshot-link" target="_blank">View full size →</a>
          </div>
        </div>`).join('\n')}
      </div>
    </div>`).join('\n\n')}
    
    <footer>
      <a href="index.html" class="back-link">← Back to all indices</a>
    </footer>
  </div>
</body>
</html>`;

  writeFileSync(join(__dirname, `${indexKey}.html`), html, 'utf-8');
  console.log(`Generated ${indexKey}.html`);
}

/**
 * Main function
 */
function main() {
  console.log('Generating gallery...');
  
  const indices = scanScreenshots();
  const indexCount = Object.keys(indices).length;
  
  if (indexCount === 0) {
    console.log('No screenshots found. Skipping gallery generation.');
    return;
  }
  
  console.log(`Found ${indexCount} indices`);
  
  generateIndexPage(indices);
  
  for (const [key, data] of Object.entries(indices)) {
    generateIndexDetailPage(key, data);
  }
  
  console.log('Gallery generation complete!');
}

main();

