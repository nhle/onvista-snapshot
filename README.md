# Onvista HTML Archive Scraper

A Playwright-based automation tool for capturing self-contained HTML archives from onvista index pages with automatic cookie handling, table sorting, and pagination support. The archived pages are fully interactive, allowing you to click on stock links to view detailed information.

## Features

- Automatically accepts cookie banners
- Sorts tables by "Perf. relativ" (relative performance) in descending order
- Captures self-contained HTML archives of all paginated pages
- Inlines all CSS and images for offline viewing
- Stock links remain clickable and open live onvista.de pages
- Organizes HTML archives by index name and timestamp
- Generates a beautiful gallery with iframe previews
- Handles multiple URLs from configuration file

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npm run install-browsers
```

Or use the included script:
```bash
npx playwright install chromium
```

## Configuration

Edit `config.json` to add your URLs:

```json
{
  "urls": [
    "https://www.onvista.de/index/einzelwerte/DAX-Index-20735?notation=20735",
    "https://www.onvista.de/index/einzelwerte/MDAX-Index-20736?notation=20736"
  ]
}
```

## Usage

Run the scraper:
```bash
npm start
```

Or directly:
```bash
node scraper.js
```

## Folder Structure

HTML archives are saved in the following structure:

```
screenshots/
└── {index-name}/
    └── {timestamp}/
        ├── {index-name}_{timestamp}_page1.html
        ├── {index-name}_{timestamp}_page2.html
        └── ...
```

Example:
```
screenshots/
└── DAX/
    └── 2025-12-03_14-30-45/
        ├── DAX_2025-12-03_14-30-45_page1.html
        └── DAX_2025-12-03_14-30-45_page2.html
```

## How It Works

1. Reads URLs from `config.json`
2. Launches a Chromium browser instance
3. For each URL:
   - Navigates to the page
   - Waits for page load
   - Initializes consent cookies to bypass cookie banners
   - Clicks "Perf. relativ" header twice to sort descending
   - Extracts index name from URL
   - Creates timestamped folder structure
   - Saves self-contained HTML archives with inlined CSS and images
   - Detects and navigates through pagination
   - Saves all pages with proper naming
4. Generates a gallery with iframe previews using `generate-gallery.js`

## Troubleshooting

### Browser doesn't launch
- Ensure Playwright browsers are installed: `npx playwright install chromium`
- Check Node.js version: `node --version` (should be v16+)

### Cookie banner not found
- The script will continue if the cookie banner is not present
- Check console output for messages

### Sorting fails
- Ensure the page has loaded completely
- Check if "Perf. relativ" column exists on the page
- Increase timeout values in `scraper.js` if needed

### Pagination not detected
- The script automatically stops when no next page is found
- Check console output for pagination detection messages
- Some pages may not have pagination

### HTML archives not saving
- Check write permissions in the project directory
- Ensure sufficient disk space (HTML files may be larger than screenshots)
- Verify folder structure is created correctly
- Check browser console for resource loading errors

## Configuration Options

You can modify `scraper.js` to adjust:

- **Headless mode**: Change `headless: false` to `headless: true` in the `chromium.launch()` call
- **Slow motion**: Adjust `slowMo: 100` for slower/faster execution
- **Timeouts**: Modify timeout values in `waitFor` calls
- **Delay between pages**: Change `setTimeout` values

## Notes

- The browser runs in headless mode for efficiency
- There's a 2-second delay between processing different URLs
- HTML archives are self-contained with inlined CSS and base64-encoded images
- Stock links in the archived pages remain clickable and open live onvista.de pages
- The script handles errors gracefully and continues with remaining URLs
- Use `npm run gallery` or `node generate-gallery.js` to regenerate the gallery after scraping

## Gallery

After running the scraper, generate the browsable gallery:

```bash
node generate-gallery.js
```

Then open `index.html` in your browser to browse the archives with iframe previews.

## License

ISC

