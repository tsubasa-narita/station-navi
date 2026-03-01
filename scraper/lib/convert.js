/**
 * Convert extracted station data to the app's stationData.json format.
 *
 * App format:
 * {
 *   stationId: string,
 *   stationName: string,
 *   line: string,
 *   platforms: [{
 *     platformId: string,
 *     platformName: string,
 *     availableTrainLengths: number[],
 *     facilities: [{
 *       id: string,
 *       type: 'elevator' | 'escalator' | 'stairs',
 *       floorFrom: string,
 *       floorTo: string,
 *       direction: string,
 *       notes: string,
 *       positions: [{ length: number, carNumber: number, doorNumber: number }]
 *     }]
 *   }]
 * }
 */

/**
 * Determine if a formation entry matches the target line.
 * - formation.line === null  →  "N両編成時" style, applies to any line
 * - otherwise check against target line's formationKeywords
 */
function matchesTargetLine(formation, targetLine) {
  if (formation.line === null) return true;
  return targetLine.formationKeywords.some((kw) => formation.line.includes(kw));
}

/**
 * Given an extracted facility and target line config, build the positions array.
 * Also returns the set of unique car lengths used.
 *
 * @param {object} facility - from parseSection()
 * @param {object} targetLine - from TARGET_LINES config
 * @param {number[]} articleCarLengths - fallback lengths from article text
 * @returns {{ positions: object[], lengths: number[] }}
 */
function buildPositions(facility, targetLine, articleCarLengths) {
  const positions = [];

  for (const entry of facility.entries) {
    if (!entry.formations || entry.formations.length === 0) {
      // No formation labels or unparseable labels — apply to all known lengths
      const lengths = articleCarLengths.length > 0
        ? articleCarLengths
        : targetLine.defaultCarLengths;
      for (const length of lengths) {
        positions.push({ length, carNumber: entry.carNumber, doorNumber: entry.doorNumber });
      }
    } else {
      // Filter formations that belong to the target line
      const matching = entry.formations.filter((f) => matchesTargetLine(f, targetLine));
      for (const formation of matching) {
        positions.push({
          length: formation.cars,
          carNumber: entry.carNumber,
          doorNumber: entry.doorNumber,
        });
      }
    }
  }

  // Deduplicate (same length+car+door)
  const seen = new Set();
  const unique = positions.filter((p) => {
    const key = `${p.length}-${p.carNumber}-${p.doorNumber}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by length desc, then carNumber, then doorNumber
  unique.sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    if (a.carNumber !== b.carNumber) return a.carNumber - b.carNumber;
    return a.doorNumber - b.doorNumber;
  });

  const lengths = [...new Set(unique.map((p) => p.length))].sort((a, b) => b - a);
  return { positions: unique, lengths };
}

/**
 * Extract URL slug from a station page URL to use as a base ID.
 * e.g. "https://wadattsu261.com/content/musashikosugi-yokosuka-shonanshinjukuline-info/"
 *    → "musashikosugi-yokosuka-shonanshinjukuline"
 */
function urlSlug(url) {
  const match = url.match(/\/content\/([^/]+?)\/?$/);
  if (match) return match[1].replace(/-info$/, '');
  return url.split('/').filter(Boolean).pop().replace(/-info$/, '');
}

/**
 * Convert extracted station data + target line config into an app-format station object.
 * Returns null if no usable data found for this line.
 *
 * @param {object} stationData - output of extractStationData()
 * @param {object} targetLine - one entry from TARGET_LINES
 * @returns {object|null}
 */
export function convertToAppFormat(stationData, targetLine) {
  const slug = urlSlug(stationData.url);
  const stationId = `${slug}__${targetLine.id}`;
  const platforms = [];

  for (let di = 0; di < stationData.directions.length; di++) {
    const direction = stationData.directions[di];
    const platformId = `p_${slug}_${di}`;
    const appFacilities = [];
    let platformLengths = new Set();

    for (let fi = 0; fi < direction.facilities.length; fi++) {
      const facility = direction.facilities[fi];
      const { positions, lengths } = buildPositions(
        facility,
        targetLine,
        stationData.articleCarLengths,
      );

      if (positions.length === 0) continue;

      lengths.forEach((l) => platformLengths.add(l));

      appFacilities.push({
        id: `${slug}_${di}_${fi}`,
        type: facility.type,
        floorFrom: 'ホーム',
        floorTo: '改札階',
        direction: facility.direction || '上下',
        notes: '',
        positions,
      });
    }

    if (appFacilities.length === 0) continue;

    const availableTrainLengths = [...platformLengths].sort((a, b) => b - a);

    platforms.push({
      platformId,
      platformName: direction.name,
      availableTrainLengths,
      facilities: appFacilities,
    });
  }

  if (platforms.length === 0) return null;

  return {
    stationId,
    stationName: stationData.stationName,
    line: targetLine.displayName,
    sourceUrl: stationData.url,
    platforms,
  };
}
