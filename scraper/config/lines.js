/**
 * Configuration for each target line.
 *
 * formationKeywords: substrings that appear in formation labels on station pages
 *   (e.g. "横須賀線１５両" contains "横須賀線").
 *   null means the page doesn't use line names in labels (e.g. "１０両編成時").
 *
 * defaultCarLengths: used when no formation labels are found on the page.
 */
export const TARGET_LINES = [
  {
    id: 'jr-yokosuka',
    displayName: 'JR横須賀線',
    indexUrl: 'https://wadattsu261.com/jo-yokosuka-soburapidline-info/',
    formationKeywords: ['横須賀線'],
    defaultCarLengths: [15, 11, 10],
  },
  {
    id: 'jr-shonan',
    displayName: 'JR湘南新宿ライン',
    indexUrl: 'https://wadattsu261.com/js-shonanshinjukulinehome-info/',
    formationKeywords: ['湘南新宿ライン'],
    defaultCarLengths: [15, 10],
  },
  {
    id: 'sotetsu',
    displayName: '相鉄線',
    indexUrl: 'https://wadattsu261.com/so-sotetsuhome-info/',
    formationKeywords: ['相鉄'],
    defaultCarLengths: [10, 8],
  },
  {
    id: 'tokyu-toyoko',
    displayName: '東急東横線',
    indexUrl: 'https://wadattsu261.com/ty-tokyutoyokohome-info/',
    formationKeywords: ['東横', '東急'],
    defaultCarLengths: [10, 8],
  },
  {
    id: 'jr-saikyo',
    displayName: 'JR埼京線',
    indexUrl: 'https://wadattsu261.com/ja-saikyohome-info/',
    formationKeywords: ['埼京', 'りんかい'],
    defaultCarLengths: [10],
  },
  {
    id: 'seibu-ikebukuro',
    displayName: '西武池袋線',
    indexUrl: 'https://wadattsu261.com/si-seibuikebukurohome-info/',
    formationKeywords: ['西武', '池袋線'],
    defaultCarLengths: [10, 8],
  },
];
