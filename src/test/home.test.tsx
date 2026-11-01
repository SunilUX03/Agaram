import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { features } from '@/config/features';
import { renderApp } from './utils';

const original = features.home.sections.map((s) => ({ ...s }));
afterEach(() => {
  features.home.sections.splice(0, features.home.sections.length, ...original);
});

const order = () =>
  screen
    .getAllByRole('heading', { level: 2 })
    .map((h) => h.textContent)
    .filter((t) => ['Waiting on you', 'What would you like to do?'].includes(t ?? ''));

describe('Home is built from features.home.sections', () => {
  it('shows the sections in the configured order', async () => {
    renderApp('/home');
    await screen.findByText('Waiting on you');
    expect(order()).toEqual(['Waiting on you', 'What would you like to do?']);
  });
  it('can be reordered and trimmed with a config change only', async () => {
    features.home.sections.splice(
      0,
      features.home.sections.length,
      { key: 'quick', enabled: true },
      { key: 'waiting', enabled: true },
    );
    renderApp('/home');
    await screen.findByText('Waiting on you');
    expect(order()).toEqual(['What would you like to do?', 'Waiting on you']);
    expect(screen.queryByText('Your service at a glance')).toBeNull();
  });
});
