import { screen, waitFor } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { REQUEST_TYPES, rangeTitle } from '@/config/requests';
import { SERVICE_CARDS } from '@/config/services';
import { api } from '@/data/api';
import { resetDb } from '@/data/store';
import { renderApp } from './utils';

/** A fifth card, added by config alone: no page component, no repository code. */
beforeAll(() => {
  REQUEST_TYPES.push({
    key: 'foreign-visit',
    kind: 'service',
    cardKey: 'foreign-visit',
    label: 'Apply for a foreign visit',
    cardName: 'Foreign Visit',
    icon: 'plane',
    modes: ['apply', 'past'],
    orderBlock: true,
    proofRequiredFor: ['past'],
    fields: [
      { name: 'country', kind: 'text', label: 'Country', required: true },
      { name: 'dates', kind: 'dateRange', label: 'From and to', required: true },
    ],
    documents: [],
    rules: ['noOverlap'],
    title: (v) => `Foreign visit, ${rangeTitle(v.dates)}`,
  });
  SERVICE_CARDS.push({
    key: 'foreign-visit',
    title: 'Foreign Visit',
    headline: 'Foreign Visit',
    tagline: 'Your visits abroad.',
    icon: 'plane',
    formKey: 'foreign-visit',
    main: 'Apply for a visit',
    pastLabel: 'Add a past visit',
    summary: (r) => `${r.length} visits recorded`,
    strip: (r) => `${r.length} visits recorded.`,
    columns: [
      { key: 'country', header: 'Country', mobile: 'title' },
      { key: 'from', header: 'From', kind: 'date' },
      { key: 'to', header: 'To', kind: 'date' },
      { key: 'status', header: 'Status', kind: 'status' },
      { key: 'source', header: 'Source', kind: 'source' },
    ],
  });
});
afterAll(() => {
  REQUEST_TYPES.pop();
  SERVICE_CARDS.pop();
});

describe('a service card added by config only', () => {
  it('shows on My Services, opens its page and its form', async () => {
    renderApp('/records/services');
    expect(await screen.findByRole('heading', { name: 'Foreign Visit' })).toBeInTheDocument();
    expect(await screen.findByText('0 visits recorded')).toBeInTheDocument();
  });
  it('has a history page and an apply form', async () => {
    renderApp('/records/services/foreign-visit');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Foreign Visit' }),
    ).toBeInTheDocument();
    renderApp('/records/services/foreign-visit/new');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Apply for a visit' }),
    ).toBeInTheDocument();
    renderApp('/records/services/foreign-visit/add-past');
    expect(
      await screen.findByText(/You are adding something that already happened/),
    ).toBeInTheDocument();
  });
  it('adds an approved entry to its own list', async () => {
    resetDb();
    const r = await api.saveRequest({
      type: 'foreign-visit',
      mode: 'apply',
      values: { country: 'Singapore', dates: { from: '05/03/2027', to: '09/03/2027' } },
      attachments: [],
    });
    expect(r.title).toBe('Foreign visit, 5 to 9 March');
    await api.decideRequest(r.id, 'approved');
    const rows = await api.cardRows('foreign-visit');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ country: 'Singapore', status: 'approved', source: 'portal' });
    await waitFor(() => expect(rows[0].from).toBe('2027-03-05'));
  });
});
