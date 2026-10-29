import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSeed } from '@/data/seed';
import { REQUEST_TYPES } from '@/config/requests';

// Section 10: words that must never appear in the interface.
const NEVER = [
  'Officer Profile',
  'Basic Info',
  'Official Info',
  'Previous Posting',
  'Previous Details',
  'Spl A',
  'Spl B',
  'Add New',
  'Apply form',
  'Pending Approval',
  'Policy Proposals',
  'Submit Demand',
  'Seconded',
  'Discourse',
  'Compendiums',
  'Beyond the File',
  'Capacity Building',
  'Uploads',
  'Special Entries',
  'Utility Forms',
  'Important Updates',
  'Other Types of GOs',
  'Update in Civil List',
  'Order For',
];
const NEVER_WORDS = ['Demand', 'Canvas', 'Board', 'Master', 'Role'];

function strings(dir: string): string[] {
  const out: string[] = [];
  const walk = (v: unknown) =>
    typeof v === 'string'
      ? out.push(v)
      : v && typeof v === 'object'
        ? Object.values(v).forEach(walk)
        : undefined;
  for (const f of fs.readdirSync(dir)) walk(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  return out;
}

describe('copy', () => {
  const text = [
    ...strings('src/i18n/en'),
    ...JSON.stringify(
      REQUEST_TYPES.map((t) => [
        t.label,
        t.cardName,
        t.help,
        t.keepReady,
        t.note,
        t.fields.map((f) => f.label),
        t.documents.map((d) => d.label),
      ]),
    ).split('"'),
    ...JSON.stringify(buildSeed()).split('"'),
  ].join('\n');
  it.each(NEVER)('never shows "%s"', (term) => expect(text).not.toContain(term));
  it.each(NEVER_WORDS)('never shows the word "%s"', (w) =>
    expect(new RegExp(`\\b${w}\\b`).test(text)).toBe(false),
  );
  it('has no exclamation marks in the English catalogue', () =>
    expect(strings('src/i18n/en').filter((s) => s.includes('!'))).toEqual([]));
  it('has a Tamil key for every English key', () => {
    const keys = (v: unknown, p = ''): string[] =>
      v && typeof v === 'object'
        ? Object.entries(v).flatMap(([k, x]) => keys(x, `${p}${k}.`))
        : [p];
    for (const f of fs.readdirSync('src/i18n/en')) {
      const en = keys(JSON.parse(fs.readFileSync(`src/i18n/en/${f}`, 'utf8'))).sort();
      const ta = keys(JSON.parse(fs.readFileSync(`src/i18n/ta/${f}`, 'utf8'))).sort();
      expect(ta, f).toEqual(en);
    }
  });
});
