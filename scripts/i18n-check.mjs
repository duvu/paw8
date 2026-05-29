#!/usr/bin/env node
/**
 * i18n key parity checker.
 * Reads locale JSON files for web (messages/) and API (src/i18n/) and checks
 * that all three locales (vi, en, zh) have identical key sets.
 * Exits with code 1 if any keys are missing or extra.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const LOCALE_SETS = [
  {
    name: 'Web portal (messages/)',
    dir: join(ROOT, 'apps/web/messages'),
  },
  {
    name: 'API gateway (src/i18n/)',
    dir: join(ROOT, 'apps/api-gateway/src/i18n'),
  },
];

const LOCALES = ['vi', 'en', 'zh'];

/**
 * Recursively flatten an object's keys to dot-separated strings.
 * e.g. { auth: { login: 'Login' } } => ['auth.login']
 */
function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

let totalMissing = 0;
let totalExtra = 0;

for (const { name, dir } of LOCALE_SETS) {
  console.log(`\n── ${name} ──`);

  // Load all locale files
  const localeData = {};
  for (const locale of LOCALES) {
    const filePath = join(dir, `${locale}.json`);
    if (!existsSync(filePath)) {
      console.error(`  ✗ Missing file: ${filePath}`);
      totalMissing++;
      localeData[locale] = null;
      continue;
    }
    try {
      localeData[locale] = JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error(`  ✗ Failed to parse ${filePath}: ${e.message}`);
      totalMissing++;
      localeData[locale] = null;
    }
  }

  // Get key sets for each locale
  const keySets = {};
  for (const locale of LOCALES) {
    if (localeData[locale]) {
      keySets[locale] = new Set(flattenKeys(localeData[locale]));
    }
  }

  // Use 'vi' as the reference locale (primary market)
  const reference = keySets['vi'];
  if (!reference) {
    console.error(`  ✗ Cannot check parity: vi.json is missing or invalid`);
    continue;
  }

  console.log(`  vi: ${reference.size} keys (reference)`);

  for (const locale of ['en', 'zh']) {
    const target = keySets[locale];
    if (!target) {
      console.error(`  ✗ ${locale}: file missing or invalid`);
      continue;
    }

    const missing = [...reference].filter(k => !target.has(k));
    const extra = [...target].filter(k => !reference.has(k));

    if (missing.length === 0 && extra.length === 0) {
      console.log(`  ✓ ${locale}: ${target.size} keys — all match vi`);
    } else {
      if (missing.length > 0) {
        console.error(`  ✗ ${locale}: MISSING ${missing.length} key(s) (present in vi, absent in ${locale}):`);
        for (const k of missing) {
          console.error(`      - ${k}`);
        }
        totalMissing += missing.length;
      }
      if (extra.length > 0) {
        console.warn(`  ⚠ ${locale}: EXTRA ${extra.length} key(s) (present in ${locale}, absent in vi):`);
        for (const k of extra) {
          console.warn(`      + ${k}`);
        }
        totalExtra += extra.length;
      }
    }
  }
}

console.log('\n── Summary ──');
if (totalMissing === 0 && totalExtra === 0) {
  console.log('✓ All locale files have matching key sets. No parity issues found.');
  process.exit(0);
} else {
  if (totalMissing > 0) {
    console.error(`✗ ${totalMissing} missing key(s) found across all locale sets.`);
  }
  if (totalExtra > 0) {
    console.warn(`⚠ ${totalExtra} extra key(s) found (present in non-reference locales but not in vi).`);
  }
  process.exit(1);
}
