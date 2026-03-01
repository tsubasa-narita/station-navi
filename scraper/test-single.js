/**
 * Quick test: scrape a single station page and print the result.
 * Usage: node test-single.js <url>
 *
 * Example:
 *   node test-single.js https://wadattsu261.com/content/musashikosugi-yokosuka-shonanshinjukuline-sotetsudirecthome-info/
 */
import axios from 'axios';
import { extractStationData } from './lib/extract.js';
import { convertToAppFormat } from './lib/convert.js';
import { TARGET_LINES } from './config/lines.js';

const url = process.argv[2] || 'https://wadattsu261.com/content/musashikosugi-yokosuka-shonanshinjukuline-sotetsudirecthome-info/';
const lineId = process.argv[3] || 'jr-yokosuka';

const targetLine = TARGET_LINES.find((l) => l.id === lineId);
if (!targetLine) {
  console.error('Unknown line ID:', lineId);
  console.error('Available:', TARGET_LINES.map((l) => l.id).join(', '));
  process.exit(1);
}

async function run() {
  console.log('Fetching:', url);
  const response = await axios.get(url, {
    headers: { 'User-Agent': 'station-navi-test/1.0', 'Accept-Language': 'ja' },
    timeout: 15000,
  });

  const stationData = extractStationData(response.data, url);
  console.log('\n=== Extracted Data ===');
  console.log('Station:', stationData.stationName);
  console.log('Article car lengths:', stationData.articleCarLengths);
  console.log('Directions:', stationData.directions.length);

  for (const dir of stationData.directions) {
    console.log(`\n  Direction: ${dir.name}`);
    for (const fac of dir.facilities) {
      console.log(`    [${fac.type}] direction=${fac.direction}`);
      for (const entry of fac.entries) {
        const formStr = entry.formations
          ? entry.formations.map((f) => `${f.line || 'any'}/${f.cars}両`).join(', ')
          : '(no marker)';
        console.log(`      formations=[${formStr}] → 車${entry.carNumber}扉${entry.doorNumber}`);
      }
    }
  }

  console.log('\n=== App Format (line:', lineId, ') ===');
  const appEntry = convertToAppFormat(stationData, targetLine);
  if (!appEntry) {
    console.log('No matching data for this line.');
  } else {
    console.log(JSON.stringify(appEntry, null, 2));
  }
}

run().catch(console.error);
