// One-off Node script to compute spelling metrics from form_snapshots_rows.csv
// Usage (from repo root):
//   node scripts/spelling_from_csv.js

const fs = require('fs');
const path = require('path');

// Minimal CSV parser that understands quoted fields with commas and quotes.
function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return [];

  const rows = [];
  const headers = splitCsvLine(lines[0]);

  for (let i = 1; i < lines.length; i++) {
    const fields = splitCsvLine(lines[i]);
    if (fields.length === 0) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = fields[idx] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        const next = line[i + 1];
        if (next === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

// --- Spelling logic (mirrors frontend/src/utils/spelling.ts conceptually, simplified to JS) ---

const WORD_REGEX = /[A-Za-z]{3,}/g;

const BUILT_IN_WHITELIST = [
  // Proper nouns / abbreviations
  'usa',
  'uk',
  'nyc',
  'california',
  'google',
  'microsoft',
  'netflix',
  'instagram',
  'linkedin',
  'whatsapp',

  // British / US spelling variants and common academic words
  'colour',
  'colors',
  'colours',
  'realise',
  'realised',
  'realises',
  'realising',
  'realize',
  'realized',
  'realizes',
  'realizing',
  'practise',
  'practised',
  'practises',
  'practising',
  'practice',
  'practiced',
  'practices',
  'practicing',
  'organisation',
  'organisations',
  'organize',
  'organised',
  'organises',
  'organising',
  'organization',
  'organizations',
  'behaviour',
  'behavioural',
  'behaviors',
  'behaviourally',
  'behavior',
  'behavioral',
  'behaviorally',

  // Words we saw commonly flagged that are fine
  'melody',
  'melodies',
  'closest',
  'relationships',
  'relationship',
  'communication',
  'communications',
  'environment',
  'environments',
  'biomedical',
  'singapore',
];

// Try to build a proper English dictionary set from the system dictionary.
// On macOS, /usr/share/dict/words is usually available.
let DICTIONARY_SET;
try {
  const dictPath = '/usr/share/dict/words';
  if (fs.existsSync(dictPath)) {
    const dictRaw = fs.readFileSync(dictPath, 'utf8');
    const words = dictRaw
      .split(/\r?\n/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0);
    DICTIONARY_SET = new Set(words);
    // eslint-disable-next-line no-console
    console.log(
      'Loaded system dictionary from',
      dictPath,
      'with',
      DICTIONARY_SET.size,
      'entries',
    );
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('Failed to load system dictionary, falling back to small list');
}

if (!DICTIONARY_SET) {
  const FALLBACK_DICTIONARY = [
    'the', 'and', 'you', 'that', 'for', 'with', 'this', 'have', 'are', 'not',
    'but', 'from', 'they', 'will', 'would', 'there', 'their', 'about', 'which',
    'when', 'make', 'time', 'just', 'like', 'know', 'people', 'into', 'year',
    'good', 'some', 'could', 'them', 'other', 'than', 'then', 'also', 'only',
    'want', 'these', 'because', 'work', 'first', 'over', 'after', 'think',
    'still', 'back', 'use', 'very', 'even', 'many', 'feel', 'school', 'family',
    'friends', 'study', 'learn', 'online', 'college', 'university', 'project',
    'research', 'reading', 'writing', 'exercise', 'music', 'travel', 'health',
  ];
  DICTIONARY_SET = new Set(FALLBACK_DICTIONARY.map((w) => w.toLowerCase()));
}
const WHITELIST_SET = new Set(BUILT_IN_WHITELIST.map((w) => w.toLowerCase()));

function isKnownWord(word) {
  const w = word.toLowerCase();
  if (WHITELIST_SET.has(w) || DICTIONARY_SET.has(w)) return true;

  // Plural forms: cats -> cat, classes -> class
  if (w.endsWith('s')) {
    const base = w.slice(0, -1);
    if (DICTIONARY_SET.has(base)) return true;
    if (w.endsWith('es')) {
      const baseEs = w.slice(0, -2);
      if (DICTIONARY_SET.has(baseEs)) return true;
    }
  }

  // Past tense: walked -> walk, studied -> study
  if (w.endsWith('ed')) {
    const base = w.slice(0, -2);
    if (DICTIONARY_SET.has(base)) return true;
    const baseAlt = w.slice(0, -1);
    if (DICTIONARY_SET.has(baseAlt)) return true;
  }

  // Gerunds / present participles: studying -> study, tidying -> tidy
  if (w.endsWith('ing')) {
    const base = w.slice(0, -3);
    if (DICTIONARY_SET.has(base)) return true;
    const basePlusE = base + 'e';
    if (DICTIONARY_SET.has(basePlusE)) return true;
  }

  // Third-person singular with y -> ies: relies -> rely
  if (w.endsWith('ies')) {
    const baseY = w.slice(0, -3) + 'y';
    if (DICTIONARY_SET.has(baseY)) return true;
  }

  // Comparatives / superlatives: stronger -> strong, strongest -> strong
  if (w.endsWith('er')) {
    const base = w.slice(0, -2);
    if (DICTIONARY_SET.has(base)) return true;
  }
  if (w.endsWith('est')) {
    const base = w.slice(0, -3);
    if (DICTIONARY_SET.has(base)) return true;
  }

  // Simple compounds: videogames -> video + games, sometimes -> some + times
  for (let i = 3; i <= w.length - 3; i++) {
    const left = w.slice(0, i);
    const right = w.slice(i);
    if (DICTIONARY_SET.has(left) && DICTIONARY_SET.has(right)) {
      return true;
    }
  }

  return false;
}

function countSpellingErrors(text) {
  const matches = text.match(WORD_REGEX) || [];
  let errors = 0;
  const unknownTokens = [];

  for (const raw of matches) {
    const w = raw.toLowerCase();
    if (isKnownWord(w)) continue;
    if (!DICTIONARY_SET.has(w)) {
      errors += 1;
      unknownTokens.push(w);
    }
  }
  return { errors, unknownTokens };
}

function computeFormSpellingSummary(formData, questionIds) {
  const perQuestion = {};
  const unknownTokensByQuestion = {};
  let total = 0;

  for (const id of questionIds) {
    const raw = formData[id];
    const value = typeof raw === 'string' ? raw : '';
    const { errors, unknownTokens } = countSpellingErrors(value);
    perQuestion[id] = errors;
    unknownTokensByQuestion[id] = unknownTokens;
    total += errors;
  }

  return { perQuestion, total, unknownTokensByQuestion };
}

function extractQuestionIds(questionSet) {
  if (!questionSet) return [];
  const out = [];
  const pushIds = (arr) => {
    if (!Array.isArray(arr)) return;
    for (const q of arr) {
      if (q && typeof q.id === 'string') out.push(q.id);
    }
  };
  pushIds(questionSet.requiredShort);
  pushIds(questionSet.short);
  pushIds(questionSet.directLong);
  pushIds(questionSet.indirectLong);
  pushIds(questionSet.transcription);
  // Never include fullName in spelling calculations
  return out.filter((id) => id !== 'fullName');
}

function main() {
  const csvPath = path.resolve(
    __dirname,
    '../frontend/../Downloads/form_snapshots_rows.csv'.replace('../frontend/..', '..'),
  );

  const fallbackPath = path.resolve(
    '/Users/paramsrini/Downloads/form_snapshots_rows.csv',
  );

  let actualPath = csvPath;
  if (!fs.existsSync(actualPath) && fs.existsSync(fallbackPath)) {
    actualPath = fallbackPath;
  }

  if (!fs.existsSync(actualPath)) {
    console.error('CSV file not found at', actualPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(actualPath, 'utf8');
  const rows = parseCsv(raw);

  const outLines = [];
  outLines.push(
    [
      'id',
      'session_id',
      'test_type',
      'spelling_total',
      'spelling_per_question_json',
      'unknown_tokens_by_question_json',
    ].join(','),
  );

  for (const row of rows) {
    const snapshotRaw = row.form_snapshot;
    if (!snapshotRaw) continue;

    let snapshot;
    try {
      // snapshotRaw is already unquoted field content from parseCsv
      snapshot = JSON.parse(snapshotRaw);
    } catch (e) {
      // Try fixing double quotes if needed
      try {
        const cleaned = snapshotRaw.replace(/""/g, '"');
        snapshot = JSON.parse(cleaned);
      } catch (e2) {
        console.error('Failed to parse snapshot for row', row.id);
        continue;
      }
    }

    const questionIds = extractQuestionIds(snapshot.questionSet);
    const summary = computeFormSpellingSummary(snapshot, questionIds);

    const perQuestionJson = JSON.stringify(summary.perQuestion).replace(/"/g, '""');
    const unknownTokensJson = JSON.stringify(summary.unknownTokensByQuestion).replace(
      /"/g,
      '""',
    );

    outLines.push(
      [
        row.id,
        row.session_id,
        row.test_type,
        String(summary.total),
        `"${perQuestionJson}"`,
        `"${unknownTokensJson}"`,
      ].join(','),
    );
  }

  const outPath = path.resolve(__dirname, '../spelling_metrics_from_snapshots.csv');
  fs.writeFileSync(outPath, outLines.join('\n'), 'utf8');
  // eslint-disable-next-line no-console
  console.log('Wrote', outPath);
}

main();

