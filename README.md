# Onvista Snapshot Scraper

A Playwright-based automation tool for capturing full-page screenshots from onvista index pages with automatic cookie handling, table sorting, and pagination support.

## Features

- Automatically accepts cookie banners
- Sorts tables by "Perf. relativ" (relative performance) in descending order
- Captures full-page screenshots of all paginated pages
- Organizes screenshots by index name and timestamp
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

Screenshots are saved in the following structure:

```
screenshots/
└── {index-name}/
    └── {timestamp}/
        ├── {index-name}_{timestamp}_page1.png
        ├── {index-name}_{timestamp}_page2.png
        └── ...
```

Example:
```
screenshots/
└── DAX/
    └── 2025-12-03_14-30-45/
        ├── DAX_2025-12-03_14-30-45_page1.png
        └── DAX_2025-12-03_14-30-45_page2.png
```

## How It Works

1. Reads URLs from `config.json`
2. Launches a Chromium browser instance
3. For each URL:
   - Navigates to the page
   - Waits for page load
   - Clicks "Akzeptieren" to accept cookies
   - Clicks "Perf. relativ" header twice to sort descending
   - Extracts index name from URL
   - Creates timestamped folder structure
   - Takes full-page screenshots
   - Detects and navigates through pagination
   - Saves all pages with proper naming

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

### Screenshots not saving
- Check write permissions in the project directory
- Ensure sufficient disk space
- Verify folder structure is created correctly

## Configuration Options

You can modify `scraper.js` to adjust:

- **Headless mode**: Change `headless: false` to `headless: true` in the `chromium.launch()` call
- **Slow motion**: Adjust `slowMo: 100` for slower/faster execution
- **Timeouts**: Modify timeout values in `waitFor` calls
- **Delay between pages**: Change `setTimeout` values

## Notes

- The browser runs in non-headless mode by default for debugging
- There's a 2-second delay between processing different URLs
- Screenshots are saved as PNG files
- The script handles errors gracefully and continues with remaining URLs

## License

ISC

