import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from './utils';

describe('awards', () => {
  it('groups open and closed awards with the card anatomy', async () => {
    renderApp('/community/awards');
    expect(await screen.findByRole('heading', { name: 'Open to apply (2)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Closed (2)' })).toBeInTheDocument();
    const open = screen.getByRole('heading', { name: 'Open to apply (2)' }).closest('section')!;
    const first = within(open)
      .getAllByRole('heading', { level: 3 })[0]
      .closest('.award-card') as HTMLElement;
    expect(within(first).getByText(/^Closes in \d+ days?$/)).toBeInTheDocument();
    expect(within(first).getByText('Who can apply')).toBeInTheDocument();
    expect(within(first).getByText('Application window')).toBeInTheDocument();
    expect(
      within(first).getByText(/\d{1,2} \w{3} \d{4} to \d{1,2} \w{3} \d{4}/),
    ).toBeInTheDocument();
    expect(
      within(first).getByRole('link', { name: 'Apply on the official site' }),
    ).toBeInTheDocument();
    expect(within(first).getByRole('button', { name: /View details/ })).toBeInTheDocument();
    // The long timeline paragraph is not on the card.
    expect(within(first).queryByText(/Results are announced/)).toBeNull();
    // Closed cards: no apply button, "Next cycle" line when known.
    const closed = screen.getByRole('heading', { name: 'Closed (2)' }).closest('section')!;
    expect(within(closed).queryByRole('link', { name: 'Apply on the official site' })).toBeNull();
    expect(within(closed).getAllByText(/^Next cycle: /).length).toBeGreaterThan(0);
  });
  it('opens the details panel with the full text, and awardees for a closed award', async () => {
    renderApp('/community/awards');
    const closed = (await screen.findByRole('heading', { name: 'Closed (2)' })).closest('section')!;
    await userEvent.click(within(closed).getAllByRole('button', { name: /View details/ })[1]);
    const panel = await screen.findByRole('dialog');
    expect(within(panel).getByText('Eligibility')).toBeInTheDocument();
    expect(within(panel).getByText('Awardees')).toBeInTheDocument();
    expect(within(panel).getByText(/Example Awardee Three/)).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
  it('lists awardees by year with an empty state', async () => {
    renderApp('/community/awards?tab=awardees');
    expect(await screen.findByText('Example Awardee One')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBe(2);
  });
});
