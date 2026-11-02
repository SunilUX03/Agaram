import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSeed } from '@/data/seed';
import { features } from '@/config/features';
import { REQUEST_TYPES } from '@/config/requests';
import { LABELS } from '@/config/labels';
import { SERVICE_CARDS } from '@/config/services';

// v2, section 7: words that must never appear in the interface. (Policy Proposals, Discourse, Beyond the File,
// Capacity Building and the Downloads tab names are official names now.)
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
  'Submit Demand',
  'Seconded',
  'Compendiums',
  'Uploads',
  'Update in Civil List',
  'Order For',
  'Not Approved',
];
const NEVER_WORDS = ['Demand', 'Canvas', 'Board', 'Master', 'ASO', 'SO', 'Role'];

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
        t.fields.map((f) => f.label),
        t.documents.map((d) => d.label),
      ]),
    ).split('"'),
    ...JSON.stringify(buildSeed()).split('"'),
    ...Object.values(LABELS),
    ...SERVICE_CARDS.flatMap((c) => [c.title, c.headline, c.tagline, c.main, c.pastLabel ?? '']),
  ].join('\n');
  it.each(NEVER)('never shows "%s"', (term) => expect(text).not.toContain(term));
  it.each(NEVER_WORDS)('never shows the word "%s"', (w) =>
    expect(new RegExp(`\\b${w}\\b`).test(text)).toBe(false),
  );
  it('never says "super admin": the approver is the Under Secretary, from one config value', () => {
    expect(text.toLowerCase()).not.toMatch(/super.?admin/);
    // Source, docs and flows say it nowhere either (this test file is the one place the phrase is written).
    const walk = (d: string): string[] =>
      fs
        .readdirSync(d, { withFileTypes: true })
        .flatMap((e) =>
          e.isDirectory()
            ? e.name === 'node_modules'
              ? []
              : walk(path.join(d, e.name))
            : [path.join(d, e.name)],
        );
    const files = [...walk('src'), ...walk('e2e'), 'README.md', 'DECISIONS.md'].filter(
      (f) => !f.endsWith('copy.test.ts') && /\.(ts|tsx|json|md|mjs)$/.test(f),
    );
    for (const f of files) expect(fs.readFileSync(f, 'utf8'), f).not.toMatch(/super.?admin/i);
    expect(features.approver.title).toBe('Under Secretary');
    expect(features.approver.role).toBe('approver');
  });
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
