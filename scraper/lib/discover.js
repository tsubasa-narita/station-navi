import * as cheerio from 'cheerio';

// URL patterns to exclude (not station pages)
const EXCLUDE_PATTERNS = [
  /all-info/,
  /car-doornumber-check/,
  /transfer/,
  /route/,
  /transfer-information/,
  /youkoso/,
  /category/,
  /tag\//,
  /page\//,
  /author/,
  /search/,
  /#/,
];

function isStationPageUrl(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith('/content/')) return false;
    if (!parsed.pathname.endsWith('-info/') && !parsed.pathname.endsWith('-info')) return false;
    return !EXCLUDE_PATTERNS.some((re) => re.test(parsed.pathname));
  } catch {
    return false;
  }
}

/**
 * Discover station page URLs from a line index page.
 *
 * @param {string} html - Raw HTML of the index page
 * @param {string} baseUrl - Base URL for resolving relative links
 * @returns {string[]} - Array of absolute station page URLs (deduplicated)
 */
export function discoverStationUrls(html, baseUrl) {
  const $ = cheerio.load(html);
  const seen = new Set();
  const urls = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    try {
      const absolute = new URL(href, baseUrl).href;
      const normalized = absolute.split('#')[0]; // strip fragment
      if (isStationPageUrl(normalized) && !seen.has(normalized)) {
        seen.add(normalized);
        urls.push(normalized);
      }
    } catch {
      // ignore invalid URLs
    }
  });

  return urls;
}
