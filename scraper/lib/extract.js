import * as cheerio from 'cheerio';
import {
  extractStationName,
  getFacilityType,
  getFacilityDirection,
  parseFormationLabel,
  parseCarDoor,
  parseCarDoorWithFormation,
  isDirectionHeader,
  toHalf,
} from './utils.js';

/**
 * Parse all facility entries within a container element (tab panel or H2 section).
 *
 * Returns an array of:
 * {
 *   type: 'elevator' | 'escalator' | 'stairs',
 *   direction: '上り' | '下り' | '上下' | null,
 *   entries: [
 *     {
 *       formations: [{line: string|null, cars: number}] | null,
 *       carNumber: number,
 *       doorNumber: number,
 *     }
 *   ]
 * }
 */
function parseSection($, container) {
  const facilities = [];
  let currentFacility = null;
  let currentFormations = null;

  const pushCarDoor = (carDoor) => {
    if (!currentFacility) return;
    // carDoor may be a single object or array of objects (multiple doors in one paragraph)
    const items = Array.isArray(carDoor) ? carDoor : [carDoor];
    for (const item of items) {
      currentFacility.entries.push({
        formations: currentFormations, // null = no marker (applies to all lengths)
        carNumber: item.carNumber,
        doorNumber: item.doorNumber,
      });
    }
    currentFormations = null; // reset after use
  };

  // Collect all paragraphs (direct or nested) in document order
  container.find('p').each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    const classes = ($el.attr('class') || '').split(/\s+/);

    // Skip image paragraphs and gate-section headers
    if (classes.includes('norikae-picture') || classes.includes('stationhome-matome')) {
      return;
    }

    // Facility header
    if (classes.includes('midashi_p')) {
      const facilityType = getFacilityType(text);
      if (facilityType) {
        currentFacility = {
          type: facilityType,
          direction: getFacilityDirection(text),
          entries: [],
        };
        facilities.push(currentFacility);
        currentFormations = null;
      }
      return;
    }

    // "N両編成時（X号車Y番ドア）" format: formation and car/door in same paragraph
    const carDoorWithFormation = parseCarDoorWithFormation(text);
    if (carDoorWithFormation) {
      if (currentFacility) {
        for (const item of carDoorWithFormation) {
          currentFacility.entries.push({
            formations: item.formations,
            carNumber: item.carNumber,
            doorNumber: item.doorNumber,
          });
        }
        currentFormations = null;
      }
      return;
    }

    // Car/door position — check BEFORE formation label, because p.mark elements
    // may contain marker-under spans for highlighting while also having car/door refs
    const carDoor = parseCarDoor(text);
    if (carDoor) {
      pushCarDoor(carDoor);
      return;
    }

    // Formation label (paragraph containing colored marker spans)
    const markerSpans = $el.find('[class*="marker-under-"]');
    if (markerSpans.length > 0) {
      const label = markerSpans
        .map((_, s) => $(s).text().trim())
        .get()
        .join('');
      if (label) {
        currentFormations = parseFormationLabel(label);
      }
    }
  });

  return facilities.filter((f) => f.entries.length > 0);
}

/**
 * Extract all car-length mentions from the full article text.
 * Used as fallback when no formation labels appear on a page.
 * Returns an array of unique car counts (numbers).
 */
function extractArticleCarLengths($) {
  const articleText = toHalf($('article').text());
  const matches = [...articleText.matchAll(/(\d+)両編成/g)];
  const lengths = [...new Set(matches.map((m) => parseInt(m[1], 10)))].sort((a, b) => b - a);
  return lengths;
}

/**
 * Extract station data from raw HTML.
 *
 * Returns:
 * {
 *   stationName: string,
 *   url: string,
 *   articleCarLengths: number[],
 *   directions: [
 *     {
 *       name: string,           // direction label
 *       facilities: [...]       // from parseSection()
 *     }
 *   ]
 * }
 */
export function extractStationData(html, url) {
  const $ = cheerio.load(html);
  const stationName = extractStationName($) || url.split('/').filter(Boolean).pop();
  const articleCarLengths = extractArticleCarLengths($);

  const directions = [];

  // --- Tab-based layout ---
  const tabs = $('[role="tab"]');
  if (tabs.length > 0) {
    tabs.each((_, tab) => {
      const $tab = $(tab);
      const directionName = $tab.text().trim();
      const panelId = $tab.attr('aria-controls');
      if (!panelId) return;
      const $panel = $(`#${panelId}`);
      if (!$panel.length) return;

      const facilities = parseSection($, $panel);
      if (facilities.length > 0) {
        directions.push({ name: directionName, facilities });
      }
    });
    return { stationName, url, articleCarLengths, directions };
  }

  // --- H2-based layout ---
  // Content lives in .entry-content, not directly in article
  const entryContent = $('.entry-content');
  const contentRoot = entryContent.length ? entryContent : $('article');
  if (!contentRoot.length) {
    return { stationName, url, articleCarLengths, directions };
  }

  // Collect siblings between consecutive direction H2s
  let currentDirection = null;
  let currentNodes = [];

  const flush = () => {
    if (!currentDirection || currentNodes.length === 0) return;
    // Build a temporary cheerio wrapper to parse accumulated nodes
    const wrapHtml = currentNodes
      .map((n) => $.html(n))
      .join('');
    const wrapper = cheerio.load(`<div id="_sec">${wrapHtml}</div>`);
    const $sec = wrapper('#_sec');
    const facilities = parseSection(wrapper, $sec);
    if (facilities.length > 0) {
      directions.push({ name: currentDirection, facilities });
    }
  };

  contentRoot.children().each((_, child) => {
    const tag = (child.tagName || child.name || '').toLowerCase();
    if (tag === 'h2') {
      flush();
      const text = $(child).text().trim();
      currentDirection = isDirectionHeader(text) ? text : null;
      currentNodes = [];
    } else if (currentDirection) {
      currentNodes.push(child);
    }
  });
  flush();

  return { stationName, url, articleCarLengths, directions };
}
