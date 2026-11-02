import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NAMES } from '@/components/Icon';
import { ROUTES } from '@/config/routes';
import { dateLocale, formatDate } from '@/domain/dates';
import { renderApp, sample } from './utils';

const TAMIL = /[஀-௿]/;
const LIGATURES = new Set(Object.values(NAMES));
const settle = () => new Promise((r) => setTimeout(r, 1100));

/** The visible text of the page, leaving out the language switch and anything marked as Tamil. */
const visibleText = () => {
  const root = document.body.cloneNode(true) as HTMLElement;
  root.querySelectorAll('[lang="ta"], [data-official-document]').forEach((e) => e.remove());
  return root.textContent ?? '';
};

describe('dates follow the chosen language (C1)', () => {
  it('formats English as en-IN and Tamil as ta-IN', () => {
    expect(dateLocale('en')).toBe('en-IN');
    expect(dateLocale('ta')).toBe('ta-IN');
    // Anything that is not Tamil never gets Tamil month names.
    expect(dateLocale('en-US')).toBe('en-IN');
    expect(formatDate('2026-10-29', 'en')).toBe('29 Oct 2026');
    expect(formatDate('2026-10-29')).toBe('29 Oct 2026');
    expect(formatDate('2026-10-29', 'ta')).toMatch(TAMIL);
  });
});

describe.each(ROUTES.map((r) => [r.id, r] as const))('%s', (_id, route) => {
  it('shows no Tamil characters in English, and no icon names as text (C1, C2)', async () => {
    renderApp(sample(route.path), { signedIn: route.id !== 'login' });
    await screen.findByRole('heading', { level: 1 }, { timeout: 4000 });
    await settle();
    expect(visibleText()).not.toMatch(TAMIL);

    // Every element whose text is an icon name must be hidden from assistive tech, or be a labelled image.
    const bad = Array.from(document.body.querySelectorAll('*')).filter((el) => {
      if (el.children.length > 0) return false;
      if (!LIGATURES.has((el.textContent ?? '').trim())) return false;
      if (el.closest('[aria-hidden="true"]')) return false;
      if (el.closest('[role="img"][aria-label]')) return false;
      if (el.closest('script, style, option, [lang="ta"]')) return false;
      return true;
    });
    expect(bad.map((e) => e.outerHTML)).toEqual([]);

    // Every button and link has a real accessible name.
    const unnamed = Array.from(document.body.querySelectorAll('button, a[href]')).filter((el) => {
      if (el.closest('[aria-hidden="true"]')) return false;
      if (el.getAttribute('aria-label')?.trim() || el.getAttribute('aria-labelledby')) return false;
      const clone = el.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
      return !(clone.textContent ?? '').trim() && !el.getAttribute('title');
    });
    expect(unnamed.map((e) => e.outerHTML.slice(0, 160))).toEqual([]);
  });
});
