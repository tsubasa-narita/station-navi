import axios from 'axios';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { TARGET_LINES } from './config/lines.js';
import { discoverStationUrls } from './lib/discover.js';
import { extractStationData } from './lib/extract.js';
import { convertToAppFormat } from './lib/convert.js';
import { sleep } from './lib/utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'output');

// Request delay in ms (be polite to the server)
const REQUEST_DELAY = 1500;

const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; station-navi-scraper/1.0; educational use)',
  'Accept-Language': 'ja,en;q=0.9',
};

async function fetchHtml(url) {
  const response = await axios.get(url, {
    headers: HTTP_HEADERS,
    timeout: 15000,
  });
  return response.data;
}

/**
 * Scrape all stations for a given line config.
 * Returns an array of app-format station objects.
 */
async function scrapeTargetLine(targetLine) {
  console.log(`\n═══════════════════════════════════`);
  console.log(`  Line: ${targetLine.displayName}`);
  console.log(`  Index: ${targetLine.indexUrl}`);
  console.log(`═══════════════════════════════════`);

  // 1. Fetch index page and discover station URLs
  let indexHtml;
  try {
    indexHtml = await fetchHtml(targetLine.indexUrl);
  } catch (err) {
    console.error(`  [ERROR] Failed to fetch index page: ${err.message}`);
    return [];
  }

  const stationUrls = discoverStationUrls(indexHtml, targetLine.indexUrl);
  console.log(`  Found ${stationUrls.length} station URLs`);

  const results = [];

  for (let i = 0; i < stationUrls.length; i++) {
    const url = stationUrls[i];
    const label = url.split('/').filter(Boolean).pop();
    process.stdout.write(`  [${i + 1}/${stationUrls.length}] ${label} ... `);

    await sleep(REQUEST_DELAY);

    let html;
    try {
      html = await fetchHtml(url);
    } catch (err) {
      console.log(`FAILED (${err.message})`);
      continue;
    }

    let stationData;
    try {
      stationData = extractStationData(html, url);
    } catch (err) {
      console.log(`PARSE ERROR (${err.message})`);
      continue;
    }

    const appEntry = convertToAppFormat(stationData, targetLine);
    if (!appEntry) {
      console.log(`SKIP (no matching formations for this line)`);
      continue;
    }

    results.push(appEntry);
    const platformCount = appEntry.platforms.length;
    const facilityCount = appEntry.platforms.reduce((sum, p) => sum + p.facilities.length, 0);
    console.log(`OK — ${stationData.stationName} (${platformCount} platforms, ${facilityCount} facilities)`);
  }

  return results;
}

async function main() {
  // Parse --line <id> argument to run a single line
  const args = process.argv.slice(2);
  const lineArgIdx = args.indexOf('--line');
  let targetLineIds = null;
  if (lineArgIdx !== -1 && args[lineArgIdx + 1]) {
    targetLineIds = [args[lineArgIdx + 1]];
  }

  const linesToScrape = targetLineIds
    ? TARGET_LINES.filter((l) => targetLineIds.includes(l.id))
    : TARGET_LINES;

  if (linesToScrape.length === 0) {
    console.error('No matching lines found. Available IDs:', TARGET_LINES.map((l) => l.id).join(', '));
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const allResults = [];

  for (const targetLine of linesToScrape) {
    const results = await scrapeTargetLine(targetLine);

    // Write per-line output
    const outPath = join(OUTPUT_DIR, `${targetLine.id}.json`);
    writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\n  → Saved ${results.length} stations to ${outPath}`);

    allResults.push(...results);
  }

  // Write combined output
  if (linesToScrape.length > 1) {
    const combinedPath = join(OUTPUT_DIR, 'all-lines.json');
    writeFileSync(combinedPath, JSON.stringify(allResults, null, 2), 'utf-8');
    console.log(`\n  → Combined output: ${combinedPath} (${allResults.length} stations total)`);
  }

  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
