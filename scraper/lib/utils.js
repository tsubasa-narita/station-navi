/**
 * Convert full-width digits to half-width.
 */
export function toHalf(str) {
  return str.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
}

/**
 * Determine facility type from midashi_p text.
 * Returns 'elevator' | 'escalator' | 'stairs' | null
 */
export function getFacilityType(text) {
  if (text.includes('エレベーター')) return 'elevator';
  if (text.includes('エスカレーター')) return 'escalator';
  if (text.includes('階段')) return 'stairs';
  return null;
}

/**
 * Extract direction label from midashi_p text.
 * Returns '上り' | '下り' | '上下' | null
 */
export function getFacilityDirection(text) {
  if (/上り・下り|上下|双方向/.test(text)) return '上下';
  if (/下り/.test(text)) return '下り';
  if (/上り/.test(text)) return '上り';
  return null;
}

/**
 * Known line name patterns in formation labels (longest first to avoid partial matches).
 */
const KNOWN_LINE_NAMES = [
  '湘南新宿ライン',
  '相鉄線直通',
  '相鉄直通',
  '東急東横線',
  '東急新横浜線',
  '新横浜線',
  '横須賀線',
  '東横線',
  '埼京線',
  'りんかい線',
  '西武池袋線',
  '有楽町線',
  '副都心線',
  '池袋線',
];

/**
 * Parse a formation label paragraph into an array of {line, cars} objects.
 * - line: string (line name) or null (when label is "N両編成時" style)
 * - cars: number (train car count)
 *
 * Examples:
 *   "横須賀線１５両" → [{line: '横須賀線', cars: 15}]
 *   "横須賀線１１両・湘南新宿ライン１５・１０両" → [{line:'横須賀線',cars:11},{line:'湘南新宿ライン',cars:15},{line:'湘南新宿ライン',cars:10}]
 *   "１０両編成時" → [{line: null, cars: 10}]
 */
export function parseFormationLabel(label) {
  const h = toHalf(label.trim());

  // Pattern: "N両編成時" (no line name) — private railway style
  const editMatches = [...h.matchAll(/(\d+)両編成時?/g)];
  if (editMatches.length > 0) {
    return editMatches.map((m) => ({ line: null, cars: parseInt(m[1], 10) }));
  }

  // Find all line name positions
  const positions = [];
  for (const name of KNOWN_LINE_NAMES) {
    let searchFrom = 0;
    while (true) {
      const idx = h.indexOf(name, searchFrom);
      if (idx === -1) break;
      positions.push({ idx, name });
      searchFrom = idx + 1;
    }
  }

  if (positions.length === 0) {
    // No known line name — extract any car numbers as line-agnostic
    const carMatches = [...h.matchAll(/(\d+)両/g)];
    return carMatches.map((m) => ({ line: null, cars: parseInt(m[1], 10) }));
  }

  // Sort by position in label
  positions.sort((a, b) => a.idx - b.idx);

  const results = [];
  for (let i = 0; i < positions.length; i++) {
    const { idx, name } = positions[i];
    const segmentStart = idx + name.length;
    const segmentEnd = i + 1 < positions.length ? positions[i + 1].idx : h.length;
    const segment = h.substring(segmentStart, segmentEnd);
    const carMatches = [...segment.matchAll(/(\d+)/g)];
    for (const m of carMatches) {
      results.push({ line: name, cars: parseInt(m[1], 10) });
    }
  }
  return results;
}

/**
 * Extract car number and door number from a paragraph containing 『X号車Y番ドア』.
 * Returns array of {carNumber, doorNumber} or null.
 */
export function parseCarDoor(text) {
  const h = toHalf(text);
  // Collect ALL 『...』 bracketed segments and return all valid car+door pairs
  const all = [...h.matchAll(/『([^』]+)』/g)];
  const results = [];
  for (const m of all) {
    const inner = m[1];
    const carMatch = inner.match(/(\d+)号車/);
    const doorMatch = inner.match(/(\d+)番ドア/);
    if (carMatch && doorMatch) {
      results.push({
        carNumber: parseInt(carMatch[1], 10),
        doorNumber: parseInt(doorMatch[1], 10),
      });
    }
  }
  return results.length > 0 ? results : null;
}

/**
 * Parse paragraphs of the form "N両編成時（X号車Y番ドア）".
 * Returns array of {formations, carNumber, doorNumber} or null.
 * Used for pages that embed formation and car/door in the same paragraph
 * using full-width parentheses instead of 『』 brackets.
 */
export function parseCarDoorWithFormation(text) {
  const h = toHalf(text);
  // Match "N両編成時[optional text]（X号車Y番ドア）" — full-width （） or ASCII ()
  const matches = [...h.matchAll(/(\d+)両編成時[^(（]*[（(]([^)）]+)[)）]/g)];
  const results = [];
  for (const m of matches) {
    const cars = parseInt(m[1], 10);
    const inner = m[2];
    const carMatch = inner.match(/(\d+)号車/);
    const doorMatch = inner.match(/(\d+)番ドア/);
    if (carMatch && doorMatch) {
      results.push({
        formations: [{ line: null, cars }],
        carNumber: parseInt(carMatch[1], 10),
        doorNumber: parseInt(doorMatch[1], 10),
      });
    }
  }
  return results.length > 0 ? results : null;
}

/**
 * Extract station name from the page <title>.
 * Pattern: 【...駅】 → strip known company prefixes.
 */
export function extractStationName($) {
  const title = $('title').text();
  const match = title.match(/【([^\】]+?)駅】/);
  if (!match) return null;
  let name = match[1];
  const prefixes = ['ＪＲ', '東急', '西武', '相鉄', '東京メトロ', '都営', 'りんかい', '東武', '小田急', '京急', '京王', '近鉄', '阪急', '阪神', '名鉄'];
  for (const prefix of prefixes) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length);
      break;
    }
  }
  return name.trim();
}

/**
 * Check if an H2 text represents a train direction/platform section (not other sections).
 * Matches direction-based, platform-based, and generic "停車位置" headers.
 */
export function isDirectionHeader(text) {
  if (!text) return false;
  // Terminus/multi-platform headers: "N番線ホーム到着時"
  if (/[０-９\d][０-９\d・]*番線ホーム/.test(text)) return true;
  // Single-section pages: "停車位置（号車とドアの位置）詳細"
  if (/停車位置/.test(text) && !/関連/.test(text)) return true;
  // Standard direction headers
  return /(下り|上り|南行|北行|方面|行き)/.test(text) &&
    !/(その他|関連ページ|ご案内|地図|乗り換え|周辺|概要|対応)/.test(text);
}

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a URL-safe ID from a string.
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\-]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}
